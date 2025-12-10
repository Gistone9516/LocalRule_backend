# Design Document

## Overview

LocalRule 백엔드 API는 Node.js 20과 Express 4.18 기반의 RESTful API 서버입니다. TypeScript로 작성되며, Prisma ORM을 통해 PostgreSQL 데이터베이스와 통신합니다. 온프레미스 개발 환경에서 먼저 구현 및 테스트를 완료한 후 AWS Lambda로 마이그레이션할 수 있도록 설계합니다.

### 핵심 설계 원칙
- **계층형 아키텍처**: Controller → Service → Repository 패턴
- **의존성 주입**: 테스트 용이성을 위한 DI 패턴 적용
- **표준화된 응답**: 일관된 JSON 응답 형식
- **에러 처리**: 중앙 집중식 에러 핸들링
- **개발 편의성**: 개발 환경 인증 우회 기능

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    LocalRule Backend API                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Express Application                   │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │   │
│  │  │  CORS   │ │  JSON   │ │  Auth   │ │  Error  │       │   │
│  │  │Middleware│ │ Parser │ │Middleware│ │ Handler │       │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Route Layer                           │   │
│  │  /auth  /spaces  /objects  /rules  /triggers  /qr       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Controller Layer                      │   │
│  │  AuthController  SpaceController  ObjectController ...  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Service Layer                         │   │
│  │  AuthService  SpaceService  ObjectService  RuleService  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Repository Layer                      │   │
│  │  Prisma Client (PostgreSQL)                             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```


### 디렉토리 구조

```
backend/
├── src/
│   ├── app.ts                 # Express 앱 설정
│   ├── server.ts              # 서버 진입점
│   ├── config/
│   │   ├── index.ts           # 환경 설정
│   │   └── database.ts        # DB 연결 설정
│   ├── routes/
│   │   ├── index.ts           # 라우트 통합
│   │   ├── auth.routes.ts
│   │   ├── space.routes.ts
│   │   ├── object.routes.ts
│   │   ├── rule.routes.ts
│   │   ├── trigger.routes.ts
│   │   ├── qr.routes.ts
│   │   ├── upload.routes.ts
│   │   └── visit.routes.ts
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── space.controller.ts
│   │   ├── object.controller.ts
│   │   ├── rule.controller.ts
│   │   ├── trigger.controller.ts
│   │   ├── qr.controller.ts
│   │   ├── upload.controller.ts
│   │   └── visit.controller.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── space.service.ts
│   │   ├── object.service.ts
│   │   ├── rule.service.ts
│   │   ├── trigger.service.ts
│   │   ├── qr.service.ts
│   │   ├── upload.service.ts
│   │   ├── visit.service.ts
│   │   └── translate.service.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── validation.middleware.ts
│   │   └── error.middleware.ts
│   ├── utils/
│   │   ├── jwt.ts
│   │   ├── password.ts
│   │   ├── response.ts
│   │   └── errors.ts
│   └── types/
│       ├── index.ts
│       └── express.d.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── tests/
│   ├── unit/
│   ├── integration/
│   └── property/
├── .env.example
├── .env
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

## Components and Interfaces

### 1. Express Application (app.ts)

```typescript
interface AppConfig {
  port: number;
  nodeEnv: 'development' | 'production' | 'test';
  corsOrigins: string[];
}
```

### 2. Authentication Module

```typescript
interface AuthService {
  register(data: RegisterDto): Promise<Admin>;
  login(data: LoginDto): Promise<AuthTokens>;
  logout(adminId: string, token: string): Promise<void>;
  refreshToken(refreshToken: string): Promise<AuthTokens>;
  resetPassword(email: string): Promise<void>;
  confirmResetPassword(token: string, newPassword: string): Promise<void>;
}

interface RegisterDto {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

interface LoginDto {
  email: string;
  password: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
```

### 3. Space Module

