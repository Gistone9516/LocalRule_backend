import { Request, Response, NextFunction } from 'express';
import { authService, RegisterDto, LoginDto } from '../services/auth.service';
import { successResponse, createdResponse } from '../utils/response';
import { AppError, ErrorCode } from '../utils/errors';
import { extractTokenFromHeader } from '../utils/jwt';

export class AuthController {
  /**
   * Register a new admin account
   * POST /api/v1/auth/register
   */
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, name, phone } = req.body;

      // Validate required fields
      if (!email || !password || !name) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          'Email, password, and name are required',
          400
        );
      }

      const registerData: RegisterDto = {
        email,
        password,
        name,
        phone,
      };

      const result = await authService.register(registerData);

      createdResponse(res, result, req.id);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login with email and password
   * POST /api/v1/auth/login
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;

      // Validate required fields
      if (!email || !password) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          'Email and password are required',
          400
        );
      }

      const loginData: LoginDto = {
        email,
        password,
      };

      const result = await authService.login(loginData);

      successResponse(res, result, 200, req.id);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout and invalidate token
   * POST /api/v1/auth/logout
   */
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.adminId;
      const token = extractTokenFromHeader(req.headers.authorization);

      if (!adminId || !token) {
        throw AppError.unauthorized('Authentication required');
      }

      await authService.logout(adminId, token);

      successResponse(res, { message: 'Logout successful' }, 200, req.id);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh access token
   * POST /api/v1/auth/refresh
   */
  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          'Refresh token is required',
          400
        );
      }

      const tokens = await authService.refreshToken(refreshToken);

      successResponse(res, { tokens }, 200, req.id);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user profile
   * GET /api/v1/auth/me
   */
  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.adminId;

      if (!adminId) {
        throw AppError.unauthorized('Authentication required');
      }

      const admin = await authService.getAdminById(adminId);

      if (!admin) {
        throw AppError.unauthorized('User not found');
      }

      successResponse(res, { admin }, 200, req.id);
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
