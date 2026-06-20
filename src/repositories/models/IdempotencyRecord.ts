import mongoose, { Schema, Document } from 'mongoose';

export interface IIdempotencyRecord extends Document {
  key: string;
  endpoint: string;
  requestHash: string;
  response: any;
  statusCode: number;
  expiresAt: Date;
}

const idempotencyRecordSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    endpoint: { type: String, required: true },
    requestHash: { type: String, required: true },
    response: { type: Schema.Types.Mixed, required: true },
    statusCode: { type: Number, required: true },
    expiresAt: { type: Date, required: true, index: { expires: '0s' } },
  },
  { timestamps: true }
);

export const IdempotencyRecord = mongoose.model<IIdempotencyRecord>('IdempotencyRecord', idempotencyRecordSchema);
