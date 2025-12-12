import { Request, Response, NextFunction } from 'express';
import { qrService } from '../services/qr.service';
import { successResponse, createdResponse } from '../utils/response';
import { AppError, ErrorCode } from '../utils/errors';

export class QRController {
  /**
   * Generate a QR code for a space
   * POST /api/v1/spaces/:spaceId/qr
   * Requirements: 7.1
   */
  async generate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.adminId;
      const { spaceId } = req.params;

      if (!adminId) {
        throw AppError.unauthorized('Authentication required');
      }

      const qrCode = await qrService.generate(spaceId, adminId);

      createdResponse(res, { qrCode }, req.id);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get QR code for a space
   * GET /api/v1/spaces/:spaceId/qr
   * Requirements: 7.1
   */
  async getBySpaceId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.adminId;
      const { spaceId } = req.params;

      if (!adminId) {
        throw AppError.unauthorized('Authentication required');
      }

      const qrCode = await qrService.findBySpaceId(spaceId);

      if (!qrCode) {
        throw new AppError(ErrorCode.QR_NOT_FOUND, 'QR code not found for this space', 404);
      }

      successResponse(res, { qrCode }, 200, req.id);
    } catch (error) {
      next(error);
    }
  }


  /**
   * Find space by QR code (public endpoint for guests)
   * GET /api/v1/qr/:code
   * Requirements: 7.2
   */
  async findByCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { code } = req.params;

      if (!code || code.length !== 8) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          'QR code must be exactly 8 characters',
          400
        );
      }

      const space = await qrService.findByCode(code.toUpperCase());

      successResponse(res, { space }, 200, req.id);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Scan QR code (increments counter)
   * POST /api/v1/qr/:code/scan
   * Requirements: 7.3
   */
  async scan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { code } = req.params;

      if (!code || code.length !== 8) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          'QR code must be exactly 8 characters',
          400
        );
      }

      const qrCode = await qrService.incrementScanCount(code.toUpperCase());

      successResponse(res, { qrCode }, 200, req.id);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete QR code for a space
   * DELETE /api/v1/spaces/:spaceId/qr
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.adminId;
      const { spaceId } = req.params;

      if (!adminId) {
        throw AppError.unauthorized('Authentication required');
      }

      await qrService.delete(spaceId, adminId);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export const qrController = new QRController();
