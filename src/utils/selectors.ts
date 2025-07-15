/**
 * Google Maps selectors for data extraction
 * Updated for 2024 Google Maps UI
 */

export const SELECTORS = {
  // Search and Navigation
  search: {
    searchBox: 'input#searchboxinput',
    searchButton: 'button#searchbox-searchbutton',
    resultsContainer: 'div[role="feed"]',
    noResultsMessage: 'div.section-no-result',
  },

  // Business Cards in Search Results
  searchResults: {
    businessCard: 'div[role="article"]',
    businessName: 'div[role="article"] h3',
    businessRating: 'span[role="img"][aria-label*="stars"]',
    businessReviews: 'span[aria-label*="reviews"]',
    businessType: 'div[role="article"] span[aria-label]',
    businessAddress: 'div[role="article"] span:not([aria-label])',
    businessWebsite: 'a[data-value="Website"]',
  },

  // Business Details Panel
  details: {
    panel: 'div[role="main"][aria-label]',
    businessName: 'h1[class*="fontHeadlineLarge"]',
    rating: 'div[class*="fontBodyMedium"] span[role="img"][aria-label*="stars"]',
    reviewCount: 'button[aria-label*="reviews"]',
    priceLevel: 'span[aria-label*="Price"]',
    businessType: 'button[class*="fontBodyMedium"] span',
    claimBusiness: 'button[aria-label*="Claim this business"]',
  },

  // Contact Information
  contact: {
    phoneButton: 'button[data-item-id*="phone"]',
    phoneNumber: 'button[data-item-id*="phone"] div[class*="fontBodyMedium"]',
    websiteButton: 'a[data-item-id="authority"]',
    websiteUrl: 'a[data-item-id="authority"]',
    addressButton: 'button[data-item-id="address"]',
    fullAddress: 'button[data-item-id="address"] div[class*="fontBodyMedium"]',
  },

  // Business Hours
  hours: {
    hoursButton: 'button[aria-label*="Hours"]',
    hoursContainer: 'div[aria-label*="Hours"] table',
    hoursTable: 'table[class*="fontBodyMedium"]',
    dayRow: 'tr',
    dayName: 'td:first-child',
    dayHours: 'td:nth-child(2)',
    openNow: 'span[aria-label*="Open now"]',
    closingSoon: 'span[aria-label*="Closing soon"]',
  },

  // Images
  images: {
    photoTab: 'button[aria-label*="Photos"]',
    photoContainer: 'div[class*="section-scrollbox"]',
    photo: 'button[aria-label*="Photo"] img',
    logoImage: 'button[aria-label*="profile"] img',
    coverPhoto: 'button[aria-label*="cover photo"] img',
    streetView: 'button[aria-label*="Street View"]',
  },

  // Reviews
  reviews: {
    reviewsTab: 'button[aria-label*="Reviews"]',
    reviewContainer: 'div[aria-label*="Reviews"]',
    reviewCard: 'div[data-review-id]',
    reviewerName: 'div[data-review-id] button[aria-label*="Photo of"]',
    reviewRating: 'div[data-review-id] span[role="img"][aria-label*="stars"]',
    reviewText: 'div[data-review-id] span[class*="fontBodyMedium"]',
    reviewDate: 'div[data-review-id] span[class*="fontBodySmall"]',
  },

  // Additional Information
  additional: {
    aboutTab: 'button[aria-label*="About"]',
    popularTimes: 'div[aria-label*="Popular times"]',
    busyNow: 'div[aria-label*="currently"]',
    serviceOptions: 'div[aria-label*="Service options"]',
    accessibility: 'div[aria-label*="Accessibility"]',
    amenities: 'div[aria-label*="Amenities"]',
    planning: 'div[aria-label*="Planning"]',
    payments: 'div[aria-label*="Payments"]',
  },

  // Menu (for restaurants)
  menu: {
    menuTab: 'button[aria-label*="Menu"]',
    menuLink: 'a[aria-label*="menu"]',
    menuSection: 'div[aria-label*="Menu"]',
  },

  // Questions & Answers
  qa: {
    qaTab: 'button[aria-label*="Questions & answers"]',
    questionCard: 'div[class*="section-question"]',
    askButton: 'button[aria-label*="Ask a question"]',
  },

  // Updates from Business
  updates: {
    updatesTab: 'button[aria-label*="Updates"]',
    updateCard: 'div[class*="section-update"]',
    covidUpdate: 'div[aria-label*="COVID"]',
  },

  // Loading and Error States
  states: {
    loading: 'div[class*="section-loading"]',
    error: 'div[class*="section-error"]',
    offline: 'div[class*="offline-content"]',
    rateLimitMessage: 'div[class*="rate-limit"]',
  },

  // Navigation
  navigation: {
    backButton: 'button[aria-label="Back"]',
    shareButton: 'button[aria-label*="Share"]',
    saveButton: 'button[aria-label*="Save"]',
    directionsButton: 'button[aria-label*="Directions"]',
  },

  // Attributes and Features
  attributes: {
    // Service options
    delivery: 'span[aria-label*="Delivery"]',
    takeout: 'span[aria-label*="Takeout"]',
    dineIn: 'span[aria-label*="Dine-in"]',
    
    // Accessibility
    wheelchairAccessible: 'span[aria-label*="Wheelchair accessible"]',
    
    // Amenities
    wifi: 'span[aria-label*="Wi-Fi"]',
    parking: 'span[aria-label*="Parking"]',
    
    // Payments
    creditCards: 'span[aria-label*="Credit cards"]',
    cash: 'span[aria-label*="Cash"]',
    
    // Atmosphere
    casual: 'span[aria-label*="Casual"]',
    cozy: 'span[aria-label*="Cozy"]',
    
    // Dietary
    vegetarian: 'span[aria-label*="Vegetarian"]',
    vegan: 'span[aria-label*="Vegan"]',
    kosher: 'span[aria-label*="Kosher"]',
  },
};

