import { getSettings, saveSettings } from '../utils/storage.js';
import { validateAPIKeys } from '../config/api-keys.js';
import { DEFAULT_SETTINGS } from '../config/config.js';

// Initialize settings page when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  setupEventListeners();
});

/**
 * Load settings from storage and populate form
 */
async function loadSettings() {
  try {
    const settings = await getSettings();

    // Populate API keys
    document.getElementById('finnhubKey').value = settings.apiKeys.finnhub || '';
    document.getElementById('fredKey').value = settings.apiKeys.fred || '';

    // Populate Polymarket IDs
    const polymarketIds = settings.selectedMetrics.polymarketIds || [];
    document.getElementById('polymarketIds').value = polymarketIds.join('\n');

    // Populate stock symbols
    const stockSymbols = settings.selectedMetrics.stockSymbols || [];
    document.getElementById('stockSymbols').value = stockSymbols.join(', ');

    // Populate forex pairs
    const forexPairs = settings.selectedMetrics.forexPairs || [];
    const forexPairsText = forexPairs.map(pair => `${pair.base}/${pair.target}`).join('\n');
    document.getElementById('forexPairs').value = forexPairsText;

    // Populate economic indicators
    const economicSeries = settings.selectedMetrics.economicSeries || [];
    const economicSeriesIds = economicSeries.map(series =>
      typeof series === 'string' ? series : series.id
    );
    document.getElementById('economicSeries').value = economicSeriesIds.join('\n');

    // Populate update frequency
    document.getElementById('updateFrequency').value = settings.updateFrequency || 5;
  } catch (error) {
    console.error('Error loading settings:', error);
    showToast('Error loading settings', 'error');
  }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Save button
  document.getElementById('saveBtn').addEventListener('click', saveSettingsHandler);

  // Reset button
  document.getElementById('resetBtn').addEventListener('click', resetSettings);

  // Validate API keys button
  document.getElementById('validateKeysBtn').addEventListener('click', validateKeys);

  // Toggle password visibility
  document.getElementById('toggleFinnhubKey').addEventListener('click', () => {
    togglePasswordVisibility('finnhubKey', 'toggleFinnhubKey');
  });

  document.getElementById('toggleFredKey').addEventListener('click', () => {
    togglePasswordVisibility('fredKey', 'toggleFredKey');
  });
}

/**
 * Save settings handler
 */
