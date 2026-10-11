import { z } from 'zod';
import { EmploymentMode, BUSINESS_RULES } from '../constants';

export const breEligibilitySchema = z.object({
  fullName: z.string().min(2, 'Full Name is required and must be at least 2 characters'),
  panNumber: z
    .string()
    .trim()
    .toUpperCase()
    .regex(BUSINESS_RULES.PAN_REGEX_PATTERN, 'Invalid PAN format. Valid format is 5 uppercase letters, 4 digits, 1 uppercase letter (e.g. ABCDE1234F)'),
  dateOfBirth: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Valid Date of Birth (YYYY-MM-DD) is required',
  }),
  monthlySalary: z.number().min(0, 'Monthly salary cannot be negative'),
  employmentMode: z.nativeEnum(EmploymentMode, {
    errorMap: () => ({ message: 'Employment mode must be SALARIED, SELF_EMPLOYED, or UNEMPLOYED' }),
  }),
});

export const applyLoanSchema = z.object({
  principalAmount: z
    .number()
    .min(BUSINESS_RULES.MIN_LOAN_AMOUNT_INR, `Loan amount must be at least ₹${BUSINESS_RULES.MIN_LOAN_AMOUNT_INR.toLocaleString('en-IN')}`)
    .max(BUSINESS_RULES.MAX_LOAN_AMOUNT_INR, `Loan amount cannot exceed ₹${BUSINESS_RULES.MAX_LOAN_AMOUNT_INR.toLocaleString('en-IN')}`),
  tenureDays: z
    .number()
    .int('Tenure must be an integer number of days')
    .min(BUSINESS_RULES.MIN_TENURE_DAYS, `Tenure must be at least ${BUSINESS_RULES.MIN_TENURE_DAYS} days`)
    .max(BUSINESS_RULES.MAX_TENURE_DAYS, `Tenure cannot exceed ${BUSINESS_RULES.MAX_TENURE_DAYS} days`),
});

export type BreEligibilityInput = z.infer<typeof breEligibilitySchema>;
export type ApplyLoanInput = z.infer<typeof applyLoanSchema>;
