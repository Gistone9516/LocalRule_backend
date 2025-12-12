import { Request, Response, NextFunction } from 'express';
import { translateService } from '../services/translate.service';
import { successResponse } from '../utils/response';
import { AppError, ErrorCode } from '../utils/errors';

export class TranslateController {
    /**
     * Translate text
     * POST /api/v1/translate
     * Requirements: FR-22
     */
    async translate(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { text, targetLang } = req.body;

            if (!text || !targetLang) {
                throw new AppError(ErrorCode.VALIDATION_ERROR, 'Text and targetLang are required', 400);
            }

            const translatedText = await translateService.translateText(text, targetLang);

            successResponse(res, { translatedText }, 200, (req as any).id);
        } catch (error) {
            next(error);
        }
    }
}

export const translateController = new TranslateController();
