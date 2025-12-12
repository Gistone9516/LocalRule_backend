import { PlanType, SpaceStatus, IconType, TriggerType } from '@prisma/client';
export declare function createTestAdmin(overrides?: Partial<TestAdmin>): TestAdmin;
export interface TestAdmin {
    id: string;
    email: string;
    passwordHash: string;
    name: string;
    phone: string | null;
    plan: PlanType;
    isActive: boolean;
    emailVerifiedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
}
export declare function createTestSpace(adminId: string, overrides?: Partial<TestSpace>): TestSpace;
export interface TestSpace {
    id: string;
    adminId: string;
    name: string;
    description: string | null;
    width: number;
    height: number;
    depth: number;
    status: SpaceStatus;
    floorPlanData: unknown;
    thumbnailUrl: string | null;
    publishedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
}
export declare function createTestObject(spaceId: string, objectTypeId: string, overrides?: Partial<TestObject>): TestObject;
export interface TestObject {
    id: string;
    spaceId: string;
    objectTypeId: string;
    modelId: string | null;
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
    isMlDetected: boolean;
    mlConfidence: number | null;
    displayOrder: number;
    createdAt: Date;
    updatedAt: Date;
}
export declare function createTestRule(objectId: string, overrides?: Partial<TestRule>): TestRule;
export interface TestRule {
    id: string;
    objectId: string;
    title: string;
    description: string;
    iconType: IconType;
    priority: number;
    displayOrder: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare function createTestTrigger(spaceId: string, overrides?: Partial<TestTrigger>): TestTrigger;
export interface TestTrigger {
    id: string;
    spaceId: string;
    positionX: number;
    positionY: number;
    positionZ: number;
    radius: number;
    triggerType: TriggerType;
    message: string;
    autoCloseSeconds: number | null;
    vibrationPattern: string;
    soundEffect: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=factories.d.ts.map