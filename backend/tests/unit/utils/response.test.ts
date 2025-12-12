import { Response } from 'express';
import * as fc from 'fast-check';
import {
  successResponse,
  errorResponse,
  createdResponse,
  ApiResponse,
} from '../../../src/utils/response';

// Mock Response object
function createMockResponse(): Response {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

describe('Response Utils', () => {
  describe('successResponse', () => {
    it('should return success response with correct structure', () => {
      const res = createMockResponse();
      const data = { id: '123', name: 'test' };

      successResponse(res, data);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data,
          meta: expect.objectContaining({
            timestamp: expect.any(String),
            requestId: expect.any(String),
          }),
        })
      );
    });

    it('should use custom status code', () => {
      const res = createMockResponse();
      successResponse(res, {}, 201);
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('errorResponse', () => {
    it('should return error response with correct structure', () => {
      const res = createMockResponse();

      errorResponse(res, 'TEST_ERROR', 'Test error message', 400);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: {
            code: 'TEST_ERROR',
            message: 'Test error message',
            details: undefined,
          },
          meta: expect.objectContaining({
            timestamp: expect.any(String),
            requestId: expect.any(String),
          }),
        })
      );
    });

    it('should include error details when provided', () => {
      const res = createMockResponse();
      const details = { field: 'email', reason: 'invalid' };

      errorResponse(res, 'VALIDATION_ERROR', 'Validation failed', 400, details);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            details,
          }),
        })
      );
    });
  });

  describe('createdResponse', () => {
    it('should return 201 status code', () => {
      const res = createMockResponse();
      createdResponse(res, { id: '123' });
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  /**
   * Property Test: Response format is standardized
   * **Feature: backend-api, Property 42: Response format is standardized**
   * **Validates: Requirements 10.5**
   */
  describe('Property: Response format is standardized', () => {
    it('should always include success, meta.timestamp, and meta.requestId', () => {
      fc.assert(
        fc.property(fc.anything(), data => {
          const res = createMockResponse();
          successResponse(res, data);

          const jsonCall = (res.json as jest.Mock).mock.calls[0][0] as ApiResponse;

          // Verify structure
          expect(jsonCall).toHaveProperty('success', true);
          expect(jsonCall).toHaveProperty('data');
          expect(jsonCall).toHaveProperty('meta');
          expect(jsonCall.meta).toHaveProperty('timestamp');
          expect(jsonCall.meta).toHaveProperty('requestId');

          // Verify timestamp is valid ISO string
          expect(() => new Date(jsonCall.meta.timestamp)).not.toThrow();

          // Verify requestId is a non-empty string
          expect(typeof jsonCall.meta.requestId).toBe('string');
          expect(jsonCall.meta.requestId.length).toBeGreaterThan(0);
        })
      );
    });

    it('error responses should always include success=false and error object', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          fc.string({ minLength: 1 }),
          fc.integer({ min: 400, max: 599 }),
          (code, message, statusCode) => {
            const res = createMockResponse();
            errorResponse(res, code, message, statusCode);

            const jsonCall = (res.json as jest.Mock).mock.calls[0][0] as ApiResponse;

            expect(jsonCall).toHaveProperty('success', false);
            expect(jsonCall).toHaveProperty('error');
            expect(jsonCall.error).toHaveProperty('code', code);
            expect(jsonCall.error).toHaveProperty('message', message);
            expect(jsonCall).toHaveProperty('meta');
          }
        )
      );
    });
  });
});
