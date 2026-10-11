import { Router } from 'express';
import { authRouter } from './auth.routes';
import { borrowerRouter } from './borrower.routes';
import { opsRouter } from './ops.routes';
import { filesRouter } from './files.routes';

const router = Router();

router.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Loan Management System API',
  });
});

router.use('/auth', authRouter);
router.use('/borrower', borrowerRouter);
router.use('/ops', opsRouter);
router.use('/files', filesRouter);

export const apiRouter = router;
