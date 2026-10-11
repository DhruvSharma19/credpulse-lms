import { Router } from 'express';
import { OpsController } from '../controllers/ops.controller';
import { authenticateJwt } from '../middleware/authenticate.middleware';
import { requireRoles } from '../middleware/rbac.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { sanctionDecisionSchema, disburseLoanSchema, recordPaymentSchema } from '../validations/ops.validation';
import { UserRole } from '../constants';

const router = Router();

// All operational routes require valid JWT authentication
router.use(authenticateJwt);

// 1. Sales Module: accessible to SALES (and ADMIN)
router.get(
  '/sales/leads',
  requireRoles(UserRole.SALES),
  OpsController.getSalesLeads
);

// 2. Sanction Module: accessible to SANCTION (and ADMIN)
router.get(
  '/sanction/queue',
  requireRoles(UserRole.SANCTION),
  OpsController.getSanctionQueue
);

router.post(
  '/sanction/:id/review',
  requireRoles(UserRole.SANCTION),
  validateRequest(sanctionDecisionSchema),
  OpsController.reviewSanction
);

// 3. Disbursement Module: accessible to DISBURSEMENT (and ADMIN)
router.get(
  '/disbursement/queue',
  requireRoles(UserRole.DISBURSEMENT),
  OpsController.getDisbursementQueue
);

router.post(
  '/disbursement/:id/disburse',
  requireRoles(UserRole.DISBURSEMENT),
  validateRequest(disburseLoanSchema),
  OpsController.markDisbursed
);

// 4. Collection Module: accessible to COLLECTION (and ADMIN)
router.get(
  '/collection/loans',
  requireRoles(UserRole.COLLECTION),
  OpsController.getCollectionLoans
);

router.post(
  '/collection/:id/record-payment',
  requireRoles(UserRole.COLLECTION),
  validateRequest(recordPaymentSchema),
  OpsController.recordPayment
);

router.get(
  '/collection/:id/payments',
  requireRoles(UserRole.COLLECTION),
  OpsController.getLoanPayments
);

// 5. Admin Module: accessible ONLY to ADMIN
router.get(
  '/admin/overview',
  requireRoles(UserRole.ADMIN),
  OpsController.getAdminOverview
);

export const opsRouter = router;
