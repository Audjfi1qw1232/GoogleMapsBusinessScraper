# Technical Implementation Plan

## Project Structure

```
GoogleMapsBusinessScraper/
├── src/
│   ├── core/
│   │   ├── scraper.ts          # Main scraper engine
│   │   ├── browser.ts          # Browser management
│   │   └── config.ts           # Configuration management
│   ├── services/
│   │   ├── locationManager.ts  # Location/city management
│   │   ├── dataExtractor.ts    # Data extraction logic
│   │   ├── storageManager.ts   # CSV/data persistence
│   │   ├── filterService.ts    # Business filtering
│   │   └── validationService.ts # Data validation
│   ├── workers/
│   │   ├── scraperWorker.ts    # Worker thread implementation
│   │   └── workerPool.ts       # Worker pool management
│   ├── models/
│   │   ├── business.ts         # Business data model
│   │   ├── location.ts         # Location model
│   │   └── scrapeResult.ts     # Result types
│   ├── utils/
│   │   ├── logger.ts           # Winston logger setup
│   │   ├── retry.ts            # Retry logic
│   │   ├── delay.ts            # Smart delay implementation
│   │   └── selectors.ts        # Google Maps selectors
│   ├── data/
│   │   └── israelCities.json   # Israeli cities database
│   ├── cli/
│   │   └── index.ts            # CLI interface
│   └── index.ts                # Main entry point
├── tests/
│   ├── unit/                   # Unit tests
│   ├── integration/            # Integration tests
│   └── fixtures/               # Test data
├── exports/                    # CSV export directory
├── logs/                       # Application logs
├── docs/                       # Additional documentation
├── .env.example               # Environment variables template
├── package.json               # Dependencies and scripts
├── tsconfig.json              # TypeScript configuration
├── playwright.config.ts       # Playwright configuration
├── jest.config.js             # Jest configuration
└── README.md                  # Project documentation
```

## Core Libraries & Dependencies

### Production Dependencies
```json
{
  "dependencies": {
    "playwright": "^1.40.0",           // Web scraping
    "playwright-extra": "^4.3.6",      // Enhanced playwright
    "puppeteer-extra-plugin-stealth": "^2.11.2", // Anti-detection
    "commander": "^11.0.0",            // CLI framework
    "csv-writer": "^1.6.0",            // CSV writing
    "csv-parse": "^5.5.0",             // CSV parsing
    "winston": "^3.11.0",              // Logging
    "dotenv": "^16.3.1",               // Environment config
    "p-queue": "^7.4.1",               // Queue management
    "p-retry": "^5.1.2",               // Retry logic
    "joi": "^17.11.0",                 // Data validation
    "lodash": "^4.17.21",              // Utility functions
    "dayjs": "^1.11.10",               // Date handling
    "chalk": "^5.3.0",                 // Terminal colors
    "ora": "^7.0.1",                   // Terminal spinners
    "workerpool": "^9.0.0",            // Worker threads
    "proxy-chain": "^2.4.0",           // Proxy rotation
    "user-agents": "^1.1.0",           // User agent rotation
    "@googlemaps/google-maps-services-js": "^3.3.0" // Google Maps API
  }
}
```

### Development Dependencies
```json
{
  "devDependencies": {
    "@types/node": "^20.10.0",
    "typescript": "^5.3.0",
    "@typescript-eslint/eslint-plugin": "^6.13.0",
    "@typescript-eslint/parser": "^6.13.0",
    "eslint": "^8.55.0",
    "prettier": "^3.1.0",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.0",
    "ts-jest": "^29.1.0",
    "nodemon": "^3.0.0",
    "ts-node": "^10.9.0",
    "@playwright/test": "^1.40.0"
  }
}
```

## Implementation Details

### 1. Scraper Core (src/core/scraper.ts)

