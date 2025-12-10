import { PrismaClient } from '@prisma/client';
import { prisma } from '../config/database';
import { AppError, ErrorCode } from '../utils/errors';
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';

export interface QRCodeData {
  id: string;
  spaceId: string;
  code: string;
  qrImageUrl: string;
  scanCount: number;
  lastScannedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SpaceWithDetails {
  id: string;
  name: string;
  description: string | null;
  width: number;
  height: number;
  depth: number;
  status: string;
  objects: SpaceObjectWithRules[];
  triggerZones: TriggerZoneWithTranslations[];
}

interface SpaceObjectWithRules {
  id: string;
  customName: string | null;
  positionX: number;
  positionY: number;
  positionZ: number;
  rotationX: number;
  rotationY: number;
  rotationZ: number;
  scaleX: number;
  scaleY: number;
  scaleZ: number;
  objectType: {
    id: string;
    name: string;
    nameKo: string;
    nameEn: string;
    category: string;
  };
  rules: RuleWithTranslations[];
}


interface RuleWithTranslations {
  id: string;
  title: string;
  description: string;
  iconType: string;
  priority: number;
  translations: {
    language: string;
    title: string;
    description: string;
  }[];
}

interface TriggerZoneWithTranslations {
  id: string;
  positionX: number;
  positionY: number;
  positionZ: number;
  radius: number;
  triggerType: string;
  message: string;
  autoCloseSeconds: number | null;
  vibrationPattern: string;
  soundEffect: string;
  translations: {
    language: string;
    message: string;
  }[];
}

// Characters for generating QR codes (uppercase letters and numbers)
const QR_CODE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const QR_CODE_LENGTH = 8;

export class QRService {
  private prisma: PrismaClient;

  constructor(prismaClient: PrismaClient = prisma) {
    this.prisma = prismaClient;
  }

  /**
   * Generate a unique 8-character code
   * Requirements: 7.1
   */
  private generateUniqueCode(): string {
    let code = '';
    for (let i = 0; i < QR_CODE_LENGTH; i++) {
      const randomIndex = Math.floor(Math.random() * QR_CODE_CHARS.length);
      code += QR_CODE_CHARS[randomIndex];
    }
    return code;
  }

  /**
   * Generate QR code image as data URL
   */
  private async generateQRImage(code: string): Promise<string> {
    const qrUrl = `localrule://space/${code}`;
    const dataUrl = await QRCode.toDataURL(qrUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });
    return dataUrl;
  }


  /**
   * Generate a QR code for a space
   * Requirements: 7.1
   */
  async generate(spaceId: string, adminId: string): Promise<QRCodeData> {
    // Check if space exists and belongs to admin
    const space = await this.prisma.space.findUnique({
      where: { id: spaceId },
    });

    if (!space || space.deletedAt) {
      throw new AppError(ErrorCode.SPACE_NOT_FOUND, 'Space not found', 404);
    }

    if (space.adminId !== adminId) {
      throw AppError.forbidden('You do not have permission to generate QR for this space');
    }

    // Check if QR code already exists for this space
    const existingQR = await this.prisma.qrCode.findUnique({
      where: { spaceId },
    });

    if (existingQR) {
      return this.mapToQRCodeData(existingQR);
    }

    // Generate unique code with retry logic
    let code: string;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      code = this.generateUniqueCode();
      const existing = await this.prisma.qrCode.findUnique({
        where: { code },
      });
      if (!existing) break;
      attempts++;
    } while (attempts < maxAttempts);

