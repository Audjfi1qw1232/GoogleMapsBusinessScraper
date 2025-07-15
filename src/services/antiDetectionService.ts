import { Page } from 'playwright';
import UserAgent from 'user-agents';
import config from '../core/config';
import logger from '../utils/logger';

export interface ViewportSize {
  width: number;
  height: number;
}

export class AntiDetectionService {
  private userAgentGenerator: any;
  private viewports: ViewportSize[] = [
    { width: 1920, height: 1080 },
    { width: 1366, height: 768 },
    { width: 1440, height: 900 },
    { width: 1536, height: 864 },
    { width: 1280, height: 720 },
    { width: 1600, height: 900 },
  ];

  constructor() {
    this.userAgentGenerator = new UserAgent({ 
      deviceCategory: 'desktop',
      platform: 'Win32' 
    });
  }

  /**
   * Get a random viewport size
   */
  getRandomViewport(): ViewportSize {
    if (!config.scraping.randomizeViewport) {
      return this.viewports[0]; // Default viewport
    }
    return this.viewports[Math.floor(Math.random() * this.viewports.length)];
  }

  /**
   * Get a random user agent
   */
  getRandomUserAgent(): string {
    if (!config.scraping.randomizeUserAgent) {
      return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    }
    return this.userAgentGenerator.toString();
  }

  /**
   * Apply stealth settings to a page
   */
  async applyStealthSettings(page: Page): Promise<void> {
    if (!config.scraping.stealthMode) {
      return;
    }

    logger.debug('Applying stealth settings to page');

    // Set random viewport
    const viewport = this.getRandomViewport();
    await page.setViewportSize(viewport);

    // Set random user agent
    const userAgent = this.getRandomUserAgent();
    await page.setExtraHTTPHeaders({
      'user-agent': userAgent,
      'accept-language': 'en-US,en;q=0.9,he;q=0.8',
      'accept-encoding': 'gzip, deflate, br',
      'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    });

    // Remove automation indicators
    await page.addInitScript(() => {
      // Override navigator.webdriver
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });

      // Override navigator.plugins
      Object.defineProperty(navigator, 'plugins', {
        get: () => [
          { name: 'Chrome PDF Plugin', description: 'Portable Document Format' },
          { name: 'Chrome PDF Viewer', description: 'Portable Document Format' },
          { name: 'Native Client', description: 'Native Client' },
        ],
      });

      // Override navigator.languages
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en', 'he'],
      });

      // Override permissions
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters: any) =>
        parameters.name === 'notifications'
          ? Promise.resolve({ state: Notification.permission } as PermissionStatus)
          : originalQuery(parameters);

      // Add Chrome runtime
      (window as any).chrome = {
        runtime: {
          PlatformOs: {
            MAC: 'mac',
            WIN: 'win',
            ANDROID: 'android',
            CROS: 'cros',
            LINUX: 'linux',
            OPENBSD: 'openbsd',
          },
          PlatformArch: {
            ARM: 'arm',
            X86_32: 'x86-32',
            X86_64: 'x86-64',
          },
          PlatformNaclArch: {
            ARM: 'arm',
            X86_32: 'x86-32',
            X86_64: 'x86-64',
          },
          RequestUpdateCheckStatus: {
            THROTTLED: 'throttled',
            NO_UPDATE: 'no_update',
            UPDATE_AVAILABLE: 'update_available',
          },
          OnInstalledReason: {
            INSTALL: 'install',
            UPDATE: 'update',
            CHROME_UPDATE: 'chrome_update',
            SHARED_MODULE_UPDATE: 'shared_module_update',
          },
          OnRestartRequiredReason: {
            APP_UPDATE: 'app_update',
            OS_UPDATE: 'os_update',
            PERIODIC: 'periodic',
          },
        },
      };
    });

    logger.debug('Stealth settings applied', { viewport, userAgent: userAgent.substring(0, 50) + '...' });
  }

  /**
   * Simulate human-like behavior
   */
  async simulateHumanBehavior(page: Page): Promise<void> {
    if (!config.scraping.simulateHumanBehavior) {
      return;
    }

    try {
      // Random mouse movement
      const x = Math.random() * 800 + 100;
      const y = Math.random() * 600 + 100;
      await page.mouse.move(x, y, { steps: 10 });

      // Random scroll
      await page.evaluate(() => {
        const scrollY = Math.random() * document.body.scrollHeight * 0.3;
        window.scrollTo({ top: scrollY, behavior: 'smooth' });
      });

      // Random delay between actions
      await this.humanDelay(500, 1500);

      // Simulate reading time
      await this.humanDelay(1000, 3000);

      logger.debug('Human behavior simulation completed');
    } catch (error) {
      logger.warn('Failed to simulate human behavior', { error });
    }
  }

  /**
   * Apply human-like delay
   */
  async humanDelay(min: number = 1000, max: number = 3000): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Get delay based on rate limiting configuration
   */
  getRandomDelay(): number {
    const { minDelay, maxDelay } = config.rateLimiting;
    return Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
  }

  /**
   * Apply browser-level stealth settings
   */
  getBrowserArgs(): string[] {
    return [
      '--disable-blink-features=AutomationControlled',
      '--disable-features=IsolateOrigins,site-per-process',
      '--disable-site-isolation-trials',
      '--disable-web-security',
      '--disable-features=BlockInsecurePrivateNetworkRequests',
      '--disable-dev-shm-usage',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
      '--window-size=1920,1080',
      '--start-maximized',
      '--disable-infobars',
      '--disable-extensions',
      '--disable-notifications',
    ];
  }
}