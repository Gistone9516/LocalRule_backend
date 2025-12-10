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
exports.objectCategoryArb = exports.validObjectArb = exports.qrCodeArb = exports.deviceIdArb = exports.exploreModeArb = exports.languageCodeArb = exports.uuidArb = exports.validTriggerArb = exports.invalidRadiusArb = exports.validRadiusArb = exports.longTitleArb = exports.validRuleArb = exports.scale3DArb = exports.rotation3DArb = exports.position3DArb = exports.validSpaceArb = exports.validPhoneArb = exports.validNameArb = exports.weakPasswordArb = exports.validPasswordArb = exports.validEmailArb = void 0;
const fc = __importStar(require("fast-check"));
// Valid email generator
exports.validEmailArb = fc.emailAddress();
// Valid password generator (8+ chars, letters + numbers + special chars)
// Minimum: 4 letters + 3 numbers + 1 special = 8 characters
exports.validPasswordArb = fc
    .tuple(fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'), {
    minLength: 4,
    maxLength: 10,
}), fc.stringOf(fc.constantFrom(...'0123456789'), { minLength: 3, maxLength: 5 }), fc.stringOf(fc.constantFrom(...'!@#$%^&*'), { minLength: 1, maxLength: 3 }))
    .map(([letters, numbers, special]) => letters + numbers + special);
// Weak password generator (fails validation)
exports.weakPasswordArb = fc.oneof(fc.string({ maxLength: 7 }), // Less than 8 chars
fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'), { minLength: 8 }), // Letters only
fc.stringOf(fc.constantFrom(...'0123456789'), { minLength: 8 }) // Numbers only
);
// Valid name generator
exports.validNameArb = fc.string({ minLength: 1, maxLength: 100 });
// Valid phone generator
exports.validPhoneArb = fc
    .tuple(fc.constantFrom('010', '011', '016', '017', '018', '019'), fc.stringOf(fc.constantFrom(...'0123456789'), { minLength: 4, maxLength: 4 }), fc.stringOf(fc.constantFrom(...'0123456789'), { minLength: 4, maxLength: 4 }))
    .map(([prefix, mid, last]) => `${prefix}-${mid}-${last}`);
// Valid space data generator
exports.validSpaceArb = fc.record({
    name: fc.string({ minLength: 1, maxLength: 100 }),
    description: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
    width: fc.integer({ min: 1, max: 50 }),
    depth: fc.integer({ min: 1, max: 50 }),
    height: fc.integer({ min: 1, max: 10 }),
});
// Valid 3D position generator
exports.position3DArb = fc.record({
    x: fc.integer({ min: 0, max: 50 }),
    y: fc.integer({ min: 0, max: 50 }),
    z: fc.integer({ min: 0, max: 10 }),
});
// Valid 3D rotation generator
exports.rotation3DArb = fc.record({
    x: fc.integer({ min: 0, max: 360 }),
    y: fc.integer({ min: 0, max: 360 }),
    z: fc.integer({ min: 0, max: 360 }),
});
// Valid 3D scale generator
exports.scale3DArb = fc.record({
    x: fc.integer({ min: 1, max: 10 }),
    y: fc.integer({ min: 1, max: 10 }),
    z: fc.integer({ min: 1, max: 10 }),
});
// Valid rule data generator
exports.validRuleArb = fc.record({
    title: fc.string({ minLength: 1, maxLength: 30 }),
    description: fc.string({ minLength: 1, maxLength: 200 }),
    iconType: fc.constantFrom('prohibited', 'warning', 'tip', 'info'),
    priority: fc.integer({ min: 1, max: 10 }),
});
// Long title generator (exceeds 30 chars)
exports.longTitleArb = fc.string({ minLength: 31, maxLength: 100 });
// Valid trigger radius generator (0.5m ~ 3.0m) - using integers * 0.1 for simplicity
exports.validRadiusArb = fc.integer({ min: 5, max: 30 }).map(n => n / 10);
// Invalid trigger radius generator
exports.invalidRadiusArb = fc.oneof(fc.integer({ min: 0, max: 4 }).map(n => n / 10), // 0.0 to 0.4
fc.integer({ min: 31, max: 100 }).map(n => n / 10) // 3.1 to 10.0
);
// Valid trigger data generator
exports.validTriggerArb = fc.record({
    position: exports.position3DArb,
    radius: exports.validRadiusArb,
    triggerType: fc.constantFrom('warning', 'caution', 'info'),
    message: fc.string({ minLength: 1, maxLength: 100 }),
    autoCloseSeconds: fc.option(fc.integer({ min: 2, max: 10 }), { nil: undefined }),
    vibrationPattern: fc.constantFrom('none', 'short', 'long'),
    soundEffect: fc.constantFrom('none', 'ding', 'alert'),
});
// UUID generator
exports.uuidArb = fc.uuid();
// Language code generator
exports.languageCodeArb = fc.constantFrom('ko', 'en', 'ja', 'zh');
// Explore mode generator
exports.exploreModeArb = fc.constantFrom('vr', 'ar');
// Device ID generator
exports.deviceIdArb = fc.string({ minLength: 10, maxLength: 100 });
// QR code generator (8 alphanumeric characters)
exports.qrCodeArb = fc.stringOf(fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'), { minLength: 8, maxLength: 8 });
// Valid object data generator
exports.validObjectArb = fc.record({
    objectTypeId: exports.uuidArb,
    customName: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
    position: exports.position3DArb,
    rotation: fc.option(exports.rotation3DArb, { nil: undefined }),
    scale: fc.option(exports.scale3DArb, { nil: undefined }),
    isMlDetected: fc.option(fc.boolean(), { nil: undefined }),
    mlConfidence: fc.option(fc.float({ min: 0, max: 1 }), { nil: undefined }),
});
// Object category generator
exports.objectCategoryArb = fc.constantFrom('furniture', 'appliance', 'facility', 'other');
//# sourceMappingURL=generators.js.map