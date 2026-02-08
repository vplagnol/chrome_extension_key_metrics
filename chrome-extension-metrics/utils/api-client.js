import { API_CONFIG, REQUEST_TIMEOUT } from '../config/config.js';

// Generic fetch wrapper with timeout and error handling
async function fetchWithTimeout(url, options = {}, timeout = REQUEST_TIMEOUT) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}

// Calculate percentage change between current and previous values
function calculateChange(current, previous) {
  if (!previous || previous === 0) return 0;
  return ((current - previous) / Math.abs(previous)) * 100;
}

// ==================== POLYMARKET API ====================

/**
 * Find the market with the highest probability from an event's markets array.
 * For binary markets (1 market), returns that market's first outcome price.
 * For multi-choice markets (many markets), finds the leading option.
 * Returns { market, probability, topOutcome, isMultiChoice }
 */
function findTopMarket(markets) {
  const isMultiChoice = markets.length > 1;
  let bestMarket = markets[0];
  let bestProbability = 0;
  let topOutcome = null;

  for (const market of markets) {
    let prob = 0;

    if (market.outcomePrices) {
      try {
        const prices = JSON.parse(market.outcomePrices);
        if (Array.isArray(prices) && prices.length > 0) {
          prob = parseFloat(prices[0]) || 0;
        }
      } catch (e) {
        // ignore parse errors
      }
    } else if (market.outcomes && Array.isArray(market.outcomes) && market.outcomes.length > 0) {
      prob = parseFloat(market.outcomes[0].price) || 0;
    } else if (market.outcomeTokens && Array.isArray(market.outcomeTokens) && market.outcomeTokens.length > 0) {
      prob = parseFloat(market.outcomeTokens[0].price) || 0;
    }

    if (prob > bestProbability) {
      bestProbability = prob;
      bestMarket = market;
      topOutcome = market.groupItemTitle || market.question || null;
    }
  }

  // For binary markets, don't set topOutcome (the title is sufficient)
  if (!isMultiChoice) {
    topOutcome = null;
  }

  return {
    market: bestMarket,
    probability: bestProbability || 0.5,
    topOutcome,
    isMultiChoice
  };
}

export async function fetchPolymarketMetrics(settings, previousMetrics = []) {
  const { polymarketIds } = settings.selectedMetrics;

  // If no markets selected, fetch top active markets as default
  if (!polymarketIds || polymarketIds.length === 0) {
    return await fetchTopPolymarketMarkets(previousMetrics);
  }

  // Fetch specific markets by searching with slug
  const metrics = [];
  for (const slug of polymarketIds) {
    try {
      // Search for event by slug using query parameter
      const searchUrl = `${API_CONFIG.polymarket.baseUrl}/events?slug=${encodeURIComponent(slug)}`;
      const searchData = await fetchWithTimeout(searchUrl);

      let eventData = null;

      // Handle different response formats
      if (Array.isArray(searchData) && searchData.length > 0) {
        eventData = searchData[0];
      } else if (searchData && searchData.data && Array.isArray(searchData.data)) {
        eventData = searchData.data[0];
      } else if (searchData && searchData.slug === slug) {
        // Direct match
        eventData = searchData;
      }

      // Extract market data from the event
      if (eventData && eventData.markets && eventData.markets.length > 0) {
        const { market, probability, topOutcome } = findTopMarket(eventData.markets);
        const marketId = market.conditionId || market.id || slug;
        const previous = previousMetrics.find(m => m.id === marketId);

        console.log(`${slug}: ${(probability * 100).toFixed(1)}%${topOutcome ? ` (${topOutcome})` : ''}`);

        metrics.push({
          id: marketId,
          title: eventData.title || market.question || 'Unknown Market',
          slug: slug,
          probability: probability,
          topOutcome: topOutcome,
          change: calculateChange(probability, previous?.probability),
          timestamp: Date.now()
        });
      } else {
        console.warn(`No market data found for slug: ${slug}`);
      }
    } catch (error) {
      console.error(`Failed to fetch Polymarket market ${slug}:`, error.message);
      // Continue with other markets
    }
  }

  if (metrics.length === 0 && polymarketIds.length > 0) {
    console.warn('No Polymarket metrics fetched. Try leaving empty for top 5 active markets.');
  }

  return metrics;
}

