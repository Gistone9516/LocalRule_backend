# LocalRule API 명세서

**프로젝트명**: LocalRule - 센서 기반 VR 공간 규칙 탐색 플랫폼  
**버전**: 1.1  
**작성일**: 2024-12-10  
**최종 수정일**: 2024-12-10  
**Base URL**: `https://api.localrule.app/api/v1`

---

## 목차
1. [개요](#1-개요)
2. [인증 API](#2-인증-api)
3. [공간 관리 API](#3-공간-관리-api)
4. [AR 메쉬 API](#4-ar-메쉬-api)
5. [객체 관리 API](#5-객체-관리-api)
6. [LocalRule 관리 API](#6-localrule-관리-api)
7. [번역 API](#7-번역-api)
8. [트리거 존 API](#8-트리거-존-api)
9. [QR 코드 API](#9-qr-코드-api)
10. [파일 업로드 API](#10-파일-업로드-api)
11. [게스트 방문 API](#11-게스트-방문-api)
12. [에러 코드](#12-에러-코드)
13. [시스템 API](#13-시스템-api)
14. [트리거 번역 API](#14-트리거-번역-api)
15. [객체 타입 API (추가)](#15-객체-타입-api-추가)
16. [에러 코드 (추가)](#16-에러-코드-추가)
17. [부록 A: API 엔드포인트 요약](#부록-a-api-엔드포인트-요약)

---

## 1. 개요

### 1.1 API 규칙

| 항목 | 설명 |
|------|------|
| 프로토콜 | HTTPS only |
| 인증 방식 | Bearer Token (JWT) |
| Content-Type | application/json |
| 문자 인코딩 | UTF-8 |
| 날짜 형식 | ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ) |
| Rate Limit | 100 requests/minute/user |

### 1.2 공통 헤더

```http
Authorization: Bearer {access_token}
Content-Type: application/json
Accept: application/json
Accept-Language: ko|en|ja|zh
```

### 1.3 공통 응답 형식

**성공 응답**
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2024-12-10T10:30:00.000Z",
    "requestId": "req_abc123"
  }
}
```

**페이지네이션 응답**
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  },
  "meta": { ... }
}
```


**에러 응답**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": { ... }
  },
  "meta": {
    "timestamp": "2024-12-10T10:30:00.000Z",
    "requestId": "req_abc123"
  }
}
```

---

## 2. 인증 API

### 2.1 회원가입

관리자 계정을 생성합니다.

**Endpoint**
```
POST /auth/register
```

**Request Body**
```json
{
  "email": "admin@example.com",
  "password": "SecureP@ss123",
  "name": "홍길동",
  "phone": "010-1234-5678"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| email | string | ✓ | 이메일 (로그인 ID) |
| password | string | ✓ | 비밀번호 (8자 이상, 영문+숫자+특수문자) |
| name | string | ✓ | 관리자 이름 (2~50자) |
| phone | string | | 연락처 |

**Response (201 Created)**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "admin@example.com",
    "name": "홍길동",
    "plan": "free",
    "createdAt": "2024-12-10T10:30:00.000Z"
  }
}
```

**Errors**
| 코드 | 설명 |
|------|------|
| EMAIL_ALREADY_EXISTS | 이미 등록된 이메일 |
| INVALID_EMAIL_FORMAT | 잘못된 이메일 형식 |
| WEAK_PASSWORD | 비밀번호 조건 미충족 |

---

### 2.2 로그인

관리자 로그인 후 토큰을 발급받습니다.

**Endpoint**
```
POST /auth/login
```

**Request Body**
```json
{
  "email": "admin@example.com",
  "password": "SecureP@ss123"
}
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 3600,
    "tokenType": "Bearer",
    "admin": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "admin@example.com",
      "name": "홍길동",
      "plan": "free"
    }
  }
}
```

**Errors**
| 코드 | 설명 |
|------|------|
| INVALID_CREDENTIALS | 이메일 또는 비밀번호 불일치 |
| ACCOUNT_DISABLED | 비활성화된 계정 |
| EMAIL_NOT_VERIFIED | 이메일 미인증 |

---

### 2.3 로그아웃

현재 세션을 종료합니다.

**Endpoint**
```
POST /auth/logout
```

**Headers**
```
Authorization: Bearer {access_token}
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "message": "Successfully logged out"
  }
}
```

---

### 2.4 토큰 갱신

만료된 액세스 토큰을 갱신합니다.

**Endpoint**
```
POST /auth/refresh
```

**Request Body**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 3600
  }
}
```

**Errors**
| 코드 | 설명 |
|------|------|
| INVALID_REFRESH_TOKEN | 유효하지 않은 리프레시 토큰 |
| REFRESH_TOKEN_EXPIRED | 만료된 리프레시 토큰 |

---

### 2.5 비밀번호 재설정 요청

비밀번호 재설정 이메일을 발송합니다.

**Endpoint**
```
POST /auth/reset-password/request
```

**Request Body**
```json
{
  "email": "admin@example.com"
}
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "message": "Password reset email sent"
  }
}
```

---

### 2.6 비밀번호 재설정 확인

새 비밀번호를 설정합니다.

**Endpoint**
```
POST /auth/reset-password/confirm
```

**Request Body**
```json
{
  "token": "reset_token_from_email",
  "newPassword": "NewSecureP@ss456"
}
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "message": "Password successfully reset"
  }
}
```

---

### 2.7 내 정보 조회

현재 로그인한 관리자의 정보를 조회합니다.

**Endpoint**
```
GET /auth/me
```

**Headers**
```
Authorization: Bearer {access_token}
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "admin@example.com",
    "name": "홍길동",
    "phone": "010-1234-5678",
    "plan": "free",
    "isActive": true,
    "emailVerifiedAt": "2024-12-10T10:00:00.000Z",
    "createdAt": "2024-12-10T09:00:00.000Z",
    "updatedAt": "2024-12-10T10:30:00.000Z",
    "stats": {
      "spaceCount": 1,
      "totalObjects": 12,
      "totalRules": 25
    }
  }
}
```

---

### 2.8 내 정보 수정

현재 로그인한 관리자의 정보를 수정합니다.

**Endpoint**
```
PUT /auth/me
```

**Headers**
```
Authorization: Bearer {access_token}
```

**Request Body**
```json
{
  "name": "홍길동 (수정)",
  "phone": "010-9876-5432"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| name | string | | 관리자 이름 (2~50자) |
| phone | string | | 연락처 |

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "admin@example.com",
    "name": "홍길동 (수정)",
    "phone": "010-9876-5432",
    "updatedAt": "2024-12-10T11:00:00.000Z"
  }
}
```

---

### 2.9 비밀번호 변경

현재 로그인한 관리자의 비밀번호를 변경합니다.

**Endpoint**
```
PUT /auth/me/password
```

**Headers**
```
Authorization: Bearer {access_token}
```

**Request Body**
```json
{
  "currentPassword": "SecureP@ss123",
  "newPassword": "NewSecureP@ss456"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| currentPassword | string | ✓ | 현재 비밀번호 |
| newPassword | string | ✓ | 새 비밀번호 (8자 이상, 영문+숫자+특수문자) |

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "message": "Password changed successfully"
  }
}
```

**Errors**
| 코드 | 설명 |
|------|------|
| INVALID_CURRENT_PASSWORD | 현재 비밀번호 불일치 |
| WEAK_PASSWORD | 새 비밀번호 조건 미충족 |
| SAME_PASSWORD | 현재 비밀번호와 동일 |

---

## 3. 공간 관리 API

### 3.1 공간 생성

새로운 공간을 생성합니다.

**Endpoint**
```
POST /spaces
```

**Headers**
```
Authorization: Bearer {access_token}
```

**Request Body**
```json
{
  "name": "201호 원룸",
  "description": "깔끔한 원룸 숙소입니다",
  "width": 5.0,
  "depth": 4.0,
  "height": 2.5
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| name | string | ✓ | 공간명 (1~100자) |
| description | string | | 공간 설명 |
| width | number | ✓ | 가로 크기 (m, 1.0~50.0) |
| depth | number | ✓ | 세로 크기 (m, 1.0~50.0) |
| height | number | | 높이 (m, 기본 2.5) |

**Response (201 Created)**
```json
{
  "success": true,
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "name": "201호 원룸",
    "description": "깔끔한 원룸 숙소입니다",
    "width": 5.0,
    "depth": 4.0,
    "height": 2.5,
    "status": "draft",
    "floorPlanData": null,
    "thumbnailUrl": null,
    "publishedAt": null,
    "createdAt": "2024-12-10T10:30:00.000Z",
    "updatedAt": "2024-12-10T10:30:00.000Z"
  }
}
```

**Errors**
| 코드 | 설명 |
|------|------|
| SPACE_LIMIT_EXCEEDED | 플랜별 공간 생성 한도 초과 |
| INVALID_DIMENSIONS | 잘못된 크기 값 |

---

### 3.2 공간 목록 조회

관리자의 공간 목록을 조회합니다.

**Endpoint**
```
GET /spaces
```

**Query Parameters**
| 파라미터 | 타입 | 기본값 | 설명 |
|----------|------|--------|------|
| page | number | 1 | 페이지 번호 |
| limit | number | 20 | 페이지당 항목 수 (최대 50) |
| status | string | | 상태 필터 (draft/published/archived) |
| search | string | | 이름 검색 |
| sortBy | string | createdAt | 정렬 기준 |
| sortOrder | string | desc | 정렬 순서 (asc/desc) |

**Response (200 OK)**
```json
{
  "success": true,
  "data": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "name": "201호 원룸",
      "status": "published",
      "thumbnailUrl": "https://cdn.localrule.app/thumbnails/...",
      "objectCount": 12,
      "ruleCount": 25,
      "publishedAt": "2024-12-10T11:00:00.000Z",
      "createdAt": "2024-12-10T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 3,
    "totalPages": 1
  }
}
```

---

### 3.3 공간 상세 조회

특정 공간의 상세 정보를 조회합니다.

**Endpoint**
```
GET /spaces/:id
```

**Path Parameters**
| 파라미터 | 설명 |
|----------|------|
| id | 공간 UUID |

**Query Parameters**
| 파라미터 | 타입 | 설명 |
|----------|------|------|
| include | string | 포함할 관계 (objects,rules,triggers,mesh,qr) |

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "name": "201호 원룸",
    "description": "깔끔한 원룸 숙소입니다",
    "width": 5.0,
    "depth": 4.0,
    "height": 2.5,
    "status": "published",
    "floorPlanData": { ... },
    "thumbnailUrl": "https://cdn.localrule.app/thumbnails/...",
    "publishedAt": "2024-12-10T11:00:00.000Z",
    "createdAt": "2024-12-10T10:30:00.000Z",
    "updatedAt": "2024-12-10T11:00:00.000Z",
    "objects": [ ... ],
    "triggers": [ ... ],
    "mesh": { ... },
    "qrCode": { ... }
  }
}
```

---

### 3.4 공간 수정

공간 정보를 수정합니다.

**Endpoint**
```
PUT /spaces/:id
```

**Request Body**
```json
{
  "name": "201호 원룸 (리모델링)",
  "description": "새롭게 리모델링된 원룸입니다",
  "width": 5.5,
  "depth": 4.5,
  "height": 2.7,
  "floorPlanData": {
    "walls": [...],
    "doors": [...],
    "windows": [...]
  }
}
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "name": "201호 원룸 (리모델링)",
    ...
  }
}
```

---

### 3.5 공간 삭제

공간을 삭제합니다 (소프트 삭제, 30일 보관).

**Endpoint**
```
DELETE /spaces/:id
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "message": "Space deleted successfully",
    "deletedAt": "2024-12-10T12:00:00.000Z",
    "permanentDeleteAt": "2025-01-09T12:00:00.000Z"
  }
}
```

---

### 3.6 공간 상태 변경

공간의 발행 상태를 변경합니다.

**Endpoint**
```
PATCH /spaces/:id/status
```

**Request Body**
```json
{
  "status": "published"
}
```

| 상태 | 설명 |
|------|------|
| draft | 초안 (편집 중) |
| published | 발행됨 (게스트 접근 가능) |
| archived | 보관됨 (비활성화) |

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "status": "published",
    "publishedAt": "2024-12-10T11:00:00.000Z"
  }
}
```

---

### 3.7 삭제된 공간 목록 조회

소프트 삭제된 공간 목록을 조회합니다 (30일 이내 복구 가능).

**Endpoint**
```
GET /spaces/deleted
```

**Headers**
```
Authorization: Bearer {access_token}
```

**Query Parameters**
| 파라미터 | 타입 | 기본값 | 설명 |
|----------|------|--------|------|
| page | number | 1 | 페이지 번호 |
| limit | number | 20 | 페이지당 항목 수 |

**Response (200 OK)**
```json
{
  "success": true,
  "data": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "name": "201호 원룸",
      "deletedAt": "2024-12-10T12:00:00.000Z",
      "permanentDeleteAt": "2025-01-09T12:00:00.000Z",
      "daysRemaining": 30
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

---

### 3.8 삭제된 공간 복구

소프트 삭제된 공간을 복구합니다.

**Endpoint**
```
POST /spaces/:id/restore
```

**Headers**
```
Authorization: Bearer {access_token}
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "name": "201호 원룸",
    "status": "draft",
    "restoredAt": "2024-12-10T13:00:00.000Z"
  }
}
```

**Errors**
| 코드 | 설명 |
|------|------|
| SPACE_NOT_DELETED | 삭제되지 않은 공간 |
| SPACE_PERMANENTLY_DELETED | 영구 삭제된 공간 (30일 초과) |
| SPACE_LIMIT_EXCEEDED | 복구 시 공간 한도 초과 |

---

### 3.9 공간 복제

기존 공간을 복제하여 새 공간을 생성합니다.

**Endpoint**
```
POST /spaces/:id/duplicate
```

**Headers**
```
Authorization: Bearer {access_token}
```

**Request Body**
```json
{
  "name": "201호 원룸 (복사본)",
  "includeObjects": true,
  "includeRules": true,
  "includeTriggers": true
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| name | string | ✓ | 새 공간명 |
| includeObjects | boolean | | 객체 포함 여부 (기본 true) |
| includeRules | boolean | | 규칙 포함 여부 (기본 true) |
| includeTriggers | boolean | | 트리거 포함 여부 (기본 true) |

**Response (201 Created)**
```json
{
  "success": true,
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440099",
    "name": "201호 원룸 (복사본)",
    "status": "draft",
    "copiedFrom": "660e8400-e29b-41d4-a716-446655440001",
    "objectCount": 12,
    "ruleCount": 25,
    "triggerCount": 5,
    "createdAt": "2024-12-10T14:00:00.000Z"
  }
}
```

**Errors**
| 코드 | 설명 |
|------|------|
| SPACE_LIMIT_EXCEEDED | 플랜별 공간 생성 한도 초과 |

---

## 4. AR 메쉬 API

### 4.1 메쉬 업로드

공간의 AR 메쉬를 업로드합니다.

**Endpoint**
```
POST /spaces/:id/mesh
```

**Request Body (multipart/form-data)**
| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| file | file | ✓ | 메쉬 파일 (.obj, .glb, 최대 5MB) |
| metadata | json | | 메쉬 메타데이터 |

**Response (201 Created)**
```json
{
  "success": true,
  "data": {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "spaceId": "660e8400-e29b-41d4-a716-446655440001",
    "meshFileUrl": "https://cdn.localrule.app/meshes/...",
    "meshFormat": "glb",
    "fileSize": 2456789,
    "meshMetadata": {
      "vertices": 15000,
      "faces": 12000
    },
    "createdAt": "2024-12-10T10:30:00.000Z"
  }
}
```

**Errors**
| 코드 | 설명 |
|------|------|
| FILE_TOO_LARGE | 파일 크기 초과 (5MB) |
| INVALID_FILE_FORMAT | 지원하지 않는 파일 형식 |
| MESH_ALREADY_EXISTS | 이미 메쉬가 존재함 |

---

### 4.2 메쉬 조회

공간의 AR 메쉬를 조회합니다.

**Endpoint**
```
GET /spaces/:id/mesh
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "meshFileUrl": "https://cdn.localrule.app/meshes/...",
    "meshFormat": "glb",
    "fileSize": 2456789,
    "meshMetadata": { ... },
    "createdAt": "2024-12-10T10:30:00.000Z",
    "updatedAt": "2024-12-10T10:30:00.000Z"
  }
}
```

---

### 4.3 메쉬 삭제

공간의 AR 메쉬를 삭제합니다.

**Endpoint**
```
DELETE /spaces/:id/mesh
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "message": "Mesh deleted successfully"
  }
}
```

---

## 5. 객체 관리 API

### 5.1 객체 타입 목록 조회

시스템에서 제공하는 객체 타입 목록을 조회합니다.

**Endpoint**
```
GET /object-types
```

**Query Parameters**
| 파라미터 | 타입 | 설명 |
|----------|------|------|
| category | string | 카테고리 필터 (furniture/appliance/facility/other) |
| lang | string | 언어 코드 (ko/en/ja/zh) |

**Response (200 OK)**
```json
{
  "success": true,
  "data": [
    {
      "id": "880e8400-e29b-41d4-a716-446655440003",
      "name": "bed",
      "displayName": "침대",
      "category": "furniture",
      "icon": "🛏️",
      "defaultModelUrl": "https://cdn.localrule.app/models/system/bed.glb"
    },
    {
      "id": "880e8400-e29b-41d4-a716-446655440004",
      "name": "washer",
      "displayName": "세탁기",
      "category": "appliance",
      "icon": "🧺",
      "defaultModelUrl": "https://cdn.localrule.app/models/system/washer.glb"
    }
  ]
}
```

---

### 5.2 객체 배치

공간에 객체를 배치합니다.

**Endpoint**
```
POST /spaces/:id/objects
```

**Request Body**
```json
{
  "objectTypeId": "880e8400-e29b-41d4-a716-446655440003",
  "customName": "메인 침대",
  "position": {
    "x": 2.5,
    "y": 1.0,
    "z": 0
  },
  "rotation": {
    "x": 0,
    "y": 90,
    "z": 0
  },
  "scale": {
    "x": 1.0,
    "y": 1.0,
    "z": 1.0
  },
  "modelId": null,
  "isMlDetected": false,
  "mlConfidence": null
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| objectTypeId | uuid | ✓ | 객체 타입 ID |
| customName | string | | 사용자 지정 이름 |
| position | object | ✓ | 위치 좌표 (x, y, z) |
| rotation | object | | 회전 각도 (기본 0) |
| scale | object | | 스케일 (기본 1) |
| modelId | uuid | | 커스텀 3D 모델 ID |
| isMlDetected | boolean | | ML 자동 인식 여부 |
| mlConfidence | number | | ML 신뢰도 (0~1) |

**Response (201 Created)**
```json
{
  "success": true,
  "data": {
    "id": "990e8400-e29b-41d4-a716-446655440005",
    "spaceId": "660e8400-e29b-41d4-a716-446655440001",
    "objectType": {
      "id": "880e8400-e29b-41d4-a716-446655440003",
      "name": "bed",
      "displayName": "침대",
      "icon": "🛏️"
    },
    "customName": "메인 침대",
    "position": { "x": 2.5, "y": 1.0, "z": 0 },
    "rotation": { "x": 0, "y": 90, "z": 0 },
    "scale": { "x": 1.0, "y": 1.0, "z": 1.0 },
    "modelUrl": "https://cdn.localrule.app/models/system/bed.glb",
    "isMlDetected": false,
    "displayOrder": 0,
    "createdAt": "2024-12-10T10:30:00.000Z"
  }
}
```

**Errors**
| 코드 | 설명 |
|------|------|
| OBJECT_LIMIT_EXCEEDED | 공간당 객체 한도 초과 (50개) |
| INVALID_OBJECT_TYPE | 존재하지 않는 객체 타입 |
| INVALID_POSITION | 공간 범위를 벗어난 위치 |

---

### 5.3 객체 목록 조회

공간의 객체 목록을 조회합니다.

**Endpoint**
```
GET /spaces/:id/objects
```

**Query Parameters**
| 파라미터 | 타입 | 설명 |
|----------|------|------|
| include | string | 포함할 관계 (rules) |

**Response (200 OK)**
```json
{
  "success": true,
  "data": [
    {
      "id": "990e8400-e29b-41d4-a716-446655440005",
      "objectType": {
        "id": "880e8400-e29b-41d4-a716-446655440003",
        "name": "bed",
        "displayName": "침대",
        "icon": "🛏️"
      },
      "customName": "메인 침대",
      "position": { "x": 2.5, "y": 1.0, "z": 0 },
      "rotation": { "x": 0, "y": 90, "z": 0 },
      "scale": { "x": 1.0, "y": 1.0, "z": 1.0 },
      "modelUrl": "https://cdn.localrule.app/models/system/bed.glb",
      "ruleCount": 3,
      "rules": [...]
    }
  ]
}
```

---

### 5.4 객체 수정

객체 정보를 수정합니다.

**Endpoint**
```
PUT /objects/:id
```

**Request Body**
```json
{
  "customName": "킹사이즈 침대",
  "position": { "x": 2.0, "y": 1.5, "z": 0 },
  "rotation": { "x": 0, "y": 0, "z": 0 },
  "scale": { "x": 1.2, "y": 1.2, "z": 1.0 },
  "displayOrder": 1
}
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "id": "990e8400-e29b-41d4-a716-446655440005",
    "customName": "킹사이즈 침대",
    ...
  }
}
```

---

### 5.5 객체 삭제

객체를 삭제합니다 (연관된 규칙도 함께 삭제).

**Endpoint**
```
DELETE /objects/:id
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "message": "Object and associated rules deleted successfully",
    "deletedRulesCount": 3
  }
}
```

---

### 5.6 ML 객체 인식

이미지에서 객체를 자동 인식합니다.

**Endpoint**
```
POST /ml/detect
```

**Request Body (multipart/form-data)**
| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| image | file | ✓ | 이미지 파일 (jpg, png, 최대 10MB) |

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "detections": [
      {
        "objectType": {
          "id": "880e8400-e29b-41d4-a716-446655440003",
          "name": "bed",
          "displayName": "침대"
        },
        "confidence": 0.92,
        "boundingBox": {
          "x": 100,
          "y": 150,
          "width": 300,
          "height": 200
        }
      },
      {
        "objectType": {
          "id": "880e8400-e29b-41d4-a716-446655440004",
          "name": "washer",
          "displayName": "세탁기"
        },
        "confidence": 0.85,
        "boundingBox": {
          "x": 450,
          "y": 200,
          "width": 150,
          "height": 250
        }
      }
    ],
    "processingTime": 1.2
  }
}
```

---

## 6. LocalRule 관리 API

### 6.1 규칙 생성

객체에 규칙을 추가합니다.

**Endpoint**
```
POST /objects/:id/rules
```

**Request Body**
```json
{
  "title": "신발 벗기",
  "description": "침대에 올라갈 때는 반드시 신발을 벗어주세요. 침구류 오염 방지를 위한 규칙입니다.",
  "iconType": "prohibited",
  "priority": 1,
  "displayOrder": 0,
  "autoTranslate": true,
  "targetLanguages": ["en", "ja", "zh"]
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| title | string | ✓ | 규칙 제목 (1~30자) |
| description | string | ✓ | 규칙 설명 (1~200자) |
| iconType | string | ✓ | 아이콘 타입 (prohibited/warning/tip/info) |
| priority | number | | 우선순위 (1~10, 기본 5) |
| displayOrder | number | | 표시 순서 |
| autoTranslate | boolean | | 자동 번역 여부 |
| targetLanguages | array | | 번역 대상 언어 |

**Response (201 Created)**
```json
{
  "success": true,
  "data": {
    "id": "aa0e8400-e29b-41d4-a716-446655440006",
    "objectId": "990e8400-e29b-41d4-a716-446655440005",
    "title": "신발 벗기",
    "description": "침대에 올라갈 때는 반드시 신발을 벗어주세요...",
    "iconType": "prohibited",
    "priority": 1,
    "displayOrder": 0,
    "isActive": true,
    "translations": [
      {
        "language": "en",
        "title": "Take off shoes",
        "description": "Please take off your shoes when getting on the bed...",
        "isAutoTranslated": true
      },
      {
        "language": "ja",
        "title": "靴を脱いでください",
        "description": "ベッドに上がる際は必ず靴を脱いでください...",
        "isAutoTranslated": true
      }
    ],
    "createdAt": "2024-12-10T10:30:00.000Z"
  }
}
```

**Errors**
| 코드 | 설명 |
|------|------|
| RULE_LIMIT_EXCEEDED | 객체당 규칙 한도 초과 (10개) |
| TITLE_TOO_LONG | 제목 길이 초과 (30자) |
| DESCRIPTION_TOO_LONG | 설명 길이 초과 (200자) |

---

### 6.2 규칙 목록 조회

객체의 규칙 목록을 조회합니다.

**Endpoint**
```
GET /objects/:id/rules
```

**Query Parameters**
| 파라미터 | 타입 | 설명 |
|----------|------|------|
| lang | string | 번역 언어 (ko/en/ja/zh) |
| includeInactive | boolean | 비활성 규칙 포함 여부 |

**Response (200 OK)**
```json
{
  "success": true,
  "data": [
    {
      "id": "aa0e8400-e29b-41d4-a716-446655440006",
      "title": "신발 벗기",
      "description": "침대에 올라갈 때는...",
      "iconType": "prohibited",
      "priority": 1,
      "displayOrder": 0,
      "isActive": true,
      "image": {
        "url": "https://cdn.localrule.app/images/rules/...",
        "altText": "신발 벗는 모습"
      },
      "translations": [...]
    }
  ]
}
```

---

### 6.3 규칙 수정

규칙 정보를 수정합니다.

**Endpoint**
```
PUT /rules/:id
```

**Request Body**
```json
{
  "title": "신발 벗기 (필수)",
  "description": "침대에 올라갈 때는 반드시 신발을 벗어주세요.",
  "iconType": "prohibited",
  "priority": 1,
  "isActive": true
}
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "id": "aa0e8400-e29b-41d4-a716-446655440006",
    "title": "신발 벗기 (필수)",
    ...
  }
}
```

---

### 6.4 규칙 삭제

규칙을 삭제합니다.

**Endpoint**
```
DELETE /rules/:id
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "message": "Rule deleted successfully"
  }
}
```

---

### 6.5 규칙 이미지 업로드

규칙에 이미지를 첨부합니다.

**Endpoint**
```
POST /rules/:id/image
```

**Request Body (multipart/form-data)**
| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| file | file | ✓ | 이미지 파일 (jpg, png, 최대 2MB) |
| altText | string | | 대체 텍스트 |

**Response (201 Created)**
```json
{
  "success": true,
  "data": {
    "id": "bb0e8400-e29b-41d4-a716-446655440007",
    "ruleId": "aa0e8400-e29b-41d4-a716-446655440006",
    "imageUrl": "https://cdn.localrule.app/images/rules/...",
    "altText": "신발 벗는 모습",
    "fileSize": 156789,
    "createdAt": "2024-12-10T10:30:00.000Z"
  }
}
```

---

### 6.6 규칙 이미지 삭제

규칙에 첨부된 이미지를 삭제합니다.

**Endpoint**
```
DELETE /rules/:id/image
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "message": "Rule image deleted successfully"
  }
}
```

**Errors**
| 코드 | 설명 |
|------|------|
| IMAGE_NOT_FOUND | 이미지가 존재하지 않음 |

---

### 6.7 규칙 번역 수정

규칙의 특정 언어 번역을 수동으로 수정합니다.

**Endpoint**
```
PUT /rules/:id/translations/:language
```

**Path Parameters**
| 파라미터 | 설명 |
|----------|------|
| id | 규칙 UUID |
| language | 언어 코드 (ko/en/ja/zh) |

**Request Body**
```json
{
  "title": "Take off your shoes",
  "description": "Please remove your shoes before getting on the bed to keep the bedding clean."
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| title | string | ✓ | 번역된 제목 |
| description | string | ✓ | 번역된 설명 |

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "id": "tt0e8400-e29b-41d4-a716-446655440020",
    "ruleId": "aa0e8400-e29b-41d4-a716-446655440006",
    "language": "en",
    "title": "Take off your shoes",
    "description": "Please remove your shoes before getting on the bed to keep the bedding clean.",
    "isAutoTranslated": false,
    "updatedAt": "2024-12-10T11:00:00.000Z"
  }
}
```

---

### 6.8 규칙 순서 변경

객체 내 규칙들의 표시 순서를 일괄 변경합니다.

**Endpoint**
```
PUT /objects/:id/rules/order
```

**Request Body**
```json
{
  "ruleIds": [
    "aa0e8400-e29b-41d4-a716-446655440006",
    "aa0e8400-e29b-41d4-a716-446655440007",
    "aa0e8400-e29b-41d4-a716-446655440008"
  ]
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| ruleIds | array | ✓ | 순서대로 정렬된 규칙 ID 배열 |

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "message": "Rule order updated successfully",
    "updatedCount": 3
  }
}
```

---

## 7. 번역 API

### 7.1 텍스트 번역

텍스트를 다국어로 번역합니다.

**Endpoint**
```
POST /translate
```

**Request Body**
```json
{
  "text": "침대에 올라갈 때는 신발을 벗어주세요",
  "sourceLanguage": "ko",
  "targetLanguages": ["en", "ja", "zh"]
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| text | string | ✓ | 번역할 텍스트 |
| sourceLanguage | string | | 원본 언어 (기본 ko) |
| targetLanguages | array | ✓ | 대상 언어 배열 |

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "original": {
      "text": "침대에 올라갈 때는 신발을 벗어주세요",
      "language": "ko"
    },
    "translations": [
      {
        "language": "en",
        "text": "Please take off your shoes when getting on the bed"
      },
      {
        "language": "ja",
        "text": "ベッドに上がる際は靴を脱いでください"
      },
      {
        "language": "zh",
        "text": "上床时请脱鞋"
      }
    ]
  }
}
```

---

### 7.2 일괄 번역

여러 텍스트를 한 번에 번역합니다.

**Endpoint**
```
POST /translate/batch
```

**Request Body**
```json
{
  "items": [
    {
      "key": "title",
      "text": "신발 벗기"
    },
    {
      "key": "description",
      "text": "침대에 올라갈 때는 신발을 벗어주세요"
    }
  ],
  "sourceLanguage": "ko",
  "targetLanguages": ["en", "ja", "zh"]
}
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "translations": {
      "en": {
        "title": "Take off shoes",
        "description": "Please take off your shoes when getting on the bed"
      },
      "ja": {
        "title": "靴を脱いでください",
        "description": "ベッドに上がる際は靴を脱いでください"
      },
      "zh": {
        "title": "脱鞋",
        "description": "上床时请脱鞋"
      }
    }
  }
}
```

---

## 8. 트리거 존 API

### 8.1 트리거 존 생성

공간에 위치 기반 트리거 존을 생성합니다.

**Endpoint**
```
POST /spaces/:id/triggers
```

**Request Body**
```json
{
  "position": {
    "x": 1.5,
    "y": 2.0,
    "z": 0
  },
  "radius": 1.5,
  "triggerType": "warning",
  "message": "욕실 바닥이 미끄러워요. 천천히 걸어주세요.",
  "autoCloseSeconds": 5,
  "vibrationPattern": "short",
  "soundEffect": "ding",
  "autoTranslate": true,
  "targetLanguages": ["en", "ja", "zh"]
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| position | object | ✓ | 위치 좌표 (x, y, z) |
| radius | number | ✓ | 반경 (0.5~3.0m) |
| triggerType | string | ✓ | 타입 (warning/caution/info) |
| message | string | ✓ | 메시지 (1~100자) |
| autoCloseSeconds | number | | 자동 닫기 시간 (2~10초, null=수동) |
| vibrationPattern | string | | 진동 패턴 (none/short/long) |
| soundEffect | string | | 소리 효과 (none/ding/alert) |

**Response (201 Created)**
```json
{
  "success": true,
  "data": {
    "id": "cc0e8400-e29b-41d4-a716-446655440008",
    "spaceId": "660e8400-e29b-41d4-a716-446655440001",
    "position": { "x": 1.5, "y": 2.0, "z": 0 },
    "radius": 1.5,
    "triggerType": "warning",
    "message": "욕실 바닥이 미끄러워요...",
    "autoCloseSeconds": 5,
    "vibrationPattern": "short",
    "soundEffect": "ding",
    "isActive": true,
    "translations": [
      {
        "language": "en",
        "message": "The bathroom floor is slippery. Please walk slowly.",
        "isAutoTranslated": true
      }
    ],
    "createdAt": "2024-12-10T10:30:00.000Z"
  }
}
```

**Errors**
| 코드 | 설명 |
|------|------|
| TRIGGER_LIMIT_EXCEEDED | 공간당 트리거 한도 초과 (20개) |
| INVALID_RADIUS | 잘못된 반경 값 (0.5~3.0) |
| INVALID_POSITION | 공간 범위를 벗어난 위치 |

---

### 8.2 트리거 존 목록 조회

공간의 트리거 존 목록을 조회합니다.

**Endpoint**
```
GET /spaces/:id/triggers
```

**Query Parameters**
| 파라미터 | 타입 | 설명 |
|----------|------|------|
| lang | string | 번역 언어 |
| includeInactive | boolean | 비활성 트리거 포함 |

**Response (200 OK)**
```json
{
  "success": true,
  "data": [
    {
      "id": "cc0e8400-e29b-41d4-a716-446655440008",
      "position": { "x": 1.5, "y": 2.0, "z": 0 },
      "radius": 1.5,
      "triggerType": "warning",
      "message": "욕실 바닥이 미끄러워요...",
      "autoCloseSeconds": 5,
      "vibrationPattern": "short",
      "soundEffect": "ding",
      "isActive": true,
      "translations": [...]
    }
  ]
}
```

---

### 8.3 트리거 존 수정

트리거 존 정보를 수정합니다.

**Endpoint**
```
PUT /triggers/:id
```

**Request Body**
```json
{
  "radius": 2.0,
  "message": "욕실 바닥이 매우 미끄럽습니다!",
  "autoCloseSeconds": 3,
  "isActive": true
}
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "id": "cc0e8400-e29b-41d4-a716-446655440008",
    ...
  }
}
```

---

### 8.4 트리거 존 삭제

트리거 존을 삭제합니다.

**Endpoint**
```
DELETE /triggers/:id
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "message": "Trigger zone deleted successfully"
  }
}
```

---

## 9. QR 코드 API

### 9.1 QR 코드 생성

공간의 QR 코드를 생성합니다.

**Endpoint**
```
POST /spaces/:id/qr
```

**Request Body**
```json
{
  "regenerate": false
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| regenerate | boolean | 기존 QR 코드 재생성 여부 |

**Response (201 Created)**
```json
{
  "success": true,
  "data": {
    "id": "dd0e8400-e29b-41d4-a716-446655440009",
    "spaceId": "660e8400-e29b-41d4-a716-446655440001",
    "code": "LR-ABC123XYZ",
    "qrImageUrl": "https://cdn.localrule.app/qr/...",
    "scanCount": 0,
    "createdAt": "2024-12-10T10:30:00.000Z"
  }
}
```

---

### 9.2 QR 코드로 공간 조회 (게스트용)

QR 코드로 공간 정보를 조회합니다 (인증 불필요).

**Endpoint**
```
GET /qr/:code
```

**Path Parameters**
| 파라미터 | 설명 |
|----------|------|
| code | QR 코드 값 (예: LR-ABC123XYZ) |

**Query Parameters**
| 파라미터 | 타입 | 설명 |
|----------|------|------|
| lang | string | 언어 코드 (ko/en/ja/zh) |

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "space": {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "name": "201호 원룸",
      "description": "깔끔한 원룸 숙소입니다",
      "width": 5.0,
      "depth": 4.0,
      "height": 2.5,
      "thumbnailUrl": "https://cdn.localrule.app/thumbnails/..."
    },
    "mesh": {
      "meshFileUrl": "https://cdn.localrule.app/meshes/..."
    },
    "objects": [
      {
        "id": "990e8400-e29b-41d4-a716-446655440005",
        "objectType": {
          "name": "bed",
          "displayName": "침대",
          "icon": "🛏️"
        },
        "customName": "메인 침대",
        "position": { "x": 2.5, "y": 1.0, "z": 0 },
        "rotation": { "x": 0, "y": 90, "z": 0 },
        "scale": { "x": 1.0, "y": 1.0, "z": 1.0 },
        "modelUrl": "https://cdn.localrule.app/models/system/bed.glb",
        "rules": [
          {
            "id": "aa0e8400-e29b-41d4-a716-446655440006",
            "title": "Take off shoes",
            "description": "Please take off your shoes...",
            "iconType": "prohibited",
            "priority": 1,
            "image": {
              "url": "https://cdn.localrule.app/images/rules/..."
            }
          }
        ]
      }
    ],
    "triggers": [
      {
        "id": "cc0e8400-e29b-41d4-a716-446655440008",
        "position": { "x": 1.5, "y": 2.0, "z": 0 },
        "radius": 1.5,
        "triggerType": "warning",
        "message": "The bathroom floor is slippery...",
        "autoCloseSeconds": 5,
        "vibrationPattern": "short",
        "soundEffect": "ding"
      }
    ]
  }
}
```

**Errors**
| 코드 | 설명 |
|------|------|
| QR_NOT_FOUND | 존재하지 않는 QR 코드 |
| SPACE_NOT_PUBLISHED | 발행되지 않은 공간 |

---

### 9.3 QR 코드 조회 (관리자용)

공간의 QR 코드 정보를 조회합니다.

**Endpoint**
```
GET /spaces/:id/qr
```

**Headers**
```
Authorization: Bearer {access_token}
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "id": "dd0e8400-e29b-41d4-a716-446655440009",
    "spaceId": "660e8400-e29b-41d4-a716-446655440001",
    "code": "LR-ABC123XYZ",
    "qrImageUrl": "https://cdn.localrule.app/qr/...",
    "scanCount": 150,
    "lastScannedAt": "2024-12-10T15:30:00.000Z",
    "createdAt": "2024-12-10T10:30:00.000Z",
    "updatedAt": "2024-12-10T15:30:00.000Z"
  }
}
```

**Errors**
| 코드 | 설명 |
|------|------|
| QR_NOT_GENERATED | QR 코드가 아직 생성되지 않음 |

---

### 9.4 QR 코드 다운로드

QR 코드 이미지를 다운로드합니다.

**Endpoint**
```
GET /spaces/:id/qr/download
```

**Query Parameters**
| 파라미터 | 타입 | 기본값 | 설명 |
|----------|------|--------|------|
| format | string | png | 이미지 형식 (png/svg) |
| size | number | 300 | 이미지 크기 (px, 100~1000) |
| includeLabel | boolean | false | 공간명 라벨 포함 여부 |

**Response**
- Content-Type: image/png 또는 image/svg+xml
- 이미지 바이너리 데이터

---

### 9.5 QR 코드 재생성

기존 QR 코드를 무효화하고 새로운 코드를 생성합니다.

**Endpoint**
```
POST /spaces/:id/qr/regenerate
```

**Headers**
```
Authorization: Bearer {access_token}
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "id": "dd0e8400-e29b-41d4-a716-446655440010",
    "spaceId": "660e8400-e29b-41d4-a716-446655440001",
    "code": "LR-XYZ789ABC",
    "qrImageUrl": "https://cdn.localrule.app/qr/...",
    "previousCode": "LR-ABC123XYZ",
    "scanCount": 0,
    "createdAt": "2024-12-10T16:00:00.000Z"
  }
}
```

---

## 10. 파일 업로드 API

### 10.1 Presigned URL 발급

S3 직접 업로드를 위한 Presigned URL을 발급합니다.

**Endpoint**
```
GET /upload/presign
```

**Query Parameters**
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| fileType | string | ✓ | 파일 타입 (image/model/mesh) |
| fileName | string | ✓ | 파일명 |
| contentType | string | ✓ | MIME 타입 |

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "presignedUrl": "https://localrule-assets.s3.amazonaws.com/...",
    "key": "images/rules/abc123/image.jpg",
    "expiresIn": 900,
    "maxFileSize": 2097152
  }
}
```

