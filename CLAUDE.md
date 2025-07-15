# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Google Maps business scraper designed to collect information about businesses in Israel that lack online presence (websites, social media). The scraper extracts business details from Google Maps and stores them in CSV format for further analysis.

## Core Technologies

- **Language**: TypeScript/Node.js
- **Web Scraping**: Playwright (headless browser automation)
- **Data Storage**: CSV files with incremental saving
- **Concurrency**: Worker threads for parallel scraping
- **Build Tool**: npm/pnpm

## Key Commands

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run the scraper
npm run scrape

# Run with specific city
npm run scrape -- --city "Tel Aviv"

# Run with business type filter
npm run scrape -- --type "cafe"

# Development mode with watch
npm run dev

# Run tests
npm test

# Lint code
npm run lint

# Type check
npm run typecheck

# Format code
npm run format
```

## Architecture Overview

### Core Components

1. **Scraper Engine** (`src/core/scraper.ts`)
   - Manages Playwright browser instances
   - Handles page navigation and element extraction
   - Implements retry logic and error handling

2. **Location Manager** (`src/services/locationManager.ts`)
   - Manages Israeli cities and regions
   - Generates search queries for different areas
   - Handles coordinate-based searches

3. **Data Extractor** (`src/services/dataExtractor.ts`)
   - Extracts business details from Google Maps pages
   - Parses business hours, contact info, reviews
   - Downloads and processes images

4. **Storage Manager** (`src/services/storageManager.ts`)
   - Handles CSV file operations
   - Implements incremental saving after each successful scrape
   - Manages data deduplication

5. **Worker Pool** (`src/workers/scraperWorker.ts`)
   - Manages concurrent scraping tasks
   - Distributes work across multiple browser instances
   - Handles worker lifecycle and error recovery

### Data Flow

1. **Input** → Location Manager generates search queries
2. **Processing** → Scraper Engine navigates and extracts data
3. **Extraction** → Data Extractor parses business information
4. **Storage** → Storage Manager saves to CSV incrementally
5. **Concurrency** → Worker Pool manages parallel execution

## Google Maps Scraping Strategy

### Selectors and Elements

The scraper targets these key elements:
- Business cards in search results
- Business detail panels
- Review sections
- Image galleries
- Contact information blocks

### API Alternatives

While Google Maps API exists, it has strict rate limits and costs. The scraper uses browser automation to:
- Avoid API rate limits
- Access all publicly visible data
- Handle dynamic content loading
- Extract visual elements (images, logos)

## Data Schema

CSV columns include:
- business_name
- address
- phone_number
- website
- business_type
- rating
- review_count
- business_hours
- latitude
- longitude
- image_urls
- google_maps_url
- last_updated
- has_website (boolean)
- social_media_links

## Error Handling

- Exponential backoff for rate limiting
- Screenshot capture on errors
- Detailed error logging
- Automatic recovery and resume capabilities
- Progress tracking and checkpoint system

## Performance Optimizations

- Browser context reuse
- Intelligent scrolling for lazy-loaded content
- Request interception to block unnecessary resources
- Memory management for long-running scrapes
- Batch processing for database writes

## Compliance and Ethics

- Respects robots.txt where applicable
- Implements reasonable delays between requests
- User-agent rotation
- Proxy support for distributed scraping
- Focus on publicly available information only