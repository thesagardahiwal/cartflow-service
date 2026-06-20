import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { requestContextMiddleware } from './middlewares/requestContext.middleware';
import { apiLimiter } from './middlewares/rateLimiter';
import { errorHandler } from './middlewares/errorHandler';
import { idempotencyMiddleware } from './middlewares/idempotency.middleware';

import authRoutes from './modules/auth/auth.routes';
import cartRoutes from './modules/cart/cart.routes';
import checkoutRoutes from './modules/checkout/checkout.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';
import swaggerUi from 'swagger-ui-express';
import * as swaggerDocument from '../swagger.json';
import mongoose from 'mongoose';
import { cacheService } from './services/cache.service';
import { metricsService } from './services/metrics.service';

const app = express();

// Middlewares
app.use(helmet());
app.use(cors());

// Request context and body parser
app.use(express.json());
app.use(requestContextMiddleware);

// Global Rate limiting
app.use('/api', apiLimiter);

// Metrics Middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    metricsService.recordRequest(duration);
  });
  next();
});

// Idempotency for mutating operations
app.use('/api/v1/cart/items', idempotencyMiddleware);
app.use('/api/v1/checkout', idempotencyMiddleware);

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Healthcheck
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', reqId: req.id, timestamp: new Date().toISOString() });
});

app.get('/health/dependencies', (req, res) => {
  const isMongoUp = mongoose.connection.readyState === 1;
  const isRedisUp = cacheService.client.status === 'ready';

  const status = isMongoUp && isRedisUp ? 'UP' : 'DEGRADED';
  const statusCode = isMongoUp && isRedisUp ? 200 : 503;

  res.status(statusCode).json({
    mongo: isMongoUp ? 'UP' : 'DOWN',
    redis: isRedisUp ? 'UP' : 'DOWN',
    status
  });
});

// Metrics
app.get('/metrics', async (req, res) => {
  const metrics = await metricsService.getMetrics();
  res.status(200).json(metrics);
});

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/checkout', checkoutRoutes);
app.use('/api/v1/cart', cartRoutes);
app.use('/api/v1/analytics', analyticsRoutes);

// Error Handling Middleware
app.use(errorHandler);

export default app;
