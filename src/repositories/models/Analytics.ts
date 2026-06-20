import mongoose, { Schema, Document } from 'mongoose';

export interface IAnalytics extends Document {
  date: Date;
  averageCartValue: number;
  totalCheckouts: number;
  abandonedCarts: number;
  topProducts: Array<{ productId: string; count: number }>;
  topCategories: Array<{ category: string; count: number }>;
}

const analyticsSchema = new Schema(
  {
    date: { type: Date, required: true, unique: true },
    averageCartValue: { type: Number, default: 0 },
    totalCheckouts: { type: Number, default: 0 },
    abandonedCarts: { type: Number, default: 0 },
    topProducts: [
      {
        productId: { type: String, required: true },
        count: { type: Number, required: true }
      }
    ],
    topCategories: [
      {
        category: { type: String, required: true },
        count: { type: Number, required: true }
      }
    ]
  },
  { timestamps: true }
);

export const Analytics = mongoose.model<IAnalytics>('Analytics', analyticsSchema);
