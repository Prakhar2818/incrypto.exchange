// // utils/symbolUtils.js

// export function isOptionSymbol(symbol) {
//     // Match format like BTC-25MAY25-107000-C
//     return /^[A-Z]+-\d{2}[A-Z]{3}\d{2}-\d+-[CP]$/.test(symbol);
//   }
  
//   export function isFuturesSymbol(symbol) {
//     // Ends with USD
//     return /^[A-Z]+USD$/.test(symbol);
//   }
  
  
//   export function getCurrencyAndDateFromSymbol(symbol) {
//     // Example: BTC-25MAY25-107000-C
//     const parts = symbol.split('-');
//     if (parts.length < 4) return [null, null];
  
//     const currency = parts[0];
//     const date = parts[1];
  
//     return [currency, date];
//   }
  

// utils/symbolUtils.js

export function isOptionSymbol(symbol) {
  // Match format like BTC-25MAY25-107000-C or BTC-4JUL25-102000-C
  return /^[A-Z]+-\d{1,2}[A-Z]{3}\d{2}-\d+-[CP]$/.test(symbol);
}

export function isFuturesSymbol(symbol) {
  // Match format like BTCUSD, ETHUSD
  return /^[A-Z]+USD$/.test(symbol);
}

export function getCurrencyAndDateFromSymbol(symbol) {
  // Extract currency and date part from symbol like BTC-4JUL25-102000-C
  const parts = symbol.split('-');
  if (parts.length < 4) return [null, null];

  const currency = parts[0];
  const date = parts[1]; // Accepts both 4JUL25 and 25JUL25

  return [currency, date];
}