```typescript
interface SpaceService {
  create(adminId: string, data: CreateSpaceDto): Promise<Space>;
  findAll(adminId: string, query: SpaceQueryDto): Promise<PaginatedResult<Space>>;
  findById(id: string, include?: string[]): Promise<Space>;
  update(id: string, data: UpdateSpaceDto): Promise<Space>;
  delete(id: string): Promise<void>;
  updateStatus(id: string, status: SpaceStatus): Promise<Space>;
  restore(id: string): Promise<Space>;
  updateFloorPlan(id: string, floorPlan: FloorPlanData): Promise<Space>;
}

interface CreateSpaceDto {
  name: string;
  description?: string;
  width: number;      // 전체 바운딩 박스 가로
  depth: number;      // 전체 바운딩 박스 세로
  height?: number;    // 천장 높이
  floorPlanData?: FloorPlanData;  // 실제 방 구조
}

// 실제 방 구조를 저장하는 Floor Plan 데이터
interface FloorPlanData {
  walls: Wall[];           // 벽 목록
  doors: Door[];           // 문 목록
  windows: Window[];       // 창문 목록
  rooms?: Room[];          // 방 영역 (복합 공간인 경우)
  obstacles?: Obstacle[];  // 기둥, 계단 등 장애물
}

interface Wall {
  id: string;
  start: Point2D;          // 시작점 (x, y)
  end: Point2D;            // 끝점 (x, y)
  height: number;          // 벽 높이
  thickness: number;       // 벽 두께
  material?: string;       // 재질 (렌더링용)
}

interface Door {
  id: string;
  wallId: string;          // 소속 벽 ID
  position: number;        // 벽 시작점으로부터의 거리
  width: number;           // 문 너비
  height: number;          // 문 높이
  type: 'single' | 'double' | 'sliding';
}

interface Window {
  id: string;
  wallId: string;          // 소속 벽 ID
  position: number;        // 벽 시작점으로부터의 거리
  width: number;           // 창문 너비
  height: number;          // 창문 높이
  sillHeight: number;      // 바닥에서 창문 하단까지 높이
}

interface Room {
  id: string;
  name: string;            // 방 이름 (거실, 욕실 등)
  polygon: Point2D[];      // 방 영역을 정의하는 다각형 꼭짓점
  floorLevel: number;      // 바닥 높이 (단차가 있는 경우)
}

interface Obstacle {
  id: string;
  type: 'pillar' | 'stairs' | 'other';
  polygon: Point2D[];      // 장애물 영역
  height: number;          // 높이
}

interface Point2D {
  x: number;
  y: number;
}

type SpaceStatus = 'draft' | 'published' | 'archived';
```

### 공간 구조 설명

LocalRule의 공간은 단순한 정육면체가 아닌 **실제 방 구조**를 저장합니다:

1. **벽(Walls)**: 방의 경계를 정의하는 선분들. 각 벽은 시작점, 끝점, 높이, 두께를 가짐
2. **문(Doors)**: 벽에 위치한 출입구. VR 모드에서 이동 가능 영역 계산에 사용
3. **창문(Windows)**: 벽에 위치한 창문. 3D 렌더링 시 시각적 요소로 활용
4. **방(Rooms)**: 복합 공간(원룸+욕실 등)인 경우 각 영역을 구분
5. **장애물(Obstacles)**: 기둥, 계단 등 이동에 영향을 주는 구조물

이 구조를 통해:
- 게스트 VR 모드에서 실제 방 구조에 맞는 이동 제한 적용
- 2D 배치 도구에서 정확한 도면 표시
- 3D 렌더링 시 현실감 있는 공간 표현


### 4. Object Module

```typescript
interface ObjectService {
  create(spaceId: string, data: CreateObjectDto): Promise<SpaceObject>;
  findBySpaceId(spaceId: string, include?: string[]): Promise<SpaceObject[]>;
  update(id: string, data: UpdateObjectDto): Promise<SpaceObject>;
  delete(id: string): Promise<void>;
  getObjectTypes(category?: string): Promise<ObjectType[]>;
}

interface CreateObjectDto {
  objectTypeId: string;
  customName?: string;
  position: Position3D;
  rotation?: Rotation3D;
  scale?: Scale3D;
  isMlDetected?: boolean;
  mlConfidence?: number;
}

interface Position3D {
  x: number;
  y: number;
  z: number;
}
```

### 5. Rule Module

```typescript
interface RuleService {
  create(objectId: string, data: CreateRuleDto): Promise<LocalRule>;
  findByObjectId(objectId: string, lang?: string): Promise<LocalRule[]>;
  update(id: string, data: UpdateRuleDto): Promise<LocalRule>;
  delete(id: string): Promise<void>;
  translate(id: string, targetLanguages: string[]): Promise<RuleTranslation[]>;
  uploadImage(id: string, file: Express.Multer.File): Promise<RuleImage>;
  deleteImage(id: string): Promise<void>;
}

interface CreateRuleDto {
  title: string;
  description: string;
  iconType: IconType;
  priority?: number;
  autoTranslate?: boolean;
  targetLanguages?: string[];
}

type IconType = 'prohibited' | 'warning' | 'tip' | 'info';
```

