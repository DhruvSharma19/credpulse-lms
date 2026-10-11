import { Router } from 'express';
import { BorrowerController } from '../controllers/borrower.controller';
import { authenticateJwt } from '../middleware/authenticate.middleware';
import { requireRoles } from '../middleware/rbac.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { uploadSalarySlip } from '../middleware/upload.middleware';
import { breEligibilitySchema, applyLoanSchema } from '../validations/borrower.validation';
import { UserRole } from '../constants';

const router = Router();

// Protect all borrower endpoints with JWT authentication and Role checks
router.use(authenticateJwt);
router.use(requireRoles(UserRole.BORROWER, UserRole.ADMIN));

router.post(
  '/eligibility-check',
  validateRequest(breEligibilitySchema),
  BorrowerController.checkEligibility
);

router.post(
  '/upload-salary-slip',
  uploadSalarySlip,
  BorrowerController.uploadSalarySlip
);

router.get('/calculate', BorrowerController.calculateLoan);

router.post(
  '/apply',
  validateRequest(applyLoanSchema),
  BorrowerController.applyForLoan
);

router.get('/my-loans', BorrowerController.getMyLoans);

export const borrowerRouter = router;