// Fetch top active Polymarket markets
async function fetchTopPolymarketMarkets(previousMetrics = []) {
  try {
    const url = `${API_CONFIG.polymarket.baseUrl}${API_CONFIG.polymarket.endpoints.events}?limit=5&active=true`;
    const data = await fetchWithTimeout(url);

    const metrics = [];
    const events = Array.isArray(data) ? data : (data.events || []);

    for (const event of events.slice(0, 5)) {
      if (event.markets && event.markets.length > 0) {
        const { market, probability, topOutcome } = findTopMarket(event.markets);
        const marketId = market.conditionId || market.id;
        const previous = previousMetrics.find(m => m.id === marketId);

        metrics.push({
          id: marketId,
          title: event.title || market.question,
          slug: event.slug,
          probability: probability,
          topOutcome: topOutcome,
          change: calculateChange(probability, previous?.probability),
          timestamp: Date.now()
        });
      }
    }

    return metrics;
  } catch (error) {
    console.error('Failed to fetch Polymarket markets:', error);
    throw new Error(`Polymarket API error: ${error.message}`);
  }
}

// ==================== FINNHUB API ====================

// Common stock/ETF names that might not be in the API or need better labels
const STOCK_NAME_OVERRIDES = {
  'SPY': 'S&P 500 ETF',
  'QQQ': 'Nasdaq 100 ETF',
  'DIA': 'Dow Jones ETF',
  'IWM': 'Russell 2000 ETF',
  'EEM': 'Emerging Markets ETF',
  'EFA': 'EAFE ETF',
  'GLD': 'Gold ETF',
  'SLV': 'Silver ETF',
  'TLT': '20+ Year Treasury ETF',
  'VTI': 'Total Stock Market ETF',
  'VOO': 'S&P 500 ETF',
  '^VIX': 'CBOE Volatility Index',
  '^FTSE': 'FTSE 100 (UK)',
  '^FCHI': 'CAC 40 (France)'
};

