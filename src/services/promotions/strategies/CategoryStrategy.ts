import { ICart } from '../../../repositories/models/Cart';
import { IPromotionCampaign } from '../../../repositories/models/PromotionCampaign';
import { CampaignStrategy, DiscountResult } from '../CampaignStrategy';

export class CategoryStrategy implements CampaignStrategy {
  isApplicable(cart: ICart, campaign: IPromotionCampaign): boolean {
    const uniqueCategories = new Set(cart.items.map(item => item.category));
    return uniqueCategories.size >= campaign.threshold;
  }

  apply(cart: ICart, campaign: IPromotionCampaign): DiscountResult | null {
    if (!this.isApplicable(cart, campaign) || !campaign.percentage) {
      return null;
    }

    const discountAmount = (cart.subtotal * campaign.percentage) / 100;

    return {
      campaignName: campaign.campaignName,
      amount: discountAmount,
    };
  }
}
