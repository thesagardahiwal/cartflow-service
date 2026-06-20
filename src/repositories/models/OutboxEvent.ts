import mongoose, { Schema, Document } from 'mongoose';

export interface IOutboxEvent extends Document {
  eventType: string;
  payload: any;
  processed: boolean;
  createdAt: Date;
}

const outboxEventSchema = new Schema(
  {
    eventType: { type: String, required: true },
    payload: { type: Schema.Types.Mixed, required: true },
    processed: { type: Boolean, default: false, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

export const OutboxEvent = mongoose.model<IOutboxEvent>('OutboxEvent', outboxEventSchema);
