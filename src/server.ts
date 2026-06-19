import app from './app';
import { connectDB } from './config/db';
import { env } from './config/env';
import { logger } from './config/logger';
import { cartCleanupJob } from './jobs/cartCleanup';

const startServer = async () => {
  try {
    await connectDB();
    
    // Start background jobs
    setInterval(() => {
      cartCleanupJob.sweepExpiredCarts();
    }, 60 * 60 * 1000); // Every hour
    
    app.listen(env.PORT, () => {
      logger.info(`Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
