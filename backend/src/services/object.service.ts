import { PrismaClient } from '@prisma/client';
import { prisma } from '../config/database';
import { AppError, ErrorCode } from '../utils/errors';

// Object category type
export type ObjectCategory = 'furniture' | 'appliance' | 'facility' | 'other';

// Maximum objects per space
const MAX_OBJECTS_PER_SPACE = 50;

export interface Position3D {
  x: number;
  y: number;
  z: number;
}

export interface Rotation3D {
  x: number;
  y: number;
  z: number;
}

export interface Scale3D {
  x: number;
  y: number;
  z: number;
}

export interface CreateObjectDto {
  objectTypeId: string;
  customName?: string;
  position: Position3D;
  rotation?: Rotation3D;
  scale?: Scale3D;
  modelId?: string;
  isMlDetected?: boolean;
  mlConfidence?: number;
}

export interface UpdateObjectDto {
  customName?: string;
  position?: Position3D;
  rotation?: Rotation3D;
  scale?: Scale3D;
  modelId?: string;
  displayOrder?: number;
}

export interface ObjectTypeData {
  id: string;
  name: string;
  nameKo: string;
  nameEn: string;
  nameJa: string | null;
  nameZh: string | null;
  category: ObjectCategory;
  icon: string | null;
  defaultModelUrl: string | null;
  isSystem: boolean;
}

export interface SpaceObjectData {
  id: string;
  spaceId: string;
  objectTypeId: string;
  modelId: string | null;
  customName: string | null;
  position: Position3D;
  rotation: Rotation3D;
  scale: Scale3D;
  isMlDetected: boolean;
  mlConfidence: number | null;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
  objectType?: ObjectTypeData;
  rules?: unknown[];
}

export class ObjectService {
  private prisma: PrismaClient;

  constructor(prismaClient: PrismaClient = prisma) {
    this.prisma = prismaClient;
  }

  /**
   * Create a new object in a space
   * Requirements: 4.1, 4.5
   */
  async create(spaceId: string, adminId: string, data: CreateObjectDto): Promise<SpaceObjectData> {
    // Verify space exists and belongs to admin
    const space = await this.prisma.space.findUnique({
      where: { id: spaceId },
    });

    if (!space || space.deletedAt) {
      throw new AppError(ErrorCode.SPACE_NOT_FOUND, 'Space not found', 404);
    }

    if (space.adminId !== adminId) {
      throw AppError.forbidden('You do not have permission to add objects to this space');
    }

    // Check object limit
    await this.checkObjectLimit(spaceId);

    // Verify object type exists
    const objectType = await this.prisma.objectType.findUnique({
      where: { id: data.objectTypeId },
    });

    if (!objectType) {
      throw new AppError(ErrorCode.INVALID_OBJECT_TYPE, 'Invalid object type', 400);
    }

    // Verify model exists if provided
    if (data.modelId) {
      const model = await this.prisma.objectModel.findUnique({
        where: { id: data.modelId },
      });
      if (!model || model.objectTypeId !== data.objectTypeId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Invalid model for this object type', 400);
      }
    }

    // Get next display order
    const maxOrder = await this.prisma.spaceObject.aggregate({
      where: { spaceId },
      _max: { displayOrder: true },
    });
    const displayOrder = (maxOrder._max.displayOrder ?? -1) + 1;

    const object = await this.prisma.spaceObject.create({
      data: {
        spaceId,
        objectTypeId: data.objectTypeId,
        modelId: data.modelId || null,
        customName: data.customName || null,
        positionX: data.position.x,
        positionY: data.position.y,
        positionZ: data.position.z,
        rotationX: data.rotation?.x ?? 0,
        rotationY: data.rotation?.y ?? 0,
        rotationZ: data.rotation?.z ?? 0,
        scaleX: data.scale?.x ?? 1,
        scaleY: data.scale?.y ?? 1,
        scaleZ: data.scale?.z ?? 1,
        isMlDetected: data.isMlDetected ?? false,
        mlConfidence: data.mlConfidence ?? null,
        displayOrder,
      },
      include: {
        objectType: true,
      },
    });

    return this.mapToObjectData(object);
  }


