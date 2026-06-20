import { eventBus } from '../eventBus';
import { EVENTS } from '../eventTypes';
import { cacheService } from '../../services/cache.service';
import logger from '../../config/logger';

// Example real-time tracking in Redis for fast access, later aggregated by Nightly Job
const handlePromotionApplied = async (data: any) => {
  try {
    const { campaignId, discountAmount } = data;
    // Increment total usage counter
    await cacheService.client.hincrby('analytics:promotions:usage', campaignId, 1);
    // Add to total discount given tracking
    await cacheService.client.hincrbyfloat('analytics:promotions:discount', campaignId, discountAmount);
  } catch (error) {
    logger.error('Error in analytics promotion listener', { error });
  }
};

eventBus.on(EVENTS.PROMOTION_APPLIED, handlePromotionApplied);
