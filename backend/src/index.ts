import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

import { config } from '@/config';
import { logger } from '@/utils/logger';
import { errorHandler } from '@/middleware/errorHandler';
import { notFoundHandler } from '@/middleware/notFoundHandler';
import { connectDB } from '@/models';

// Routes
import authRoutes from '@/routes/auth';
import userRoutes from '@/routes/users';
import eventRoutes from '@/routes/events';
import nfcRoutes from '@/routes/nfc';
import analyticsRoutes from '@/routes/analytics';
import productRoutes from '@/routes/products';
import orderRoutes from '@/routes/orders';
import festivalTokenRoutes from '@/routes/festivalTokens';

// Services
import { SocketService } from '@/services/socketService';
import { NFCService } from '@/services/nfcService';
import { AnalyticsService } from '@/services/analyticsService';

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: config.FRONTEND_URL,
    methods: ['GET', 'POST']
  }
});

// ============================================
// MIDDLEWARE GLOBAL
// ============================================

// Seguridad
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS
app.use(cors({
  origin: [config.FRONTEND_URL, config.MOBILE_APP_URL].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // límite de 100 requests por ventana por IP
  message: {
    error: 'Demasiadas peticiones desde esta IP, intenta de nuevo en 15 minutos.'
  }
});
app.use(limiter);

// Parsing y compresión
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use(morgan('combined', {
  stream: { write: (message) => logger.info(message.trim()) }
}));

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0'
  });
});

// ============================================
// ROUTES API
// ============================================

const API_PREFIX = '/api/v1';

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/events`, eventRoutes);
app.use(`${API_PREFIX}/nfc`, nfcRoutes);
app.use(`${API_PREFIX}/analytics`, analyticsRoutes);
app.use(`${API_PREFIX}/products`, productRoutes);
app.use(`${API_PREFIX}/orders`, orderRoutes);
app.use(`${API_PREFIX}/festival-tokens`, festivalTokenRoutes);

// ============================================
// WEBSOCKETS
// ============================================

const socketService = new SocketService(io);
socketService.initialize();

// ============================================
// SERVICIOS EN BACKGROUND
// ============================================

const nfcService = new NFCService();
const analyticsService = new AnalyticsService();

// Inicializar servicios
nfcService.initialize();
analyticsService.startPeriodicCollection();

// ============================================
// ERROR HANDLING
// ============================================

app.use(notFoundHandler);
app.use(errorHandler);

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

// ============================================
// START SERVER
// ============================================

const PORT = config.PORT || 3001;

// Initialize database connection and start server
const startServer = async () => {
  try {
    // Connect to MongoDB Atlas
    await connectDB();
    
    server.listen(PORT, () => {
      logger.info(`🚀 Syntra Backend running on port ${PORT}`);
      logger.info(`📊 Environment: ${config.NODE_ENV}`);
      logger.info(`🔗 API Base URL: http://localhost:${PORT}${API_PREFIX}`);
      logger.info(`⚡ WebSocket server ready`);
      logger.info(`🍃 MongoDB Atlas connected`);
      
      if (config.NODE_ENV === 'development') {
        logger.info(`📖 API Documentation: http://localhost:${PORT}/docs`);
      }
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export { app, server, io };
