// import WebSocket from 'ws';
// import fs from 'fs';
// import csv from 'csv-parser';
// import { storeDeltaSymbolData, getFullDeltaMap as getDeltaSymbolDataMap } from './deltaSymbolStore.js';



// const WEBSOCKET_URL = "wss://socket.india.delta.exchange";
// const RECONNECT_INTERVAL = 5000; // 5 seconds

// let ws = null;
// let reconnectTimeout = null;
// let isReconnecting = false;
// let subscribedSymbols = [];

// function readSymbolsFromCSV(filePath) {
//   return new Promise((resolve, reject) => {
//     const symbols = [];
//     fs.createReadStream(filePath)
//       .pipe(csv())
//       .on('data', (row) => {
//         if (row.symbol) symbols.push(row.symbol.trim());
//       })
//       .on('end', () => resolve(symbols))
//       .on('error', (err) => reject(err));
//   });
// }

// function subscribe(ws, channel, symbols) {
//   const payload = {
//     type: "subscribe",
//     payload: {
//       channels: [
//         {
//           name: channel,
//           symbols: symbols
//         }
//       ]
//     }
//   };
//   ws.send(JSON.stringify(payload));
// }

// function setupWebSocketConnection() {
//   ws = new WebSocket(WEBSOCKET_URL);

//   ws.on('open', () => {
//     console.log("🔌 Delta Socket opened");
//     isReconnecting = false;
//     const chunkSize = 50;
//     for (let i = 0; i < subscribedSymbols.length; i += chunkSize) {
//       const chunk = subscribedSymbols.slice(i, i + chunkSize);
//       subscribe(ws, "v2/ticker", chunk);
//     }
//   });

//   ws.on('message', (data) => {
//     try {
//       const parsed = JSON.parse(data);
//       const symbol = parsed?.symbol;
//       storeDeltaSymbolData(symbol, parsed);
//     } catch (err) {
//       console.error("❌ Failed to parse Delta message:", err);
//     }
//   });

//   ws.on('close', (code, reason) => {
//     console.warn(`🔌 Delta Socket closed. Code: ${code}, Reason: ${reason}`);
//     attemptReconnect();
//   });

//   ws.on('error', (error) => {
//     console.error(`❌ Delta Socket error: ${error}`);
//     attemptReconnect();
//   });
// }

// function attemptReconnect() {
//   if (!isReconnecting) {
//     isReconnecting = true;
//     console.log(`🔁 Attempting to reconnect in ${RECONNECT_INTERVAL / 1000}s...`);
//     if (reconnectTimeout) clearTimeout(reconnectTimeout);
//     reconnectTimeout = setTimeout(() => {
//       setupWebSocketConnection();
//     }, RECONNECT_INTERVAL);
//   }
// }

// export async function startDeltaWebSocket() {
//   try {
//     subscribedSymbols = await readSymbolsFromCSV('./symbol_csvs/symbols.csv');
//     setupWebSocketConnection();
//   } catch (error) {
//     console.error("❌ Failed to start Delta WebSocket:", error);
//   }
// }












import WebSocket from 'ws';
import fs from 'fs';
import csv from 'csv-parser';
import {
  storeDeltaSymbolData,
  getFullDeltaMap as getDeltaSymbolDataMap
} from './deltaSymbolStore.js';

const WEBSOCKET_URL = "wss://fstream.binance.com/stream"; // Binance USDT-M Futures
const RECONNECT_INTERVAL = 5000;

let ws = null;
let reconnectTimeout = null;
let isReconnecting = false;
let subscribedSymbols = [];

// Read and convert symbols from CSV (e.g., BTCUSD -> BTCUSDT)
function readSymbolsFromCSV(filePath) {
  return new Promise((resolve, reject) => {
    const symbols = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        if (row.symbol) {
          const binanceSymbol = row.symbol.trim().replace("USD", "USDT").toLowerCase();
          symbols.push(binanceSymbol);
        }
      })
      .on('end', () => resolve(symbols))
      .on('error', (err) => reject(err));
  });
}

// Subscribes to Binance tickers (ticker@symbol)
function subscribe(ws, channel, symbols) {
  const params = symbols.map(sym => `${sym}@ticker`);
  const payload = {
    method: "SUBSCRIBE",
    params,
    id: Date.now()
  };
  ws.send(JSON.stringify(payload));
}

function setupWebSocketConnection() {
  ws = new WebSocket(WEBSOCKET_URL);

  ws.on('open', () => {
    console.log("🔌 Binance Socket opened");
    isReconnecting = false;

    const chunkSize = 100;
    for (let i = 0; i < subscribedSymbols.length; i += chunkSize) {
      const chunk = subscribedSymbols.slice(i, i + chunkSize);
      subscribe(ws, "v2/ticker", chunk); // channel name kept unchanged for compatibility
    }
  });

  // ws.on('message', (data) => {
  //   try {
  //     const parsed = JSON.parse(data);
  //     const ticker = parsed?.data;
  //     if (ticker && ticker.s) {
  //       const symbol = ticker.s;
  //       storeDeltaSymbolData(symbol, ticker);

  //       // 🔍 Log parsed data
  //       if(symbol=="BTCUSDT"){
  //         console.log(`📊 ${symbol} → Price: ${ticker.c} | Change: ${ticker.P}% | Volume: ${ticker.v}`);
  //       }
        
  //     }
  //   } catch (err) {
  //     console.error("❌ Failed to parse Binance message:", err);
  //   }
  // });

  ws.on('message', (data) => {
    try {
      const parsed = JSON.parse(data);
      const ticker = parsed?.data;
  
      if (ticker && ticker.s) {
        const symbol = ticker.s;
  
        // ✅ Normalize Binance ticker format to Delta format
        const normalizedTicker = {
          ...ticker,
          high: ticker.h,
          low: ticker.l,
          mark_price: ticker.c,           // Last price
          mark_change_24h: ticker.P,      // % Change in 24hr
          volume: ticker.v,
          underlying_asset_symbol: symbol.replace("USDT", ""),
          description: `${symbol} Perpetual`
        };
  
        // ✅ Store in Delta format (no change to your store logic)
        storeDeltaSymbolData(symbol, normalizedTicker);
  
        // ✅ Print full data ONLY for USDT pairs
        // if (symbol.endsWith("USDT")) {
        //   console.log(normalizedTicker);
        // }
      }
    } catch (err) {
      console.error("❌ Failed to parse Binance message:", err);
    }
  });
  

  
  ws.on('close', (code, reason) => {
    console.warn(`🔌 Binance Socket closed. Code: ${code}, Reason: ${reason}`);
    attemptReconnect();
  });

  ws.on('error', (error) => {
    console.error(`❌ Binance Socket error: ${error}`);
    attemptReconnect();
  });
}

function attemptReconnect() {
  if (!isReconnecting) {
    isReconnecting = true;
    console.log(`🔁 Attempting to reconnect in ${RECONNECT_INTERVAL / 1000}s...`);
    if (reconnectTimeout) clearTimeout(reconnectTimeout);
    reconnectTimeout = setTimeout(() => {
      setupWebSocketConnection();
    }, RECONNECT_INTERVAL);
  }
}

export async function startDeltaWebSocket() {
  try {
    subscribedSymbols = await readSymbolsFromCSV('./symbol_csvs/symbols.csv');
    console.log("📦 Loaded symbols:", subscribedSymbols.length);
    setupWebSocketConnection();
  } catch (error) {
    console.error("❌ Failed to start Binance WebSocket:", error);
  }
}
