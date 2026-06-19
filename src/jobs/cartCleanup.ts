import { Cart } from '../repositories/models/Cart';
import { auditLogRepository } from '../repositories/auditLog.repository';
import { logger } from '../config/logger';

export class CartCleanupJob {
  /**
   * Sweeps expired carts and updates their status to EXPIRED.
   * This handles the background cron job described in the requirements.
   */
  async sweepExpiredCarts() {
    try {
      const now = new Date();
      
      // Find carts that are past their expiresAt date and are still ACTIVE
      const expiredCarts = await Cart.find({ 
        expiresAt: { $lte: now },
        status: 'ACTIVE'
      });

      if (expiredCarts.length === 0) return;

      logger.info(`Found ${expiredCarts.length} expired carts. Processing...`);

      for (const cart of expiredCarts) {
        cart.status = 'EXPIRED';
        await cart.save();

        await auditLogRepository.createLog({
          userId: cart.userId,
          action: 'CART_EXPIRED',
          payload: { cartId: cart._id }
        });
      }

      logger.info('Expired carts sweep completed.');
    } catch (error) {
      logger.error('Error sweeping expired carts:', error);
    }
  }
}

export const cartCleanupJob = new CartCleanupJob();
