// Format number as currency (e.g., $1,234.56)
export function formatCurrency(value) {
  if (value === null || value === undefined || isNaN(value)) {
    return '$0.00';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

// Format number as percentage (e.g., +2.34% or -1.23%)
export function formatPercentage(value) {
  if (value === null || value === undefined || isNaN(value)) {
    return '0.00%';
  }
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

// Format probability as percentage (e.g., 65.4%)
export function formatProbability(value) {
  if (value === null || value === undefined || isNaN(value)) {
    return '0.0%';
  }
  // Convert to percentage (assuming value is 0-1 range)
  const percentage = value > 1 ? value : value * 100;
  return `${percentage.toFixed(1)}%`;
}

// Format large numbers with abbreviations (e.g., 1.2M, 3.4B)
export function formatLargeNumber(value) {
  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }

  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (absValue >= 1_000_000_000) {
    return `${sign}${(absValue / 1_000_000_000).toFixed(2)}B`;
  }
  if (absValue >= 1_000_000) {
    return `${sign}${(absValue / 1_000_000).toFixed(2)}M`;
  }
  if (absValue >= 1_000) {
    return `${sign}${(absValue / 1_000).toFixed(2)}K`;
  }
  return `${sign}${absValue.toFixed(2)}`;
}

// Format timestamp as relative time (e.g., "2 minutes ago")
export function formatTimestamp(timestamp) {
  if (!timestamp) {
    return 'Never';
  }

  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) {
    return 'Just now';
  }
  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  }
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

// Format date string (e.g., "Jan 15, 2026")
export function formatDate(dateString) {
  if (!dateString) {
    return 'Unknown';
  }

  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  } catch (error) {
    return dateString;
  }
}

// Get CSS class for change value (positive/negative/neutral)
export function getChangeClass(value) {
  if (value > 0) return 'positive';
  if (value < 0) return 'negative';
  return 'neutral';
}

// Format change with color indicator
export function formatChangeWithColor(value) {
  const formatted = formatPercentage(value);
  const colorClass = getChangeClass(value);
  return { formatted, colorClass };
}

// Truncate long text with ellipsis
export function truncateText(text, maxLength = 50) {
  if (!text || text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - 3) + '...';
}
