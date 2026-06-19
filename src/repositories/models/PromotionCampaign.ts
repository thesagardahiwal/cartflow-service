import mongoose, { Document, Schema } from 'mongoose';

export type CampaignType = 'VALUE_DISCOUNT' | 'CATEGORY_REWARD' | 'BULK_REWARD' | 'PREMIUM_BONUS';

export interface IPromotionCampaign extends Document {
  campaignName: string;
  type: CampaignType;
  threshold: number; // e.g., min cart value, min categories, min items
  percentage?: number; // e.g., 10% off
  fixedReward?: number; // fixed amount off
  active: boolean;
  priority: number; // Higher number means higher priority
  createdAt: Date;
  updatedAt: Date;
}

const promotionCampaignSchema = new Schema<IPromotionCampaign>({
  campaignName: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['VALUE_DISCOUNT', 'CATEGORY_REWARD', 'BULK_REWARD', 'PREMIUM_BONUS'], 
    required: true 
  },
  threshold: { type: Number, required: true },
  percentage: { type: Number },
  fixedReward: { type: Number },
  active: { type: Boolean, default: true, index: true },
  priority: { type: Number, default: 0 }
}, {
  timestamps: true
});

export const PromotionCampaign = mongoose.model<IPromotionCampaign>('PromotionCampaign', promotionCampaignSchema);
