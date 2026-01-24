/**
 * Display error message in a container
 * @param {HTMLElement} container - The error container element
 * @param {string|null} errorMessage - The error message to display (null to hide)
 */
export function displayError(container, errorMessage) {
  if (!errorMessage) {
    container.style.display = 'none';
    container.textContent = '';
    return;
  }

  container.style.display = 'block';
  container.textContent = errorMessage;
}

/**
 * Show all errors in their respective sections
 * @param {Object} errors - Object containing error messages by type
 */
export function displayAllErrors(errors) {
  // Display Polymarket errors
  const polymarketError = document.getElementById('polymarketError');
  if (polymarketError && errors.polymarket) {
    displayError(polymarketError, `Error: ${errors.polymarket}`);
  }

  // Display Stock errors
  const stockError = document.getElementById('stockError');
  if (stockError && errors.stocks) {
    displayError(stockError, `Error: ${errors.stocks}`);
  }

  // Display Forex errors
  const forexError = document.getElementById('forexError');
  if (forexError && errors.forex) {
    displayError(forexError, `Error: ${errors.forex}`);
  }

  // Display Economic errors
  const economicError = document.getElementById('economicError');
  if (economicError && errors.economic) {
    displayError(economicError, `Error: ${errors.economic}`);
  }
}

/**
 * Clear all error messages
 */
export function clearAllErrors() {
  const errorContainers = [
    'polymarketError',
    'stockError',
    'forexError',
    'economicError'
  ];

  errorContainers.forEach(id => {
    const container = document.getElementById(id);
    if (container) {
      displayError(container, null);
    }
  });
}
