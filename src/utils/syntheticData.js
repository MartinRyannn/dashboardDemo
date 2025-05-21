// Utility functions to generate synthetic data for the dashboard

// Static gold price data for the main chart
let staticGoldData = null;

// Generate realistic gold price data - completely static after first generation
export const generateGoldPriceData = (dataPoints = 100, startPrice = 2100) => {
  // If we already have static data, just return it
  if (staticGoldData && staticGoldData.length >= dataPoints) {
    return staticGoldData;
  }
  
  // Generate static data for the main chart with more realistic price movements
  const data = [];
  let currentPrice = startPrice;
  const currentTime = new Date();
  
  // Create a more realistic price pattern with trends and reversals
  const trendPatterns = [
    { direction: 1, length: Math.floor(Math.random() * 10) + 15 },  // Uptrend
    { direction: -1, length: Math.floor(Math.random() * 10) + 10 }, // Downtrend
    { direction: 1, length: Math.floor(Math.random() * 10) + 20 },  // Uptrend
    { direction: -1, length: Math.floor(Math.random() * 5) + 5 },   // Small correction
    { direction: 1, length: Math.floor(Math.random() * 15) + 10 },  // Final uptrend
  ];
  
  let patternIndex = 0;
  let pointsInCurrentPattern = 0;
  
  for (let i = 0; i < dataPoints; i++) {
    // Generate a timestamp for each data point (going back in time)
    const timestamp = new Date(currentTime.getTime() - (dataPoints - i) * 60000);
    
    // Switch to next pattern if needed
    if (pointsInCurrentPattern >= trendPatterns[patternIndex].length) {
      patternIndex = (patternIndex + 1) % trendPatterns.length;
      pointsInCurrentPattern = 0;
    }
    
    // Get current trend direction
    const direction = trendPatterns[patternIndex].direction;
    
    // Add more significant price changes (0.2 to 1.5 USD for gold is realistic)
    const baseChange = (Math.random() * 0.8 + 0.2) * direction;
    // Add some noise
    const noise = (Math.random() - 0.5) * 0.3;
    const priceChange = baseChange + noise;
    
    currentPrice = Math.max(currentPrice + priceChange, 1800);
    pointsInCurrentPattern++;
    
    // Calculate some basic indicators
    const open = currentPrice - (Math.random() * 0.5);
    const high = currentPrice + (Math.random() * 1.2);
    const low = currentPrice - (Math.random() * 1.2);
    const close = currentPrice;
    const volume = Math.floor(Math.random() * 1000) + 500;
    
    // Add RSI (Relative Strength Index) - a common indicator for gold trading
    // Make RSI correlate with price direction
    const baseRsi = direction > 0 ? 60 : 40;
    const rsi = Math.min(Math.max(baseRsi + (Math.random() * 20 - 10), 10), 90);
    
    data.push({
      Time: timestamp.toISOString(),
      Open: open.toFixed(2),
      High: high.toFixed(2),
      Low: low.toFixed(2),
      Close: close.toFixed(2),
      Volume: volume,
      RSI: Math.round(rsi)
    });
  }
  
  // Store the static data
  staticGoldData = data;
  return data;
};

// Cache for live price to ensure smooth updates every 1 second
let lastLivePrice = null;
let lastLivePriceTime = 0;
let livePriceUpdateInterval = 1000; // 1 second between updates

// Generate a realistic live price update
export const generateLivePrice = (previousPrice) => {
  const now = Date.now();
  
  // If we've updated the price recently, return the cached value
  if (lastLivePrice !== null && now - lastLivePriceTime < livePriceUpdateInterval) {
    return lastLivePrice;
  }
  
  if (!previousPrice) {
    lastLivePrice = 2100 + (Math.random() - 0.5) * 1.0;
    lastLivePriceTime = now;
    return lastLivePrice;
  }
  
  // More noticeable price changes for the live chart
  // Gold can move by 0.1 to 0.5 in a few seconds during active trading
  const baseChange = (Math.random() - 0.5) * 0.5;
  
  // Add occasional larger moves (10% chance of a bigger move)
  const bigMove = Math.random() < 0.1 ? (Math.random() - 0.5) * 1.0 : 0;
  
  // Combine for final change
  const change = baseChange + bigMove;
  
  // Update the price
  lastLivePrice = previousPrice + change;
  lastLivePriceTime = now;
  return lastLivePrice;
};