### 6. Trigger Module

```typescript
interface TriggerService {
  create(spaceId: string, data: CreateTriggerDto): Promise<TriggerZone>;
  findBySpaceId(spaceId: string, lang?: string): Promise<TriggerZone[]>;
  update(id: string, data: UpdateTriggerDto): Promise<TriggerZone>;
  delete(id: string): Promise<void>;
}

interface CreateTriggerDto {
  position: Position3D;
  radius: number;
  triggerType: TriggerType;
  message: string;
  autoCloseSeconds?: number;
  vibrationPattern?: VibrationPattern;
  soundEffect?: SoundEffect;
  autoTranslate?: boolean;
  targetLanguages?: string[];
}

type TriggerType = 'warning' | 'caution' | 'info';
type VibrationPattern = 'none' | 'short' | 'long';
type SoundEffect = 'none' | 'ding' | 'alert';
```

### 7. QR Code Module

```typescript
interface QRService {
  generate(spaceId: string): Promise<QRCode>;
  findByCode(code: string): Promise<SpaceWithDetails>;
  incrementScanCount(code: string): Promise<void>;
}
```

### 8. Upload Module

```typescript
interface UploadService {
  uploadImage(file: Express.Multer.File, adminId: string): Promise<FileUpload>;
  uploadModel(file: Express.Multer.File, adminId: string): Promise<FileUpload>;
  uploadMesh(file: Express.Multer.File, adminId: string): Promise<FileUpload>;
}
```

### 9. Visit Module

```typescript
interface VisitService {
  startVisit(data: StartVisitDto): Promise<GuestVisit>;
  endVisit(id: string): Promise<GuestVisit>;
  logEvent(visitId: string, data: LogEventDto): Promise<VisitLog>;
  getStats(spaceId: string, dateRange?: DateRange): Promise<SpaceStats>;
}

interface StartVisitDto {
  spaceId: string;
  deviceId: string;
  language: LanguageCode;
  mode: ExploreMode;
}

type LanguageCode = 'ko' | 'en' | 'ja' | 'zh';
type ExploreMode = 'vr' | 'ar';
```

## Data Models

