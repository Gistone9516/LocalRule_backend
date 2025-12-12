import { PrismaClient } from '@prisma/client';
import { prisma } from '../config/database';
import { AppError, ErrorCode } from '../utils/errors';
import { IconType, LanguageCode } from '../types';

// Maximum rules per object
const MAX_RULES_PER_OBJECT = 10;
const MAX_TITLE_LENGTH = 30;

export interface CreateRuleDto {
  title: string;
  description: string;
  iconType: IconType;
  priority?: number;
  displayOrder?: number;
  isActive?: boolean;
  autoTranslate?: boolean;
  targetLanguages?: LanguageCode[];
}

export interface UpdateRuleDto {
  title?: string;
  description?: string;
  iconType?: IconType;
  priority?: number;
  displayOrder?: number;
  isActive?: boolean;
  regenerateTranslations?: boolean;
  targetLanguages?: LanguageCode[];
}

export interface RuleTranslationData {
  id: string;
  ruleId: string;
  language: LanguageCode;
  title: string;
  description: string;
  isAutoTranslated: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RuleImageData {
  id: string;
  ruleId: string;
  imageUrl: string;
  altText: string | null;
  fileSize: number;
  createdAt: Date;
}

export interface LocalRuleData {
  id: string;
  objectId: string;
  title: string;
  description: string;
  iconType: IconType;
  priority: number;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  translations?: RuleTranslationData[];
  image?: RuleImageData | null;
}


export class RuleService {
  private prisma: PrismaClient;

  constructor(prismaClient: PrismaClient = prisma) {
    this.prisma = prismaClient;
  }

  /**
   * Create a new rule for an object
   * Requirements: 5.1, 5.6, 5.7
   */
  async create(objectId: string, adminId: string, data: CreateRuleDto): Promise<LocalRuleData> {
    // Validate title length
    if (data.title.length > MAX_TITLE_LENGTH) {
      throw new AppError(
        ErrorCode.TITLE_TOO_LONG,
        `Title must not exceed ${MAX_TITLE_LENGTH} characters`,
        400
      );
    }

    // Verify object exists and belongs to admin's space
    const object = await this.prisma.spaceObject.findUnique({
      where: { id: objectId },
      include: { space: true },
    });

    if (!object) {
      throw new AppError(ErrorCode.OBJECT_NOT_FOUND, 'Object not found', 404);
    }

    if (object.space.adminId !== adminId) {
      throw AppError.forbidden('You do not have permission to add rules to this object');
    }

    // Check rule limit
    await this.checkRuleLimit(objectId);

    // Get next display order
    const maxOrder = await this.prisma.localRule.aggregate({
      where: { objectId },
      _max: { displayOrder: true },
    });
    const displayOrder = data.displayOrder ?? (maxOrder._max.displayOrder ?? -1) + 1;

    const rule = await this.prisma.localRule.create({
      data: {
        objectId,
        title: data.title,
        description: data.description,
        iconType: data.iconType,
        priority: data.priority ?? 5,
        displayOrder,
        isActive: data.isActive ?? true,
      },
      include: {
        translations: true,
        image: true,
      },
    });

    // Auto-translate if requested (mock implementation for dev)
    if (data.autoTranslate && data.targetLanguages && data.targetLanguages.length > 0) {
      await this.createMockTranslations(rule.id, data.title, data.description, data.targetLanguages);
      
      // Refetch with translations
      const updatedRule = await this.prisma.localRule.findUnique({
        where: { id: rule.id },
        include: {
          translations: true,
          image: true,
        },
      });
      
      if (updatedRule) {
        return this.mapToRuleData(updatedRule);
      }
    }

    return this.mapToRuleData(rule);
  }

