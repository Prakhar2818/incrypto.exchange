import express from 'express';
import { handleSubscribe, handleUnsubscribe, handleCancelWs } from './services/userStreamHandler.js';
import { handleSubscribe1,handleUnsubscribe2,handleCancelPositionWs,triggerPNLUpdate} from './services/subscriptionHandler.js';
import { getDatesByCurrency } from './services/symbolStore.js';
import { subscribeSymbol,unsubscribeSymbol, cancelOrderTrackingWss } from './services/orderTrackingHandlers.js';

const router = express.Router();

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
