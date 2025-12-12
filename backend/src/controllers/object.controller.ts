import { Request, Response, NextFunction } from 'express';
import {
  objectService,
  CreateObjectDto,
  UpdateObjectDto,
  ObjectCategory,
} from '../services/object.service';
import { successResponse, createdResponse, noContentResponse } from '../utils/response';
import { AppError, ErrorCode } from '../utils/errors';

export class ObjectController {
  /**
   * Create a new object in a space
   * POST /api/v1/spaces/:spaceId/objects
   * Requirements: 4.1
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.adminId;
      const { spaceId } = req.params;

      if (!adminId) {
        throw AppError.unauthorized('Authentication required');
      }

      const { objectTypeId, customName, position, rotation, scale, modelId, isMlDetected, mlConfidence } = req.body;

      // Validate required fields
      if (!objectTypeId || !position) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          'objectTypeId and position are required',
          400
        );
      }

      // Validate position structure
      if (position.x === undefined || position.y === undefined) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          'position must include x and y coordinates',
          400
        );
      }

      const createData: CreateObjectDto = {
        objectTypeId,
        customName,
        position: {
          x: Number(position.x),
          y: Number(position.y),
          z: position.z !== undefined ? Number(position.z) : 0,
        },
        rotation: rotation ? {
          x: Number(rotation.x ?? 0),
          y: Number(rotation.y ?? 0),
          z: Number(rotation.z ?? 0),
        } : undefined,
        scale: scale ? {
          x: Number(scale.x ?? 1),
          y: Number(scale.y ?? 1),
          z: Number(scale.z ?? 1),
        } : undefined,
        modelId,
        isMlDetected,
        mlConfidence: mlConfidence !== undefined ? Number(mlConfidence) : undefined,
      };

      const object = await objectService.create(spaceId, adminId, createData);

      createdResponse(res, { object }, req.id);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all objects in a space
   * GET /api/v1/spaces/:spaceId/objects
   * Requirements: 4.2
   */
  async findBySpaceId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.adminId;
      const { spaceId } = req.params;

      if (!adminId) {
        throw AppError.unauthorized('Authentication required');
      }

      const includeRules = req.query.includeRules === 'true';

      const objects = await objectService.findBySpaceId(spaceId, adminId, includeRules);

      successResponse(res, { objects }, 200, req.id);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a single object by ID
   * GET /api/v1/objects/:id
   * Requirements: 4.2
   */
  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.adminId;
      const { id } = req.params;

      if (!adminId) {
        throw AppError.unauthorized('Authentication required');
      }

      const includeRules = req.query.includeRules === 'true';

      const object = await objectService.findById(id, adminId, includeRules);

      successResponse(res, { object }, 200, req.id);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update an object
   * PUT /api/v1/objects/:id
   * Requirements: 4.3
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.adminId;
      const { id } = req.params;

      if (!adminId) {
        throw AppError.unauthorized('Authentication required');
      }

      const { customName, position, rotation, scale, modelId, displayOrder } = req.body;

      const updateData: UpdateObjectDto = {};

      if (customName !== undefined) updateData.customName = customName;
      if (modelId !== undefined) updateData.modelId = modelId;
      if (displayOrder !== undefined) updateData.displayOrder = Number(displayOrder);

      if (position) {
        updateData.position = {
          x: Number(position.x),
          y: Number(position.y),
          z: position.z !== undefined ? Number(position.z) : 0,
        };
      }

      if (rotation) {
        updateData.rotation = {
          x: Number(rotation.x ?? 0),
          y: Number(rotation.y ?? 0),
          z: Number(rotation.z ?? 0),
        };
      }

      if (scale) {
        updateData.scale = {
          x: Number(scale.x ?? 1),
          y: Number(scale.y ?? 1),
          z: Number(scale.z ?? 1),
        };
      }

      const object = await objectService.update(id, adminId, updateData);

      successResponse(res, { object }, 200, req.id);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete an object
   * DELETE /api/v1/objects/:id
   * Requirements: 4.4
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.adminId;
      const { id } = req.params;

      if (!adminId) {
        throw AppError.unauthorized('Authentication required');
      }

      await objectService.delete(id, adminId);

      noContentResponse(res);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all object types
   * GET /api/v1/object-types
   * Requirements: 4.6
   */
  async getObjectTypes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = req.query.category as ObjectCategory | undefined;

      // Validate category if provided
      if (category && !['furniture', 'appliance', 'facility', 'other'].includes(category)) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          'Invalid category. Must be one of: furniture, appliance, facility, other',
          400
        );
      }

      const objectTypes = await objectService.getObjectTypes(category);

      successResponse(res, { objectTypes }, 200, req.id);
    } catch (error) {
      next(error);
    }
  }
}

export const objectController = new ObjectController();