Prisma 스키마 기반 데이터 모델 (#[[file:LocalRule_DB_schema.md]] 참조)

### 핵심 엔티티

1. **Admin**: 관리자 계정 (이메일, 비밀번호 해시, 플랜)
2. **Space**: VR/AR 공간 (이름, 크기, 상태)
3. **SpaceObject**: 공간 내 객체 (타입, 위치, 회전, 스케일)
4. **LocalRule**: 객체별 규칙 (제목, 설명, 아이콘)
5. **TriggerZone**: 위치 기반 트리거 (위치, 반경, 메시지)
6. **QRCode**: 공간 접근용 QR (코드, 스캔 횟수)
7. **GuestVisit**: 게스트 방문 기록 (디바이스, 언어, 모드)


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

중복 분석 결과:
- 2.1과 2.2는 회원가입 성공/실패로 별개 프로퍼티
- 3.1~3.6은 CRUD 각 단계로 별개 프로퍼티이나, 3.2와 3.3은 조회 관련으로 통합 가능
- 4.1~4.4는 객체 CRUD로 별개 프로퍼티이나, 4.2와 4.3은 통합 가능
- 5.1~5.5는 규칙 CRUD로 별개 프로퍼티
- 7.1~7.3은 QR 관련으로 7.2와 7.3 통합 가능

### Authentication Properties

**Property 1: Valid registration creates account**
*For any* valid email and password combination that meets the requirements, registering should create a new admin account and return 201 status
**Validates: Requirements 2.1**

**Property 2: Duplicate email registration fails**
*For any* email that is already registered, attempting to register again should return EMAIL_ALREADY_EXISTS error
**Validates: Requirements 2.2**

**Property 3: Valid credentials return tokens**
*For any* registered admin with valid credentials, logging in should return both access token and refresh token
**Validates: Requirements 2.3**

**Property 4: Invalid credentials are rejected**
*For any* login attempt with incorrect email or password, the system should return INVALID_CREDENTIALS error
**Validates: Requirements 2.4**

**Property 5: Logout invalidates token**
*For any* logged-in admin, after logout the previous access token should no longer be valid for authenticated requests
**Validates: Requirements 2.5**

**Property 6: Refresh token generates new access token**
*For any* valid refresh token, requesting a new access token should succeed and return a new valid access token
**Validates: Requirements 2.6**

**Property 7: Weak passwords are rejected**
*For any* password that is less than 8 characters or missing required character types, registration should return WEAK_PASSWORD error
**Validates: Requirements 2.7**

### Space Properties

**Property 8: Valid space creation succeeds**
*For any* valid space data (name, width, depth, height within bounds), creating a space should succeed and return the created space with 201 status
**Validates: Requirements 3.1**

**Property 9: Space list contains created spaces**
*For any* admin who has created spaces, requesting the space list should return all non-deleted spaces belonging to that admin
**Validates: Requirements 3.2, 3.3**

**Property 10: Space update persists changes**
*For any* existing space and valid update data, updating the space should persist the changes and subsequent retrieval should return the updated values
**Validates: Requirements 3.4**

**Property 11: Soft delete allows recovery**
*For any* deleted space, the space should be recoverable within 30 days and restoration should return the space to draft status
**Validates: Requirements 3.5**

**Property 12: Status transitions are valid**
*For any* space, changing status should only allow valid transitions (draft ↔ published ↔ archived) and the new status should be persisted
**Validates: Requirements 3.6**

**Property 13: Free plan space limit enforced**
*For any* free plan admin who already has 1 space, attempting to create another space should return SPACE_LIMIT_EXCEEDED error
**Validates: Requirements 3.7**

### Object Properties

**Property 14: Object creation stores all data**
*For any* valid object data (type, position, rotation, scale), creating an object should store all provided data and return the created object
**Validates: Requirements 4.1**

**Property 15: Object list includes all objects**
*For any* space with objects, requesting the object list should return all objects with their associated rules
**Validates: Requirements 4.2, 4.3**

**Property 16: Object deletion cascades to rules**
*For any* object with associated rules, deleting the object should also delete all associated rules
**Validates: Requirements 4.4**

**Property 17: Object limit per space enforced**
*For any* space that already has 50 objects, attempting to create another object should return OBJECT_LIMIT_EXCEEDED error
**Validates: Requirements 4.5**


### Rule Properties

**Property 18: Rule creation stores all data**
*For any* valid rule data (title, description, iconType, priority), creating a rule should store all provided data and return the created rule
**Validates: Requirements 5.1**

**Property 19: Rules are sorted by priority**
*For any* object with multiple rules, requesting the rule list should return rules sorted by priority (ascending) then by displayOrder
**Validates: Requirements 5.3**

**Property 20: Rule update persists changes**
*For any* existing rule and valid update data, updating the rule should persist the changes and subsequent retrieval should return the updated values
**Validates: Requirements 5.4**

**Property 21: Rule deletion cascades to translations**
*For any* rule with translations and images, deleting the rule should also delete all associated translations and images
**Validates: Requirements 5.5**

**Property 22: Rule limit per object enforced**
*For any* object that already has 10 rules, attempting to create another rule should return RULE_LIMIT_EXCEEDED error
**Validates: Requirements 5.6**

**Property 23: Rule title length validated**
*For any* rule creation or update with title exceeding 30 characters, the operation should return TITLE_TOO_LONG error
**Validates: Requirements 5.7**

### Trigger Properties

**Property 24: Trigger creation stores all data**
*For any* valid trigger data (position, radius, type, message), creating a trigger should store all provided data and return the created trigger
**Validates: Requirements 6.1**

**Property 25: Trigger list returns all triggers**
*For any* space with triggers, requesting the trigger list should return all active triggers for that space
**Validates: Requirements 6.2**

**Property 26: Trigger update persists changes**
*For any* existing trigger and valid update data, updating the trigger should persist the changes
**Validates: Requirements 6.3**

**Property 27: Trigger deletion cascades to translations**
*For any* trigger with translations, deleting the trigger should also delete all associated translations
**Validates: Requirements 6.4**

**Property 28: Trigger limit per space enforced**
*For any* space that already has 20 triggers, attempting to create another trigger should return TRIGGER_LIMIT_EXCEEDED error
**Validates: Requirements 6.5**

**Property 29: Trigger radius validated**
*For any* trigger creation or update with radius less than 0.5m or greater than 3.0m, the operation should return INVALID_RADIUS error
**Validates: Requirements 6.6**

### QR Code Properties

**Property 30: QR code is unique and 8 characters**
*For any* QR code generation, the generated code should be exactly 8 characters and unique across all QR codes
**Validates: Requirements 7.1**

**Property 31: QR lookup returns full space data**
*For any* valid QR code, looking up the space should return complete space information including objects, rules, and triggers
**Validates: Requirements 7.2**

**Property 32: QR scan increments counter**
*For any* QR code scan, the scan count should increment by 1 and the last scanned timestamp should be updated
**Validates: Requirements 7.3**

**Property 33: Invalid QR returns error**
*For any* non-existent QR code, looking up should return QR_NOT_FOUND error
**Validates: Requirements 7.4**

### File Upload Properties

**Property 34: Valid image upload returns URL**
*For any* valid image file (jpg, png) under 2MB, uploading should succeed and return an accessible URL
**Validates: Requirements 8.1**

**Property 35: Large files are rejected**
*For any* image file exceeding 2MB, uploading should return FILE_TOO_LARGE error
**Validates: Requirements 8.2**

**Property 36: Invalid formats are rejected**
*For any* file with unsupported format, uploading should return INVALID_FILE_FORMAT error
**Validates: Requirements 8.3**

### Visit Properties

**Property 37: Visit session records all data**
*For any* visit start request, a session should be created with deviceId, language, mode, and startedAt timestamp
**Validates: Requirements 9.1**

**Property 38: Visit end records duration**
*For any* active visit session, ending the visit should record endedAt timestamp and calculate duration
**Validates: Requirements 9.2**

**Property 39: Events are logged correctly**
*For any* event (object click, trigger enter/exit), logging should create a visit log entry with correct event type and reference
**Validates: Requirements 9.3**

### API Stability Properties

**Property 40: Unauthenticated requests are rejected**
*For any* request to a protected endpoint without valid authentication, the system should return 401 Unauthorized
**Validates: Requirements 10.2**

**Property 41: Invalid data returns 400**
*For any* request with invalid or missing required data, the system should return 400 Bad Request with detailed error message
**Validates: Requirements 10.3**

**Property 42: Response format is standardized**
*For any* API response, the JSON structure should include success boolean, data object, and meta object with timestamp and requestId
**Validates: Requirements 10.5**


## Error Handling

### 에러 코드 체계

```typescript
// 에러 코드 정의
enum ErrorCode {
  // 인증 관련 (AUTH_)
  EMAIL_ALREADY_EXISTS = 'AUTH_001',
  INVALID_CREDENTIALS = 'AUTH_002',
  WEAK_PASSWORD = 'AUTH_003',
  INVALID_TOKEN = 'AUTH_004',
  TOKEN_EXPIRED = 'AUTH_005',
  
  // 공간 관련 (SPACE_)
  SPACE_NOT_FOUND = 'SPACE_001',
  SPACE_LIMIT_EXCEEDED = 'SPACE_002',
  INVALID_DIMENSIONS = 'SPACE_003',
  
  // 객체 관련 (OBJECT_)
  OBJECT_NOT_FOUND = 'OBJECT_001',
  OBJECT_LIMIT_EXCEEDED = 'OBJECT_002',
  INVALID_OBJECT_TYPE = 'OBJECT_003',
  
  // 규칙 관련 (RULE_)
  RULE_NOT_FOUND = 'RULE_001',
  RULE_LIMIT_EXCEEDED = 'RULE_002',
  TITLE_TOO_LONG = 'RULE_003',
  
  // 트리거 관련 (TRIGGER_)
  TRIGGER_NOT_FOUND = 'TRIGGER_001',
  TRIGGER_LIMIT_EXCEEDED = 'TRIGGER_002',
  INVALID_RADIUS = 'TRIGGER_003',
  
  // QR 관련 (QR_)
  QR_NOT_FOUND = 'QR_001',
  
  // 파일 관련 (FILE_)
  FILE_TOO_LARGE = 'FILE_001',
  INVALID_FILE_FORMAT = 'FILE_002',
  
  // 일반 (GENERAL_)
  VALIDATION_ERROR = 'GENERAL_001',
  INTERNAL_ERROR = 'GENERAL_002',
}
```

### 에러 응답 형식

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  meta: {
    timestamp: string;
    requestId: string;
  };
}
```

### 중앙 집중식 에러 핸들러

```typescript
// middleware/error.middleware.ts
class AppError extends Error {
  constructor(
    public code: ErrorCode,
    public message: string,
    public statusCode: number = 400,
    public details?: Record<string, any>
  ) {
    super(message);
  }
}

