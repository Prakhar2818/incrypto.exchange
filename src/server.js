import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import userWsRouter from './userWsRouter.js';
import { fetchAndSaveSymbolsByCurrency, readSymbolsFromCSVsByCurrency } from './services/fetchSymbols.js';
import { startDeltaWebSocket } from './services/deltaWsHandler.js';
import { startWebSocketForCurrency } from './services/wsHandler.js';
import config from './config/index.js';
import { clearCSVs } from './utils/fileUtils.js';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use('/', userWsRouter);

// Initialization logic - run once per cold start
let initialized = false;
async function initializeSymbolAndWebSocket() {
  try {
    console.log('🧹 Clearing CSV files...');
    const csvFolderPath = path.resolve('./data');
    clearCSVs(csvFolderPath);

    console.log('🚀 Starting Deribit Symbol Service...');
    for (const currency of config.currencies) {
      await fetchAndSaveSymbolsByCurrency(currency);
      const symbols = await readSymbolsFromCSVsByCurrency(currency);
      startWebSocketForCurrency(currency, symbols);
    }
    await startDeltaWebSocket();
  } catch (err) {
    console.error('❌ Error initializing symbols and WebSocket:', err);
  }
}

if (!initialized) {
  initializeSymbolAndWebSocket();
  initialized = true;
}

// Note: WebSocket server is not supported in Vercel serverless functions.
// You may need to move WebSocket handling to a separate service or use a different platform.

// Export the Express app as a Vercel serverless function handler
export default app;
