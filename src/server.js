// server.js (Updated with restart endpoint)
import express from 'express';
import http from 'http';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import bodyParser from 'body-parser';
import userWsRouter from './userWsRouter.js';
import { fetchAndSaveSymbolsByCurrency, readSymbolsFromCSVsByCurrency } from './services/fetchSymbols.js';
import { startDeltaWebSocket } from './services/deltaWsHandler.js';
import { startWebSocketForCurrency } from './services/wsHandler.js';
import config from './config/index.js';
import { clearCSVs } from './utils/fileUtils.js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use('/', userWsRouter);

import { ensureDir } from './utils/fileUtils.js';

const userConnections = new Map();
const positionConnections = new Map();
const orderTrackingConnections = new Set();

app.set('userConnections', userConnections);
app.set('positionConnections', positionConnections);
app.set('orderTrackingConnections', orderTrackingConnections);

async function initializeSymbolAndWebSocket() {
  try {
    console.log('🧹 Clearing CSV files...');
    const csvFolderPath = path.resolve('/tmp/data');
    ensureDir(csvFolderPath);
    try {
      clearCSVs(csvFolderPath);
    } catch (err) {
      console.error('❌ Error clearing CSV files:', err);
    }

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

let initialized = false;
if (!initialized) {
  initializeSymbolAndWebSocket();
  initialized = true;
}


function handler(req, res) {
  return app(req, res);
}

handler.userConnections = userConnections;
handler.positionConnections = positionConnections;
handler.orderTrackingConnections = orderTrackingConnections;

export default handler;
