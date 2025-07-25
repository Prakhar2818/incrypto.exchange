
import WebSocket from "ws";
import config from "../config/index.js";
import { storeSymbolDataByDate } from './symbolStore.js';
import { extractDateFromSymbol } from '../utils/dateUtils.js';

export function startWebSocketForCurrency(currency, symbols) {
  let reconnectAttempts = 0;
  let ws;

  function connect() {
    ws = new WebSocket(config.wsEndpoint);

    ws.on("open", () => {
      reconnectAttempts = 0;
      console.log(`✅ [${currency}] WebSocket connected`);

      const channels = symbols.map((s) => `ticker.${s}.100ms`);
      ws.send(JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "public/subscribe",
        params: { channels }
      }));
    });

    const symbolDataStore = {};

    ws.on("message", (raw) => {
      try {
        const msg = JSON.parse(raw);
        if (msg.method === "subscription") {
          const data = msg.params.data;
          const symbol = data.instrument_name;
          const date = extractDateFromSymbol(symbol);
          if (!date) return;

          const indexPrice = data.underlying_price;
          const calculations = {};

          ["mark_price", "best_ask_price", "best_bid_price"].forEach((label) => {
            const price = data[label];
            if (price && indexPrice) {
              calculations[label] = {
                value: price * indexPrice,
              };
            }
          });

          symbolDataStore[symbol] = {
            originalData: data,
            calculated: calculations,
          };
          
          // console.log(symbolDataStore[symbol])

          storeSymbolDataByDate(currency, date, symbol, symbolDataStore[symbol]);

          if (symbol === config.targetSymbol) {
            console.log(`\n📊 [${currency}] Stored Full Data for Symbol: ${symbol}`);
            console.log(JSON.stringify(symbolDataStore[symbol], null, 2));
          }
        }
      } catch (err) {
        console.error(`[${currency}] ❌ Failed to parse message:`, err);
      }
    });

    ws.on("close", reconnect);
    ws.on("error", reconnect);
  }

  function reconnect(err) {
    if (err) console.error(`[${currency}] ⚠️ WS error:`, err.message || err);
    const delay = Math.min(5000, 1000 * 2 ** reconnectAttempts);
    reconnectAttempts++;
    console.warn(`[${currency}] 🔁 Reconnecting in ${delay / 1000}s...`);
    setTimeout(connect, delay);
  }

  connect();
}
