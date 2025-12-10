import { PrismaClient } from '@prisma/client';
import { prisma } from '../config/database';
import { AppError, ErrorCode } from '../utils/errors';
import { TriggerType, VibrationPattern, SoundEffect, LanguageCode, Position3D } from '../types';

// Maximum triggers per space
const MAX_TRIGGERS_PER_SPACE = 20;
const MIN_RADIUS = 0.5;
const MAX_RADIUS = 3.0;

export interface CreateTriggerDto {
  position: Position3D;
  radius: number;
  triggerType: TriggerType;
  message: string;
  autoCloseSeconds?: number;
  vibrationPattern?: VibrationPattern;
  soundEffect?: SoundEffect;
  isActive?: boolean;
  autoTranslate?: boolean;
  targetLanguages?: LanguageCode[];
}

export interface UpdateTriggerDto {
  position?: Position3D;
  radius?: number;
  triggerType?: TriggerType;
  message?: string;
  autoCloseSeconds?: number;
  vibrationPattern?: VibrationPattern;
  soundEffect?: SoundEffect;
  isActive?: boolean;
  regenerateTranslations?: boolean;
  targetLanguages?: LanguageCode[];
}

export interface TriggerTranslationData {
  id: string;
  triggerId: string;
  language: LanguageCode;
  message: string;
  isAutoTranslated: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TriggerZoneData {
  id: string;
  spaceId: string;
  position: Position3D;
  radius: number;
  triggerType: TriggerType;
  message: string;
  autoCloseSeconds: number | null;
  vibrationPattern: VibrationPattern;
  soundEffect: SoundEffect;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  translations?: TriggerTranslationData[];
}

export class TriggerService {
  private prisma: PrismaClient;

  constructor(prismaClient: PrismaClient = prisma) {
    this.prisma = prismaClient;
  }

  /**
   * Create a new trigger zone for a space
   * Requirements: 6.1, 6.5, 6.6
   */
  async create(spaceId: string, adminId: string, data: CreateTriggerDto): Promise<TriggerZoneData> {
    // Validate radius
    this.validateRadius(data.radius);

    // Verify space exists and belongs to admin
    const space = await this.prisma.space.findUnique({
      where: { id: spaceId },
    });

    if (!space) {
      throw new AppError(ErrorCode.SPACE_NOT_FOUND, 'Space not found', 404);
    }

    if (space.adminId !== adminId) {
      throw AppError.forbidden('You do not have permission to add triggers to this space');
    }

    if (space.deletedAt) {
      throw new AppError(ErrorCode.SPACE_NOT_FOUND, 'Space has been deleted', 404);
    }

    // Check trigger limit
    await this.checkTriggerLimit(spaceId);

    const trigger = await this.prisma.triggerZone.create({
      data: {
        spaceId,
        positionX: data.position.x,
        positionY: data.position.y,
        positionZ: data.position.z,
        radius: data.radius,
        triggerType: data.triggerType,
        message: data.message,
        autoCloseSeconds: data.autoCloseSeconds ?? null,
        vibrationPattern: data.vibrationPattern ?? 'none',
        soundEffect: data.soundEffect ?? 'none',
        isActive: data.isActive ?? true,
      },
      include: {
        translations: true,
      },
    });

    // Auto-translate if requested
    if (data.autoTranslate && data.targetLanguages && data.targetLanguages.length > 0) {
      await this.createMockTranslations(trigger.id, data.message, data.targetLanguages);

      const updatedTrigger = await this.prisma.triggerZone.findUnique({
        where: { id: trigger.id },
        include: { translations: true },
      });

      if (updatedTrigger) {
        return this.mapToTriggerData(updatedTrigger);
      }
    }

    return this.mapToTriggerData(trigger);
  }

