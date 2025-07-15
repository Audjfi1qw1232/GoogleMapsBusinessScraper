import { chromium, Browser, BrowserContext, Page, LaunchOptions } from 'playwright';
import { chromium as playwrightExtra } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import config from './config';
import logger from '../utils/logger';
import { AntiDetectionService } from '../services/antiDetectionService';
import ProxyChain from 'proxy-chain';

export interface BrowserOptions {
  headless?: boolean;
  proxy?: {
    server: string;
    username?: string;
    password?: string;
  };
  userDataDir?: string;
}

export class BrowserManager {
  private browser: Browser | null = null;
  private antiDetection: AntiDetectionService;
  private contexts: Map<string, BrowserContext> = new Map();

  constructor() {
    this.antiDetection = new AntiDetectionService();
  }

  /**
   * Launch a new browser instance with stealth mode
   */
  async launch(options: BrowserOptions = {}): Promise<Browser> {
    try {
      logger.info('Launching browser', { 
        headless: options.headless ?? config.scraping.headless,
        stealth: config.scraping.stealthMode 
      });

      // Configure browser options
      const launchOptions: LaunchOptions = {
        headless: options.headless ?? config.scraping.headless,
        args: this.antiDetection.getBrowserArgs(),
      };

      // Add proxy if configured
      if (options.proxy || config.proxy.url) {
        const proxyUrl = options.proxy?.server || config.proxy.url;
        const proxyAuth = options.proxy?.username || config.proxy.username;
        
        if (proxyUrl) {
          // If proxy requires authentication, create authenticated URL
          if (proxyAuth) {
            const authUrl = await this.createAuthenticatedProxy(
              proxyUrl,
              proxyAuth,
              options.proxy?.password || config.proxy.password
            );
            launchOptions.proxy = { server: authUrl };
          } else {
            launchOptions.proxy = { server: proxyUrl };
          }
          
          logger.info('Browser configured with proxy', { proxy: proxyUrl });
        }
      }

      // Add user data directory if specified
      if (options.userDataDir) {
        (launchOptions as any).userDataDir = options.userDataDir;
      }

      // Launch browser with or without stealth based on config
      if (config.scraping.stealthMode) {
        // Apply stealth plugin
        (playwrightExtra as any).use(StealthPlugin());
        this.browser = await (playwrightExtra as any).launch(launchOptions);
      } else {
        this.browser = await chromium.launch(launchOptions);
      }

      logger.info('Browser launched successfully');
      return this.browser!;
    } catch (error) {
      logger.error('Failed to launch browser', { error });
      throw error;
    }
  }

  /**
   * Create an authenticated proxy URL
   */
  private async createAuthenticatedProxy(
    proxyUrl: string,
    username: string,
    password: string
  ): Promise<string> {
    const oldProxyUrl = `http://${username}:${password}@${proxyUrl.replace(/^https?:\/\//, '')}`;
    return await ProxyChain.anonymizeProxy(oldProxyUrl);
  }

  /**
   * Create a new browser context
   */
  async createContext(contextId: string): Promise<BrowserContext> {
    if (!this.browser) {
      throw new Error('Browser not launched');
    }

    const context = await this.browser.newContext({
      viewport: this.antiDetection.getRandomViewport(),
      userAgent: this.antiDetection.getRandomUserAgent(),
      locale: 'en-US',
      timezoneId: 'Asia/Jerusalem',
      permissions: ['geolocation'],
      geolocation: { latitude: 32.0853, longitude: 34.7818 }, // Tel Aviv coordinates
      colorScheme: 'light',
      acceptDownloads: false,
      ignoreHTTPSErrors: true,
    });

    this.contexts.set(contextId, context);
    logger.debug('Browser context created', { contextId });
    
    return context;
  }

  /**
   * Create a new page with anti-detection measures
   */
  async createPage(context?: BrowserContext): Promise<Page> {
    const targetContext = context || (await this.createContext('default'));
    const page = await targetContext.newPage();
    
    // Apply stealth settings
    await this.antiDetection.applyStealthSettings(page);
    
    // Set up request interception for performance
    await this.setupRequestInterception(page);
    
    // Handle console messages and errors
    this.setupPageLogging(page);
    
    logger.debug('Page created with anti-detection measures');
    return page;
  }

  /**
   * Set up request interception to block unnecessary resources
   */
  private async setupRequestInterception(page: Page): Promise<void> {
    await page.route('**/*', (route) => {
      const request = route.request();
      const resourceType = request.resourceType();
      const url = request.url();

      // Block unnecessary resources for performance
      const blockedResources = ['image', 'stylesheet', 'font', 'media'];
      const blockedDomains = [
        'google-analytics.com',
        'googletagmanager.com',
        'facebook.com',
        'doubleclick.net',
        'google.com/recaptcha',
      ];

      if (blockedResources.includes(resourceType)) {
        route.abort();
        return;
      }

      if (blockedDomains.some(domain => url.includes(domain))) {
        route.abort();
        return;
      }

      route.continue();
    });
  }

  /**
   * Set up page logging for debugging
   */
  private setupPageLogging(page: Page): void {
    page.on('console', (msg) => {
      const type = msg.type();
      if (type === 'error') {
        logger.error('Page console error', { text: msg.text() });
      }
    });

    page.on('pageerror', (error) => {
      logger.error('Page error', { error: error.message });
    });

    page.on('requestfailed', (request) => {
      logger.warn('Request failed', {
        url: request.url(),
        failure: request.failure()?.errorText,
      });
    });
  }

  /**
   * Close a specific context
   */
  async closeContext(contextId: string): Promise<void> {
    const context = this.contexts.get(contextId);
    if (context) {
      await context.close();
      this.contexts.delete(contextId);
      logger.debug('Browser context closed', { contextId });
    }
  }

  /**
   * Close the browser
   */
  async close(): Promise<void> {
    try {
      // Close all contexts
      for (const [contextId, context] of this.contexts) {
        await context.close();
        this.contexts.delete(contextId);
      }

      // Close browser
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
        logger.info('Browser closed');
      }
    } catch (error) {
      logger.error('Error closing browser', { error });
    }
  }

  /**
   * Check if browser is running
   */
  isRunning(): boolean {
    return this.browser !== null && this.browser.isConnected();
  }

  /**
   * Get browser instance
   */
  getBrowser(): Browser | null {
    return this.browser;
  }
}