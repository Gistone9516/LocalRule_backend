import { Request, Response, NextFunction } from 'express';
import {
  ruleService,
  CreateRuleDto,
  UpdateRuleDto,
} from '../services/rule.service';
import { successResponse, createdResponse, noContentResponse } from '../utils/response';
import { AppError, ErrorCode } from '../utils/errors';
import { IconType, LanguageCode } from '../types';

const VALID_ICON_TYPES: IconType[] = ['prohibited', 'warning', 'tip', 'info'];
const VALID_LANGUAGES: LanguageCode[] = ['ko', 'en', 'ja', 'zh'];

export class RuleController {
  /**
   * Create a new rule for an object
   * POST /api/v1/objects/:objectId/rules
   * Requirements: 5.1
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.adminId;
      const { objectId } = req.params;

      if (!adminId) {
        throw AppError.unauthorized('Authentication required');
      }

      const { title, description, iconType, priority, displayOrder, isActive, autoTranslate, targetLanguages } = req.body;

      // Validate required fields
      if (!title || !description || !iconType) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          'title, description, and iconType are required',
          400
        );
      }

      // Validate iconType
      if (!VALID_ICON_TYPES.includes(iconType)) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          `Invalid iconType. Must be one of: ${VALID_ICON_TYPES.join(', ')}`,
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


      const createData: CreateRuleDto = {
        title,
        description,
        iconType,
        priority: priority !== undefined ? Number(priority) : undefined,
        displayOrder: displayOrder !== undefined ? Number(displayOrder) : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
        autoTranslate: autoTranslate !== undefined ? Boolean(autoTranslate) : undefined,
        targetLanguages,
      };

      const rule = await ruleService.create(objectId, adminId, createData);

      createdResponse(res, { rule }, req.id);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all rules for an object
   * GET /api/v1/objects/:objectId/rules
   * Requirements: 5.3
   */
  async findByObjectId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.adminId;
      const { objectId } = req.params;

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

      const rules = await ruleService.findByObjectId(objectId, adminId, lang);

      successResponse(res, { rules }, 200, req.id);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a single rule by ID
   * GET /api/v1/rules/:id
   * Requirements: 5.3
   */
  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.adminId;
      const { id } = req.params;

      if (!adminId) {
        throw AppError.unauthorized('Authentication required');
      }

      const rule = await ruleService.findById(id, adminId);

      successResponse(res, { rule }, 200, req.id);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a rule
   * PUT /api/v1/rules/:id
   * Requirements: 5.4
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.adminId;
      const { id } = req.params;

      if (!adminId) {
        throw AppError.unauthorized('Authentication required');
      }

      const { title, description, iconType, priority, displayOrder, isActive, regenerateTranslations, targetLanguages } = req.body;

      // Validate iconType if provided
      if (iconType && !VALID_ICON_TYPES.includes(iconType)) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          `Invalid iconType. Must be one of: ${VALID_ICON_TYPES.join(', ')}`,
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

      const updateData: UpdateRuleDto = {};

      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (iconType !== undefined) updateData.iconType = iconType;
      if (priority !== undefined) updateData.priority = Number(priority);
      if (displayOrder !== undefined) updateData.displayOrder = Number(displayOrder);
      if (isActive !== undefined) updateData.isActive = Boolean(isActive);
      if (regenerateTranslations !== undefined) updateData.regenerateTranslations = Boolean(regenerateTranslations);
      if (targetLanguages !== undefined) updateData.targetLanguages = targetLanguages;

      const rule = await ruleService.update(id, adminId, updateData);

      successResponse(res, { rule }, 200, req.id);
    } catch (error) {
      next(error);
    }
  }


  /**
   * Delete a rule
   * DELETE /api/v1/rules/:id
   * Requirements: 5.5
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.adminId;
      const { id } = req.params;

      if (!adminId) {
        throw AppError.unauthorized('Authentication required');
      }

      await ruleService.delete(id, adminId);

      noContentResponse(res);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update rule order for an object
   * PUT /api/v1/objects/:objectId/rules/order
   * Requirements: 5.3
   */
  async updateOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.adminId;
      const { objectId } = req.params;

      if (!adminId) {
        throw AppError.unauthorized('Authentication required');
      }

      const { ruleIds } = req.body;

      if (!ruleIds || !Array.isArray(ruleIds)) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          'ruleIds array is required',
          400
        );
      }

      const rules = await ruleService.updateOrder(objectId, adminId, ruleIds);

      successResponse(res, { rules }, 200, req.id);
    } catch (error) {
      next(error);
    }
  }
}

export const ruleController = new RuleController();
