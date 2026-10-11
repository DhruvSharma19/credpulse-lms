import { Request } from 'express';
import { UserRole, EmploymentMode, BreRejectionReason } from '../constants';

export interface AuthenticatedUserPayload {
  userId: string;
  email: string;
  role: UserRole;
  name: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUserPayload;
}

export interface IBreEvaluationInput {
  fullName: string;
  panNumber: string;
  dateOfBirth: string | Date;
  monthlySalary: number;
  employmentMode: EmploymentMode;
}

export interface IBreEvaluationResult {
  passed: boolean;
  calculatedAgeYears: number;
  rejectionReasons: BreRejectionReason[];
  errorMessages: string[];
  evaluatedAt: Date;
}

export interface ILoanCalculationResult {
  principalAmount: number;
  tenureDays: number;
  interestRateAnnual: number;
  calculatedInterest: number;
  totalRepaymentAmount: number;
  dailyInterest: number;
}

export interface ICreateLoanRequest {
  principalAmount: number;
  tenureDays: number;
}

export interface IRecordPaymentRequest {
  utrNumber: string;
  amount: number;
  paymentDate: string | Date;
  notes?: string;
}

export interface ISanctionDecisionRequest {
  action: 'APPROVE' | 'REJECT';
  remarks?: string;
}

export interface IDisbursementRequest {
  referenceNumber: string;
  disbursementDate?: string | Date;
  notes?: string;
}

export interface IApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[] | Record<string, string[]>;
  timestamp: string;
}
