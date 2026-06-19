import { ICart } from '../../repositories/models/Cart';
import { CampaignType, IPromotionCampaign } from '../../repositories/models/PromotionCampaign';
import { CampaignStrategy, DiscountResult } from './CampaignStrategy';
import { CartValueStrategy } from './strategies/CartValueStrategy';
import { CategoryStrategy } from './strategies/CategoryStrategy';
import { BulkStrategy } from './strategies/BulkStrategy';
import { PremiumStrategy } from './strategies/PremiumStrategy';
import { campaignRepository } from '../../repositories/campaign.repository';

export class PromotionEngine {
  private strategies: Record<CampaignType, CampaignStrategy>;

  constructor() {
    this.strategies = {
      'VALUE_DISCOUNT': new CartValueStrategy(),
      'CATEGORY_REWARD': new CategoryStrategy(),
      'BULK_REWARD': new BulkStrategy(),
      'PREMIUM_BONUS': new PremiumStrategy(),
    };
  }

  /**
   * Calculates discounts based on active campaigns.
   */
  async calculate(cart: ICart): Promise<{ discounts: DiscountResult[], finalAmount: number, appliedCampaigns: string[] }> {
    const activeCampaigns = await campaignRepository.getActiveCampaigns();
    
    let totalDiscount = 0;
    const appliedDiscounts: DiscountResult[] = [];
    const appliedCampaignNames: string[] = [];

    // Campaigns are already sorted by priority in the repository
    for (const campaign of activeCampaigns) {
      const strategy = this.strategies[campaign.type];
      if (strategy) {
        const result = strategy.apply(cart, campaign);
        if (result) {
          // Add to total discount
          totalDiscount += result.amount;
          appliedDiscounts.push(result);
          appliedCampaignNames.push(result.campaignName);
        }
      }
    }

    // Ensure total discount doesn't exceed subtotal
    if (totalDiscount > cart.subtotal) {
      totalDiscount = cart.subtotal;
    }

    const finalAmount = cart.subtotal - totalDiscount;

    return {
      discounts: appliedDiscounts,
      finalAmount,
      appliedCampaigns: appliedCampaignNames,
    };
  }
}

export const promotionEngine = new PromotionEngine();