---

### 10.2 이미지 업로드

이미지를 직접 업로드합니다.

**Endpoint**
```
POST /upload/image
```

**Request Body (multipart/form-data)**
| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| file | file | ✓ | 이미지 파일 (jpg, png, 최대 2MB) |
| purpose | string | ✓ | 용도 (rule/thumbnail) |

**Response (201 Created)**
```json
{
  "success": true,
  "data": {
    "id": "ee0e8400-e29b-41d4-a716-446655440010",
    "fileUrl": "https://cdn.localrule.app/images/...",
    "fileSize": 156789,
    "mimeType": "image/jpeg",
    "createdAt": "2024-12-10T10:30:00.000Z"
  }
}
```

---

### 10.3 3D 모델 업로드

3D 모델을 업로드합니다.

**Endpoint**
```
POST /upload/model
```

**Request Body (multipart/form-data)**
| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| file | file | ✓ | 3D 모델 파일 (.glb, 최대 10MB) |
| objectTypeId | uuid | ✓ | 객체 타입 ID |

**Response (201 Created)**
```json
{
  "success": true,
  "data": {
    "id": "ff0e8400-e29b-41d4-a716-446655440011",
    "modelUrl": "https://cdn.localrule.app/models/custom/...",
    "fileSize": 2456789,
    "polygonCount": 35000,
    "createdAt": "2024-12-10T10:30:00.000Z"
  }
}
```

