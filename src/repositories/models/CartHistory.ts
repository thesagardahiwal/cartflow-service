import mongoose, { Schema, Document } from 'mongoose';

export interface ICartHistory extends Document {
  cartId: mongoose.Types.ObjectId;
  version: number;
  snapshot: any;
  createdAt: Date;
}

const cartHistorySchema = new Schema(
  {
    cartId: { type: Schema.Types.ObjectId, ref: 'Cart', required: true, index: true },
    version: { type: Number, required: true },
    snapshot: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Compound index to ensure uniqueness of version per cart
cartHistorySchema.index({ cartId: 1, version: 1 }, { unique: true });

export const CartHistory = mongoose.model<ICartHistory>('CartHistory', cartHistorySchema);
