import { Page, BrowserContext } from 'playwright';
import { v4 as uuidv4 } from 'uuid';
import config from './config';
import { BrowserManager } from './browser';
import logger from '../utils/logger';
import { SELECTORS } from '../utils/selectors';
import { AntiDetectionService } from '../services/antiDetectionService';
import { Business, ScrapeResult, createEmptyBusiness } from '../models/business';

export interface ScraperOptions {
  headless?: boolean;
  workers?: number;
  timeout?: number;
  maxRetries?: number;
  proxy?: {
    server: string;
    username?: string;
    password?: string;
  };
}

export class GoogleMapsScraper {
  private browserManager: BrowserManager;
  private antiDetection: AntiDetectionService;
  private options: ScraperOptions;
  private context: BrowserContext | null = null;
  private currentPage: Page | null = null;

  constructor(options: ScraperOptions = {}) {
    this.browserManager = new BrowserManager();
    this.antiDetection = new AntiDetectionService();
    this.options = {
      headless: options.headless ?? config.scraping.headless,
      workers: options.workers ?? config.scraping.defaultWorkers,
      timeout: options.timeout ?? config.scraping.timeout,
      maxRetries: options.maxRetries ?? config.scraping.maxRetries,
      proxy: options.proxy,
    };
  }

  /**
   * Initialize the scraper
   */
  async initialize(): Promise<void> {
    logger.info('Initializing Google Maps scraper');
    
    await this.browserManager.launch({
      headless: this.options.headless,
      proxy: this.options.proxy,
    });

    this.context = await this.browserManager.createContext('main');
  }

  /**
   * Search for businesses on Google Maps
   */
  async searchBusinesses(
    query: string,
    location: string,
    limit: number = 20
  ): Promise<ScrapeResult[]> {
    const results: ScrapeResult[] = [];
    const startTime = Date.now();

    try {
      logger.info('Starting business search', { query, location, limit });

      // Create new page for search
      const page = await this.browserManager.createPage(this.context!);
      this.currentPage = page;

      // Navigate to Google Maps
      await page.goto('https://maps.google.com', {
        waitUntil: 'networkidle',
        timeout: this.options.timeout,
      });

      // Apply human-like behavior
      await this.antiDetection.simulateHumanBehavior(page);

      // Perform search
      await this.performSearch(page, query, location);

      // Wait for results
      await this.waitForSearchResults(page);

      // Extract business cards
      const businessCards = await this.extractBusinessCards(page, limit);

      // Process each business card
      for (const [index, card] of businessCards.entries()) {
        try {
          logger.debug(`Processing business ${index + 1}/${businessCards.length}`);
          
          // Apply delay between businesses
          if (index > 0) {
            await this.antiDetection.humanDelay(
              config.rateLimiting.minDelay,
              config.rateLimiting.maxDelay
            );
          }

          // Extract business details
          const result = await this.extractBusinessDetails(page, card);
          results.push(result);

          // Log progress
          if ((index + 1) % 5 === 0) {
            logger.info(`Processed ${index + 1}/${businessCards.length} businesses`);
          }
        } catch (error) {
          logger.error('Failed to process business card', { error, index });
          results.push({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            retryable: true,
          });
        }
      }

      const duration = Date.now() - startTime;
      logger.info('Business search completed', {
        query,
        location,
        found: results.length,
        duration,
        successRate: `${(results.filter(r => r.success).length / results.length * 100).toFixed(2)}%`,
      });

      await page.close();
      this.currentPage = null;

      return results;
    } catch (error) {
      logger.error('Search failed', { error, query, location });
      throw error;
    }
  }

  /**
   * Perform search on Google Maps
   */
  private async performSearch(page: Page, query: string, location: string): Promise<void> {
    const searchQuery = `${query} in ${location}`;
    
    // Click on search box
    await page.click(SELECTORS.search.searchBox);
    
    // Clear existing text
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Delete');
    
    // Type search query with human-like speed
    await page.type(SELECTORS.search.searchBox, searchQuery, { delay: 100 });
    
    // Press Enter
    await page.keyboard.press('Enter');
    
    logger.debug('Search performed', { searchQuery });
  }

  /**
   * Wait for search results to load
   */
  private async waitForSearchResults(page: Page): Promise<void> {
    try {
      await page.waitForSelector(SELECTORS.searchResults.businessCard, {
        timeout: 15000,
      });
      
      // Wait for results to stabilize
      await page.waitForTimeout(2000);
      
      // Scroll to load more results
      await this.scrollResults(page);
    } catch (error) {
      // Check if no results found
      const noResults = await page.$(SELECTORS.search.noResultsMessage);
      if (noResults) {
        throw new Error('No results found for search query');
      }
      throw error;
    }
  }

  /**
   * Scroll through results to load all businesses
   */
  private async scrollResults(page: Page): Promise<void> {
    const resultsContainer = await page.$(SELECTORS.search.resultsContainer);
    if (!resultsContainer) return;

    let previousHeight = 0;
    let currentHeight = await resultsContainer.evaluate(el => el.scrollHeight);
    let scrollAttempts = 0;
    const maxScrollAttempts = 10;

    while (previousHeight !== currentHeight && scrollAttempts < maxScrollAttempts) {
      previousHeight = currentHeight;
      
      // Scroll down
      await resultsContainer.evaluate(el => {
        el.scrollTo(0, el.scrollHeight);
      });
      
      // Wait for new content to load
      await page.waitForTimeout(2000);
      
      currentHeight = await resultsContainer.evaluate(el => el.scrollHeight);
      scrollAttempts++;
      
      logger.debug('Scrolling results', { 
        previousHeight, 
        currentHeight, 
        attempt: scrollAttempts 
      });
    }
  }

