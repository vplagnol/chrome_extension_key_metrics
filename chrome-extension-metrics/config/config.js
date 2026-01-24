// API Configuration
export const API_CONFIG = {
  polymarket: {
    baseUrl: 'https://gamma-api.polymarket.com',
    endpoints: {
      events: '/events',
      markets: '/markets',
      prices: '/prices'
    }
  },
  finnhub: {
    baseUrl: 'https://finnhub.io/api/v1',
    endpoints: {
      quote: '/quote',
      profile: '/stock/profile2'
    }
  },
  fred: {
    baseUrl: 'https://api.stlouisfed.org/fred',
    endpoints: {
      series: '/series',
      observations: '/series/observations'
    }
  },
  exchangeRate: {
    baseUrl: 'https://api.exchangerate-api.com/v4',
    endpoints: {
      latest: '/latest'
    }
  }
};

// Default settings
export const DEFAULT_SETTINGS = {
  updateFrequency: 5, // minutes
  apiKeys: {
    finnhub: '',
    fred: ''
  },
  selectedMetrics: {
    polymarketIds: [],
    stockSymbols: ['AAPL', 'GOOGL', 'MSFT'],
    economicSeries: [
      { id: 'GDP', name: 'US GDP Growth' },
      { id: 'UNRATE', name: 'Unemployment Rate' },
      { id: 'CPIAUCSL', name: 'Consumer Price Index' }
    ],
    forexPairs: [
      { base: 'USD', target: 'EUR' },
      { base: 'USD', target: 'JPY' },
      { base: 'USD', target: 'GBP' }
    ]
  }
};

// Request timeout (10 seconds)
export const REQUEST_TIMEOUT = 10000;

// Retry configuration
export const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  backoffMultiplier: 2
};

// Storage keys
export const STORAGE_KEYS = {
  METRICS: 'metrics',
  SETTINGS: 'settings',
  ERRORS: 'errors',
  LAST_UPDATE: 'lastUpdate'
};

// Alarm name
export const ALARM_NAME = 'fetchMetrics';
