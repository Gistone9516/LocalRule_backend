import { PrismaClient } from '@prisma/client';
import { prisma } from '../config/database';
import { AppError, ErrorCode } from '../utils/errors';
import { LanguageCode, ExploreMode, EventType } from '../types';

export interface StartVisitDto {
  spaceId: string;
  deviceId: string;
  language: LanguageCode;
  mode: ExploreMode;
}

export interface LogEventDto {
  eventType: EventType;
  referenceId?: string;
  eventData?: Record<string, unknown>;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface SpaceStats {
  totalVisits: number;
  averageDurationSeconds: number;
  visitsByMode: {
    vr: number;
    ar: number;
  };
  visitsByLanguage: Record<string, number>;
  popularObjects: Array<{
    objectId: string;
    clickCount: number;
  }>;
  triggerEngagements: Array<{
    triggerId: string;
    enterCount: number;
  }>;
}

export interface VisitData {
  id: string;
  spaceId: string;
  deviceId: string;
  language: LanguageCode;
  mode: ExploreMode;
  startedAt: Date;
  endedAt: Date | null;
  durationSeconds: number | null;
  completedTour: boolean;
  createdAt: Date;
}


export interface VisitLogData {
  id: string;
  visitId: string;
  eventType: EventType;
  referenceId: string | null;
  eventData: Record<string, unknown> | null;
  createdAt: Date;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GuestVisit = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type VisitLog = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GuestVisitWithLogs = any;

export class VisitService {
  private prisma: PrismaClient;

  constructor(prismaClient: PrismaClient = prisma) {
    this.prisma = prismaClient;
  }

  /**
   * Start a new visit session
   * Requirements: 9.1
   */
  async startVisit(data: StartVisitDto): Promise<VisitData> {
    // Verify space exists
    const space = await this.prisma.space.findUnique({
      where: { id: data.spaceId },
    });

    if (!space || space.deletedAt) {
      throw new AppError(ErrorCode.SPACE_NOT_FOUND, 'Space not found', 404);
    }

    const visit = await this.prisma.guestVisit.create({
      data: {
        spaceId: data.spaceId,
        deviceId: data.deviceId,
        language: data.language,
        mode: data.mode,
        startedAt: new Date(),
      },
    });

    return this.mapToVisitData(visit);
  }

  /**
   * End a visit session and calculate duration
   * Requirements: 9.2
   */
  async endVisit(id: string): Promise<VisitData> {
    const visit = await this.prisma.guestVisit.findUnique({
      where: { id },
    });

    if (!visit) {
      throw new AppError(ErrorCode.VISIT_NOT_FOUND, 'Visit not found', 404);
    }

    if (visit.endedAt) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Visit already ended', 400);
    }

    const endedAt = new Date();
    const durationSeconds = Math.floor(
      (endedAt.getTime() - visit.startedAt.getTime()) / 1000
    );

    const updatedVisit = await this.prisma.guestVisit.update({
      where: { id },
      data: {
        endedAt,
        durationSeconds,
      },
    });

    return this.mapToVisitData(updatedVisit);
  }

