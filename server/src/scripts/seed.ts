import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { connectDatabase, disconnectDatabase } from '../config/database.config';
import { UserModel } from '../models/User.model';
import { LoanModel } from '../models/Loan.model';
import { PaymentModel } from '../models/Payment.model';
import { AuditLogModel } from '../models/AuditLog.model';
import { UserRole, LoanStatus, EmploymentMode, ApplicationFunnelStage } from '../constants';
import { calculateLoanDetails } from '../utils/loanCalculator.util';

const SALT_ROUNDS = 10;

const createMockSalarySlipFile = (filename: string): string => {
  const uploadDir = path.resolve(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filePath = path.join(uploadDir, filename);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(
      filePath,
      `======================================================
           CONFIDENTIAL SALARY STATEMENT / SLIP
======================================================
Company: TechVentures Technologies India Pvt Ltd
Employee Name: Amit Sharma
Designation: Senior Software Engineer
PAN: ABCDE1234F
Month: September 2026

Earnings:
  Basic Salary:        ₹ 45,000.00
  House Rent Allowance: ₹ 22,500.00
  Special Allowance:    ₹ 17,500.00
Gross Earnings:        ₹ 85,000.00

Deductions:
  Provident Fund:       ₹  3,600.00
  Professional Tax:     ₹    200.00
  Income Tax (TDS):     ₹  6,200.00
Total Deductions:      ₹ 10,000.00

Net Disbursed Salary:  ₹ 75,000.00
======================================================
Verification Stamp: VERIFIED & SEALED
======================================================`
    );
  }
  return `/uploads/${filename}`;
};

