import {
  generateAccessToken,
  generateRefreshToken,
  generateTokens,
  verifyToken,
  decodeToken,
  isTokenExpired,
  extractTokenFromHeader,
  TokenPayload,
} from '../../../src/utils/jwt';

describe('JWT Utils', () => {
  const testPayload: Omit<TokenPayload, 'type'> = {
    adminId: 'test-admin-id',
    email: 'test@example.com',
    plan: 'free',
  };

  describe('generateAccessToken', () => {
    it('should generate a valid access token', () => {
      const token = generateAccessToken(testPayload);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const token = generateRefreshToken(testPayload);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });
  });

  describe('generateTokens', () => {
    it('should generate both access and refresh tokens', () => {
      const tokens = generateTokens(testPayload);
      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();
      expect(tokens.expiresIn).toBeGreaterThan(0);
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid access token', () => {
      const token = generateAccessToken(testPayload);
      const decoded = verifyToken(token, 'access');

      expect(decoded.adminId).toBe(testPayload.adminId);
      expect(decoded.email).toBe(testPayload.email);
      expect(decoded.plan).toBe(testPayload.plan);
      expect(decoded.type).toBe('access');
    });

    it('should verify a valid refresh token', () => {
      const token = generateRefreshToken(testPayload);
      const decoded = verifyToken(token, 'refresh');

      expect(decoded.adminId).toBe(testPayload.adminId);
      expect(decoded.type).toBe('refresh');
    });

    it('should throw error for invalid token', () => {
      expect(() => verifyToken('invalid-token')).toThrow();
    });

    it('should throw error for wrong token type', () => {
      const accessToken = generateAccessToken(testPayload);
      expect(() => verifyToken(accessToken, 'refresh')).toThrow();
    });
  });

  describe('decodeToken', () => {
    it('should decode a token without verification', () => {
      const token = generateAccessToken(testPayload);
      const decoded = decodeToken(token);

      expect(decoded).not.toBeNull();
      expect(decoded?.adminId).toBe(testPayload.adminId);
    });

    it('should return null for invalid token', () => {
      const decoded = decodeToken('invalid-token');
      expect(decoded).toBeNull();
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for valid non-expired token', () => {
      const token = generateAccessToken(testPayload);
      expect(isTokenExpired(token)).toBe(false);
    });

    it('should return true for invalid token', () => {
      expect(isTokenExpired('invalid-token')).toBe(true);
    });
  });

  describe('extractTokenFromHeader', () => {
    it('should extract token from valid Bearer header', () => {
      const token = 'test-token';
      const header = `Bearer ${token}`;
      expect(extractTokenFromHeader(header)).toBe(token);
    });

    it('should return null for missing header', () => {
      expect(extractTokenFromHeader(undefined)).toBeNull();
    });

    it('should return null for invalid format', () => {
      expect(extractTokenFromHeader('InvalidFormat token')).toBeNull();
      expect(extractTokenFromHeader('Bearer')).toBeNull();
      expect(extractTokenFromHeader('token')).toBeNull();
    });

    it('should handle case-insensitive Bearer', () => {
      expect(extractTokenFromHeader('bearer test-token')).toBe('test-token');
      expect(extractTokenFromHeader('BEARER test-token')).toBe('test-token');
    });
  });
});