  /**
   * Extract business cards from search results
   */
  private async extractBusinessCards(page: Page, limit: number): Promise<any[]> {
    const cards = await page.$$(SELECTORS.searchResults.businessCard);
    const limitedCards = cards.slice(0, limit);
    
    logger.debug('Business cards found', { 
      total: cards.length, 
      extracting: limitedCards.length 
    });
    
    return limitedCards;
  }

  /**
   * Extract business details from a card
   */
  private async extractBusinessDetails(page: Page, card: any): Promise<ScrapeResult> {
    try {
      // Click on the business card
      await card.click();
      
      // Wait for details panel to load
      await page.waitForSelector(SELECTORS.details.panel, {
        timeout: 10000,
      });
      
      // Wait for content to stabilize
      await page.waitForTimeout(1500);
      
      // Extract business data
      const business = await this.extractBusinessData(page);
      
      return {
        success: true,
        business,
        duration: Date.now() - business.scrapedAt.getTime(),
      };
    } catch (error) {
      logger.error('Failed to extract business details', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        retryable: true,
      };
    }
  }

  /**
   * Extract all business data from the details panel
   */
  private async extractBusinessData(page: Page): Promise<Business> {
    const business: any = createEmptyBusiness();
    business.id = uuidv4();
    business.scrapedAt = new Date();

    // Extract basic information
    business.businessName = await this.extractText(page, SELECTORS.details.businessName);
    business.googleMapsUrl = page.url();

    // Extract contact information
    business.contact = {
      phoneNumber: await this.extractText(page, SELECTORS.contact.phoneNumber),
      website: await this.extractHref(page, SELECTORS.contact.websiteUrl),
      fullAddress: await this.extractText(page, SELECTORS.contact.fullAddress),
    };

    // Determine if business has website
    business.attributes = {
      hasWebsite: !!business.contact.website,
    };

    // Extract location
    const address = business.contact.fullAddress || '';
    business.location = {
      fullAddress: address,
      city: this.extractCityFromAddress(address),
      country: 'Israel',
    };

    // Extract metrics
    const ratingText = await this.extractAriaLabel(page, SELECTORS.details.rating);
    const reviewCountText = await this.extractText(page, SELECTORS.details.reviewCount);
    
    business.metrics = {
      rating: this.parseRating(ratingText),
      reviewCount: this.parseReviewCount(reviewCountText),
      priceLevel: await this.extractText(page, SELECTORS.details.priceLevel),
    };

    // Extract business type and categories
    business.businessType = await this.extractText(page, SELECTORS.details.businessType) || 'Unknown';
    business.businessCategories = [business.businessType];

    // Extract business hours
    business.businessHours = await this.extractBusinessHours(page);

    // Extract images
    business.images = {
      photoUrls: await this.extractImageUrls(page),
    };

    business.lastUpdated = new Date();

    return business as Business;
  }

  /**
   * Helper methods for data extraction
   */
  private async extractText(page: Page, selector: string): Promise<string> {
    try {
      const element = await page.$(selector);
      if (!element) return '';
      
      const text = await element.textContent();
      return text?.trim() || '';
    } catch {
      return '';
    }
  }

  private async extractHref(page: Page, selector: string): Promise<string> {
    try {
      const element = await page.$(selector);
      if (!element) return '';
      
      const href = await element.getAttribute('href');
      return href || '';
    } catch {
      return '';
    }
  }

  private async extractAriaLabel(page: Page, selector: string): Promise<string> {
    try {
      const element = await page.$(selector);
      if (!element) return '';
      
      const label = await element.getAttribute('aria-label');
      return label || '';
    } catch {
      return '';
    }
  }

  private parseRating(ratingText: string): number | undefined {
    const match = ratingText.match(/(\d+\.?\d*)\s*star/);
    return match ? parseFloat(match[1]) : undefined;
  }

  private parseReviewCount(reviewText: string): number | undefined {
    const match = reviewText.match(/(\d+)\s*review/);
    return match ? parseInt(match[1], 10) : undefined;
  }

  private extractCityFromAddress(address: string): string {
    // Simple extraction - can be improved with better parsing
    const parts = address.split(',');
    return parts.length >= 2 ? parts[parts.length - 2].trim() : '';
  }

  private async extractBusinessHours(_page: Page): Promise<any> {
    // TODO: Implement business hours extraction
    return undefined;
  }

  private async extractImageUrls(_page: Page): Promise<string[]> {
    // TODO: Implement image URL extraction
    return [];
  }

  /**
   * Close the scraper
   */
  async close(): Promise<void> {
    if (this.currentPage) {
      await this.currentPage.close();
    }
    if (this.context) {
      await this.browserManager.closeContext('main');
    }
    await this.browserManager.close();
    logger.info('Scraper closed');
  }
}