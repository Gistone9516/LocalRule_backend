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
const trigger_service_1 = require("../../src/services/trigger.service");
const generators_1 = require("../helpers/generators");
/**
 * Trigger Module Property Tests
 *
 * These tests validate the correctness properties defined in the design document
 * for the Trigger module (Requirements 6.1 - 6.6).
 */
// Mock PrismaClient for testing
const createMockPrisma = () => {
    const spaces = new Map();
    const admins = new Map();
    const triggers = new Map();
    const translations = new Map();
    let triggerIdCounter = 0;
    return {
        spaces,
        admins,
        triggers,
        translations,
        space: {
            findUnique: jest.fn(({ where }) => {
                const space = spaces.get(where.id);
                return Promise.resolve(space || null);
            }),
        },
        triggerZone: {
            findUnique: jest.fn(({ where, include }) => {
                const trigger = triggers.get(where.id);
                if (!trigger)
                    return Promise.resolve(null);
                const result = { ...trigger };
                if (include?.translations) {
                    result.translations = Array.from(translations.values()).filter((t) => t.triggerId === trigger.id);
                }
                if (include?.space) {
                    result.space = spaces.get(trigger.spaceId);
                }
                return Promise.resolve(result);
            }),
            findMany: jest.fn(({ where, include, orderBy }) => {
                let result = Array.from(triggers.values()).filter((t) => {
                    if (where.spaceId && t.spaceId !== where.spaceId)
                        return false;
                    return true;
                });
                // Sort by createdAt
                if (orderBy?.createdAt) {
                    result.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
                }
                // Add includes
                result = result.map((trigger) => {
                    const t = { ...trigger };
                    if (include?.translations) {
                        if (include.translations.where?.language) {
                            t.translations = Array.from(translations.values()).filter((tr) => tr.triggerId === trigger.id && tr.language === include.translations.where.language);
                        }
                        else {
                            t.translations = Array.from(translations.values()).filter((tr) => tr.triggerId === trigger.id);
                        }
                    }
                    return t;
                });
                return Promise.resolve(result);
            }),
            count: jest.fn(({ where }) => {
                let count = 0;
                for (const t of triggers.values()) {
                    if (where.spaceId && t.spaceId !== where.spaceId)
                        continue;
                    count++;
                }
                return Promise.resolve(count);
            }),
            create: jest.fn(({ data, include }) => {
                const id = `trigger-${++triggerIdCounter}`;
                const trigger = {
                    id,
                    ...data,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };
                triggers.set(id, trigger);
                const result = { ...trigger };
                if (include?.translations) {
                    result.translations = [];
                }
                return Promise.resolve(result);
            }),
            update: jest.fn(({ where, data, include }) => {
                const trigger = triggers.get(where.id);
                if (!trigger)
                    return Promise.resolve(null);
                const updated = { ...trigger, ...data, updatedAt: new Date() };
                triggers.set(where.id, updated);
                const result = { ...updated };
                if (include?.translations) {
                    result.translations = Array.from(translations.values()).filter((t) => t.triggerId === where.id);
                }
                return Promise.resolve(result);
            }),
            delete: jest.fn(({ where }) => {
                const trigger = triggers.get(where.id);
                triggers.delete(where.id);
                // Cascade delete translations
                for (const [transId, trans] of translations.entries()) {
                    if (trans.triggerId === where.id) {
                        translations.delete(transId);
                    }
                }
                return Promise.resolve(trigger);
            }),
        },
        triggerTranslation: {
            createMany: jest.fn(({ data }) => {
                for (const trans of data) {
                    const id = `trans-${Date.now()}-${Math.random()}`;
                    translations.set(id, { id, ...trans, createdAt: new Date(), updatedAt: new Date() });
                }
                return Promise.resolve({ count: data.length });
            }),
            deleteMany: jest.fn(({ where }) => {
                let count = 0;
                for (const [transId, trans] of translations.entries()) {
                    if (trans.triggerId === where.triggerId) {
                        translations.delete(transId);
                        count++;
                    }
                }
                return Promise.resolve({ count });
            }),
        },
        reset: () => {
            spaces.clear();
            admins.clear();
            triggers.clear();
            translations.clear();
            triggerIdCounter = 0;
        },
    };
};
describe('Trigger Property Tests', () => {
    let mockPrisma;
    let triggerService;
    beforeEach(() => {
        mockPrisma = createMockPrisma();
        triggerService = new trigger_service_1.TriggerService(mockPrisma);
    });
    afterEach(() => {
        mockPrisma.reset();
        jest.clearAllMocks();
    });
    // Helper to create test admin and space
    const setupTestData = (adminId, spaceId) => {
        mockPrisma.admins.set(adminId, {
            id: adminId,
            email: 'test@example.com',
            plan: 'enterprise',
        });
        mockPrisma.spaces.set(spaceId, {
            id: spaceId,
            adminId,
            name: 'Test Space',
            deletedAt: null,
        });
    };
    /**
     * **Feature: backend-api, Property 24: Trigger creation stores all data**
     * **Validates: Requirements 6.1**
     *
     * For any valid trigger data (position, radius, type, message),
     * creating a trigger should store all provided data and return the created trigger.
     */
    describe('Property 24: Trigger creation stores all data', () => {
        it('should create trigger with all provided data', async () => {
            const adminId = 'test-admin-1';
            const spaceId = 'test-space-1';
            setupTestData(adminId, spaceId);
            await fc.assert(fc.asyncProperty(generators_1.validTriggerArb, async (triggerData) => {
                // Reset triggers for each iteration
                mockPrisma.triggers.clear();
                const result = await triggerService.create(spaceId, adminId, {
                    position: triggerData.position,
                    radius: triggerData.radius,
                    triggerType: triggerData.triggerType,
                    message: triggerData.message,
                    autoCloseSeconds: triggerData.autoCloseSeconds,
                    vibrationPattern: triggerData.vibrationPattern,
                    soundEffect: triggerData.soundEffect,
                });
                // Verify all data is stored correctly
                expect(result.position.x).toBe(triggerData.position.x);
                expect(result.position.y).toBe(triggerData.position.y);
                expect(result.position.z).toBe(triggerData.position.z);
                expect(result.radius).toBe(triggerData.radius);
                expect(result.triggerType).toBe(triggerData.triggerType);
                expect(result.message).toBe(triggerData.message);
                expect(result.spaceId).toBe(spaceId);
                expect(result.id).toBeDefined();
                expect(result.isActive).toBe(true);
            }), { numRuns: 50 });
        });
        it('should assign unique IDs to each created trigger', async () => {
            const adminId = 'test-admin-2';
            const spaceId = 'test-space-2';
            setupTestData(adminId, spaceId);
            const createdIds = new Set();
            await fc.assert(fc.asyncProperty(generators_1.validTriggerArb, async (triggerData) => {
                const result = await triggerService.create(spaceId, adminId, {
                    position: triggerData.position,
                    radius: triggerData.radius,
                    triggerType: triggerData.triggerType,
                    message: triggerData.message,
                });
                expect(createdIds.has(result.id)).toBe(false);
                createdIds.add(result.id);
            }), { numRuns: 20 } // Limited to stay within trigger limit
            );
        });
        it('should use default values when optional fields not provided', async () => {
            const adminId = 'test-admin-3';
            const spaceId = 'test-space-3';
            setupTestData(adminId, spaceId);
            await fc.assert(fc.asyncProperty(fc.record({
                position: fc.record({
                    x: fc.integer({ min: 0, max: 50 }),
                    y: fc.integer({ min: 0, max: 50 }),
                    z: fc.integer({ min: 0, max: 10 }),
                }),
                radius: generators_1.validRadiusArb,
                triggerType: fc.constantFrom('warning', 'caution', 'info'),
                message: fc.string({ minLength: 1, maxLength: 100 }),
            }), async (triggerData) => {
                mockPrisma.triggers.clear();
                const result = await triggerService.create(spaceId, adminId, {
                    position: triggerData.position,
                    radius: triggerData.radius,
                    triggerType: triggerData.triggerType,
                    message: triggerData.message,
                    // Optional fields not provided
                });
                expect(result.vibrationPattern).toBe('none');
                expect(result.soundEffect).toBe('none');
                expect(result.isActive).toBe(true);
                expect(result.autoCloseSeconds).toBeNull();
            }), { numRuns: 20 });
        });
    });
    /**
     * **Feature: backend-api, Property 25: Trigger list returns all triggers**
     * **Validates: Requirements 6.2**
     *
     * For any space with triggers, requesting the trigger list
     * should return all active triggers for that space.
     */
    describe('Property 25: Trigger list returns all triggers', () => {
        it('should return all created triggers in the list', async () => {
            const adminId = 'test-admin-4';
            const spaceId = 'test-space-4';
            setupTestData(adminId, spaceId);
            await fc.assert(fc.asyncProperty(fc.array(generators_1.validTriggerArb, { minLength: 1, maxLength: 20 }), async (triggersData) => {
                mockPrisma.triggers.clear();
                // Create all triggers
                const createdTriggers = [];
                for (const triggerData of triggersData) {
                    const trigger = await triggerService.create(spaceId, adminId, {
                        position: triggerData.position,
                        radius: triggerData.radius,
                        triggerType: triggerData.triggerType,
                        message: triggerData.message,
                    });
                    createdTriggers.push(trigger);
                }
                // Get the list
                const result = await triggerService.findBySpaceId(spaceId, adminId);
                // Verify all created triggers are in the list
                expect(result.length).toBe(createdTriggers.length);
                for (const created of createdTriggers) {
                    const found = result.find((t) => t.id === created.id);
                    expect(found).toBeDefined();
                    expect(found?.message).toBe(created.message);
                }
            }), { numRuns: 20 });
        });
        it('should only return triggers for the specified space', async () => {
            const adminId = 'test-admin-5';
            const spaceId1 = 'test-space-5a';
            const spaceId2 = 'test-space-5b';
            setupTestData(adminId, spaceId1);
            mockPrisma.spaces.set(spaceId2, {
                id: spaceId2,
                adminId,
                name: 'Test Space 2',
                deletedAt: null,
            });
            await fc.assert(fc.asyncProperty(generators_1.validTriggerArb, generators_1.validTriggerArb, async (triggerData1, triggerData2) => {
                mockPrisma.triggers.clear();
                // Create trigger in space 1
                const trigger1 = await triggerService.create(spaceId1, adminId, {
                    position: triggerData1.position,
                    radius: triggerData1.radius,
                    triggerType: triggerData1.triggerType,
                    message: triggerData1.message,
                });
                // Create trigger in space 2
                await triggerService.create(spaceId2, adminId, {
                    position: triggerData2.position,
                    radius: triggerData2.radius,
                    triggerType: triggerData2.triggerType,
                    message: triggerData2.message,
                });
                // Get triggers for space 1
                const result = await triggerService.findBySpaceId(spaceId1, adminId);
                // Should only contain trigger from space 1
                expect(result.length).toBe(1);
                expect(result[0].id).toBe(trigger1.id);
            }), { numRuns: 20 });
        });
    });
    /**
     * **Feature: backend-api, Property 26: Trigger update persists changes**
     * **Validates: Requirements 6.3**
     *
     * For any existing trigger and valid update data,
     * updating the trigger should persist the changes.
     */
    describe('Property 26: Trigger update persists changes', () => {
        it('should persist all updated fields', async () => {
            const adminId = 'test-admin-6';
            const spaceId = 'test-space-6';
            setupTestData(adminId, spaceId);
            await fc.assert(fc.asyncProperty(generators_1.validTriggerArb, fc.record({
                position: fc.option(fc.record({
                    x: fc.integer({ min: 0, max: 50 }),
                    y: fc.integer({ min: 0, max: 50 }),
                    z: fc.integer({ min: 0, max: 10 }),
                }), { nil: undefined }),
                radius: fc.option(generators_1.validRadiusArb, { nil: undefined }),
                triggerType: fc.option(fc.constantFrom('warning', 'caution', 'info'), { nil: undefined }),
                message: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
                isActive: fc.option(fc.boolean(), { nil: undefined }),
            }), async (initialData, updateData) => {
                mockPrisma.triggers.clear();
                // Create initial trigger
                const created = await triggerService.create(spaceId, adminId, {
                    position: initialData.position,
                    radius: initialData.radius,
                    triggerType: initialData.triggerType,
                    message: initialData.message,
                });
                // Update the trigger
                const updated = await triggerService.update(created.id, adminId, {
                    position: updateData.position,
                    radius: updateData.radius,
                    triggerType: updateData.triggerType,
                    message: updateData.message,
                    isActive: updateData.isActive,
                });
                // Verify updated fields
                if (updateData.position !== undefined) {
                    expect(updated.position.x).toBe(updateData.position.x);
                    expect(updated.position.y).toBe(updateData.position.y);
                    expect(updated.position.z).toBe(updateData.position.z);
                }
                else {
                    expect(updated.position.x).toBe(initialData.position.x);
                    expect(updated.position.y).toBe(initialData.position.y);
                    expect(updated.position.z).toBe(initialData.position.z);
                }
                if (updateData.radius !== undefined) {
                    expect(updated.radius).toBe(updateData.radius);
                }
                else {
                    expect(updated.radius).toBe(initialData.radius);
                }
                if (updateData.triggerType !== undefined) {
                    expect(updated.triggerType).toBe(updateData.triggerType);
                }
                else {
                    expect(updated.triggerType).toBe(initialData.triggerType);
                }
                if (updateData.message !== undefined) {
                    expect(updated.message).toBe(updateData.message);
                }
                else {
                    expect(updated.message).toBe(initialData.message);
                }
                if (updateData.isActive !== undefined) {
                    expect(updated.isActive).toBe(updateData.isActive);
                }
                // Verify retrieval returns updated values
                const retrieved = await triggerService.findById(created.id, adminId);
                expect(retrieved.position.x).toBe(updated.position.x);
                expect(retrieved.message).toBe(updated.message);
            }), { numRuns: 30 });
        });
        it('should preserve unchanged fields', async () => {
            const adminId = 'test-admin-7';
            const spaceId = 'test-space-7';
            setupTestData(adminId, spaceId);
            await fc.assert(fc.asyncProperty(generators_1.validTriggerArb, async (initialData) => {
                mockPrisma.triggers.clear();
                // Create initial trigger
                const created = await triggerService.create(spaceId, adminId, {
                    position: initialData.position,
                    radius: initialData.radius,
                    triggerType: initialData.triggerType,
                    message: initialData.message,
                });
                // Update only message
                const updated = await triggerService.update(created.id, adminId, {
                    message: 'New Message',
                });
                // Verify other fields are preserved
                expect(updated.message).toBe('New Message');
                expect(updated.position.x).toBe(initialData.position.x);
                expect(updated.position.y).toBe(initialData.position.y);
                expect(updated.position.z).toBe(initialData.position.z);
                expect(updated.radius).toBe(initialData.radius);
                expect(updated.triggerType).toBe(initialData.triggerType);
                expect(updated.spaceId).toBe(created.spaceId);
            }), { numRuns: 20 });
        });
    });
    /**
     * **Feature: backend-api, Property 27: Trigger deletion cascades to translations**
     * **Validates: Requirements 6.4**
     *
     * For any trigger with translations, deleting the trigger
     * should also delete all associated translations.
     */
    describe('Property 27: Trigger deletion cascades to translations', () => {
        it('should delete associated translations when trigger is deleted', async () => {
            const adminId = 'test-admin-8';
            const spaceId = 'test-space-8';
            setupTestData(adminId, spaceId);
            await fc.assert(fc.asyncProperty(generators_1.validTriggerArb, fc.uniqueArray(fc.constantFrom('en', 'ja', 'zh'), { minLength: 1, maxLength: 3 }), async (triggerData, languages) => {
                mockPrisma.triggers.clear();
                mockPrisma.translations.clear();
                // Create trigger
                const trigger = await triggerService.create(spaceId, adminId, {
                    position: triggerData.position,
                    radius: triggerData.radius,
                    triggerType: triggerData.triggerType,
                    message: triggerData.message,
                });
                // Add translations manually
                for (const lang of languages) {
                    const transId = `trans-${Date.now()}-${lang}`;
                    mockPrisma.translations.set(transId, {
                        id: transId,
                        triggerId: trigger.id,
                        language: lang,
                        message: `${triggerData.message} [${lang}]`,
                        isAutoTranslated: true,
                    });
                }
                // Verify translations exist
                const transBefore = Array.from(mockPrisma.translations.values()).filter((t) => t.triggerId === trigger.id);
                expect(transBefore.length).toBe(languages.length);
                // Delete trigger
                await triggerService.delete(trigger.id, adminId);
                // Verify trigger is deleted
                expect(mockPrisma.triggers.get(trigger.id)).toBeUndefined();
                // Verify translations are cascade deleted
                const transAfter = Array.from(mockPrisma.translations.values()).filter((t) => t.triggerId === trigger.id);
                expect(transAfter.length).toBe(0);
            }), { numRuns: 20 });
        });
        it('should not affect translations of other triggers', async () => {
            const adminId = 'test-admin-9';
            const spaceId = 'test-space-9';
            setupTestData(adminId, spaceId);
            await fc.assert(fc.asyncProperty(generators_1.validTriggerArb, generators_1.validTriggerArb, async (triggerData1, triggerData2) => {
                mockPrisma.triggers.clear();
                mockPrisma.translations.clear();
                // Create two triggers
                const trigger1 = await triggerService.create(spaceId, adminId, {
                    position: triggerData1.position,
                    radius: triggerData1.radius,
                    triggerType: triggerData1.triggerType,
                    message: triggerData1.message,
                });
                const trigger2 = await triggerService.create(spaceId, adminId, {
                    position: triggerData2.position,
                    radius: triggerData2.radius,
                    triggerType: triggerData2.triggerType,
                    message: triggerData2.message,
                });
                // Add translations to both triggers
                mockPrisma.translations.set('trans-1', {
                    id: 'trans-1',
                    triggerId: trigger1.id,
                    language: 'en',
                    message: 'Trigger 1 EN',
                });
                mockPrisma.translations.set('trans-2', {
                    id: 'trans-2',
                    triggerId: trigger2.id,
                    language: 'en',
                    message: 'Trigger 2 EN',
                });
                // Delete first trigger
                await triggerService.delete(trigger1.id, adminId);
                // Verify trigger2's translations still exist
                const trigger2Trans = Array.from(mockPrisma.translations.values()).filter((t) => t.triggerId === trigger2.id);
                expect(trigger2Trans.length).toBe(1);
                expect(trigger2Trans[0].message).toBe('Trigger 2 EN');
            }), { numRuns: 20 });
        });
    });
    /**
     * **Feature: backend-api, Property 28: Trigger limit per space enforced**
     * **Validates: Requirements 6.5**
     *
     * For any space that already has 20 triggers, attempting to create
     * another trigger should return TRIGGER_LIMIT_EXCEEDED error.
     */
    describe('Property 28: Trigger limit per space enforced', () => {
        it('should enforce limit of 20 triggers per space', async () => {
            const adminId = 'test-admin-10';
            const spaceId = 'test-space-10';
            setupTestData(adminId, spaceId);
            // Pre-populate with 20 triggers
            for (let i = 0; i < 20; i++) {
                mockPrisma.triggers.set(`pre-trigger-${i}`, {
                    id: `pre-trigger-${i}`,
                    spaceId,
                    positionX: i,
                    positionY: i,
                    positionZ: 0,
                    radius: 1.0,
                    triggerType: 'info',
                    message: `Trigger ${i}`,
                    autoCloseSeconds: null,
                    vibrationPattern: 'none',
                    soundEffect: 'none',
                    isActive: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
            }
            await fc.assert(fc.asyncProperty(generators_1.validTriggerArb, async (triggerData) => {
                // Try to create 21st trigger - should fail
                await expect(triggerService.create(spaceId, adminId, {
                    position: triggerData.position,
                    radius: triggerData.radius,
                    triggerType: triggerData.triggerType,
                    message: triggerData.message,
                })).rejects.toThrow(/Trigger limit exceeded/);
            }), { numRuns: 10 });
        });
        it('should allow creating triggers up to the limit', async () => {
            const adminId = 'test-admin-11';
            const spaceId = 'test-space-11';
            setupTestData(adminId, spaceId);
            // Pre-populate with 19 triggers
            for (let i = 0; i < 19; i++) {
                mockPrisma.triggers.set(`pre-trigger-${i}`, {
                    id: `pre-trigger-${i}`,
                    spaceId,
                    positionX: i,
                    positionY: i,
                    positionZ: 0,
                    radius: 1.0,
                    triggerType: 'info',
                    message: `Trigger ${i}`,
                    autoCloseSeconds: null,
                    vibrationPattern: 'none',
                    soundEffect: 'none',
                    isActive: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
            }
            await fc.assert(fc.asyncProperty(generators_1.validTriggerArb, async (triggerData) => {
                // 20th trigger should succeed
                const result = await triggerService.create(spaceId, adminId, {
                    position: triggerData.position,
                    radius: triggerData.radius,
                    triggerType: triggerData.triggerType,
                    message: triggerData.message,
                });
                expect(result.id).toBeDefined();
                // Reset to 19 for next iteration
                mockPrisma.triggers.delete(result.id);
            }), { numRuns: 10 });
        });
        it('should allow creating after deleting (within limit)', async () => {
            const adminId = 'test-admin-12';
            const spaceId = 'test-space-12';
            setupTestData(adminId, spaceId);
            // Pre-populate with 20 triggers
            for (let i = 0; i < 20; i++) {
                mockPrisma.triggers.set(`pre-trigger-${i}`, {
                    id: `pre-trigger-${i}`,
                    spaceId,
                    positionX: i,
                    positionY: i,
                    positionZ: 0,
                    radius: 1.0,
                    triggerType: 'info',
                    message: `Trigger ${i}`,
                    autoCloseSeconds: null,
                    vibrationPattern: 'none',
                    soundEffect: 'none',
                    isActive: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
            }
            await fc.assert(fc.asyncProperty(generators_1.validTriggerArb, async (triggerData) => {
                // Delete one trigger
                await triggerService.delete('pre-trigger-0', adminId);
                // Now creating should succeed
                const result = await triggerService.create(spaceId, adminId, {
                    position: triggerData.position,
                    radius: triggerData.radius,
                    triggerType: triggerData.triggerType,
                    message: triggerData.message,
                });
                expect(result.id).toBeDefined();
                // Restore for next iteration
                mockPrisma.triggers.delete(result.id);
                mockPrisma.triggers.set('pre-trigger-0', {
                    id: 'pre-trigger-0',
                    spaceId,
                    positionX: 0,
                    positionY: 0,
                    positionZ: 0,
                    radius: 1.0,
                    triggerType: 'info',
                    message: 'Trigger 0',
                    autoCloseSeconds: null,
                    vibrationPattern: 'none',
                    soundEffect: 'none',
                    isActive: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
            }), { numRuns: 10 });
        });
    });
    /**
     * **Feature: backend-api, Property 29: Trigger radius validated**
     * **Validates: Requirements 6.6**
     *
     * For any trigger creation or update with radius less than 0.5m
     * or greater than 3.0m, the operation should return INVALID_RADIUS error.
     */
    describe('Property 29: Trigger radius validated', () => {
        it('should reject radius less than 0.5m', async () => {
            const adminId = 'test-admin-13';
            const spaceId = 'test-space-13';
            setupTestData(adminId, spaceId);
            await fc.assert(fc.asyncProperty(fc.record({
                position: fc.record({
                    x: fc.integer({ min: 0, max: 50 }),
                    y: fc.integer({ min: 0, max: 50 }),
                    z: fc.integer({ min: 0, max: 10 }),
                }),
                radius: fc.integer({ min: 0, max: 4 }).map(n => n / 10), // 0.0 to 0.4
                triggerType: fc.constantFrom('warning', 'caution', 'info'),
                message: fc.string({ minLength: 1, maxLength: 100 }),
            }), async (triggerData) => {
                mockPrisma.triggers.clear();
                await expect(triggerService.create(spaceId, adminId, {
                    position: triggerData.position,
                    radius: triggerData.radius,
                    triggerType: triggerData.triggerType,
                    message: triggerData.message,
                })).rejects.toThrow(/Radius must be between/);
            }), { numRuns: 20 });
        });
        it('should reject radius greater than 3.0m', async () => {
            const adminId = 'test-admin-14';
            const spaceId = 'test-space-14';
            setupTestData(adminId, spaceId);
            await fc.assert(fc.asyncProperty(fc.record({
                position: fc.record({
                    x: fc.integer({ min: 0, max: 50 }),
                    y: fc.integer({ min: 0, max: 50 }),
                    z: fc.integer({ min: 0, max: 10 }),
                }),
                radius: fc.integer({ min: 31, max: 100 }).map(n => n / 10), // 3.1 to 10.0
                triggerType: fc.constantFrom('warning', 'caution', 'info'),
                message: fc.string({ minLength: 1, maxLength: 100 }),
            }), async (triggerData) => {
                mockPrisma.triggers.clear();
                await expect(triggerService.create(spaceId, adminId, {
                    position: triggerData.position,
                    radius: triggerData.radius,
                    triggerType: triggerData.triggerType,
                    message: triggerData.message,
                })).rejects.toThrow(/Radius must be between/);
            }), { numRuns: 20 });
        });
        it('should accept valid radius between 0.5m and 3.0m', async () => {
            const adminId = 'test-admin-15';
            const spaceId = 'test-space-15';
            setupTestData(adminId, spaceId);
            await fc.assert(fc.asyncProperty(fc.record({
                position: fc.record({
                    x: fc.integer({ min: 0, max: 50 }),
                    y: fc.integer({ min: 0, max: 50 }),
                    z: fc.integer({ min: 0, max: 10 }),
                }),
                radius: generators_1.validRadiusArb,
                triggerType: fc.constantFrom('warning', 'caution', 'info'),
                message: fc.string({ minLength: 1, maxLength: 100 }),
            }), async (triggerData) => {
                mockPrisma.triggers.clear();
                const result = await triggerService.create(spaceId, adminId, {
                    position: triggerData.position,
                    radius: triggerData.radius,
                    triggerType: triggerData.triggerType,
                    message: triggerData.message,
                });
                expect(result.radius).toBe(triggerData.radius);
                expect(result.radius).toBeGreaterThanOrEqual(0.5);
                expect(result.radius).toBeLessThanOrEqual(3.0);
            }), { numRuns: 30 });
        });
        it('should reject invalid radius on update', async () => {
            const adminId = 'test-admin-16';
            const spaceId = 'test-space-16';
            setupTestData(adminId, spaceId);
            await fc.assert(fc.asyncProperty(generators_1.validTriggerArb, generators_1.invalidRadiusArb, async (initialData, invalidRadius) => {
                mockPrisma.triggers.clear();
                // Create valid trigger
                const created = await triggerService.create(spaceId, adminId, {
                    position: initialData.position,
                    radius: initialData.radius,
                    triggerType: initialData.triggerType,
                    message: initialData.message,
                });
                // Try to update with invalid radius
                await expect(triggerService.update(created.id, adminId, {
                    radius: invalidRadius,
                })).rejects.toThrow(/Radius must be between/);
            }), { numRuns: 20 });
        });
    });
});
//# sourceMappingURL=trigger.property.test.js.map