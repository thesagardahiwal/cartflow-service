import mongoose, { Schema, Document } from 'mongoose';

export interface IFailedEvent extends Document {
  eventType: string;
  payload: any;
  error: string;
  retryCount: number;
  failedAt: Date;
  requestId?: string;
}

const failedEventSchema = new Schema<IFailedEvent>({
  eventType: { type: String, required: true },
  payload: { type: Schema.Types.Mixed, required: true },
  error: { type: String, required: true },
  retryCount: { type: Number, required: true },
  failedAt: { type: Date, required: true },
  requestId: { type: String }
});

export const FailedEvent = mongoose.model<IFailedEvent>('FailedEvent', failedEventSchema);
