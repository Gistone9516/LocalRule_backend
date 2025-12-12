import { PrismaClient } from '@prisma/client';
import { prisma } from '../config/database';
import { config } from '../config';
import { AppError, ErrorCode } from '../utils/errors';
import { hashPassword, verifyPassword, assertPasswordStrength } from '../utils/password';
import {
  generateTokens,
  verifyToken,
  AuthTokens,
  TokenPayload,
} from '../utils/jwt';

export interface RegisterDto {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export type PlanType = 'free' | 'basic' | 'pro' | 'enterprise';

export interface AdminData {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  phone: string | null;
  plan: PlanType;
  isActive: boolean;
  emailVerifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface AuthResult {
  admin: Omit<AdminData, 'passwordHash'>;
  tokens: AuthTokens;
}

// Set of invalidated tokens (in production, use Redis or database)
const invalidatedTokens = new Set<string>();

export class AuthService {
  private prisma: PrismaClient;

  constructor(prismaClient: PrismaClient = prisma) {
    this.prisma = prismaClient;
  }

  /**
   * Register a new admin account
   * Requirements: 2.1, 2.2, 2.7
   */
  async register(data: RegisterDto): Promise<AuthResult> {
    // Validate password strength
    assertPasswordStrength(data.password);

    // Check if email already exists
    const existingAdmin = await this.prisma.admin.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existingAdmin) {
      throw new AppError(
        ErrorCode.EMAIL_ALREADY_EXISTS,
        'An account with this email already exists',
        409
      );
    }

    // Hash password
    const passwordHash = await hashPassword(data.password);

