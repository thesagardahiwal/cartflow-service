import mongoose, { Document, Schema } from 'mongoose';

export interface IAnalytics extends Document {
  date: Date;
  totalCheckouts: number;
  averageCartValue: number;
  abandonedCarts: number;
  topProducts: Array<{ productId: string; count: number }>;
  topCategories: Array<{ category: string; count: number }>;
  mostUsedCampaigns: Array<{ campaignId: string; count: number }>;
  createdAt: Date;
  updatedAt: Date;
}

const analyticsSchema = new Schema<IAnalytics>({
  date: { type: Date, required: true, unique: true },
  totalCheckouts: { type: Number, default: 0 },
  averageCartValue: { type: Number, default: 0 },
  abandonedCarts: { type: Number, default: 0 },
  topProducts: [{ productId: String, count: Number }],
  topCategories: [{ category: String, count: Number }],
  mostUsedCampaigns: [{ campaignId: String, count: Number }]
}, {
  timestamps: true
});

analyticsSchema.index({ 'topProducts.productId': 1 });
analyticsSchema.index({ 'mostUsedCampaigns.campaignId': 1 });

export const Analytics = mongoose.model<IAnalytics>('Analytics', analyticsSchema);
