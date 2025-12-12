import { Request, Response, NextFunction } from 'express';
import { mlService } from '../services/ml.service';
import { successResponse } from '../utils/response';
import { AppError, ErrorCode } from '../utils/errors';

export class MlController {
    /**
     * Detect objects in an uploaded image
     * POST /api/v1/ml/detect
     * Requirements: FR-20
     */
    async detect(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.file) {
                throw new AppError(ErrorCode.VALIDATION_ERROR, 'Image file is required', 400);
            }

            const results = await mlService.detectObjects(req.file.path);

            successResponse(res, { objects: results }, 200, (req as any).id);
        } catch (error) {
            next(error);
        }
    }
}

export const mlController = new MlController();
