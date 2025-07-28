import WebSocket from 'ws';
import fs from 'fs';
import csv from 'csv-parser';
import { storeDeltaSymbolData, getFullDeltaMap as getDeltaSymbolDataMap } from './deltaSymbolStore.js';



const WEBSOCKET_URL = "wss://socket.india.delta.exchange";
const RECONNECT_INTERVAL = 5000; // 5 seconds

let ws = null;
let reconnectTimeout = null;
let isReconnecting = false;
let subscribedSymbols = [];

function readSymbolsFromCSV(filePath) {
  return new Promise((resolve, reject) => {
    const symbols = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        if (row.symbol) symbols.push(row.symbol.trim());
      })
      .on('end', () => resolve(symbols))
      .on('error', (err) => reject(err));
  });
}

function subscribe(ws, channel, symbols) {
  const payload = {
    type: "subscribe",
    payload: {
      channels: [
        {
          name: channel,
          symbols: symbols
        }
      ]
    }
  };
  ws.send(JSON.stringify(payload));
}

function setupWebSocketConnection() {
  ws = new WebSocket(WEBSOCKET_URL);

  ws.on('open', () => {
    console.log("🔌 Delta Socket opened");
    isReconnecting = false;
    const chunkSize = 50;
    for (let i = 0; i < subscribedSymbols.length; i += chunkSize) {
      const chunk = subscribedSymbols.slice(i, i + chunkSize);
      subscribe(ws, "v2/ticker", chunk);
    }
  });

  ws.on('message', (data) => {
    try {
      const parsed = JSON.parse(data);
      const symbol = parsed?.symbol;
      storeDeltaSymbolData(symbol, parsed);
    } catch (err) {
      console.error("❌ Failed to parse Delta message:", err);
    }
  });

  ws.on('close', (code, reason) => {
    console.warn(`🔌 Delta Socket closed. Code: ${code}, Reason: ${reason}`);
    attemptReconnect();
  });

  ws.on('error', (error) => {
    console.error(`❌ Delta Socket error: ${error}`);
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
    setupWebSocketConnection();
  } catch (error) {
    console.error("❌ Failed to start Delta WebSocket:", error);
  }
}












