import { STORAGE_KEYS, DEFAULT_SETTINGS } from '../config/config.js';

// Save metrics data to storage
export async function saveMetrics(metrics) {
  await chrome.storage.local.set({
    [STORAGE_KEYS.METRICS]: metrics,
    [STORAGE_KEYS.LAST_UPDATE]: Date.now()
  });
}

// Get metrics data from storage
export async function getMetrics() {
  const result = await chrome.storage.local.get([
    STORAGE_KEYS.METRICS,
    STORAGE_KEYS.LAST_UPDATE
  ]);
  return {
    metrics: result[STORAGE_KEYS.METRICS] || {
      polymarket: [],
      stocks: [],
      forex: [],
      economic: []
    },
    lastUpdate: result[STORAGE_KEYS.LAST_UPDATE] || null
  };
}

// Save error information to storage
export async function saveError(errorType, error) {
  const { errors = {} } = await chrome.storage.local.get(STORAGE_KEYS.ERRORS);
  errors[errorType] = error ? error.message || String(error) : null;
  await chrome.storage.local.set({ [STORAGE_KEYS.ERRORS]: errors });
}

// Get errors from storage
export async function getErrors() {
  const { errors } = await chrome.storage.local.get(STORAGE_KEYS.ERRORS);
  return errors || { polymarket: null, stocks: null, forex: null, economic: null };
}

// Clear all errors
export async function clearErrors() {
  await chrome.storage.local.set({
    [STORAGE_KEYS.ERRORS]: { polymarket: null, stocks: null, forex: null, economic: null }
  });
}

// Get settings from storage
export async function getSettings() {
  const { settings } = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
  return settings || DEFAULT_SETTINGS;
}

// Save settings to storage
export async function saveSettings(settings) {
  await chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: settings });
}

// Initialize storage with default values
export async function initializeStorage() {
  const { settings } = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
  if (!settings) {
    await saveSettings(DEFAULT_SETTINGS);
  }
}

// Clear all storage (for debugging/reset)
export async function clearAllStorage() {
  await chrome.storage.local.clear();
}
