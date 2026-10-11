export enum UserRole {
  ADMIN = 'ADMIN',
  SALES = 'SALES',
  SANCTION = 'SANCTION',
  DISBURSEMENT = 'DISBURSEMENT',
  COLLECTION = 'COLLECTION',
  BORROWER = 'BORROWER',
}

export enum LoanStatus {
  DRAFT = 'DRAFT',
  APPLIED = 'APPLIED',
  SANCTIONED = 'SANCTIONED',
  DISBURSED = 'DISBURSED',
  REJECTED = 'REJECTED',
  CLOSED = 'CLOSED',
}

export enum EmploymentMode {
  SALARIED = 'SALARIED',
  SELF_EMPLOYED = 'SELF_EMPLOYED',
  UNEMPLOYED = 'UNEMPLOYED',
}

export enum ApplicationFunnelStage {
  REGISTERED = 'REGISTERED',
  PERSONAL_INFO_COMPLETED = 'PERSONAL_INFO_COMPLETED',
  DOCUMENT_UPLOADED = 'DOCUMENT_UPLOADED',
  LOAN_CONFIGURED = 'LOAN_CONFIGURED',
  SUBMITTED = 'SUBMITTED',
}

export interface IUser {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  panNumber?: string;
  dateOfBirth?: string;
  monthlySalary?: number;
  employmentMode?: EmploymentMode;
  salarySlipPath?: string;
  salarySlipOriginalName?: string;
  applicationStage: ApplicationFunnelStage;
  createdAt?: string;
}

export interface IBreEvaluationResult {
  passed: boolean;
  calculatedAgeYears: number;
  rejectionReasons: string[];
  errorMessages: string[];
  evaluatedAt: string;
}

export interface ILoanCalculation {
  principalAmount: number;
  tenureDays: number;
  interestRateAnnual: number;
  calculatedInterest: number;
  totalRepaymentAmount: number;
  dailyInterest: number;
}

export interface ILoan {
  _id: string;
  borrowerId: IUser | string;
  loanReference: string;
  principalAmount: number;
  tenureDays: number;
  interestRateAnnual: number;
  calculatedInterest: number;
  totalRepaymentAmount: number;
  totalPaidAmount: number;
  remainingBalance: number;
  status: LoanStatus;
  breSnapshot?: {
    passed: boolean;
    calculatedAgeYears: number;
    rejectionReasons: string[];
    evaluatedAt: string;
  };
  sanctionRemarks?: string;
  sanctionedBy?: IUser | string;
  sanctionedAt?: string;
  rejectionReason?: string;
  rejectedBy?: IUser | string;
  rejectedAt?: string;
  disbursementReference?: string;
  disbursedBy?: IUser | string;
  disbursedAt?: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IPayment {
  _id: string;
  loanId: string;
  borrowerId: string;
  utrNumber: string;
  amount: number;
  paymentDate: string;
  recordedBy: {
    _id: string;
    name: string;
    email: string;
  };
  notes?: string;
  createdAt: string;
}

export interface IApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[] | Record<string, string[]>;
  timestamp: string;
}
