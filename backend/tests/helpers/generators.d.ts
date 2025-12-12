import * as fc from 'fast-check';
export declare const validEmailArb: fc.Arbitrary<string>;
export declare const validPasswordArb: fc.Arbitrary<string>;
export declare const weakPasswordArb: fc.Arbitrary<string>;
export declare const validNameArb: fc.Arbitrary<string>;
export declare const validPhoneArb: fc.Arbitrary<string>;
export declare const validSpaceArb: fc.Arbitrary<{
    name: string;
    description: string | undefined;
    width: number;
    depth: number;
    height: number;
}>;
export declare const position3DArb: fc.Arbitrary<{
    x: number;
    y: number;
    z: number;
}>;
export declare const rotation3DArb: fc.Arbitrary<{
    x: number;
    y: number;
    z: number;
}>;
export declare const scale3DArb: fc.Arbitrary<{
    x: number;
    y: number;
    z: number;
}>;
export declare const validRuleArb: fc.Arbitrary<{
    title: string;
    description: string;
    iconType: string;
    priority: number;
}>;
export declare const longTitleArb: fc.Arbitrary<string>;
export declare const validRadiusArb: fc.Arbitrary<number>;
export declare const invalidRadiusArb: fc.Arbitrary<number>;
export declare const validTriggerArb: fc.Arbitrary<{
    position: {
        x: number;
        y: number;
        z: number;
    };
    radius: number;
    triggerType: string;
    message: string;
    autoCloseSeconds: number | undefined;
    vibrationPattern: string;
    soundEffect: string;
}>;
export declare const uuidArb: fc.Arbitrary<string>;
export declare const languageCodeArb: fc.Arbitrary<string>;
export declare const exploreModeArb: fc.Arbitrary<string>;
export declare const deviceIdArb: fc.Arbitrary<string>;
export declare const qrCodeArb: fc.Arbitrary<string>;
export declare const validObjectArb: fc.Arbitrary<{
    objectTypeId: string;
    customName: string | undefined;
    position: {
        x: number;
        y: number;
        z: number;
    };
    rotation: {
        x: number;
        y: number;
        z: number;
    } | undefined;
    scale: {
        x: number;
        y: number;
        z: number;
    } | undefined;
    isMlDetected: boolean | undefined;
    mlConfidence: number | undefined;
}>;
export declare const objectCategoryArb: fc.Arbitrary<string>;
//# sourceMappingURL=generators.d.ts.map