// Cache for active trades to maintain consistency
let cachedActiveTrades = null;
let lastTradesGeneratedTime = 0;
let lastPLUpdateTime = 0;

// Generate fake active trades
export const generateActiveTrades = (count = 6) => {
  const now = Date.now();
  
  // Return cached trades with minimal changes
  if (cachedActiveTrades) {
    // Update P/L values every second for the preview
    if (now - lastPLUpdateTime > 1000) {
      // Make very small adjustments to P/L values
      cachedActiveTrades = cachedActiveTrades.map(trade => ({
        ...trade,
        unrealizedPL: (parseFloat(trade.unrealizedPL) + (Math.random() - 0.5) * 0.1).toFixed(2)
      }));
      lastPLUpdateTime = now;
    }
    
    // Only generate completely new trades every 60 seconds
    if (now - lastTradesGeneratedTime < 60000) {
      return cachedActiveTrades;
    }
  }
  
  // Generate new trades if cache is empty or old (after 60 seconds)
  const trades = [];
  const basePrice = 2100 + (Math.random() - 0.5) * 10;
  
  // Generate more trades for the preview (5-7 trades)
  const actualCount = Math.floor(Math.random() * 3) + 5;
  
  // Create a mix of currency pairs
  const pairs = ['XAUUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'NZDUSD'];
  
  for (let i = 0; i < actualCount; i++) {
    const isLong = Math.random() > 0.5;
    const units = isLong ? 
      Math.floor(Math.random() * 5) + 1 : 
      -1 * (Math.floor(Math.random() * 5) + 1);
    
    // Different price ranges for different pairs
    let price;
    const pair = pairs[i % pairs.length];
    
    if (pair === 'XAUUSD') {
      price = (basePrice + (Math.random() - 0.5) * 5).toFixed(2);
    } else if (pair === 'USDJPY') {
      price = (150 + (Math.random() - 0.5) * 2).toFixed(2);
    } else {
      price = (1 + (Math.random() - 0.5) * 0.1).toFixed(4);
    }
    
    const unrealizedPL = (Math.random() - 0.4) * 15; // Slightly biased toward profit
    
    trades.push({
      id: `trade-${now}-${i}`,
      currentUnits: units,
      price: price,
      pair: pair,
      unrealizedPL: unrealizedPL.toFixed(2),
      marginUsed: (Math.abs(units) * 10).toFixed(2)
    });
  }
  
  cachedActiveTrades = trades;
  lastTradesGeneratedTime = now;
  lastPLUpdateTime = now;
  return trades;
};

// Cache for active orders to maintain consistency
let cachedActiveOrders = null;
let lastOrdersGeneratedTime = 0;

// Generate fake active orders
export const generateActiveOrders = (count = 4) => {
  const now = Date.now();
  
  // Return cached orders if they exist and are less than 3 minutes old
  // This makes orders much more stable
  if (cachedActiveOrders && now - lastOrdersGeneratedTime < 180000) {
    return cachedActiveOrders;
  }
  
  // Generate new orders if cache is empty or old
  const orders = [];
  const basePrice = 2100 + (Math.random() - 0.5) * 10;
  
  // Limit to a reasonable number of orders
  const actualCount = Math.min(count, 2);
  
  for (let i = 0; i < actualCount; i++) {
    const isLong = Math.random() > 0.5;
    const units = isLong ? 
      Math.floor(Math.random() * 3) + 1 : 
      -1 * (Math.floor(Math.random() * 3) + 1);
    
    const price = (basePrice + (Math.random() - 0.5) * 8).toFixed(2);
    // Simplified order types - just BUY or SELL
    const type = isLong ? 'BUY' : 'SELL';
    
    orders.push({
      id: `order-${now}-${i}`,
      units: units,
      price: price,
      type: type,
      createdTime: new Date(now - Math.random() * 3600000).toISOString()
    });
  }
  
  cachedActiveOrders = orders;
  lastOrdersGeneratedTime = now;
  return orders;
};

// Cache for trade history to maintain consistency
let cachedTradeHistory = null;
let lastHistoryGeneratedTime = 0;

// Generate trade history
export const generateTradeHistory = (count = 10) => {
  const now = Date.now();
  
  // Return cached history if it exists and is less than 60 seconds old
  if (cachedTradeHistory && now - lastHistoryGeneratedTime < 60000) {
    return cachedTradeHistory;
  }
  
  // Generate new history if cache is empty or old
  const trades = [];
  const basePrice = 2100;
  
  for (let i = 0; i < count; i++) {
    const isLong = Math.random() > 0.5;
    const units = isLong ? 
      Math.floor(Math.random() * 3) + 1 : 
      -1 * (Math.floor(Math.random() * 3) + 1);
    
    const price = (basePrice + (Math.random() - 0.5) * 10).toFixed(2);
    const pl = (Math.random() - 0.4) * 15; // Slightly biased toward profit
    
    trades.push({
      order_id: `hist-${now}-${i}`,
      units: units,
      price: price,
      pl: pl.toFixed(2),
      time: new Date(now - (i * 3600000)).toISOString()
    });
  }
  
  cachedTradeHistory = trades;
  lastHistoryGeneratedTime = now;
  return trades;
};

// Generate pivot points for gold
export const generatePivotPoints = (basePrice = 2100) => {
  return {
    pivot_point: basePrice.toFixed(1),
    s1: (basePrice - 10).toFixed(1),
    s2: (basePrice - 20).toFixed(1),
    r1: (basePrice + 10).toFixed(1),
    r2: (basePrice + 20).toFixed(1)
  };
};

// Cache for balance to prevent too frequent changes
let cachedBalance = null;
let lastBalanceTime = 0;

// Generate static account balance
export const generateBalance = () => {
  // Static balance value
  return "12345.67";
};

// Generate static unrealized P/L (negative)
export const generateUnrealizedPL = () => {
  return "-123.45";
};

// Generate static profit/loss (positive)
export const generateProfitLoss = () => {
  return "678.90";
};

// Generate volatility data
export const generateVolatility = () => {
  return {
    volatility: (Math.random() * 0.5 + 0.1).toFixed(4),
    t_vwap: (2100 + (Math.random() - 0.5) * 5).toFixed(2),
    last_updated: new Date().toISOString()
  };
};

// Generate data collection status
export const generateDataCollectionStatus = (isCollecting = false) => {
  if (!isCollecting) {
    return {
      collectedPoints: 5,
      requiredPoints: 5,
      progressPercent: 100,
      timeRemaining: "00:00",
      isCollecting: false,
      error: null
    };
  }
  
  const collected = Math.floor(Math.random() * 4) + 1;
  const required = 5;
  const percent = (collected / required) * 100;
  const timeRemaining = `00:${(required - collected) * 15}`;
  
  return {
    collectedPoints: collected,
    requiredPoints: required,
    progressPercent: percent,
    timeRemaining: timeRemaining,
    isCollecting: true,
    error: null
  };
};

// Generate current strategy
export const generateCurrentStrategy = () => {
  const strategies = [
    { name: "Momentum", color: "#00ff9d" },
    { name: "Breakout", color: "#ff9d00" },
    { name: "Mean Reversion", color: "#9d00ff" },
    { name: "Trend Following", color: "#ff00ff" }
  ];
  
  return strategies[Math.floor(Math.random() * strategies.length)];
};