```typescript
interface ScraperOptions {
  headless: boolean;
  workers: number;
  timeout: number;
  retries: number;
  delayRange: [number, number];
  viewport: { width: number; height: number };
  userAgent?: string;
  proxy?: string;
  useAPI: boolean;
  apiKey?: string;
  stealthMode: boolean;
}

class GoogleMapsScraper {
  private browser: Browser;
  private stealthPlugin: any;
  private proxyChain: any;
  private googleMapsClient?: any;
  
  // Initialize Playwright with stealth
  async initialize() {
    const { chromium } = require('playwright-extra');
    const StealthPlugin = require('puppeteer-extra-plugin-stealth');
    
    chromium.use(StealthPlugin());
    
    this.browser = await chromium.launch({
      headless: this.options.headless,
      args: this.getStealthArgs()
    });
  }
  
  // Anti-detection browser args
  private getStealthArgs(): string[] {
    return [
      '--disable-blink-features=AutomationControlled',
      '--disable-features=IsolateOrigins,site-per-process',
      '--disable-site-isolation-trials',
      '--disable-web-security',
      '--disable-features=BlockInsecurePrivateNetworkRequests'
    ];
  }
  
  // Hybrid approach: API + Scraping
  async getBusinessData(query: string) {
    if (this.options.useAPI && this.googleMapsClient) {
      try {
        return await this.getViaAPI(query);
      } catch (error) {
        console.log('API failed, falling back to scraping');
      }
    }
    return await this.getViaScraping(query);
  }
}
```

### 2. Data Extraction Strategy

#### Selectors to Monitor
```typescript
const SELECTORS = {
  // Search Results
  businessCard: '[role="article"]',
  businessName: 'h3[class*="fontHeadlineSmall"]',
  businessRating: 'span[role="img"][aria-label*="stars"]',
  businessAddress: 'span[class*="fontBodyMedium"]',
  
  // Business Details Panel
  detailsPanel: '[role="main"][aria-label*="Business"]',
  phoneNumber: 'button[data-item-id*="phone"]',
  website: 'a[data-item-id="authority"]',
  businessHours: 'div[aria-label*="Hours"]',
  
  // Images
  photoGallery: 'div[class*="photo-viewer"]',
  businessImages: 'img[class*="gallery"]',
  
  // Reviews
  reviewsSection: 'div[class*="reviews"]',
  reviewCount: 'button[aria-label*="reviews"]'
};
```

#### Extraction Flow
1. **Search Phase**
   - Navigate to maps.google.com
   - Search for "{business_type} in {city}, Israel"
   - Wait for results to load
   - Scroll to load all results

2. **Data Collection Phase**
   - Click each business card
   - Wait for details panel
   - Extract all available data
   - Check for website presence
   - Download image URLs

3. **Validation Phase**
   - Verify required fields
   - Validate phone formats
   - Check address completeness
   - Ensure data quality

### 3. Multi-threading Architecture

```typescript
// Worker Pool Implementation
class ScraperWorkerPool {
  private workers: Worker[] = [];
  private taskQueue: Queue;
  
  async initialize(workerCount: number) {
    // Create worker threads
    // Setup communication channels
    // Implement load balancing
  }
  
  async distributeWork(tasks: ScrapeTask[]) {
    // Distribute tasks among workers
    // Handle worker failures
    // Aggregate results
  }
}
```

### 4. Storage Strategy

#### CSV Schema
```typescript
interface BusinessRecord {
  // Identifiers
  id: string;                    // Unique ID
  googleMapsId?: string;         // Google's place ID
  
  // Basic Info
  businessName: string;
  businessNameEnglish?: string;
  address: string;
  city: string;
  postalCode?: string;
  
  // Contact
  phoneNumber?: string;
  alternativePhone?: string;
  website?: string;
  email?: string;
  
  // Digital Presence
  hasWebsite: boolean;
  facebookUrl?: string;
  instagramUrl?: string;
  linkedinUrl?: string;
  
  // Business Details
  businessType: string;
  businessCategories: string[];
  description?: string;
  
  // Metrics
  rating?: number;
  reviewCount?: number;
  priceLevel?: string;
  
  // Operations
  businessHours?: Record<string, string>;
  isOpen24Hours?: boolean;
  temporarilyClosed?: boolean;
  
  // Location
  latitude?: number;
  longitude?: number;
  plusCode?: string;
  
  // Media
  imageUrls: string[];
  logoUrl?: string;
  coverPhotoUrl?: string;
  
  // Metadata
  googleMapsUrl: string;
  lastUpdated: Date;
  dataQualityScore: number;
}
```

