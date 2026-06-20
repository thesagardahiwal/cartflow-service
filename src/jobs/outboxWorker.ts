import cron from 'node-cron';
import { OutboxEvent } from '../repositories/models/OutboxEvent';
import { FailedEvent } from '../repositories/models/FailedEvent';
import logger from '../config/logger';

export const initOutboxWorker = () => {
  // Run every minute
  cron.schedule('* * * * *', async () => {
    try {
      const unprocessedEvents = await OutboxEvent.find({ processed: false }).limit(100);
      
      if (unprocessedEvents.length > 0) {
        logger.info(`Processing ${unprocessedEvents.length} outbox events...`);
        const start = Date.now();
        
        const processedIds = [];
        const failedEventsToDLQ = [];
        const retriedIds = [];

        for (const event of unprocessedEvents) {
          try {
            // Simulate delivering event to an external message broker (Kafka, RabbitMQ)
            // In a real system, we would publish to a topic here
            
            processedIds.push(event._id);
          } catch (err: any) {
            event.retryCount += 1;
            if (event.retryCount >= 3) {
              failedEventsToDLQ.push({
                eventType: event.eventType,
                payload: event.payload,
                error: err.message || 'Unknown processing error',
                retryCount: event.retryCount,
                failedAt: new Date(),
                requestId: event.payload?.requestId
              });
              // Move to DLQ, so we delete it from Outbox
              processedIds.push(event._id); 
            } else {
              retriedIds.push({ id: event._id, retryCount: event.retryCount });
            }
          }
        }
        
        // Bulk operations
        // 1. Delete processed events and events moved to DLQ
        if (processedIds.length > 0) {
          await OutboxEvent.deleteMany({ _id: { $in: processedIds } });
        }

        // 2. Insert into FailedEvent (DLQ)
        if (failedEventsToDLQ.length > 0) {
          await FailedEvent.insertMany(failedEventsToDLQ);
          logger.warn(`Moved ${failedEventsToDLQ.length} events to DLQ`);
        }

        // 3. Update retry counts for failing events
        if (retriedIds.length > 0) {
          const bulkOps = retriedIds.map(r => ({
            updateOne: {
              filter: { _id: r.id },
              update: { $set: { retryCount: r.retryCount } }
            }
          }));
          await OutboxEvent.bulkWrite(bulkOps);
        }

        const duration = Date.now() - start;
        logger.info(`Outbox processing completed in ${duration}ms. Processed: ${processedIds.length - failedEventsToDLQ.length}, Retried: ${retriedIds.length}, DLQ: ${failedEventsToDLQ.length}`);
      }
    } catch (error) {
      logger.error('Error processing outbox events', { error });
    }
  });
};
