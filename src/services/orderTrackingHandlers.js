
// import { getDeltaSymbolData } from './deltaSymbolStore.js';
// import { getSymbolDataByDate } from './symbolStore.js';
// import { getCurrencyAndDateFromSymbol, isFuturesSymbol, isOptionSymbol } from '../utils/symbolUtils.js';

// // Global Set of tracked symbols
// export const trackedSymbols = new Set();


// function normalizeToBinanceSymbol(symbol) {
//   if (!symbol) return '';
//   return symbol.endsWith('USDT') ? symbol : symbol.replace('USD', 'USDT');
// }

// function isSymbolTrackedFlexible(symbol) {
//   const normalized = normalizeToBinanceSymbol(symbol); // BTCUSDT
//   const fallback = symbol.replace('USDT', 'USD');       // BTCUSD

//   return trackedSymbols.has(symbol) || trackedSymbols.has(normalized) || trackedSymbols.has(fallback);
// }


// function getInternalSymbol(symbol) {
//   if (!symbol || symbol.endsWith('USDT')) return symbol;
//   return symbol.replace('USD', 'USDT');
// }


// // Subscribe a symbol globally
// // export function subscribeSymbol(req, res) {
// //   const { symbol } = req.body;
// //   const connections = req.app.get('orderTrackingConnections'); // Assume Set of WS clients

// //   if (!symbol || typeof symbol !== 'string') {
// //     return res.status(400).send("Missing or invalid symbol");
// //   }

// //   trackedSymbols.add(symbol);

// //   // Immediately broadcast data for this symbol to all connected clients
// //   broadcastOrderTracking(symbol, connections);

// //   res.send(`Subscribed to symbol ${symbol}`);
// // }

// export function subscribeSymbol(req, res) {
//   let { symbol } = req.body;
//   const connections = req.app.get('orderTrackingConnections');

//   if (!symbol || typeof symbol !== 'string') {
//     return res.status(400).send("Missing or invalid symbol");
//   }

//   const internalSymbol = getInternalSymbol(symbol); // Normalize once

//   trackedSymbols.add(symbol);
//   if (internalSymbol !== symbol) {
//     trackedSymbols.add(internalSymbol);
//   }

//   broadcastOrderTracking(symbol, connections);

//   res.send(`Subscribed to symbol ${symbol}`);
// }

// // Unsubscribe a symbol globally
// // export function unsubscribeSymbol(req, res) {
// //   const { symbol } = req.body;
// //   const connections = req.app.get('orderTrackingConnections');

// //   if (!symbol || typeof symbol !== 'string') {
// //     return res.status(400).send("Missing or invalid symbol");
// //   }

// //   if (!trackedSymbols.has(symbol)) {
// //     return res.status(400).send(`Symbol ${symbol} not currently subscribed`);
// //   }

// //   trackedSymbols.delete(symbol);

// //   // Broadcast to all clients that this symbol is unsubscribed
// //   broadcastSymbolUpdate(connections, 'unsubscribed', symbol, null);

// //   res.send(`Unsubscribed from symbol ${symbol}`);
// // }
// export function unsubscribeSymbol(req, res) {
//   let { symbol } = req.body;
//   const connections = req.app.get('orderTrackingConnections');

//   if (!symbol || typeof symbol !== 'string') {
//     return res.status(400).send("Missing or invalid symbol");
//   }

//   symbol = normalizeToBinanceSymbol(symbol); // ✅ Normalize here

//   if (!trackedSymbols.has(symbol)) {
//     return res.status(400).send(`Symbol ${symbol} not currently subscribed`);
//   }

//   trackedSymbols.delete(symbol);

//   broadcastSymbolUpdate(connections, 'unsubscribed', symbol, null);

//   res.send(`Unsubscribed from symbol ${symbol}`);
// }

// // Close all order tracking WebSocket connections
// export function cancelOrderTrackingWss(req, res) {
//     const connections = req.app.get('orderTrackingConnections');
//     console.log(`Closing ${connections.size} orderTracking WebSocket connections...`);
  
//     for (const ws of connections) {
//       ws.close();
  
//       ws.on('close', () => {
//         connections.delete(ws);
//       });
//     }
  
//     // Clear the tracked symbols (reset the tracking state)
//     trackedSymbols.clear();
  
//     // Clear connections after some delay to ensure all closed properly
//     setTimeout(() => {
//       connections.clear();
//       console.log('All order tracking connections and tracked symbols cleared.');
//     }, 2000);
  
