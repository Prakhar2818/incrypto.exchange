


import { broadcastToUsers } from './userStreamHandler.js';
// broadcastPositionData
import { userConnections, positionConnections, orderTrackingConnections } from '../server.js';
import { broadcastPositionData } from './subscriptionHandler.js';
import { broadcastOrderTracking } from './orderTrackingHandlers.js';

const fullStore = new Map(); // Map<currency, Map<date, Map<symbol, data>>>

function ensureNestedMap(currency, date) {
  if (!fullStore.has(currency)) fullStore.set(currency, new Map());
  const dateMap = fullStore.get(currency);
  if (!dateMap.has(date)) dateMap.set(date, new Map());
  return dateMap.get(date);
}

export function storeSymbolDataByDate(currency, date, symbol, symbolData) {
  const symbolMap = ensureNestedMap(currency, date);
  symbolMap.set(symbol, symbolData);
  
  // Broadcast updates to other modules/streams
  broadcastToUsers(userConnections, currency, date, symbol, symbolData, 'option_chain');
  broadcastToUsers(userConnections, currency, date, symbol, symbolData, 'option_chain_symbol');
  broadcastPositionData(positionConnections, symbol, symbolData, 'position');

  // Broadcast order tracking data continuously for updated symbol
  broadcastOrderTracking(symbol, orderTrackingConnections, symbolData,'order-tracking-data');
}

export function getSymbolDataByDate(currency, date, symbol) {
  return fullStore.get(currency)?.get(date)?.get(symbol);
}

export function getAllSymbolDataByDate(currency, date) {
  const symbols = fullStore.get(currency)?.get(date);
  return symbols ? Object.fromEntries(symbols) : {};
}

export function getAllDates(currency) {
  return [...(fullStore.get(currency)?.keys() || [])];
}

export function getFullSymbolDataMap() {
  return fullStore;
}

export function getDatesByCurrency(currency) {
  if (!currency) return { error: 'Currency is required' };
  const dates = getAllDates(currency);
  return { currency, dates };
}




