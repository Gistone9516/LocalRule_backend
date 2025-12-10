import jwt, { SignOptions, VerifyOptions } from 'jsonwebtoken';
import { config } from '../config';
import { AppError, ErrorCode } from './errors';

export interface TokenPayload {
  adminId: string;
  email: string;
  plan: string;
  type: 'access' | 'refresh';
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface DecodedToken extends TokenPayload {
  iat: number;
  exp: number;
}

/**
 * Generate an access token for the given payload
 */
export function generateAccessToken(payload: Omit<TokenPayload, 'type'>): string {
  const tokenPayload: TokenPayload = {
    ...payload,
    type: 'access',
  };

  const options: SignOptions = {
    expiresIn: config.jwt.accessExpiresIn as jwt.SignOptions['expiresIn'],
  };

  return jwt.sign(tokenPayload, config.jwt.secret, options);
}

/**
 * Generate a refresh token for the given payload
 */
export function generateRefreshToken(payload: Omit<TokenPayload, 'type'>): string {
  const tokenPayload: TokenPayload = {
    ...payload,
    type: 'refresh',
  };

  const options: SignOptions = {
    expiresIn: config.jwt.refreshExpiresIn as jwt.SignOptions['expiresIn'],
  };

  return jwt.sign(tokenPayload, config.jwt.secret, options);
}


/**
 * Generate both access and refresh tokens
 */
export function generateTokens(payload: Omit<TokenPayload, 'type'>): AuthTokens {
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  // Parse expiresIn to seconds
  const expiresIn = parseExpiresIn(config.jwt.accessExpiresIn);

  return {
    accessToken,
    refreshToken,
    expiresIn,
  };
}

/**
 * Verify and decode a token
 */
export function verifyToken(token: string, type: 'access' | 'refresh' = 'access'): DecodedToken {
  try {
    const options: VerifyOptions = {};
    const decoded = jwt.verify(token, config.jwt.secret, options) as DecodedToken;

    // Verify token type
    if (decoded.type !== type) {
      throw AppError.unauthorized(`Invalid token type. Expected ${type}, got ${decoded.type}`);
    }

    return decoded;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError(ErrorCode.TOKEN_EXPIRED, 'Token has expired', 401);
    }

    if (error instanceof jwt.JsonWebTokenError) {
      throw new AppError(ErrorCode.INVALID_TOKEN, 'Invalid token', 401);
    }

    throw AppError.unauthorized('Token verification failed');
  }
}

/**
 * Decode a token without verification (useful for getting payload from expired tokens)
 */
export function decodeToken(token: string): DecodedToken | null {
  try {
    const decoded = jwt.decode(token) as DecodedToken | null;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Check if a token is expired
 */
export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) {
    return true;
  }

  const currentTime = Math.floor(Date.now() / 1000);
  return decoded.exp < currentTime;
}

/**
 * Parse expires in string to seconds
 */
function parseExpiresIn(expiresIn: string): number {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) {
    return 900; // Default 15 minutes
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 60 * 60;
    case 'd':
      return value * 60 * 60 * 24;
    default:
      return 900;
  }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return null;
  }

  return parts[1];
}
