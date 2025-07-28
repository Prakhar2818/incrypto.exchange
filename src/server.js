// server.js (Updated with restart endpoint)
import express from "express";
import http from "http";
import cors from "cors";
import { WebSocketServer } from "ws";
import bodyParser from "body-parser";
import userWsRouter from "./userWsRouter.js";
import {
  fetchAndSaveSymbolsByCurrency,
  readSymbolsFromCSVsByCurrency,
} from "./services/fetchSymbols.js";
import { startDeltaWebSocket } from "./services/deltaWsHandler.js";
import { startWebSocketForCurrency } from "./services/wsHandler.js";
import config from "./config/index.js";
import { clearCSVs } from "./utils/fileUtils.js";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { ensureDir } from "./utils/fileUtils.js";
dotenv.config();

const app = express();
// Allow all CORS origins
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(bodyParser.json());

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket servers
const wss = new WebSocketServer({ noServer: true });
const positionWss = new WebSocketServer({ noServer: true });
const orderTrackingWss = new WebSocketServer({ noServer: true });

// Create connections before using them
export const userConnections = new Map();
export const positionConnections = new Map();
export const orderTrackingConnections = new Set();

// Set them in the app for middleware access
app.set("userConnections", userConnections);
app.set("positionConnections", positionConnections);
app.set("orderTrackingConnections", orderTrackingConnections);

// Use router after setting up connections
app.use("/", userWsRouter);

async function initializeSymbolAndWebSocket() {
  try {
    console.log("🧹 Clearing CSV files...");
    const csvFolderPath = path.resolve("/tmp/data");
    ensureDir(csvFolderPath);
    try {
      clearCSVs(csvFolderPath);
    } catch (err) {
      console.error("❌ Error clearing CSV files:", err);
    }

    console.log("🚀 Starting Deribit Symbol Service...");
    for (const currency of config.currencies) {
      await fetchAndSaveSymbolsByCurrency(currency);
      const symbols = await readSymbolsFromCSVsByCurrency(currency);
      startWebSocketForCurrency(currency, symbols);
    }
    await startDeltaWebSocket();
  } catch (err) {
    console.error("❌ Error initializing symbols and WebSocket:", err);
  }
}

// Initialize the application
initializeSymbolAndWebSocket();

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

server.on("upgrade", (req, socket, head) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const userId = url.searchParams.get("userId");
  const category = url.searchParams.get("category");

  if (!category) return socket.destroy();

  if (category === "position") {
    if (!userId) return socket.destroy();
    positionWss.handleUpgrade(req, socket, head, (ws) => {
      positionConnections.set(userId, ws);
      console.log(`🔗 [Position - User ${userId}] WebSocket connected`);

      ws.on("close", () => {
        positionConnections.delete(userId);
        console.log(`❌ [Position - User ${userId}] WebSocket closed`);
      });
    });
  } else if (category === "ordertracking") {
    orderTrackingWss.handleUpgrade(req, socket, head, (ws) => {
      orderTrackingConnections.add(ws);
      console.log("🔗 [OrderTracking] WebSocket connected");

      ws.on("close", () => {
        orderTrackingConnections.delete(ws);
        console.log("❌ [OrderTracking] WebSocket closed");
      });
    });
  } else {
    if (!userId) return socket.destroy();
    wss.handleUpgrade(req, socket, head, (ws) => {
      userConnections.set(userId, ws);
      console.log(`🔗 [User ${userId}] WebSocket connected`);

      ws.on("close", () => {
        userConnections.delete(userId);
        console.log(`❌ [User ${userId}] WebSocket closed`);
      });
    });
  }
});

// Export the app for potential serverless environments
export default app;