---

## 11. 게스트 방문 API

### 11.1 방문 시작

게스트의 공간 방문을 시작합니다.

**Endpoint**
```
POST /visits/start
```

**Request Body**
```json
{
  "spaceId": "660e8400-e29b-41d4-a716-446655440001",
  "deviceId": "device_abc123",
  "language": "en",
  "mode": "vr"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| spaceId | uuid | ✓ | 공간 ID |
| deviceId | string | ✓ | 디바이스 식별자 |
| language | string | ✓ | 선택 언어 (ko/en/ja/zh) |
| mode | string | ✓ | 탐색 모드 (vr/ar) |

**Response (201 Created)**
```json
{
  "success": true,
  "data": {
    "id": "gg0e8400-e29b-41d4-a716-446655440012",
    "spaceId": "660e8400-e29b-41d4-a716-446655440001",
    "deviceId": "device_abc123",
    "language": "en",
    "mode": "vr",
    "startedAt": "2024-12-10T10:30:00.000Z"
  }
}
```

---

### 11.2 방문 종료

게스트의 공간 방문을 종료합니다.

**Endpoint**
```
POST /visits/:id/end
```

**Request Body**
```json
{
  "completedTour": true
}
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "id": "gg0e8400-e29b-41d4-a716-446655440012",
    "endedAt": "2024-12-10T10:45:00.000Z",
    "durationSeconds": 900,
    "completedTour": true
  }
}
```

---

### 11.3 이벤트 로그 기록

방문 중 발생한 이벤트를 기록합니다.

**Endpoint**
```
POST /visits/:id/log
```

**Request Body**
```json
{
  "eventType": "object_click",
  "referenceId": "990e8400-e29b-41d4-a716-446655440005",
  "eventData": {
    "position": { "x": 2.5, "y": 1.0, "z": 0 },
    "timestamp": "2024-12-10T10:35:00.000Z"
  }
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| eventType | string | ✓ | 이벤트 타입 |
| referenceId | uuid | | 참조 ID (객체/트리거 ID) |
| eventData | object | | 이벤트 상세 데이터 |

**이벤트 타입**
| 타입 | 설명 |
|------|------|
| object_click | 객체 클릭 |
| trigger_enter | 트리거 존 진입 |
| trigger_exit | 트리거 존 이탈 |
| mode_switch | 모드 전환 |
| calibration_complete | 센서 보정 완료 |

**Response (201 Created)**
```json
{
  "success": true,
  "data": {
    "id": "hh0e8400-e29b-41d4-a716-446655440013",
    "visitId": "gg0e8400-e29b-41d4-a716-446655440012",
    "eventType": "object_click",
    "createdAt": "2024-12-10T10:35:00.000Z"
  }
}
```

---

### 11.4 공간 통계 조회

공간의 방문 통계를 조회합니다.

**Endpoint**
```
GET /spaces/:id/stats
```

**Query Parameters**
| 파라미터 | 타입 | 설명 |
|----------|------|------|
| startDate | string | 시작 날짜 (YYYY-MM-DD) |
| endDate | string | 종료 날짜 (YYYY-MM-DD) |

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "totalVisits": 150,
    "uniqueDevices": 120,
    "averageDuration": 480,
    "completionRate": 0.85,
    "modeDistribution": {
      "vr": 0.75,
      "ar": 0.25
    },
    "languageDistribution": {
      "ko": 0.30,
      "en": 0.40,
      "ja": 0.20,
      "zh": 0.10
    },
    "topClickedObjects": [
      {
        "objectId": "990e8400-e29b-41d4-a716-446655440005",
        "objectName": "메인 침대",
        "clickCount": 45
      }
    ],
    "triggerActivations": [
      {
        "triggerId": "cc0e8400-e29b-41d4-a716-446655440008",
        "activationCount": 38
      }
    ]
  }
}
```

---

## 12. 에러 코드

### 12.1 HTTP 상태 코드

| 코드 | 설명 |
|------|------|
| 200 | 성공 |
| 201 | 생성 성공 |
| 400 | 잘못된 요청 |
| 401 | 인증 필요 |
| 403 | 권한 없음 |
| 404 | 리소스 없음 |
| 409 | 충돌 (중복) |
| 422 | 유효성 검증 실패 |
| 429 | 요청 한도 초과 |
| 500 | 서버 오류 |

### 12.2 비즈니스 에러 코드

| 코드 | HTTP | 설명 |
|------|------|------|
| AUTH_001 | 401 | 인증 토큰 없음 |
| AUTH_002 | 401 | 유효하지 않은 토큰 |
| AUTH_003 | 401 | 만료된 토큰 |
| AUTH_004 | 401 | 잘못된 자격 증명 |
| AUTH_005 | 403 | 권한 없음 |
| SPACE_001 | 404 | 공간 없음 |
| SPACE_002 | 409 | 공간 한도 초과 |
| SPACE_003 | 400 | 잘못된 공간 크기 |
| OBJECT_001 | 404 | 객체 없음 |
| OBJECT_002 | 409 | 객체 한도 초과 |
| RULE_001 | 404 | 규칙 없음 |
| RULE_002 | 409 | 규칙 한도 초과 |
| TRIGGER_001 | 404 | 트리거 없음 |
| TRIGGER_002 | 409 | 트리거 한도 초과 |
| FILE_001 | 400 | 파일 크기 초과 |
| FILE_002 | 400 | 지원하지 않는 파일 형식 |
| QR_001 | 404 | QR 코드 없음 |
| RATE_001 | 429 | 요청 한도 초과 |

---

## 13. 시스템 API

### 13.1 헬스체크

서버 상태를 확인합니다 (인증 불필요).

**Endpoint**
```
GET /health
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-12-10T10:30:00.000Z",
    "version": "1.0.0",
    "services": {
      "database": "healthy",
      "storage": "healthy",
      "translate": "healthy"
    }
  }
}
```

**Response (503 Service Unavailable)**
```json
{
  "success": false,
  "data": {
    "status": "unhealthy",
    "timestamp": "2024-12-10T10:30:00.000Z",
    "version": "1.0.0",
    "services": {
      "database": "unhealthy",
      "storage": "healthy",
      "translate": "healthy"
    }
  }
}
```

---

### 13.2 API 버전 정보

API 버전 및 지원 기능 정보를 조회합니다.

**Endpoint**
```
GET /version
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "apiVersion": "v1",
    "serverVersion": "1.0.0",
    "supportedLanguages": ["ko", "en", "ja", "zh"],
    "supportedModes": ["vr", "ar"],
    "limits": {
      "maxSpacesPerAdmin": {
        "free": 1,
        "basic": 5,
        "pro": 20,
        "enterprise": -1
      },
      "maxObjectsPerSpace": 50,
      "maxRulesPerObject": 10,
      "maxTriggersPerSpace": 20,
      "maxMeshFileSize": 5242880,
      "maxImageFileSize": 2097152,
      "maxModelFileSize": 10485760
    },
    "features": {
      "mlDetection": true,
      "autoTranslation": true,
      "arMode": true,
      "vrMode": true
    }
  }
}
```

---

## 14. 트리거 번역 API

### 14.1 트리거 번역 수정

트리거의 특정 언어 번역을 수동으로 수정합니다.

**Endpoint**
```
PUT /triggers/:id/translations/:language
```

**Path Parameters**
| 파라미터 | 설명 |
|----------|------|
| id | 트리거 UUID |
| language | 언어 코드 (ko/en/ja/zh) |

**Request Body**
```json
{
  "message": "The bathroom floor is very slippery. Please walk carefully."
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| message | string | ✓ | 번역된 메시지 (1~150자) |

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "id": "tt0e8400-e29b-41d4-a716-446655440030",
    "triggerId": "cc0e8400-e29b-41d4-a716-446655440008",
    "language": "en",
    "message": "The bathroom floor is very slippery. Please walk carefully.",
    "isAutoTranslated": false,
    "updatedAt": "2024-12-10T11:00:00.000Z"
  }
}
```

---

## 15. 객체 타입 API (추가)

### 15.1 객체 타입 상세 조회

특정 객체 타입의 상세 정보를 조회합니다.

**Endpoint**
```
GET /object-types/:id
```

**Path Parameters**
| 파라미터 | 설명 |
|----------|------|
| id | 객체 타입 UUID |

**Query Parameters**
| 파라미터 | 타입 | 설명 |
|----------|------|------|
| lang | string | 언어 코드 (ko/en/ja/zh) |
| includeModels | boolean | 3D 모델 목록 포함 여부 |

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "id": "880e8400-e29b-41d4-a716-446655440003",
    "name": "bed",
    "displayName": "침대",
    "category": "furniture",
    "icon": "🛏️",
    "defaultModelUrl": "https://cdn.localrule.app/models/system/bed.glb",
    "isSystem": true,
    "models": [
      {
        "id": "mm0e8400-e29b-41d4-a716-446655440001",
        "modelUrl": "https://cdn.localrule.app/models/system/bed.glb",
        "thumbnailUrl": "https://cdn.localrule.app/thumbnails/bed.jpg",
        "isDefault": true,
        "polygonCount": 12000
      },
      {
        "id": "mm0e8400-e29b-41d4-a716-446655440002",
        "modelUrl": "https://cdn.localrule.app/models/system/bed_king.glb",
        "thumbnailUrl": "https://cdn.localrule.app/thumbnails/bed_king.jpg",
        "isDefault": false,
        "polygonCount": 15000
      }
    ],
    "createdAt": "2024-12-01T00:00:00.000Z",
    "updatedAt": "2024-12-01T00:00:00.000Z"
  }
}
```

