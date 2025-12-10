import { PrismaClient } from '@prisma/client';
import { prisma } from '../config/database';
import { AppError, ErrorCode } from '../utils/errors';
import { PaginatedResult, SpaceStatus } from '../types';

// Plan types
export type PlanType = 'free' | 'basic' | 'pro' | 'enterprise';

// Plan limits for spaces
const PLAN_SPACE_LIMITS: Record<PlanType, number> = {
  free: 1,
  basic: 5,
  pro: 20,
  enterprise: Infinity,
};

export interface CreateSpaceDto {
  name: string;
  description?: string;
  width: number;
  depth: number;
  height?: number;
}

export interface UpdateSpaceDto {
  name?: string;
  description?: string;
  width?: number;
  depth?: number;
  height?: number;
}

export interface SpaceQueryDto {
  page?: number;
  limit?: number;
  status?: SpaceStatus;
  search?: string;
  includeDeleted?: boolean;
}

export interface FloorPlanData {
  walls?: Wall[];
  doors?: Door[];
  windows?: Window[];
  rooms?: Room[];
  obstacles?: Obstacle[];
}

interface Point2D {
  x: number;
  y: number;
}

interface Wall {
  id: string;
  start: Point2D;
  end: Point2D;
  height: number;
  thickness: number;
  material?: string;
}

interface Door {
  id: string;
  wallId: string;
  position: number;
  width: number;
  height: number;
  type: 'single' | 'double' | 'sliding';
}

interface Window {
  id: string;
  wallId: string;
  position: number;
  width: number;
  height: number;
  sillHeight: number;
}

interface Room {
  id: string;
  name: string;
  polygon: Point2D[];
  floorLevel: number;
}

interface Obstacle {
  id: string;
  type: 'pillar' | 'stairs' | 'other';
  polygon: Point2D[];
  height: number;
}

export interface SpaceData {
  id: string;
  adminId: string;
  name: string;
  description: string | null;
  width: number;
  height: number;
  depth: number;
  status: SpaceStatus;
  floorPlanData: FloorPlanData | null;
  thumbnailUrl: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

// Valid status transitions
const VALID_STATUS_TRANSITIONS: Record<SpaceStatus, SpaceStatus[]> = {
  draft: ['published'],
  published: ['draft', 'archived'],
  archived: ['draft', 'published'],
};

export class SpaceService {
  private prisma: PrismaClient;

  constructor(prismaClient: PrismaClient = prisma) {
    this.prisma = prismaClient;
  }

  /**
   * Create a new space
   * Requirements: 3.1, 3.7
   */
  async create(adminId: string, data: CreateSpaceDto): Promise<SpaceData> {
    // Check plan limit
    await this.checkSpaceLimit(adminId);

    // Validate dimensions
    this.validateDimensions(data.width, data.depth, data.height);

    const space = await this.prisma.space.create({
      data: {
        adminId,
        name: data.name,
        description: data.description || null,
        width: data.width,
        depth: data.depth,
        height: data.height || 2.5,
        status: 'draft',
      },
    });

    return this.mapToSpaceData(space);
  }


  /**
   * Find all spaces for an admin with pagination
   * Requirements: 3.2
   */
  async findAll(adminId: string, query: SpaceQueryDto = {}): Promise<PaginatedResult<SpaceData>> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      adminId,
      deletedAt: query.includeDeleted ? undefined : null,
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [spaces, total] = await Promise.all([
      this.prisma.space.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.space.count({ where }),
    ]);

    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: spaces.map((s: any) => this.mapToSpaceData(s)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Find a space by ID with optional includes
   * Requirements: 3.3
   */
  async findById(
    id: string,
    include?: string[]
  ): Promise<SpaceData & { objects?: unknown[]; triggerZones?: unknown[] }> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const includeOptions: any = {};

    if (include?.includes('objects')) {
      includeOptions.objects = {
        include: {
          objectType: true,
          rules: {
            include: {
              translations: true,
              image: true,
            },
          },
        },
      };
    }

    if (include?.includes('triggers')) {
      includeOptions.triggerZones = {
        include: {
          translations: true,
        },
      };
    }

    const space = await this.prisma.space.findUnique({
      where: { id },
      include: Object.keys(includeOptions).length > 0 ? includeOptions : undefined,
    });

    if (!space || space.deletedAt) {
      throw new AppError(ErrorCode.SPACE_NOT_FOUND, 'Space not found', 404);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = this.mapToSpaceData(space);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((space as any).objects) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      result.objects = (space as any).objects;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((space as any).triggerZones) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      result.triggerZones = (space as any).triggerZones;
    }

    return result;
  }


