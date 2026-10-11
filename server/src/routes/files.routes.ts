import { Router, Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.config';
import { UserModel } from '../models/User.model';
import { UserRole, HTTP_STATUS } from '../constants';
import { sendError } from '../utils/apiResponse.util';
import { AuthenticatedUserPayload } from '../types';

const router = Router();

// Operations roles that are allowed to inspect any borrower's income document.
const PRIVILEGED_ROLES: UserRole[] = [
  UserRole.ADMIN,
  UserRole.SANCTION,
  UserRole.DISBURSEMENT,
  UserRole.COLLECTION,
];

/**
 * Authenticated salary-slip streaming.
 *
 * Salary slips contain borrower PII and must never be served from a public
 * static directory. Access is restricted to privileged operations roles and
 * the owning borrower. The JWT may arrive via the `Authorization` header or a
 * `token` query param — the query param is required because <iframe>/<img>/
 * download tags cannot attach custom headers.
 */
router.get(
  '/salary-slip/:filename',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const headerToken = req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.split(' ')[1]
        : undefined;
      const queryToken = typeof req.query.token === 'string' ? req.query.token : undefined;
      const token = headerToken || queryToken;

      if (!token) {
        sendError(res, 'Authentication is required to access documents.', undefined, HTTP_STATUS.UNAUTHORIZED);
        return;
      }

      let decoded: AuthenticatedUserPayload;
      try {
        decoded = jwt.verify(token, ENV.JWT_SECRET) as AuthenticatedUserPayload;
      } catch {
        sendError(res, 'Session has expired or token is invalid. Please log in again.', undefined, HTTP_STATUS.UNAUTHORIZED);
        return;
      }

      // Prevent path traversal — only a bare filename within uploads is ever allowed.
      const safeName = path.basename(req.params.filename ?? '');
      if (!safeName) {
        sendError(res, 'The requested document was not found.', undefined, HTTP_STATUS.NOT_FOUND);
        return;
      }
      const uploadsDir = path.resolve(process.cwd(), ENV.UPLOAD_DIR);
      const absolutePath = path.join(uploadsDir, safeName);

      if (!absolutePath.startsWith(uploadsDir + path.sep) || !fs.existsSync(absolutePath)) {
        sendError(res, 'The requested document was not found.', undefined, HTTP_STATUS.NOT_FOUND);
        return;
      }

      // Authorization: privileged roles may view any document; a borrower may view only their own.
      if (!PRIVILEGED_ROLES.includes(decoded.role)) {
        const requester = await UserModel.findById(decoded.userId).select('salarySlipPath role');
        const ownsDocument = requester?.salarySlipPath === `/uploads/${safeName}`;
        if (!requester || requester.role !== UserRole.BORROWER || !ownsDocument) {
          sendError(res, 'You are not authorized to view this document.', undefined, HTTP_STATUS.FORBIDDEN);
          return;
        }
      }

      res.sendFile(absolutePath);
    } catch (error) {
      next(error);
    }
  }
);

export const filesRouter = router;
