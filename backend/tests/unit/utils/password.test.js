"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const password_1 = require("../../../src/utils/password");
const errors_1 = require("../../../src/utils/errors");
describe('Password Utils', () => {
    describe('hashPassword', () => {
        it('should hash a password', async () => {
            const password = 'Test1234!';
            const hash = await (0, password_1.hashPassword)(password);
            expect(hash).toBeDefined();
            expect(hash).not.toBe(password);
            expect(hash.startsWith('$2b$')).toBe(true); // bcrypt hash prefix
        });
        it('should generate different hashes for same password', async () => {
            const password = 'Test1234!';
            const hash1 = await (0, password_1.hashPassword)(password);
            const hash2 = await (0, password_1.hashPassword)(password);
            expect(hash1).not.toBe(hash2);
        });
    });
    describe('verifyPassword', () => {
        it('should verify correct password', async () => {
            const password = 'Test1234!';
            const hash = await (0, password_1.hashPassword)(password);
            const isValid = await (0, password_1.verifyPassword)(password, hash);
            expect(isValid).toBe(true);
        });
        it('should reject incorrect password', async () => {
            const password = 'Test1234!';
            const hash = await (0, password_1.hashPassword)(password);
            const isValid = await (0, password_1.verifyPassword)('WrongPassword!', hash);
            expect(isValid).toBe(false);
        });
    });
    describe('validatePasswordStrength', () => {
        it('should accept valid password', () => {
            const result = (0, password_1.validatePasswordStrength)('Test1234!');
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });
        it('should reject password shorter than 8 characters', () => {
            const result = (0, password_1.validatePasswordStrength)('Te1!');
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Password must be at least 8 characters long');
        });
        it('should reject password without letters', () => {
            const result = (0, password_1.validatePasswordStrength)('12345678!');
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Password must contain at least one letter');
        });
        it('should reject password without numbers', () => {
            const result = (0, password_1.validatePasswordStrength)('TestTest!');
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Password must contain at least one number');
        });
        it('should reject password without special characters', () => {
            const result = (0, password_1.validatePasswordStrength)('Test1234');
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Password must contain at least one special character');
        });
        it('should return multiple errors for multiple violations', () => {
            const result = (0, password_1.validatePasswordStrength)('test');
            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(1);
        });
    });
    describe('assertPasswordStrength', () => {
        it('should not throw for valid password', () => {
            expect(() => (0, password_1.assertPasswordStrength)('Test1234!')).not.toThrow();
        });
        it('should throw AppError for weak password', () => {
            try {
                (0, password_1.assertPasswordStrength)('weak');
                fail('Should have thrown');
            }
            catch (error) {
                const appError = error;
                expect(appError.code).toBe(errors_1.ErrorCode.WEAK_PASSWORD);
                expect(appError.statusCode).toBe(400);
            }
        });
    });
    describe('isStrongPassword', () => {
        it('should return true for strong password', () => {
            expect((0, password_1.isStrongPassword)('Test1234!')).toBe(true);
        });
        it('should return false for weak password', () => {
            expect((0, password_1.isStrongPassword)('weak')).toBe(false);
            expect((0, password_1.isStrongPassword)('12345678')).toBe(false);
            expect((0, password_1.isStrongPassword)('TestTest')).toBe(false);
        });
    });
    describe('generateRandomPassword', () => {
        it('should generate password of specified length', () => {
            const password = (0, password_1.generateRandomPassword)(16);
            expect(password.length).toBe(16);
        });
        it('should generate strong password by default', () => {
            const password = (0, password_1.generateRandomPassword)();
            expect((0, password_1.isStrongPassword)(password)).toBe(true);
        });
        it('should generate different passwords each time', () => {
            const password1 = (0, password_1.generateRandomPassword)();
            const password2 = (0, password_1.generateRandomPassword)();
            expect(password1).not.toBe(password2);
        });
    });
});
//# sourceMappingURL=password.test.js.map