#### Incremental Save Implementation
```typescript
class IncrementalCSVWriter {
  private buffer: BusinessRecord[] = [];
  private bufferSize = 10;
  
  async addRecord(record: BusinessRecord) {
    this.buffer.push(record);
    
    if (this.buffer.length >= this.bufferSize) {
      await this.flush();
    }
  }
  
  async flush() {
    // Write buffer to CSV
    // Clear buffer
    // Update progress file
  }
}
```

### 5. Error Handling & Recovery

```typescript
class ErrorHandler {
  async handleError(error: Error, context: ScrapeContext) {
    const errorType = this.categorizeError(error);
    
    switch (errorType) {
      case ErrorType.RATE_LIMIT:
      case ErrorType.BOT_DETECTION:
        await this.handleDetection(context);
        break;
      case ErrorType.SELECTOR_NOT_FOUND:
        await this.updateSelectors();
        break;
      case ErrorType.NETWORK_ERROR:
        await this.rotateProxy();
        break;
    }
  }
  
  private async handleDetection(context: ScrapeContext) {
    // Increase delays
    context.delayRange = [context.delayRange[0] * 2, context.delayRange[1] * 2];
    // Rotate proxy
    await this.rotateProxy();
    // Change user agent
    context.userAgent = this.getRandomUserAgent();
    // Add human-like behavior
    await this.simulateHumanBehavior(context.page);
  }
  
  private async simulateHumanBehavior(page: Page) {
    // Random mouse movements
    await page.mouse.move(
      Math.random() * 800 + 100,
      Math.random() * 600 + 100
    );
    // Random scrolling
    await page.evaluate(() => {
      window.scrollTo(0, Math.random() * document.body.scrollHeight);
    });
    // Random delays
    await page.waitForTimeout(Math.random() * 3000 + 2000);
  }
}

// Error Types
enum ErrorType {
  RATE_LIMIT = 'RATE_LIMIT',
  SELECTOR_NOT_FOUND = 'SELECTOR_NOT_FOUND',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  CAPTCHA = 'CAPTCHA',
  BOT_DETECTION = 'BOT_DETECTION'
}
```

### 6. Performance Optimizations

#### Request Interception
```typescript
await page.route('**/*', (route) => {
  const resourceType = route.request().resourceType();
  
  // Block unnecessary resources
  if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
    return route.abort();
  }
  
  // Only load images when needed
  if (resourceType === 'image' && !context.downloadImages) {
    return route.abort();
  }
  
  route.continue();
});
```

#### Smart Scrolling
```typescript
async function smartScroll(page: Page) {
  let previousHeight = 0;
  let currentHeight = await page.evaluate(() => document.body.scrollHeight);
  
  while (previousHeight !== currentHeight) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);
    
    previousHeight = currentHeight;
    currentHeight = await page.evaluate(() => document.body.scrollHeight);
  }
}
```

### 7. Anti-Detection Strategies

```typescript
class AntiDetectionService {
  private userAgents: string[];
  private viewports: Array<{width: number, height: number}>;
  private proxies: string[];
  
  constructor() {
    this.userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ];
    
    this.viewports = [
      {width: 1920, height: 1080},
      {width: 1366, height: 768},
      {width: 1440, height: 900},
      {width: 1536, height: 864}
    ];
  }
  
  async setupPage(page: Page) {
    // Randomize viewport
    const viewport = this.viewports[Math.floor(Math.random() * this.viewports.length)];
    await page.setViewportSize(viewport);
    
    // Set random user agent
    const userAgent = this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
    await page.setExtraHTTPHeaders({
      'user-agent': userAgent
    });
    
    // Remove automation indicators
    await page.addInitScript(() => {
      // Override navigator properties
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined
      });
      
      // Override plugins
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5]
      });
      
      // Override permissions
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) => (
        parameters.name === 'notifications' ?
          Promise.resolve({ state: Notification.permission }) :
          originalQuery(parameters)
      );
    });
  }
  
  async humanDelay(min: number = 1000, max: number = 3000) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    await new Promise(resolve => setTimeout(resolve, delay));
  }
}
```

