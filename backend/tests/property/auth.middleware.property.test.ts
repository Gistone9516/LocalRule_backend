import * as fc from 'fast-check';
import { Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../../src/middleware/auth.middleware';
import { generateAccessToken } from '../../src/utils/jwt';
import { ErrorCode } from '../../src/utils/errors';

// Mock request/response objects
function createMockRequest(authHeader?: string): Partial<Request> {
  return {
    headers: {
      authorization: authHeader,
    },
  };
}

function createMockResponse(): Partial<Response> {
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
      await fc.assert(
        fc.asyncProperty(
          fc.constant(undefined),
          async () => {
            const req = createMockRequest(undefined) as Request;
            const res = createMockResponse() as Response;
            let capturedError: unknown = null;

            const next: NextFunction = (error?: unknown) => {
              capturedError = error;
            };

            await authMiddleware(req, res, next);

            expect(capturedError).not.toBeNull();
            const appError = capturedError as { code?: string; statusCode?: number };
            expect(appError.code).toBe(ErrorCode.UNAUTHORIZED);
            expect(appError.statusCode).toBe(401);
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should reject requests with invalid token format', async () => {
      // Generate random strings that are not valid JWT tokens
      const invalidTokenArb = fc.oneof(
        fc.string({ minLength: 1, maxLength: 50 }), // Random string
        fc.constant('Bearer'), // Just "Bearer" without token
        fc.constant('Basic abc123'), // Wrong auth type
        fc.string().map(s => `Bearer ${s}`), // Bearer with random string
      );

      await fc.assert(
        fc.asyncProperty(
          invalidTokenArb,
          async (authHeader) => {
            // Skip if it happens to be a valid JWT format
            if (authHeader.split('.').length === 3) return;

            const req = createMockRequest(authHeader) as Request;
            const res = createMockResponse() as Response;
            let capturedError: unknown = null;

            const next: NextFunction = (error?: unknown) => {
              capturedError = error;
            };

            await authMiddleware(req, res, next);

            expect(capturedError).not.toBeNull();
            const appError = capturedError as { statusCode?: number };
            expect(appError.statusCode).toBe(401);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should accept requests with valid token', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.emailAddress(),
          fc.constantFrom('free', 'basic', 'pro', 'enterprise'),
          async (adminId, email, plan) => {
            // Generate a valid token
            const token = generateAccessToken({
              adminId,
              email,
              plan,
            });

            const req = createMockRequest(`Bearer ${token}`) as Request;
            const res = createMockResponse() as Response;
            let capturedError: unknown = null;
            let nextCalled = false;

            const next: NextFunction = (error?: unknown) => {
              if (error) {
                capturedError = error;
              } else {
                nextCalled = true;
              }
            };

            await authMiddleware(req, res, next);

            // Should call next without error
            expect(capturedError).toBeNull();
            expect(nextCalled).toBe(true);

            // Should attach admin info to request
            expect(req.adminId).toBe(adminId);
            expect(req.adminEmail).toBe(email);
            expect(req.adminPlan).toBe(plan);
          }
        ),
        { numRuns: 20 }
      );
    });
  });
});
