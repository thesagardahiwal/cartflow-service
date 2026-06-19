import mongoose, { Document, Schema } from 'mongoose';

export interface IAuditLog extends Document {
  userId?: mongoose.Types.ObjectId;
  action: string;
  payload: any;
  timestamp: Date;
}

const auditLogSchema = new Schema<IAuditLog>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', index: true }, // Optional because some actions might be system-level (like TTL expire)
  action: { type: String, required: true, index: true },
  payload: { type: Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now }
}, {
  timestamps: false // Using custom timestamp field
});

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
