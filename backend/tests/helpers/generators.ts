import * as fc from 'fast-check';

// Valid email generator
export const validEmailArb = fc.emailAddress();

// Valid password generator (8+ chars, letters + numbers + special chars)
// Minimum: 4 letters + 3 numbers + 1 special = 8 characters
export const validPasswordArb = fc
  .tuple(
    fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'), {
      minLength: 4,
      maxLength: 10,
    }),
    fc.stringOf(fc.constantFrom(...'0123456789'), { minLength: 3, maxLength: 5 }),
    fc.stringOf(fc.constantFrom(...'!@#$%^&*'), { minLength: 1, maxLength: 3 })
  )
  .map(([letters, numbers, special]) => letters + numbers + special);

// Weak password generator (fails validation)
export const weakPasswordArb = fc.oneof(
  fc.string({ maxLength: 7 }), // Less than 8 chars
  fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'), { minLength: 8 }), // Letters only
  fc.stringOf(fc.constantFrom(...'0123456789'), { minLength: 8 }) // Numbers only
);

// Valid name generator
export const validNameArb = fc.string({ minLength: 1, maxLength: 100 });

// Valid phone generator
export const validPhoneArb = fc
  .tuple(
    fc.constantFrom('010', '011', '016', '017', '018', '019'),
    fc.stringOf(fc.constantFrom(...'0123456789'), { minLength: 4, maxLength: 4 }),
    fc.stringOf(fc.constantFrom(...'0123456789'), { minLength: 4, maxLength: 4 })
  )
  .map(([prefix, mid, last]) => `${prefix}-${mid}-${last}`);

// Valid space data generator
export const validSpaceArb = fc.record({
  name: fc.string({ minLength: 1, maxLength: 100 }),
  description: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
  width: fc.integer({ min: 1, max: 50 }),
  depth: fc.integer({ min: 1, max: 50 }),
  height: fc.integer({ min: 1, max: 10 }),
});

// Valid 3D position generator
export const position3DArb = fc.record({
  x: fc.integer({ min: 0, max: 50 }),
  y: fc.integer({ min: 0, max: 50 }),
  z: fc.integer({ min: 0, max: 10 }),
});

// Valid 3D rotation generator
export const rotation3DArb = fc.record({
  x: fc.integer({ min: 0, max: 360 }),
  y: fc.integer({ min: 0, max: 360 }),
  z: fc.integer({ min: 0, max: 360 }),
});

// Valid 3D scale generator
export const scale3DArb = fc.record({
  x: fc.integer({ min: 1, max: 10 }),
  y: fc.integer({ min: 1, max: 10 }),
  z: fc.integer({ min: 1, max: 10 }),
});

// Valid rule data generator
export const validRuleArb = fc.record({
  title: fc.string({ minLength: 1, maxLength: 30 }),
  description: fc.string({ minLength: 1, maxLength: 200 }),
  iconType: fc.constantFrom('prohibited', 'warning', 'tip', 'info'),
  priority: fc.integer({ min: 1, max: 10 }),
});

// Long title generator (exceeds 30 chars)
export const longTitleArb = fc.string({ minLength: 31, maxLength: 100 });

// Valid trigger radius generator (0.5m ~ 3.0m) - using integers * 0.1 for simplicity
export const validRadiusArb = fc.integer({ min: 5, max: 30 }).map(n => n / 10);

// Invalid trigger radius generator
export const invalidRadiusArb = fc.oneof(
  fc.integer({ min: 0, max: 4 }).map(n => n / 10),  // 0.0 to 0.4
  fc.integer({ min: 31, max: 100 }).map(n => n / 10) // 3.1 to 10.0
);

// Valid trigger data generator
export const validTriggerArb = fc.record({
  position: position3DArb,
  radius: validRadiusArb,
  triggerType: fc.constantFrom('warning', 'caution', 'info'),
  message: fc.string({ minLength: 1, maxLength: 100 }),
  autoCloseSeconds: fc.option(fc.integer({ min: 2, max: 10 }), { nil: undefined }),
  vibrationPattern: fc.constantFrom('none', 'short', 'long'),
  soundEffect: fc.constantFrom('none', 'ding', 'alert'),
});

// UUID generator
export const uuidArb = fc.uuid();

// Language code generator
export const languageCodeArb = fc.constantFrom('ko', 'en', 'ja', 'zh');

// Explore mode generator
export const exploreModeArb = fc.constantFrom('vr', 'ar');

// Device ID generator
export const deviceIdArb = fc.string({ minLength: 10, maxLength: 100 });

// QR code generator (8 alphanumeric characters)
export const qrCodeArb = fc.stringOf(
  fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'),
  { minLength: 8, maxLength: 8 }
);

// Valid object data generator
export const validObjectArb = fc.record({
  objectTypeId: uuidArb,
  customName: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
  position: position3DArb,
  rotation: fc.option(rotation3DArb, { nil: undefined }),
  scale: fc.option(scale3DArb, { nil: undefined }),
  isMlDetected: fc.option(fc.boolean(), { nil: undefined }),
  mlConfidence: fc.option(fc.float({ min: 0, max: 1 }), { nil: undefined }),
});

// Object category generator
export const objectCategoryArb = fc.constantFrom('furniture', 'appliance', 'facility', 'other');
