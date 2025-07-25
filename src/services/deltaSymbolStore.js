import { broadcastAllFuturesDataToUsers, broadcastFuturesSymbolDataToUsers,broadcastDashboardDataToUsers} from './userStreamHandler.js';
import { broadcastPositionData } from './subscriptionHandler.js';
// import { broadcastPositionData } from './userStreamHandler.js'; 
import { broadcastOrderTracking } from './orderTrackingHandlers.js';

import { userConnections, positionConnections, orderTrackingConnections } from '../server.js';

const deltaStore = new Map(); // Map<symbol, data>


export function storeDeltaSymbolData(symbol, symbolData) {
  deltaStore.set(symbol, symbolData);

  // ✅ Broadcast to users subscribed to all futures
  broadcastAllFuturesDataToUsers(userConnections, symbol, symbolData);
  
  // ✅ Broadcast to users subscribed to specific futures_symbol
  broadcastFuturesSymbolDataToUsers(userConnections, symbol, symbolData);
  
  // ✅ Broadcast to dashboard users
  broadcastDashboardDataToUsers(userConnections, symbol, symbolData);


  broadcastPositionData( positionConnections, symbol, symbolData, 'position');
  // broadcastOrderTracking(symbol, orderTrackingConnections, symbolData, 'order-tracking-data');
  // broadcastOrderTracking(symbol, orderTrackingConnections, symbolData, 'order-tracking-data');
  broadcastOrderTracking(symbol, orderTrackingConnections, symbolData, 'order-tracking-data');

}


export function getDeltaSymbolData(symbol) {
  return deltaStore.get(symbol);
}


export function getAllDeltaSymbols() {
  return [...deltaStore.keys()];
}


export function getFullDeltaMap() {
  return Object.fromEntries(deltaStore);
}
