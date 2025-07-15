# Product Requirements Document: Google Maps Business Scraper

## Executive Summary

A web scraping solution designed to identify and collect information about Israeli businesses on Google Maps that lack digital presence (websites, social media). The tool will help identify market opportunities for digital services and create a comprehensive database of offline businesses.

## Problem Statement

Many businesses in Israel maintain a Google Maps presence but lack:
- Company websites
- Social media profiles
- Digital marketing presence
- Online ordering/booking systems

This creates an opportunity to identify and reach out to these businesses with digital transformation services.

## Goals & Objectives

### Primary Goals
1. Create a comprehensive database of Israeli businesses without websites
2. Enable efficient outreach to businesses needing digital services
3. Provide market intelligence on digital adoption gaps

### Success Metrics
- Number of businesses identified without websites
- Data accuracy rate (>95%)
- Scraping efficiency (businesses/hour)
- Geographic coverage of Israeli cities

## Target Users

1. **Digital Marketing Agencies** - Identify potential clients
2. **Web Development Companies** - Find businesses needing websites
3. **Business Consultants** - Market research and outreach
4. **SaaS Providers** - Target businesses for digital tools

## Functional Requirements

### Core Features

#### 1. Geographic Targeting
- **City-based searching**: Target specific Israeli cities
- **Region filtering**: Northern, Central, Southern districts
- **Radius-based search**: Search within X km of coordinates
- **Neighborhood granularity**: Target specific areas

#### 2. Business Type Filtering
- **Category selection**: Restaurants, cafes, retail, services, etc.
- **Custom keywords**: User-defined search terms
- **Industry classification**: Standard business classifications
- **Multi-category search**: Combine multiple business types

#### 3. Data Extraction
- **Basic Information**:
  - Business name (Hebrew and English)
  - Full address
  - Phone numbers (primary and secondary)
  - Business hours (including special hours)
  - Google Maps URL
  
- **Digital Presence**:
  - Website URL (or lack thereof)
  - Social media links
  - Email addresses
  - Online ordering/booking links
  
- **Business Metrics**:
  - Google rating (1-5 stars)
  - Number of reviews
  - Price level (₪-₪₪₪₪)
  - Popular times data
  - Years in business
  
- **Visual Assets**:
  - Business photos URLs
  - Logo/profile image
  - Street view imagery
  
- **Additional Data**:
  - Business description
  - Services offered
  - Accessibility features
  - Payment methods accepted
  - COVID-19 updates

#### 4. Data Storage & Export
- **CSV Export**: 
  - UTF-8 encoding for Hebrew support
  - Customizable column selection
  - Multiple export formats
  
- **Incremental Saving**:
  - Save after each successful scrape
  - Resume capability from last checkpoint
  - Duplicate detection and handling
  
- **Data Organization**:
  - Separate files by city/region
  - Date-stamped exports
  - Backup mechanisms

#### 5. Performance & Scalability
- **Concurrent Scraping**:
  - Multiple browser instances
  - Configurable worker threads (1-10)
  - Resource optimization
  
- **Rate Limiting**:
  - Adaptive delays
  - Request throttling
  - Automatic backoff
  
- **Progress Tracking**:
  - Real-time statistics
  - ETA calculations
  - Success/failure rates

### Advanced Features

#### 1. Intelligence Layer
- **Website Detection**: Advanced algorithms to verify website absence
- **Business Verification**: Cross-reference with business registries
- **Contact Enrichment**: Find additional contact methods
- **Competitor Analysis**: Identify similar businesses with websites

#### 2. Filtering & Analysis
- **No-Website Filter**: Exclusively find businesses without sites
- **Outdated Website Detection**: Identify old/broken sites
- **Social Media Gap Analysis**: Find businesses missing key platforms
- **Opening Soon Detection**: Identify new businesses

#### 3. Export & Integration
- **API Endpoint**: REST API for data access
- **Webhook Support**: Real-time data streaming
- **CRM Integration**: Direct export to popular CRMs
- **Report Generation**: PDF reports with statistics

## Technical Requirements

### Technology Stack
- **Runtime**: Node.js 18+ with TypeScript
- **Web Scraping**: Playwright (Chromium) with Stealth plugins
- **Anti-Detection**: Playwright-extra, puppeteer-extra-plugin-stealth
- **Proxy Management**: Proxy-chain for rotation
- **API Integration**: Google Maps API for hybrid approach
- **Data Processing**: CSV-parser, ExcelJS
- **Concurrency**: Worker Threads
- **CLI Framework**: Commander.js
- **Logging**: Winston
- **Testing**: Jest + Playwright Test

