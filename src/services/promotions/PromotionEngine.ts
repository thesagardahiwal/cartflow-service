import { ICart } from '../../repositories/models/Cart';
import { CampaignType, IPromotionCampaign } from '../../repositories/models/PromotionCampaign';
import { CampaignStrategy, DiscountResult } from './CampaignStrategy';
import { CartValueStrategy } from './strategies/CartValueStrategy';
import { CategoryStrategy } from './strategies/CategoryStrategy';
import { BulkStrategy } from './strategies/BulkStrategy';
import { PremiumStrategy } from './strategies/PremiumStrategy';
import { campaignRepository } from '../../repositories/campaign.repository';
import { eventBus } from '../../events/eventBus';
import { EVENTS } from '../../events/eventTypes';

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
    const discounts: DiscountResult[] = [];
    const appliedCampaigns: string[] = [];
    let finalAmount = cart.subtotal;

    const activeCampaigns = await campaignRepository.getActiveCampaigns();

    for (const campaign of activeCampaigns) {
      const strategy = this.strategies[campaign.type];
      if (strategy) {
        const discountResult = strategy.apply(cart, campaign);
        if (discountResult && discountResult.amount > 0) {
          discounts.push(discountResult);
          finalAmount -= discountResult.amount;
          appliedCampaigns.push(discountResult.campaignName);

          eventBus.emit(EVENTS.PROMOTION_APPLIED, {
            cartId: cart._id,
            campaignId: campaign._id,
            campaignName: discountResult.campaignName,
            discountAmount: discountResult.amount,
            timestamp: new Date()
          });
        }
      }
    }

    if (finalAmount < 0) {
      finalAmount = 0;
    }

    return {
      discounts,
      finalAmount,
      appliedCampaigns,
    };
  }
}

export const promotionEngine = new PromotionEngine();
