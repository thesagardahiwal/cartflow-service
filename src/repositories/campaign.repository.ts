import { PromotionCampaign, IPromotionCampaign } from './models/PromotionCampaign';

export class CampaignRepository {
  async getActiveCampaigns(): Promise<IPromotionCampaign[]> {
    return PromotionCampaign.find({ active: true }).sort({ priority: -1 }).lean();
  }
}

export const campaignRepository = new CampaignRepository();