  /**
   * Find all rules for an object
   * Requirements: 5.3
   */
  async findByObjectId(
    objectId: string,
    adminId: string,
    lang?: LanguageCode
  ): Promise<LocalRuleData[]> {
    // Verify object exists and belongs to admin's space
    const object = await this.prisma.spaceObject.findUnique({
      where: { id: objectId },
      include: { space: true },
    });

    if (!object) {
      throw new AppError(ErrorCode.OBJECT_NOT_FOUND, 'Object not found', 404);
    }

    if (object.space.adminId !== adminId) {
      throw AppError.forbidden('You do not have permission to view rules for this object');
    }

    const rules = await this.prisma.localRule.findMany({
      where: { objectId },
      include: {
        translations: lang ? { where: { language: lang } } : true,
        image: true,
      },
      orderBy: [{ priority: 'asc' }, { displayOrder: 'asc' }],
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return rules.map((rule: any) => this.mapToRuleData(rule));
  }

  /**
   * Find a single rule by ID
   */
  async findById(id: string, adminId: string): Promise<LocalRuleData> {
    const rule = await this.prisma.localRule.findUnique({
      where: { id },
      include: {
        translations: true,
        image: true,
        object: {
          include: { space: true },
        },
      },
    });

    if (!rule) {
      throw new AppError(ErrorCode.RULE_NOT_FOUND, 'Rule not found', 404);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((rule as any).object.space.adminId !== adminId) {
      throw AppError.forbidden('You do not have permission to view this rule');
    }

    return this.mapToRuleData(rule);
  }


  /**
   * Update a rule
   * Requirements: 5.4, 5.7
   */
  async update(id: string, adminId: string, data: UpdateRuleDto): Promise<LocalRuleData> {
    // Validate title length if provided
    if (data.title !== undefined && data.title.length > MAX_TITLE_LENGTH) {
      throw new AppError(
        ErrorCode.TITLE_TOO_LONG,
        `Title must not exceed ${MAX_TITLE_LENGTH} characters`,
        400
      );
    }

    // Verify rule exists and belongs to admin's space
    const existingRule = await this.prisma.localRule.findUnique({
      where: { id },
      include: {
        object: {
          include: { space: true },
        },
      },
    });

    if (!existingRule) {
      throw new AppError(ErrorCode.RULE_NOT_FOUND, 'Rule not found', 404);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((existingRule as any).object.space.adminId !== adminId) {
      throw AppError.forbidden('You do not have permission to update this rule');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.iconType !== undefined) updateData.iconType = data.iconType;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.displayOrder !== undefined) updateData.displayOrder = data.displayOrder;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const rule = await this.prisma.localRule.update({
      where: { id },
      data: updateData,
      include: {
        translations: true,
        image: true,
      },
    });

    // Regenerate translations if requested
    if (data.regenerateTranslations && data.targetLanguages && data.targetLanguages.length > 0) {
      // Delete existing translations
      await this.prisma.ruleTranslation.deleteMany({
        where: { ruleId: id },
      });

      // Create new translations
      await this.createMockTranslations(
        id,
        data.title ?? existingRule.title,
        data.description ?? existingRule.description,
        data.targetLanguages
      );

      // Refetch with new translations
      const updatedRule = await this.prisma.localRule.findUnique({
        where: { id },
        include: {
          translations: true,
          image: true,
        },
      });

      if (updatedRule) {
        return this.mapToRuleData(updatedRule);
      }
    }

    return this.mapToRuleData(rule);
  }

  /**
   * Delete a rule and its associated translations and images
   * Requirements: 5.5
   */
  async delete(id: string, adminId: string): Promise<void> {
    // Verify rule exists and belongs to admin's space
    const existingRule = await this.prisma.localRule.findUnique({
      where: { id },
      include: {
        object: {
          include: { space: true },
        },
      },
    });

    if (!existingRule) {
      throw new AppError(ErrorCode.RULE_NOT_FOUND, 'Rule not found', 404);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((existingRule as any).object.space.adminId !== adminId) {
      throw AppError.forbidden('You do not have permission to delete this rule');
    }

    // Delete rule (translations and image will be cascade deleted due to schema relation)
    await this.prisma.localRule.delete({
      where: { id },
    });
  }

  /**
   * Update rule order for an object
   * Requirements: 5.3
   */
  async updateOrder(objectId: string, adminId: string, ruleIds: string[]): Promise<LocalRuleData[]> {
    // Verify object exists and belongs to admin's space
    const object = await this.prisma.spaceObject.findUnique({
      where: { id: objectId },
      include: { space: true },
    });

    if (!object) {
      throw new AppError(ErrorCode.OBJECT_NOT_FOUND, 'Object not found', 404);
    }

    if (object.space.adminId !== adminId) {
      throw AppError.forbidden('You do not have permission to reorder rules for this object');
    }

    // Update display order for each rule
    await Promise.all(
      ruleIds.map((ruleId, index) =>
        this.prisma.localRule.update({
          where: { id: ruleId },
          data: { displayOrder: index },
        })
      )
    );

    // Return updated rules
    return this.findByObjectId(objectId, adminId);
  }

  /**
   * Get rule count for an object
   */
  async getRuleCount(objectId: string): Promise<number> {
    return this.prisma.localRule.count({
      where: { objectId },
    });
  }


  /**
   * Check if object has reached rule limit
   * Requirements: 5.6
   */
  private async checkRuleLimit(objectId: string): Promise<void> {
    const ruleCount = await this.prisma.localRule.count({
      where: { objectId },
    });

    if (ruleCount >= MAX_RULES_PER_OBJECT) {
      throw new AppError(
        ErrorCode.RULE_LIMIT_EXCEEDED,
        `Rule limit exceeded. Maximum ${MAX_RULES_PER_OBJECT} rules per object.`,
        403
      );
    }
  }

  /**
   * Create mock translations for development environment
   * In production, this would call AWS Translate
   */
  private async createMockTranslations(
    ruleId: string,
    title: string,
    description: string,
    targetLanguages: LanguageCode[]
  ): Promise<void> {
    const translations = targetLanguages.map((lang) => ({
      ruleId,
      language: lang,
      title: `${title} [${lang.toUpperCase()}]`,
      description: `${description} [${lang.toUpperCase()}]`,
      isAutoTranslated: true,
    }));

    await this.prisma.ruleTranslation.createMany({
      data: translations,
    });
  }

  /**
   * Map Prisma rule to LocalRuleData
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapToRuleData(rule: any): LocalRuleData {
    const result: LocalRuleData = {
      id: rule.id,
      objectId: rule.objectId,
      title: rule.title,
      description: rule.description,
      iconType: rule.iconType as IconType,
      priority: rule.priority,
      displayOrder: rule.displayOrder,
      isActive: rule.isActive,
      createdAt: rule.createdAt,
      updatedAt: rule.updatedAt,
    };

    if (rule.translations) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      result.translations = rule.translations.map((t: any) => ({
        id: t.id,
        ruleId: t.ruleId,
        language: t.language as LanguageCode,
        title: t.title,
        description: t.description,
        isAutoTranslated: t.isAutoTranslated,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      }));
    }

    if (rule.image) {
      result.image = {
        id: rule.image.id,
        ruleId: rule.image.ruleId,
        imageUrl: rule.image.imageUrl,
        altText: rule.image.altText,
        fileSize: Number(rule.image.fileSize),
        createdAt: rule.image.createdAt,
      };
    } else {
      result.image = null;
    }

    return result;
  }
}

// Export singleton instance
export const ruleService = new RuleService();