---

## 16. 에러 코드 (추가)

### 16.1 추가 비즈니스 에러 코드

| 코드 | HTTP | 설명 |
|------|------|------|
| AUTH_006 | 400 | 현재 비밀번호 불일치 |
| AUTH_007 | 400 | 새 비밀번호가 현재와 동일 |
| SPACE_004 | 404 | 삭제되지 않은 공간 (복구 불가) |
| SPACE_005 | 410 | 영구 삭제된 공간 |
| SPACE_006 | 409 | 복구 시 공간 한도 초과 |
| RULE_003 | 404 | 규칙 이미지 없음 |
| RULE_004 | 400 | 잘못된 규칙 순서 |
| QR_002 | 404 | QR 코드 미생성 |
| TRANSLATION_001 | 400 | 지원하지 않는 언어 |
| TRANSLATION_002 | 404 | 번역 없음 |
| VISIT_001 | 404 | 방문 기록 없음 |
| VISIT_002 | 400 | 이미 종료된 방문 |

---

## 부록 A: API 엔드포인트 요약

### 인증 API
| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| POST | /auth/register | 회원가입 | - |
| POST | /auth/login | 로그인 | - |
| POST | /auth/logout | 로그아웃 | ✓ |
| POST | /auth/refresh | 토큰 갱신 | - |
| POST | /auth/reset-password/request | 비밀번호 재설정 요청 | - |
| POST | /auth/reset-password/confirm | 비밀번호 재설정 확인 | - |
| GET | /auth/me | 내 정보 조회 | ✓ |
| PUT | /auth/me | 내 정보 수정 | ✓ |
| PUT | /auth/me/password | 비밀번호 변경 | ✓ |

