import { Request, Response, NextFunction } from 'express';
import {
  spaceService,
  CreateSpaceDto,
  UpdateSpaceDto,
  SpaceQueryDto,
  FloorPlanData,
} from '../services/space.service';
import { successResponse, createdResponse, paginatedResponse, noContentResponse } from '../utils/response';
import { AppError, ErrorCode } from '../utils/errors';
import { SpaceStatus } from '../types';

export class SpaceController {
  /**
   * Create a new space
   * POST /api/v1/spaces
   * Requirements: 3.1
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.adminId;

      if (!adminId) {
        throw AppError.unauthorized('Authentication required');
      }

      const { name, description, width, depth, height } = req.body;

      // Validate required fields
      if (!name || width === undefined || depth === undefined) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          'Name, width, and depth are required',
          400
        );
      }

      const createData: CreateSpaceDto = {
        name,
        description,
        width: Number(width),
        depth: Number(depth),
        height: height !== undefined ? Number(height) : undefined,
      };

      const space = await spaceService.create(adminId, createData);

      createdResponse(res, { space }, req.id);
    } catch (error) {
      next(error);
    }
  }


  /**
   * Get all spaces for the authenticated admin
   * GET /api/v1/spaces
   * Requirements: 3.2
   */
  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.adminId;

      if (!adminId) {
        throw AppError.unauthorized('Authentication required');
      }

      const query: SpaceQueryDto = {
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 10,
        status: req.query.status as SpaceStatus | undefined,
        search: req.query.search as string | undefined,
        includeDeleted: req.query.includeDeleted === 'true',
      };

      const result = await spaceService.findAll(adminId, query);

      paginatedResponse(
        res,
        result.data,
        {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
        req.id
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a space by ID
   * GET /api/v1/spaces/:id
   * Requirements: 3.3
   */
  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.adminId;
      const { id } = req.params;

      if (!adminId) {
        throw AppError.unauthorized('Authentication required');
      }

      const include = req.query.include
        ? (req.query.include as string).split(',')
        : undefined;

      const space = await spaceService.findById(id, include);

      // Check ownership
      if (space.adminId !== adminId) {
        throw AppError.forbidden('You do not have permission to view this space');
      }

      successResponse(res, { space }, 200, req.id);
    } catch (error) {
      next(error);
    }
  }


  /**
   * Update a space
   * PUT /api/v1/spaces/:id
   * Requirements: 3.4
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.adminId;
      const { id } = req.params;

      if (!adminId) {
        throw AppError.unauthorized('Authentication required');
      }

      const { name, description, width, depth, height } = req.body;

      const updateData: UpdateSpaceDto = {};

      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (width !== undefined) updateData.width = Number(width);
      if (depth !== undefined) updateData.depth = Number(depth);
      if (height !== undefined) updateData.height = Number(height);

      const space = await spaceService.update(id, adminId, updateData);

      successResponse(res, { space }, 200, req.id);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a space (soft delete)
   * DELETE /api/v1/spaces/:id
   * Requirements: 3.5
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.adminId;
      const { id } = req.params;

      if (!adminId) {
        throw AppError.unauthorized('Authentication required');
      }

      await spaceService.delete(id, adminId);

      noContentResponse(res);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update space status
   * PATCH /api/v1/spaces/:id/status
   * Requirements: 3.6
   */
  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.adminId;
      const { id } = req.params;
      const { status } = req.body;

      if (!adminId) {
        throw AppError.unauthorized('Authentication required');
      }

      if (!status) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          'Status is required',
          400
        );
      }

      const validStatuses: SpaceStatus[] = ['draft', 'published', 'archived'];
      if (!validStatuses.includes(status)) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
          400
        );
      }

      const space = await spaceService.updateStatus(id, adminId, status);

      successResponse(res, { space }, 200, req.id);
    } catch (error) {
      next(error);
    }
  }


  /**
   * Restore a deleted space
   * POST /api/v1/spaces/:id/restore
   * Requirements: 3.5
   */
  async restore(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.adminId;
      const { id } = req.params;

      if (!adminId) {
        throw AppError.unauthorized('Authentication required');
      }

      const space = await spaceService.restore(id, adminId);

      successResponse(res, { space }, 200, req.id);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update floor plan data
   * PUT /api/v1/spaces/:id/floor-plan
   */
  async updateFloorPlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.adminId;
      const { id } = req.params;
      const floorPlanData = req.body as FloorPlanData;

      if (!adminId) {
        throw AppError.unauthorized('Authentication required');
      }

      const space = await spaceService.updateFloorPlan(id, adminId, floorPlanData);

      successResponse(res, { space }, 200, req.id);
    } catch (error) {
      next(error);
    }
  }
}

export const spaceController = new SpaceController();