const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.id,
      },
    });
  }
  
  // 예상치 못한 에러
  return res.status(500).json({
    success: false,
    error: {
      code: ErrorCode.INTERNAL_ERROR,
      message: 'Internal server error',
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: req.id,
    },
  });
};
```

## Testing Strategy

### 테스트 프레임워크

- **Jest**: 테스트 러너 및 assertion 라이브러리
- **fast-check**: Property-Based Testing 라이브러리
- **supertest**: HTTP 통합 테스트

### 테스트 구조

```
tests/
├── unit/                    # 단위 테스트
│   ├── services/
│   │   ├── auth.service.test.ts
│   │   ├── space.service.test.ts
│   │   └── ...
│   └── utils/
│       ├── jwt.test.ts
│       └── password.test.ts
├── integration/             # 통합 테스트
│   ├── auth.test.ts
│   ├── space.test.ts
│   └── ...
├── property/                # Property-Based 테스트
│   ├── auth.property.test.ts
│   ├── space.property.test.ts
│   ├── object.property.test.ts
│   ├── rule.property.test.ts
│   ├── trigger.property.test.ts
│   ├── qr.property.test.ts
│   └── api.property.test.ts
└── helpers/
    ├── setup.ts
    ├── factories.ts         # 테스트 데이터 팩토리
    └── generators.ts        # fast-check 생성기
