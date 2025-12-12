import { Request, Response, NextFunction } from 'express';
import { AppError, ErrorCode } from '../utils/errors';
import { verifyToken, extractTokenFromHeader, DecodedToken } from '../utils/jwt';
import { authService } from '../services/auth.service';

/**
 * Authentication middleware
 * Verifies JWT token and attaches admin info to request
 * Requirements: 10.2
 */
export async function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract token from Authorization header
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      throw new AppError(
        ErrorCode.UNAUTHORIZED,
        'Authentication required. Please provide a valid token.',
        401
      );
    }

    // Check if token is invalidated (logged out)
    if (authService.isTokenInvalidated(token)) {
      throw new AppError(
        ErrorCode.INVALID_TOKEN,
        'Token has been invalidated. Please login again.',
        401
      );
    }

    // Verify token
    let decoded: DecodedToken;
    try {
      decoded = verifyToken(token, 'access');
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        ErrorCode.INVALID_TOKEN,
        'Invalid or expired token',
        401
      );
    }

    // Attach admin info to request
    req.adminId = decoded.adminId;
    req.adminEmail = decoded.email;
    req.adminPlan = decoded.plan;

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Optional authentication middleware
 * Attaches admin info if token is present, but doesn't require it
 */
export async function optionalAuthMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (token && !authService.isTokenInvalidated(token)) {
      try {
        const decoded = verifyToken(token, 'access');
        req.adminId = decoded.adminId;
        req.adminEmail = decoded.email;
        req.adminPlan = decoded.plan;
      } catch {
        // Token is invalid, but we don't throw - just continue without auth
      }
    }

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Plan check middleware factory
 * Creates middleware that checks if admin has required plan level
 */
export function requirePlan(...allowedPlans: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.adminPlan) {
      next(AppError.unauthorized('Authentication required'));
      return;
    }

    if (!allowedPlans.includes(req.adminPlan)) {
      next(
        new AppError(
          ErrorCode.FORBIDDEN,
          `This feature requires one of the following plans: ${allowedPlans.join(', ')}`,
          403
        )
      );
      return;
    }

    next();
  };
}
