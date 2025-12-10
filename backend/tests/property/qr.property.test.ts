import * as fc from 'fast-check';
import { QRService } from '../../src/services/qr.service';
import { validSpaceArb, qrCodeArb } from '../helpers/generators';

/**
 * QR Code Module Property Tests
 * 
 * These tests validate the correctness properties defined in the design document
 * for the QR Code module (Requirements 7.1 - 7.4).
 */

// Mock PrismaClient for testing
const createMockPrisma = () => {
  const spaces: Map<string, any> = new Map();
  const admins: Map<string, any> = new Map();
  const qrCodes: Map<string, any> = new Map();
  const qrCodesBySpace: Map<string, any> = new Map();
  const objects: Map<string, any> = new Map();
  const objectTypes: Map<string, any> = new Map();
  const rules: Map<string, any> = new Map();
  const triggerZones: Map<string, any> = new Map();

  return {
    spaces,
    admins,
    qrCodes,
    qrCodesBySpace,
    objects,
    objectTypes,
    rules,
    triggerZones,
    admin: {
      findUnique: jest.fn(({ where }: { where: { id?: string; email?: string } }) => {
        if (where.id) return Promise.resolve(admins.get(where.id) || null);
        return Promise.resolve(null);
      }),
    },
    space: {
      findUnique: jest.fn(({ where, include }: any) => {
        const space = spaces.get(where.id);
        if (!space) return Promise.resolve(null);
        
        if (include) {
          const result = { ...space };
          if (include.objects) {
            result.objects = Array.from(objects.values())
              .filter((o: any) => o.spaceId === space.id)
              .map((o: any) => ({
                ...o,
                objectType: objectTypes.get(o.objectTypeId) || {
                  id: o.objectTypeId,
                  name: 'test-type',
                  nameKo: '테스트',
                  nameEn: 'Test',
                  category: 'furniture',
                },
                rules: Array.from(rules.values())
                  .filter((r: any) => r.objectId === o.id && r.isActive)
                  .map((r: any) => ({ ...r, translations: [] })),
              }));
          }
          if (include.triggerZones) {
            result.triggerZones = Array.from(triggerZones.values())
              .filter((t: any) => t.spaceId === space.id && t.isActive)
              .map((t: any) => ({ ...t, translations: [] }));
          }
          return Promise.resolve(result);
        }
        return Promise.resolve(space);
      }),
    },

    qrCode: {
      findUnique: jest.fn(({ where, include }: any) => {
        let qr = null;
        if (where.code) {
          qr = qrCodes.get(where.code);
        } else if (where.spaceId) {
          qr = qrCodesBySpace.get(where.spaceId);
        }
        
        if (!qr) return Promise.resolve(null);
        
        if (include?.space) {
          const space = spaces.get(qr.spaceId);
          if (space) {
            const result = { ...qr, space: { ...space } };
            if (include.space.include?.objects) {
              result.space.objects = Array.from(objects.values())
                .filter((o: any) => o.spaceId === space.id)
                .map((o: any) => ({
                  ...o,
                  objectType: objectTypes.get(o.objectTypeId) || {
                    id: o.objectTypeId,
                    name: 'test-type',
                    nameKo: '테스트',
                    nameEn: 'Test',
                    category: 'furniture',
                  },
                  rules: Array.from(rules.values())
                    .filter((r: any) => r.objectId === o.id && r.isActive)
                    .map((r: any) => ({ ...r, translations: [] })),
                }));
            }
            if (include.space.include?.triggerZones) {
              result.space.triggerZones = Array.from(triggerZones.values())
                .filter((t: any) => t.spaceId === space.id && t.isActive)
                .map((t: any) => ({ ...t, translations: [] }));
            }
            return Promise.resolve(result);
          }
        }
        return Promise.resolve(qr);
      }),
      create: jest.fn((data: any) => {
        const qr = {
          ...data.data,
          lastScannedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        qrCodes.set(qr.code, qr);
        qrCodesBySpace.set(qr.spaceId, qr);
        return Promise.resolve(qr);
      }),
      update: jest.fn(({ where, data }: any) => {
        let qr = null;
        if (where.code) {
          qr = qrCodes.get(where.code);
        } else if (where.spaceId) {
          qr = qrCodesBySpace.get(where.spaceId);
        }
        if (!qr) return Promise.resolve(null);
        
        const updated = { ...qr, updatedAt: new Date() };
        if (data.scanCount?.increment) {
          updated.scanCount = (qr.scanCount || 0) + data.scanCount.increment;
        }
        if (data.lastScannedAt !== undefined) {
          updated.lastScannedAt = data.lastScannedAt;
        }
        qrCodes.set(updated.code, updated);
        qrCodesBySpace.set(updated.spaceId, updated);
        return Promise.resolve(updated);
      }),
      delete: jest.fn(({ where }: any) => {
        const qr = qrCodesBySpace.get(where.spaceId);
        if (qr) {
          qrCodes.delete(qr.code);
          qrCodesBySpace.delete(where.spaceId);
        }
        return Promise.resolve(qr);
      }),
    },
    reset: () => {
      spaces.clear();
      admins.clear();
      qrCodes.clear();
      qrCodesBySpace.clear();
      objects.clear();
      objectTypes.clear();
      rules.clear();
      triggerZones.clear();
    },
  };
};


describe('QR Code Property Tests', () => {
  let mockPrisma: ReturnType<typeof createMockPrisma>;
  let qrService: QRService;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    qrService = new QRService(mockPrisma as any);
  });

  afterEach(() => {
    mockPrisma.reset();
    jest.clearAllMocks();
  });

  // Helper to create test admin
  const createTestAdmin = (id: string) => {
    mockPrisma.admins.set(id, {
      id,
      email: `${id}@example.com`,
      plan: 'enterprise',
    });
  };

  // Helper to create test space
  const createTestSpace = (id: string, adminId: string, data: any = {}) => {
    const space = {
      id,
      adminId,
      name: data.name || 'Test Space',
      description: data.description || null,
      width: data.width || 10,
      height: data.height || 2.5,
      depth: data.depth || 8,
      status: 'published',
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockPrisma.spaces.set(id, space);
    return space;
  };

  // Helper to create test object
  const createTestObject = (id: string, spaceId: string, objectTypeId: string) => {
    const obj = {
      id,
      spaceId,
      objectTypeId,
      customName: 'Test Object',
      positionX: 5,
      positionY: 5,
      positionZ: 0,
      rotationX: 0,
      rotationY: 0,
      rotationZ: 0,
      scaleX: 1,
      scaleY: 1,
      scaleZ: 1,
    };
    mockPrisma.objects.set(id, obj);
    return obj;
  };

  // Helper to create test rule
  const createTestRule = (id: string, objectId: string) => {
    const rule = {
      id,
      objectId,
      title: 'Test Rule',
      description: 'Test description',
      iconType: 'info',
      priority: 5,
      isActive: true,
    };
    mockPrisma.rules.set(id, rule);
    return rule;
  };

  // Helper to create test trigger
  const createTestTrigger = (id: string, spaceId: string) => {
    const trigger = {
      id,
      spaceId,
      positionX: 3,
      positionY: 3,
      positionZ: 0,
      radius: 1.5,
      triggerType: 'info',
      message: 'Test trigger',
      autoCloseSeconds: 5,
      vibrationPattern: 'none',
      soundEffect: 'none',
      isActive: true,
    };
    mockPrisma.triggerZones.set(id, trigger);
    return trigger;
  };


  /**
   * **Feature: backend-api, Property 30: QR code is unique and 8 characters**
   * **Validates: Requirements 7.1**
   * 
   * For any QR code generation, the generated code should be exactly 8 characters
   * and unique across all QR codes.
   */
  describe('Property 30: QR code is unique and 8 characters', () => {
    it('should generate QR codes that are exactly 8 characters', async () => {
      const adminId = 'test-admin-1';
      createTestAdmin(adminId);

      await fc.assert(
        fc.asyncProperty(validSpaceArb, async (spaceData) => {
          mockPrisma.qrCodes.clear();
          mockPrisma.qrCodesBySpace.clear();
          mockPrisma.spaces.clear();

          const spaceId = `space-${Date.now()}-${Math.random()}`;
          createTestSpace(spaceId, adminId, spaceData);

          const qrCode = await qrService.generate(spaceId, adminId);

          // Verify code is exactly 8 characters
          expect(qrCode.code.length).toBe(8);
        }),
        { numRuns: 50 }
      );
    });

    it('should generate QR codes with only uppercase letters and numbers', async () => {
      const adminId = 'test-admin-2';
      createTestAdmin(adminId);

      const validChars = /^[A-Z0-9]+$/;

      await fc.assert(
        fc.asyncProperty(validSpaceArb, async (spaceData) => {
          mockPrisma.qrCodes.clear();
          mockPrisma.qrCodesBySpace.clear();
          mockPrisma.spaces.clear();

          const spaceId = `space-${Date.now()}-${Math.random()}`;
          createTestSpace(spaceId, adminId, spaceData);

          const qrCode = await qrService.generate(spaceId, adminId);

          // Verify code contains only valid characters
          expect(qrCode.code).toMatch(validChars);
        }),
        { numRuns: 50 }
      );
    });

    it('should generate unique QR codes for different spaces', async () => {
      const adminId = 'test-admin-3';
      createTestAdmin(adminId);

      const generatedCodes = new Set<string>();

      await fc.assert(
        fc.asyncProperty(validSpaceArb, async (spaceData) => {
          const spaceId = `space-${Date.now()}-${Math.random()}`;
          createTestSpace(spaceId, adminId, spaceData);

          const qrCode = await qrService.generate(spaceId, adminId);

          // Verify code is unique
          expect(generatedCodes.has(qrCode.code)).toBe(false);
          generatedCodes.add(qrCode.code);
        }),
        { numRuns: 30 }
      );
    });

    it('should return existing QR code if space already has one', async () => {
      const adminId = 'test-admin-4';
      createTestAdmin(adminId);

      await fc.assert(
        fc.asyncProperty(validSpaceArb, async (spaceData) => {
          mockPrisma.qrCodes.clear();
          mockPrisma.qrCodesBySpace.clear();
          mockPrisma.spaces.clear();

          const spaceId = `space-${Date.now()}-${Math.random()}`;
          createTestSpace(spaceId, adminId, spaceData);

          // Generate first QR code
          const firstQR = await qrService.generate(spaceId, adminId);

          // Generate again - should return same code
          const secondQR = await qrService.generate(spaceId, adminId);

          expect(secondQR.code).toBe(firstQR.code);
          expect(secondQR.id).toBe(firstQR.id);
        }),
        { numRuns: 20 }
      );
    });
  });


  /**
   * **Feature: backend-api, Property 31: QR lookup returns full space data**
   * **Validates: Requirements 7.2**
   * 
   * For any valid QR code, looking up the space should return complete space
   * information including objects, rules, and triggers.
   */
  describe('Property 31: QR lookup returns full space data', () => {
    it('should return space with all objects and rules', async () => {
      const adminId = 'test-admin-5';
      createTestAdmin(adminId);

      await fc.assert(
        fc.asyncProperty(
          validSpaceArb,
          fc.integer({ min: 1, max: 5 }),
          fc.integer({ min: 1, max: 3 }),
          async (spaceData, numObjects, numRulesPerObject) => {
            mockPrisma.reset();
            createTestAdmin(adminId);

            const spaceId = `space-${Date.now()}`;
            createTestSpace(spaceId, adminId, spaceData);

            // Create objects with rules
            const objectTypeId = 'type-1';
            mockPrisma.objectTypes.set(objectTypeId, {
              id: objectTypeId,
              name: 'bed',
              nameKo: '침대',
              nameEn: 'Bed',
              category: 'furniture',
            });

            for (let i = 0; i < numObjects; i++) {
              const objId = `obj-${i}`;
              createTestObject(objId, spaceId, objectTypeId);

              for (let j = 0; j < numRulesPerObject; j++) {
                createTestRule(`rule-${i}-${j}`, objId);
              }
            }

            // Generate QR code
            const qrCode = await qrService.generate(spaceId, adminId);

            // Lookup by code
            const result = await qrService.findByCode(qrCode.code);

            // Verify space data
            expect(result.id).toBe(spaceId);
            expect(result.name).toBe(spaceData.name);
            expect(result.width).toBe(spaceData.width);
            expect(result.depth).toBe(spaceData.depth);

            // Verify objects are included
            expect(result.objects.length).toBe(numObjects);

            // Verify rules are included for each object
            for (const obj of result.objects) {
              expect(obj.rules.length).toBe(numRulesPerObject);
            }
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should return space with all trigger zones', async () => {
      const adminId = 'test-admin-6';
      createTestAdmin(adminId);

      await fc.assert(
        fc.asyncProperty(
          validSpaceArb,
          fc.integer({ min: 1, max: 5 }),
          async (spaceData, numTriggers) => {
            mockPrisma.reset();
            createTestAdmin(adminId);

            const spaceId = `space-${Date.now()}`;
            createTestSpace(spaceId, adminId, spaceData);

            // Create triggers
            for (let i = 0; i < numTriggers; i++) {
              createTestTrigger(`trigger-${i}`, spaceId);
            }

            // Generate QR code
            const qrCode = await qrService.generate(spaceId, adminId);

            // Lookup by code
            const result = await qrService.findByCode(qrCode.code);

            // Verify triggers are included
            expect(result.triggerZones.length).toBe(numTriggers);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should include object type information', async () => {
      const adminId = 'test-admin-7';
      createTestAdmin(adminId);

      await fc.assert(
        fc.asyncProperty(validSpaceArb, async (spaceData) => {
          mockPrisma.reset();
          createTestAdmin(adminId);

          const spaceId = `space-${Date.now()}`;
          createTestSpace(spaceId, adminId, spaceData);

          const objectTypeId = 'type-bed';
          mockPrisma.objectTypes.set(objectTypeId, {
            id: objectTypeId,
            name: 'bed',
            nameKo: '침대',
            nameEn: 'Bed',
            category: 'furniture',
          });

          createTestObject('obj-1', spaceId, objectTypeId);

          const qrCode = await qrService.generate(spaceId, adminId);
          const result = await qrService.findByCode(qrCode.code);

          // Verify object type is included
          expect(result.objects[0].objectType).toBeDefined();
          expect(result.objects[0].objectType.name).toBe('bed');
          expect(result.objects[0].objectType.nameKo).toBe('침대');
        }),
        { numRuns: 20 }
      );
    });
  });


  /**
   * **Feature: backend-api, Property 32: QR scan increments counter**
   * **Validates: Requirements 7.3**
   * 
   * For any QR code scan, the scan count should increment by 1 and the
   * last scanned timestamp should be updated.
   */
  describe('Property 32: QR scan increments counter', () => {
    it('should increment scan count by 1 on each scan', async () => {
      const adminId = 'test-admin-8';
      createTestAdmin(adminId);

      await fc.assert(
        fc.asyncProperty(
          validSpaceArb,
          fc.integer({ min: 1, max: 10 }),
          async (spaceData, numScans) => {
            mockPrisma.reset();
            createTestAdmin(adminId);

            const spaceId = `space-${Date.now()}`;
            createTestSpace(spaceId, adminId, spaceData);

            // Generate QR code
            const qrCode = await qrService.generate(spaceId, adminId);
            expect(qrCode.scanCount).toBe(0);

            // Perform scans
            for (let i = 1; i <= numScans; i++) {
              const updated = await qrService.incrementScanCount(qrCode.code);
              expect(updated.scanCount).toBe(i);
            }
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should update lastScannedAt timestamp on each scan', async () => {
      const adminId = 'test-admin-9';
      createTestAdmin(adminId);

      await fc.assert(
        fc.asyncProperty(validSpaceArb, async (spaceData) => {
          mockPrisma.reset();
          createTestAdmin(adminId);

          const spaceId = `space-${Date.now()}`;
          createTestSpace(spaceId, adminId, spaceData);

          // Generate QR code
          const qrCode = await qrService.generate(spaceId, adminId);
          expect(qrCode.lastScannedAt).toBeNull();

          // Perform scan
          const beforeScan = new Date();
          const updated = await qrService.incrementScanCount(qrCode.code);
          const afterScan = new Date();

          // Verify timestamp is updated
          expect(updated.lastScannedAt).not.toBeNull();
          expect(updated.lastScannedAt!.getTime()).toBeGreaterThanOrEqual(beforeScan.getTime());
          expect(updated.lastScannedAt!.getTime()).toBeLessThanOrEqual(afterScan.getTime());
        }),
        { numRuns: 20 }
      );
    });

    it('should preserve other QR code data when incrementing', async () => {
      const adminId = 'test-admin-10';
      createTestAdmin(adminId);

      await fc.assert(
        fc.asyncProperty(validSpaceArb, async (spaceData) => {
          mockPrisma.reset();
          createTestAdmin(adminId);

          const spaceId = `space-${Date.now()}`;
          createTestSpace(spaceId, adminId, spaceData);

          // Generate QR code
          const original = await qrService.generate(spaceId, adminId);

          // Perform scan
          const updated = await qrService.incrementScanCount(original.code);

          // Verify other data is preserved
          expect(updated.id).toBe(original.id);
          expect(updated.spaceId).toBe(original.spaceId);
          expect(updated.code).toBe(original.code);
          expect(updated.qrImageUrl).toBe(original.qrImageUrl);
        }),
        { numRuns: 20 }
      );
    });
  });


  /**
   * **Feature: backend-api, Property 33: Invalid QR returns error**
   * **Validates: Requirements 7.4**
   * 
   * For any non-existent QR code, looking up should return QR_NOT_FOUND error.
   */
  describe('Property 33: Invalid QR returns error', () => {
    it('should throw QR_NOT_FOUND for non-existent codes', async () => {
      await fc.assert(
        fc.asyncProperty(qrCodeArb, async (randomCode) => {
          mockPrisma.reset();

          // Try to find a code that doesn't exist
          await expect(qrService.findByCode(randomCode)).rejects.toThrow(/QR code not found/);
        }),
        { numRuns: 30 }
      );
    });

    it('should throw QR_NOT_FOUND when incrementing non-existent code', async () => {
      await fc.assert(
        fc.asyncProperty(qrCodeArb, async (randomCode) => {
          mockPrisma.reset();

          // Try to increment a code that doesn't exist
          await expect(qrService.incrementScanCount(randomCode)).rejects.toThrow(/QR code not found/);
        }),
        { numRuns: 30 }
      );
    });

    it('should throw error for deleted space QR lookup', async () => {
      const adminId = 'test-admin-11';
      createTestAdmin(adminId);

      await fc.assert(
        fc.asyncProperty(validSpaceArb, async (spaceData) => {
          mockPrisma.reset();
          createTestAdmin(adminId);

          const spaceId = `space-${Date.now()}`;
          const space = createTestSpace(spaceId, adminId, spaceData);

          // Generate QR code
          const qrCode = await qrService.generate(spaceId, adminId);

          // Mark space as deleted
          (space as any).deletedAt = new Date();
          mockPrisma.spaces.set(spaceId, space);

          // Try to lookup - should fail because space is deleted
          await expect(qrService.findByCode(qrCode.code)).rejects.toThrow(/not found/);
        }),
        { numRuns: 20 }
      );
    });
  });
});
