import { BUSINESS_RULES } from '../constants';
import { ILoanCalculationResult } from '../types';

/**
 * Rounds a number to exactly 2 decimal places using epsilon rounding
 * to eliminate IEEE-754 floating point drift in financial arithmetic.
 */
export const roundToTwoDecimals = (value: number): number => {
  return Math.round((value + Number.EPSILON) * 100) / 100;
};

/**
 * Calculates Simple Interest and Total Repayment strictly following the specification:
 * SI = (P * R * T) / (365 * 100)
 * where:
 *   P = Principal amount in INR
 *   R = Annual interest rate in % (fixed at 12% p.a.)
 *   T = Tenure in days
 * Total Repayment = P + SI
 */
export const calculateLoanDetails = (
  principalAmount: number,
  tenureDays: number,
  interestRateAnnual: number = BUSINESS_RULES.FIXED_ANNUAL_INTEREST_RATE_PERCENT
): ILoanCalculationResult => {
  if (principalAmount <= 0) {
    throw new Error('Principal amount must be greater than zero.');
  }

  if (tenureDays <= 0) {
    throw new Error('Tenure days must be greater than zero.');
  }

  // SI = (P * R * T) / (365 * 100)
  const rawInterest = (principalAmount * interestRateAnnual * tenureDays) / (BUSINESS_RULES.DAYS_PER_YEAR * 100);
  const calculatedInterest = roundToTwoDecimals(rawInterest);
  const totalRepaymentAmount = roundToTwoDecimals(principalAmount + calculatedInterest);
  const dailyInterest = roundToTwoDecimals(calculatedInterest / tenureDays);

  return {
    principalAmount: roundToTwoDecimals(principalAmount),
    tenureDays,
    interestRateAnnual,
    calculatedInterest,
    totalRepaymentAmount,
    dailyInterest,
  };
};