//     res.send("All OrderTracking WebSocket connections closed and tracking data cleared.");
//   }

// // Get count of active order tracking WS connections
// export function getOrderTrackingWss(req, res) {
//   const connections = req.app.get('orderTrackingConnections');
//   res.send({ activeConnections: connections.size });
// }


// // Global state: collected mark prices for all symbols
// export const latestBroadcastData = {};

// // export function broadcastOrderTracking(symbol, connections, symbolData = null) {
// //   if (!symbol || !trackedSymbols.has(symbol)) return;

// //   // const rawData = symbolData || (
// //   //   isFuturesSymbol(symbol)
// //   //     ? getDeltaSymbolData(symbol)
// //   //     : getSymbolDataByDate(...getCurrencyAndDateFromSymbol(symbol), symbol)
// //   // );

// //   const normalizedSymbol = normalizeToBinanceSymbol(symbol);

// //   const rawData = symbolData || (
// //     isFuturesSymbol(normalizedSymbol)
// //       ? getDeltaSymbolData(normalizedSymbol) // ✅ switch later to getBinanceFuturesData(normalizedSymbol)
// //       : getSymbolDataByDate(...getCurrencyAndDateFromSymbol(symbol), symbol)
// //   );  



// //   if (!rawData || typeof rawData !== 'object') return;

// //   // Normalize mark price
// //   let markPrice;

// //   if (isFuturesSymbol(symbol)) {
// //     markPrice = parseFloat(rawData.mark_price || rawData?.quotes?.mark_price || 0);
// //   } else if (isOptionSymbol(symbol)) {
// //     // Try calculated.best_ask_price.value first, then fallback to originalData.mark_price
// //     markPrice = parseFloat(
// //       rawData.calculated?.mark_price?.value ??
// //       rawData.originalData?.mark_price ??
// //       rawData.originalData?.last_price ??
// //       0
// //     );
// //   }  

// //   if (!markPrice || isNaN(markPrice)) return;

// //   // Update global object
// //   latestBroadcastData[symbol] = { mark_price: markPrice };

// //   const message = JSON.stringify({
// //     type: 'order-tracking-data',
// //     data: latestBroadcastData
// //   });

// //   for (const ws of connections) {
// //     if (ws.readyState === 1) {
// //       try {
// //         ws.send(message);
// //       } catch (err) {
// //         console.error(`[WS Error] Failed to send for ${symbol}`, err);
// //       }
// //     }
// //   }
// // }

// export function broadcastOrderTracking(symbol, connections, symbolData = null) {
//   const internalSymbol = getInternalSymbol(symbol); // BTCUSDT

//   if (!internalSymbol || (!trackedSymbols.has(symbol) && !trackedSymbols.has(internalSymbol))) {
//     return;
//   }

//   // ✅ Check both variations (BTCUSD or BTCUSDT)
//   const isFutures = isFuturesSymbol(symbol) || isFuturesSymbol(internalSymbol);
//   const isOption = isOptionSymbol(symbol) || isOptionSymbol(internalSymbol);

//   const rawData = symbolData || (
//     isFutures
//       ? getDeltaSymbolData(internalSymbol)
//       : getSymbolDataByDate(...getCurrencyAndDateFromSymbol(symbol), symbol)
//   );

//   if (!rawData || typeof rawData !== 'object') {
//     console.log(`[OrderTracking] No valid data for symbol: ${internalSymbol}`);
//     return;
//   }

//   let markPrice;

//   if (isFutures) {
//     console.log(`[OrderTracking] Handling as Futures symbol`);
//     markPrice = parseFloat(rawData.mark_price || rawData?.quotes?.mark_price || 0);
//   } else if (isOption) {
//     console.log(`[OrderTracking] Handling as Option symbol`);
//     markPrice = parseFloat(
//       rawData.calculated?.mark_price?.value ??
//       rawData.originalData?.mark_price ??
//       rawData.originalData?.last_price ??
//       0
//     );
//   } else {
//     console.log(`[OrderTracking] Unknown symbol type for: ${symbol}`);
//     return;
//   }

//   if (!markPrice || isNaN(markPrice)) {
//     console.log(`[OrderTracking] Invalid markPrice for symbol: ${symbol}`, rawData);
//     return;
//   }

//   console.log(`[OrderTracking] Broadcasting markPrice: ${markPrice} for symbol: ${internalSymbol}`);

//   latestBroadcastData[internalSymbol] = { mark_price: markPrice };

