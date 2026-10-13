import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createProxyMiddleware } from 'http-proxy-middleware';

import routes from './src/routes/index.js';
import { errorHandler, notFound } from './src/middleware/error.js';
import { apiLimiter } from './src/middleware/rateLimiter.js';
import dictionaryService from './src/services/dictionaryService.js';
import logger from './src/utils/logger.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8080';

// Security & Performance Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for proxy compatibility if needed
}));
app.use(compression());
app.use(cors());
app.use(express.json());
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));

// Rate Limiting
app.use('/api/', apiLimiter);

// Preload dictionaries
dictionaryService.preloadAll();

// Static files
app.use('/read', express.static(path.join(__dirname, 'data')));

// Proxy configuration
const proxyOptions = {
  target: BACKEND_URL,
  changeOrigin: true,
  onError: (err, req, res) => {
    logger.error(`Proxy Error: ${err.message}`);
    res.status(502).json({ error: `Backend not reachable at ${BACKEND_URL}` });
  }
};

// API Routes
app.use('/api', routes);

// Proxy routes (after local API routes)
const routesToProxy = ['/api/chat', '/api/models', '/auth', '/mcp', '/tts'];
routesToProxy.forEach(route => {
  app.use(route, createProxyMiddleware(proxyOptions));
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', backend: BACKEND_URL });
});

// Error Handling
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Backend server running at http://localhost:${PORT}`);
  logger.info(`Proxying requests to: ${BACKEND_URL}`);
});