  /**
   * Find all triggers for a space
   * Requirements: 6.2
   */
  async findBySpaceId(
    spaceId: string,
    adminId: string,
    lang?: LanguageCode
  ): Promise<TriggerZoneData[]> {
    // Verify space exists and belongs to admin
    const space = await this.prisma.space.findUnique({
      where: { id: spaceId },
    });

    if (!space) {
      throw new AppError(ErrorCode.SPACE_NOT_FOUND, 'Space not found', 404);
    }

    if (space.adminId !== adminId) {
      throw AppError.forbidden('You do not have permission to view triggers for this space');
    }

    const triggers = await this.prisma.triggerZone.findMany({
      where: { spaceId },
      include: {
        translations: lang ? { where: { language: lang } } : true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return triggers.map((trigger: any) => this.mapToTriggerData(trigger));
  }

  /**
   * Find a single trigger by ID
   */
  async findById(id: string, adminId: string): Promise<TriggerZoneData> {
    const trigger = await this.prisma.triggerZone.findUnique({
      where: { id },
      include: {
        translations: true,
        space: true,
      },
    });

    if (!trigger) {
      throw new AppError(ErrorCode.TRIGGER_NOT_FOUND, 'Trigger not found', 404);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((trigger as any).space.adminId !== adminId) {
      throw AppError.forbidden('You do not have permission to view this trigger');
    }

    return this.mapToTriggerData(trigger);
  }

  /**
   * Update a trigger
   * Requirements: 6.3, 6.6
   */
  async update(id: string, adminId: string, data: UpdateTriggerDto): Promise<TriggerZoneData> {
    // Validate radius if provided
    if (data.radius !== undefined) {
      this.validateRadius(data.radius);
    }

    // Verify trigger exists and belongs to admin's space
    const existingTrigger = await this.prisma.triggerZone.findUnique({
      where: { id },
      include: { space: true },
    });

    if (!existingTrigger) {
      throw new AppError(ErrorCode.TRIGGER_NOT_FOUND, 'Trigger not found', 404);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((existingTrigger as any).space.adminId !== adminId) {
      throw AppError.forbidden('You do not have permission to update this trigger');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};

    if (data.position !== undefined) {
      updateData.positionX = data.position.x;
      updateData.positionY = data.position.y;
      updateData.positionZ = data.position.z;
    }
    if (data.radius !== undefined) updateData.radius = data.radius;
    if (data.triggerType !== undefined) updateData.triggerType = data.triggerType;
    if (data.message !== undefined) updateData.message = data.message;
    if (data.autoCloseSeconds !== undefined) updateData.autoCloseSeconds = data.autoCloseSeconds;
    if (data.vibrationPattern !== undefined) updateData.vibrationPattern = data.vibrationPattern;
    if (data.soundEffect !== undefined) updateData.soundEffect = data.soundEffect;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const trigger = await this.prisma.triggerZone.update({
      where: { id },
      data: updateData,
      include: { translations: true },
    });

    // Regenerate translations if requested
    if (data.regenerateTranslations && data.targetLanguages && data.targetLanguages.length > 0) {
      await this.prisma.triggerTranslation.deleteMany({
        where: { triggerId: id },
      });

      await this.createMockTranslations(
        id,
        data.message ?? existingTrigger.message,
        data.targetLanguages
      );

      const updatedTrigger = await this.prisma.triggerZone.findUnique({
        where: { id },
        include: { translations: true },
      });

      if (updatedTrigger) {
        return this.mapToTriggerData(updatedTrigger);
      }
    }

    return this.mapToTriggerData(trigger);
  }

  /**
   * Delete a trigger and its associated translations
   * Requirements: 6.4
   */
  async delete(id: string, adminId: string): Promise<void> {
    // Verify trigger exists and belongs to admin's space
    const existingTrigger = await this.prisma.triggerZone.findUnique({
      where: { id },
      include: { space: true },
    });

    if (!existingTrigger) {
      throw new AppError(ErrorCode.TRIGGER_NOT_FOUND, 'Trigger not found', 404);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((existingTrigger as any).space.adminId !== adminId) {
      throw AppError.forbidden('You do not have permission to delete this trigger');
    }

    // Delete trigger (translations will be cascade deleted due to schema relation)
    await this.prisma.triggerZone.delete({
      where: { id },
    });
  }

  /**
   * Get trigger count for a space
   */
  async getTriggerCount(spaceId: string): Promise<number> {
    return this.prisma.triggerZone.count({
      where: { spaceId },
    });
  }

  /**
   * Validate radius is within allowed range
   * Requirements: 6.6
   */
  private validateRadius(radius: number): void {
    if (radius < MIN_RADIUS || radius > MAX_RADIUS) {
      throw new AppError(
        ErrorCode.INVALID_RADIUS,
        `Radius must be between ${MIN_RADIUS}m and ${MAX_RADIUS}m`,
        400
      );
    }
  }

  /**
   * Check if space has reached trigger limit
   * Requirements: 6.5
   */
  private async checkTriggerLimit(spaceId: string): Promise<void> {
    const triggerCount = await this.prisma.triggerZone.count({
      where: { spaceId },
    });

    if (triggerCount >= MAX_TRIGGERS_PER_SPACE) {
      throw new AppError(
        ErrorCode.TRIGGER_LIMIT_EXCEEDED,
        `Trigger limit exceeded. Maximum ${MAX_TRIGGERS_PER_SPACE} triggers per space.`,
        403
      );
    }
  }

  /**
   * Create mock translations for development environment
   */
  private async createMockTranslations(
    triggerId: string,
    message: string,
    targetLanguages: LanguageCode[]
  ): Promise<void> {
    const translations = targetLanguages.map((lang) => ({
      triggerId,
      language: lang,
      message: `${message} [${lang.toUpperCase()}]`,
      isAutoTranslated: true,
    }));

    await this.prisma.triggerTranslation.createMany({
      data: translations,
    });
  }

  /**
   * Map Prisma trigger to TriggerZoneData
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapToTriggerData(trigger: any): TriggerZoneData {
    const result: TriggerZoneData = {
      id: trigger.id,
      spaceId: trigger.spaceId,
      position: {
        x: Number(trigger.positionX),
        y: Number(trigger.positionY),
        z: Number(trigger.positionZ),
      },
      radius: Number(trigger.radius),
      triggerType: trigger.triggerType as TriggerType,
      message: trigger.message,
      autoCloseSeconds: trigger.autoCloseSeconds,
      vibrationPattern: trigger.vibrationPattern as VibrationPattern,
      soundEffect: trigger.soundEffect as SoundEffect,
      isActive: trigger.isActive,
      createdAt: trigger.createdAt,
      updatedAt: trigger.updatedAt,
    };

    if (trigger.translations) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      result.translations = trigger.translations.map((t: any) => ({
        id: t.id,
        triggerId: t.triggerId,
        language: t.language as LanguageCode,
        message: t.message,
        isAutoTranslated: t.isAutoTranslated,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      }));
    }

    return result;
  }
}

// Export singleton instance
export const triggerService = new TriggerService();
