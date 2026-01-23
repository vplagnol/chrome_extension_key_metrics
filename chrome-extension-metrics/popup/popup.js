import { getMetrics, getErrors } from '../utils/storage.js';
import { formatTimestamp } from '../utils/formatters.js';
import { renderMetrics } from '../components/metric-card.js';
import { displayAllErrors, clearAllErrors } from '../components/error-display.js';
import { showLoading, hideLoading, showEmptyState, disableRefreshButton, enableRefreshButton } from '../components/loading-state.js';

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  await loadAndDisplayMetrics();
  setupEventListeners();
});

/**
 * Load metrics from storage and display them
 */
async function loadAndDisplayMetrics() {
  try {
    // Get metrics and errors from storage
    const { metrics, lastUpdate } = await getMetrics();
    const errors = await getErrors();

    // Update last update timestamp
    updateLastUpdateTime(lastUpdate);

    // Check if we have any data
    const hasData = (
      (metrics.polymarket && metrics.polymarket.length > 0) ||
      (metrics.stocks && metrics.stocks.length > 0) ||
      (metrics.economic && metrics.economic.length > 0)
    );

    // Check if we have any errors
    const hasErrors = errors.polymarket || errors.stocks || errors.economic;

    // If no data and no errors, show empty state
    if (!hasData && !hasErrors) {
      showEmptyState();
      return;
    }

    // Display metrics
    hideLoading();
    displayMetrics(metrics);

    // Display any errors
    if (hasErrors) {
      displayAllErrors(errors);
    } else {
      clearAllErrors();
    }
  } catch (error) {
    console.error('Error loading metrics:', error);
    hideLoading();
    showEmptyState();
  }
}

/**
 * Display metrics in their respective sections
 * @param {Object} metrics - The metrics data
 */
function displayMetrics(metrics) {
  // Render Polymarket metrics
  const polymarketContainer = document.getElementById('polymarketMetrics');
  if (polymarketContainer) {
    renderMetrics(polymarketContainer, metrics.polymarket || [], 'polymarket');
  }

  // Render Stock metrics
  const stockContainer = document.getElementById('stockMetrics');
  if (stockContainer) {
    renderMetrics(stockContainer, metrics.stocks || [], 'stock');
  }

  // Render Economic metrics
  const economicContainer = document.getElementById('economicMetrics');
  if (economicContainer) {
    renderMetrics(economicContainer, metrics.economic || [], 'economic');
  }
}

/**
 * Update the last update timestamp display
 * @param {number|null} timestamp - The last update timestamp
 */
function updateLastUpdateTime(timestamp) {
  const updateTimeElement = document.getElementById('updateTime');
  if (updateTimeElement) {
    updateTimeElement.textContent = formatTimestamp(timestamp);
  }
}

/**
 * Setup event listeners for buttons
 */
function setupEventListeners() {
  // Refresh button
  const refreshBtn = document.getElementById('refreshBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', handleRefresh);
  }

  // Settings button
  const settingsBtn = document.getElementById('settingsBtn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', openSettings);
  }

  // Empty state settings button
  const emptyStateSettingsBtn = document.getElementById('emptyStateSettingsBtn');
  if (emptyStateSettingsBtn) {
    emptyStateSettingsBtn.addEventListener('click', openSettings);
  }
}

/**
 * Handle manual refresh
 */
async function handleRefresh() {
  try {
    disableRefreshButton();

    // Send message to service worker to fetch metrics
    const response = await chrome.runtime.sendMessage({ action: 'fetchMetrics' });

    if (response && response.success) {
      // Wait a brief moment for storage to update
      await new Promise(resolve => setTimeout(resolve, 500));

      // Reload and display metrics
      await loadAndDisplayMetrics();
    } else {
      console.error('Refresh failed:', response?.error);
    }
  } catch (error) {
    console.error('Error during refresh:', error);
  } finally {
    enableRefreshButton();
  }
}

/**
 * Open settings page
 */
function openSettings() {
  chrome.runtime.openOptionsPage();
}

// Listen for storage changes to auto-update display
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local') {
    // Reload metrics when storage changes
    loadAndDisplayMetrics();
  }
});