export async function fetchStockMetrics(settings, previousMetrics = []) {
  const { stockSymbols } = settings.selectedMetrics;
  const { finnhub: apiKey } = settings.apiKeys;

  if (!apiKey) {
    throw new Error('Finnhub API key not configured');
  }

  if (!stockSymbols || stockSymbols.length === 0) {
    return [];
  }

  const metrics = [];
  for (const symbol of stockSymbols) {
    try {
      // Fetch both quote and profile data in parallel
      const quoteUrl = `${API_CONFIG.finnhub.baseUrl}${API_CONFIG.finnhub.endpoints.quote}?symbol=${symbol}&token=${apiKey}`;
      const profileUrl = `${API_CONFIG.finnhub.baseUrl}${API_CONFIG.finnhub.endpoints.profile}?symbol=${symbol}&token=${apiKey}`;

      const [quoteData, profileData] = await Promise.all([
        fetchWithTimeout(quoteUrl),
        fetchWithTimeout(profileUrl).catch(() => null) // Don't fail if profile fetch fails
      ]);

      // Validate response
      if (!quoteData.c || quoteData.c === 0) {
        throw new Error('Invalid quote data');
      }

      const currentPrice = quoteData.c; // current price
      const previous = previousMetrics.find(m => m.symbol === symbol);
      const change = quoteData.dp || 0; // daily percent change from API

      // Determine display name with priority: override > profile > symbol
      let displayName = symbol;
      let industry = null;
      let country = null;

      if (STOCK_NAME_OVERRIDES[symbol]) {
        displayName = STOCK_NAME_OVERRIDES[symbol];
      } else if (profileData?.name) {
        displayName = profileData.name;
        industry = profileData.finnhubIndustry;
        country = profileData.country;
      }

      console.log(`Stock ${symbol}: name="${displayName}" (profile: ${profileData?.name || 'null'})`);

      metrics.push({
        symbol: symbol,
        name: displayName,
        industry: industry,
        country: country,
        price: currentPrice,
        change: change,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error(`Failed to fetch stock ${symbol}:`, error);
      // Continue with other stocks
    }
  }

  if (metrics.length === 0) {
    throw new Error('No stock data retrieved');
  }

  return metrics;
}

// ==================== FRED API ====================

export async function fetchEconomicMetrics(settings, previousMetrics = []) {
  const { economicSeries } = settings.selectedMetrics;
  const { fred: apiKey } = settings.apiKeys;

  if (!apiKey) {
    throw new Error('FRED API key not configured');
  }

  if (!economicSeries || economicSeries.length === 0) {
    return [];
  }

  const metrics = [];
  for (const series of economicSeries) {
    try {
      const seriesId = typeof series === 'string' ? series : series.id;
      const customName = typeof series === 'string' ? null : series.name;

      // Fetch both series metadata and observations in parallel
      const seriesUrl = `${API_CONFIG.fred.baseUrl}${API_CONFIG.fred.endpoints.series}?series_id=${seriesId}&api_key=${apiKey}&file_type=json`;
      const observationsUrl = `${API_CONFIG.fred.baseUrl}${API_CONFIG.fred.endpoints.observations}?series_id=${seriesId}&api_key=${apiKey}&file_type=json&limit=2&sort_order=desc`;

      const [seriesData, observationsData] = await Promise.all([
        fetchWithTimeout(seriesUrl).catch(() => null),
        fetchWithTimeout(observationsUrl)
      ]);

      // Validate observations response
      if (!observationsData.observations || observationsData.observations.length === 0) {
        throw new Error('No observations available');
      }

      const latest = observationsData.observations[0];
      const previous = observationsData.observations[1];
      const currentValue = parseFloat(latest.value);
      const previousValue = previous ? parseFloat(previous.value) : null;

      // Extract metadata from series info
      const seriesInfo = seriesData?.seriess?.[0];
      // Priority: custom name from config > FRED API title > series ID
      const displayName = customName || seriesInfo?.title || seriesId;
      const units = seriesInfo?.units;
      const frequency = seriesInfo?.frequency_short;

      // Only calculate change if units don't already represent a change/rate
      let change = 0;
      const isAlreadyChangeMetric = units && (
        /growth rate/i.test(units) ||
        /percent change/i.test(units) ||
        /rate of change/i.test(units) ||
        /annual rate/i.test(units) ||
        /percentage points/i.test(units)
      );

      if (!isAlreadyChangeMetric && previousValue) {
        change = calculateChange(currentValue, previousValue);
      }

      // Extract geography/country from title if present
      let geography = null;
      if (seriesInfo?.title) {
        // Look for patterns like "for [Country]", "in [Country]", ": [Country]"
        const forMatch = seriesInfo.title.match(/\bfor\s+([A-Z][a-zA-Z\s]+?)(?:\s*$|,|\()/);
        const inMatch = seriesInfo.title.match(/\bin\s+([A-Z][a-zA-Z\s]+?)(?:\s*$|,|\()/);

        geography = forMatch?.[1]?.trim() || inMatch?.[1]?.trim();

        // Clean up common suffixes
        if (geography) {
          geography = geography.replace(/\s+All\s+Items$/i, '').trim();
        }
      }

      metrics.push({
        series: seriesId,
        name: displayName,
        units: units,
        frequency: frequency,
        geography: geography,
        value: currentValue,
        change: change,
        date: latest.date,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error(`Failed to fetch economic series ${series}:`, error);
      // Continue with other series
    }
  }

  if (metrics.length === 0) {
    throw new Error('No economic data retrieved');
  }

  return metrics;
}

// ==================== FOREX API ====================

export async function fetchForexMetrics(settings, previousMetrics = []) {
  const { forexPairs } = settings.selectedMetrics;

  if (!forexPairs || forexPairs.length === 0) {
    return [];
  }

  const metrics = [];

  // Group pairs by base currency to minimize API calls
  const pairsByBase = {};
  for (const pair of forexPairs) {
    const base = pair.base || 'USD';
    const target = pair.target;
    if (!pairsByBase[base]) {
      pairsByBase[base] = [];
    }
    pairsByBase[base].push(target);
  }

  // Fetch data for each base currency
  for (const [base, targets] of Object.entries(pairsByBase)) {
    try {
      const targetList = targets.join(',');
      const url = `${API_CONFIG.exchangeRate.baseUrl}${API_CONFIG.exchangeRate.endpoints.latest}?from=${base}&to=${targetList}`;
      const data = await fetchWithTimeout(url);

      // Validate response
      if (!data.rates) {
        throw new Error('Invalid forex data');
      }

      // Extract requested target currencies
      for (const target of targets) {
        if (data.rates[target]) {
          const pairId = `${base}/${target}`;
          const currentRate = data.rates[target];
          const previous = previousMetrics.find(m => m.pair === pairId);
          const change = calculateChange(currentRate, previous?.rate);

          metrics.push({
            pair: pairId,
            base: base,
            target: target,
            rate: currentRate,
            change: change,
            timestamp: Date.now()
          });
        } else {
          console.warn(`Exchange rate not available for ${base}/${target}`);
        }
      }
    } catch (error) {
      console.error(`Failed to fetch forex data for ${base}:`, error);
      // Continue with other base currencies
    }
  }

  if (metrics.length === 0) {
    throw new Error('No forex data retrieved');
  }

  return metrics;
}
