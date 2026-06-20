import cron from 'node-cron';
import { OutboxEvent } from '../repositories/models/OutboxEvent';
import logger from '../config/logger';

export const initOutboxWorker = () => {
  // Run every minute
  cron.schedule('* * * * *', async () => {
    try {
      const unprocessedEvents = await OutboxEvent.find({ processed: false }).limit(100);
      
      if (unprocessedEvents.length > 0) {
        logger.info(`Processing ${unprocessedEvents.length} outbox events...`);
        
        for (const event of unprocessedEvents) {
          // Simulate delivering event to an external message broker (Kafka, RabbitMQ)
          // Since this is a monolith simulation, we just mark it processed
          // In a real system, we would publish to a topic here
          
          event.processed = true;
          await event.save();
        }
        
        logger.info('Outbox processing completed.');
      }
    } catch (error) {
      logger.error('Error processing outbox events', { error });
    }
  });
};
