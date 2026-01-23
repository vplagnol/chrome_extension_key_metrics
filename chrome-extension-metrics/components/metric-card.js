import {
  formatCurrency,
  formatPercentage,
  formatProbability,
  getChangeClass
} from '../utils/formatters.js';

/**
 * Creates a metric card element
 * @param {Object} metric - The metric data
 * @param {string} type - The type of metric ('polymarket', 'stock', 'economic')
 * @returns {HTMLElement} The metric card element
 */
export function createMetricCard(metric, type) {
  const card = document.createElement('div');
  card.className = 'metric-card';

  const metricInfo = document.createElement('div');
  metricInfo.className = 'metric-info';

  const metricName = document.createElement('div');
  metricName.className = 'metric-name';

  const metricValues = document.createElement('div');
  metricValues.className = 'metric-values';

  // Customize based on metric type
  switch (type) {
    case 'polymarket':
      metricName.textContent = metric.title;

      const probability = document.createElement('div');
      probability.className = 'metric-value';
      probability.textContent = formatProbability(metric.probability);
      metricValues.appendChild(probability);

      // Make Polymarket cards clickable
      card.classList.add('clickable');
      card.style.cursor = 'pointer';
      card.addEventListener('click', () => {
        const url = `https://polymarket.com/event/${metric.slug}`;
        chrome.tabs.create({ url });
      });
      break;

    case 'stock':
      metricName.textContent = metric.symbol;

      if (metric.name && metric.name !== metric.symbol) {
        const subtitle = document.createElement('div');
        subtitle.className = 'metric-subtitle';
        subtitle.textContent = metric.name;
        metricInfo.appendChild(metricName);
        metricInfo.appendChild(subtitle);
      } else {
        metricInfo.appendChild(metricName);
      }

      const price = document.createElement('div');
      price.className = 'metric-value';
      price.textContent = formatCurrency(metric.price);
      metricValues.appendChild(price);

      // Make stock cards clickable
      card.classList.add('clickable');
      card.style.cursor = 'pointer';
      card.addEventListener('click', () => {
        const url = `https://finance.yahoo.com/quote/${metric.symbol}`;
        chrome.tabs.create({ url });
      });
      break;

    case 'economic':
      metricName.textContent = metric.name;

      if (metric.date) {
        const subtitle = document.createElement('div');
        subtitle.className = 'metric-subtitle';
        subtitle.textContent = metric.date;
        metricInfo.appendChild(metricName);
        metricInfo.appendChild(subtitle);
      } else {
        metricInfo.appendChild(metricName);
      }

      const value = document.createElement('div');
      value.className = 'metric-value';
      value.textContent = metric.value.toFixed(2);
      metricValues.appendChild(value);

      // Make economic indicator cards clickable
      card.classList.add('clickable');
      card.style.cursor = 'pointer';
      card.addEventListener('click', () => {
        const url = `https://fred.stlouisfed.org/series/${metric.series}`;
        chrome.tabs.create({ url });
      });
      break;
  }

  // Add change indicator if available
  if (metric.change !== undefined && metric.change !== null) {
    const change = document.createElement('div');
    change.className = `metric-change ${getChangeClass(metric.change)}`;
    change.textContent = formatPercentage(metric.change);
    metricValues.appendChild(change);
  }

  // Append metricName to metricInfo if not already appended
  if (!metricInfo.querySelector('.metric-name')) {
    metricInfo.appendChild(metricName);
  }

  card.appendChild(metricInfo);
  card.appendChild(metricValues);

  return card;
}

/**
 * Clears and populates a container with metric cards
 * @param {HTMLElement} container - The container element
 * @param {Array} metrics - Array of metric data
 * @param {string} type - The type of metrics
 */
export function renderMetrics(container, metrics, type) {
  // Clear existing content
  container.innerHTML = '';

  // Check if metrics array is empty
  if (!metrics || metrics.length === 0) {
    const emptyMessage = document.createElement('div');
    emptyMessage.className = 'empty-message';
    emptyMessage.textContent = 'No metrics available';
    emptyMessage.style.padding = '12px';
    emptyMessage.style.color = 'var(--text-muted)';
    emptyMessage.style.fontSize = '13px';
    emptyMessage.style.textAlign = 'center';
    container.appendChild(emptyMessage);
    return;
  }

  // Create and append metric cards
  metrics.forEach(metric => {
    const card = createMetricCard(metric, type);
    container.appendChild(card);
  });
}