export const seedDatabase = async () => {
  try {
    console.log('[Seed] Connecting to database...');
    await connectDatabase();

    console.log('[Seed] Purging existing database collections for clean idempotent seed...');
    await UserModel.deleteMany({});
    await LoanModel.deleteMany({});
    await PaymentModel.deleteMany({});
    await AuditLogModel.deleteMany({});

    console.log('[Seed] Creating mock salary slip file...');
    const salarySlipUrl = createMockSalarySlipFile('demo_salary_slip.pdf');

    console.log('[Seed] Creating mandatory role accounts...');
    const defaultPasswordHash = await bcrypt.hash('Admin@1234', SALT_ROUNDS);
    const standardPasswordHash = await bcrypt.hash('Password123!', SALT_ROUNDS);

    // 1. Admin
    await UserModel.create({
      name: 'Priya Sharma (Admin)',
      email: 'admin@lms.local',
      passwordHash: defaultPasswordHash,
      role: UserRole.ADMIN,
      phone: '+91 98765 00001',
      applicationStage: ApplicationFunnelStage.SUBMITTED,
    });

    // 2. Sales Executive
    await UserModel.create({
      name: 'Rahul Verma (Sales)',
      email: 'sales@lms.local',
      passwordHash: await bcrypt.hash('Sales@1234', SALT_ROUNDS),
      role: UserRole.SALES,
      phone: '+91 98765 00002',
      applicationStage: ApplicationFunnelStage.SUBMITTED,
    });

    // 3. Sanction Executive
    const sanctionExec = await UserModel.create({
      name: 'Anjali Desai (Sanction)',
      email: 'sanction@lms.local',
      passwordHash: await bcrypt.hash('Sanction@1234', SALT_ROUNDS),
      role: UserRole.SANCTION,
      phone: '+91 98765 00003',
      applicationStage: ApplicationFunnelStage.SUBMITTED,
    });

    // 4. Disbursement Executive
    const disburseExec = await UserModel.create({
      name: 'Vikram Joshi (Disbursement)',
      email: 'disburse@lms.local',
      passwordHash: await bcrypt.hash('Disburse@1234', SALT_ROUNDS),
      role: UserRole.DISBURSEMENT,
      phone: '+91 98765 00004',
      applicationStage: ApplicationFunnelStage.SUBMITTED,
    });

    // 5. Collection Executive
    const collectionExec = await UserModel.create({
      name: 'Sneha Patel (Collection)',
      email: 'collection@lms.local',
      passwordHash: await bcrypt.hash('Collection@1234', SALT_ROUNDS),
      role: UserRole.COLLECTION,
      phone: '+91 98765 00005',
      applicationStage: ApplicationFunnelStage.SUBMITTED,
    });

    // 6. Primary Test Borrower (Active test account for evaluator)
    const primaryBorrower = await UserModel.create({
      name: 'Aarav Mehta',
      email: 'borrower@lms.local',
      passwordHash: await bcrypt.hash('Borrower@1234', SALT_ROUNDS),
      role: UserRole.BORROWER,
      phone: '+91 98765 11111',
      panNumber: 'ABCDE1234F',
      dateOfBirth: new Date('1995-06-15'), // 31 years old (valid BRE)
      monthlySalary: 75000,
      employmentMode: EmploymentMode.SALARIED,
      salarySlipPath: salarySlipUrl,
      salarySlipOriginalName: 'demo_salary_slip.pdf',
      salarySlipMimeType: 'application/pdf',
      applicationStage: ApplicationFunnelStage.DOCUMENT_UPLOADED,
    });

    // Additional Borrower 1 (Sales Lead - dropped at Registration)
    await UserModel.create({
      name: 'Karan Malhotra',
      email: 'karan.lead@gmail.com',
      passwordHash: standardPasswordHash,
      role: UserRole.BORROWER,
      phone: '+91 98111 22233',
      applicationStage: ApplicationFunnelStage.REGISTERED,
    });

    // Additional Borrower 2 (Sales Lead - completed Personal info but not uploaded docs)
    await UserModel.create({
      name: 'Neha Kapoor',
      email: 'neha.lead@gmail.com',
      passwordHash: standardPasswordHash,
      role: UserRole.BORROWER,
      phone: '+91 98222 33344',
      panNumber: 'FGHIJ5678K',
      dateOfBirth: new Date('1998-02-10'),
      monthlySalary: 42000,
      employmentMode: EmploymentMode.SALARIED,
      applicationStage: ApplicationFunnelStage.PERSONAL_INFO_COMPLETED,
    });

    // Borrower 3 (Has an APPLIED loan awaiting sanction review)
    const borrowerApplied = await UserModel.create({
      name: 'Rohan Gupta',
      email: 'rohan.applied@gmail.com',
      passwordHash: standardPasswordHash,
      role: UserRole.BORROWER,
      phone: '+91 98333 44455',
      panNumber: 'BKUPG7890L',
      dateOfBirth: new Date('1992-11-20'),
      monthlySalary: 85000,
      employmentMode: EmploymentMode.SALARIED,
      salarySlipPath: salarySlipUrl,
      salarySlipOriginalName: 'rohan_salary_slip.pdf',
      salarySlipMimeType: 'application/pdf',
      applicationStage: ApplicationFunnelStage.SUBMITTED,
    });

    const calcApplied = calculateLoanDetails(150000, 180);
    const loanApplied = await LoanModel.create({
      borrowerId: borrowerApplied._id,
      loanReference: 'LN-SEED-APPLIED-01',
      principalAmount: calcApplied.principalAmount,
      tenureDays: calcApplied.tenureDays,
      interestRateAnnual: calcApplied.interestRateAnnual,
      calculatedInterest: calcApplied.calculatedInterest,
      totalRepaymentAmount: calcApplied.totalRepaymentAmount,
      totalPaidAmount: 0,
      remainingBalance: calcApplied.totalRepaymentAmount,
      status: LoanStatus.APPLIED,
      breSnapshot: {
        passed: true,
        calculatedAgeYears: 33,
        rejectionReasons: [],
        evaluatedAt: new Date(Date.now() - 3600000),
      },
    });

    await AuditLogModel.create({
      loanId: loanApplied._id,
      action: 'LOAN_APPLIED',
      performedBy: borrowerApplied._id,
      newStatus: LoanStatus.APPLIED,
      remarks: 'Application submitted for ₹1,50,000 for 180 days.',
    });

    // Borrower 4 (Has a SANCTIONED loan awaiting disbursement)
    const borrowerSanctioned = await UserModel.create({
      name: 'Meera Iyer',
      email: 'meera.approved@gmail.com',
      passwordHash: standardPasswordHash,
      role: UserRole.BORROWER,
      phone: '+91 98444 55566',
      panNumber: 'PQRSM4321N',
      dateOfBirth: new Date('1990-04-12'),
      monthlySalary: 120000,
      employmentMode: EmploymentMode.SALARIED,
      salarySlipPath: salarySlipUrl,
      salarySlipOriginalName: 'meera_payslip.pdf',
      salarySlipMimeType: 'application/pdf',
      applicationStage: ApplicationFunnelStage.SUBMITTED,
    });

    const calcSanctioned = calculateLoanDetails(200000, 120);
    const loanSanctioned = await LoanModel.create({
      borrowerId: borrowerSanctioned._id,
      loanReference: 'LN-SEED-SANCTION-02',
      principalAmount: calcSanctioned.principalAmount,
      tenureDays: calcSanctioned.tenureDays,
      interestRateAnnual: calcSanctioned.interestRateAnnual,
      calculatedInterest: calcSanctioned.calculatedInterest,
      totalRepaymentAmount: calcSanctioned.totalRepaymentAmount,
      totalPaidAmount: 0,
      remainingBalance: calcSanctioned.totalRepaymentAmount,
      status: LoanStatus.SANCTIONED,
      breSnapshot: {
        passed: true,
        calculatedAgeYears: 36,
        rejectionReasons: [],
        evaluatedAt: new Date(Date.now() - 86400000),
      },
      sanctionRemarks: 'Income verified and credit assessment passed.',
      sanctionedBy: sanctionExec._id,
      sanctionedAt: new Date(Date.now() - 43200000),
    });

    await AuditLogModel.create({
      loanId: loanSanctioned._id,
      action: 'SANCTION_APPROVED',
      performedBy: sanctionExec._id,
      previousStatus: LoanStatus.APPLIED,
      newStatus: LoanStatus.SANCTIONED,
      remarks: 'Income verified and credit assessment passed.',
    });

    // Borrower 5 (Has an active DISBURSED loan with partial payment, ready for Collection testing)
    await UserModel.create({
      name: 'Devendra Rao',
      email: 'dev.disbursed@gmail.com',
      passwordHash: standardPasswordHash,
      role: UserRole.BORROWER,
      phone: '+91 98555 66677',
      panNumber: 'STUVW9876P',
      dateOfBirth: new Date('1988-08-25'),
      monthlySalary: 95000,
      employmentMode: EmploymentMode.SALARIED,
      salarySlipPath: salarySlipUrl,
      salarySlipOriginalName: 'dev_salary.pdf',
      salarySlipMimeType: 'application/pdf',
      applicationStage: ApplicationFunnelStage.SUBMITTED,
    });

    const calcDisbursed = calculateLoanDetails(100000, 90);
    const partialPaymentAmount = 25000;
    const loanDisbursed = await LoanModel.create({
      borrowerId: primaryBorrower._id,
      loanReference: 'LN-SEED-DISBURSED-03',
      principalAmount: calcDisbursed.principalAmount,
      tenureDays: calcDisbursed.tenureDays,
      interestRateAnnual: calcDisbursed.interestRateAnnual,
      calculatedInterest: calcDisbursed.calculatedInterest,
      totalRepaymentAmount: calcDisbursed.totalRepaymentAmount,
      totalPaidAmount: partialPaymentAmount,
      remainingBalance: calcDisbursed.totalRepaymentAmount - partialPaymentAmount,
      status: LoanStatus.DISBURSED,
      breSnapshot: {
        passed: true,
        calculatedAgeYears: 38,
        rejectionReasons: [],
        evaluatedAt: new Date(Date.now() - 172800000),
      },
      sanctionRemarks: 'All documents verified.',
      sanctionedBy: sanctionExec._id,
      sanctionedAt: new Date(Date.now() - 120000000),
      disbursementReference: 'NEFT-AXIS-9023481',
      disbursedBy: disburseExec._id,
      disbursedAt: new Date(Date.now() - 86400000),
    });

    await PaymentModel.create({
      loanId: loanDisbursed._id,
      borrowerId: primaryBorrower._id,
      utrNumber: 'UTR-SEED-PARTIAL-001',
      amount: partialPaymentAmount,
      paymentDate: new Date(Date.now() - 3600000),
      recordedBy: collectionExec._id,
      notes: 'Initial monthly instalment received.',
    });

    await AuditLogModel.create({
      loanId: loanDisbursed._id,
      action: 'PAYMENT_RECORDED',
      performedBy: collectionExec._id,
      previousStatus: LoanStatus.DISBURSED,
      newStatus: LoanStatus.DISBURSED,
      remarks: `Recorded ₹${partialPaymentAmount}. Remaining: ₹${loanDisbursed.remainingBalance}`,
    });

    // Borrower 6 (Has a CLOSED loan that was fully paid)
    const borrowerClosed = await UserModel.create({
      name: 'Sunita Reddy',
      email: 'sunita.closed@gmail.com',
      passwordHash: standardPasswordHash,
      role: UserRole.BORROWER,
      phone: '+91 98666 77788',
      panNumber: 'XYZAQ1357R',
      dateOfBirth: new Date('1994-01-18'),
      monthlySalary: 110000,
      employmentMode: EmploymentMode.SALARIED,
      salarySlipPath: salarySlipUrl,
      salarySlipOriginalName: 'sunita_slip.pdf',
      salarySlipMimeType: 'application/pdf',
      applicationStage: ApplicationFunnelStage.SUBMITTED,
    });

    const calcClosed = calculateLoanDetails(50000, 30);
    const loanClosed = await LoanModel.create({
      borrowerId: borrowerClosed._id,
      loanReference: 'LN-SEED-CLOSED-04',
      principalAmount: calcClosed.principalAmount,
      tenureDays: calcClosed.tenureDays,
      interestRateAnnual: calcClosed.interestRateAnnual,
      calculatedInterest: calcClosed.calculatedInterest,
      totalRepaymentAmount: calcClosed.totalRepaymentAmount,
      totalPaidAmount: calcClosed.totalRepaymentAmount,
      remainingBalance: 0,
      status: LoanStatus.CLOSED,
      breSnapshot: {
        passed: true,
        calculatedAgeYears: 32,
        rejectionReasons: [],
        evaluatedAt: new Date(Date.now() - 2592000000),
      },
      sanctionRemarks: 'Fast-track approved.',
      sanctionedBy: sanctionExec._id,
      sanctionedAt: new Date(Date.now() - 2500000000),
      disbursementReference: 'IMPS-HDFC-8899112',
      disbursedBy: disburseExec._id,
      disbursedAt: new Date(Date.now() - 2400000000),
      closedAt: new Date(Date.now() - 86400000),
    });

    await PaymentModel.create({
      loanId: loanClosed._id,
      borrowerId: borrowerClosed._id,
      utrNumber: 'UTR-SEED-CLOSED-FINAL-002',
      amount: calcClosed.totalRepaymentAmount,
      paymentDate: new Date(Date.now() - 86400000),
      recordedBy: collectionExec._id,
      notes: 'Full settlement payment.',
    });

    await AuditLogModel.create({
      loanId: loanClosed._id,
      action: 'PAYMENT_RECORDED_AND_AUTO_CLOSED',
      performedBy: collectionExec._id,
      previousStatus: LoanStatus.DISBURSED,
      newStatus: LoanStatus.CLOSED,
      remarks: 'Full payment received. Loan automatically closed.',
    });

    console.log('================================================================');
    console.log('✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('================================================================');
    console.log('Pre-created evaluator credentials:');
    console.log('• Admin:        admin@lms.local      / Admin@1234');
    console.log('• Sales:        sales@lms.local      / Sales@1234');
    console.log('• Sanction:     sanction@lms.local   / Sanction@1234');
    console.log('• Disbursement: disburse@lms.local   / Disburse@1234');
    console.log('• Collection:   collection@lms.local / Collection@1234');
    console.log('• Borrower:     borrower@lms.local   / Borrower@1234');
    console.log('================================================================');

    await disconnectDatabase();
    process.exit(0);
  } catch (error) {
    console.error('[Seed] Seeding failed with error:', error);
    await disconnectDatabase();
    process.exit(1);
  }
};

seedDatabase();