async function saveSettingsHandler() {
  try {
    const saveBtn = document.getElementById('saveBtn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    // Collect form data
    const settings = {
      apiKeys: {
        finnhub: document.getElementById('finnhubKey').value.trim(),
        fred: document.getElementById('fredKey').value.trim()
      },
      selectedMetrics: {
        polymarketIds: parsePolymarketIds(document.getElementById('polymarketIds').value),
        stockSymbols: parseStockSymbols(document.getElementById('stockSymbols').value),
        forexPairs: parseForexPairs(document.getElementById('forexPairs').value),
        economicSeries: parseEconomicSeries(document.getElementById('economicSeries').value)
      },
      updateFrequency: parseInt(document.getElementById('updateFrequency').value, 10)
    };

    // Validate update frequency
    if (settings.updateFrequency < 1 || settings.updateFrequency > 60) {
      throw new Error('Update frequency must be between 1 and 60 minutes');
    }

    // Save settings to storage
    await saveSettings(settings);

    // Notify service worker of settings update
    await chrome.runtime.sendMessage({
      action: 'updateSettings',
      settings: settings
    });

    showToast('Settings saved successfully!', 'success');

    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Settings';
  } catch (error) {
    console.error('Error saving settings:', error);
    showToast(`Error: ${error.message}`, 'error');

    const saveBtn = document.getElementById('saveBtn');
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Settings';
  }
}

/**
 * Reset settings to defaults
 */
async function resetSettings() {
  if (!confirm('Are you sure you want to reset all settings to defaults?')) {
    return;
  }

  try {
    await saveSettings(DEFAULT_SETTINGS);
    await loadSettings();
    showToast('Settings reset to defaults', 'success');

    // Clear status messages
    clearStatusMessages();
  } catch (error) {
    console.error('Error resetting settings:', error);
    showToast('Error resetting settings', 'error');
  }
}

/**
 * Validate API keys
 */
async function validateKeys() {
  const validateBtn = document.getElementById('validateKeysBtn');
  validateBtn.disabled = true;
  validateBtn.textContent = 'Validating...';

  // Clear previous status messages
  clearStatusMessages();

  try {
    const apiKeys = {
      finnhub: document.getElementById('finnhubKey').value.trim(),
      fred: document.getElementById('fredKey').value.trim()
    };

    const results = await validateAPIKeys(apiKeys);

    // Display Finnhub validation result
    const finnhubStatus = document.getElementById('finnhubKeyStatus');
    if (results.finnhub.valid) {
      finnhubStatus.textContent = results.finnhub.message;
      finnhubStatus.className = 'status-message success';
    } else {
      finnhubStatus.textContent = results.finnhub.message;
      finnhubStatus.className = 'status-message error';
    }

    // Display FRED validation result
    const fredStatus = document.getElementById('fredKeyStatus');
    if (results.fred.valid) {
      fredStatus.textContent = results.fred.message;
      fredStatus.className = 'status-message success';
    } else {
      fredStatus.textContent = results.fred.message;
      fredStatus.className = 'status-message error';
    }

    // Show overall result
    if (results.finnhub.valid && results.fred.valid) {
      showToast('All API keys are valid!', 'success');
    } else {
      showToast('Some API keys are invalid', 'error');
    }
  } catch (error) {
    console.error('Error validating API keys:', error);
    showToast('Error validating API keys', 'error');
  } finally {
    validateBtn.disabled = false;
    validateBtn.textContent = 'Validate API Keys';
  }
}

/**
 * Toggle password visibility
 */
function togglePasswordVisibility(inputId, buttonId) {
  const input = document.getElementById(inputId);
  const button = document.getElementById(buttonId);

  if (input.type === 'password') {
    input.type = 'text';
    button.textContent = 'Hide';
  } else {
    input.type = 'password';
    button.textContent = 'Show';
  }
}

/**
 * Parse Polymarket IDs from multi-line input
 * Accepts market slugs or full URLs
 */
function parsePolymarketIds(value) {
  return value
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => {
      // If it's a URL, extract the slug
      if (line.startsWith('http://') || line.startsWith('https://')) {
        try {
          const url = new URL(line);
          // Extract slug from path (e.g., /event/will-trump-win-2024)
          const pathParts = url.pathname.split('/').filter(p => p);
          // Return the last part of the path as the slug
          return pathParts[pathParts.length - 1] || line;
        } catch (e) {
          return line;
        }
      }
      return line;
    })
    .filter(slug => slug.length > 0);
}

/**
 * Parse stock symbols from comma-separated string
 */
function parseStockSymbols(value) {
  return value
    .split(',')
    .map(symbol => symbol.trim().toUpperCase())
    .filter(symbol => symbol.length > 0);
}

/**
 * Parse forex pairs from multi-line input
 * Format: BASE/TARGET (e.g., USD/EUR)
 */
function parseForexPairs(value) {
  return value
    .split('\n')
    .map(line => line.trim().toUpperCase())
    .filter(line => line.length > 0)
    .map(line => {
      // Parse format like "USD/EUR" or "USD EUR"
      const parts = line.split(/[\/\s]+/);
      if (parts.length >= 2) {
        return {
          base: parts[0],
          target: parts[1]
        };
      }
      return null;
    })
    .filter(pair => pair !== null);
}

/**
 * Parse economic series IDs from multi-line input
 */
function parseEconomicSeries(value) {
  return value
    .split('\n')
    .map(line => line.trim().toUpperCase())
    .filter(line => line.length > 0)
    .map(seriesId => ({
      id: seriesId,
      name: seriesId // Just use the ID as name; API provides full names
    }));
}

/**
 * Clear all status messages
 */
function clearStatusMessages() {
  document.getElementById('finnhubKeyStatus').className = 'status-message';
  document.getElementById('finnhubKeyStatus').textContent = '';
  document.getElementById('fredKeyStatus').className = 'status-message';
  document.getElementById('fredKeyStatus').textContent = '';
}

/**
 * Show toast notification
 */
function showToast(message, type = 'success') {
  const toast = document.getElementById('statusMessage');
  toast.textContent = message;
  toast.className = `status-toast ${type}`;
  toast.style.display = 'block';

  // Auto-hide after 3 seconds
  setTimeout(() => {
    toast.style.display = 'none';
  }, 3000);
}
