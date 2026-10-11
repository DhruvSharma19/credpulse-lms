import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { sendSuccess } from '../utils/apiResponse.util';
import { HTTP_STATUS } from '../constants';
import { AuthenticatedRequest } from '../types';

export class AuthController {
  public static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.registerUser(req.body);
      sendSuccess(res, 'User registration completed successfully', result, HTTP_STATUS.CREATED);
    } catch (error) {
      next(error);
    }
  }

  public static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.loginUser(req.body);
      sendSuccess(res, 'User authenticated successfully', result, HTTP_STATUS.OK);
    } catch (error) {
      next(error);
    }
  }

  public static async getMe(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({ success: false, message: 'Unauthenticated' });
        return;
      }
      const user = await AuthService.getUserProfile(req.user.userId);
      sendSuccess(res, 'User profile fetched successfully', user, HTTP_STATUS.OK);
    } catch (error) {
      next(error);
    }
  }
}
