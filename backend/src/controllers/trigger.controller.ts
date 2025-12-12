import { Request, Response, NextFunction } from 'express';
import {
  triggerService,
  CreateTriggerDto,
  UpdateTriggerDto,
} from '../services/trigger.service';
import { successResponse, createdResponse, noContentResponse } from '../utils/response';
import { AppError, ErrorCode } from '../utils/errors';
import { TriggerType, VibrationPattern, SoundEffect, LanguageCode } from '../types';

const VALID_TRIGGER_TYPES: TriggerType[] = ['warning', 'caution', 'info'];
const VALID_VIBRATION_PATTERNS: VibrationPattern[] = ['none', 'short', 'long'];
const VALID_SOUND_EFFECTS: SoundEffect[] = ['none', 'ding', 'alert'];
const VALID_LANGUAGES: LanguageCode[] = ['ko', 'en', 'ja', 'zh'];

export class TriggerController {
  /**
   * Create a new trigger zone for a space
   * POST /api/v1/spaces/:spaceId/triggers
   * Requirements: 6.1
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.adminId;
      const { spaceId } = req.params;

      if (!adminId) {
        throw AppError.unauthorized('Authentication required');
      }

      const {
        position,
        radius,
        triggerType,
        message,
        autoCloseSeconds,
        vibrationPattern,
        soundEffect,
        isActive,
        autoTranslate,
        targetLanguages,
      } = req.body;

      // Validate required fields
      if (!position || radius === undefined || !triggerType || !message) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          'position, radius, triggerType, and message are required',
          400
        );
      }

      // Validate position structure
      if (
        typeof position.x !== 'number' ||
        typeof position.y !== 'number' ||
        typeof position.z !== 'number'
      ) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          'position must have numeric x, y, z properties',
          400
        );
      }


      // Validate triggerType
      if (!VALID_TRIGGER_TYPES.includes(triggerType)) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          `Invalid triggerType. Must be one of: ${VALID_TRIGGER_TYPES.join(', ')}`,
          400
        );
      }

      // Validate vibrationPattern if provided
      if (vibrationPattern && !VALID_VIBRATION_PATTERNS.includes(vibrationPattern)) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          `Invalid vibrationPattern. Must be one of: ${VALID_VIBRATION_PATTERNS.join(', ')}`,
          400
        );
      }

      // Validate soundEffect if provided
      if (soundEffect && !VALID_SOUND_EFFECTS.includes(soundEffect)) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          `Invalid soundEffect. Must be one of: ${VALID_SOUND_EFFECTS.join(', ')}`,
          400
        );
      }

      // Validate targetLanguages if provided
      if (targetLanguages && Array.isArray(targetLanguages)) {
        for (const lang of targetLanguages) {
          if (!VALID_LANGUAGES.includes(lang)) {
            throw new AppError(
              ErrorCode.VALIDATION_ERROR,
              `Invalid language code: ${lang}. Must be one of: ${VALID_LANGUAGES.join(', ')}`,
              400
            );
          }
        }
      }

      const createData: CreateTriggerDto = {
        position,
        radius: Number(radius),
        triggerType,
        message,
        autoCloseSeconds: autoCloseSeconds !== undefined ? Number(autoCloseSeconds) : undefined,
        vibrationPattern,
        soundEffect,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
        autoTranslate: autoTranslate !== undefined ? Boolean(autoTranslate) : undefined,
        targetLanguages,
      };

      const trigger = await triggerService.create(spaceId, adminId, createData);

      createdResponse(res, { trigger }, req.id);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all triggers for a space
   * GET /api/v1/spaces/:spaceId/triggers
   * Requirements: 6.2
   */
  async findBySpaceId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.adminId;
      const { spaceId } = req.params;

      if (!adminId) {
        throw AppError.unauthorized('Authentication required');
      }

      const lang = req.query.lang as LanguageCode | undefined;