//   const message = JSON.stringify({
//     type: 'order-tracking-data',
//     data: latestBroadcastData
//   });

//   for (const ws of connections) {
//     if (ws.readyState === 1) {
//       try {
//         ws.send(message);
//         console.log(`[OrderTracking] Sent data to client for symbol: ${internalSymbol}`);
//       } catch (err) {
//         console.error(`[WS Error] Failed to send for ${internalSymbol}`, err);
//       }
//     }
//   }
// }



// // Internal function to send JSON data to all connected clients
// function broadcastSymbolUpdate(connections, type, symbol, data) {
//   for (const ws of connections) {
//     if (ws.readyState === 1) { // OPEN state
//       try {
//         ws.send(JSON.stringify({
//           type,
//           symbol,
//           data
//         }));
//       } catch (e) {
//         console.error(`Failed to send WS message for symbol ${symbol}`, e);
//       }
//     }
//   }
// }

// // Broadcast all currently tracked symbols to all clients (optional)
// export function broadcastAllTrackedSymbols(req, res) {
//   const connections = req.app.get('orderTrackingConnections');

//   if (trackedSymbols.size === 0) {
//     return res.send('No tracked symbols to broadcast.');
//   }

//   for (const symbol of trackedSymbols) {
//     broadcastOrderTracking(symbol, connections);
//   }

//   res.send(`Broadcasted all tracked symbols data to ${connections.size} connections`);
// }


import { getDeltaSymbolData } from './deltaSymbolStore.js';
import { getSymbolDataByDate } from './symbolStore.js';
import {
  getCurrencyAndDateFromSymbol,
  isOptionSymbol,
} from '../utils/symbolUtils.js';

// -------------------------
// Global State
// -------------------------
export const trackedSymbols = new Set();
export const latestBroadcastData = {};

// -------------------------
// Helpers
// -------------------------
function normalizeToBinanceSymbol(symbol) {
  if (!symbol) return '';
  return symbol.endsWith('USDT') ? symbol : symbol.replace('USD', 'USDT');
}

function getInternalSymbol(symbol) {
  return normalizeToBinanceSymbol(symbol);
}

function isBinanceFuturesSymbol(symbol) {
  return typeof symbol === 'string' && symbol.endsWith('USDT');
}

// -------------------------
// WebSocket Broadcast Helpers
// -------------------------
function broadcastSymbolUpdate(connections, type, symbol, data) {
  for (const ws of connections) {
    if (ws.readyState === 1) {
      try {
        ws.send(JSON.stringify({ type, symbol, data }));
      } catch (e) {
        console.error(`Failed to send WS message for symbol ${symbol}`, e);
      }
    }
  }
}

// -------------------------
// Public Functions
// -------------------------
export function subscribeSymbol(req, res) {
  let { symbol } = req.body;
  const connections = req.app.get('orderTrackingConnections');

  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).send('Missing or invalid symbol');
  }

  symbol = normalizeToBinanceSymbol(symbol); // Ensure normalized

  trackedSymbols.add(symbol);
  broadcastOrderTracking(symbol, connections);

  res.send(`Subscribed to symbol ${symbol}`);
}

export function unsubscribeSymbol(req, res) {
  let { symbol } = req.body;
  const connections = req.app.get('orderTrackingConnections');

  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).send('Missing or invalid symbol');
  }

  symbol = normalizeToBinanceSymbol(symbol);

  if (!trackedSymbols.has(symbol)) {
    return res.status(400).send(`Symbol ${symbol} not currently subscribed`);
  }

  trackedSymbols.delete(symbol);
  broadcastSymbolUpdate(connections, 'unsubscribed', symbol, null);

  res.send(`Unsubscribed from symbol ${symbol}`);
}

export function cancelOrderTrackingWss(req, res) {
  const connections = req.app.get('orderTrackingConnections');
  console.log(`Closing ${connections.size} orderTracking WebSocket connections...`);

  for (const ws of connections) {
    ws.close();
    ws.on('close', () => connections.delete(ws));
  }

  trackedSymbols.clear();

  setTimeout(() => {
    connections.clear();
    console.log('All order tracking connections and tracked symbols cleared.');
  }, 2000);

  res.send('All OrderTracking WebSocket connections closed and tracking data cleared.');
}

export function getOrderTrackingWss(req, res) {
  const connections = req.app.get('orderTrackingConnections');
  res.send({ activeConnections: connections.size });
}

