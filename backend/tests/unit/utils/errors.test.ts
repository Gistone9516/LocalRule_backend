import { Request, Response, NextFunction } from 'express';
import * as fc from 'fast-check';
import { AppError, ErrorCode } from '../../../src/utils/errors';
import { errorHandler } from '../../../src/middleware/error.middleware';
import { ApiResponse } from '../../../src/utils/response';

// Mock Response object
function createMockResponse(): Response {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

// Mock Request object
function createMockRequest(overrides: Partial<Request> = {}): Request {
  return {
    id: 'test-request-id',
    method: 'POST',
    path: '/test',
    ...overrides,
  } as unknown as Request;
}

describe('Error Utils', () => {
  describe('AppError', () => {
    it('should create error with correct properties', () => {
      const error = new AppError(ErrorCode.VALIDATION_ERROR, 'Test error', 400, { field: 'test' });

      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.details).toEqual({ field: 'test' });
      expect(error.name).toBe('AppError');
    });

    it('should create bad request error', () => {
      const error = AppError.badRequest(ErrorCode.VALIDATION_ERROR, 'Bad request');
      expect(error.statusCode).toBe(400);
    });

    it('should create unauthorized error', () => {
      const error = AppError.unauthorized();
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe(ErrorCode.UNAUTHORIZED);
    });

    it('should create not found error', () => {
      const error = AppError.notFound(ErrorCode.NOT_FOUND, 'Not found');
      expect(error.statusCode).toBe(404);
    });

    it('should create internal error', () => {
      const error = AppError.internal();
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe(ErrorCode.INTERNAL_ERROR);
    });
  });

  describe('errorHandler middleware', () => {
    it('should handle AppError correctly', () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const next = jest.fn() as NextFunction;
      const error = new AppError(ErrorCode.VALIDATION_ERROR, 'Validation failed', 400);

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Validation failed',
          }),
        })
      );
    });

    it('should handle unexpected errors with 500 status', () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const next = jest.fn() as NextFunction;
      const error = new Error('Unexpected error');

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: ErrorCode.INTERNAL_ERROR,
          }),
        })
      );
    });
  });

  /**
   * Property Test: Invalid data returns 400
   * **Feature: backend-api, Property 41: Invalid data returns 400**
   * **Validates: Requirements 10.3**
   */
  describe('Property: Invalid data returns 400', () => {
    it('for any validation error, the response should have status 400 and include error details', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }), // error message
          fc.record({
            field: fc.string({ minLength: 1, maxLength: 50 }),
            reason: fc.string({ minLength: 1, maxLength: 100 }),
          }), // error details
          (message, details) => {
            const req = createMockRequest();
            const res = createMockResponse();
            const next = jest.fn() as NextFunction;
            const error = AppError.badRequest(ErrorCode.VALIDATION_ERROR, message, details);

            errorHandler(error, req, res, next);

            // Verify 400 status code
            expect(res.status).toHaveBeenCalledWith(400);

            // Verify response structure
            const jsonCall = (res.json as jest.Mock).mock.calls[0][0] as ApiResponse;
            expect(jsonCall.success).toBe(false);
            expect(jsonCall.error).toBeDefined();
            expect(jsonCall.error?.code).toBe(ErrorCode.VALIDATION_ERROR);
            expect(jsonCall.error?.message).toBe(message);
            expect(jsonCall.error?.details).toEqual(details);
            expect(jsonCall.meta).toBeDefined();
            expect(jsonCall.meta.timestamp).toBeDefined();
          }
        )
      );
    });

    it('for any invalid request data error code, the response should return 400', () => {
      const validationErrorCodes = [
        ErrorCode.VALIDATION_ERROR,
        ErrorCode.WEAK_PASSWORD,
        ErrorCode.INVALID_DIMENSIONS,
        ErrorCode.INVALID_OBJECT_TYPE,
        ErrorCode.TITLE_TOO_LONG,
        ErrorCode.INVALID_RADIUS,
        ErrorCode.INVALID_FILE_FORMAT,
      ];

      fc.assert(
        fc.property(
          fc.constantFrom(...validationErrorCodes),
          fc.string({ minLength: 1, maxLength: 100 }),
          (errorCode, message) => {
            const req = createMockRequest();
            const res = createMockResponse();
            const next = jest.fn() as NextFunction;
            const error = AppError.badRequest(errorCode, message);

            errorHandler(error, req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            const jsonCall = (res.json as jest.Mock).mock.calls[0][0] as ApiResponse;
            expect(jsonCall.success).toBe(false);
            expect(jsonCall.error?.code).toBe(errorCode);
          }
        )
      );
    });
  });
});