  /**
   * Log an event during a visit
   * Requirements: 9.3
   */
  async logEvent(visitId: string, data: LogEventDto): Promise<VisitLogData> {
    // Verify visit exists
    const visit = await this.prisma.guestVisit.findUnique({
      where: { id: visitId },
    });

    if (!visit) {
      throw new AppError(ErrorCode.VISIT_NOT_FOUND, 'Visit not found', 404);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const createData: any = {
      visitId,
      eventType: data.eventType,
      referenceId: data.referenceId || null,
    };
    if (data.eventData) {
      createData.eventData = data.eventData;
    }

    const log = await this.prisma.visitLog.create({
      data: createData,
    });

    return this.mapToVisitLogData(log);
  }


  /**
   * Get statistics for a space
   * Requirements: 9.4
   */
  async getStats(spaceId: string, dateRange?: DateRange): Promise<SpaceStats> {
    // Verify space exists
    const space = await this.prisma.space.findUnique({
      where: { id: spaceId },
    });

    if (!space || space.deletedAt) {
      throw new AppError(ErrorCode.SPACE_NOT_FOUND, 'Space not found', 404);
    }

    // Build date filter
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dateFilter: any = {};
    if (dateRange) {
      dateFilter.startedAt = {
        gte: dateRange.startDate,
        lte: dateRange.endDate,
      };
    }

    // Get all visits for the space
    const visits: GuestVisitWithLogs[] = await this.prisma.guestVisit.findMany({
      where: {
        spaceId,
        ...dateFilter,
      },
      include: {
        logs: true,
      },
    });

    // Calculate total visits
    const totalVisits = visits.length;

    // Calculate average duration (only for completed visits)
    const completedVisits = visits.filter((v: GuestVisitWithLogs) => v.durationSeconds !== null);
    const averageDurationSeconds =
      completedVisits.length > 0
        ? Math.round(
            completedVisits.reduce((sum: number, v: GuestVisitWithLogs) => sum + (v.durationSeconds || 0), 0) /
              completedVisits.length
          )
        : 0;

    // Count visits by mode
    const visitsByMode = {
      vr: visits.filter((v: GuestVisitWithLogs) => v.mode === 'vr').length,
      ar: visits.filter((v: GuestVisitWithLogs) => v.mode === 'ar').length,
    };

    // Count visits by language
    const visitsByLanguage: Record<string, number> = {};
    visits.forEach((v: GuestVisitWithLogs) => {
      visitsByLanguage[v.language] = (visitsByLanguage[v.language] || 0) + 1;
    });

    // Count object clicks
    const objectClicks: Record<string, number> = {};
    visits.forEach((v: GuestVisitWithLogs) => {
      v.logs
        .filter((log: VisitLog) => log.eventType === 'object_click' && log.referenceId)
        .forEach((log: VisitLog) => {
          const refId = log.referenceId!;
          objectClicks[refId] = (objectClicks[refId] || 0) + 1;
        });
    });

    const popularObjects = Object.entries(objectClicks)
      .map(([objectId, clickCount]) => ({ objectId, clickCount }))
      .sort((a, b) => b.clickCount - a.clickCount)
      .slice(0, 10);

    // Count trigger engagements
    const triggerEnters: Record<string, number> = {};
    visits.forEach((v: GuestVisitWithLogs) => {
      v.logs
        .filter((log: VisitLog) => log.eventType === 'trigger_enter' && log.referenceId)
        .forEach((log: VisitLog) => {
          const refId = log.referenceId!;
          triggerEnters[refId] = (triggerEnters[refId] || 0) + 1;
        });
    });

    const triggerEngagements = Object.entries(triggerEnters)
      .map(([triggerId, enterCount]) => ({ triggerId, enterCount }))
      .sort((a, b) => b.enterCount - a.enterCount)
      .slice(0, 10);

    return {
      totalVisits,
      averageDurationSeconds,
      visitsByMode,
      visitsByLanguage,
      popularObjects,
      triggerEngagements,
    };
  }


  /**
   * Get a visit by ID
   */
  async findById(id: string): Promise<VisitData> {
    const visit = await this.prisma.guestVisit.findUnique({
      where: { id },
    });

    if (!visit) {
      throw new AppError(ErrorCode.VISIT_NOT_FOUND, 'Visit not found', 404);
    }

    return this.mapToVisitData(visit);
  }

  /**
   * Get visits for a space
   */
  async findBySpaceId(spaceId: string, limit = 100): Promise<VisitData[]> {
    const visits = await this.prisma.guestVisit.findMany({
      where: { spaceId },
      orderBy: { startedAt: 'desc' },
      take: limit,
    });

    return visits.map((v: GuestVisit) => this.mapToVisitData(v));
  }

  /**
   * Get logs for a visit
   */
  async getVisitLogs(visitId: string): Promise<VisitLogData[]> {
    const logs = await this.prisma.visitLog.findMany({
      where: { visitId },
      orderBy: { createdAt: 'asc' },
    });

    return logs.map((l: VisitLog) => this.mapToVisitLogData(l));
  }

  /**
   * Map Prisma visit to VisitData
   */
  private mapToVisitData(visit: GuestVisit): VisitData {
    return {
      id: visit.id,
      spaceId: visit.spaceId,
      deviceId: visit.deviceId,
      language: visit.language as LanguageCode,
      mode: visit.mode as ExploreMode,
      startedAt: visit.startedAt,
      endedAt: visit.endedAt,
      durationSeconds: visit.durationSeconds,
      completedTour: visit.completedTour,
      createdAt: visit.createdAt,
    };
  }

  /**
   * Map Prisma visit log to VisitLogData
   */
  private mapToVisitLogData(log: VisitLog): VisitLogData {
    return {
      id: log.id,
      visitId: log.visitId,
      eventType: log.eventType as EventType,
      referenceId: log.referenceId,
      eventData: log.eventData as Record<string, unknown> | null,
      createdAt: log.createdAt,
    };
  }
}

// Export singleton instance
export const visitService = new VisitService();
