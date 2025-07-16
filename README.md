# Google Maps Lead Finder 🎯

Simple tool to find Israeli businesses without websites using Google Maps API.

## Setup

1. **Install dependencies**
```bash
npm install
```

2. **Add your Google Maps API key to `.env`**
```
GOOGLE_MAPS_API_KEY=your_api_key_here
```

3. **Run**
```bash
npm run dev
```

## What it does

- Searches for businesses in Israeli cities
- Finds businesses WITHOUT websites
- Exports to CSV with contact info
- Creates WhatsApp links automatically

## Output

Results saved to: `exports/leads_TIMESTAMP.csv`

Includes:
- Business name & type
- Address & city
- Phone number
- Rating & reviews
- Lead score (0-100)
- WhatsApp link

## Business Types Searched

- Restaurants, cafes, bars
- Stores, shops
- Beauty salons, spas, gyms
- Doctors, dentists, clinics
- Real estate, lawyers
- Plumbers, electricians
- And more...

That's it! Simple and effective lead generation.