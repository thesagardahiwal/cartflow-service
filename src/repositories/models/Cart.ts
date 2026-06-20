import mongoose, { Document, Schema } from 'mongoose';

export interface ICartItem {
  productId: string;
  productName: string;
  category: string;
  quantity: number;
  unitPrice: number;
  metadata?: Record<string, any>;
}

export interface ICart extends Document {
  userId: mongoose.Types.ObjectId;
  status: 'ACTIVE' | 'CHECKED_OUT' | 'EXPIRED';
  items: ICartItem[];
  subtotal: number;
  discount: number;
  total: number;
  version: number;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const cartItemSchema = new Schema<ICartItem>({
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  category: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  metadata: { type: Schema.Types.Mixed }
}, { _id: false });

const cartSchema = new Schema<ICart>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  status: { type: String, enum: ['ACTIVE', 'CHECKED_OUT', 'EXPIRED'], default: 'ACTIVE', index: true },
  items: [cartItemSchema],
  subtotal: { type: Number, default: 0, min: 0 },
  discount: { type: Number, default: 0, min: 0 },
  total: { type: Number, default: 0, min: 0 },
  version: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true, index: true },
}, {
  timestamps: true
});

cartSchema.index({ userId: 1, status: 1 });

export const Cart = mongoose.model<ICart>('Cart', cartSchema);
