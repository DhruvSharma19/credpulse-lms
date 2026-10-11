import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.config';
import { AuthenticatedRequest, AuthenticatedUserPayload } from '../types';
import { UserModel } from '../models/User.model';
import { sendError } from '../utils/apiResponse.util';
import { HTTP_STATUS } from '../constants';

export const authenticateJwt = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      sendError(res, 'Authorization token is missing or malformed', undefined, HTTP_STATUS.UNAUTHORIZED);
      return;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      sendError(res, 'Authentication token required', undefined, HTTP_STATUS.UNAUTHORIZED);
      return;
    }

    let decoded: AuthenticatedUserPayload;
    try {
      decoded = jwt.verify(token, ENV.JWT_SECRET) as AuthenticatedUserPayload;
    } catch {
      sendError(res, 'Session has expired or token is invalid. Please log in again.', undefined, HTTP_STATUS.UNAUTHORIZED);
      return;
    }

    const user = await UserModel.findById(decoded.userId).select('_id email role name');
    if (!user) {
      sendError(res, 'User associated with this token no longer exists', undefined, HTTP_STATUS.UNAUTHORIZED);
      return;
    }

    req.user = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
    };

    next();
  } catch (error) {
    next(error);
  }
};
