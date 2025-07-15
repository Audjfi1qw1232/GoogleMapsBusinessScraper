import { GoogleMapsScraper } from './core/scraper';
import logger from './utils/logger';
import config from './core/config';

async function main() {
  logger.info('Google Maps Business Scraper starting', {
    version: '1.0.0',
    workers: config.scraping.defaultWorkers,
    headless: config.scraping.headless,
  });

  const scraper = new GoogleMapsScraper({
    headless: false, // Set to false for testing
    workers: 1,
  });

  try {
    // Initialize scraper
    await scraper.initialize();
    logger.info('Scraper initialized successfully');

    // Test search
    const results = await scraper.searchBusinesses(
      'restaurant',
      'Tel Aviv, Israel',
      5 // Limit to 5 for testing
    );

    logger.info('Test search completed', {
      found: results.length,
      successful: results.filter(r => r.success).length,
    });

    // Log results
    results.forEach((result, index) => {
      if (result.success && result.business) {
        logger.info(`Business ${index + 1}:`, {
          name: result.business.businessName,
          hasWebsite: result.business.attributes.hasWebsite,
          website: result.business.contact.website,
          phone: result.business.contact.phoneNumber,
          rating: result.business.metrics.rating,
        });
      }
    });

  } catch (error) {
    logger.error('Scraper failed', { error });
  } finally {
    await scraper.close();
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    logger.error('Fatal error', { error });
    process.exit(1);
  });
}

export { GoogleMapsScraper };