import { v4 as uuidv4 } from 'uuid';
import { PlanType, SpaceStatus, IconType, TriggerType } from '@prisma/client';

// Factory for creating test admin data
export function createTestAdmin(overrides: Partial<TestAdmin> = {}): TestAdmin {
  return {
    id: uuidv4(),
    email: `test-${Date.now()}@example.com`,
    passwordHash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYn.Wd1S1FGi', // Test1234!
    name: 'Test Admin',
    phone: '010-1234-5678',
    plan: PlanType.free,
    isActive: true,
    emailVerifiedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  };
}

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

// Factory for creating test space data
export function createTestSpace(adminId: string, overrides: Partial<TestSpace> = {}): TestSpace {
  return {
    id: uuidv4(),
    adminId,
    name: 'Test Space',
    description: 'A test space for testing',
    width: 10.0,
    height: 2.5,
    depth: 8.0,
    status: SpaceStatus.draft,
    floorPlanData: null,
    thumbnailUrl: null,
    publishedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  };
}

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

// Factory for creating test object data
export function createTestObject(
  spaceId: string,
  objectTypeId: string,
  overrides: Partial<TestObject> = {}
): TestObject {
  return {
    id: uuidv4(),
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

// Factory for creating test rule data
export function createTestRule(objectId: string, overrides: Partial<TestRule> = {}): TestRule {
  return {
    id: uuidv4(),
    objectId,
    title: 'Test Rule',
    description: 'A test rule for testing',
    iconType: IconType.info,
    priority: 5,
    displayOrder: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

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

// Factory for creating test trigger data
export function createTestTrigger(
  spaceId: string,
  overrides: Partial<TestTrigger> = {}
): TestTrigger {
  return {
    id: uuidv4(),
    spaceId,
    positionX: 5.0,
    positionY: 5.0,
    positionZ: 0.0,
    radius: 1.5,
    triggerType: TriggerType.info,
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
