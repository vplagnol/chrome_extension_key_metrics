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
      // Display name (or symbol if no name available)
      metricName.textContent = metric.name || metric.symbol;

      // Build subtitle with symbol and additional context
      const subtitleParts = [metric.symbol];

      if (metric.industry) {
        subtitleParts.push(metric.industry);
      }

      if (metric.country) {
        subtitleParts.push(metric.country);
      }

      if (subtitleParts.length > 0 && metric.name && metric.name !== metric.symbol) {
        const subtitle = document.createElement('div');
        subtitle.className = 'metric-subtitle';
        subtitle.textContent = subtitleParts.join(' • ');
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

    case 'forex':
      metricName.textContent = metric.pair;

      const subtitle = document.createElement('div');
      subtitle.className = 'metric-subtitle';
      subtitle.textContent = `1 ${metric.base} = `;
      metricInfo.appendChild(metricName);
      metricInfo.appendChild(subtitle);

      const rate = document.createElement('div');
      rate.className = 'metric-value';
      rate.textContent = `${metric.rate.toFixed(4)} ${metric.target}`;
      metricValues.appendChild(rate);

      // Make forex cards clickable to XE.com
      card.classList.add('clickable');
      card.style.cursor = 'pointer';
      card.addEventListener('click', () => {
        const url = `https://www.xe.com/currencyconverter/convert/?Amount=1&From=${metric.base}&To=${metric.target}`;
        chrome.tabs.create({ url });
      });
      break;

    case 'economic':
      metricName.textContent = metric.name;

      // Build subtitle with geography, frequency and date
      const economicSubtitleParts = [];

      // Add geography/country if available
      if (metric.geography) {
        economicSubtitleParts.push(metric.geography);
      }

      // Expand frequency abbreviations to full words
      if (metric.frequency) {
        const frequencyMap = {
          'D': 'Daily',
          'W': 'Weekly',
          'BW': 'Biweekly',
          'M': 'Monthly',
          'Q': 'Quarterly',
          'SA': 'Semiannual',
          'A': 'Annual'
        };
        const expandedFrequency = frequencyMap[metric.frequency] || metric.frequency;
        economicSubtitleParts.push(expandedFrequency);
      }

      if (metric.date) {
        economicSubtitleParts.push(metric.date);
      }

      if (economicSubtitleParts.length > 0) {
        const subtitle = document.createElement('div');
        subtitle.className = 'metric-subtitle';
        subtitle.textContent = economicSubtitleParts.join(' • ');
        metricInfo.appendChild(metricName);
        metricInfo.appendChild(subtitle);
      } else {
        metricInfo.appendChild(metricName);
      }

      const value = document.createElement('div');
      value.className = 'metric-value';

      // Format value with units if available
      if (metric.units) {
        // Abbreviate common long unit names
        // Order matters: more specific patterns first, then more general ones
        let abbreviatedUnits = metric.units
          .replace(/Billions of Dollars/i, 'Bn USD')
          .replace(/Millions of Dollars/i, 'M USD')
          .replace(/Thousands of Dollars/i, 'K USD')
          // Preserve "annual rate" information for GDP and similar metrics
          // Handle SAAR (Seasonally Adjusted Annual Rate) patterns first
          .replace(/Percent Change at Seasonally Adjusted Annual Rate/i, '% SAAR')
          .replace(/Seasonally Adjusted Annual Rate/i, 'SAAR')
          .replace(/Percent Change at Annual Rate/i, '% ann. rate')
          .replace(/Percent Change from Preceding Period/i, '% chg')
          .replace(/Annualized Rate/i, 'ann. rate')
          .replace(/Annual Rate/i, 'ann. rate')
          .replace(/Growth rate previous period/i, '% chg')
          .replace(/Percent Change from Year Ago/i, '% YoY')
          .replace(/Percent Change/i, '% chg')
          .replace(/Index \d+-?\d*=\d+/i, 'Index')
          .replace(/Percent$/i, '%');

        value.textContent = `${metric.value.toFixed(2)} ${abbreviatedUnits}`;
      } else {
        value.textContent = metric.value.toFixed(2);
      }

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

    // For economic indicators, add frequency context to clarify change type
    let changeText = formatPercentage(metric.change);
    if (type === 'economic' && metric.frequency) {
      const frequencyLabel = {
        'Q': ' QoQ',  // Quarter-over-quarter
        'M': ' MoM',  // Month-over-month
        'A': ' YoY',  // Year-over-year
        'W': ' WoW',  // Week-over-week
        'D': ' DoD'   // Day-over-day
      }[metric.frequency];

      if (frequencyLabel) {
        changeText += frequencyLabel;
      }
    }

    change.textContent = changeText;
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
