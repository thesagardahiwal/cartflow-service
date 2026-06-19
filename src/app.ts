import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import addRequestId from 'express-request-id';
import { apiLimiter } from './middlewares/rateLimiter';
import { errorHandler } from './middlewares/errorHandler';

const app = express();

// Security middlewares
app.use(helmet());
app.use(cors());

// Add Request ID
app.use(addRequestId());

// Body parser
app.use(express.json());

// Global Rate limiting
app.use('/api', apiLimiter);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', reqId: req.id });
});

import authRoutes from './modules/auth/auth.routes';
import cartRoutes from './modules/cart/cart.routes';
import checkoutRoutes from './modules/checkout/checkout.routes';
import swaggerUi from 'swagger-ui-express';
import * as swaggerDocument from '../swagger.json';

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/cart', checkoutRoutes); // checkout must come before /cart/:id if we had one, but mounted on /api/v1/cart
app.use('/api/v1/cart', cartRoutes);

// Global Error Handler (must be last)
app.use(errorHandler);

export default app;