```

### Property-Based Testing 설정

```typescript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
  setupFilesAfterEnv: ['./tests/helpers/setup.ts'],
  testTimeout: 30000, // PBT는 많은 케이스를 실행하므로 타임아웃 증가
};

// tests/helpers/setup.ts
import { PrismaClient } from '@prisma/client';
import { configureGlobal } from 'fast-check';

// fast-check 전역 설정: 최소 100회 반복
configureGlobal({ numRuns: 100 });

// 테스트 DB 설정
const prisma = new PrismaClient();

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  // 테스트 간 데이터 정리
  await prisma.$executeRaw`TRUNCATE TABLE ... CASCADE`;
});
```

### 테스트 데이터 생성기

```typescript
// tests/helpers/generators.ts
import * as fc from 'fast-check';

// 유효한 이메일 생성기
export const validEmailArb = fc.emailAddress();

// 유효한 비밀번호 생성기 (8자 이상, 영문+숫자+특수문자)
export const validPasswordArb = fc.tuple(
  fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'), { minLength: 3, maxLength: 10 }),
  fc.stringOf(fc.constantFrom(...'0123456789'), { minLength: 2, maxLength: 5 }),
  fc.stringOf(fc.constantFrom(...'!@#$%^&*'), { minLength: 1, maxLength: 3 })
).map(([letters, numbers, special]) => letters + numbers + special);

// 약한 비밀번호 생성기
export const weakPasswordArb = fc.oneof(
  fc.string({ maxLength: 7 }), // 8자 미만
  fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'), { minLength: 8 }), // 문자만
  fc.stringOf(fc.constantFrom(...'0123456789'), { minLength: 8 }) // 숫자만
);

// 유효한 공간 데이터 생성기
export const validSpaceArb = fc.record({
  name: fc.string({ minLength: 1, maxLength: 100 }),
  width: fc.float({ min: 1.0, max: 50.0 }),
  depth: fc.float({ min: 1.0, max: 50.0 }),
  height: fc.float({ min: 1.0, max: 10.0 }),
});

// 유효한 위치 생성기
export const position3DArb = fc.record({
  x: fc.float({ min: 0, max: 50 }),
  y: fc.float({ min: 0, max: 50 }),
  z: fc.float({ min: 0, max: 10 }),
});

// 유효한 규칙 데이터 생성기
export const validRuleArb = fc.record({
  title: fc.string({ minLength: 1, maxLength: 30 }),
  description: fc.string({ minLength: 1, maxLength: 200 }),
  iconType: fc.constantFrom('prohibited', 'warning', 'tip', 'info'),
  priority: fc.integer({ min: 1, max: 10 }),
});