export function broadcastAllTrackedSymbols(req, res) {
  const connections = req.app.get('orderTrackingConnections');

  if (trackedSymbols.size === 0) {
    return res.send('No tracked symbols to broadcast.');
  }

  for (const symbol of trackedSymbols) {
    broadcastOrderTracking(symbol, connections);
  }

  res.send(`Broadcasted all tracked symbols data to ${connections.size} connections`);
}

// -------------------------
// Core Broadcast Function
// -------------------------
// export function broadcastOrderTracking(symbol, connections, symbolData = null) {
//   const normalized = normalizeToBinanceSymbol(symbol);

//   if (!trackedSymbols.has(normalized)) return;

//   const isFutures = isBinanceFuturesSymbol(normalized);
//   const isOption = isOptionSymbol(normalized);

//   const rawData =
//     symbolData ||
//     (isFutures
//       ? getDeltaSymbolData(normalized)
//       : getSymbolDataByDate(...getCurrencyAndDateFromSymbol(normalized), normalized));

//   if (!rawData || typeof rawData !== 'object') {
//     console.log(`[OrderTracking] No valid data for symbol: ${normalized}`);
//     return;
//   }

//   let markPrice = 0;

//   if (isFutures) {
//     // console.log(`[OrderTracking] Handling as Futures symbol`);
//     markPrice = parseFloat(rawData.mark_price || rawData?.quotes?.mark_price || 0);
//   } else if (isOption) {
//     // console.log(`[OrderTracking] Handling as Option symbol`);
//     markPrice = parseFloat(
//       rawData.calculated?.mark_price?.value ??
//         rawData.originalData?.mark_price ??
//         rawData.originalData?.last_price ??
//         0
//     );
//   } else {
//     console.log(`[OrderTracking] Unknown symbol type for: ${normalized}`);
//     return;
//   }

//   if (!markPrice || isNaN(markPrice)) {
//     console.log(`[OrderTracking] Invalid markPrice for symbol: ${normalized}`, rawData);
//     return;
//   }

//   // console.log(`[OrderTracking] Broadcasting markPrice: ${markPrice} for symbol: ${normalized}`);
//   latestBroadcastData[normalized] = { mark_price: markPrice };

//   const message = JSON.stringify({
//     type: 'order-tracking-data',
//     data: latestBroadcastData,
//   });

//   for (const ws of connections) {
//     if (ws.readyState === 1) {
//       try {
//         ws.send(message);
//         // console.log(`[OrderTracking] Sent data to client for symbol: ${normalized}`);
//       } catch (err) {
//         console.error(`[WS Error] Failed to send for ${normalized}`, err);
//       }
//     }
//   }
// }


export function broadcastOrderTracking(symbol, connections, symbolData = null) {
  const normalized = normalizeToBinanceSymbol(symbol);

  if (!trackedSymbols.has(normalized)) return;

  const isFutures = isBinanceFuturesSymbol(normalized);
  const isOption = isOptionSymbol(normalized);

  const rawData =
    symbolData ||
    (isFutures
      ? getDeltaSymbolData(normalized)
      : getSymbolDataByDate(...getCurrencyAndDateFromSymbol(normalized), normalized));

  if (!rawData || typeof rawData !== 'object') {
    console.log(`[OrderTracking] No valid data for symbol: ${normalized}`);
    return;
  }

  let markPrice = 0;

  if (isFutures) {
    markPrice = parseFloat(rawData.mark_price || rawData?.quotes?.mark_price || 0);
  } else if (isOption) {
    markPrice = parseFloat(
      rawData.calculated?.mark_price?.value ??
      rawData.originalData?.mark_price ??
      rawData.originalData?.last_price ??
      0
    );
  } else {
    console.log(`[OrderTracking] Unknown symbol type for: ${normalized}`);
    return;
  }

  if (!markPrice || isNaN(markPrice)) {
    console.log(`[OrderTracking] Invalid markPrice for symbol: ${normalized}`, rawData);
    return;
  }

  // ✅ Rename key if it's a futures symbol (e.g., BTCUSDT → BTCUSD)
  const broadcastKey = isFutures && normalized.endsWith('USDT')
    ? normalized.replace('USDT', 'USD')
    : normalized;

  latestBroadcastData[broadcastKey] = { mark_price: markPrice };

  const message = JSON.stringify({
    type: 'order-tracking-data',
    data: latestBroadcastData,
  });

  for (const ws of connections) {
    if (ws.readyState === 1) {
      try {
        ws.send(message);
      } catch (err) {
        console.error(`[WS Error] Failed to send for ${broadcastKey}`, err);
      }
    }
  }
}
