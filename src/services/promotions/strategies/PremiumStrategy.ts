import { ICart } from '../../../repositories/models/Cart';
import { IPromotionCampaign } from '../../../repositories/models/PromotionCampaign';
import { CampaignStrategy, DiscountResult } from '../CampaignStrategy';

export class PremiumStrategy implements CampaignStrategy {
  isApplicable(cart: ICart, campaign: IPromotionCampaign): boolean {
    return cart.subtotal > campaign.threshold; // e.g. strictly exceeds threshold
  }

  apply(cart: ICart, campaign: IPromotionCampaign): DiscountResult | null {
    if (!this.isApplicable(cart, campaign)) {
      return null;
    }

    // Premium bonus can be fixed or percentage
    let discountAmount = 0;
    if (campaign.percentage) {
      discountAmount = (cart.subtotal * campaign.percentage) / 100;
    } else if (campaign.fixedReward) {
      discountAmount = campaign.fixedReward;
    }

    if (discountAmount === 0) return null;

    return {
      campaignName: campaign.campaignName,
      amount: discountAmount,
    };
  }
}
