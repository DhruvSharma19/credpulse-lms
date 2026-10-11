import { Schema, model, Document, Types } from 'mongoose';

export interface IAuditLogDocument extends Document {
  _id: Types.ObjectId;
  loanId: Types.ObjectId;
  action: string;
  performedBy: Types.ObjectId;
  previousStatus?: string;
  newStatus?: string;
  remarks?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLogDocument>(
  {
    loanId: {
      type: Schema.Types.ObjectId,
      ref: 'Loan',
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
    },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    previousStatus: {
      type: String,
    },
    newStatus: {
      type: String,
    },
    remarks: {
      type: String,
      trim: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

auditLogSchema.index({ loanId: 1, createdAt: -1 });

export const AuditLogModel = model<IAuditLogDocument>('AuditLog', auditLogSchema);
