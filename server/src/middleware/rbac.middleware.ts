import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { UserRole, HTTP_STATUS } from '../constants';
import { sendError } from '../utils/apiResponse.util';

export const requireRoles = (...allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Authentication required before accessing this endpoint', undefined, HTTP_STATUS.UNAUTHORIZED);
      return;
    }

    // Admin has universal operational clearance across all modules
    if (req.user.role === UserRole.ADMIN) {
      next();
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      sendError(
        res,
        `Access forbidden: Role '${req.user.role}' is not authorized to access this module`,
        [`Requires one of: ${allowedRoles.join(', ')}`],
        HTTP_STATUS.FORBIDDEN
      );
      return;
    }

    next();
  };
};