### 8. Proxy Management

```typescript
class ProxyManager {
  private proxies: ProxyConfig[];
  private currentIndex: number = 0;
  
  async rotateProxy(): Promise<ProxyConfig> {
    this.currentIndex = (this.currentIndex + 1) % this.proxies.length;
    return this.proxies[this.currentIndex];
  }
  
  async validateProxy(proxy: ProxyConfig): Promise<boolean> {
    try {
      // Test proxy connection
      const response = await fetch('https://api.ipify.org?format=json', {
        agent: new HttpsProxyAgent(proxy.url)
      });
      return response.ok;
    } catch {
      return false;
    }
  }
  
  async getHealthyProxy(): Promise<ProxyConfig> {
    for (const proxy of this.proxies) {
      if (await this.validateProxy(proxy)) {
        return proxy;
      }
    }
    throw new Error('No healthy proxies available');
  }
}
```

### 9. CLI Implementation

```typescript
#!/usr/bin/env node
import { Command } from 'commander';

const program = new Command();

program
  .name('google-maps-scraper')
  .description('Scrape business data from Google Maps')
  .version('1.0.0');

program
  .command('scrape')
  .option('-c, --city <city>', 'Target city')
  .option('-r, --region <region>', 'Target region')
  .option('-t, --type <type>', 'Business type')
  .option('--types <types>', 'Comma-separated business types')
  .option('-w, --workers <number>', 'Number of workers', '3')
  .option('-o, --output <path>', 'Output file path')
  .option('--no-website', 'Only businesses without websites')
  .option('--limit <number>', 'Maximum results')
  .option('--resume', 'Resume from last checkpoint')
  .action(async (options) => {
    // Initialize scraper
    // Validate options
    // Start scraping
    // Show progress
  });
```

## Testing Strategy

### Unit Tests
- Selector validation
- Data extraction functions
- CSV writing logic
- Filter implementations

### Integration Tests
- Full scraping flow
- Worker communication
- Error recovery
- Resume functionality

### E2E Tests
- Complete city scrape
- Multi-worker scenarios
- Large dataset handling
- Network failure recovery

## Deployment Considerations

### Environment Variables
```env
# Scraping Configuration
HEADLESS=true
DEFAULT_WORKERS=3
TIMEOUT=30000
MAX_RETRIES=3

# Rate Limiting
MIN_DELAY=1000
MAX_DELAY=3000
RATE_LIMIT_PAUSE=60000

# Storage
EXPORT_PATH=./exports
BUFFER_SIZE=10
BACKUP_ENABLED=true

# Proxy Configuration (Optional)
PROXY_URL=
PROXY_USERNAME=
PROXY_PASSWORD=

# Logging
LOG_LEVEL=info
LOG_FILE_PATH=./logs
```

### Docker Support
```dockerfile
FROM node:18-slim

# Install Playwright dependencies
RUN npx playwright install-deps chromium

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .
RUN npm run build

CMD ["npm", "start"]
```

## Monitoring & Logging

### Metrics to Track
- Scraping rate (businesses/hour)
- Success/failure ratio
- Average extraction time
- Memory usage per worker
- Network requests count
- Error distribution

### Log Format
```typescript
logger.info('Business scraped', {
  businessId: business.id,
  name: business.businessName,
  hasWebsite: business.hasWebsite,
  city: business.city,
  duration: extractionTime,
  worker: workerId
});
```

## Future Improvements

1. **Machine Learning Integration**
   - Business category prediction
   - Data quality scoring
   - Duplicate detection

2. **Advanced Features**
   - GraphQL API
   - Real-time websocket updates
   - Scheduled scraping
   - Data enrichment APIs

3. **Performance Enhancements**
   - Redis caching
   - Database storage option
   - Distributed scraping
   - GPU acceleration for image processing

4. **User Experience**
   - Web dashboard
   - Mobile app
   - Email notifications
   - Slack integration