import mongoose, { Document, Schema } from 'mongoose';

export interface IAuditLog extends Document {
  userId: string;
  action: string;
  payload: any;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>({
  userId: { type: String, required: true, index: true },
  action: { type: String, required: true, index: true },
  payload: { type: Schema.Types.Mixed },
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

auditLogSchema.index({ userId: 1, createdAt: -1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