### Performance Requirements
- Scrape 100+ businesses per hour
- Handle 10,000+ businesses per session
- Memory usage < 2GB per worker
- Error rate < 5%
- 99% uptime for long-running scrapes

### Security & Compliance
- No personal data collection (GDPR compliance)
- Respect robots.txt and rate limits
- User-agent rotation
- Proxy support for distributed scraping
- Secure credential storage
- Anti-detection measures (stealth mode)
- Human-like behavior simulation
- Adaptive rate limiting based on detection

## User Interface

### CLI Interface
```bash
# Basic usage
npm run scrape --city "Tel Aviv" --type "restaurant" --no-website

# Advanced usage
npm run scrape \
  --region "Central" \
  --types "cafe,restaurant,bar" \
  --workers 5 \
  --output "./exports/tel-aviv-food.csv" \
  --limit 1000
```

### Configuration File
```json
{
  "regions": ["Central", "North"],
  "cities": ["Tel Aviv", "Haifa"],
  "businessTypes": ["restaurant", "cafe"],
  "filters": {
    "noWebsite": true,
    "minRating": 4.0,
    "minReviews": 10
  },
  "export": {
    "format": "csv",
    "incrementalSave": true,
    "deduplication": true
  }
}
```

### Web Dashboard (Future)
- Real-time scraping progress
- Data visualization
- Export management
- Scheduling interface

## Implementation Phases

### Phase 1: MVP (Week 1-2)
- Basic Playwright scraper
- Single city search
- CSV export
- Core data fields extraction

### Phase 2: Scale (Week 3-4)
- Multi-threading support
- All Israeli cities
- Advanced filtering
- Progress tracking

### Phase 3: Intelligence (Week 5-6)
- Website verification
- Data enrichment
- API development
- Performance optimization

### Phase 4: Enterprise (Future)
- Web dashboard
- CRM integrations
- Automated reports
- SaaS offering

## Success Criteria

1. **Accuracy**: 95%+ data accuracy
2. **Coverage**: All major Israeli cities
3. **Performance**: 1000+ businesses/hour with 10 workers
4. **Reliability**: <1% failure rate
5. **Usability**: <5 minute setup time

## Hybrid Approach: API + Scraping

### Strategy
1. **Primary Method**: Web scraping for comprehensive data
2. **Fallback**: Google Maps API for critical data when blocked
3. **Cost Optimization**: Use free API tier ($200/month) strategically

### API Usage Scenarios
- When scraping is blocked/detected
- For business verification
- For precise location data
- For real-time updates

### Cost Analysis
- **Scraping Only**: $0 (development + infrastructure costs)
- **API Only**: ~$1,700 per 100K businesses
- **Hybrid Approach**: ~$50-200/month (using API as fallback)

## Anti-Detection Strategy

### Detection Indicators
- Unusual traffic patterns
- Missing browser fingerprints
- Automated behavior patterns
- High request frequency

### Mitigation Techniques
1. **Stealth Plugins**: Hide automation indicators
2. **Human Simulation**: Mouse movements, scrolling, delays
3. **Proxy Rotation**: Distribute requests across IPs
4. **Adaptive Delays**: Increase delays when detected
5. **Browser Fingerprinting**: Randomize viewport, user agent

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|---------|------------|
| Bot detection | High | Stealth mode, proxy rotation, human behavior |
| Google Maps changes | High | Flexible selectors, regular updates |
| Rate limiting | Medium | Adaptive delays, proxy rotation |
| API costs | Medium | Hybrid approach, careful usage monitoring |
| Legal concerns | Medium | Public data only, compliance checks |
| Data accuracy | Medium | Validation layers, manual QA |
| Performance issues | Low | Profiling, optimization, caching |

## Future Enhancements

1. **AI Integration**: GPT-based business categorization
2. **Mobile App**: On-the-go business discovery
3. **Lead Scoring**: Rank businesses by opportunity
4. **Automated Outreach**: Email/SMS campaign integration
5. **Market Analytics**: Industry insights and trends
6. **Multi-country Support**: Expand beyond Israel