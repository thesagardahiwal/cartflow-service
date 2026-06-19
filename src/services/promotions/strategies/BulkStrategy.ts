import { ICart } from '../../../repositories/models/Cart';
import { IPromotionCampaign } from '../../../repositories/models/PromotionCampaign';
import { CampaignStrategy, DiscountResult } from '../CampaignStrategy';

export class BulkStrategy implements CampaignStrategy {
  isApplicable(cart: ICart, campaign: IPromotionCampaign): boolean {
    const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    return totalItems >= campaign.threshold;
  }

  apply(cart: ICart, campaign: IPromotionCampaign): DiscountResult | null {
    if (!this.isApplicable(cart, campaign) || !campaign.fixedReward) {
      return null;
    }

    return {
      campaignName: campaign.campaignName,
      amount: campaign.fixedReward,
    };
  }
}