    if (attempts >= maxAttempts) {
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        'Failed to generate unique QR code',
        500
      );
    }

    // Generate QR image
    const qrImageUrl = await this.generateQRImage(code);

    // Create QR code record
    const qrCode = await this.prisma.qrCode.create({
      data: {
        id: uuidv4(),
        spaceId,
        code,
        qrImageUrl,
        scanCount: 0,
      },
    });

    return this.mapToQRCodeData(qrCode);
  }


  /**
   * Find space by QR code
   * Requirements: 7.2
   */
  async findByCode(code: string): Promise<SpaceWithDetails> {
    const qrCode = await this.prisma.qrCode.findUnique({
      where: { code },
      include: {
        space: {
          include: {
            objects: {
              include: {
                objectType: true,
                rules: {
                  include: {
                    translations: true,
                    image: true,
                  },
                  where: {
                    isActive: true,
                  },
                  orderBy: [
                    { priority: 'asc' },
                    { displayOrder: 'asc' },
                  ],
                },
              },
            },
            triggerZones: {
              include: {
                translations: true,
              },
              where: {
                isActive: true,
              },
            },
          },
        },
      },
    });

    if (!qrCode) {
      throw new AppError(ErrorCode.QR_NOT_FOUND, 'QR code not found', 404);
    }

    const space = qrCode.space;

    if (!space || space.deletedAt) {
      throw new AppError(ErrorCode.SPACE_NOT_FOUND, 'Space not found', 404);
    }

    return this.mapToSpaceWithDetails(space);
  }

  /**
   * Increment scan count for a QR code
   * Requirements: 7.3
   */
  async incrementScanCount(code: string): Promise<QRCodeData> {
    const qrCode = await this.prisma.qrCode.findUnique({
      where: { code },
    });

    if (!qrCode) {
      throw new AppError(ErrorCode.QR_NOT_FOUND, 'QR code not found', 404);
    }

    const updated = await this.prisma.qrCode.update({
      where: { code },
      data: {
        scanCount: { increment: 1 },
        lastScannedAt: new Date(),
      },
    });

    return this.mapToQRCodeData(updated);
  }


  /**
   * Get QR code by space ID
   */
  async findBySpaceId(spaceId: string): Promise<QRCodeData | null> {
    const qrCode = await this.prisma.qrCode.findUnique({
      where: { spaceId },
    });

    if (!qrCode) {
      return null;
    }

    return this.mapToQRCodeData(qrCode);
  }

  /**
   * Delete QR code for a space
   */
  async delete(spaceId: string, adminId: string): Promise<void> {
    const space = await this.prisma.space.findUnique({
      where: { id: spaceId },
    });

    if (!space || space.deletedAt) {
      throw new AppError(ErrorCode.SPACE_NOT_FOUND, 'Space not found', 404);
    }

    if (space.adminId !== adminId) {
      throw AppError.forbidden('You do not have permission to delete this QR code');
    }

    const qrCode = await this.prisma.qrCode.findUnique({
      where: { spaceId },
    });

    if (!qrCode) {
      throw new AppError(ErrorCode.QR_NOT_FOUND, 'QR code not found', 404);
    }

    await this.prisma.qrCode.delete({
      where: { spaceId },
    });
  }

  /**
   * Map Prisma QR code to QRCodeData
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapToQRCodeData(qrCode: any): QRCodeData {
    return {
      id: qrCode.id,
      spaceId: qrCode.spaceId,
      code: qrCode.code,
      qrImageUrl: qrCode.qrImageUrl,
      scanCount: qrCode.scanCount,
      lastScannedAt: qrCode.lastScannedAt,
      createdAt: qrCode.createdAt,
      updatedAt: qrCode.updatedAt,
    };
  }


  /**
   * Map Prisma space with relations to SpaceWithDetails
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapToSpaceWithDetails(space: any): SpaceWithDetails {
    return {
      id: space.id,
      name: space.name,
      description: space.description,
      width: Number(space.width),
      height: Number(space.height),
      depth: Number(space.depth),
      status: space.status,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      objects: space.objects.map((obj: any) => ({
        id: obj.id,
        customName: obj.customName,
        positionX: Number(obj.positionX),
        positionY: Number(obj.positionY),
        positionZ: Number(obj.positionZ),
        rotationX: Number(obj.rotationX),
        rotationY: Number(obj.rotationY),
        rotationZ: Number(obj.rotationZ),
        scaleX: Number(obj.scaleX),
        scaleY: Number(obj.scaleY),
        scaleZ: Number(obj.scaleZ),
        objectType: {
          id: obj.objectType.id,
          name: obj.objectType.name,
          nameKo: obj.objectType.nameKo,
          nameEn: obj.objectType.nameEn,
          category: obj.objectType.category,
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rules: obj.rules.map((rule: any) => ({
          id: rule.id,
          title: rule.title,
          description: rule.description,
          iconType: rule.iconType,
          priority: rule.priority,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          translations: rule.translations.map((t: any) => ({
            language: t.language,
            title: t.title,
            description: t.description,
          })),
        })),
      })),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      triggerZones: space.triggerZones.map((trigger: any) => ({
        id: trigger.id,
        positionX: Number(trigger.positionX),
        positionY: Number(trigger.positionY),
        positionZ: Number(trigger.positionZ),
        radius: Number(trigger.radius),
        triggerType: trigger.triggerType,
        message: trigger.message,
        autoCloseSeconds: trigger.autoCloseSeconds,
        vibrationPattern: trigger.vibrationPattern,
        soundEffect: trigger.soundEffect,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        translations: trigger.translations.map((t: any) => ({
          language: t.language,
          message: t.message,
        })),
      })),
    };
  }
}

// Export singleton instance
export const qrService = new QRService();
