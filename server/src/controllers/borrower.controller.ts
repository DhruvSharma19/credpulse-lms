import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { BreService } from '../services/bre.service';
import { LoanService } from '../services/loan.service';
import { UserModel } from '../models/User.model';
import { sendSuccess, sendError, AppError } from '../utils/apiResponse.util';
import { HTTP_STATUS, ApplicationFunnelStage } from '../constants';
import { calculateLoanDetails } from '../utils/loanCalculator.util';

export class BorrowerController {
  /**
   * Evaluates BRE for personal details.
   * If any check fails, returns clear error response with HTTP 422 Unprocessable Entity.
   */
  public static async checkEligibility(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Unauthenticated request', HTTP_STATUS.UNAUTHORIZED);
      }

      const { decision, user } = await BreService.processBorrowerEligibility(
        req.user.userId,
        req.body
      );

      if (!decision.passed) {
        sendError(
          res,
          'BRE eligibility check failed. Your application cannot proceed based on lending policy criteria.',
          decision.errorMessages,
          HTTP_STATUS.UNPROCESSABLE_ENTITY
        );
        return;
      }

      sendSuccess(
        res,
        'Congratulations! You meet all initial BRE eligibility criteria.',
        {
          decision,
          profile: {
            name: user.name,
            panNumber: user.panNumber,
            dateOfBirth: user.dateOfBirth,
            monthlySalary: user.monthlySalary,
            employmentMode: user.employmentMode,
            applicationStage: user.applicationStage,
          },
        },
        HTTP_STATUS.OK
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Uploads and links borrower salary slip document (PDF/JPG/PNG <= 5MB)
   */
  public static async uploadSalarySlip(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Unauthenticated request', HTTP_STATUS.UNAUTHORIZED);
      }

      if (!req.file) {
        throw new AppError('No document file was uploaded.', HTTP_STATUS.BAD_REQUEST);
      }

      const user = await UserModel.findById(req.user.userId);
      if (!user) {
        throw new AppError('User not found.', HTTP_STATUS.NOT_FOUND);
      }

      user.salarySlipPath = `/uploads/${req.file.filename}`;
      user.salarySlipOriginalName = req.file.originalname;
      user.salarySlipMimeType = req.file.mimetype;
      user.applicationStage = ApplicationFunnelStage.DOCUMENT_UPLOADED;
      await user.save();

      sendSuccess(
        res,
        'Salary slip uploaded and verified successfully.',
        {
          filename: req.file.filename,
          originalName: req.file.originalname,
          sizeBytes: req.file.size,
          mimeType: req.file.mimetype,
          documentUrl: `/uploads/${req.file.filename}`,
        },
        HTTP_STATUS.OK
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Live calculation helper endpoint for interest breakdown
   */
  public static async calculateLoan(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const principal = parseFloat(req.query.principal as string) || 100000;
      const tenureDays = parseInt(req.query.tenureDays as string, 10) || 90;

      const calculation = calculateLoanDetails(principal, tenureDays);
      sendSuccess(res, 'Loan terms calculated successfully', calculation, HTTP_STATUS.OK);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Final submission of configured loan
   */
  public static async applyForLoan(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Unauthenticated request', HTTP_STATUS.UNAUTHORIZED);
      }

      const loan = await LoanService.applyForLoan(req.user.userId, req.body);
      sendSuccess(
        res,
        'Loan application submitted successfully and sent for underwriting sanction.',
        loan,
        HTTP_STATUS.CREATED
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves all loan applications submitted by the logged in borrower
   */
  public static async getMyLoans(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Unauthenticated request', HTTP_STATUS.UNAUTHORIZED);
      }

      const loans = await LoanService.getBorrowerLoans(req.user.userId);
      sendSuccess(res, 'Loans retrieved successfully', loans, HTTP_STATUS.OK);
    } catch (error) {
      next(error);
    }
  }
}
