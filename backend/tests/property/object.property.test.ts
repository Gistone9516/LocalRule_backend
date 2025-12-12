import * as fc from 'fast-check';
import { ObjectService } from '../../src/services/object.service';
import { position3DArb, rotation3DArb, scale3DArb } from '../helpers/generators';

/**
 * Object Module Property Tests
 *
 * These tests validate the correctness properties defined in the design document
 * for the Object module (Requirements 4.1 - 4.6).
 */

// Mock PrismaClient for testing
const createMockPrisma = () => {
  const spaces: Map<string, any> = new Map();
  const admins: Map<string, any> = new Map();
  const objects: Map<string, any> = new Map();
  const objectTypes: Map<string, any> = new Map();
  const rules: Map<string, any> = new Map();
  let objectIdCounter = 0;

  // Initialize default object types
  const defaultObjectTypes = [
    { id: 'type-bed', name: 'bed', nameKo: '침대', nameEn: 'Bed', category: 'furniture', icon: '🛏️', isSystem: true },
    { id: 'type-sofa', name: 'sofa', nameKo: '소파', nameEn: 'Sofa', category: 'furniture', icon: '🛋️', isSystem: true },
    { id: 'type-washer', name: 'washer', nameKo: '세탁기', nameEn: 'Washing Machine', category: 'appliance', icon: '🧺', isSystem: true },
  ];
  defaultObjectTypes.forEach((t) => objectTypes.set(t.id, t));

  return {
    spaces,
    admins,
    objects,
    objectTypes,
    rules,
    admin: {
      findUnique: jest.fn(({ where }: { where: { id?: string } }) => {
        if (where.id) return Promise.resolve(admins.get(where.id) || null);
        return Promise.resolve(null);
      }),
    },
    space: {
      findUnique: jest.fn(({ where }: { where: { id: string } }) => {
        return Promise.resolve(spaces.get(where.id) || null);
      }),
    },
    objectType: {
      findUnique: jest.fn(({ where }: { where: { id?: string; name?: string } }) => {
        if (where.id) return Promise.resolve(objectTypes.get(where.id) || null);
        if (where.name) {
          for (const t of objectTypes.values()) {
            if (t.name === where.name) return Promise.resolve(t);
          }
        }
        return Promise.resolve(null);
      }),
      findMany: jest.fn(({ where, orderBy: _orderBy }: any) => {
        let result = Array.from(objectTypes.values());
        if (where?.category) {
          result = result.filter((t) => t.category === where.category);
        }
        return Promise.resolve(result);
      }),
    },
    objectModel: {
      findUnique: jest.fn(() => Promise.resolve(null)),
    },
    spaceObject: {
      findUnique: jest.fn(({ where, include }: any) => {
        const obj = objects.get(where.id);
        if (!obj) return Promise.resolve(null);
        const result = { ...obj };
        if (include?.space) {
          result.space = spaces.get(obj.spaceId);
        }
        if (include?.objectType) {
          result.objectType = objectTypes.get(obj.objectTypeId);
        }
        if (include?.rules) {
          result.rules = Array.from(rules.values()).filter((r) => r.objectId === obj.id);
        }
        return Promise.resolve(result);
      }),
      findMany: jest.fn(({ where, include, orderBy: _orderBy }: any) => {
        let result = Array.from(objects.values()).filter((o) => {
          if (where.spaceId && o.spaceId !== where.spaceId) return false;
          return true;
        });
        // Sort by displayOrder
        result.sort((a, b) => a.displayOrder - b.displayOrder);
        // Add includes
        result = result.map((obj) => {
          const r = { ...obj };
          if (include?.objectType) {
            r.objectType = objectTypes.get(obj.objectTypeId);
          }
          if (include?.rules) {
            r.rules = Array.from(rules.values()).filter((rule) => rule.objectId === obj.id);
          }
          return r;
        });
        return Promise.resolve(result);
      }),
      count: jest.fn(({ where }: any) => {
        let count = 0;
        for (const o of objects.values()) {
          if (where.spaceId && o.spaceId !== where.spaceId) continue;
          count++;
        }
        return Promise.resolve(count);
      }),
      aggregate: jest.fn(({ where }: any) => {
        let maxOrder = -1;
        for (const o of objects.values()) {
          if (where.spaceId && o.spaceId !== where.spaceId) continue;
          if (o.displayOrder > maxOrder) maxOrder = o.displayOrder;
        }
        return Promise.resolve({ _max: { displayOrder: maxOrder === -1 ? null : maxOrder } });
      }),
      create: jest.fn(({ data, include }: any) => {
        const id = `object-${++objectIdCounter}`;
        const obj = {
          id,
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        objects.set(id, obj);
        const result = { ...obj };
        if (include?.objectType) {
          result.objectType = objectTypes.get(data.objectTypeId);
        }
        return Promise.resolve(result);
      }),
      update: jest.fn(({ where, data, include }: any) => {
        const obj = objects.get(where.id);
        if (!obj) return Promise.resolve(null);
        const updated = { ...obj, ...data, updatedAt: new Date() };
        objects.set(where.id, updated);
        const result = { ...updated };
        if (include?.objectType) {
          result.objectType = objectTypes.get(updated.objectTypeId);
        }
        return Promise.resolve(result);
      }),
      delete: jest.fn(({ where }: any) => {
        const obj = objects.get(where.id);
        objects.delete(where.id);
        // Cascade delete rules
        for (const [ruleId, rule] of rules.entries()) {
          if (rule.objectId === where.id) {
            rules.delete(ruleId);
          }
        }
        return Promise.resolve(obj);
      }),
    },
    localRule: {
      findMany: jest.fn(({ where }: any) => {
        return Promise.resolve(
          Array.from(rules.values()).filter((r) => r.objectId === where.objectId)
        );
      }),
      count: jest.fn(({ where }: any) => {
        let count = 0;
        for (const r of rules.values()) {
          if (where.objectId && r.objectId !== where.objectId) continue;
          count++;
        }
        return Promise.resolve(count);
      }),
    },
    reset: () => {
      spaces.clear();
      admins.clear();
      objects.clear();
      rules.clear();
      objectIdCounter = 0;
      // Re-initialize object types
      defaultObjectTypes.forEach((t) => objectTypes.set(t.id, t));
    },
  };
};


describe('Object Property Tests', () => {
  let mockPrisma: ReturnType<typeof createMockPrisma>;
  let objectService: ObjectService;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    objectService = new ObjectService(mockPrisma as any);
  });

  afterEach(() => {
    mockPrisma.reset();
    jest.clearAllMocks();
  });

  // Helper to create test admin and space
  const setupAdminAndSpace = (adminId: string, spaceId: string) => {
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
   * **Feature: backend-api, Property 14: Object creation stores all data**
   * **Validates: Requirements 4.1**
   *
   * For any valid object data (type, position, rotation, scale),
   * creating an object should store all provided data and return the created object.
   */
  describe('Property 14: Object creation stores all data', () => {
    it('should create object with all provided data', async () => {
      const adminId = 'test-admin-1';
      const spaceId = 'test-space-1';
      setupAdminAndSpace(adminId, spaceId);

      await fc.assert(
        fc.asyncProperty(
          position3DArb,
          fc.option(rotation3DArb, { nil: undefined }),
          fc.option(scale3DArb, { nil: undefined }),
          fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
          async (position, rotation, scale, customName) => {
            const objectTypeId = 'type-bed';

            const result = await objectService.create(spaceId, adminId, {
              objectTypeId,
              customName,
              position,
              rotation,
              scale,
            });

            // Verify position is stored correctly
            expect(result.position.x).toBe(position.x);
            expect(result.position.y).toBe(position.y);
            expect(result.position.z).toBe(position.z);

            // Verify rotation is stored (defaults to 0 if not provided)
            if (rotation) {
              expect(result.rotation.x).toBe(rotation.x);
              expect(result.rotation.y).toBe(rotation.y);
              expect(result.rotation.z).toBe(rotation.z);
            } else {
              expect(result.rotation.x).toBe(0);
              expect(result.rotation.y).toBe(0);
              expect(result.rotation.z).toBe(0);
            }

            // Verify scale is stored (defaults to 1 if not provided)
            if (scale) {
              expect(result.scale.x).toBe(scale.x);
              expect(result.scale.y).toBe(scale.y);
              expect(result.scale.z).toBe(scale.z);
            } else {
              expect(result.scale.x).toBe(1);
              expect(result.scale.y).toBe(1);
              expect(result.scale.z).toBe(1);
            }

            // Verify custom name
            if (customName !== undefined) {
              expect(result.customName).toBe(customName);
            }

            // Verify object type
            expect(result.objectTypeId).toBe(objectTypeId);
            expect(result.id).toBeDefined();
            expect(result.spaceId).toBe(spaceId);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should assign unique IDs to each created object', async () => {
      const adminId = 'test-admin-2';
      const spaceId = 'test-space-2';
      setupAdminAndSpace(adminId, spaceId);

      const createdIds = new Set<string>();

      await fc.assert(
        fc.asyncProperty(position3DArb, async (position) => {
          const result = await objectService.create(spaceId, adminId, {
            objectTypeId: 'type-bed',
            position,
          });
          expect(createdIds.has(result.id)).toBe(false);
          createdIds.add(result.id);
        }),
        { numRuns: 20 }
      );
    });

    it('should increment displayOrder for each new object', async () => {
      const adminId = 'test-admin-3';
      const spaceId = 'test-space-3';
      setupAdminAndSpace(adminId, spaceId);

      let lastDisplayOrder = -1;

      await fc.assert(
        fc.asyncProperty(position3DArb, async (position) => {
          const result = await objectService.create(spaceId, adminId, {
            objectTypeId: 'type-bed',
            position,
          });
          expect(result.displayOrder).toBeGreaterThan(lastDisplayOrder);
          lastDisplayOrder = result.displayOrder;
        }),
        { numRuns: 10 }
      );
    });
  });


  /**
   * **Feature: backend-api, Property 15: Object list includes all objects**
   * **Validates: Requirements 4.2, 4.3**
   *
   * For any space with objects, requesting the object list
   * should return all objects with their associated rules.
   */
  describe('Property 15: Object list includes all objects', () => {
    it('should return all created objects in the list', async () => {
      const adminId = 'test-admin-4';
      const spaceId = 'test-space-4';
      setupAdminAndSpace(adminId, spaceId);

      await fc.assert(
        fc.asyncProperty(
          fc.array(position3DArb, { minLength: 1, maxLength: 10 }),
          async (positions) => {
            // Reset objects for this test
            mockPrisma.objects.clear();

            // Create all objects
            const createdObjects = [];
            for (const position of positions) {
              const obj = await objectService.create(spaceId, adminId, {
                objectTypeId: 'type-bed',
                position,
              });
              createdObjects.push(obj);
            }

            // Get the list
            const result = await objectService.findBySpaceId(spaceId, adminId);

            // Verify all created objects are in the list
            expect(result.length).toBe(createdObjects.length);
            for (const created of createdObjects) {
              const found = result.find((o) => o.id === created.id);
              expect(found).toBeDefined();
              expect(found?.position.x).toBe(created.position.x);
              expect(found?.position.y).toBe(created.position.y);
            }
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should return objects sorted by displayOrder', async () => {
      const adminId = 'test-admin-5';
      const spaceId = 'test-space-5';
      setupAdminAndSpace(adminId, spaceId);

      await fc.assert(
        fc.asyncProperty(
          fc.array(position3DArb, { minLength: 2, maxLength: 10 }),
          async (positions) => {
            mockPrisma.objects.clear();

            // Create objects
            for (const position of positions) {
              await objectService.create(spaceId, adminId, {
                objectTypeId: 'type-bed',
                position,
              });
            }

            // Get the list
            const result = await objectService.findBySpaceId(spaceId, adminId);

            // Verify sorted by displayOrder
            for (let i = 1; i < result.length; i++) {
              expect(result[i].displayOrder).toBeGreaterThanOrEqual(result[i - 1].displayOrder);
            }
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should include object type information', async () => {
      const adminId = 'test-admin-6';
      const spaceId = 'test-space-6';
      setupAdminAndSpace(adminId, spaceId);

      await fc.assert(
        fc.asyncProperty(position3DArb, async (position) => {
          mockPrisma.objects.clear();

          await objectService.create(spaceId, adminId, {
            objectTypeId: 'type-bed',
            position,
          });

          const result = await objectService.findBySpaceId(spaceId, adminId);

          expect(result.length).toBe(1);
          expect(result[0].objectType).toBeDefined();
          expect(result[0].objectType?.name).toBe('bed');
        }),
        { numRuns: 10 }
      );
    });
  });


  /**
   * **Feature: backend-api, Property 16: Object deletion cascades to rules**
   * **Validates: Requirements 4.4**
   *
   * For any object with associated rules, deleting the object
   * should also delete all associated rules.
   */
  describe('Property 16: Object deletion cascades to rules', () => {
    it('should delete associated rules when object is deleted', async () => {
      const adminId = 'test-admin-7';
      const spaceId = 'test-space-7';
      setupAdminAndSpace(adminId, spaceId);

      await fc.assert(
        fc.asyncProperty(
          position3DArb,
          fc.integer({ min: 1, max: 5 }),
          async (position, ruleCount) => {
            mockPrisma.objects.clear();
            mockPrisma.rules.clear();

            // Create object
            const obj = await objectService.create(spaceId, adminId, {
              objectTypeId: 'type-bed',
              position,
            });

            // Add rules to the object
            for (let i = 0; i < ruleCount; i++) {
              const ruleId = `rule-${Date.now()}-${i}`;
              mockPrisma.rules.set(ruleId, {
                id: ruleId,
                objectId: obj.id,
                title: `Rule ${i}`,
                description: 'Test rule',
                iconType: 'info',
                priority: i,
              });
            }

            // Verify rules exist
            const rulesBefore = Array.from(mockPrisma.rules.values()).filter(
              (r) => r.objectId === obj.id
            );
            expect(rulesBefore.length).toBe(ruleCount);

            // Delete object
            await objectService.delete(obj.id, adminId);

            // Verify object is deleted
            expect(mockPrisma.objects.get(obj.id)).toBeUndefined();

            // Verify rules are cascade deleted
            const rulesAfter = Array.from(mockPrisma.rules.values()).filter(
              (r) => r.objectId === obj.id
            );
            expect(rulesAfter.length).toBe(0);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should not affect rules of other objects', async () => {
      const adminId = 'test-admin-8';
      const spaceId = 'test-space-8';
      setupAdminAndSpace(adminId, spaceId);

      await fc.assert(
        fc.asyncProperty(position3DArb, position3DArb, async (position1, position2) => {
          mockPrisma.objects.clear();
          mockPrisma.rules.clear();

          // Create two objects
          const obj1 = await objectService.create(spaceId, adminId, {
            objectTypeId: 'type-bed',
            position: position1,
          });
          const obj2 = await objectService.create(spaceId, adminId, {
            objectTypeId: 'type-sofa',
            position: position2,
          });

          // Add rules to both objects
          mockPrisma.rules.set('rule-1', {
            id: 'rule-1',
            objectId: obj1.id,
            title: 'Rule for obj1',
          });
          mockPrisma.rules.set('rule-2', {
            id: 'rule-2',
            objectId: obj2.id,
            title: 'Rule for obj2',
          });

          // Delete first object
          await objectService.delete(obj1.id, adminId);

          // Verify obj2's rules still exist
          const obj2Rules = Array.from(mockPrisma.rules.values()).filter(
            (r) => r.objectId === obj2.id
          );
          expect(obj2Rules.length).toBe(1);
          expect(obj2Rules[0].title).toBe('Rule for obj2');
        }),
        { numRuns: 20 }
      );
    });
  });


  /**
   * **Feature: backend-api, Property 17: Object limit per space enforced**
   * **Validates: Requirements 4.5**
   *
   * For any space that already has 50 objects, attempting to create
   * another object should return OBJECT_LIMIT_EXCEEDED error.
   */
  describe('Property 17: Object limit per space enforced', () => {
    it('should enforce limit of 50 objects per space', async () => {
      const adminId = 'test-admin-9';
      const spaceId = 'test-space-9';
      setupAdminAndSpace(adminId, spaceId);

      // Pre-populate with 50 objects
      for (let i = 0; i < 50; i++) {
        mockPrisma.objects.set(`pre-obj-${i}`, {
          id: `pre-obj-${i}`,
          spaceId,
          objectTypeId: 'type-bed',
          positionX: i,
          positionY: 0,
          positionZ: 0,
          displayOrder: i,
        });
      }

      await fc.assert(
        fc.asyncProperty(position3DArb, async (position) => {
          // Try to create 51st object - should fail
          await expect(
            objectService.create(spaceId, adminId, {
              objectTypeId: 'type-bed',
              position,
            })
          ).rejects.toThrow(/Object limit exceeded/);
        }),
        { numRuns: 10 }
      );
    });

    it('should allow creating objects up to the limit', async () => {
      const adminId = 'test-admin-10';
      const spaceId = 'test-space-10';
      setupAdminAndSpace(adminId, spaceId);

      // Pre-populate with 49 objects
      for (let i = 0; i < 49; i++) {
        mockPrisma.objects.set(`pre-obj-${i}`, {
          id: `pre-obj-${i}`,
          spaceId,
          objectTypeId: 'type-bed',
          positionX: i,
          positionY: 0,
          positionZ: 0,
          displayOrder: i,
        });
      }

      await fc.assert(
        fc.asyncProperty(position3DArb, async (position) => {
          // 50th object should succeed
          const result = await objectService.create(spaceId, adminId, {
            objectTypeId: 'type-bed',
            position,
          });
          expect(result.id).toBeDefined();

          // Reset to 49 for next iteration
          mockPrisma.objects.delete(result.id);
        }),
        { numRuns: 10 }
      );
    });

    it('should allow creating after deleting (within limit)', async () => {
      const adminId = 'test-admin-11';
      const spaceId = 'test-space-11';
      setupAdminAndSpace(adminId, spaceId);

      // Pre-populate with 50 objects
      for (let i = 0; i < 50; i++) {
        mockPrisma.objects.set(`pre-obj-${i}`, {
          id: `pre-obj-${i}`,
          spaceId,
          objectTypeId: 'type-bed',
          positionX: i,
          positionY: 0,
          positionZ: 0,
          displayOrder: i,
        });
      }

      await fc.assert(
        fc.asyncProperty(position3DArb, async (position) => {
          // Delete one object
          await objectService.delete('pre-obj-0', adminId);

          // Now should be able to create
          const result = await objectService.create(spaceId, adminId, {
            objectTypeId: 'type-bed',
            position,
          });
          expect(result.id).toBeDefined();

          // Restore for next iteration
          mockPrisma.objects.set('pre-obj-0', {
            id: 'pre-obj-0',
            spaceId,
            objectTypeId: 'type-bed',
            positionX: 0,
            positionY: 0,
            positionZ: 0,
            displayOrder: 0,
          });
          mockPrisma.objects.delete(result.id);
        }),
        { numRuns: 10 }
      );
    });

    it('should count objects per space independently', async () => {
      const adminId = 'test-admin-12';
      const spaceId1 = 'test-space-12a';
      const spaceId2 = 'test-space-12b';
      setupAdminAndSpace(adminId, spaceId1);
      mockPrisma.spaces.set(spaceId2, {
        id: spaceId2,
        adminId,
        name: 'Test Space 2',
        deletedAt: null,
      });

      // Fill space1 with 50 objects
      for (let i = 0; i < 50; i++) {
        mockPrisma.objects.set(`space1-obj-${i}`, {
          id: `space1-obj-${i}`,
          spaceId: spaceId1,
          objectTypeId: 'type-bed',
          positionX: i,
          positionY: 0,
          positionZ: 0,
          displayOrder: i,
        });
      }

      await fc.assert(
        fc.asyncProperty(position3DArb, async (position) => {
          // Space1 should reject new objects
          await expect(
            objectService.create(spaceId1, adminId, {
              objectTypeId: 'type-bed',
              position,
            })
          ).rejects.toThrow(/Object limit exceeded/);

          // Space2 should accept new objects
          const result = await objectService.create(spaceId2, adminId, {
            objectTypeId: 'type-bed',
            position,
          });
          expect(result.id).toBeDefined();
          expect(result.spaceId).toBe(spaceId2);

          // Clean up for next iteration
          mockPrisma.objects.delete(result.id);
        }),
        { numRuns: 10 }
      );
    });
  });
});
