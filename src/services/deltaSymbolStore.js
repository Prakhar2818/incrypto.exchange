import {
  // broadcastAllFuturesDataToUsers,
  // broadcastFuturesSymbolDataToUsers,
  broadcastDashboardDataToUsers,
  userSubscriptions,
} from "./userStreamHandler.js";
import { broadcastPositionData } from "./subscriptionHandler.js";
// import { broadcastPositionData } from './userStreamHandler.js';
import { broadcastOrderTracking } from "./orderTrackingHandlers.js";

import {
  userConnections,
  positionConnections,
  orderTrackingConnections,
} from "../../server.js";

const deltaStore = new Map(); // Map<symbol, data>
function normalizeToBinanceSymbol(symbol) {
  if (!symbol) return "";
  return symbol.endsWith("USDT") ? symbol : symbol.replace("USD", "USDT");
}

export function storeDeltaSymbolData(symbol, symbolData) {
  const normalizedSymbol = normalizeToBinanceSymbol(symbol);
  deltaStore.set(normalizedSymbol, symbolData); // Store with normalized key

  broadcastDashboardDataToUsers(userConnections, symbol, symbolData);
  broadcastPositionData(positionConnections, symbol, symbolData, "position");
  broadcastOrderTracking(symbol, orderTrackingConnections, symbolData, "order-tracking-data");

  // ✅ Trigger broadcast for futures and futures_symbol users
  getDeltaSymbolData(normalizedSymbol); // Pass normalized symbol
}

export function getDeltaSymbolData(symbol) {
  const normalizedSymbol = normalizeToBinanceSymbol(symbol);
  const symbolData = deltaStore.get(normalizedSymbol); // Get with normalized key

  if (symbolData) {
    for (const [userId, ws] of userConnections) {
      if (ws.readyState !== 1) continue;
      const catMap = userSubscriptions.get(userId);
      if (!catMap) continue;

      // Iterate through all categories for this user
      for (const [category, symbolSet] of catMap.entries()) {
        let shouldBroadcast = false;
        let dataToSend = symbolData;

        if (category === "futures") {
          shouldBroadcast = true;
          dataToSend = {
            high: symbolData?.high,
            low: symbolData?.low,
            underlying_asset_symbol: symbolData?.underlying_asset_symbol,
            mark_price: symbolData?.mark_price,
            mark_change_24h: symbolData?.mark_change_24h,
            description: symbolData?.description?.replace(/Perpetual/gi, "").trim(),
          };
        } else if (category === "futures_symbol") {
          shouldBroadcast = true;
          dataToSend = {
            high: symbolData?.high,
            low: symbolData?.low,
            underlying_asset_symbol: symbolData?.underlying_asset_symbol,
            mark_price: symbolData?.mark_price,
            mark_change_24h: symbolData?.mark_change_24h,
            description: symbolData?.description?.replace(/Perpetual/gi, "").trim(),
          };
        } else if (category === "dashboard") {
          const DASHBOARD_SYMBOLS = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "XRPUSDT", "BNBUSDT", "ADAUSDT"];
          if (DASHBOARD_SYMBOLS.includes(normalizedSymbol)) {
            shouldBroadcast = true;
            dataToSend = {
              high: symbolData?.high,
              low: symbolData?.low,
              mark_price: symbolData?.mark_price,
              mark_change_24h: symbolData?.mark_change_24h,
              volume: symbolData?.volume,
            };
          }
        } else if (symbolSet.has(normalizedSymbol)) {
          shouldBroadcast = true;
        }

        if (shouldBroadcast) {
          ws.send(JSON.stringify({
            type: "symbol-update",
            category: category,
            symbol: symbol.replace("USDT", "USD"),
            data: dataToSend,
          }));
        }
      }
    }
  }

  return symbolData;
}

export function getAllDeltaSymbols() {
  return [...deltaStore.keys()];
}

export function getFullDeltaMap() {
  return Object.fromEntries(deltaStore);
}
