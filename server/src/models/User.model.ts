import { Schema, model, Document, Types } from 'mongoose';
import { UserRole, EmploymentMode, ApplicationFunnelStage } from '../constants';

export interface IUserDocument extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  phone?: string;
  
  // Borrower specific fields
  panNumber?: string;
  dateOfBirth?: Date;
  monthlySalary?: number;
  employmentMode?: EmploymentMode;
  salarySlipPath?: string;
  salarySlipOriginalName?: string;
  salarySlipMimeType?: string;
  applicationStage: ApplicationFunnelStage;

  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUserDocument>(
  {
    name: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.BORROWER,
      required: true,
      index: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    panNumber: {
      type: String,
      uppercase: true,
      trim: true,
      sparse: true,
    },
    dateOfBirth: {
      type: Date,
    },
    monthlySalary: {
      type: Number,
      min: 0,
    },
    employmentMode: {
      type: String,
      enum: Object.values(EmploymentMode),
    },
    salarySlipPath: {
      type: String,
    },
    salarySlipOriginalName: {
      type: String,
    },
    salarySlipMimeType: {
      type: String,
    },
    applicationStage: {
      type: String,
      enum: Object.values(ApplicationFunnelStage),
      default: ApplicationFunnelStage.REGISTERED,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const UserModel = model<IUserDocument>('User', userSchema);
