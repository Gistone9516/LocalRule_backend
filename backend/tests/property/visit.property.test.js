"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fc = __importStar(require("fast-check"));
const visit_service_1 = require("../../src/services/visit.service");
const generators_1 = require("../helpers/generators");
// Typed generators for visit module
const languageCodeArb = fc.constantFrom('ko', 'en', 'ja', 'zh');
const exploreModeArb = fc.constantFrom('vr', 'ar');
const eventTypeArb = fc.constantFrom('object_click', 'trigger_enter', 'trigger_exit', 'mode_switch', 'calibration_complete');
/**
 * Visit Module Property Tests
 *
 * These tests validate the correctness properties defined in the design document
 * for the Visit module (Requirements 9.1 - 9.4).
 */
// Mock PrismaClient for testing
const createMockPrisma = () => {
    const spaces = new Map();
    const visits = new Map();
    const visitLogs = new Map();
    return {
        spaces,
        visits,
        visitLogs,
        space: {
            findUnique: jest.fn(({ where }) => {
                return Promise.resolve(spaces.get(where.id) || null);
            }),
        },
        guestVisit: {
            findUnique: jest.fn(({ where }) => {
                return Promise.resolve(visits.get(where.id) || null);
            }),
            findMany: jest.fn(({ where, include, orderBy, take }) => {
                let results = Array.from(visits.values()).filter((v) => {
                    if (where.spaceId && v.spaceId !== where.spaceId)
                        return false;
                    if (where.startedAt) {
                        if (where.startedAt.gte && v.startedAt < where.startedAt.gte)
                            return false;
                        if (where.startedAt.lte && v.startedAt > where.startedAt.lte)
                            return false;
                    }
                    return true;
                });
                if (orderBy?.startedAt === 'desc') {
                    results.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
                }
                if (take) {
                    results = results.slice(0, take);
                }
                if (include?.logs) {
                    results = results.map((v) => ({
                        ...v,
                        logs: Array.from(visitLogs.values()).filter((l) => l.visitId === v.id),
                    }));
                }
                return Promise.resolve(results);
            }),
            create: jest.fn((data) => {
                const visit = {
                    id: `visit-${Date.now()}-${Math.random()}`,
                    ...data.data,
                    endedAt: null,
                    durationSeconds: null,
                    completedTour: false,
                    createdAt: new Date(),
                };
                visits.set(visit.id, visit);
                return Promise.resolve(visit);
            }),
            update: jest.fn(({ where, data }) => {
                const visit = visits.get(where.id);
                if (!visit)
                    return Promise.resolve(null);
                const updated = { ...visit, ...data };
                visits.set(where.id, updated);
                return Promise.resolve(updated);
            }),
        },
        visitLog: {
            findMany: jest.fn(({ where, orderBy }) => {
                let results = Array.from(visitLogs.values()).filter((l) => {
                    if (where.visitId && l.visitId !== where.visitId)
                        return false;
                    return true;
                });
                if (orderBy?.createdAt === 'asc') {
                    results.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
                }
                return Promise.resolve(results);
            }),
            create: jest.fn((data) => {
                const log = {
                    id: `log-${Date.now()}-${Math.random()}`,
                    ...data.data,
                    createdAt: new Date(),
                };
                visitLogs.set(log.id, log);
                return Promise.resolve(log);
            }),
        },
        reset: () => {
            spaces.clear();
            visits.clear();
            visitLogs.clear();
        },
    };
};
describe('Visit Module Property Tests', () => {
    let mockPrisma;
    let visitService;
    beforeEach(() => {
        mockPrisma = createMockPrisma();
        visitService = new visit_service_1.VisitService(mockPrisma);
    });
    afterEach(() => {
        mockPrisma.reset();
        jest.clearAllMocks();
    });
    // Helper to create test space
    const createTestSpace = (id) => {
        const space = {
            id,
            adminId: 'admin-1',
            name: 'Test Space',
            status: 'published',
            deletedAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        mockPrisma.spaces.set(id, space);
        return space;
    };
    /**
     * **Feature: backend-api, Property 37: Visit session records all data**
     * **Validates: Requirements 9.1**
     *
     * For any visit start request, a session should be created with deviceId,
     * language, mode, and startedAt timestamp.
     */
    describe('Property 37: Visit session records all data', () => {
        it('should record all provided data when starting a visit', async () => {
            await fc.assert(fc.asyncProperty(generators_1.deviceIdArb, languageCodeArb, exploreModeArb, async (deviceId, language, mode) => {
                mockPrisma.reset();
                const spaceId = `space-${Date.now()}`;
                createTestSpace(spaceId);
                const beforeStart = new Date();
                const visit = await visitService.startVisit({
                    spaceId,
                    deviceId,
                    language,
                    mode,
                });
                const afterStart = new Date();
                // Verify all data is recorded
                expect(visit.spaceId).toBe(spaceId);
                expect(visit.deviceId).toBe(deviceId);
                expect(visit.language).toBe(language);
                expect(visit.mode).toBe(mode);
                // Verify startedAt is set correctly
                expect(visit.startedAt).toBeDefined();
                expect(visit.startedAt.getTime()).toBeGreaterThanOrEqual(beforeStart.getTime());
                expect(visit.startedAt.getTime()).toBeLessThanOrEqual(afterStart.getTime());
                // Verify initial state
                expect(visit.endedAt).toBeNull();
                expect(visit.durationSeconds).toBeNull();
                expect(visit.completedTour).toBe(false);
            }), { numRuns: 50 });
        });
        it('should create unique visit IDs for each session', async () => {
            const visitIds = new Set();
            await fc.assert(fc.asyncProperty(generators_1.deviceIdArb, languageCodeArb, exploreModeArb, async (deviceId, language, mode) => {
                const spaceId = 'space-unique-test';
                if (!mockPrisma.spaces.has(spaceId)) {
                    createTestSpace(spaceId);
                }
                const visit = await visitService.startVisit({
                    spaceId,
                    deviceId,
                    language,
                    mode,
                });
                // Verify ID is unique
                expect(visitIds.has(visit.id)).toBe(false);
                visitIds.add(visit.id);
            }), { numRuns: 30 });
        });
        it('should throw error for non-existent space', async () => {
            await fc.assert(fc.asyncProperty(generators_1.uuidArb, generators_1.deviceIdArb, languageCodeArb, exploreModeArb, async (spaceId, deviceId, language, mode) => {
                mockPrisma.reset();
                // Don't create the space
                await expect(visitService.startVisit({
                    spaceId,
                    deviceId,
                    language,
                    mode,
                })).rejects.toThrow(/Space not found/);
            }), { numRuns: 20 });
        });
    });
    /**
     * **Feature: backend-api, Property 38: Visit end records duration**
     * **Validates: Requirements 9.2**
     *
     * For any active visit session, ending the visit should record endedAt
     * timestamp and calculate duration.
     */
    describe('Property 38: Visit end records duration', () => {
        it('should record endedAt and calculate duration correctly', async () => {
            await fc.assert(fc.asyncProperty(generators_1.deviceIdArb, languageCodeArb, exploreModeArb, async (deviceId, language, mode) => {
                mockPrisma.reset();
                const spaceId = `space-${Date.now()}`;
                createTestSpace(spaceId);
                // Start visit
                const startedVisit = await visitService.startVisit({
                    spaceId,
                    deviceId,
                    language,
                    mode,
                });
                // Small delay to ensure duration > 0
                await new Promise(resolve => setTimeout(resolve, 10));
                // End visit
                const beforeEnd = new Date();
                const endedVisit = await visitService.endVisit(startedVisit.id);
                const afterEnd = new Date();
                // Verify endedAt is set
                expect(endedVisit.endedAt).not.toBeNull();
                expect(endedVisit.endedAt.getTime()).toBeGreaterThanOrEqual(beforeEnd.getTime());
                expect(endedVisit.endedAt.getTime()).toBeLessThanOrEqual(afterEnd.getTime());
                // Verify duration is calculated
                expect(endedVisit.durationSeconds).not.toBeNull();
                expect(endedVisit.durationSeconds).toBeGreaterThanOrEqual(0);
                // Verify duration matches time difference
                const expectedDuration = Math.floor((endedVisit.endedAt.getTime() - startedVisit.startedAt.getTime()) / 1000);
                expect(endedVisit.durationSeconds).toBe(expectedDuration);
            }), { numRuns: 30 });
        });
        it('should throw error when ending already ended visit', async () => {
            await fc.assert(fc.asyncProperty(generators_1.deviceIdArb, languageCodeArb, exploreModeArb, async (deviceId, language, mode) => {
                mockPrisma.reset();
                const spaceId = `space-${Date.now()}`;
                createTestSpace(spaceId);
                // Start and end visit
                const visit = await visitService.startVisit({
                    spaceId,
                    deviceId,
                    language,
                    mode,
                });
                await visitService.endVisit(visit.id);
                // Try to end again
                await expect(visitService.endVisit(visit.id)).rejects.toThrow(/already ended/);
            }), { numRuns: 20 });
        });
        it('should throw error for non-existent visit', async () => {
            await fc.assert(fc.asyncProperty(generators_1.uuidArb, async (visitId) => {
                mockPrisma.reset();
                await expect(visitService.endVisit(visitId)).rejects.toThrow(/Visit not found/);
            }), { numRuns: 20 });
        });
        it('should preserve original visit data when ending', async () => {
            await fc.assert(fc.asyncProperty(generators_1.deviceIdArb, languageCodeArb, exploreModeArb, async (deviceId, language, mode) => {
                mockPrisma.reset();
                const spaceId = `space-${Date.now()}`;
                createTestSpace(spaceId);
                // Start visit
                const startedVisit = await visitService.startVisit({
                    spaceId,
                    deviceId,
                    language,
                    mode,
                });
                // End visit
                const endedVisit = await visitService.endVisit(startedVisit.id);
                // Verify original data is preserved
                expect(endedVisit.id).toBe(startedVisit.id);
                expect(endedVisit.spaceId).toBe(startedVisit.spaceId);
                expect(endedVisit.deviceId).toBe(startedVisit.deviceId);
                expect(endedVisit.language).toBe(startedVisit.language);
                expect(endedVisit.mode).toBe(startedVisit.mode);
                expect(endedVisit.startedAt.getTime()).toBe(startedVisit.startedAt.getTime());
            }), { numRuns: 30 });
        });
    });
    /**
     * **Feature: backend-api, Property 39: Events are logged correctly**
     * **Validates: Requirements 9.3**
     *
     * For any event (object click, trigger enter/exit), logging should create
     * a visit log entry with correct event type and reference.
     */
    describe('Property 39: Events are logged correctly', () => {
        it('should log events with correct event type', async () => {
            await fc.assert(fc.asyncProperty(generators_1.deviceIdArb, languageCodeArb, exploreModeArb, eventTypeArb, async (deviceId, language, mode, eventType) => {
                mockPrisma.reset();
                const spaceId = `space-${Date.now()}`;
                createTestSpace(spaceId);
                // Start visit
                const visit = await visitService.startVisit({
                    spaceId,
                    deviceId,
                    language,
                    mode,
                });
                // Log event
                const log = await visitService.logEvent(visit.id, {
                    eventType,
                });
                // Verify event type is recorded
                expect(log.eventType).toBe(eventType);
                expect(log.visitId).toBe(visit.id);
                expect(log.createdAt).toBeDefined();
            }), { numRuns: 50 });
        });
        it('should log events with reference ID when provided', async () => {
            await fc.assert(fc.asyncProperty(generators_1.deviceIdArb, languageCodeArb, exploreModeArb, generators_1.uuidArb, async (deviceId, language, mode, referenceId) => {
                mockPrisma.reset();
                const spaceId = `space-${Date.now()}`;
                createTestSpace(spaceId);
                // Start visit
                const visit = await visitService.startVisit({
                    spaceId,
                    deviceId,
                    language,
                    mode,
                });
                // Log event with reference
                const log = await visitService.logEvent(visit.id, {
                    eventType: 'object_click',
                    referenceId,
                });
                // Verify reference ID is recorded
                expect(log.referenceId).toBe(referenceId);
            }), { numRuns: 30 });
        });
        it('should log events with event data when provided', async () => {
            await fc.assert(fc.asyncProperty(generators_1.deviceIdArb, languageCodeArb, exploreModeArb, fc.record({
                x: fc.float(),
                y: fc.float(),
                z: fc.float(),
            }), async (deviceId, language, mode, eventData) => {
                mockPrisma.reset();
                const spaceId = `space-${Date.now()}`;
                createTestSpace(spaceId);
                // Start visit
                const visit = await visitService.startVisit({
                    spaceId,
                    deviceId,
                    language,
                    mode,
                });
                // Log event with data
                const log = await visitService.logEvent(visit.id, {
                    eventType: 'trigger_enter',
                    eventData,
                });
                // Verify event data is recorded
                expect(log.eventData).toEqual(eventData);
            }), { numRuns: 30 });
        });
        it('should throw error for non-existent visit', async () => {
            await fc.assert(fc.asyncProperty(generators_1.uuidArb, eventTypeArb, async (visitId, eventType) => {
                mockPrisma.reset();
                await expect(visitService.logEvent(visitId, { eventType })).rejects.toThrow(/Visit not found/);
            }), { numRuns: 20 });
        });
        it('should create unique log IDs for each event', async () => {
            const logIds = new Set();
            await fc.assert(fc.asyncProperty(eventTypeArb, async (eventType) => {
                const spaceId = 'space-log-test';
                if (!mockPrisma.spaces.has(spaceId)) {
                    createTestSpace(spaceId);
                }
                // Create a visit if needed
                let visit = Array.from(mockPrisma.visits.values())[0];
                if (!visit) {
                    visit = await visitService.startVisit({
                        spaceId,
                        deviceId: 'device-1',
                        language: 'ko',
                        mode: 'vr',
                    });
                }
                const log = await visitService.logEvent(visit.id, {
                    eventType,
                });
                // Verify ID is unique
                expect(logIds.has(log.id)).toBe(false);
                logIds.add(log.id);
            }), { numRuns: 30 });
        });
        it('should retrieve all logged events for a visit', async () => {
            await fc.assert(fc.asyncProperty(fc.integer({ min: 1, max: 10 }), async (numEvents) => {
                mockPrisma.reset();
                const spaceId = `space-${Date.now()}`;
                createTestSpace(spaceId);
                // Start visit
                const visit = await visitService.startVisit({
                    spaceId,
                    deviceId: 'device-1',
                    language: 'ko',
                    mode: 'vr',
                });
                // Log multiple events
                const eventTypes = ['object_click', 'trigger_enter', 'trigger_exit', 'mode_switch'];
                for (let i = 0; i < numEvents; i++) {
                    await visitService.logEvent(visit.id, {
                        eventType: eventTypes[i % eventTypes.length],
                        referenceId: `ref-${i}`,
                    });
                }
                // Retrieve logs
                const logs = await visitService.getVisitLogs(visit.id);
                // Verify all events are retrieved
                expect(logs.length).toBe(numEvents);
            }), { numRuns: 20 });
        });
    });
});
//# sourceMappingURL=visit.property.test.js.map