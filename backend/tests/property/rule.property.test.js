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
const rule_service_1 = require("../../src/services/rule.service");
const generators_1 = require("../helpers/generators");
/**
 * Rule Module Property Tests
 *
 * These tests validate the correctness properties defined in the design document
 * for the Rule module (Requirements 5.1 - 5.7).
 */
// Mock PrismaClient for testing
const createMockPrisma = () => {
    const spaces = new Map();
    const admins = new Map();
    const objects = new Map();
    const rules = new Map();
    const translations = new Map();
    const images = new Map();
    let ruleIdCounter = 0;
    return {
        spaces,
        admins,
        objects,
        rules,
        translations,
        images,
        spaceObject: {
            findUnique: jest.fn(({ where, include }) => {
                const obj = objects.get(where.id);
                if (!obj)
                    return Promise.resolve(null);
                const result = { ...obj };
                if (include?.space) {
                    result.space = spaces.get(obj.spaceId);
                }
                return Promise.resolve(result);
            }),
        },
        localRule: {
            findUnique: jest.fn(({ where, include }) => {
                const rule = rules.get(where.id);
                if (!rule)
                    return Promise.resolve(null);
                const result = { ...rule };
                if (include?.translations) {
                    result.translations = Array.from(translations.values()).filter((t) => t.ruleId === rule.id);
                }
                if (include?.image) {
                    result.image = Array.from(images.values()).find((i) => i.ruleId === rule.id) || null;
                }
                if (include?.object) {
                    const obj = objects.get(rule.objectId);
                    if (obj && include.object.include?.space) {
                        result.object = { ...obj, space: spaces.get(obj.spaceId) };
                    }
                    else {
                        result.object = obj;
                    }
                }
                return Promise.resolve(result);
            }),
            findMany: jest.fn(({ where, include, orderBy }) => {
                let result = Array.from(rules.values()).filter((r) => {
                    if (where.objectId && r.objectId !== where.objectId)
                        return false;
                    return true;
                });
                // Sort by priority then displayOrder
                if (orderBy) {
                    result.sort((a, b) => {
                        if (a.priority !== b.priority)
                            return a.priority - b.priority;
                        return a.displayOrder - b.displayOrder;
                    });
                }
                // Add includes
                result = result.map((rule) => {
                    const r = { ...rule };
                    if (include?.translations) {
                        if (include.translations.where?.language) {
                            r.translations = Array.from(translations.values()).filter((t) => t.ruleId === rule.id && t.language === include.translations.where.language);
                        }
                        else {
                            r.translations = Array.from(translations.values()).filter((t) => t.ruleId === rule.id);
                        }
                    }
                    if (include?.image) {
                        r.image = Array.from(images.values()).find((i) => i.ruleId === rule.id) || null;
                    }
                    return r;
                });
                return Promise.resolve(result);
            }),
            count: jest.fn(({ where }) => {
                let count = 0;
                for (const r of rules.values()) {
                    if (where.objectId && r.objectId !== where.objectId)
                        continue;
                    count++;
                }
                return Promise.resolve(count);
            }),
            aggregate: jest.fn(({ where }) => {
                let maxOrder = -1;
                for (const r of rules.values()) {
                    if (where.objectId && r.objectId !== where.objectId)
                        continue;
                    if (r.displayOrder > maxOrder)
                        maxOrder = r.displayOrder;
                }
                return Promise.resolve({ _max: { displayOrder: maxOrder === -1 ? null : maxOrder } });
            }),
            create: jest.fn(({ data, include }) => {
                const id = `rule-${++ruleIdCounter}`;
                const rule = {
                    id,
                    ...data,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };
                rules.set(id, rule);
                const result = { ...rule };
                if (include?.translations) {
                    result.translations = [];
                }
                if (include?.image) {
                    result.image = null;
                }
                return Promise.resolve(result);
            }),
            update: jest.fn(({ where, data, include }) => {
                const rule = rules.get(where.id);
                if (!rule)
                    return Promise.resolve(null);
                const updated = { ...rule, ...data, updatedAt: new Date() };
                rules.set(where.id, updated);
                const result = { ...updated };
                if (include?.translations) {
                    result.translations = Array.from(translations.values()).filter((t) => t.ruleId === where.id);
                }
                if (include?.image) {
                    result.image = Array.from(images.values()).find((i) => i.ruleId === where.id) || null;
                }
                return Promise.resolve(result);
            }),
            delete: jest.fn(({ where }) => {
                const rule = rules.get(where.id);
                rules.delete(where.id);
                // Cascade delete translations
                for (const [transId, trans] of translations.entries()) {
                    if (trans.ruleId === where.id) {
                        translations.delete(transId);
                    }
                }
                // Cascade delete images
                for (const [imgId, img] of images.entries()) {
                    if (img.ruleId === where.id) {
                        images.delete(imgId);
                    }
                }
                return Promise.resolve(rule);
            }),
        },
        ruleTranslation: {
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
                    if (trans.ruleId === where.ruleId) {
                        translations.delete(transId);
                        count++;
                    }
                }
                return Promise.resolve({ count });
            }),
        },
        ruleImage: {
            findUnique: jest.fn(({ where }) => {
                return Promise.resolve(Array.from(images.values()).find((i) => i.ruleId === where.ruleId) || null);
            }),
            delete: jest.fn(({ where }) => {
                for (const [imgId, img] of images.entries()) {
                    if (img.ruleId === where.ruleId) {
                        images.delete(imgId);
                        return Promise.resolve(img);
                    }
                }
                return Promise.resolve(null);
            }),
        },
        reset: () => {
            spaces.clear();
            admins.clear();
            objects.clear();
            rules.clear();
            translations.clear();
            images.clear();
            ruleIdCounter = 0;
        },
    };
};
describe('Rule Property Tests', () => {
    let mockPrisma;
    let ruleService;
    beforeEach(() => {
        mockPrisma = createMockPrisma();
        ruleService = new rule_service_1.RuleService(mockPrisma);
    });
    afterEach(() => {
        mockPrisma.reset();
        jest.clearAllMocks();
    });
    // Helper to create test admin, space, and object
    const setupTestData = (adminId, spaceId, objectId) => {
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
        mockPrisma.objects.set(objectId, {
            id: objectId,
            spaceId,
            objectTypeId: 'type-bed',
            customName: 'Test Object',
        });
    };
    /**
     * **Feature: backend-api, Property 18: Rule creation stores all data**
     * **Validates: Requirements 5.1**
     *
     * For any valid rule data (title, description, iconType, priority),
     * creating a rule should store all provided data and return the created rule.
     */
    describe('Property 18: Rule creation stores all data', () => {
        it('should create rule with all provided data', async () => {
            const adminId = 'test-admin-1';
            const spaceId = 'test-space-1';
            const objectId = 'test-object-1';
            setupTestData(adminId, spaceId, objectId);
            await fc.assert(fc.asyncProperty(generators_1.validRuleArb, async (ruleData) => {
                // Reset rules for each iteration to avoid hitting the limit
                mockPrisma.rules.clear();
                const result = await ruleService.create(objectId, adminId, {
                    title: ruleData.title,
                    description: ruleData.description,
                    iconType: ruleData.iconType,
                    priority: ruleData.priority,
                });
                // Verify all data is stored correctly
                expect(result.title).toBe(ruleData.title);
                expect(result.description).toBe(ruleData.description);
                expect(result.iconType).toBe(ruleData.iconType);
                expect(result.priority).toBe(ruleData.priority);
                expect(result.objectId).toBe(objectId);
                expect(result.id).toBeDefined();
                expect(result.isActive).toBe(true);
            }), { numRuns: 50 });
        });
        it('should assign unique IDs to each created rule', async () => {
            const adminId = 'test-admin-2';
            const spaceId = 'test-space-2';
            const objectId = 'test-object-2';
            setupTestData(adminId, spaceId, objectId);
            const createdIds = new Set();
            await fc.assert(fc.asyncProperty(generators_1.validRuleArb, async (ruleData) => {
                const result = await ruleService.create(objectId, adminId, {
                    title: ruleData.title,
                    description: ruleData.description,
                    iconType: ruleData.iconType,
                    priority: ruleData.priority,
                });
                expect(createdIds.has(result.id)).toBe(false);
                createdIds.add(result.id);
            }), { numRuns: 10 } // Limited to stay within rule limit
            );
        });
        it('should increment displayOrder for each new rule', async () => {
            const adminId = 'test-admin-3';
            const spaceId = 'test-space-3';
            const objectId = 'test-object-3';
            setupTestData(adminId, spaceId, objectId);
            let lastDisplayOrder = -1;
            await fc.assert(fc.asyncProperty(generators_1.validRuleArb, async (ruleData) => {
                const result = await ruleService.create(objectId, adminId, {
                    title: ruleData.title,
                    description: ruleData.description,
                    iconType: ruleData.iconType,
                    priority: ruleData.priority,
                });
                expect(result.displayOrder).toBeGreaterThan(lastDisplayOrder);
                lastDisplayOrder = result.displayOrder;
            }), { numRuns: 10 });
        });
        it('should use default priority of 5 when not provided', async () => {
            const adminId = 'test-admin-4';
            const spaceId = 'test-space-4';
            const objectId = 'test-object-4';
            setupTestData(adminId, spaceId, objectId);
            await fc.assert(fc.asyncProperty(fc.string({ minLength: 1, maxLength: 30 }), fc.string({ minLength: 1, maxLength: 200 }), fc.constantFrom('prohibited', 'warning', 'tip', 'info'), async (title, description, iconType) => {
                const result = await ruleService.create(objectId, adminId, {
                    title,
                    description,
                    iconType: iconType,
                    // priority not provided
                });
                expect(result.priority).toBe(5);
            }), { numRuns: 10 });
        });
    });
    /**
     * **Feature: backend-api, Property 19: Rules are sorted by priority**
     * **Validates: Requirements 5.3**
     *
     * For any object with multiple rules, requesting the rule list
     * should return rules sorted by priority (ascending) then by displayOrder.
     */
    describe('Property 19: Rules are sorted by priority', () => {
        it('should return rules sorted by priority then displayOrder', async () => {
            const adminId = 'test-admin-5';
            const spaceId = 'test-space-5';
            const objectId = 'test-object-5';
            setupTestData(adminId, spaceId, objectId);
            await fc.assert(fc.asyncProperty(fc.array(fc.record({
                title: fc.string({ minLength: 1, maxLength: 30 }),
                description: fc.string({ minLength: 1, maxLength: 200 }),
                iconType: fc.constantFrom('prohibited', 'warning', 'tip', 'info'),
                priority: fc.integer({ min: 1, max: 10 }),
            }), { minLength: 2, maxLength: 10 }), async (rulesData) => {
                // Reset rules for this test
                mockPrisma.rules.clear();
                // Create all rules
                for (const ruleData of rulesData) {
                    await ruleService.create(objectId, adminId, {
                        title: ruleData.title,
                        description: ruleData.description,
                        iconType: ruleData.iconType,
                        priority: ruleData.priority,
                    });
                }
                // Get the list
                const result = await ruleService.findByObjectId(objectId, adminId);
                // Verify sorted by priority then displayOrder
                for (let i = 1; i < result.length; i++) {
                    const prev = result[i - 1];
                    const curr = result[i];
                    if (prev.priority === curr.priority) {
                        expect(curr.displayOrder).toBeGreaterThanOrEqual(prev.displayOrder);
                    }
                    else {
                        expect(curr.priority).toBeGreaterThanOrEqual(prev.priority);
                    }
                }
            }), { numRuns: 20 });
        });
        it('should return all created rules in the list', async () => {
            const adminId = 'test-admin-6';
            const spaceId = 'test-space-6';
            const objectId = 'test-object-6';
            setupTestData(adminId, spaceId, objectId);
            await fc.assert(fc.asyncProperty(fc.array(generators_1.validRuleArb, { minLength: 1, maxLength: 10 }), async (rulesData) => {
                mockPrisma.rules.clear();
                // Create all rules
                const createdRules = [];
                for (const ruleData of rulesData) {
                    const rule = await ruleService.create(objectId, adminId, {
                        title: ruleData.title,
                        description: ruleData.description,
                        iconType: ruleData.iconType,
                        priority: ruleData.priority,
                    });
                    createdRules.push(rule);
                }
                // Get the list
                const result = await ruleService.findByObjectId(objectId, adminId);
                // Verify all created rules are in the list
                expect(result.length).toBe(createdRules.length);
                for (const created of createdRules) {
                    const found = result.find((r) => r.id === created.id);
                    expect(found).toBeDefined();
                    expect(found?.title).toBe(created.title);
                }
            }), { numRuns: 20 });
        });
    });
    /**
     * **Feature: backend-api, Property 20: Rule update persists changes**
     * **Validates: Requirements 5.4**
     *
     * For any existing rule and valid update data, updating the rule
     * should persist the changes and subsequent retrieval should return the updated values.
     */
    describe('Property 20: Rule update persists changes', () => {
        it('should persist all updated fields', async () => {
            const adminId = 'test-admin-7';
            const spaceId = 'test-space-7';
            const objectId = 'test-object-7';
            setupTestData(adminId, spaceId, objectId);
            await fc.assert(fc.asyncProperty(generators_1.validRuleArb, fc.record({
                title: fc.option(fc.string({ minLength: 1, maxLength: 30 }), { nil: undefined }),
                description: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined }),
                iconType: fc.option(fc.constantFrom('prohibited', 'warning', 'tip', 'info'), { nil: undefined }),
                priority: fc.option(fc.integer({ min: 1, max: 10 }), { nil: undefined }),
                isActive: fc.option(fc.boolean(), { nil: undefined }),
            }), async (initialData, updateData) => {
                mockPrisma.rules.clear();
                // Create initial rule
                const created = await ruleService.create(objectId, adminId, {
                    title: initialData.title,
                    description: initialData.description,
                    iconType: initialData.iconType,
                    priority: initialData.priority,
                });
                // Update the rule
                const updated = await ruleService.update(created.id, adminId, {
                    title: updateData.title,
                    description: updateData.description,
                    iconType: updateData.iconType,
                    priority: updateData.priority,
                    isActive: updateData.isActive,
                });
                // Verify updated fields
                if (updateData.title !== undefined) {
                    expect(updated.title).toBe(updateData.title);
                }
                else {
                    expect(updated.title).toBe(initialData.title);
                }
                if (updateData.description !== undefined) {
                    expect(updated.description).toBe(updateData.description);
                }
                else {
                    expect(updated.description).toBe(initialData.description);
                }
                if (updateData.iconType !== undefined) {
                    expect(updated.iconType).toBe(updateData.iconType);
                }
                else {
                    expect(updated.iconType).toBe(initialData.iconType);
                }
                if (updateData.priority !== undefined) {
                    expect(updated.priority).toBe(updateData.priority);
                }
                else {
                    expect(updated.priority).toBe(initialData.priority);
                }
                if (updateData.isActive !== undefined) {
                    expect(updated.isActive).toBe(updateData.isActive);
                }
                // Verify retrieval returns updated values
                const retrieved = await ruleService.findById(created.id, adminId);
                expect(retrieved.title).toBe(updated.title);
                expect(retrieved.description).toBe(updated.description);
                expect(retrieved.iconType).toBe(updated.iconType);
                expect(retrieved.priority).toBe(updated.priority);
            }), { numRuns: 30 });
        });
        it('should preserve unchanged fields', async () => {
            const adminId = 'test-admin-8';
            const spaceId = 'test-space-8';
            const objectId = 'test-object-8';
            setupTestData(adminId, spaceId, objectId);
            await fc.assert(fc.asyncProperty(generators_1.validRuleArb, async (initialData) => {
                mockPrisma.rules.clear();
                // Create initial rule
                const created = await ruleService.create(objectId, adminId, {
                    title: initialData.title,
                    description: initialData.description,
                    iconType: initialData.iconType,
                    priority: initialData.priority,
                });
                // Update only title
                const updated = await ruleService.update(created.id, adminId, {
                    title: 'New Title',
                });
                // Verify other fields are preserved
                expect(updated.title).toBe('New Title');
                expect(updated.description).toBe(initialData.description);
                expect(updated.iconType).toBe(initialData.iconType);
                expect(updated.priority).toBe(initialData.priority);
                expect(updated.objectId).toBe(created.objectId);
            }), { numRuns: 20 });
        });
    });
    /**
     * **Feature: backend-api, Property 21: Rule deletion cascades to translations**
     * **Validates: Requirements 5.5**
     *
     * For any rule with translations and images, deleting the rule
     * should also delete all associated translations and images.
     */
    describe('Property 21: Rule deletion cascades to translations', () => {
        it('should delete associated translations when rule is deleted', async () => {
            const adminId = 'test-admin-9';
            const spaceId = 'test-space-9';
            const objectId = 'test-object-9';
            setupTestData(adminId, spaceId, objectId);
            await fc.assert(fc.asyncProperty(generators_1.validRuleArb, 
            // Use uniqueArray to avoid duplicate languages
            fc.uniqueArray(fc.constantFrom('en', 'ja', 'zh'), { minLength: 1, maxLength: 3 }), async (ruleData, languages) => {
                mockPrisma.rules.clear();
                mockPrisma.translations.clear();
                // Create rule
                const rule = await ruleService.create(objectId, adminId, {
                    title: ruleData.title,
                    description: ruleData.description,
                    iconType: ruleData.iconType,
                    priority: ruleData.priority,
                });
                // Add translations manually
                for (const lang of languages) {
                    const transId = `trans-${Date.now()}-${lang}`;
                    mockPrisma.translations.set(transId, {
                        id: transId,
                        ruleId: rule.id,
                        language: lang,
                        title: `${ruleData.title} [${lang}]`,
                        description: `${ruleData.description} [${lang}]`,
                        isAutoTranslated: true,
                    });
                }
                // Verify translations exist
                const transBefore = Array.from(mockPrisma.translations.values()).filter((t) => t.ruleId === rule.id);
                expect(transBefore.length).toBe(languages.length);
                // Delete rule
                await ruleService.delete(rule.id, adminId);
                // Verify rule is deleted
                expect(mockPrisma.rules.get(rule.id)).toBeUndefined();
                // Verify translations are cascade deleted
                const transAfter = Array.from(mockPrisma.translations.values()).filter((t) => t.ruleId === rule.id);
                expect(transAfter.length).toBe(0);
            }), { numRuns: 20 });
        });
        it('should delete associated image when rule is deleted', async () => {
            const adminId = 'test-admin-10';
            const spaceId = 'test-space-10';
            const objectId = 'test-object-10';
            setupTestData(adminId, spaceId, objectId);
            await fc.assert(fc.asyncProperty(generators_1.validRuleArb, async (ruleData) => {
                mockPrisma.rules.clear();
                mockPrisma.images.clear();
                // Create rule
                const rule = await ruleService.create(objectId, adminId, {
                    title: ruleData.title,
                    description: ruleData.description,
                    iconType: ruleData.iconType,
                    priority: ruleData.priority,
                });
                // Add image manually
                const imageId = `image-${Date.now()}`;
                mockPrisma.images.set(imageId, {
                    id: imageId,
                    ruleId: rule.id,
                    imageUrl: 'https://example.com/image.jpg',
                    altText: 'Test image',
                    fileSize: 1024,
                });
                // Verify image exists
                const imageBefore = Array.from(mockPrisma.images.values()).find((i) => i.ruleId === rule.id);
                expect(imageBefore).toBeDefined();
                // Delete rule
                await ruleService.delete(rule.id, adminId);
                // Verify image is cascade deleted
                const imageAfter = Array.from(mockPrisma.images.values()).find((i) => i.ruleId === rule.id);
                expect(imageAfter).toBeUndefined();
            }), { numRuns: 20 });
        });
        it('should not affect translations of other rules', async () => {
            const adminId = 'test-admin-11';
            const spaceId = 'test-space-11';
            const objectId = 'test-object-11';
            setupTestData(adminId, spaceId, objectId);
            await fc.assert(fc.asyncProperty(generators_1.validRuleArb, generators_1.validRuleArb, async (ruleData1, ruleData2) => {
                mockPrisma.rules.clear();
                mockPrisma.translations.clear();
                // Create two rules
                const rule1 = await ruleService.create(objectId, adminId, {
                    title: ruleData1.title,
                    description: ruleData1.description,
                    iconType: ruleData1.iconType,
                    priority: ruleData1.priority,
                });
                const rule2 = await ruleService.create(objectId, adminId, {
                    title: ruleData2.title,
                    description: ruleData2.description,
                    iconType: ruleData2.iconType,
                    priority: ruleData2.priority,
                });
                // Add translations to both rules
                mockPrisma.translations.set('trans-1', {
                    id: 'trans-1',
                    ruleId: rule1.id,
                    language: 'en',
                    title: 'Rule 1 EN',
                });
                mockPrisma.translations.set('trans-2', {
                    id: 'trans-2',
                    ruleId: rule2.id,
                    language: 'en',
                    title: 'Rule 2 EN',
                });
                // Delete first rule
                await ruleService.delete(rule1.id, adminId);
                // Verify rule2's translations still exist
                const rule2Trans = Array.from(mockPrisma.translations.values()).filter((t) => t.ruleId === rule2.id);
                expect(rule2Trans.length).toBe(1);
                expect(rule2Trans[0].title).toBe('Rule 2 EN');
            }), { numRuns: 20 });
        });
    });
    /**
     * **Feature: backend-api, Property 22: Rule limit per object enforced**
     * **Validates: Requirements 5.6**
     *
     * For any object that already has 10 rules, attempting to create
     * another rule should return RULE_LIMIT_EXCEEDED error.
     */
    describe('Property 22: Rule limit per object enforced', () => {
        it('should enforce limit of 10 rules per object', async () => {
            const adminId = 'test-admin-12';
            const spaceId = 'test-space-12';
            const objectId = 'test-object-12';
            setupTestData(adminId, spaceId, objectId);
            // Pre-populate with 10 rules
            for (let i = 0; i < 10; i++) {
                mockPrisma.rules.set(`pre-rule-${i}`, {
                    id: `pre-rule-${i}`,
                    objectId,
                    title: `Rule ${i}`,
                    description: 'Test rule',
                    iconType: 'info',
                    priority: i,
                    displayOrder: i,
                    isActive: true,
                });
            }
            await fc.assert(fc.asyncProperty(generators_1.validRuleArb, async (ruleData) => {
                // Try to create 11th rule - should fail
                await expect(ruleService.create(objectId, adminId, {
                    title: ruleData.title,
                    description: ruleData.description,
                    iconType: ruleData.iconType,
                    priority: ruleData.priority,
                })).rejects.toThrow(/Rule limit exceeded/);
            }), { numRuns: 10 });
        });
        it('should allow creating rules up to the limit', async () => {
            const adminId = 'test-admin-13';
            const spaceId = 'test-space-13';
            const objectId = 'test-object-13';
            setupTestData(adminId, spaceId, objectId);
            // Pre-populate with 9 rules
            for (let i = 0; i < 9; i++) {
                mockPrisma.rules.set(`pre-rule-${i}`, {
                    id: `pre-rule-${i}`,
                    objectId,
                    title: `Rule ${i}`,
                    description: 'Test rule',
                    iconType: 'info',
                    priority: i,
                    displayOrder: i,
                    isActive: true,
                });
            }
            await fc.assert(fc.asyncProperty(generators_1.validRuleArb, async (ruleData) => {
                // 10th rule should succeed
                const result = await ruleService.create(objectId, adminId, {
                    title: ruleData.title,
                    description: ruleData.description,
                    iconType: ruleData.iconType,
                    priority: ruleData.priority,
                });
                expect(result.id).toBeDefined();
                // Reset to 9 for next iteration
                mockPrisma.rules.delete(result.id);
            }), { numRuns: 10 });
        });
        it('should allow creating after deleting (within limit)', async () => {
            const adminId = 'test-admin-14';
            const spaceId = 'test-space-14';
            const objectId = 'test-object-14';
            setupTestData(adminId, spaceId, objectId);
            // Pre-populate with 10 rules
            for (let i = 0; i < 10; i++) {
                mockPrisma.rules.set(`pre-rule-${i}`, {
                    id: `pre-rule-${i}`,
                    objectId,
                    title: `Rule ${i}`,
                    description: 'Test rule',
                    iconType: 'info',
                    priority: i,
                    displayOrder: i,
                    isActive: true,
                });
            }
            await fc.assert(fc.asyncProperty(generators_1.validRuleArb, async (ruleData) => {
                // Delete one rule
                await ruleService.delete('pre-rule-0', adminId);
                // Now should be able to create
                const result = await ruleService.create(objectId, adminId, {
                    title: ruleData.title,
                    description: ruleData.description,
                    iconType: ruleData.iconType,
                    priority: ruleData.priority,
                });
                expect(result.id).toBeDefined();
                // Restore for next iteration
                mockPrisma.rules.set('pre-rule-0', {
                    id: 'pre-rule-0',
                    objectId,
                    title: 'Rule 0',
                    description: 'Test rule',
                    iconType: 'info',
                    priority: 0,
                    displayOrder: 0,
                    isActive: true,
                });
                mockPrisma.rules.delete(result.id);
            }), { numRuns: 10 });
        });
        it('should count rules per object independently', async () => {
            const adminId = 'test-admin-15';
            const spaceId = 'test-space-15';
            const objectId1 = 'test-object-15a';
            const objectId2 = 'test-object-15b';
            setupTestData(adminId, spaceId, objectId1);
            mockPrisma.objects.set(objectId2, {
                id: objectId2,
                spaceId,
                objectTypeId: 'type-sofa',
                customName: 'Test Object 2',
            });
            // Fill object1 with 10 rules
            for (let i = 0; i < 10; i++) {
                mockPrisma.rules.set(`obj1-rule-${i}`, {
                    id: `obj1-rule-${i}`,
                    objectId: objectId1,
                    title: `Rule ${i}`,
                    description: 'Test rule',
                    iconType: 'info',
                    priority: i,
                    displayOrder: i,
                    isActive: true,
                });
            }
            await fc.assert(fc.asyncProperty(generators_1.validRuleArb, async (ruleData) => {
                // Object1 should reject new rules
                await expect(ruleService.create(objectId1, adminId, {
                    title: ruleData.title,
                    description: ruleData.description,
                    iconType: ruleData.iconType,
                    priority: ruleData.priority,
                })).rejects.toThrow(/Rule limit exceeded/);
                // Object2 should accept new rules
                const result = await ruleService.create(objectId2, adminId, {
                    title: ruleData.title,
                    description: ruleData.description,
                    iconType: ruleData.iconType,
                    priority: ruleData.priority,
                });
                expect(result.id).toBeDefined();
                expect(result.objectId).toBe(objectId2);
                // Clean up for next iteration
                mockPrisma.rules.delete(result.id);
            }), { numRuns: 10 });
        });
    });
    /**
     * **Feature: backend-api, Property 23: Rule title length validated**
     * **Validates: Requirements 5.7**
     *
     * For any rule creation or update with title exceeding 30 characters,
     * the operation should return TITLE_TOO_LONG error.
     */
    describe('Property 23: Rule title length validated', () => {
        it('should reject titles exceeding 30 characters on creation', async () => {
            const adminId = 'test-admin-16';
            const spaceId = 'test-space-16';
            const objectId = 'test-object-16';
            setupTestData(adminId, spaceId, objectId);
            await fc.assert(fc.asyncProperty(generators_1.longTitleArb, fc.string({ minLength: 1, maxLength: 200 }), fc.constantFrom('prohibited', 'warning', 'tip', 'info'), async (longTitle, description, iconType) => {
                // Ensure title is actually > 30 chars
                if (longTitle.length <= 30)
                    return;
                await expect(ruleService.create(objectId, adminId, {
                    title: longTitle,
                    description,
                    iconType: iconType,
                })).rejects.toThrow(/Title must not exceed 30 characters/);
            }), { numRuns: 30 });
        });
        it('should reject titles exceeding 30 characters on update', async () => {
            const adminId = 'test-admin-17';
            const spaceId = 'test-space-17';
            const objectId = 'test-object-17';
            setupTestData(adminId, spaceId, objectId);
            await fc.assert(fc.asyncProperty(generators_1.validRuleArb, generators_1.longTitleArb, async (initialData, longTitle) => {
                // Ensure title is actually > 30 chars
                if (longTitle.length <= 30)
                    return;
                mockPrisma.rules.clear();
                // Create initial rule with valid title
                const created = await ruleService.create(objectId, adminId, {
                    title: initialData.title,
                    description: initialData.description,
                    iconType: initialData.iconType,
                    priority: initialData.priority,
                });
                // Try to update with long title - should fail
                await expect(ruleService.update(created.id, adminId, {
                    title: longTitle,
                })).rejects.toThrow(/Title must not exceed 30 characters/);
                // Verify original title is preserved
                const retrieved = await ruleService.findById(created.id, adminId);
                expect(retrieved.title).toBe(initialData.title);
            }), { numRuns: 20 });
        });
        it('should accept titles with exactly 30 characters', async () => {
            const adminId = 'test-admin-18';
            const spaceId = 'test-space-18';
            const objectId = 'test-object-18';
            setupTestData(adminId, spaceId, objectId);
            await fc.assert(fc.asyncProperty(fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'), { minLength: 30, maxLength: 30 }), fc.string({ minLength: 1, maxLength: 200 }), fc.constantFrom('prohibited', 'warning', 'tip', 'info'), async (title30, description, iconType) => {
                mockPrisma.rules.clear();
                // 30 character title should succeed
                const result = await ruleService.create(objectId, adminId, {
                    title: title30,
                    description,
                    iconType: iconType,
                });
                expect(result.title).toBe(title30);
                expect(result.title.length).toBe(30);
            }), { numRuns: 10 });
        });
        it('should accept titles with less than 30 characters', async () => {
            const adminId = 'test-admin-19';
            const spaceId = 'test-space-19';
            const objectId = 'test-object-19';
            setupTestData(adminId, spaceId, objectId);
            await fc.assert(fc.asyncProperty(fc.string({ minLength: 1, maxLength: 29 }), fc.string({ minLength: 1, maxLength: 200 }), fc.constantFrom('prohibited', 'warning', 'tip', 'info'), async (shortTitle, description, iconType) => {
                mockPrisma.rules.clear();
                // Short title should succeed
                const result = await ruleService.create(objectId, adminId, {
                    title: shortTitle,
                    description,
                    iconType: iconType,
                });
                expect(result.title).toBe(shortTitle);
                expect(result.title.length).toBeLessThanOrEqual(30);
            }), { numRuns: 20 });
        });
    });
});
//# sourceMappingURL=rule.property.test.js.map