import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { UserModel, IUserDocument } from '../models/User.model';
import { UserRole, ApplicationFunnelStage, HTTP_STATUS } from '../constants';
import { ENV } from '../config/env.config';
import { AppError } from '../utils/apiResponse.util';
import { AuthenticatedUserPayload } from '../types';

export class AuthService {
  private static readonly SALT_ROUNDS = 10;

  public static async registerUser(data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    role?: UserRole;
  }): Promise<{ user: Partial<IUserDocument>; token: string }> {
    const existing = await UserModel.findOne({ email: data.email.toLowerCase() });
    if (existing) {
      throw new AppError('An account with this email address already exists.', HTTP_STATUS.CONFLICT);
    }

    const passwordHash = await bcrypt.hash(data.password, this.SALT_ROUNDS);

    const user = await UserModel.create({
      name: data.name.trim(),
      email: data.email.toLowerCase().trim(),
      passwordHash,
      phone: data.phone?.trim(),
      role: data.role || UserRole.BORROWER,
      applicationStage: ApplicationFunnelStage.REGISTERED,
    });

    const token = this.generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
    });

    return {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        applicationStage: user.applicationStage,
      },
      token,
    };
  }

  public static async loginUser(data: {
    email: string;
    password: string;
  }): Promise<{ user: Partial<IUserDocument>; token: string }> {
    const user = await UserModel.findOne({ email: data.email.toLowerCase().trim() });
    if (!user) {
      throw new AppError('Invalid email or password credentials.', HTTP_STATUS.UNAUTHORIZED);
    }

    const isMatch = await bcrypt.compare(data.password, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Invalid email or password credentials.', HTTP_STATUS.UNAUTHORIZED);
    }

    const token = this.generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
    });

    return {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        panNumber: user.panNumber,
        dateOfBirth: user.dateOfBirth,
        monthlySalary: user.monthlySalary,
        employmentMode: user.employmentMode,
        salarySlipPath: user.salarySlipPath,
        applicationStage: user.applicationStage,
      },
      token,
    };
  }

  public static async getUserProfile(userId: string): Promise<IUserDocument> {
    const user = await UserModel.findById(userId).select('-passwordHash');
    if (!user) {
      throw new AppError('User profile not found.', HTTP_STATUS.NOT_FOUND);
    }
    return user;
  }

  public static generateToken(payload: AuthenticatedUserPayload): string {
    const options: SignOptions = {
      expiresIn: 86400, // 24 hours in seconds (strictly typed)
    };
    return jwt.sign(payload, ENV.JWT_SECRET, options);
  }
}
