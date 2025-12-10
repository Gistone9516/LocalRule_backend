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
const auth_middleware_1 = require("../../src/middleware/auth.middleware");
const jwt_1 = require("../../src/utils/jwt");
const errors_1 = require("../../src/utils/errors");
// Mock request/response objects
function createMockRequest(authHeader) {
    return {
        headers: {
            authorization: authHeader,
        },
    };
}
function createMockResponse() {
    return {};
}
/**
 * **Feature: backend-api, Property 40: Unauthenticated requests are rejected**
 * **Validates: Requirements 10.2**
 *
 * For any request to a protected endpoint without valid authentication,
 * the system should return 401 Unauthorized
 */
describe('Auth Middleware Property Tests', () => {
    describe('Property 40: Unauthenticated requests are rejected', () => {
        it('should reject requests without authorization header', async () => {
            await fc.assert(fc.asyncProperty(fc.constant(undefined), async () => {
                const req = createMockRequest(undefined);
                const res = createMockResponse();
                let capturedError = null;
                const next = (error) => {
                    capturedError = error;
                };
                await (0, auth_middleware_1.authMiddleware)(req, res, next);
                expect(capturedError).not.toBeNull();
                const appError = capturedError;
                expect(appError.code).toBe(errors_1.ErrorCode.UNAUTHORIZED);
                expect(appError.statusCode).toBe(401);
            }), { numRuns: 10 });
        });
        it('should reject requests with invalid token format', async () => {
            // Generate random strings that are not valid JWT tokens
            const invalidTokenArb = fc.oneof(fc.string({ minLength: 1, maxLength: 50 }), // Random string
            fc.constant('Bearer'), // Just "Bearer" without token
            fc.constant('Basic abc123'), // Wrong auth type
            fc.string().map(s => `Bearer ${s}`));
            await fc.assert(fc.asyncProperty(invalidTokenArb, async (authHeader) => {
                // Skip if it happens to be a valid JWT format
                if (authHeader.split('.').length === 3)
                    return;
                const req = createMockRequest(authHeader);
                const res = createMockResponse();
                let capturedError = null;
                const next = (error) => {
                    capturedError = error;
                };
                await (0, auth_middleware_1.authMiddleware)(req, res, next);
                expect(capturedError).not.toBeNull();
                const appError = capturedError;
                expect(appError.statusCode).toBe(401);
            }), { numRuns: 20 });
        });
        it('should accept requests with valid token', async () => {
            await fc.assert(fc.asyncProperty(fc.uuid(), fc.emailAddress(), fc.constantFrom('free', 'basic', 'pro', 'enterprise'), async (adminId, email, plan) => {
                // Generate a valid token
                const token = (0, jwt_1.generateAccessToken)({
                    adminId,
                    email,
                    plan,
                });
                const req = createMockRequest(`Bearer ${token}`);
                const res = createMockResponse();
                let capturedError = null;
                let nextCalled = false;
                const next = (error) => {
                    if (error) {
                        capturedError = error;
                    }
                    else {
                        nextCalled = true;
                    }
                };
                await (0, auth_middleware_1.authMiddleware)(req, res, next);
                // Should call next without error
                expect(capturedError).toBeNull();
                expect(nextCalled).toBe(true);
                // Should attach admin info to request
                expect(req.adminId).toBe(adminId);
                expect(req.adminEmail).toBe(email);
                expect(req.adminPlan).toBe(plan);
            }), { numRuns: 20 });
        });
    });
});
//# sourceMappingURL=auth.middleware.property.test.js.map