      // Validate language if provided
      if (lang && !VALID_LANGUAGES.includes(lang)) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          `Invalid language code. Must be one of: ${VALID_LANGUAGES.join(', ')}`,
          400
        );
      }

      const triggers = await triggerService.findBySpaceId(spaceId, adminId, lang);

      successResponse(res, { triggers }, 200, req.id);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a single trigger by ID
   * GET /api/v1/triggers/:id
   * Requirements: 6.2
   */
  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.adminId;
      const { id } = req.params;

      if (!adminId) {
        throw AppError.unauthorized('Authentication required');
      }

      const trigger = await triggerService.findById(id, adminId);

      successResponse(res, { trigger }, 200, req.id);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a trigger
   * PUT /api/v1/triggers/:id
   * Requirements: 6.3
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.adminId;
      const { id } = req.params;

      if (!adminId) {
        throw AppError.unauthorized('Authentication required');
      }

      const {
        position,
        radius,
        triggerType,
        message,
        autoCloseSeconds,
        vibrationPattern,
        soundEffect,
        isActive,
        regenerateTranslations,
        targetLanguages,
      } = req.body;

      // Validate position structure if provided
      if (position) {
        if (
          typeof position.x !== 'number' ||
          typeof position.y !== 'number' ||
          typeof position.z !== 'number'
        ) {
          throw new AppError(
            ErrorCode.VALIDATION_ERROR,
            'position must have numeric x, y, z properties',
            400
          );
        }
      }

      // Validate triggerType if provided
      if (triggerType && !VALID_TRIGGER_TYPES.includes(triggerType)) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          `Invalid triggerType. Must be one of: ${VALID_TRIGGER_TYPES.join(', ')}`,
          400
        );
      }

      // Validate vibrationPattern if provided
      if (vibrationPattern && !VALID_VIBRATION_PATTERNS.includes(vibrationPattern)) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          `Invalid vibrationPattern. Must be one of: ${VALID_VIBRATION_PATTERNS.join(', ')}`,
          400
        );
      }

      // Validate soundEffect if provided
      if (soundEffect && !VALID_SOUND_EFFECTS.includes(soundEffect)) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          `Invalid soundEffect. Must be one of: ${VALID_SOUND_EFFECTS.join(', ')}`,
          400
        );
      }

      // Validate targetLanguages if provided
      if (targetLanguages && Array.isArray(targetLanguages)) {
        for (const lang of targetLanguages) {
          if (!VALID_LANGUAGES.includes(lang)) {
            throw new AppError(
              ErrorCode.VALIDATION_ERROR,
              `Invalid language code: ${lang}. Must be one of: ${VALID_LANGUAGES.join(', ')}`,
              400
            );
          }
        }
      }

      const updateData: UpdateTriggerDto = {};

      if (position !== undefined) updateData.position = position;
      if (radius !== undefined) updateData.radius = Number(radius);
      if (triggerType !== undefined) updateData.triggerType = triggerType;
      if (message !== undefined) updateData.message = message;
      if (autoCloseSeconds !== undefined) updateData.autoCloseSeconds = Number(autoCloseSeconds);
      if (vibrationPattern !== undefined) updateData.vibrationPattern = vibrationPattern;
      if (soundEffect !== undefined) updateData.soundEffect = soundEffect;
      if (isActive !== undefined) updateData.isActive = Boolean(isActive);
      if (regenerateTranslations !== undefined) updateData.regenerateTranslations = Boolean(regenerateTranslations);
      if (targetLanguages !== undefined) updateData.targetLanguages = targetLanguages;

      const trigger = await triggerService.update(id, adminId, updateData);

      successResponse(res, { trigger }, 200, req.id);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a trigger
   * DELETE /api/v1/triggers/:id
   * Requirements: 6.4
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.adminId;
      const { id } = req.params;

      if (!adminId) {
        throw AppError.unauthorized('Authentication required');
      }

      await triggerService.delete(id, adminId);

      noContentResponse(res);
    } catch (error) {
      next(error);
    }
  }
}

export const triggerController = new TriggerController();
