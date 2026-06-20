// Removed duplicate imports
import { cartRepository } from '../repositories/cart.repository';
import logger from '../config/logger';
import cron from 'node-cron';
import { eventBus } from '../events/eventBus';
import { EVENTS } from '../events/eventTypes';
import { OutboxEvent } from '../repositories/models/OutboxEvent';

export const sweepExpiredCarts = async () => {
  try {
    const expiredCarts = await cartRepository.findExpiredActiveCarts();

    if (expiredCarts.length > 0) {
      logger.info(`Found ${expiredCarts.length} expired carts. Processing...`);

      for (const cart of expiredCarts) {
        cart.status = 'EXPIRED';
        await cartRepository.save(cart);

        const eventPayload = {
          userId: cart.userId,
          cartId: cart._id,
          total: cart.total
        };

        eventBus.emit(EVENTS.CART_EXPIRED, eventPayload);

        await OutboxEvent.create({
          eventType: EVENTS.CART_EXPIRED,
          payload: eventPayload,
          processed: false
        });
      }

      logger.info('Expired carts sweep completed.');
    }
  } catch (error) {
    logger.error('Error sweeping expired carts:', { error });
  }
};

export const initCartCleanupJob = () => {
  // Run hourly
  cron.schedule('0 * * * *', sweepExpiredCarts);
};