    // Create admin
    const admin = await this.prisma.admin.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash,
        name: data.name,
        phone: data.phone || null,
        plan: 'free',
        isActive: true,
      },
    });

    // Generate tokens
    const tokenPayload: Omit<TokenPayload, 'type'> = {
      adminId: admin.id,
      email: admin.email,
      plan: admin.plan,
    };
    const tokens = generateTokens(tokenPayload);

    // Store refresh token
    await this.storeRefreshToken(admin.id, tokens.refreshToken);

    // Return admin without password hash
    const { passwordHash: _, ...adminWithoutPassword } = admin;

    return {
      admin: adminWithoutPassword,
      tokens,
    };
  }

  /**
   * Login with email and password
   * Requirements: 2.3, 2.4, 2.8, 2.9
   */
  async login(data: LoginDto): Promise<AuthResult> {
    const email = data.email.toLowerCase();

    // Check for dev account bypass in development environment
    if (this.isDevAccountLogin(email, data.password)) {
      return this.handleDevAccountLogin();
    }

    // Find admin by email
    const admin = await this.prisma.admin.findUnique({
      where: { email },
    });

    if (!admin || admin.deletedAt) {
      throw new AppError(
        ErrorCode.INVALID_CREDENTIALS,
        'Invalid email or password',
        401
      );
    }

    // Verify password
    const isValidPassword = await verifyPassword(data.password, admin.passwordHash);

    if (!isValidPassword) {
      throw new AppError(
        ErrorCode.INVALID_CREDENTIALS,
        'Invalid email or password',
        401
      );
    }

    // Check if account is active
    if (!admin.isActive) {
      throw new AppError(
        ErrorCode.INVALID_CREDENTIALS,
        'Account is deactivated',
        401
      );
    }

    // Generate tokens
    const tokenPayload: Omit<TokenPayload, 'type'> = {
      adminId: admin.id,
      email: admin.email,
      plan: admin.plan,
    };
    const tokens = generateTokens(tokenPayload);

    // Store refresh token
    await this.storeRefreshToken(admin.id, tokens.refreshToken);

    // Return admin without password hash
    const { passwordHash: _, ...adminWithoutPassword } = admin;

    return {
      admin: adminWithoutPassword,
      tokens,
    };
  }

  /**
   * Logout and invalidate token
   * Requirements: 2.5
   */
  async logout(adminId: string, accessToken: string): Promise<void> {
    // Invalidate the access token
    invalidatedTokens.add(accessToken);

    // Delete all refresh tokens for this admin
    await this.prisma.adminToken.deleteMany({
      where: { adminId },
    });
  }

  /**
   * Refresh access token using refresh token
   * Requirements: 2.6
   */
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    // Verify refresh token
    const decoded = verifyToken(refreshToken, 'refresh');

    // Check if refresh token exists in database
    const storedToken = await this.prisma.adminToken.findUnique({
      where: { refreshToken },
      include: { admin: true },
    });

    if (!storedToken) {
      throw new AppError(
        ErrorCode.INVALID_TOKEN,
        'Invalid refresh token',
        401
      );
    }

    // Check if token is expired
    if (storedToken.expiresAt < new Date()) {
      // Delete expired token
      await this.prisma.adminToken.delete({
        where: { id: storedToken.id },
      });
      throw new AppError(
        ErrorCode.TOKEN_EXPIRED,
        'Refresh token has expired',
        401
      );
    }

    // Generate new tokens
    const tokenPayload: Omit<TokenPayload, 'type'> = {
      adminId: decoded.adminId,
      email: decoded.email,
      plan: decoded.plan,
    };
    const newTokens = generateTokens(tokenPayload);

    // Update refresh token in database
    await this.prisma.adminToken.update({
      where: { id: storedToken.id },
      data: {
        refreshToken: newTokens.refreshToken,
        expiresAt: this.calculateRefreshTokenExpiry(),
      },
    });

    return newTokens;
  }

  /**
   * Check if a token is invalidated
   */
  isTokenInvalidated(token: string): boolean {
    return invalidatedTokens.has(token);
  }

  /**
   * Get admin by ID
   */
  async getAdminById(adminId: string): Promise<Omit<AdminData, 'passwordHash'> | null> {
    const admin = await this.prisma.admin.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      return null;
    }

    const { passwordHash: _, ...adminWithoutPassword } = admin;
    return adminWithoutPassword;
  }

  /**
   * Store refresh token in database
   */
  private async storeRefreshToken(adminId: string, refreshToken: string): Promise<void> {
    await this.prisma.adminToken.create({
      data: {
        adminId,
        refreshToken,
        expiresAt: this.calculateRefreshTokenExpiry(),
      },
    });
  }

  /**
   * Calculate refresh token expiry date
   */
  private calculateRefreshTokenExpiry(): Date {
    const expiresIn = config.jwt.refreshExpiresIn;
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    
    if (!match) {
      // Default to 7 days
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];
    let milliseconds: number;

    switch (unit) {
      case 's':
        milliseconds = value * 1000;
        break;
      case 'm':
        milliseconds = value * 60 * 1000;
        break;
      case 'h':
        milliseconds = value * 60 * 60 * 1000;
        break;
      case 'd':
        milliseconds = value * 24 * 60 * 60 * 1000;
        break;
      default:
        milliseconds = 7 * 24 * 60 * 60 * 1000;
    }

    return new Date(Date.now() + milliseconds);
  }

  /**
   * Check if this is a dev account login attempt
   * Requirements: 2.8, 2.9
   */
  private isDevAccountLogin(email: string, password: string): boolean {
    return (
      config.isDevelopment() &&
      email === config.dev.email.toLowerCase() &&
      password === config.dev.password
    );
  }

  /**
   * Handle dev account login (bypass authentication)
   * Requirements: 2.8, 2.9
   */
  private async handleDevAccountLogin(): Promise<AuthResult> {
    // Find or create dev admin
    let admin = await this.prisma.admin.findUnique({
      where: { email: config.dev.email.toLowerCase() },
    });

    if (!admin) {
      // Create dev admin with all permissions
      const passwordHash = await hashPassword(config.dev.password);
      admin = await this.prisma.admin.create({
        data: {
          email: config.dev.email.toLowerCase(),
          passwordHash,
          name: 'Developer',
          plan: 'enterprise', // Full access
          isActive: true,
          emailVerifiedAt: new Date(),
        },
      });
    }

    // Generate tokens with full permissions
    const tokenPayload: Omit<TokenPayload, 'type'> = {
      adminId: admin.id,
      email: admin.email,
      plan: admin.plan,
    };
    const tokens = generateTokens(tokenPayload);

    // Store refresh token
    await this.storeRefreshToken(admin.id, tokens.refreshToken);

    const { passwordHash: _, ...adminWithoutPassword } = admin;

    return {
      admin: adminWithoutPassword,
      tokens,
    };
  }
}

// Export singleton instance
export const authService = new AuthService();

// Export function to clear invalidated tokens (for testing)
export function clearInvalidatedTokens(): void {
  invalidatedTokens.clear();
}
