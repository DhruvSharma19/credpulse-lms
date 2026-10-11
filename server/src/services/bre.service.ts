import { BUSINESS_RULES, BreRejectionReason, EmploymentMode, ApplicationFunnelStage, HTTP_STATUS } from '../constants';
import { IBreEvaluationInput, IBreEvaluationResult } from '../types';
import { calculateAgeFromDob } from '../utils/date.util';
import { UserModel, IUserDocument } from '../models/User.model';
import { AppError } from '../utils/apiResponse.util';

export class BreService {
  /**
   * Pure evaluation function for the Business Rule Engine (BRE).
   * Evaluates automated underwriting criteria for loan origination:
   * 1. Age must be between 23 and 50 years.
   * 2. Monthly salary must be >= ₹25,000.
   * 3. PAN must match standard pattern `^[A-Z]{5}[0-9]{4}[A-Z]{1}$`.
   * 4. Employment mode cannot be Unemployed.
   */
  public static evaluateRules(input: IBreEvaluationInput): IBreEvaluationResult {
    const rejectionReasons: BreRejectionReason[] = [];
    const errorMessages: string[] = [];

    // Rule 1: Age check (between 23 and 50)
    let calculatedAgeYears = 0;
    try {
      calculatedAgeYears = calculateAgeFromDob(input.dateOfBirth);
      if (
        calculatedAgeYears < BUSINESS_RULES.MIN_ELIGIBLE_AGE_YEARS ||
        calculatedAgeYears > BUSINESS_RULES.MAX_ELIGIBLE_AGE_YEARS
      ) {
        rejectionReasons.push(BreRejectionReason.AGE_OUT_OF_RANGE);
        errorMessages.push(
          `Applicant age is ${calculatedAgeYears} years. Age must be between ${BUSINESS_RULES.MIN_ELIGIBLE_AGE_YEARS} and ${BUSINESS_RULES.MAX_ELIGIBLE_AGE_YEARS} years to qualify for lending.`
        );
      }
    } catch {
      rejectionReasons.push(BreRejectionReason.AGE_OUT_OF_RANGE);
      errorMessages.push('Invalid Date of Birth format.');
    }

    // Rule 2: Monthly Salary check (>= ₹25,000)
    if (input.monthlySalary < BUSINESS_RULES.MIN_MONTHLY_SALARY_INR) {
      rejectionReasons.push(BreRejectionReason.INSUFFICIENT_SALARY);
      errorMessages.push(
        `Monthly salary is ₹${input.monthlySalary.toLocaleString('en-IN')}. Minimum required salary is ₹${BUSINESS_RULES.MIN_MONTHLY_SALARY_INR.toLocaleString('en-IN')}/month.`
      );
    }

    // Rule 3: PAN Regex check
    const cleanPan = input.panNumber.trim().toUpperCase();
    if (!BUSINESS_RULES.PAN_REGEX_PATTERN.test(cleanPan)) {
      rejectionReasons.push(BreRejectionReason.INVALID_PAN_FORMAT);
      errorMessages.push(
        `Invalid PAN format '${input.panNumber}'. PAN must be exactly 5 uppercase letters, 4 digits, followed by 1 uppercase letter (e.g., ABCDE1234F).`
      );
    }

    // Rule 4: Employment status check
    if (input.employmentMode === EmploymentMode.UNEMPLOYED) {
      rejectionReasons.push(BreRejectionReason.UNEMPLOYED_STATUS);
      errorMessages.push('Applicants currently listed as Unemployed are ineligible for loan financing.');
    }

    const passed = rejectionReasons.length === 0;

    return {
      passed,
      calculatedAgeYears,
      rejectionReasons,
      errorMessages,
      evaluatedAt: new Date(),
    };
  }

  /**
   * Processes the borrower's eligibility check, runs BRE, and persists personal profile
   */
  public static async processBorrowerEligibility(
    userId: string,
    input: IBreEvaluationInput
  ): Promise<{ decision: IBreEvaluationResult; user: IUserDocument }> {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new AppError('Borrower account not found.', HTTP_STATUS.NOT_FOUND);
    }

    const decision = this.evaluateRules(input);

    // Save profile details
    user.name = input.fullName.trim();
    user.panNumber = input.panNumber.trim().toUpperCase();
    user.dateOfBirth = new Date(input.dateOfBirth);
    user.monthlySalary = input.monthlySalary;
    user.employmentMode = input.employmentMode;

    if (decision.passed) {
      user.applicationStage = ApplicationFunnelStage.PERSONAL_INFO_COMPLETED;
    }

    await user.save();

    return { decision, user };
  }
}
