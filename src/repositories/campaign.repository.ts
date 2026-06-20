import { PromotionCampaign, IPromotionCampaign } from './models/PromotionCampaign';
import { cacheService } from '../services/cache.service';

export class CampaignRepository {
  async getActiveCampaigns(): Promise<IPromotionCampaign[]> {
    const CACHE_KEY = 'active_campaigns';
    const cached = await cacheService.get<IPromotionCampaign[]>(CACHE_KEY);
    if (cached) {
      return cached;
    }

    const campaigns = await PromotionCampaign.find({ active: true }).sort({ priority: -1 }).lean() as unknown as IPromotionCampaign[];
    await cacheService.set(CACHE_KEY, campaigns, 300);
    return campaigns;
  }
}

export const campaignRepository = new CampaignRepository();
