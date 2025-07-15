export interface BusinessHours {
  monday?: string;
  tuesday?: string;
  wednesday?: string;
  thursday?: string;
  friday?: string;
  saturday?: string;
  sunday?: string;
}

export interface BusinessLocation {
  latitude?: number;
  longitude?: number;
  plusCode?: string;
  fullAddress: string;
  street?: string;
  city: string;
  state?: string;
  country: string;
  postalCode?: string;
}

export interface BusinessContact {
  phoneNumber?: string;
  alternativePhone?: string;
  website?: string;
  email?: string;
  whatsapp?: string;
}

export interface BusinessSocialMedia {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  linkedin?: string;
  youtube?: string;
  tiktok?: string;
}

export interface BusinessMetrics {
  rating?: number;
  reviewCount?: number;
  priceLevel?: string; // "$", "$$", "$$$", "$$$$"
  popularTimes?: Record<string, any>;
  responseRate?: number;
  responseTime?: string;
}

export interface BusinessAttributes {
  hasWebsite: boolean;
  hasOnlineOrdering?: boolean;
  hasDelivery?: boolean;
  hasTakeout?: boolean;
  hasDineIn?: boolean;
  wheelchairAccessible?: boolean;
  hasWifi?: boolean;
  hasParking?: boolean;
  acceptsCreditCards?: boolean;
  acceptsCash?: boolean;
  hasReservations?: boolean;
  goodForGroups?: boolean;
  goodForKids?: boolean;
  hasOutdoorSeating?: boolean;
  servesVegetarian?: boolean;
  servesVegan?: boolean;
  servesKosher?: boolean;
}

export interface BusinessImages {
  logoUrl?: string;
  coverPhotoUrl?: string;
  photoUrls: string[];
  menuUrls?: string[];
  streetViewUrl?: string;
}

export interface Business {
  // Identifiers
  id: string;
  googleMapsId?: string;
  placeId?: string;

  // Basic Information
  businessName: string;
  businessNameEnglish?: string;
  businessNameHebrew?: string;
  description?: string;
  businessType: string;
  businessCategories: string[];

  // Location
  location: BusinessLocation;

  // Contact Information
  contact: BusinessContact;

  // Digital Presence
  socialMedia: BusinessSocialMedia;

  // Business Metrics
  metrics: BusinessMetrics;

  // Business Attributes
  attributes: BusinessAttributes;

  // Operating Information
  businessHours?: BusinessHours;
  isOpen24Hours?: boolean;
  temporarilyClosed?: boolean;
  permanentlyClosed?: boolean;
  openingDate?: Date;

  // Images and Media
  images: BusinessImages;

  // Metadata
  googleMapsUrl: string;
  lastUpdated: Date;
  scrapedAt: Date;
  dataQualityScore?: number;
  dataCompleteness?: number;

  // Additional Fields
  ownerName?: string;
  ownerResponse?: string;
  servicesOffered?: string[];
  paymentMethods?: string[];
  languages?: string[];
  certifications?: string[];
  awards?: string[];
  yearEstablished?: number;
}

export interface ScrapeResult {
  success: boolean;
  business?: Business;
  error?: string;
  retryable?: boolean;
  duration?: number;
}

export interface ScrapeBatch {
  city: string;
  businessType: string;
  results: ScrapeResult[];
  startTime: Date;
  endTime?: Date;
  totalBusinesses: number;
  successCount: number;
  failureCount: number;
}

// Helper function to create an empty business object
export const createEmptyBusiness = (): Partial<Business> => ({
  businessName: '',
  businessType: '',
  businessCategories: [],
  location: {
    fullAddress: '',
    city: '',
    country: 'Israel',
  },
  contact: {},
  socialMedia: {},
  metrics: {},
  attributes: {
    hasWebsite: false,
  },
  images: {
    photoUrls: [],
  },
  googleMapsUrl: '',
  lastUpdated: new Date(),
  scrapedAt: new Date(),
});

// Helper function to calculate data completeness
export const calculateDataCompleteness = (business: Business): number => {
  const fields = [
    business.businessName,
    business.location.fullAddress,
    business.contact.phoneNumber,
    business.contact.website,
    business.metrics.rating,
    business.metrics.reviewCount,
    business.businessHours,
    business.images.logoUrl,
    business.description,
  ];

  const filledFields = fields.filter(field => field !== undefined && field !== null && field !== '').length;
  return Math.round((filledFields / fields.length) * 100);
};