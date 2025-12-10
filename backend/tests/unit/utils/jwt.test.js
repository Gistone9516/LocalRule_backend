"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jwt_1 = require("../../../src/utils/jwt");
describe('JWT Utils', () => {
    const testPayload = {
        adminId: 'test-admin-id',
        email: 'test@example.com',
        plan: 'free',
    };
    describe('generateAccessToken', () => {
        it('should generate a valid access token', () => {
            const token = (0, jwt_1.generateAccessToken)(testPayload);
            expect(token).toBeDefined();
            expect(typeof token).toBe('string');
            expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
        });
    });
    describe('generateRefreshToken', () => {
        it('should generate a valid refresh token', () => {
            const token = (0, jwt_1.generateRefreshToken)(testPayload);
            expect(token).toBeDefined();
            expect(typeof token).toBe('string');
            expect(token.split('.')).toHaveLength(3);
        });
    });
    describe('generateTokens', () => {
        it('should generate both access and refresh tokens', () => {
            const tokens = (0, jwt_1.generateTokens)(testPayload);
            expect(tokens.accessToken).toBeDefined();
            expect(tokens.refreshToken).toBeDefined();
            expect(tokens.expiresIn).toBeGreaterThan(0);
        });
    });
    describe('verifyToken', () => {
        it('should verify a valid access token', () => {
            const token = (0, jwt_1.generateAccessToken)(testPayload);
            const decoded = (0, jwt_1.verifyToken)(token, 'access');
            expect(decoded.adminId).toBe(testPayload.adminId);
            expect(decoded.email).toBe(testPayload.email);
            expect(decoded.plan).toBe(testPayload.plan);
            expect(decoded.type).toBe('access');
        });
        it('should verify a valid refresh token', () => {
            const token = (0, jwt_1.generateRefreshToken)(testPayload);
            const decoded = (0, jwt_1.verifyToken)(token, 'refresh');
            expect(decoded.adminId).toBe(testPayload.adminId);
            expect(decoded.type).toBe('refresh');
        });
        it('should throw error for invalid token', () => {
            expect(() => (0, jwt_1.verifyToken)('invalid-token')).toThrow();
        });
        it('should throw error for wrong token type', () => {
            const accessToken = (0, jwt_1.generateAccessToken)(testPayload);
            expect(() => (0, jwt_1.verifyToken)(accessToken, 'refresh')).toThrow();
        });
    });
    describe('decodeToken', () => {
        it('should decode a token without verification', () => {
            const token = (0, jwt_1.generateAccessToken)(testPayload);
            const decoded = (0, jwt_1.decodeToken)(token);
            expect(decoded).not.toBeNull();
            expect(decoded?.adminId).toBe(testPayload.adminId);
        });
        it('should return null for invalid token', () => {
            const decoded = (0, jwt_1.decodeToken)('invalid-token');
            expect(decoded).toBeNull();
        });
    });
    describe('isTokenExpired', () => {
        it('should return false for valid non-expired token', () => {
            const token = (0, jwt_1.generateAccessToken)(testPayload);
            expect((0, jwt_1.isTokenExpired)(token)).toBe(false);
        });
        it('should return true for invalid token', () => {
            expect((0, jwt_1.isTokenExpired)('invalid-token')).toBe(true);
        });
    });
    describe('extractTokenFromHeader', () => {
        it('should extract token from valid Bearer header', () => {
            const token = 'test-token';
            const header = `Bearer ${token}`;
            expect((0, jwt_1.extractTokenFromHeader)(header)).toBe(token);
        });
        it('should return null for missing header', () => {
            expect((0, jwt_1.extractTokenFromHeader)(undefined)).toBeNull();
        });
        it('should return null for invalid format', () => {
            expect((0, jwt_1.extractTokenFromHeader)('InvalidFormat token')).toBeNull();
            expect((0, jwt_1.extractTokenFromHeader)('Bearer')).toBeNull();
            expect((0, jwt_1.extractTokenFromHeader)('token')).toBeNull();
        });
        it('should handle case-insensitive Bearer', () => {
            expect((0, jwt_1.extractTokenFromHeader)('bearer test-token')).toBe('test-token');
            expect((0, jwt_1.extractTokenFromHeader)('BEARER test-token')).toBe('test-token');
        });
    });
});
//# sourceMappingURL=jwt.test.js.map