import { Schema, model, Document, Types } from 'mongoose';
import { LoanStatus, BUSINESS_RULES } from '../constants';

export interface ILoanDocument extends Document {
  _id: Types.ObjectId;
  borrowerId: Types.ObjectId;
  loanReference: string;
  principalAmount: number;
  tenureDays: number;
  interestRateAnnual: number;
  calculatedInterest: number;
  totalRepaymentAmount: number;
  totalPaidAmount: number;
  remainingBalance: number;
  status: LoanStatus;

  // BRE snapshot at time of application
  breSnapshot: {
    passed: boolean;
    calculatedAgeYears: number;
    rejectionReasons: string[];
    evaluatedAt: Date;
  };

  // Operational decision tracking
  sanctionRemarks?: string;
  sanctionedBy?: Types.ObjectId;
  sanctionedAt?: Date;

  rejectionReason?: string;
  rejectedBy?: Types.ObjectId;
  rejectedAt?: Date;

  disbursementReference?: string;
  disbursedBy?: Types.ObjectId;
  disbursedAt?: Date;

  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const loanSchema = new Schema<ILoanDocument>(
  {
    borrowerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    loanReference: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    principalAmount: {
      type: Number,
      required: true,
      min: [BUSINESS_RULES.MIN_LOAN_AMOUNT_INR, `Minimum loan amount is ₹${BUSINESS_RULES.MIN_LOAN_AMOUNT_INR}`],
      max: [BUSINESS_RULES.MAX_LOAN_AMOUNT_INR, `Maximum loan amount is ₹${BUSINESS_RULES.MAX_LOAN_AMOUNT_INR}`],
    },
    tenureDays: {
      type: Number,
      required: true,
      min: [BUSINESS_RULES.MIN_TENURE_DAYS, `Minimum tenure is ${BUSINESS_RULES.MIN_TENURE_DAYS} days`],
      max: [BUSINESS_RULES.MAX_TENURE_DAYS, `Maximum tenure is ${BUSINESS_RULES.MAX_TENURE_DAYS} days`],
    },
    interestRateAnnual: {
      type: Number,
      required: true,
      default: BUSINESS_RULES.FIXED_ANNUAL_INTEREST_RATE_PERCENT,
    },
    calculatedInterest: {
      type: Number,
      required: true,
      min: 0,
    },
    totalRepaymentAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    totalPaidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    remainingBalance: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: Object.values(LoanStatus),
      default: LoanStatus.APPLIED,
      required: true,
      index: true,
    },
    breSnapshot: {
      passed: { type: Boolean, required: true },
      calculatedAgeYears: { type: Number, required: true },
      rejectionReasons: [{ type: String }],
      evaluatedAt: { type: Date, default: Date.now },
    },
    sanctionRemarks: { type: String, trim: true },
    sanctionedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    sanctionedAt: { type: Date },

    rejectionReason: { type: String, trim: true },
    rejectedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    rejectedAt: { type: Date },

    disbursementReference: { type: String, trim: true },
    disbursedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    disbursedAt: { type: Date },

    closedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

// Compound index for queue filtering and borrower query
loanSchema.index({ status: 1, createdAt: -1 });
loanSchema.index({ borrowerId: 1, createdAt: -1 });

export const LoanModel = model<ILoanDocument>('Loan', loanSchema);