  /**
   * Update a space
   * Requirements: 3.4
   */
  async update(id: string, adminId: string, data: UpdateSpaceDto): Promise<SpaceData> {
    // Check if space exists and belongs to admin
    const existingSpace = await this.prisma.space.findUnique({
      where: { id },
    });

    if (!existingSpace || existingSpace.deletedAt) {
      throw new AppError(ErrorCode.SPACE_NOT_FOUND, 'Space not found', 404);
    }

    if (existingSpace.adminId !== adminId) {
      throw AppError.forbidden('You do not have permission to update this space');
    }

    // Validate dimensions if provided
    if (data.width !== undefined || data.depth !== undefined || data.height !== undefined) {
      this.validateDimensions(
        data.width ?? Number(existingSpace.width),
        data.depth ?? Number(existingSpace.depth),
        data.height ?? Number(existingSpace.height)
      );
    }

    const space = await this.prisma.space.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        width: data.width,
        depth: data.depth,
        height: data.height,
      },
    });

    return this.mapToSpaceData(space);
  }

  /**
   * Soft delete a space
   * Requirements: 3.5
   */
  async delete(id: string, adminId: string): Promise<void> {
    const existingSpace = await this.prisma.space.findUnique({
      where: { id },
    });

    if (!existingSpace || existingSpace.deletedAt) {
      throw new AppError(ErrorCode.SPACE_NOT_FOUND, 'Space not found', 404);
    }

    if (existingSpace.adminId !== adminId) {
      throw AppError.forbidden('You do not have permission to delete this space');
    }

    await this.prisma.space.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: 'archived',
      },
    });
  }

  /**
   * Update space status
   * Requirements: 3.6
   */
  async updateStatus(id: string, adminId: string, newStatus: SpaceStatus): Promise<SpaceData> {
    const existingSpace = await this.prisma.space.findUnique({
      where: { id },
    });

    if (!existingSpace || existingSpace.deletedAt) {
      throw new AppError(ErrorCode.SPACE_NOT_FOUND, 'Space not found', 404);
    }

    if (existingSpace.adminId !== adminId) {
      throw AppError.forbidden('You do not have permission to update this space');
    }

    // Validate status transition
    const currentStatus = existingSpace.status as SpaceStatus;
    const validTransitions = VALID_STATUS_TRANSITIONS[currentStatus];
    if (!validTransitions.includes(newStatus)) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        `Invalid status transition from ${currentStatus} to ${newStatus}`,
        400
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {
      status: newStatus,
    };

    // Set publishedAt when publishing
    if (newStatus === 'published' && !existingSpace.publishedAt) {
      updateData.publishedAt = new Date();
    }

    const space = await this.prisma.space.update({
      where: { id },
      data: updateData,
    });

    return this.mapToSpaceData(space);
  }


  /**
   * Restore a soft-deleted space
   * Requirements: 3.5
   */
  async restore(id: string, adminId: string): Promise<SpaceData> {
    const existingSpace = await this.prisma.space.findUnique({
      where: { id },
    });

    if (!existingSpace) {
      throw new AppError(ErrorCode.SPACE_NOT_FOUND, 'Space not found', 404);
    }

    if (!existingSpace.deletedAt) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Space is not deleted', 400);
    }

    if (existingSpace.adminId !== adminId) {
      throw AppError.forbidden('You do not have permission to restore this space');
    }

    // Check if within 30-day recovery window
    const deletedAt = existingSpace.deletedAt;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    if (deletedAt < thirtyDaysAgo) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        'Space recovery period has expired (30 days)',
        400
      );
    }

    // Check plan limit before restoring
    await this.checkSpaceLimit(adminId);

    const space = await this.prisma.space.update({
      where: { id },
      data: {
        deletedAt: null,
        status: 'draft',
      },
    });

    return this.mapToSpaceData(space);
  }

  /**
   * Update floor plan data
   */
  async updateFloorPlan(
    id: string,
    adminId: string,
    floorPlanData: FloorPlanData
  ): Promise<SpaceData> {
    const existingSpace = await this.prisma.space.findUnique({
      where: { id },
    });

    if (!existingSpace || existingSpace.deletedAt) {
      throw new AppError(ErrorCode.SPACE_NOT_FOUND, 'Space not found', 404);
    }

    if (existingSpace.adminId !== adminId) {
      throw AppError.forbidden('You do not have permission to update this space');
    }

    const space = await this.prisma.space.update({
      where: { id },
      data: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        floorPlanData: floorPlanData as any,
      },
    });

    return this.mapToSpaceData(space);
  }


  /**
   * Check if admin has reached their space limit
   * Requirements: 3.7
   */
  private async checkSpaceLimit(adminId: string): Promise<void> {
    const admin = await this.prisma.admin.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      throw AppError.unauthorized('Admin not found');
    }

    const spaceCount = await this.prisma.space.count({
      where: {
        adminId,
        deletedAt: null,
      },
    });

    const limit = PLAN_SPACE_LIMITS[admin.plan as PlanType];

    if (spaceCount >= limit) {
      throw new AppError(
        ErrorCode.SPACE_LIMIT_EXCEEDED,
        `Space limit exceeded. Your ${admin.plan} plan allows ${limit} space(s).`,
        403
      );
    }
  }

  /**
   * Validate space dimensions
   */
  private validateDimensions(width: number, depth: number, height?: number): void {
    if (width <= 0 || width > 100) {
      throw new AppError(
        ErrorCode.INVALID_DIMENSIONS,
        'Width must be between 0 and 100 meters',
        400
      );
    }

    if (depth <= 0 || depth > 100) {
      throw new AppError(
        ErrorCode.INVALID_DIMENSIONS,
        'Depth must be between 0 and 100 meters',
        400
      );
    }

    if (height !== undefined && (height <= 0 || height > 20)) {
      throw new AppError(
        ErrorCode.INVALID_DIMENSIONS,
        'Height must be between 0 and 20 meters',
        400
      );
    }
  }

  /**
   * Map Prisma space to SpaceData
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapToSpaceData(space: any): SpaceData {
    return {
      id: space.id,
      adminId: space.adminId,
      name: space.name,
      description: space.description,
      width: Number(space.width),
      height: Number(space.height),
      depth: Number(space.depth),
      status: space.status as SpaceStatus,
      floorPlanData: space.floorPlanData as FloorPlanData | null,
      thumbnailUrl: space.thumbnailUrl,
      publishedAt: space.publishedAt,
      createdAt: space.createdAt,
      updatedAt: space.updatedAt,
      deletedAt: space.deletedAt,
    };
  }

  /**
   * Get space count for an admin (for testing)
   */
  async getSpaceCount(adminId: string): Promise<number> {
    return this.prisma.space.count({
      where: {
        adminId,
        deletedAt: null,
      },
    });
  }
}

// Export singleton instance
export const spaceService = new SpaceService();
