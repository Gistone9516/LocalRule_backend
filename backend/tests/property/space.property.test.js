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
const space_service_1 = require("../../src/services/space.service");
const generators_1 = require("../helpers/generators");
/**
 * Space Module Property Tests
 *
 * These tests validate the correctness properties defined in the design document
 * for the Space module (Requirements 3.1 - 3.7).
 */
// Mock PrismaClient for testing
const createMockPrisma = () => {
    const spaces = new Map();
    const admins = new Map();
    let spaceIdCounter = 0;
    return {
        spaces,
        admins,
        admin: {
            findUnique: jest.fn(({ where }) => {
                if (where.id)
                    return Promise.resolve(admins.get(where.id) || null);
                if (where.email) {
                    for (const admin of admins.values()) {
                        if (admin.email === where.email)
                            return Promise.resolve(admin);
                    }
                }
                return Promise.resolve(null);
            }),
            create: jest.fn((data) => {
                const admin = { ...data.data, id: `admin-${Date.now()}` };
                admins.set(admin.id, admin);
                return Promise.resolve(admin);
            }),
        },
        space: {
            findUnique: jest.fn(({ where }) => {
                return Promise.resolve(spaces.get(where.id) || null);
            }),
            findMany: jest.fn(({ where, skip, take, orderBy }) => {
                let result = Array.from(spaces.values()).filter((s) => {
                    if (where.adminId && s.adminId !== where.adminId)
                        return false;
                    if (where.deletedAt === null && s.deletedAt !== null)
                        return false;
                    if (where.status && s.status !== where.status)
                        return false;
                    return true;
                });
                if (orderBy?.createdAt === 'desc') {
                    result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
                }
                if (skip !== undefined)
                    result = result.slice(skip);
                if (take !== undefined)
                    result = result.slice(0, take);
                return Promise.resolve(result);
            }),
            count: jest.fn(({ where }) => {
                let count = 0;
                for (const s of spaces.values()) {
                    if (where.adminId && s.adminId !== where.adminId)
                        continue;
                    if (where.deletedAt === null && s.deletedAt !== null)
                        continue;
                    count++;
                }
                return Promise.resolve(count);
            }),
            create: jest.fn((data) => {
                const id = `space-${++spaceIdCounter}`;
                const space = {
                    id,
                    ...data.data,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    deletedAt: null,
                    floorPlanData: null,
                    thumbnailUrl: null,
                    publishedAt: null,
                };
                spaces.set(id, space);
                return Promise.resolve(space);
            }),
            update: jest.fn(({ where, data }) => {
                const space = spaces.get(where.id);
                if (!space)
                    return Promise.resolve(null);
                // Only update fields that are explicitly provided (not undefined)
                const updated = { ...space, updatedAt: new Date() };
                for (const key of Object.keys(data)) {
                    if (data[key] !== undefined) {
                        updated[key] = data[key];
                    }
                }
                spaces.set(where.id, updated);
                return Promise.resolve(updated);
            }),
            delete: jest.fn(({ where }) => {
                const space = spaces.get(where.id);
                spaces.delete(where.id);
                return Promise.resolve(space);
            }),
        },
        reset: () => {
            spaces.clear();
            admins.clear();
            spaceIdCounter = 0;
        },
    };
};
describe('Space Property Tests', () => {
    let mockPrisma;
    let spaceService;
    beforeEach(() => {
        mockPrisma = createMockPrisma();
        spaceService = new space_service_1.SpaceService(mockPrisma);
    });
    afterEach(() => {
        mockPrisma.reset();
        jest.clearAllMocks();
    });
    /**
     * **Feature: backend-api, Property 8: Valid space creation succeeds**
     * **Validates: Requirements 3.1**
     *
     * For any valid space data (name, width, depth, height within bounds),
     * creating a space should succeed and return the created space with 201 status.
     */
    describe('Property 8: Valid space creation succeeds', () => {
        it('should create space with valid data and return all provided fields', async () => {
            // Create a test admin with enterprise plan (no space limit)
            const adminId = 'test-admin-1';
            mockPrisma.admins.set(adminId, {
                id: adminId,
                email: 'test@example.com',
                plan: 'enterprise',
            });
            await fc.assert(fc.asyncProperty(generators_1.validSpaceArb, async (spaceData) => {
                const result = await spaceService.create(adminId, spaceData);
                // Verify all provided fields are stored
                expect(result.name).toBe(spaceData.name);
                expect(result.width).toBe(spaceData.width);
                expect(result.depth).toBe(spaceData.depth);
                if (spaceData.height !== undefined) {
                    expect(result.height).toBe(spaceData.height);
                }
                // Description can be stored as null if empty or undefined
                if (spaceData.description !== undefined && spaceData.description !== '') {
                    expect(result.description).toBe(spaceData.description);
                }
                else {
                    // Empty string or undefined description is stored as null
                    expect(result.description === null || result.description === spaceData.description).toBe(true);
                }
                // Verify default values
                expect(result.status).toBe('draft');
                expect(result.deletedAt).toBeNull();
                expect(result.id).toBeDefined();
                expect(result.adminId).toBe(adminId);
            }), { numRuns: 50 });
        });
        it('should assign unique IDs to each created space', async () => {
            const adminId = 'test-admin-2';
            mockPrisma.admins.set(adminId, {
                id: adminId,
                email: 'test2@example.com',
                plan: 'enterprise',
            });
            const createdIds = new Set();
            await fc.assert(fc.asyncProperty(generators_1.validSpaceArb, async (spaceData) => {
                const result = await spaceService.create(adminId, spaceData);
                expect(createdIds.has(result.id)).toBe(false);
                createdIds.add(result.id);
            }), { numRuns: 20 });
        });
    });
    /**
     * **Feature: backend-api, Property 9: Space list contains created spaces**
     * **Validates: Requirements 3.2, 3.3**
     *
     * For any admin who has created spaces, requesting the space list
     * should return all non-deleted spaces belonging to that admin.
     */
    describe('Property 9: Space list contains created spaces', () => {
        it('should return all created spaces in the list', async () => {
            const adminId = 'test-admin-3';
            mockPrisma.admins.set(adminId, {
                id: adminId,
                email: 'test3@example.com',
                plan: 'enterprise',
            });
            await fc.assert(fc.asyncProperty(fc.array(generators_1.validSpaceArb, { minLength: 1, maxLength: 5 }), async (spacesData) => {
                // Reset spaces for this test
                mockPrisma.spaces.clear();
                // Create all spaces
                const createdSpaces = [];
                for (const data of spacesData) {
                    const space = await spaceService.create(adminId, data);
                    createdSpaces.push(space);
                }
                // Get the list
                const result = await spaceService.findAll(adminId);
                // Verify all created spaces are in the list
                expect(result.data.length).toBe(createdSpaces.length);
                for (const created of createdSpaces) {
                    const found = result.data.find((s) => s.id === created.id);
                    expect(found).toBeDefined();
                    expect(found?.name).toBe(created.name);
                }
            }), { numRuns: 20 });
        });
        it('should not return deleted spaces by default', async () => {
            const adminId = 'test-admin-4';
            mockPrisma.admins.set(adminId, {
                id: adminId,
                email: 'test4@example.com',
                plan: 'enterprise',
            });
            await fc.assert(fc.asyncProperty(generators_1.validSpaceArb, async (spaceData) => {
                mockPrisma.spaces.clear();
                // Create and delete a space
                const space = await spaceService.create(adminId, spaceData);
                await spaceService.delete(space.id, adminId);
                // Get the list
                const result = await spaceService.findAll(adminId);
                // Deleted space should not be in the list
                expect(result.data.find((s) => s.id === space.id)).toBeUndefined();
            }), { numRuns: 20 });
        });
    });
    /**
     * **Feature: backend-api, Property 10: Space update persists changes**
     * **Validates: Requirements 3.4**
     *
     * For any existing space and valid update data, updating the space
     * should persist the changes and subsequent retrieval should return the updated values.
     */
    describe('Property 10: Space update persists changes', () => {
        it('should persist all updated fields', async () => {
            const adminId = 'test-admin-5';
            mockPrisma.admins.set(adminId, {
                id: adminId,
                email: 'test5@example.com',
                plan: 'enterprise',
            });
            await fc.assert(fc.asyncProperty(generators_1.validSpaceArb, generators_1.validSpaceArb, async (originalData, updateData) => {
                mockPrisma.spaces.clear();
                // Create original space
                const original = await spaceService.create(adminId, originalData);
                // Update with new data
                const updated = await spaceService.update(original.id, adminId, {
                    name: updateData.name,
                    description: updateData.description,
                    width: updateData.width,
                    depth: updateData.depth,
                    height: updateData.height,
                });
                // Verify updates are persisted
                expect(updated.name).toBe(updateData.name);
                expect(updated.width).toBe(updateData.width);
                expect(updated.depth).toBe(updateData.depth);
                if (updateData.height !== undefined) {
                    expect(updated.height).toBe(updateData.height);
                }
                // Verify retrieval returns updated values
                const retrieved = await spaceService.findById(original.id);
                expect(retrieved.name).toBe(updateData.name);
            }), { numRuns: 30 });
        });
        it('should preserve unchanged fields during partial update', async () => {
            const adminId = 'test-admin-6';
            mockPrisma.admins.set(adminId, {
                id: adminId,
                email: 'test6@example.com',
                plan: 'enterprise',
            });
            await fc.assert(fc.asyncProperty(generators_1.validSpaceArb, fc.string({ minLength: 1, maxLength: 50 }), async (originalData, newName) => {
                mockPrisma.spaces.clear();
                // Create original space
                const original = await spaceService.create(adminId, originalData);
                // Update only the name
                const updated = await spaceService.update(original.id, adminId, { name: newName });
                // Verify name is updated
                expect(updated.name).toBe(newName);
                // Verify other fields are preserved
                expect(updated.width).toBe(original.width);
                expect(updated.depth).toBe(original.depth);
            }), { numRuns: 30 });
        });
    });
    /**
     * **Feature: backend-api, Property 11: Soft delete allows recovery**
     * **Validates: Requirements 3.5**
     *
     * For any deleted space, the space should be recoverable within 30 days
     * and restoration should return the space to draft status.
     */
    describe('Property 11: Soft delete allows recovery', () => {
        it('should allow recovery of recently deleted spaces', async () => {
            const adminId = 'test-admin-7';
            mockPrisma.admins.set(adminId, {
                id: adminId,
                email: 'test7@example.com',
                plan: 'enterprise',
            });
            await fc.assert(fc.asyncProperty(generators_1.validSpaceArb, async (spaceData) => {
                mockPrisma.spaces.clear();
                // Create and delete a space
                const created = await spaceService.create(adminId, spaceData);
                await spaceService.delete(created.id, adminId);
                // Verify space is deleted
                const deletedSpace = mockPrisma.spaces.get(created.id);
                expect(deletedSpace?.deletedAt).not.toBeNull();
                // Restore the space
                const restored = await spaceService.restore(created.id, adminId);
                // Verify restoration
                expect(restored.deletedAt).toBeNull();
                expect(restored.status).toBe('draft');
                expect(restored.id).toBe(created.id);
            }), { numRuns: 30 });
        });
        it('should set status to archived when deleting', async () => {
            const adminId = 'test-admin-8';
            mockPrisma.admins.set(adminId, {
                id: adminId,
                email: 'test8@example.com',
                plan: 'enterprise',
            });
            await fc.assert(fc.asyncProperty(generators_1.validSpaceArb, async (spaceData) => {
                mockPrisma.spaces.clear();
                // Create and delete a space
                const created = await spaceService.create(adminId, spaceData);
                await spaceService.delete(created.id, adminId);
                // Verify status is archived
                const deletedSpace = mockPrisma.spaces.get(created.id);
                expect(deletedSpace?.status).toBe('archived');
            }), { numRuns: 30 });
        });
    });
    /**
     * **Feature: backend-api, Property 12: Status transitions are valid**
     * **Validates: Requirements 3.6**
     *
     * For any space, changing status should only allow valid transitions
     * (draft ↔ published ↔ archived) and the new status should be persisted.
     */
    describe('Property 12: Status transitions are valid', () => {
        const validTransitions = [
            { from: 'draft', to: 'published' },
            { from: 'published', to: 'draft' },
            { from: 'published', to: 'archived' },
            { from: 'archived', to: 'draft' },
            { from: 'archived', to: 'published' },
        ];
        const invalidTransitions = [
            { from: 'draft', to: 'archived' },
        ];
        it('should allow valid status transitions', async () => {
            const adminId = 'test-admin-9';
            mockPrisma.admins.set(adminId, {
                id: adminId,
                email: 'test9@example.com',
                plan: 'enterprise',
            });
            await fc.assert(fc.asyncProperty(generators_1.validSpaceArb, fc.constantFrom(...validTransitions), async (spaceData, transition) => {
                mockPrisma.spaces.clear();
                // Create space
                const created = await spaceService.create(adminId, spaceData);
                // Set initial status if needed
                if (transition.from !== 'draft') {
                    // First transition to published if needed
                    if (transition.from === 'archived') {
                        await spaceService.updateStatus(created.id, adminId, 'published');
                    }
                    await spaceService.updateStatus(created.id, adminId, transition.from);
                }
                // Perform the transition
                const updated = await spaceService.updateStatus(created.id, adminId, transition.to);
                // Verify the transition
                expect(updated.status).toBe(transition.to);
            }), { numRuns: 30 });
        });
        it('should reject invalid status transitions', async () => {
            const adminId = 'test-admin-10';
            mockPrisma.admins.set(adminId, {
                id: adminId,
                email: 'test10@example.com',
                plan: 'enterprise',
            });
            await fc.assert(fc.asyncProperty(generators_1.validSpaceArb, fc.constantFrom(...invalidTransitions), async (spaceData, transition) => {
                mockPrisma.spaces.clear();
                // Create space (starts in draft)
                const created = await spaceService.create(adminId, spaceData);
                // Try invalid transition
                await expect(spaceService.updateStatus(created.id, adminId, transition.to)).rejects.toThrow();
            }), { numRuns: 10 });
        });
        it('should set publishedAt when first publishing', async () => {
            const adminId = 'test-admin-11';
            mockPrisma.admins.set(adminId, {
                id: adminId,
                email: 'test11@example.com',
                plan: 'enterprise',
            });
            await fc.assert(fc.asyncProperty(generators_1.validSpaceArb, async (spaceData) => {
                mockPrisma.spaces.clear();
                // Create space
                const created = await spaceService.create(adminId, spaceData);
                expect(created.publishedAt).toBeNull();
                // Publish
                const published = await spaceService.updateStatus(created.id, adminId, 'published');
                expect(published.publishedAt).not.toBeNull();
            }), { numRuns: 20 });
        });
    });
    /**
     * **Feature: backend-api, Property 13: Free plan space limit enforced**
     * **Validates: Requirements 3.7**
     *
     * For any free plan admin who already has 1 space, attempting to create
     * another space should return SPACE_LIMIT_EXCEEDED error.
     */
    describe('Property 13: Free plan space limit enforced', () => {
        it('should enforce free plan limit of 1 space', async () => {
            const adminId = 'test-admin-12';
            mockPrisma.admins.set(adminId, {
                id: adminId,
                email: 'test12@example.com',
                plan: 'free',
            });
            await fc.assert(fc.asyncProperty(generators_1.validSpaceArb, generators_1.validSpaceArb, async (firstSpace, secondSpace) => {
                mockPrisma.spaces.clear();
                // Create first space - should succeed
                const created = await spaceService.create(adminId, firstSpace);
                expect(created.id).toBeDefined();
                // Try to create second space - should fail
                await expect(spaceService.create(adminId, secondSpace)).rejects.toThrow(/Space limit exceeded/);
            }), { numRuns: 20 });
        });
        it('should allow basic plan to create up to 5 spaces', async () => {
            const adminId = 'test-admin-13';
            mockPrisma.admins.set(adminId, {
                id: adminId,
                email: 'test13@example.com',
                plan: 'basic',
            });
            await fc.assert(fc.asyncProperty(fc.array(generators_1.validSpaceArb, { minLength: 6, maxLength: 6 }), async (spacesData) => {
                mockPrisma.spaces.clear();
                // Create 5 spaces - should all succeed
                for (let i = 0; i < 5; i++) {
                    const created = await spaceService.create(adminId, spacesData[i]);
                    expect(created.id).toBeDefined();
                }
                // 6th space should fail
                await expect(spaceService.create(adminId, spacesData[5])).rejects.toThrow(/Space limit exceeded/);
            }), { numRuns: 5 });
        });
        it('should allow enterprise plan unlimited spaces', async () => {
            const adminId = 'test-admin-14';
            mockPrisma.admins.set(adminId, {
                id: adminId,
                email: 'test14@example.com',
                plan: 'enterprise',
            });
            await fc.assert(fc.asyncProperty(fc.array(generators_1.validSpaceArb, { minLength: 10, maxLength: 10 }), async (spacesData) => {
                mockPrisma.spaces.clear();
                // Create many spaces - should all succeed
                for (const data of spacesData) {
                    const created = await spaceService.create(adminId, data);
                    expect(created.id).toBeDefined();
                }
            }), { numRuns: 5 });
        });
        it('should allow creating space after deleting one (within limit)', async () => {
            const adminId = 'test-admin-15';
            mockPrisma.admins.set(adminId, {
                id: adminId,
                email: 'test15@example.com',
                plan: 'free',
            });
            await fc.assert(fc.asyncProperty(generators_1.validSpaceArb, generators_1.validSpaceArb, async (firstSpace, secondSpace) => {
                mockPrisma.spaces.clear();
                // Create first space
                const created = await spaceService.create(adminId, firstSpace);
                // Delete it
                await spaceService.delete(created.id, adminId);
                // Now should be able to create another
                const newSpace = await spaceService.create(adminId, secondSpace);
                expect(newSpace.id).toBeDefined();
            }), { numRuns: 20 });
        });
    });
});
//# sourceMappingURL=space.property.test.js.map