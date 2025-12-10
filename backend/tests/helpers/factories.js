"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTestAdmin = createTestAdmin;
exports.createTestSpace = createTestSpace;
exports.createTestObject = createTestObject;
exports.createTestRule = createTestRule;
exports.createTestTrigger = createTestTrigger;
const uuid_1 = require("uuid");
const client_1 = require("@prisma/client");
// Factory for creating test admin data
function createTestAdmin(overrides = {}) {
    return {
        id: (0, uuid_1.v4)(),
        email: `test-${Date.now()}@example.com`,
        passwordHash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYn.Wd1S1FGi', // Test1234!
        name: 'Test Admin',
        phone: '010-1234-5678',
        plan: client_1.PlanType.free,
        isActive: true,
        emailVerifiedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        ...overrides,
    };
}
// Factory for creating test space data
function createTestSpace(adminId, overrides = {}) {
    return {
        id: (0, uuid_1.v4)(),
        adminId,
        name: 'Test Space',
        description: 'A test space for testing',
        width: 10.0,
        height: 2.5,
        depth: 8.0,
        status: client_1.SpaceStatus.draft,
        floorPlanData: null,
        thumbnailUrl: null,
        publishedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        ...overrides,
    };
}
// Factory for creating test object data
function createTestObject(spaceId, objectTypeId, overrides = {}) {
    return {
        id: (0, uuid_1.v4)(),
        spaceId,
        objectTypeId,
        modelId: null,
        customName: 'Test Object',
        positionX: 5.0,
        positionY: 5.0,
        positionZ: 0.0,
        rotationX: 0.0,
        rotationY: 0.0,
        rotationZ: 0.0,
        scaleX: 1.0,
        scaleY: 1.0,
        scaleZ: 1.0,
        isMlDetected: false,
        mlConfidence: null,
        displayOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
    };
}
// Factory for creating test rule data
function createTestRule(objectId, overrides = {}) {
    return {
        id: (0, uuid_1.v4)(),
        objectId,
        title: 'Test Rule',
        description: 'A test rule for testing',
        iconType: client_1.IconType.info,
        priority: 5,
        displayOrder: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
    };
}
// Factory for creating test trigger data
function createTestTrigger(spaceId, overrides = {}) {
    return {
        id: (0, uuid_1.v4)(),
        spaceId,
        positionX: 5.0,
        positionY: 5.0,
        positionZ: 0.0,
        radius: 1.5,
        triggerType: client_1.TriggerType.info,
        message: 'Test trigger message',
        autoCloseSeconds: 5,
        vibrationPattern: 'none',
        soundEffect: 'none',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
    };
}
//# sourceMappingURL=factories.js.map