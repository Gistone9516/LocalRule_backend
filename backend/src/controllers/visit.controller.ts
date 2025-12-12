import { Request, Response, NextFunction } from 'express';
import {
  visitService,
  StartVisitDto,
  LogEventDto,
  DateRange,
} from '../services/visit.service';
import { successResponse, createdResponse } from '../utils/response';
import { AppError, ErrorCode } from '../utils/errors';
import { LanguageCode, ExploreMode, EventType } from '../types';

const VALID_LANGUAGES: LanguageCode[] = ['ko', 'en', 'ja', 'zh'];
const VALID_MODES: ExploreMode[] = ['vr', 'ar'];
const VALID_EVENT_TYPES: EventType[] = [
  'object_click',
  'trigger_enter',
  'trigger_exit',
  'mode_switch',
  'calibration_complete',
];

export class VisitController {
  /**
   * Start a new visit session
   * POST /api/v1/visits
   * Requirements: 9.1
   */
  async startVisit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { spaceId, deviceId, language, mode } = req.body;

      // Validate required fields
      if (!spaceId || !deviceId || !language || !mode) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          'spaceId, deviceId, language, and mode are required',
          400
        );
      }

      // Validate language
      if (!VALID_LANGUAGES.includes(language)) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          `Invalid language. Must be one of: ${VALID_LANGUAGES.join(', ')}`,
          400
        );
      }

      // Validate mode
      if (!VALID_MODES.includes(mode)) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          `Invalid mode. Must be one of: ${VALID_MODES.join(', ')}`,
          400
        );
      }

      const startData: StartVisitDto = {
        spaceId,
        deviceId,
        language,
        mode,
      };

      const visit = await visitService.startVisit(startData);

      createdResponse(res, { visit }, req.id);
    } catch (error) {
      next(error);
    }
  }


  /**
   * End a visit session
   * PATCH /api/v1/visits/:id/end
   * Requirements: 9.2
   */
  async endVisit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const visit = await visitService.endVisit(id);

      successResponse(res, { visit }, 200, req.id);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Log an event during a visit
   * POST /api/v1/visits/:id/events
   * Requirements: 9.3
   */
  async logEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { eventType, referenceId, eventData } = req.body;

      // Validate required fields
      if (!eventType) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          'eventType is required',
          400
        );
      }

      // Validate event type
      if (!VALID_EVENT_TYPES.includes(eventType)) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          `Invalid eventType. Must be one of: ${VALID_EVENT_TYPES.join(', ')}`,
          400
        );
      }

      const logData: LogEventDto = {
        eventType,
        referenceId,
        eventData,
      };

      const log = await visitService.logEvent(id, logData);

      createdResponse(res, { log }, req.id);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get statistics for a space
   * GET /api/v1/spaces/:spaceId/stats
   * Requirements: 9.4
   */
  async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.adminId;
      const { spaceId } = req.params;

      if (!adminId) {
        throw AppError.unauthorized('Authentication required');
      }

      // Parse date range if provided
      let dateRange: DateRange | undefined;
      if (req.query.startDate && req.query.endDate) {
        dateRange = {
          startDate: new Date(req.query.startDate as string),
          endDate: new Date(req.query.endDate as string),
        };
      }

      const stats = await visitService.getStats(spaceId, dateRange);

      successResponse(res, { stats }, 200, req.id);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a visit by ID
   * GET /api/v1/visits/:id
   */
  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const visit = await visitService.findById(id);

      successResponse(res, { visit }, 200, req.id);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get visits for a space
   * GET /api/v1/spaces/:spaceId/visits
   */
  async findBySpaceId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.adminId;
      const { spaceId } = req.params;
      const limit = req.query.limit ? Number(req.query.limit) : 100;

      if (!adminId) {
        throw AppError.unauthorized('Authentication required');
      }

      const visits = await visitService.findBySpaceId(spaceId, limit);

      successResponse(res, { visits }, 200, req.id);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get logs for a visit
   * GET /api/v1/visits/:id/logs
   */
  async getVisitLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const logs = await visitService.getVisitLogs(id);

      successResponse(res, { logs }, 200, req.id);
    } catch (error) {
      next(error);
    }
  }
}

export const visitController = new VisitController();
