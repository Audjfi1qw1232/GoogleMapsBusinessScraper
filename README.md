# Google Maps Business Scraper 🗺️

A powerful web scraping tool designed to collect business information from Google Maps, specifically targeting Israeli businesses that lack digital presence (websites, social media). Built with TypeScript, Playwright, and designed for scalability.

## 🎯 Purpose

Many businesses in Israel maintain a Google Maps presence but lack:
- Company websites
- Social media profiles  
- Digital marketing presence
- Online ordering/booking systems

This tool helps identify these businesses, creating opportunities for digital transformation services.

## ✨ Features

- **Geographic Targeting**: Search by Israeli cities, regions, or radius
- **Business Type Filtering**: Filter by categories (restaurants, cafes, shops, etc.)
- **Smart Data Extraction**: Collects comprehensive business information
- **Multi-threaded Scraping**: Concurrent scraping with configurable workers
- **Incremental Saving**: Saves data after each successful scrape
- **Resume Capability**: Continue from last checkpoint after interruption
- **No-Website Detection**: Specifically identifies businesses without websites
- **Hebrew Support**: Full UTF-8 support for Hebrew content

## 📊 Data Collected

- Basic Information (name, address, phone)
- Digital Presence (website, social media)
- Business Metrics (rating, reviews, price level)
- Operating Hours
- Location Data (coordinates, maps URL)
- Visual Assets (image URLs)
- Contact Methods
- Business Categories

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or pnpm
- 4GB+ RAM recommended for multi-worker operation

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/GoogleMapsBusinessScraper.git
cd GoogleMapsBusinessScraper

# Install dependencies
npm install

# Build the project
npm run build
```

### Basic Usage

```bash
# Scrape all restaurants in Tel Aviv
npm run scrape -- --city "Tel Aviv" --type "restaurant"

# Find businesses without websites
npm run scrape -- --city "Jerusalem" --no-website

# Multi-category search with 5 workers
npm run scrape -- --city "Haifa" --types "cafe,restaurant,bar" --workers 5
```

### Configuration

Create a `.env` file based on `.env.example`:

```env
HEADLESS=true
DEFAULT_WORKERS=3
TIMEOUT=30000
MIN_DELAY=1000
MAX_DELAY=3000
```

## 📁 Output Format

Data is exported to CSV format with the following structure:

```csv
business_name,address,phone_number,website,has_website,rating,review_count,...
"Cafe Shalom","123 Dizengoff St, Tel Aviv","03-1234567","",false,4.5,127,...
```

## 🛠️ Advanced Usage

### Using Configuration File

Create a `config.json`:

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
    "incrementalSave": true
  }
}
```

Run with config:
```bash
npm run scrape -- --config ./config.json
```

### CLI Options

```bash
Options:
  -c, --city <city>        Target city
  -r, --region <region>    Target region (North/Central/South)
  -t, --type <type>        Single business type
  --types <types>          Comma-separated business types
  -w, --workers <number>   Number of concurrent workers (default: 3)
  -o, --output <path>      Output file path
  --no-website            Only businesses without websites
  --limit <number>         Maximum results to scrape
  --resume                Resume from last checkpoint
  --config <path>         Path to configuration file
  -h, --help              Display help
```

## 🏗️ Project Structure

```
├── src/
│   ├── core/           # Core scraping engine
│   ├── services/       # Business logic services
│   ├── workers/        # Multi-threading implementation
│   ├── models/         # Data models
│   ├── utils/          # Utility functions
│   └── cli/            # Command-line interface
├── exports/            # CSV output files
├── logs/               # Application logs
└── tests/              # Test suites
```

## 🧪 Development

```bash
# Run in development mode
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

## 📈 Performance

- **Single Worker**: ~100 businesses/hour
- **5 Workers**: ~400 businesses/hour
- **10 Workers**: ~800 businesses/hour

*Performance depends on network speed and system resources*

## ⚠️ Important Notes

1. **Ethical Use**: This tool is designed for legitimate business research and lead generation
2. **Rate Limiting**: Implements automatic delays to respect Google's servers
3. **Legal Compliance**: Only collects publicly available information
4. **Resource Usage**: Each worker uses ~400MB RAM

## 🐛 Troubleshooting

### Common Issues

1. **"No businesses found"**
   - Check city spelling (Hebrew/English)
   - Try broader search terms
   - Verify internet connection

2. **"Rate limit detected"**
   - Reduce number of workers
   - Increase delay in .env file
   - Wait before retrying

3. **"Out of memory"**
   - Reduce number of workers
   - Enable incremental saving
   - Increase system RAM

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Add tests for new features
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🔮 Future Enhancements

- [ ] Web dashboard interface
- [ ] API endpoint for data access
- [ ] Real-time progress monitoring
- [ ] CRM integrations
- [ ] AI-powered categorization
- [ ] Automated email outreach
- [ ] Mobile app

## 📞 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Email: support@example.com

---

Built with ❤️ for the Israeli business community