  /**
   * Find all objects in a space
   * Requirements: 4.2, 4.3
   */
  async findBySpaceId(
    spaceId: string,
    adminId: string,
    includeRules: boolean = false
  ): Promise<SpaceObjectData[]> {
    // Verify space exists and belongs to admin
    const space = await this.prisma.space.findUnique({
      where: { id: spaceId },
    });

    if (!space || space.deletedAt) {
      throw new AppError(ErrorCode.SPACE_NOT_FOUND, 'Space not found', 404);
    }

    if (space.adminId !== adminId) {
      throw AppError.forbidden('You do not have permission to view objects in this space');
    }

    const objects = await this.prisma.spaceObject.findMany({
      where: { spaceId },
      include: {
        objectType: true,
        rules: includeRules
          ? {
              include: {
                translations: true,
                image: true,
              },
              orderBy: [{ priority: 'asc' }, { displayOrder: 'asc' }],
            }
          : false,
      },
      orderBy: { displayOrder: 'asc' },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return objects.map((obj: any) => this.mapToObjectData(obj));
  }

  /**
   * Find a single object by ID
   */
  async findById(
    id: string,
    adminId: string,
    includeRules: boolean = false
  ): Promise<SpaceObjectData> {
    const object = await this.prisma.spaceObject.findUnique({
      where: { id },
      include: {
        objectType: true,
        space: true,
        rules: includeRules
          ? {
              include: {
                translations: true,
                image: true,
              },
              orderBy: [{ priority: 'asc' }, { displayOrder: 'asc' }],
            }
          : false,
      },
    });

    if (!object) {
      throw new AppError(ErrorCode.OBJECT_NOT_FOUND, 'Object not found', 404);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((object as any).space.adminId !== adminId) {
      throw AppError.forbidden('You do not have permission to view this object');
    }

    return this.mapToObjectData(object);
  }

  /**
   * Update an object
   * Requirements: 4.3
   */
  async update(id: string, adminId: string, data: UpdateObjectDto): Promise<SpaceObjectData> {
    // Verify object exists and belongs to admin's space
    const existingObject = await this.prisma.spaceObject.findUnique({
      where: { id },
      include: { space: true },
    });

    if (!existingObject) {
      throw new AppError(ErrorCode.OBJECT_NOT_FOUND, 'Object not found', 404);
    }

    if (existingObject.space.adminId !== adminId) {
      throw AppError.forbidden('You do not have permission to update this object');
    }

    // Verify model exists if provided
    if (data.modelId) {
      const model = await this.prisma.objectModel.findUnique({
        where: { id: data.modelId },
      });
      if (!model || model.objectTypeId !== existingObject.objectTypeId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Invalid model for this object type', 400);
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};

    if (data.customName !== undefined) updateData.customName = data.customName;
    if (data.modelId !== undefined) updateData.modelId = data.modelId;
    if (data.displayOrder !== undefined) updateData.displayOrder = data.displayOrder;

    if (data.position) {
      updateData.positionX = data.position.x;
      updateData.positionY = data.position.y;
      updateData.positionZ = data.position.z;
    }

    if (data.rotation) {
      updateData.rotationX = data.rotation.x;
      updateData.rotationY = data.rotation.y;
      updateData.rotationZ = data.rotation.z;
    }

    if (data.scale) {
      updateData.scaleX = data.scale.x;
      updateData.scaleY = data.scale.y;
      updateData.scaleZ = data.scale.z;
    }

    const object = await this.prisma.spaceObject.update({
      where: { id },
      data: updateData,
      include: {
        objectType: true,
      },
    });

    return this.mapToObjectData(object);
  }


  /**
   * Delete an object and its associated rules
   * Requirements: 4.4
   */
  async delete(id: string, adminId: string): Promise<void> {
    // Verify object exists and belongs to admin's space
    const existingObject = await this.prisma.spaceObject.findUnique({
      where: { id },
      include: { space: true },
    });

    if (!existingObject) {
      throw new AppError(ErrorCode.OBJECT_NOT_FOUND, 'Object not found', 404);
    }

    if (existingObject.space.adminId !== adminId) {
      throw AppError.forbidden('You do not have permission to delete this object');
    }

    // Delete object (rules will be cascade deleted due to schema relation)
    await this.prisma.spaceObject.delete({
      where: { id },
    });
  }

  /**
   * Get all object types
   * Requirements: 4.6
   */
  async getObjectTypes(category?: ObjectCategory): Promise<ObjectTypeData[]> {
    const where = category ? { category } : {};

    const objectTypes = await this.prisma.objectType.findMany({
      where,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return objectTypes.map((type: any) => ({
      id: type.id,
      name: type.name,
      nameKo: type.nameKo,
      nameEn: type.nameEn,
      nameJa: type.nameJa,
      nameZh: type.nameZh,
      category: type.category as ObjectCategory,
      icon: type.icon,
      defaultModelUrl: type.defaultModelUrl,
      isSystem: type.isSystem,
    }));
  }

  /**
   * Get object count for a space
   */
  async getObjectCount(spaceId: string): Promise<number> {
    return this.prisma.spaceObject.count({
      where: { spaceId },
    });
  }

  /**
   * Check if space has reached object limit
   * Requirements: 4.5
   */
  private async checkObjectLimit(spaceId: string): Promise<void> {
    const objectCount = await this.prisma.spaceObject.count({
      where: { spaceId },
    });

    if (objectCount >= MAX_OBJECTS_PER_SPACE) {
      throw new AppError(
        ErrorCode.OBJECT_LIMIT_EXCEEDED,
        `Object limit exceeded. Maximum ${MAX_OBJECTS_PER_SPACE} objects per space.`,
        403
      );
    }
  }

  /**
   * Map Prisma object to SpaceObjectData
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapToObjectData(object: any): SpaceObjectData {
    const result: SpaceObjectData = {
      id: object.id,
      spaceId: object.spaceId,
      objectTypeId: object.objectTypeId,
      modelId: object.modelId,
      customName: object.customName,
      position: {
        x: Number(object.positionX),
        y: Number(object.positionY),
        z: Number(object.positionZ),
      },
      rotation: {
        x: Number(object.rotationX),
        y: Number(object.rotationY),
        z: Number(object.rotationZ),
      },
      scale: {
        x: Number(object.scaleX),
        y: Number(object.scaleY),
        z: Number(object.scaleZ),
      },
      isMlDetected: object.isMlDetected,
      mlConfidence: object.mlConfidence ? Number(object.mlConfidence) : null,
      displayOrder: object.displayOrder,
      createdAt: object.createdAt,
      updatedAt: object.updatedAt,
    };

    if (object.objectType) {
      result.objectType = {
        id: object.objectType.id,
        name: object.objectType.name,
        nameKo: object.objectType.nameKo,
        nameEn: object.objectType.nameEn,
        nameJa: object.objectType.nameJa,
        nameZh: object.objectType.nameZh,
        category: object.objectType.category,
        icon: object.objectType.icon,
        defaultModelUrl: object.objectType.defaultModelUrl,
        isSystem: object.objectType.isSystem,
      };
    }

    if (object.rules) {
      result.rules = object.rules;
    }

    return result;
  }
}

// Export singleton instance
export const objectService = new ObjectService();
