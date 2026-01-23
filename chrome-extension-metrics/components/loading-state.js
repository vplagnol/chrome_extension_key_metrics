/**
 * Show loading state
 */
export function showLoading() {
  const loadingState = document.getElementById('loadingState');
  const mainContent = document.getElementById('mainContent');
  const emptyState = document.getElementById('emptyState');

  if (loadingState) {
    loadingState.style.display = 'flex';
  }
  if (mainContent) {
    mainContent.style.display = 'none';
  }
  if (emptyState) {
    emptyState.style.display = 'none';
  }
}

/**
 * Hide loading state and show main content
 */
export function hideLoading() {
  const loadingState = document.getElementById('loadingState');
  const mainContent = document.getElementById('mainContent');

  if (loadingState) {
    loadingState.style.display = 'none';
  }
  if (mainContent) {
    mainContent.style.display = 'block';
  }
}

/**
 * Show empty state
 */
export function showEmptyState() {
  const loadingState = document.getElementById('loadingState');
  const mainContent = document.getElementById('mainContent');
  const emptyState = document.getElementById('emptyState');

  if (loadingState) {
    loadingState.style.display = 'none';
  }
  if (mainContent) {
    mainContent.style.display = 'none';
  }
  if (emptyState) {
    emptyState.style.display = 'flex';
  }
}

/**
 * Disable refresh button (during refresh)
 */
export function disableRefreshButton() {
  const refreshBtn = document.getElementById('refreshBtn');
  if (refreshBtn) {
    refreshBtn.disabled = true;
    refreshBtn.style.opacity = '0.5';
    refreshBtn.style.cursor = 'not-allowed';
  }
}

/**
 * Enable refresh button (after refresh completes)
 */
export function enableRefreshButton() {
  const refreshBtn = document.getElementById('refreshBtn');
  if (refreshBtn) {
    refreshBtn.disabled = false;
    refreshBtn.style.opacity = '1';
    refreshBtn.style.cursor = 'pointer';
  }
}
