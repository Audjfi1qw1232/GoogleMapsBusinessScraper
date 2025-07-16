import { Client } from '@googlemaps/google-maps-services-js';
import { createObjectCsvWriter } from 'csv-writer';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import israelCitiesData from './data/israelCities.json';

// Load environment variables
dotenv.config();

// Enhanced business interface with more fields
interface Business {
  businessName: string;
  phoneNumber?: string;
  internationalPhone?: string;
  address: string;
  city: string;
  hasWebsite: boolean;
  website?: string;
  rating?: number;
  reviewCount?: number;
  businessType: string;
  placeId: string;
  googleMapsUrl: string;
  whatsappLink?: string;
  businessStatus?: string;
  priceLevel?: string;
  leadScore?: number;
}

// Initialize Google Maps client
const client = new Client({});
const apiKey = process.env.GOOGLE_MAPS_API_KEY || '';

if (!apiKey) {
  console.error('Please set GOOGLE_MAPS_API_KEY in your .env file');
  process.exit(1);
}

// Business types to search for (reduced for demo)
const businessTypes = [
  'restaurant',
  'beauty_salon',
  'dentist',
  'real_estate_agency',
  'car_repair',
];

async function searchBusinessesInCity(cityName: string, businessType: string): Promise<Business[]> {
  const businesses: Business[] = [];
  
  try {
    // Search for businesses
    const searchResponse = await client.textSearch({
      params: {
        query: `${businessType} in ${cityName}, Israel`,
        key: apiKey,
      }
    });

    if (!searchResponse.data.results) {
      return businesses;
    }

    // Get details for each place
    for (const place of searchResponse.data.results) {
      if (!place.place_id) continue;

      try {
        const detailsResponse = await client.placeDetails({
          params: {
            place_id: place.place_id,
            fields: ['name', 'formatted_phone_number', 'international_phone_number', 'formatted_address', 'website', 'rating', 'user_ratings_total', 'types', 'business_status', 'price_level', 'opening_hours'],
            key: apiKey,
          }
        });

        const details = detailsResponse.data.result;
        if (!details) continue;

        // Only add businesses without websites
        if (!details.website) {
          // Calculate lead score
          let leadScore = 0;
          if (!details.website) leadScore += 40;
          if (details.formatted_phone_number) leadScore += 30;
          if (details.rating && details.rating >= 4) leadScore += 10;
          if (details.user_ratings_total && details.user_ratings_total >= 50) leadScore += 10;
          if (details.business_status === 'OPERATIONAL') leadScore += 10;

          // Generate WhatsApp link if phone exists
          let whatsappLink = '';
          if (details.formatted_phone_number) {
            // Remove non-numeric characters and format for WhatsApp
            const cleanPhone = details.formatted_phone_number.replace(/\D/g, '');
            const phoneWithCountry = cleanPhone.startsWith('972') ? cleanPhone : `972${cleanPhone.substring(1)}`;
            whatsappLink = `https://wa.me/${phoneWithCountry}`;
          }

          businesses.push({
            businessName: details.name || 'Unknown',
            phoneNumber: details.formatted_phone_number,
            internationalPhone: details.international_phone_number,
            address: details.formatted_address || '',
            city: cityName,
            hasWebsite: false,
            website: details.website,
            rating: details.rating,
            reviewCount: details.user_ratings_total,
            businessType: businessType,
            placeId: place.place_id,
            googleMapsUrl: `https://maps.google.com/maps/place/?q=place_id:${place.place_id}`,
            whatsappLink,
            businessStatus: details.business_status,
            priceLevel: details.price_level ? '₪'.repeat(details.price_level) : undefined,
            leadScore,
          });
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.error(`Error getting details for place ${place.place_id}:`, error);
      }
    }
  } catch (error) {
    console.error(`Error searching ${businessType} in ${cityName}:`, error);
  }

  return businesses;
}

async function main() {
  console.log('Starting lead generation...');
  
  const allBusinesses: Business[] = [];
  const outputDir = process.env.OUTPUT_DIR || './exports';
  
  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Get all cities from the data
  const cities: string[] = [];
  Object.values(israelCitiesData.regions).forEach(region => {
    region.cities.forEach(city => {
      cities.push(city.name);
    });
  });

  // Limit to first 2 cities for quick demo
  const targetCities = cities.slice(0, 2);
  
  console.log(`Searching in cities: ${targetCities.join(', ')}`);
  console.log(`Business types: ${businessTypes.join(', ')}`);

  // Search each city and business type
  for (const city of targetCities) {
    for (const businessType of businessTypes) {
      console.log(`Searching ${businessType} in ${city}...`);
      const businesses = await searchBusinessesInCity(city, businessType);
      allBusinesses.push(...businesses);
      console.log(`Found ${businesses.length} businesses without websites`);
      
      // Delay between searches
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Save to CSV
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const csvPath = path.join(outputDir, `leads_${timestamp}.csv`);
  
  // Sort by lead score (highest first)
  allBusinesses.sort((a, b) => (b.leadScore || 0) - (a.leadScore || 0));

  const csvWriter = createObjectCsvWriter({
    path: csvPath,
    header: [
      { id: 'leadScore', title: 'Lead Score' },
      { id: 'businessName', title: 'Business Name' },
      { id: 'phoneNumber', title: 'Phone Number' },
      { id: 'whatsappLink', title: 'WhatsApp Link' },
      { id: 'address', title: 'Address' },
      { id: 'city', title: 'City' },
      { id: 'businessType', title: 'Business Type' },
      { id: 'rating', title: 'Rating' },
      { id: 'reviewCount', title: 'Review Count' },
      { id: 'priceLevel', title: 'Price Level' },
      { id: 'businessStatus', title: 'Status' },
      { id: 'googleMapsUrl', title: 'Google Maps URL' },
    ]
  });

  await csvWriter.writeRecords(allBusinesses);
  
  console.log(`\nCompleted! Found ${allBusinesses.length} businesses without websites`);
  console.log(`Results saved to: ${csvPath}`);
  
  // Summary by city
  const citySummary: { [key: string]: number } = {};
  allBusinesses.forEach(business => {
    citySummary[business.city] = (citySummary[business.city] || 0) + 1;
  });
  
  console.log('\nSummary by city:');
  Object.entries(citySummary).forEach(([city, count]) => {
    console.log(`  ${city}: ${count} leads`);
  });
}

// Run the script
main().catch(console.error);