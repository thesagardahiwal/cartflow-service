import { ICart } from '../../repositories/models/Cart';
import { IPromotionCampaign } from '../../repositories/models/PromotionCampaign';

export interface DiscountResult {
  campaignName: string;
  amount: number;
}

export interface CampaignStrategy {
  isApplicable(cart: ICart, campaign: IPromotionCampaign): boolean;
  apply(cart: ICart, campaign: IPromotionCampaign): DiscountResult | null;
}