// 30자 초과 제목 생성기
export const longTitleArb = fc.string({ minLength: 31, maxLength: 100 });

// 유효한 트리거 반경 생성기
export const validRadiusArb = fc.float({ min: 0.5, max: 3.0 });

// 유효하지 않은 트리거 반경 생성기
export const invalidRadiusArb = fc.oneof(
  fc.float({ min: 0, max: 0.49 }),
  fc.float({ min: 3.01, max: 10 })
);
```


## 실제 방 구조 투영 기능 검토

### 방 구조 데이터 입력 방식

LocalRule에서 실제 방 구조를 시스템에 입력하는 방법은 3가지가 있습니다:

#### 1. 수동 입력 (MVP - 백엔드 지원 필수)

**구현 방식**
- 관리자가 2D 배치 도구에서 벽, 문, 창문을 직접 그림
- 프론트엔드에서 Fabric.js로 도면 편집
- 백엔드는 FloorPlanData JSON을 저장/조회

**백엔드 역할**
- `POST /spaces/:id/floor-plan`: FloorPlanData 저장
- `GET /spaces/:id/floor-plan`: FloorPlanData 조회
- 유효성 검증 (벽 연결성, 닫힌 다각형 등)

**개발 가능성**: ✅ 높음 (백엔드는 JSON 저장만 담당)

#### 2. AR 스캔 (Phase 2 - 모바일 앱 기능)

**구현 방식**
- ARKit(iOS) / ARCore(Android)의 Scene Reconstruction 활용
- 스마트폰으로 방을 스캔하면 3D 메쉬 생성
- 메쉬에서 벽/바닥 평면 추출 → FloorPlanData 변환

**백엔드 역할**
- `POST /spaces/:id/mesh`: 3D 메쉬 파일(.obj, .glb) 업로드
- 메쉬 → FloorPlanData 변환은 별도 처리 파이프라인 필요

**개발 가능성**: ⚠️ 중간 (모바일 앱 개발 필요, 메쉬 처리 복잡)

**기술적 고려사항**
```
ARKit Scene Reconstruction (iOS 13.4+, LiDAR 기기)
- iPhone 12 Pro 이상에서 LiDAR 센서로 정밀 스캔
- 일반 iPhone은 카메라 기반 추정 (정확도 낮음)

ARCore Depth API (Android)
- 일부 기기만 지원
- 정확도는 LiDAR보다 낮음
```

#### 3. 도면 이미지 인식 (Phase 3 - AI 기능)

**구현 방식**
- 관리자가 기존 도면 이미지(CAD, 손그림 등) 업로드
- AI가 이미지에서 벽, 문, 창문 인식
- 인식 결과를 FloorPlanData로 변환

**백엔드 역할**
- `POST /spaces/:id/floor-plan/from-image`: 이미지 업로드 및 AI 처리
- AI 모델 호출 (AWS Rekognition Custom Labels 또는 자체 모델)

**개발 가능성**: ⚠️ 낮음 (AI 모델 학습 필요, 정확도 보장 어려움)

### MVP 백엔드 구현 범위

MVP 단계에서 백엔드는 **수동 입력 방식**만 지원합니다:

```typescript
// 추가 API 엔드포인트
PUT /spaces/:id/floor-plan    // FloorPlanData 저장/수정
GET /spaces/:id/floor-plan    // FloorPlanData 조회

// 유효성 검증 규칙
interface FloorPlanValidation {
  // 벽이 최소 3개 이상 (닫힌 공간 형성)
  minWalls: 3;
  // 모든 벽이 연결되어 닫힌 다각형 형성
  closedPolygon: boolean;
  // 문/창문이 실제 벽 위에 위치
  doorsOnWalls: boolean;
  windowsOnWalls: boolean;
}
```

### 결론

| 방식 | MVP 지원 | 백엔드 복잡도 | 사용자 편의성 |
|------|----------|--------------|--------------|
| 수동 입력 | ✅ | 낮음 | 중간 |
| AR 스캔 | ❌ (Phase 2) | 중간 | 높음 |
| 도면 인식 | ❌ (Phase 3) | 높음 | 높음 |

**MVP에서는 수동 입력 방식으로 시작하고**, AR 스캔은 모바일 앱 개발 시 추가합니다.
백엔드는 FloorPlanData JSON 저장/조회와 기본 유효성 검증만 담당하므로 개발 가능성이 높습니다.
