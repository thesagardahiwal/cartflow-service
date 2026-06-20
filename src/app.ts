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

const app = express();

// Middlewares
app.use(helmet());
app.use(cors());

// Request context and body parser
app.use(express.json());
app.use(requestContextMiddleware);

// Global Rate limiting
app.use('/api', apiLimiter);

// Idempotency for mutating cart operations
app.use('/api/v1/cart', idempotencyMiddleware);

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Healthcheck
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', reqId: req.id });
});

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/cart', checkoutRoutes);
app.use('/api/v1/cart', cartRoutes);
app.use('/api/v1/analytics', analyticsRoutes);

// Error Handling Middleware
app.use(errorHandler);

export default app;
