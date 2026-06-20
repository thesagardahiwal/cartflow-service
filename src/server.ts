import app from './app';
import { connectDB } from './config/db';
import { env } from './config/env';
import logger from './config/logger';

// Import Listeners
import './events/listeners/audit.listener';
import './events/listeners/analytics.listener';
import './events/listeners/notification.listener';

// Import Jobs
import { initCartCleanupJob } from './jobs/cartCleanup';
import { initAnalyticsAggregationJob } from './jobs/analyticsAggregation';
import { initOutboxWorker } from './jobs/outboxWorker';

const startServer = async () => {
  try {
    await connectDB();
    
    // Start background jobs
    initCartCleanupJob();
    initAnalyticsAggregationJob();
    initOutboxWorker();
    
    app.listen(env.PORT, () => {
      logger.info(`Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', { error });
    process.exit(1);
  }
};

startServer();
