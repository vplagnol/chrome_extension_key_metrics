import { ALARM_NAME, DEFAULT_SETTINGS } from './config/config.js';
import { saveMetrics, saveError, clearErrors, initializeStorage, getSettings, getMetrics } from './utils/storage.js';
import { fetchPolymarketMetrics, fetchStockMetrics, fetchEconomicMetrics, fetchForexMetrics } from './utils/api-client.js';

// CRITICAL: Event listeners MUST be at top-level module scope
// Service workers are non-persistent and terminate after 30 seconds of inactivity

// Handle extension installation
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('Extension installed:', details.reason);

  // Initialize storage with default settings
  await initializeStorage();

  // Create alarm for periodic fetching
  await chrome.alarms.create(ALARM_NAME, {
    periodInMinutes: DEFAULT_SETTINGS.updateFrequency
  });

  // Trigger immediate first fetch
  await fetchAllMetrics();

  console.log('Alarm created and initial fetch completed');
});

// Handle alarm events (periodic fetching)
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_NAME) {
    console.log('Alarm triggered, fetching metrics...');
    await fetchAllMetrics();
  }
});

// Handle messages from popup/settings
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'fetchMetrics') {
    // Manual refresh triggered from popup
    fetchAllMetrics().then(() => {
      sendResponse({ success: true });
    }).catch((error) => {
      sendResponse({ success: false, error: error.message });
    });
    return true; // Keep channel open for async response
  }

  if (message.action === 'updateSettings') {
    // Settings updated, recreate alarm with new frequency
    updateAlarmFrequency(message.settings.updateFrequency).then(() => {
      sendResponse({ success: true });
    }).catch((error) => {
      sendResponse({ success: false, error: error.message });
    });
    return true;
  }
});

// Main function to fetch all metrics
async function fetchAllMetrics() {
  console.log('Starting metrics fetch...');

  try {
    // Clear previous errors
    await clearErrors();

    // Get current settings to know which metrics to fetch
    const settings = await getSettings();

    // Get previous metrics for calculating changes
    const { metrics: previousMetrics } = await getMetrics();

    // Fetch all APIs in parallel using Promise.allSettled
    // This ensures one failure doesn't block the others
    const results = await Promise.allSettled([
      fetchPolymarketMetrics(settings, previousMetrics.polymarket),
      fetchStockMetrics(settings, previousMetrics.stocks),
      fetchForexMetrics(settings, previousMetrics.forex),
      fetchEconomicMetrics(settings, previousMetrics.economic)
    ]);

    // Process results
    const metrics = {
      polymarket: [],
      stocks: [],
      forex: [],
      economic: []
    };

    // Handle Polymarket results
    if (results[0].status === 'fulfilled') {
      metrics.polymarket = results[0].value;
    } else {
      console.error('Polymarket fetch failed:', results[0].reason);
      await saveError('polymarket', results[0].reason);
    }

    // Handle Stock results
    if (results[1].status === 'fulfilled') {
      metrics.stocks = results[1].value;
    } else {
      console.error('Stock fetch failed:', results[1].reason);
      await saveError('stocks', results[1].reason);
    }

    // Handle Forex results
    if (results[2].status === 'fulfilled') {
      metrics.forex = results[2].value;
    } else {
      console.error('Forex fetch failed:', results[2].reason);
      await saveError('forex', results[2].reason);
    }

    // Handle Economic results
    if (results[3].status === 'fulfilled') {
      metrics.economic = results[3].value;
    } else {
      console.error('Economic fetch failed:', results[3].reason);
      await saveError('economic', results[3].reason);
    }

    // Save metrics to storage
    await saveMetrics(metrics);

    console.log('Metrics fetch completed:', metrics);
  } catch (error) {
    console.error('Fatal error during metrics fetch:', error);
    await saveError('system', error);
  }
}

// Update alarm frequency when settings change
async function updateAlarmFrequency(frequencyMinutes) {
  // Clear existing alarm
  await chrome.alarms.clear(ALARM_NAME);

  // Create new alarm with updated frequency
  await chrome.alarms.create(ALARM_NAME, {
    periodInMinutes: frequencyMinutes
  });

  // Trigger immediate fetch
  await fetchAllMetrics();

  console.log(`Alarm frequency updated to ${frequencyMinutes} minutes`);
}

// Log when service worker starts
console.log('Service worker loaded');
