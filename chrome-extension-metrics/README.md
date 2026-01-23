# Market Metrics Tracker - Chrome Extension

A Chrome extension that tracks Polymarket prediction markets, stock prices, and economic indicators in real-time.

## Features

- **Polymarket Integration**: Track prediction market probabilities for any event
- **Stock Prices**: Monitor real-time stock quotes from major exchanges
- **Economic Indicators**: Follow key economic data from the Federal Reserve (FRED)
- **Auto-Refresh**: Updates every 5 minutes (configurable)
- **Manual Refresh**: Click to update metrics immediately
- **Change Tracking**: See percentage changes with color-coded indicators
- **Customizable**: Choose exactly which metrics to track

## Installation

### Step 1: Extract the Extension

1. Extract the `chrome-extension-metrics.zip` file to a folder on your computer
2. Remember the location of this folder

### Step 2: Load into Chrome

1. Open Google Chrome
2. Navigate to `chrome://extensions/`
3. Enable **"Developer mode"** (toggle in the top-right corner)
4. Click the **"Load unpacked"** button
5. Select the extracted `chrome-extension-metrics` folder
6. The extension should now appear in your extensions list

### Step 3: Get API Keys

You'll need free API keys from two services:

#### Finnhub (for stock prices)
1. Visit [finnhub.io/register](https://finnhub.io/register)
2. Sign up for a free account
3. Copy your API key from the dashboard

#### FRED (for economic data)
1. Visit [fred.stlouisfed.org/docs/api/api_key.html](https://fred.stlouisfed.org/docs/api/api_key.html)
2. Request an API key (requires email address)
3. Check your email for the API key

### Step 4: Configure Settings

1. Go to `chrome://extensions/`
2. Find "Market Metrics Tracker"
3. Click **"Extension options"** or click the settings gear icon in the popup
4. Enter your API keys:
   - Paste your Finnhub API key
   - Paste your FRED API key
5. (Optional) Click **"Validate API Keys"** to test them
6. Configure your metrics (see Configuration section below)
7. Click **"Save Settings"**

## Configuration

### Polymarket Markets

Track prediction market probabilities from Polymarket.

**How to configure:**
- Go to [polymarket.com](https://polymarket.com) and find markets you're interested in
- Copy the market slug from the URL (the part after `/event/`)
  - Example URL: `https://polymarket.com/event/will-donald-trump-win-2024`
  - Slug: `will-donald-trump-win-2024`
- Or paste the full URL directly
- Enter one market per line in the textarea
- Leave empty to show top 5 active markets automatically

**Example:**
```
will-the-us-acquire-any-part-of-greenland-in-2026
khamenei-out-as-supreme-leader-of-iran-by-february-28
oscars-2026-best-picture-winner
```

### Stock Symbols

Track real-time stock prices.

**How to configure:**
- Enter stock ticker symbols separated by commas
- Use standard ticker symbols (e.g., AAPL, GOOGL, MSFT)

**Popular symbols:**
- **SPY** - S&P 500 ETF
- **QQQ** - Nasdaq 100 ETF
- **EEM** - Emerging Markets ETF
- **GLD** - Gold ETF
- **AAPL** - Apple Inc.
- **GOOGL** - Alphabet (Google)
- **MSFT** - Microsoft

**Example:**
```
SPY, EEM, AAPL, GOOGL, MSFT
```

### Economic Indicators

Track economic data from the Federal Reserve.

**How to configure:**
- Enter FRED series IDs (one per line)
- Find series at [fred.stlouisfed.org](https://fred.stlouisfed.org)
- Search for an indicator and use the series ID from the URL

**Popular indicators:**
- **GDP** - US GDP Growth
- **UNRATE** - Unemployment Rate
- **CPIAUCSL** - Consumer Price Index (inflation)
- **FEDFUNDS** - Federal Funds Rate
- **DGS10** - 10-Year Treasury Yield
- **DGS2** - 2-Year Treasury Yield
- **MORTGAGE30US** - 30-Year Mortgage Rate
- **DCOILWTICO** - Crude Oil Prices

**Example:**
```
GDP
UNRATE
CPIAUCSL
FEDFUNDS
DGS10
```

### Update Frequency

Set how often the extension fetches new data (1-60 minutes).
- Default: 5 minutes
- Lower values use more API calls
- Recommended: 5-10 minutes

## Usage

### Viewing Metrics

1. Click the extension icon in your Chrome toolbar
2. The popup shows all your configured metrics
3. Green/red indicators show if values increased or decreased
4. "Last updated" timestamp shows data freshness

### Manual Refresh

1. Click the refresh icon (circular arrow) in the popup header
2. Metrics update immediately without waiting for the scheduled interval

### Changing Settings

1. Click the settings icon (gear) in the popup header
2. Or right-click the extension icon → "Options"
3. Modify your configuration
4. Click "Save Settings"
5. The extension fetches new data immediately

## Features in Detail

### Color-Coded Changes

- **Green (+)**: Value increased
- **Red (−)**: Value decreased
- **Gray**: No change or insufficient data

### Automatic Updates

- Extension fetches data in the background every 5 minutes (or your configured interval)
- Data is cached, so opening the popup is instant
- Service worker ensures reliable background updates

### Error Handling

- If an API fails, the extension shows an error message
- Other metrics continue to work
- Errors clear automatically on next successful fetch

### Data Privacy

- All API keys are stored locally in Chrome's encrypted storage
- No data is sent to third parties except the configured APIs
- Extension runs entirely in your browser

## Troubleshooting

### "No Metrics Available"

**Solution:**
1. Check that API keys are entered correctly in settings
2. Click "Validate API Keys" to test them
3. Ensure you've selected at least one metric in each category
4. Check the service worker console for error messages

### API Key Invalid

**Solution:**
1. Go to the API provider's website and verify your key
2. Make sure you copied the entire key without extra spaces
3. Some APIs have usage limits - check if you've exceeded them

### Markets Not Loading

**Solution:**
1. Verify the market slug is correct by visiting the Polymarket URL
2. Try leaving the Polymarket field empty to show top markets
3. Check service worker console for specific error messages

### Checking Service Worker Console

1. Go to `chrome://extensions/`
2. Find "Market Metrics Tracker"
3. Click "Service worker" link
4. Check console for error messages

## API Rate Limits

**Free tier limits:**
- **Finnhub**: 60 calls/minute, 30 calls/day for US stocks
- **FRED**: 120 requests/minute
- **Polymarket**: No authentication required, generous limits

**Tip:** With 5-minute updates and default settings, you'll stay well within limits.

## Uninstalling

1. Go to `chrome://extensions/`
2. Find "Market Metrics Tracker"
3. Click "Remove"
4. Confirm deletion

All settings and cached data will be removed from your browser.

## Technical Details

- **Manifest Version**: 3 (latest Chrome extension standard)
- **Permissions**: Alarms (for scheduling), Storage (for caching)
- **APIs Used**: Polymarket Gamma API, Finnhub, FRED
- **Update Mechanism**: Chrome Alarms API with service worker
- **Storage**: Chrome Storage API (encrypted at rest)

## Credits

Built with vanilla JavaScript and Chrome Extension Manifest V3.

## Support

For issues or questions:
1. Check the service worker console for error messages
2. Verify API keys are valid
3. Ensure you have a stable internet connection
4. Try reloading the extension in `chrome://extensions/`

## License

This extension is provided as-is for personal use.

## Version

**v1.0.0** - Initial release

---

**Enjoy tracking your metrics!**