### 공간 관리 API
| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| POST | /spaces | 공간 생성 | ✓ |
| GET | /spaces | 공간 목록 조회 | ✓ |
| GET | /spaces/:id | 공간 상세 조회 | ✓ |
| PUT | /spaces/:id | 공간 수정 | ✓ |
| DELETE | /spaces/:id | 공간 삭제 | ✓ |
| PATCH | /spaces/:id/status | 공간 상태 변경 | ✓ |
| GET | /spaces/deleted | 삭제된 공간 목록 | ✓ |
| POST | /spaces/:id/restore | 삭제된 공간 복구 | ✓ |
| POST | /spaces/:id/duplicate | 공간 복제 | ✓ |

### AR 메쉬 API
| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| POST | /spaces/:id/mesh | 메쉬 업로드 | ✓ |
| GET | /spaces/:id/mesh | 메쉬 조회 | ✓ |
| DELETE | /spaces/:id/mesh | 메쉬 삭제 | ✓ |

### 객체 관리 API
| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| GET | /object-types | 객체 타입 목록 | ✓ |
| GET | /object-types/:id | 객체 타입 상세 | ✓ |
| POST | /spaces/:id/objects | 객체 배치 | ✓ |
| GET | /spaces/:id/objects | 객체 목록 조회 | ✓ |
| PUT | /objects/:id | 객체 수정 | ✓ |
| DELETE | /objects/:id | 객체 삭제 | ✓ |
| POST | /ml/detect | ML 객체 인식 | ✓ |