// Dynamic selectors that might need updates
export const DYNAMIC_SELECTORS = {
  // These selectors use class names that might change
  ratingValue: (rating: string) => `span[aria-label="${rating} stars"]`,
  reviewCount: (count: string) => `button[aria-label="${count} reviews"]`,
  businessHours: (day: string) => `tr:has(td:contains("${day}"))`,
};

// XPath selectors for complex queries
export const XPATH_SELECTORS = {
  businessWithoutWebsite: '//div[@role="article"][not(.//a[@data-item-id="authority"])]',
  phoneNumberText: '//button[@data-item-id="phone:"]//div[contains(@class, "fontBodyMedium")]/text()',
  addressText: '//button[@data-item-id="address"]//div[contains(@class, "fontBodyMedium")]/text()',
};

// CSS selectors for specific data extraction
export const DATA_SELECTORS = {
  // Extract text content
  getText: (selector: string) => `${selector} *:not(:has(*))`,
  
  // Extract href attributes
  getHref: (selector: string) => `${selector}[href]`,
  
  // Extract image sources
  getImageSrc: (selector: string) => `${selector}[src]`,
  
  // Extract aria-labels
  getAriaLabel: (selector: string) => `${selector}[aria-label]`,
};

// Fallback selectors in case primary ones fail
export const FALLBACK_SELECTORS = {
  businessName: [
    'h1[class*="fontHeadlineLarge"]',
    'h1.section-hero-header-title-title',
    'div[role="heading"][aria-level="1"]',
    'h1',
  ],
  phoneNumber: [
    'button[data-item-id*="phone"] div[class*="fontBodyMedium"]',
    'button[aria-label*="Phone"] span',
    'a[href^="tel:"]',
  ],
  website: [
    'a[data-item-id="authority"]',
    'a[aria-label*="Website"]',
    'a[href^="http"]:not([href*="google.com"])',
  ],
};