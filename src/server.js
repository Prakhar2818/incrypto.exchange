
// import express from 'express';
// import http from 'http';
// import cors from 'cors';
// import { WebSocketServer } from 'ws';
// import bodyParser from 'body-parser';
// import userWsRouter from './userWsRouter.js';
// import { fetchAndSaveSymbolsByCurrency, readSymbolsFromCSVsByCurrency } from './services/fetchSymbols.js';
// import { startDeltaWebSocket } from './services/deltaWsHandler.js';
// import { startWebSocketForCurrency } from './services/wsHandler.js';
// import config from './config/index.js';
// import { clearCSVs } from './utils/fileUtils.js';
// import fs from 'fs';
// import path from 'path';
// import dotenv from 'dotenv';
// dotenv.config();

// const app = express();
// app.use(cors());
// app.use(bodyParser.json());

// app.use('/', userWsRouter);

// const server = http.createServer(app);
// const wss = new WebSocketServer({ noServer: true });
// const positionWss = new WebSocketServer({ noServer: true });
// const orderTrackingWss = new WebSocketServer({ noServer: true });

// const userConnections = new Map();
// const positionConnections = new Map();
// const orderTrackingConnections = new Set();

// app.set('userConnections', userConnections);
// app.set('positionConnections', positionConnections);
// app.set('orderTrackingConnections', orderTrackingConnections);

// // Function to initialize symbol and WebSocket logic for each category
// async function initializeSymbolAndWebSocket() {
//   try {
//     console.log('🧹 Clearing CSV files...');
//     const csvFolderPath = path.resolve('./data');
//     clearCSVs(csvFolderPath);

//     console.log('🚀 Starting Deribit Symbol Service...');
//     for (const currency of config.currencies) {
//       await fetchAndSaveSymbolsByCurrency(currency);
//       const symbols = await readSymbolsFromCSVsByCurrency(currency);
//       startWebSocketForCurrency(currency, symbols);
//     }
//     await startDeltaWebSocket();
//   } catch (err) {
//     console.error('❌ Error initializing symbols and WebSocket:', err);
//   }
// }

// initializeSymbolAndWebSocket();

// // WebSocket upgrade handling
// server.on('upgrade', (req, socket, head) => {
//   const url = new URL(req.url, `http://${req.headers.host}`);
//   const userId = url.searchParams.get('userId');
//   const category = url.searchParams.get('category');

//   if (!category) {
//     socket.destroy();
//     return;
//   }

//   if (category === 'position') {
//     if (!userId) return socket.destroy();
//     positionWss.handleUpgrade(req, socket, head, (ws) => {
//       positionConnections.set(userId, ws);
//       console.log(`🔗 [Position - User ${userId}] WebSocket connected`);

//       ws.on('close', () => {
//         positionConnections.delete(userId);
//         console.log(`❌ [Position - User ${userId}] WebSocket closed`);
//       });
//     });
//   } else if (category === 'ordertracking') {
//     orderTrackingWss.handleUpgrade(req, socket, head, (ws) => {
//       orderTrackingConnections.add(ws);
//       console.log('🔗 [OrderTracking] WebSocket connected');

//       ws.on('close', () => {
//         orderTrackingConnections.delete(ws);
//         console.log('❌ [OrderTracking] WebSocket closed');
//       });
//     });
//   } else {
//     if (!userId) return socket.destroy();
//     wss.handleUpgrade(req, socket, head, (ws) => {
//       userConnections.set(userId, ws);
//       console.log(`🔗 [User ${userId}] WebSocket connected`);

//       ws.on('close', () => {
//         userConnections.delete(userId);
//         console.log(`❌ [User ${userId}] WebSocket closed`);
//       });
//     });
//   }
// });

// server.listen(3000, () => {
//   console.log('🚀 Server running on http://localhost:3000');
// });

// export { userConnections };
// export { positionConnections };
// export {orderTrackingConnections}


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

const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });
const positionWss = new WebSocketServer({ noServer: true });
const orderTrackingWss = new WebSocketServer({ noServer: true });

const userConnections = new Map();
const positionConnections = new Map();
const orderTrackingConnections = new Set();

app.set('userConnections', userConnections);
app.set('positionConnections', positionConnections);
app.set('orderTrackingConnections', orderTrackingConnections);

// Function to initialize symbol and WebSocket logic for each category
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

// Initial startup
initializeSymbolAndWebSocket();

// WebSocket upgrade handling
server.on('upgrade', (req, socket, head) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const userId = url.searchParams.get('userId');
  const category = url.searchParams.get('category');

  if (!category) return socket.destroy();

  if (category === 'position') {
    if (!userId) return socket.destroy();
    positionWss.handleUpgrade(req, socket, head, (ws) => {
      positionConnections.set(userId, ws);
      console.log(`🔗 [Position - User ${userId}] WebSocket connected`);

      ws.on('close', () => {
        positionConnections.delete(userId);
        console.log(`❌ [Position - User ${userId}] WebSocket closed`);
      });
    });
  } else if (category === 'ordertracking') {
    orderTrackingWss.handleUpgrade(req, socket, head, (ws) => {
      orderTrackingConnections.add(ws);
      console.log('🔗 [OrderTracking] WebSocket connected');

      ws.on('close', () => {
        orderTrackingConnections.delete(ws);
        console.log('❌ [OrderTracking] WebSocket closed');
      });
    });
  } else {
    if (!userId) return socket.destroy();
    wss.handleUpgrade(req, socket, head, (ws) => {
      userConnections.set(userId, ws);
      console.log(`🔗 [User ${userId}] WebSocket connected`);

      ws.on('close', () => {
        userConnections.delete(userId);
        console.log(`❌ [User ${userId}] WebSocket closed`);
      });
    });
  }
});

// 🔁 Restart endpoint
app.post('/restart-server', async (req, res) => {
  try {
    console.log('♻️ Restart requested via API');
    // process.exit(1); // Trigger PM2 or EC2 restart policy

    setTimeout(() => {
      process.exit(1); // Trigger restart via PM2
    }, 2000);
  } catch (err) {
    console.error('❌ Restart failed:', err);
    res.status(500).json({ error: 'Failed to restart server' });
  }
});

server.listen(3000, () => {
  console.log('🚀 Server running on http://localhost:3000');
});

export { userConnections };
export { positionConnections };
export { orderTrackingConnections };