### LocalRule 관리 API
| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| POST | /objects/:id/rules | 규칙 생성 | ✓ |
| GET | /objects/:id/rules | 규칙 목록 조회 | ✓ |
| PUT | /objects/:id/rules/order | 규칙 순서 변경 | ✓ |
| PUT | /rules/:id | 규칙 수정 | ✓ |
| DELETE | /rules/:id | 규칙 삭제 | ✓ |
| POST | /rules/:id/image | 규칙 이미지 업로드 | ✓ |
| DELETE | /rules/:id/image | 규칙 이미지 삭제 | ✓ |
| PUT | /rules/:id/translations/:lang | 규칙 번역 수정 | ✓ |

### 번역 API
| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| POST | /translate | 텍스트 번역 | ✓ |
| POST | /translate/batch | 일괄 번역 | ✓ |

### 트리거 존 API
| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| POST | /spaces/:id/triggers | 트리거 생성 | ✓ |
| GET | /spaces/:id/triggers | 트리거 목록 조회 | ✓ |
| PUT | /triggers/:id | 트리거 수정 | ✓ |
| DELETE | /triggers/:id | 트리거 삭제 | ✓ |
| PUT | /triggers/:id/translations/:lang | 트리거 번역 수정 | ✓ |

### QR 코드 API
| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| POST | /spaces/:id/qr | QR 생성 | ✓ |
| GET | /spaces/:id/qr | QR 조회 (관리자) | ✓ |
| GET | /spaces/:id/qr/download | QR 다운로드 | ✓ |
| POST | /spaces/:id/qr/regenerate | QR 재생성 | ✓ |
| GET | /qr/:code | QR로 공간 조회 (게스트) | - |

### 파일 업로드 API
| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| GET | /upload/presign | Presigned URL 발급 | ✓ |
| POST | /upload/image | 이미지 업로드 | ✓ |
| POST | /upload/model | 3D 모델 업로드 | ✓ |

### 게스트 방문 API
| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| POST | /visits/start | 방문 시작 | - |
| POST | /visits/:id/end | 방문 종료 | - |
| POST | /visits/:id/log | 이벤트 로그 | - |
| GET | /spaces/:id/stats | 공간 통계 조회 | ✓ |

### 시스템 API
| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| GET | /health | 헬스체크 | - |
| GET | /version | 버전 정보 | - |

---

**문서 버전**: 1.1  
**최종 수정**: 2024-12-10  
**변경 이력**:
- v1.0 (2024-12-10): 초안 작성
- v1.1 (2024-12-10): 관리자 프로필 API, 공간 복구/복제 API, 규칙 번역 수정 API, QR 관리 API, 시스템 API 추가

**다음 리뷰**: 개발 시작 후 1주
