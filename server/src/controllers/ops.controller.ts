import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { OperationsService } from '../services/operations.service';
import { LoanService } from '../services/loan.service';
import { PaymentService } from '../services/payment.service';
import { sendSuccess, AppError } from '../utils/apiResponse.util';
import { HTTP_STATUS } from '../constants';

export class OpsController {
  // Sales Module
  public static async getSalesLeads(
    _req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const data = await OperationsService.getSalesLeads();
      sendSuccess(res, 'Sales leads retrieved successfully', data, HTTP_STATUS.OK);
    } catch (error) {
      next(error);
    }
  }

  // Sanction Module
  public static async getSanctionQueue(
    _req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const queue = await OperationsService.getSanctionQueue();
      sendSuccess(res, 'Sanction queue retrieved successfully', queue, HTTP_STATUS.OK);
    } catch (error) {
      next(error);
    }
  }

  public static async reviewSanction(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Unauthenticated request', HTTP_STATUS.UNAUTHORIZED);
      }

      const { id } = req.params;
      if (!id) {
        throw new AppError('Loan ID is required', HTTP_STATUS.BAD_REQUEST);
      }

      const { action, remarks } = req.body;
      const loan = await LoanService.reviewSanction(id, req.user.userId, action, remarks);

      sendSuccess(
        res,
        action === 'APPROVE'
          ? 'Loan successfully sanctioned and approved for disbursement.'
          : 'Loan application rejected.',
        loan,
        HTTP_STATUS.OK
      );
    } catch (error) {
      next(error);
    }
  }

  // Disbursement Module
  public static async getDisbursementQueue(
    _req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const queue = await OperationsService.getDisbursementQueue();
      sendSuccess(res, 'Disbursement queue retrieved successfully', queue, HTTP_STATUS.OK);
    } catch (error) {
      next(error);
    }
  }

  public static async markDisbursed(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Unauthenticated request', HTTP_STATUS.UNAUTHORIZED);
      }

      const { id } = req.params;
      if (!id) {
        throw new AppError('Loan ID is required', HTTP_STATUS.BAD_REQUEST);
      }

      const { referenceNumber, notes } = req.body;
      const loan = await LoanService.markDisbursed(id, req.user.userId, referenceNumber, notes);

      sendSuccess(res, 'Loan successfully marked as disbursed (funds released).', loan, HTTP_STATUS.OK);
    } catch (error) {
      next(error);
    }
  }

  // Collection Module
  public static async getCollectionLoans(
    _req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const data = await OperationsService.getCollectionLoans();
      sendSuccess(res, 'Collection loans retrieved successfully', data, HTTP_STATUS.OK);
    } catch (error) {
      next(error);
    }
  }

  public static async recordPayment(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Unauthenticated request', HTTP_STATUS.UNAUTHORIZED);
      }

      const { id } = req.params;
      if (!id) {
        throw new AppError('Loan ID is required', HTTP_STATUS.BAD_REQUEST);
      }

      const result = await PaymentService.recordPayment(id, req.user.userId, req.body);

      const message = result.autoClosed
        ? 'Payment recorded successfully! Total repayment reached — Loan is now AUTO-CLOSED.'
        : 'Payment recorded successfully. Outstanding balance updated.';

      sendSuccess(res, message, result, HTTP_STATUS.CREATED);
    } catch (error) {
      next(error);
    }
  }

  public static async getLoanPayments(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        throw new AppError('Loan ID is required', HTTP_STATUS.BAD_REQUEST);
      }

      const payments = await PaymentService.getLoanPayments(id);
      sendSuccess(res, 'Loan payments retrieved successfully', payments, HTTP_STATUS.OK);
    } catch (error) {
      next(error);
    }
  }

  // Admin Module
  public static async getAdminOverview(
    _req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const overview = await OperationsService.getAdminOverview();
      sendSuccess(res, 'Admin system metrics and audit log retrieved successfully', overview, HTTP_STATUS.OK);
    } catch (error) {
      next(error);
    }
  }
}
