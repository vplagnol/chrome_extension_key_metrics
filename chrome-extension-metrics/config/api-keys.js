import { STORAGE_KEYS } from './config.js';

// Get API keys from storage
export async function getAPIKeys() {
  const { settings } = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
  return settings?.apiKeys || { finnhub: '', fred: '' };
}

// Save API keys to storage
export async function saveAPIKeys(apiKeys) {
  const { settings } = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
  const updatedSettings = {
    ...settings,
    apiKeys
  };
  await chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: updatedSettings });
}

// Validate API keys by making test requests
export async function validateAPIKeys(apiKeys) {
  const results = {
    finnhub: { valid: false, message: '' },
    fred: { valid: false, message: '' }
  };

  // Validate Finnhub API key
  if (apiKeys.finnhub) {
    try {
      const response = await fetch(
        `https://finnhub.io/api/v1/quote?symbol=AAPL&token=${apiKeys.finnhub}`
      );
      if (response.ok) {
        results.finnhub.valid = true;
        results.finnhub.message = 'Valid API key';
      } else if (response.status === 401) {
        results.finnhub.message = 'Invalid API key';
      } else {
        results.finnhub.message = `Error: ${response.status}`;
      }
    } catch (error) {
      results.finnhub.message = `Network error: ${error.message}`;
    }
  } else {
    results.finnhub.message = 'API key not provided';
  }

  // Validate FRED API key
  if (apiKeys.fred) {
    try {
      const response = await fetch(
        `https://api.stlouisfed.org/fred/series?series_id=GDP&api_key=${apiKeys.fred}&file_type=json`
      );
      if (response.ok) {
        results.fred.valid = true;
        results.fred.message = 'Valid API key';
      } else if (response.status === 400) {
        results.fred.message = 'Invalid API key';
      } else {
        results.fred.message = `Error: ${response.status}`;
      }
    } catch (error) {
      results.fred.message = `Network error: ${error.message}`;
    }
  } else {
    results.fred.message = 'API key not provided';
  }

  return results;
}
