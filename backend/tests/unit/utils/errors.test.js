"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fc = __importStar(require("fast-check"));
const errors_1 = require("../../../src/utils/errors");
const error_middleware_1 = require("../../../src/middleware/error.middleware");
// Mock Response object
function createMockResponse() {
    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
    };
    return res;
}
// Mock Request object
function createMockRequest(overrides = {}) {
    return {
        id: 'test-request-id',
        method: 'POST',
        path: '/test',
        ...overrides,
    };
}
describe('Error Utils', () => {
    describe('AppError', () => {
        it('should create error with correct properties', () => {
            const error = new errors_1.AppError(errors_1.ErrorCode.VALIDATION_ERROR, 'Test error', 400, { field: 'test' });
            expect(error.code).toBe(errors_1.ErrorCode.VALIDATION_ERROR);
            expect(error.message).toBe('Test error');
            expect(error.statusCode).toBe(400);
            expect(error.details).toEqual({ field: 'test' });
            expect(error.name).toBe('AppError');
        });
        it('should create bad request error', () => {
            const error = errors_1.AppError.badRequest(errors_1.ErrorCode.VALIDATION_ERROR, 'Bad request');
            expect(error.statusCode).toBe(400);
        });
        it('should create unauthorized error', () => {
            const error = errors_1.AppError.unauthorized();
            expect(error.statusCode).toBe(401);
            expect(error.code).toBe(errors_1.ErrorCode.UNAUTHORIZED);
        });
        it('should create not found error', () => {
            const error = errors_1.AppError.notFound(errors_1.ErrorCode.NOT_FOUND, 'Not found');
            expect(error.statusCode).toBe(404);
        });
        it('should create internal error', () => {
            const error = errors_1.AppError.internal();
            expect(error.statusCode).toBe(500);
            expect(error.code).toBe(errors_1.ErrorCode.INTERNAL_ERROR);
        });
    });
    describe('errorHandler middleware', () => {
        it('should handle AppError correctly', () => {
            const req = createMockRequest();
            const res = createMockResponse();
            const next = jest.fn();
            const error = new errors_1.AppError(errors_1.ErrorCode.VALIDATION_ERROR, 'Validation failed', 400);
            (0, error_middleware_1.errorHandler)(error, req, res, next);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                error: expect.objectContaining({
                    code: errors_1.ErrorCode.VALIDATION_ERROR,
                    message: 'Validation failed',
                }),
            }));
        });
        it('should handle unexpected errors with 500 status', () => {
            const req = createMockRequest();
            const res = createMockResponse();
            const next = jest.fn();
            const error = new Error('Unexpected error');
            (0, error_middleware_1.errorHandler)(error, req, res, next);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                error: expect.objectContaining({
                    code: errors_1.ErrorCode.INTERNAL_ERROR,
                }),
            }));
        });
    });
    /**
     * Property Test: Invalid data returns 400
     * **Feature: backend-api, Property 41: Invalid data returns 400**
     * **Validates: Requirements 10.3**
     */
    describe('Property: Invalid data returns 400', () => {
        it('for any validation error, the response should have status 400 and include error details', () => {
            fc.assert(fc.property(fc.string({ minLength: 1, maxLength: 100 }), // error message
            fc.record({
                field: fc.string({ minLength: 1, maxLength: 50 }),
                reason: fc.string({ minLength: 1, maxLength: 100 }),
            }), // error details
            (message, details) => {
                const req = createMockRequest();
                const res = createMockResponse();
                const next = jest.fn();
                const error = errors_1.AppError.badRequest(errors_1.ErrorCode.VALIDATION_ERROR, message, details);
                (0, error_middleware_1.errorHandler)(error, req, res, next);
                // Verify 400 status code
                expect(res.status).toHaveBeenCalledWith(400);
                // Verify response structure
                const jsonCall = res.json.mock.calls[0][0];
                expect(jsonCall.success).toBe(false);
                expect(jsonCall.error).toBeDefined();
                expect(jsonCall.error?.code).toBe(errors_1.ErrorCode.VALIDATION_ERROR);
                expect(jsonCall.error?.message).toBe(message);
                expect(jsonCall.error?.details).toEqual(details);
                expect(jsonCall.meta).toBeDefined();
                expect(jsonCall.meta.timestamp).toBeDefined();
            }));
        });
        it('for any invalid request data error code, the response should return 400', () => {
            const validationErrorCodes = [
                errors_1.ErrorCode.VALIDATION_ERROR,
                errors_1.ErrorCode.WEAK_PASSWORD,
                errors_1.ErrorCode.INVALID_DIMENSIONS,
                errors_1.ErrorCode.INVALID_OBJECT_TYPE,
                errors_1.ErrorCode.TITLE_TOO_LONG,
                errors_1.ErrorCode.INVALID_RADIUS,
                errors_1.ErrorCode.INVALID_FILE_FORMAT,
            ];
            fc.assert(fc.property(fc.constantFrom(...validationErrorCodes), fc.string({ minLength: 1, maxLength: 100 }), (errorCode, message) => {
                const req = createMockRequest();
                const res = createMockResponse();
                const next = jest.fn();
                const error = errors_1.AppError.badRequest(errorCode, message);
                (0, error_middleware_1.errorHandler)(error, req, res, next);
                expect(res.status).toHaveBeenCalledWith(400);
                const jsonCall = res.json.mock.calls[0][0];
                expect(jsonCall.success).toBe(false);
                expect(jsonCall.error?.code).toBe(errorCode);
            }));
        });
    });
});
//# sourceMappingURL=errors.test.js.map