import express from 'express';
import { handleSubscribe, handleUnsubscribe, handleCancelWs } from './services/userStreamHandler.js';
import { handleSubscribe1,handleUnsubscribe2,handleCancelPositionWs,triggerPNLUpdate, checkDynamoConnection } from './services/subscriptionHandler.js';
import { getDatesByCurrency } from './services/symbolStore.js';
import { subscribeSymbol,unsubscribeSymbol, cancelOrderTrackingWss } from './services/orderTrackingHandlers.js';

const router = express.Router();

// Root endpoint for basic API information
router.get('/', (req, res) => {
  res.json({
    name: 'Deribit Live Stream API',
    version: '1.0.0',
    status: 'running',
    endpoints: [
      { path: '/', method: 'GET', description: 'API information' },
      { path: '/status', method: 'GET', description: 'Server status and connections' },
      { path: '/subscribe', method: 'POST', description: 'Subscribe to user stream' },
      { path: '/unsubscribe', method: 'POST', description: 'Unsubscribe from user stream' },
      { path: '/cancel-ws', method: 'POST', description: 'Cancel WebSocket connection' },
      { path: '/external-subscribe', method: 'POST', description: 'Subscribe to external data' },
      { path: '/external-unsubscribe', method: 'POST', description: 'Unsubscribe from external data' },
      { path: '/cancel-position-ws', method: 'POST', description: 'Cancel position WebSocket' },
      { path: '/get-subscribe', method: 'POST', description: 'Subscribe to order tracking' },
      { path: '/get-unsubscribe', method: 'POST', description: 'Unsubscribe from order tracking' },
      { path: '/cancel-ordertracking-ws', method: 'POST', description: 'Cancel order tracking WebSocket' },
      { path: '/dates', method: 'POST', description: 'Get available dates by currency' },
      { path: '/triggerPNLUpdate', method: 'POST', description: 'Trigger PNL update' },
      { path: '/symbol-mark-prices', method: 'POST', description: 'Get symbol mark prices' }
    ]
  });
});

router.post('/subscribe', handleSubscribe);
router.post('/unsubscribe', handleUnsubscribe);
router.post('/cancel-ws', handleCancelWs);



router.post('/external-subscribe', handleSubscribe1);
router.post('/external-unsubscribe', handleUnsubscribe2);
router.post('/cancel-position-ws', handleCancelPositionWs);


router.post('/get-subscribe', subscribeSymbol);
router.post('/get-unsubscribe', unsubscribeSymbol);
router.post('/cancel-ordertracking-ws', cancelOrderTrackingWss);


router.post('/dates', (req, res) => {
    const { currency, userId } = req.body;
  
    if (!currency || !userId) {
      return res.status(400).json({ error: 'currency and userId are required' });
    }
  
    const result = getDatesByCurrency(currency); // logic doesn't use userId currently
    res.json(result);
  });

router.post('/triggerPNLUpdate',triggerPNLUpdate)

// Status endpoint to check server health
router.get('/status', async (req, res) => {
  const dynamoStatus = await checkDynamoConnection();
  
  const status = {
    server: 'running',
    time: new Date().toISOString(),
    dynamodb: dynamoStatus ? 'connected' : 'disconnected',
    connections: {
      user: req.app.get('userConnections').size,
      position: req.app.get('positionConnections').size,
      orderTracking: req.app.get('orderTrackingConnections').size
    }
  };
  
  res.json(status);
});


import { isFuturesSymbol, isOptionSymbol, getCurrencyAndDateFromSymbol } from './utils/symbolUtils.js';
import { getDeltaSymbolData } from './services/deltaSymbolStore.js';
import { getSymbolDataByDate } from './services/symbolStore.js';

router.post('/symbol-mark-prices', async (req, res) => {
  const { symbols } = req.body;

  if (!Array.isArray(symbols) || symbols.length === 0) {
    return res.status(400).json({ error: 'symbols array is required' });
  }

  const result = {};

  for (const symbol of symbols) {
    let rawData;

    try {
      if (isFuturesSymbol(symbol)) {
        rawData = getDeltaSymbolData(symbol);
      } else {
        const [currency, date] = getCurrencyAndDateFromSymbol(symbol);
        rawData = getSymbolDataByDate(currency, date, symbol);
      }

      if (!rawData || typeof rawData !== 'object') continue;

      let markPrice = 0;

      if (isFuturesSymbol(symbol)) {
        markPrice = parseFloat(rawData.mark_price || rawData?.quotes?.mark_price || 0);
      } else if (isOptionSymbol(symbol)) {
        markPrice = parseFloat(
          rawData.calculated?.best_ask_price?.value ??
          rawData.originalData?.mark_price ??
          rawData.originalData?.last_price ??
          0
        );
      }

      if (!isNaN(markPrice)) {
        result[symbol] = { mark_price: markPrice };
      }

    } catch (err) {
      console.error(`Error fetching mark price for ${symbol}`, err);
      result[symbol] = { error: 'Failed to fetch data' };
    }
  }

  res.json(result);
});


export default router;
