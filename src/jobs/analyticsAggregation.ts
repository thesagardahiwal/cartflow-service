import cron from 'node-cron';
import { AuditLog } from '../repositories/models/AuditLog';
import { Analytics } from '../repositories/models/Analytics';
import logger from '../config/logger';

export const initAnalyticsAggregationJob = () => {
  cron.schedule('0 2 * * *', async () => {
    logger.info('Starting nightly analytics aggregation...');
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const checkoutStats = await AuditLog.aggregate([
        { $match: { action: 'CART_CHECKOUT', createdAt: { $gte: yesterday, $lt: today } } },
        { 
          $group: { 
            _id: null, 
            totalCheckouts: { $sum: 1 }, 
            totalValue: { $sum: '$payload.finalAmount' } 
          } 
        }
      ]);

      const totalCheckouts = checkoutStats[0]?.totalCheckouts || 0;
      const averageCartValue = totalCheckouts > 0 ? checkoutStats[0].totalValue / totalCheckouts : 0;

      const abandoned = await AuditLog.countDocuments({
        action: 'CART_EXPIRED',
        createdAt: { $gte: yesterday, $lt: today }
      });

      const addedItems = await AuditLog.aggregate([
        { $match: { action: 'CART_ITEM_ADDED', createdAt: { $gte: yesterday, $lt: today } } },
        { $group: { _id: '$payload.productId', count: { $sum: '$payload.quantity' } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]);
      const topProducts = addedItems.map(item => ({ productId: item._id, count: item.count }));

      const campaigns = await AuditLog.aggregate([
        { $match: { action: 'CART_CHECKOUT', createdAt: { $gte: yesterday, $lt: today } } },
        { $unwind: { path: '$payload.appliedCampaigns', preserveNullAndEmptyArrays: false } },
        { $group: { _id: '$payload.appliedCampaigns', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]);
      const mostUsedCampaigns = campaigns.map(c => ({ campaignId: c._id, count: c.count }));

      await Analytics.collection.bulkWrite([
        {
          updateOne: {
            filter: { date: yesterday },
            update: {
              $set: {
                totalCheckouts,
                averageCartValue,
                abandonedCarts: abandoned,
                topProducts,
                topCategories: [],
                mostUsedCampaigns,
                updatedAt: new Date()
              },
              $setOnInsert: { createdAt: new Date() }
            },
            upsert: true
          }
        }
      ]);

      logger.info('Nightly analytics aggregation completed.');
    } catch (error) {
      logger.error('Error during analytics aggregation', { error });
    }
  });
};
