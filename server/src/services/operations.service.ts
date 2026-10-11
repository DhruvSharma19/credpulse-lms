import { UserModel } from '../models/User.model';
import { LoanModel } from '../models/Loan.model';
import { AuditLogModel } from '../models/AuditLog.model';
import { UserRole, LoanStatus, ApplicationFunnelStage } from '../constants';
import { roundToTwoDecimals } from '../utils/loanCalculator.util';

export class OperationsService {
  /**
   * Sales Module: Retrieves users who registered as borrowers but haven't submitted a loan application.
   * Tracks drop-off points in the funnel for lead follow-up.
   */
  public static async getSalesLeads() {
    const appliedBorrowerIds = await LoanModel.distinct('borrowerId');

    const leads = await UserModel.find({
      role: UserRole.BORROWER,
      _id: { $nin: appliedBorrowerIds },
    })
      .select('name email phone applicationStage monthlySalary employmentMode createdAt updatedAt')
      .sort({ createdAt: -1 });

    const funnelCounts = {
      [ApplicationFunnelStage.REGISTERED]: 0,
      [ApplicationFunnelStage.PERSONAL_INFO_COMPLETED]: 0,
      [ApplicationFunnelStage.DOCUMENT_UPLOADED]: 0,
      [ApplicationFunnelStage.LOAN_CONFIGURED]: 0,
    };

    leads.forEach((lead) => {
      if (lead.applicationStage in funnelCounts) {
        funnelCounts[lead.applicationStage as keyof typeof funnelCounts]++;
      }
    });

    return {
      totalLeads: leads.length,
      funnelCounts,
      leads,
    };
  }

  /**
   * Sanction Module: Retrieves loans in APPLIED status awaiting underwriting assessment.
   */
  public static async getSanctionQueue() {
    return LoanModel.find({ status: LoanStatus.APPLIED })
      .sort({ createdAt: 1 }) // FIFO order for underwriting
      .populate('borrowerId', 'name email phone panNumber monthlySalary employmentMode salarySlipPath dateOfBirth');
  }

  /**
   * Disbursement Module: Retrieves approved/sanctioned loans awaiting capital release.
   */
  public static async getDisbursementQueue() {
    return LoanModel.find({ status: LoanStatus.SANCTIONED })
      .sort({ sanctionedAt: 1 })
      .populate('borrowerId', 'name email phone panNumber monthlySalary employmentMode')
      .populate('sanctionedBy', 'name email');
  }

  /**
   * Collection Module: Retrieves active disbursed loans and recently closed loans for payment management.
   */
  public static async getCollectionLoans() {
    const loans = await LoanModel.find({
      status: { $in: [LoanStatus.DISBURSED, LoanStatus.CLOSED] },
    })
      .sort({ status: 1, createdAt: -1 })
      .populate('borrowerId', 'name email phone panNumber')
      .populate('disbursedBy', 'name email');

    const summary = {
      activeDisbursedCount: loans.filter((l) => l.status === LoanStatus.DISBURSED).length,
      closedCount: loans.filter((l) => l.status === LoanStatus.CLOSED).length,
      totalOutstandingBalance: roundToTwoDecimals(
        loans.reduce((acc, l) => acc + (l.status === LoanStatus.DISBURSED ? l.remainingBalance : 0), 0)
      ),
      totalCollected: roundToTwoDecimals(loans.reduce((acc, l) => acc + l.totalPaidAmount, 0)),
    };

    return {
      summary,
      loans,
    };
  }

  /**
   * Admin Module: Comprehensive system-wide overview, KPI analytics, and audit log.
   */
  public static async getAdminOverview() {
    const [
      totalUsers,
      totalBorrowers,
      loans,
      recentAuditLogs,
    ] = await Promise.all([
      UserModel.countDocuments(),
      UserModel.countDocuments({ role: UserRole.BORROWER }),
      LoanModel.find().select('principalAmount calculatedInterest totalRepaymentAmount totalPaidAmount remainingBalance status'),
      AuditLogModel.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('performedBy', 'name email role')
        .populate('loanId', 'loanReference status'),
    ]);

    const statusCounts: Record<string, number> = {
      [LoanStatus.DRAFT]: 0,
      [LoanStatus.APPLIED]: 0,
      [LoanStatus.SANCTIONED]: 0,
      [LoanStatus.DISBURSED]: 0,
      [LoanStatus.REJECTED]: 0,
      [LoanStatus.CLOSED]: 0,
    };

    let totalPrincipalDisbursed = 0;
    let totalInterestExpected = 0;
    let totalRepaymentsCollected = 0;
    let totalRemainingBalance = 0;

    loans.forEach((loan) => {
      statusCounts[loan.status] = (statusCounts[loan.status] || 0) + 1;

      if (loan.status === LoanStatus.DISBURSED || loan.status === LoanStatus.CLOSED) {
        totalPrincipalDisbursed += loan.principalAmount;
        totalInterestExpected += loan.calculatedInterest;
        totalRepaymentsCollected += loan.totalPaidAmount;
      }

      if (loan.status === LoanStatus.DISBURSED) {
        totalRemainingBalance += loan.remainingBalance;
      }
    });

    return {
      metrics: {
        totalUsers,
        totalBorrowers,
        totalApplications: loans.length,
        statusCounts,
        totalPrincipalDisbursed: roundToTwoDecimals(totalPrincipalDisbursed),
        totalInterestExpected: roundToTwoDecimals(totalInterestExpected),
        totalRepaymentsCollected: roundToTwoDecimals(totalRepaymentsCollected),
        totalRemainingBalance: roundToTwoDecimals(totalRemainingBalance),
      },
      recentAuditLogs,
    };
  }
}
