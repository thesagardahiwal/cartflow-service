import cron from 'node-cron';
import { AuditLog } from '../repositories/models/AuditLog';
import { Analytics } from '../repositories/models/Analytics';
import logger from '../config/logger';

export const initAnalyticsAggregationJob = () => {
  // Run nightly at 2:00 AM
  cron.schedule('0 2 * * *', async () => {
    logger.info('Starting nightly analytics aggregation...');
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Total checkouts
      const checkouts = await AuditLog.find({
        action: 'CART_CHECKOUT',
        createdAt: { $gte: yesterday, $lt: today }
      });

      const totalCheckouts = checkouts.length;
      let averageCartValue = 0;
      if (totalCheckouts > 0) {
        const totalValue = checkouts.reduce((sum, log) => sum + (log.payload.finalAmount || 0), 0);
        averageCartValue = totalValue / totalCheckouts;
      }

      // Abandoned carts (expired)
      const abandoned = await AuditLog.countDocuments({
        action: 'CART_EXPIRED',
        createdAt: { $gte: yesterday, $lt: today }
      });

      // Top products (from ITEM_ADDED)
      const addedItems = await AuditLog.aggregate([
        { $match: { action: 'CART_ITEM_ADDED', createdAt: { $gte: yesterday, $lt: today } } },
        { $group: { _id: '$payload.productId', count: { $sum: '$payload.quantity' } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]);

      const topProducts = addedItems.map(item => ({ productId: item._id, count: item.count }));

      // Save analytics
      await Analytics.create({
        date: yesterday,
        totalCheckouts,
        averageCartValue,
        abandonedCarts: abandoned,
        topProducts,
        topCategories: [] // Similar aggregation could be done if category was in AuditLog payload
      });

      logger.info('Nightly analytics aggregation completed.');
    } catch (error) {
      logger.error('Error during analytics aggregation', { error });
    }
  });
};
