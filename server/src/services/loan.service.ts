import { Types } from 'mongoose';
import { LoanModel, ILoanDocument } from '../models/Loan.model';
import { UserModel } from '../models/User.model';
import { AuditLogModel } from '../models/AuditLog.model';
import { LoanStatus, ApplicationFunnelStage, HTTP_STATUS } from '../constants';
import { ICreateLoanRequest } from '../types';
import { calculateLoanDetails } from '../utils/loanCalculator.util';
import { BreService } from './bre.service';
import { AppError } from '../utils/apiResponse.util';

export class LoanService {
  /**
   * Generates a collision-resistant, human-friendly loan reference (e.g., LN-893021)
   */
  private static generateLoanReference(): string {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const timeCode = Date.now().toString().slice(-4);
    return `LN-${timeCode}-${randomSuffix}`;
  }

  /**
   * Applies for a loan. Re-validates BRE on server side, verifies document upload,
   * performs precise Simple Interest calculation, and persists loan in APPLIED status.
   */
  public static async applyForLoan(
    userId: string,
    input: ICreateLoanRequest
  ): Promise<ILoanDocument> {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new AppError('Borrower account not found.', HTTP_STATUS.NOT_FOUND);
    }

    if (!user.panNumber || !user.dateOfBirth || !user.monthlySalary || !user.employmentMode) {
      throw new AppError(
        'Please complete personal profile and eligibility check before applying for a loan.',
        HTTP_STATUS.BAD_REQUEST
      );
    }

    if (!user.salarySlipPath) {
      throw new AppError(
        'Salary slip document is required before applying for a loan. Please upload your salary slip.',
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // Server-authoritative BRE re-evaluation
    const breResult = BreService.evaluateRules({
      fullName: user.name,
      panNumber: user.panNumber,
      dateOfBirth: user.dateOfBirth,
      monthlySalary: user.monthlySalary,
      employmentMode: user.employmentMode,
    });

    if (!breResult.passed) {
      throw new AppError(
        'Application rejected by Business Rule Engine (BRE).',
        HTTP_STATUS.UNPROCESSABLE_ENTITY,
        breResult.errorMessages
      );
    }

    // Precise simple interest financial math
    const calculation = calculateLoanDetails(input.principalAmount, input.tenureDays);
    const loanReference = this.generateLoanReference();

    const loan = await LoanModel.create({
      borrowerId: user._id,
      loanReference,
      principalAmount: calculation.principalAmount,
      tenureDays: calculation.tenureDays,
      interestRateAnnual: calculation.interestRateAnnual,
      calculatedInterest: calculation.calculatedInterest,
      totalRepaymentAmount: calculation.totalRepaymentAmount,
      totalPaidAmount: 0,
      remainingBalance: calculation.totalRepaymentAmount,
      status: LoanStatus.APPLIED,
      breSnapshot: {
        passed: true,
        calculatedAgeYears: breResult.calculatedAgeYears,
        rejectionReasons: [],
        evaluatedAt: new Date(),
      },
    });

    // Update user funnel stage
    user.applicationStage = ApplicationFunnelStage.SUBMITTED;
    await user.save();

    // Audit trail
    await AuditLogModel.create({
      loanId: loan._id,
      action: 'LOAN_APPLIED',
      performedBy: user._id,
      previousStatus: LoanStatus.DRAFT,
      newStatus: LoanStatus.APPLIED,
      remarks: `Applied for ₹${calculation.principalAmount} for ${calculation.tenureDays} days at ${calculation.interestRateAnnual}% p.a.`,
    });

    return loan;
  }

  /**
   * Retrieves all loans for a specific borrower
   */
  public static async getBorrowerLoans(userId: string): Promise<ILoanDocument[]> {
    return LoanModel.find({ borrowerId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .populate('borrowerId', 'name email phone panNumber monthlySalary employmentMode salarySlipPath');
  }

  /**
   * Retrieves single loan with full borrower details
   */
  public static async getLoanById(loanId: string): Promise<ILoanDocument> {
    const loan = await LoanModel.findById(loanId).populate(
      'borrowerId',
      'name email phone panNumber monthlySalary employmentMode salarySlipPath dateOfBirth applicationStage'
    );
    if (!loan) {
      throw new AppError('Loan record not found.', HTTP_STATUS.NOT_FOUND);
    }
    return loan;
  }

  /**
   * Sanction review: Approves or rejects loan application
   */
  public static async reviewSanction(
    loanId: string,
    executiveId: string,
    decision: 'APPROVE' | 'REJECT',
    remarks?: string
  ): Promise<ILoanDocument> {
    const loan = await LoanModel.findById(loanId);
    if (!loan) {
      throw new AppError('Loan record not found.', HTTP_STATUS.NOT_FOUND);
    }

    if (loan.status !== LoanStatus.APPLIED) {
      throw new AppError(
        `Invalid status transition: Loan is currently '${loan.status}', only loans in '${LoanStatus.APPLIED}' can be reviewed.`,
        HTTP_STATUS.BAD_REQUEST
      );
    }

    const previousStatus = loan.status;

    if (decision === 'APPROVE') {
      loan.status = LoanStatus.SANCTIONED;
      loan.sanctionRemarks = remarks || 'Loan application approved by underwriting.';
      loan.sanctionedBy = new Types.ObjectId(executiveId);
      loan.sanctionedAt = new Date();
    } else {
      loan.status = LoanStatus.REJECTED;
      loan.rejectionReason = remarks;
      loan.rejectedBy = new Types.ObjectId(executiveId);
      loan.rejectedAt = new Date();
    }

    await loan.save();

    await AuditLogModel.create({
      loanId: loan._id,
      action: decision === 'APPROVE' ? 'SANCTION_APPROVED' : 'SANCTION_REJECTED',
      performedBy: new Types.ObjectId(executiveId),
      previousStatus,
      newStatus: loan.status,
      remarks,
    });

    return loan;
  }

  /**
   * Disbursement execution: Marks sanctioned loan as disbursed
   */
  public static async markDisbursed(
    loanId: string,
    executiveId: string,
    referenceNumber: string,
    notes?: string
  ): Promise<ILoanDocument> {
    const loan = await LoanModel.findById(loanId);
    if (!loan) {
      throw new AppError('Loan record not found.', HTTP_STATUS.NOT_FOUND);
    }

    if (loan.status !== LoanStatus.SANCTIONED) {
      throw new AppError(
        `Invalid status transition: Loan is currently '${loan.status}', only loans in '${LoanStatus.SANCTIONED}' can be disbursed.`,
        HTTP_STATUS.BAD_REQUEST
      );
    }

    const previousStatus = loan.status;
    loan.status = LoanStatus.DISBURSED;
    loan.disbursementReference = referenceNumber;
    loan.disbursedBy = new Types.ObjectId(executiveId);
    loan.disbursedAt = new Date();

    await loan.save();

    await AuditLogModel.create({
      loanId: loan._id,
      action: 'LOAN_DISBURSED',
      performedBy: new Types.ObjectId(executiveId),
      previousStatus,
      newStatus: loan.status,
      remarks: `Funds disbursed with reference: ${referenceNumber}. ${notes || ''}`.trim(),
    });

    return loan;
  }
}
