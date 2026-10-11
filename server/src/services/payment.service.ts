import { Types } from 'mongoose';
import { LoanModel, ILoanDocument } from '../models/Loan.model';
import { PaymentModel, IPaymentDocument } from '../models/Payment.model';
import { AuditLogModel } from '../models/AuditLog.model';
import { LoanStatus, HTTP_STATUS } from '../constants';
import { IRecordPaymentRequest } from '../types';
import { roundToTwoDecimals } from '../utils/loanCalculator.util';
import { AppError } from '../utils/apiResponse.util';

export class PaymentService {
  /**
   * Records a borrower payment with unique UTR, validates remaining balance,
   * updates running totals with epsilon-safe rounding, and automatically triggers
   * loan closure when balance reaches zero.
   */
  public static async recordPayment(
    loanId: string,
    collectionExecutiveId: string,
    input: IRecordPaymentRequest
  ): Promise<{ payment: IPaymentDocument; loan: ILoanDocument; autoClosed: boolean }> {
    const loan = await LoanModel.findById(loanId);
    if (!loan) {
      throw new AppError('Loan record not found.', HTTP_STATUS.NOT_FOUND);
    }

    if (loan.status !== LoanStatus.DISBURSED) {
      if (loan.status === LoanStatus.CLOSED) {
        throw new AppError('This loan has already been fully repaid and closed.', HTTP_STATUS.BAD_REQUEST);
      }
      throw new AppError(
        `Payments can only be collected for active disbursed loans. Current status is '${loan.status}'.`,
        HTTP_STATUS.BAD_REQUEST
      );
    }

    const cleanUtr = input.utrNumber.trim().toUpperCase();

    // Check UTR uniqueness across entire database
    const existingPayment = await PaymentModel.findOne({ utrNumber: cleanUtr });
    if (existingPayment) {
      throw new AppError(
        `UTR Number '${cleanUtr}' has already been processed in the system. Duplicate payments are rejected.`,
        HTTP_STATUS.CONFLICT
      );
    }

    const paymentAmount = roundToTwoDecimals(input.amount);
    if (paymentAmount <= 0) {
      throw new AppError('Payment amount must be greater than zero.', HTTP_STATUS.BAD_REQUEST);
    }

    // Defensive validation against overpayment
    if (paymentAmount > loan.remainingBalance) {
      throw new AppError(
        `Payment amount of ₹${paymentAmount.toLocaleString('en-IN')} exceeds the outstanding balance of ₹${loan.remainingBalance.toLocaleString('en-IN')}.`,
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // Create payment entry
    const payment = await PaymentModel.create({
      loanId: loan._id,
      borrowerId: loan.borrowerId,
      utrNumber: cleanUtr,
      amount: paymentAmount,
      paymentDate: new Date(input.paymentDate),
      recordedBy: new Types.ObjectId(collectionExecutiveId),
      notes: input.notes?.trim(),
    });

    // Update loan balances
    loan.totalPaidAmount = roundToTwoDecimals(loan.totalPaidAmount + paymentAmount);
    loan.remainingBalance = roundToTwoDecimals(loan.totalRepaymentAmount - loan.totalPaidAmount);

    let autoClosed = false;

    // Auto-closure condition: when total amount paid equals or exceeds total repayment
    if (loan.remainingBalance <= 0) {
      loan.status = LoanStatus.CLOSED;
      loan.closedAt = new Date();
      autoClosed = true;
    }

    await loan.save();

    // Log payment in audit trail
    await AuditLogModel.create({
      loanId: loan._id,
      action: autoClosed ? 'PAYMENT_RECORDED_AND_AUTO_CLOSED' : 'PAYMENT_RECORDED',
      performedBy: new Types.ObjectId(collectionExecutiveId),
      previousStatus: LoanStatus.DISBURSED,
      newStatus: loan.status,
      remarks: `Recorded ₹${paymentAmount} via UTR ${cleanUtr}. Remaining balance: ₹${loan.remainingBalance}.${autoClosed ? ' Loan auto-closed.' : ''}`,
      metadata: {
        paymentId: payment._id,
        utrNumber: cleanUtr,
        amount: paymentAmount,
        remainingBalance: loan.remainingBalance,
      },
    });

    return { payment, loan, autoClosed };
  }

  /**
   * Retrieves full payment history for a given loan
   */
  public static async getLoanPayments(loanId: string): Promise<IPaymentDocument[]> {
    return PaymentModel.find({ loanId: new Types.ObjectId(loanId) })
      .sort({ paymentDate: -1 })
      .populate('recordedBy', 'name email');
  }
}
