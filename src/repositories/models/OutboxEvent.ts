import mongoose, { Schema, Document } from 'mongoose';

export interface IOutboxEvent extends Document {
  eventType: string;
  payload: any;
  processed: boolean;
  retryCount: number;
  createdAt: Date;
}

const outboxEventSchema = new Schema(
  {
    eventType: { type: String, required: true },
    payload: { type: Schema.Types.Mixed, required: true },
    processed: { type: Boolean, default: false, index: true },
    retryCount: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

outboxEventSchema.index({ processed: 1, createdAt: 1 });

export const OutboxEvent = mongoose.model<IOutboxEvent>('OutboxEvent', outboxEventSchema);
