# LocalRule Database ERD (Entity Relationship Diagram)

**프로젝트명**: LocalRule - 센서 기반 VR 공간 규칙 탐색 플랫폼  
**버전**: 1.0  
**작성일**: 2024-12-10  
**데이터베이스**: PostgreSQL 15

---

## 1. ERD 다이어그램

```mermaid
erDiagram
    %% 사용자 관련
    ADMIN ||--o{ SPACE : "creates"
    ADMIN {
        uuid id PK
        varchar email UK
        varchar password_hash
        varchar name
        varchar phone
        enum plan "free|basic|pro|enterprise"
        boolean is_active
        timestamp email_verified_at
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at
    }

    ADMIN_TOKEN ||--|| ADMIN : "belongs_to"
    ADMIN_TOKEN {
        uuid id PK
        uuid admin_id FK
        varchar refresh_token UK
        timestamp expires_at
        varchar device_info
        timestamp created_at
    }

    %% 공간 관련
    SPACE ||--o{ SPACE_OBJECT : "contains"
    SPACE ||--o| SPACE_MESH : "has"
    SPACE ||--o{ TRIGGER_ZONE : "has"
    SPACE ||--o| QR_CODE : "has"
    SPACE ||--o{ GUEST_VISIT : "visited_by"
    SPACE {
        uuid id PK
        uuid admin_id FK
        varchar name
        text description
        decimal width
        decimal height
        decimal depth
        enum status "draft|published|archived"
        jsonb floor_plan_data
        varchar thumbnail_url
        timestamp published_at
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at
    }

    SPACE_MESH {
        uuid id PK
        uuid space_id FK UK
        varchar mesh_file_url
        varchar mesh_format
        bigint file_size
        jsonb mesh_metadata
        timestamp created_at
        timestamp updated_at
    }

    %% 객체 관련
    SPACE_OBJECT ||--o{ LOCAL_RULE : "has"
    SPACE_OBJECT ||--o| OBJECT_MODEL : "uses"
    SPACE_OBJECT {
        uuid id PK
        uuid space_id FK
        uuid object_type_id FK
        uuid model_id FK "nullable"
        varchar custom_name
        decimal position_x
        decimal position_y
        decimal position_z
        decimal rotation_x
        decimal rotation_y
        decimal rotation_z
        decimal scale_x
        decimal scale_y
        decimal scale_z
        boolean is_ml_detected
        decimal ml_confidence
        integer display_order
        timestamp created_at
        timestamp updated_at
    }

    OBJECT_TYPE ||--o{ SPACE_OBJECT : "categorizes"
    OBJECT_TYPE ||--o| OBJECT_MODEL : "has_default"
    OBJECT_TYPE {
        uuid id PK
        varchar name UK
        varchar name_ko
        varchar name_en
        varchar name_ja
        varchar name_zh
        enum category "furniture|appliance|facility|other"
        varchar icon
        varchar default_model_url
        boolean is_system
        timestamp created_at
        timestamp updated_at
    }

    OBJECT_MODEL {
        uuid id PK
        uuid object_type_id FK
        varchar model_url
        varchar model_format
        bigint file_size
        integer polygon_count
        varchar thumbnail_url
        boolean is_default
        timestamp created_at
    }

    %% LocalRule 관련
    LOCAL_RULE ||--o{ RULE_TRANSLATION : "has"
    LOCAL_RULE ||--o| RULE_IMAGE : "has"
    LOCAL_RULE {
        uuid id PK
        uuid object_id FK
        varchar title
        text description
        enum icon_type "prohibited|warning|tip|info"
        integer priority
        integer display_order
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    RULE_TRANSLATION {
        uuid id PK
        uuid rule_id FK
        enum language "ko|en|ja|zh"
        varchar title
        text description
        boolean is_auto_translated
        timestamp created_at
        timestamp updated_at
    }

    RULE_IMAGE {
        uuid id PK
        uuid rule_id FK UK
        varchar image_url
        varchar alt_text
        bigint file_size
        timestamp created_at
    }

    %% 트리거 존 관련
    TRIGGER_ZONE ||--o{ TRIGGER_TRANSLATION : "has"
    TRIGGER_ZONE {
        uuid id PK
        uuid space_id FK
        decimal position_x
        decimal position_y
        decimal position_z
        decimal radius
        enum trigger_type "warning|caution|info"
        varchar message
        integer auto_close_seconds
        enum vibration_pattern "none|short|long"
        enum sound_effect "none|ding|alert"
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    TRIGGER_TRANSLATION {
        uuid id PK
        uuid trigger_id FK
        enum language "ko|en|ja|zh"
        varchar message
        boolean is_auto_translated
        timestamp created_at
        timestamp updated_at
    }

    %% QR 코드 관련
    QR_CODE {
        uuid id PK
        uuid space_id FK UK
        varchar code UK
        varchar qr_image_url
        integer scan_count
        timestamp last_scanned_at
        timestamp created_at
        timestamp updated_at
    }

    %% 게스트 관련
    GUEST_VISIT ||--o{ VISIT_LOG : "generates"
    GUEST_VISIT {
        uuid id PK
        uuid space_id FK
        varchar device_id
        enum language "ko|en|ja|zh"
        enum mode "vr|ar"
        timestamp started_at
        timestamp ended_at
        integer duration_seconds
        boolean completed_tour
        timestamp created_at
    }

    VISIT_LOG {
        uuid id PK
        uuid visit_id FK
        enum event_type "object_click|trigger_enter|trigger_exit|mode_switch|calibration_complete"
        uuid reference_id
        jsonb event_data
        timestamp created_at
    }

    %% 파일 업로드 관련
    FILE_UPLOAD {
        uuid id PK
        uuid admin_id FK
        enum file_type "image|model|mesh"
        varchar original_name
        varchar stored_name
        varchar file_url
        varchar mime_type
        bigint file_size
        enum status "pending|completed|failed"
        timestamp created_at
    }

    ADMIN ||--o{ FILE_UPLOAD : "uploads"

```

---

## 2. 테이블 상세 명세

### 2.1 관리자 (Admin) 테이블

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | UUID | PK | 관리자 고유 식별자 |
| email | VARCHAR(255) | UK, NOT NULL | 이메일 (로그인 ID) |
| password_hash | VARCHAR(255) | NOT NULL | bcrypt 해시 비밀번호 |
| name | VARCHAR(100) | NOT NULL | 관리자 이름 |
| phone | VARCHAR(20) | NULL | 연락처 |
| plan | ENUM | NOT NULL, DEFAULT 'free' | 요금제 (free/basic/pro/enterprise) |
| is_active | BOOLEAN | NOT NULL, DEFAULT true | 활성화 상태 |
| email_verified_at | TIMESTAMP | NULL | 이메일 인증 일시 |
| created_at | TIMESTAMP | NOT NULL | 생성 일시 |
| updated_at | TIMESTAMP | NOT NULL | 수정 일시 |
| deleted_at | TIMESTAMP | NULL | 삭제 일시 (소프트 삭제) |

**인덱스**:
- `idx_admin_email` ON email
- `idx_admin_deleted_at` ON deleted_at

---

### 2.2 관리자 토큰 (Admin Token) 테이블

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | UUID | PK | 토큰 고유 식별자 |
| admin_id | UUID | FK, NOT NULL | 관리자 ID |
| refresh_token | VARCHAR(500) | UK, NOT NULL | 리프레시 토큰 |
| expires_at | TIMESTAMP | NOT NULL | 만료 일시 |
| device_info | VARCHAR(255) | NULL | 디바이스 정보 |
| created_at | TIMESTAMP | NOT NULL | 생성 일시 |

**인덱스**:
- `idx_token_admin_id` ON admin_id
- `idx_token_expires_at` ON expires_at

---

### 2.3 공간 (Space) 테이블

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | UUID | PK | 공간 고유 식별자 |
| admin_id | UUID | FK, NOT NULL | 관리자 ID |
| name | VARCHAR(100) | NOT NULL | 공간명 (예: "201호 원룸") |
| description | TEXT | NULL | 공간 설명 |
| width | DECIMAL(5,2) | NOT NULL | 가로 크기 (m) |
| height | DECIMAL(5,2) | NOT NULL, DEFAULT 2.5 | 높이 (m) |
| depth | DECIMAL(5,2) | NOT NULL | 세로 크기 (m) |
| status | ENUM | NOT NULL, DEFAULT 'draft' | 상태 (draft/published/archived) |
| floor_plan_data | JSONB | NULL | 2D 도면 데이터 |
| thumbnail_url | VARCHAR(500) | NULL | 썸네일 이미지 URL |
| published_at | TIMESTAMP | NULL | 발행 일시 |
| created_at | TIMESTAMP | NOT NULL | 생성 일시 |
| updated_at | TIMESTAMP | NOT NULL | 수정 일시 |
| deleted_at | TIMESTAMP | NULL | 삭제 일시 (30일 보관) |

**인덱스**:
- `idx_space_admin_id` ON admin_id
- `idx_space_status` ON status
- `idx_space_deleted_at` ON deleted_at

**제약조건**:
- 무료 플랜: 관리자당 최대 1개 공간
- 공간당 최대 50개 객체

---

### 2.4 공간 메쉬 (Space Mesh) 테이블

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | UUID | PK | 메쉬 고유 식별자 |
| space_id | UUID | FK, UK, NOT NULL | 공간 ID (1:1 관계) |
| mesh_file_url | VARCHAR(500) | NOT NULL | S3 메쉬 파일 URL |
| mesh_format | VARCHAR(20) | NOT NULL | 파일 형식 (.obj, .glb) |
| file_size | BIGINT | NOT NULL | 파일 크기 (bytes, 최대 5MB) |
| mesh_metadata | JSONB | NULL | 메쉬 메타데이터 |
| created_at | TIMESTAMP | NOT NULL | 생성 일시 |
| updated_at | TIMESTAMP | NOT NULL | 수정 일시 |

**제약조건**:
- file_size <= 5242880 (5MB)

---

### 2.5 객체 타입 (Object Type) 테이블

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | UUID | PK | 객체 타입 고유 식별자 |
| name | VARCHAR(50) | UK, NOT NULL | 객체 타입명 (영문) |
| name_ko | VARCHAR(50) | NOT NULL | 한국어명 |
| name_en | VARCHAR(50) | NOT NULL | 영어명 |
| name_ja | VARCHAR(50) | NULL | 일본어명 |
| name_zh | VARCHAR(50) | NULL | 중국어명 |
| category | ENUM | NOT NULL | 카테고리 (furniture/appliance/facility/other) |
| icon | VARCHAR(50) | NULL | 아이콘 이모지 |
| default_model_url | VARCHAR(500) | NULL | 기본 3D 모델 URL |
| is_system | BOOLEAN | NOT NULL, DEFAULT true | 시스템 제공 여부 |
| created_at | TIMESTAMP | NOT NULL | 생성 일시 |
| updated_at | TIMESTAMP | NOT NULL | 수정 일시 |

**기본 데이터 (시드)**:
```
가구: bed(침대), sofa(소파), chair(의자), desk(책상), wardrobe(옷장)
가전: washer(세탁기), refrigerator(냉장고), aircon(에어컨), tv(TV), microwave(전자레인지)
시설: bathroom(욕실), shower(샤워기), sink(세면대), toilet(화장실)
```

---

### 2.6 객체 모델 (Object Model) 테이블

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | UUID | PK | 모델 고유 식별자 |
| object_type_id | UUID | FK, NOT NULL | 객체 타입 ID |
| model_url | VARCHAR(500) | NOT NULL | 3D 모델 파일 URL (.glb) |
| model_format | VARCHAR(20) | NOT NULL | 파일 형식 |
| file_size | BIGINT | NOT NULL | 파일 크기 (bytes) |
| polygon_count | INTEGER | NOT NULL | 폴리곤 수 (최대 50,000) |
| thumbnail_url | VARCHAR(500) | NULL | 썸네일 URL |
| is_default | BOOLEAN | NOT NULL, DEFAULT false | 기본 모델 여부 |
| created_at | TIMESTAMP | NOT NULL | 생성 일시 |

**제약조건**:
- polygon_count <= 50000

---

### 2.7 공간 객체 (Space Object) 테이블

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | UUID | PK | 객체 고유 식별자 |
| space_id | UUID | FK, NOT NULL | 공간 ID |
| object_type_id | UUID | FK, NOT NULL | 객체 타입 ID |
| custom_name | VARCHAR(100) | NULL | 사용자 지정 이름 |
| position_x | DECIMAL(8,4) | NOT NULL | X 좌표 (m) |
| position_y | DECIMAL(8,4) | NOT NULL | Y 좌표 (m) |
| position_z | DECIMAL(8,4) | NOT NULL, DEFAULT 0 | Z 좌표 (m) |
| rotation_x | DECIMAL(8,4) | NOT NULL, DEFAULT 0 | X축 회전 (도) |
| rotation_y | DECIMAL(8,4) | NOT NULL, DEFAULT 0 | Y축 회전 (도) |
| rotation_z | DECIMAL(8,4) | NOT NULL, DEFAULT 0 | Z축 회전 (도) |
| scale_x | DECIMAL(5,3) | NOT NULL, DEFAULT 1 | X축 스케일 |
| scale_y | DECIMAL(5,3) | NOT NULL, DEFAULT 1 | Y축 스케일 |
| scale_z | DECIMAL(5,3) | NOT NULL, DEFAULT 1 | Z축 스케일 |
| model_id | UUID | FK, NULL | 커스텀 3D 모델 ID (NULL이면 기본 모델) |
| is_ml_detected | BOOLEAN | NOT NULL, DEFAULT false | ML 자동 인식 여부 |
| ml_confidence | DECIMAL(5,4) | NULL | ML 신뢰도 (0~1) |
| display_order | INTEGER | NOT NULL, DEFAULT 0 | 표시 순서 |
| created_at | TIMESTAMP | NOT NULL | 생성 일시 |
| updated_at | TIMESTAMP | NOT NULL | 수정 일시 |

**인덱스**:
- `idx_object_space_id` ON space_id
- `idx_object_model_id` ON model_id

**제약조건**:
- 공간당 최대 50개 객체

---

### 2.8 LocalRule 테이블

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | UUID | PK | 규칙 고유 식별자 |
| object_id | UUID | FK, NOT NULL | 객체 ID |
| title | VARCHAR(30) | NOT NULL | 규칙 제목 (30자 이하) |
| description | TEXT | NOT NULL | 규칙 설명 (200자 이하) |
| icon_type | ENUM | NOT NULL | 아이콘 타입 (prohibited/warning/tip/info) |
| priority | INTEGER | NOT NULL, DEFAULT 5 | 우선순위 (1~10) |
| display_order | INTEGER | NOT NULL, DEFAULT 0 | 표시 순서 |
| is_active | BOOLEAN | NOT NULL, DEFAULT true | 활성화 상태 |
| created_at | TIMESTAMP | NOT NULL | 생성 일시 |
| updated_at | TIMESTAMP | NOT NULL | 수정 일시 |

**인덱스**:
- `idx_rule_object_id` ON object_id

**제약조건**:
- 객체당 최대 10개 규칙
- description 길이 <= 200

---

### 2.9 규칙 번역 (Rule Translation) 테이블

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | UUID | PK | 번역 고유 식별자 |
| rule_id | UUID | FK, NOT NULL | 규칙 ID |
| language | ENUM | NOT NULL | 언어 코드 (ko/en/ja/zh) |
| title | VARCHAR(50) | NOT NULL | 번역된 제목 |
| description | TEXT | NOT NULL | 번역된 설명 |
| is_auto_translated | BOOLEAN | NOT NULL, DEFAULT true | 자동 번역 여부 |
| created_at | TIMESTAMP | NOT NULL | 생성 일시 |
| updated_at | TIMESTAMP | NOT NULL | 수정 일시 |

**인덱스**:
- `idx_rule_trans_rule_id` ON rule_id
- `idx_rule_trans_language` ON language

**유니크 제약**:
- (rule_id, language) UNIQUE

---

### 2.10 규칙 이미지 (Rule Image) 테이블

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | UUID | PK | 이미지 고유 식별자 |
| rule_id | UUID | FK, UK, NOT NULL | 규칙 ID (1:1 관계) |
| image_url | VARCHAR(500) | NOT NULL | S3 이미지 URL |
| alt_text | VARCHAR(200) | NULL | 대체 텍스트 |
| file_size | BIGINT | NOT NULL | 파일 크기 (bytes, 최대 2MB) |
| created_at | TIMESTAMP | NOT NULL | 생성 일시 |

**제약조건**:
- file_size <= 2097152 (2MB)

---

### 2.11 트리거 존 (Trigger Zone) 테이블

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | UUID | PK | 트리거 고유 식별자 |
| space_id | UUID | FK, NOT NULL | 공간 ID |
| position_x | DECIMAL(8,4) | NOT NULL | X 좌표 (m) |
| position_y | DECIMAL(8,4) | NOT NULL | Y 좌표 (m) |
| position_z | DECIMAL(8,4) | NOT NULL, DEFAULT 0 | Z 좌표 (m) |
| radius | DECIMAL(4,2) | NOT NULL | 반경 (0.5~3.0m) |
| trigger_type | ENUM | NOT NULL | 타입 (warning/caution/info) |
| message | VARCHAR(100) | NOT NULL | 메시지 (100자 이하) |
| auto_close_seconds | INTEGER | NULL | 자동 닫기 시간 (2~10초, NULL=수동) |
| vibration_pattern | ENUM | NOT NULL, DEFAULT 'none' | 진동 패턴 (none/short/long) |
| sound_effect | ENUM | NOT NULL, DEFAULT 'none' | 소리 효과 (none/ding/alert) |
| is_active | BOOLEAN | NOT NULL, DEFAULT true | 활성화 상태 |
| created_at | TIMESTAMP | NOT NULL | 생성 일시 |
| updated_at | TIMESTAMP | NOT NULL | 수정 일시 |

**인덱스**:
- `idx_trigger_space_id` ON space_id

**제약조건**:
- 공간당 최대 20개 트리거 존
- radius BETWEEN 0.5 AND 3.0
- auto_close_seconds BETWEEN 2 AND 10 OR NULL

---

### 2.12 트리거 번역 (Trigger Translation) 테이블

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | UUID | PK | 번역 고유 식별자 |
| trigger_id | UUID | FK, NOT NULL | 트리거 ID |
| language | ENUM | NOT NULL | 언어 코드 (ko/en/ja/zh) |
| message | VARCHAR(150) | NOT NULL | 번역된 메시지 |
| is_auto_translated | BOOLEAN | NOT NULL, DEFAULT true | 자동 번역 여부 |
| created_at | TIMESTAMP | NOT NULL | 생성 일시 |
| updated_at | TIMESTAMP | NOT NULL | 수정 일시 |

**유니크 제약**:
- (trigger_id, language) UNIQUE

---

### 2.13 QR 코드 (QR Code) 테이블

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | UUID | PK | QR 고유 식별자 |
| space_id | UUID | FK, UK, NOT NULL | 공간 ID (1:1 관계) |
| code | VARCHAR(20) | UK, NOT NULL | QR 코드 값 (고유) |
| qr_image_url | VARCHAR(500) | NOT NULL | QR 이미지 URL |
| scan_count | INTEGER | NOT NULL, DEFAULT 0 | 스캔 횟수 |
| last_scanned_at | TIMESTAMP | NULL | 마지막 스캔 일시 |
| created_at | TIMESTAMP | NOT NULL | 생성 일시 |
| updated_at | TIMESTAMP | NOT NULL | 수정 일시 |

**인덱스**:
- `idx_qr_code` ON code

---

### 2.14 게스트 방문 (Guest Visit) 테이블

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | UUID | PK | 방문 고유 식별자 |
| space_id | UUID | FK, NOT NULL | 공간 ID |
| device_id | VARCHAR(100) | NOT NULL | 디바이스 식별자 |
| language | ENUM | NOT NULL | 선택 언어 (ko/en/ja/zh) |
| mode | ENUM | NOT NULL | 탐색 모드 (vr/ar) |
| started_at | TIMESTAMP | NOT NULL | 시작 일시 |
| ended_at | TIMESTAMP | NULL | 종료 일시 |
| duration_seconds | INTEGER | NULL | 체류 시간 (초) |
| completed_tour | BOOLEAN | NOT NULL, DEFAULT false | 투어 완료 여부 |
| created_at | TIMESTAMP | NOT NULL | 생성 일시 |

**인덱스**:
- `idx_visit_space_id` ON space_id
- `idx_visit_started_at` ON started_at

---

### 2.15 방문 로그 (Visit Log) 테이블

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | UUID | PK | 로그 고유 식별자 |
| visit_id | UUID | FK, NOT NULL | 방문 ID |
| event_type | ENUM | NOT NULL | 이벤트 타입 |
| reference_id | UUID | NULL | 참조 ID (객체/트리거 ID) |
| event_data | JSONB | NULL | 이벤트 상세 데이터 |
| created_at | TIMESTAMP | NOT NULL | 생성 일시 |

**이벤트 타입**:
- `object_click`: 객체 클릭
- `trigger_enter`: 트리거 존 진입
- `trigger_exit`: 트리거 존 이탈
- `mode_switch`: 모드 전환
- `calibration_complete`: 센서 보정 완료

**인덱스**:
- `idx_log_visit_id` ON visit_id
- `idx_log_event_type` ON event_type

---

### 2.16 파일 업로드 (File Upload) 테이블

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | UUID | PK | 파일 고유 식별자 |
| admin_id | UUID | FK, NOT NULL | 관리자 ID |
| file_type | ENUM | NOT NULL | 파일 타입 (image/model/mesh) |
| original_name | VARCHAR(255) | NOT NULL | 원본 파일명 |
| stored_name | VARCHAR(255) | NOT NULL | 저장 파일명 |
| file_url | VARCHAR(500) | NOT NULL | S3 URL |
| mime_type | VARCHAR(100) | NOT NULL | MIME 타입 |
| file_size | BIGINT | NOT NULL | 파일 크기 (bytes) |
| status | ENUM | NOT NULL, DEFAULT 'pending' | 상태 (pending/completed/failed) |
| created_at | TIMESTAMP | NOT NULL | 생성 일시 |

**인덱스**:
- `idx_upload_admin_id` ON admin_id

---

## 3. ENUM 타입 정의

```sql
-- 요금제
CREATE TYPE plan_type AS ENUM ('free', 'basic', 'pro', 'enterprise');

-- 공간 상태
CREATE TYPE space_status AS ENUM ('draft', 'published', 'archived');

-- 객체 카테고리
CREATE TYPE object_category AS ENUM ('furniture', 'appliance', 'facility', 'other');

-- 규칙 아이콘 타입
CREATE TYPE icon_type AS ENUM ('prohibited', 'warning', 'tip', 'info');

-- 트리거 타입
CREATE TYPE trigger_type AS ENUM ('warning', 'caution', 'info');

-- 진동 패턴
CREATE TYPE vibration_pattern AS ENUM ('none', 'short', 'long');

-- 소리 효과
CREATE TYPE sound_effect AS ENUM ('none', 'ding', 'alert');

-- 언어 코드
CREATE TYPE language_code AS ENUM ('ko', 'en', 'ja', 'zh');

-- 탐색 모드
CREATE TYPE explore_mode AS ENUM ('vr', 'ar');

-- 이벤트 타입
CREATE TYPE event_type AS ENUM ('object_click', 'trigger_enter', 'trigger_exit', 'mode_switch', 'calibration_complete');

-- 파일 타입
CREATE TYPE file_type AS ENUM ('image', 'model', 'mesh');

-- 업로드 상태
CREATE TYPE upload_status AS ENUM ('pending', 'completed', 'failed');
```

---

## 4. 관계 요약

| 관계 | 타입 | 설명 |
|------|------|------|
| Admin → Space | 1:N | 관리자는 여러 공간 생성 가능 |
| Admin → Admin_Token | 1:N | 관리자는 여러 토큰 보유 가능 |
| Admin → File_Upload | 1:N | 관리자는 여러 파일 업로드 가능 |
| Space → Space_Mesh | 1:1 | 공간당 하나의 AR 메쉬 |
| Space → Space_Object | 1:N | 공간에 여러 객체 배치 |
| Space → Trigger_Zone | 1:N | 공간에 여러 트리거 존 |
| Space → QR_Code | 1:1 | 공간당 하나의 QR 코드 |
| Space → Guest_Visit | 1:N | 공간에 여러 방문 기록 |
| Object_Type → Space_Object | 1:N | 객체 타입별 여러 인스턴스 |
| Object_Type → Object_Model | 1:N | 객체 타입별 여러 3D 모델 |
| Object_Model → Space_Object | 1:N | 모델별 여러 객체 인스턴스 (선택적) |
| Space_Object → Local_Rule | 1:N | 객체당 여러 규칙 |
| Local_Rule → Rule_Translation | 1:N | 규칙당 여러 번역 |
| Local_Rule → Rule_Image | 1:1 | 규칙당 하나의 이미지 |
| Trigger_Zone → Trigger_Translation | 1:N | 트리거당 여러 번역 |
| Guest_Visit → Visit_Log | 1:N | 방문당 여러 로그 |

---

## 5. 비즈니스 규칙 제약

| 규칙 | 테이블 | 제약 |
|------|--------|------|
| 무료 플랜 공간 제한 | Space | admin.plan = 'free' → COUNT(spaces) <= 1 |
| 공간당 객체 제한 | Space_Object | COUNT per space <= 50 |
| 객체당 규칙 제한 | Local_Rule | COUNT per object <= 10 |
| 공간당 트리거 제한 | Trigger_Zone | COUNT per space <= 20 |
| 메쉬 파일 크기 | Space_Mesh | file_size <= 5MB |
| 이미지 파일 크기 | Rule_Image | file_size <= 2MB |
| 폴리곤 수 제한 | Object_Model | polygon_count <= 50,000 |
| 소프트 삭제 보관 | Space | deleted_at 후 30일 보관 |
| 최근 방문 히스토리 | Guest_Visit | device_id당 최대 10개 |

---

## 6. 인덱스 전략

### 6.1 Primary Key 인덱스
- 모든 테이블의 `id` 컬럼에 자동 생성

### 6.2 Foreign Key 인덱스
- 모든 FK 컬럼에 인덱스 생성 (조인 성능)

### 6.3 검색 최적화 인덱스
```sql
-- 관리자 이메일 검색
CREATE INDEX idx_admin_email ON admin(email);

-- 공간 상태별 조회
CREATE INDEX idx_space_status ON space(status) WHERE deleted_at IS NULL;

-- QR 코드 조회
CREATE INDEX idx_qr_code ON qr_code(code);

-- 방문 통계
CREATE INDEX idx_visit_space_date ON guest_visit(space_id, started_at);
```

---

## 7. 데이터 마이그레이션 고려사항

### 7.1 초기 시드 데이터
- Object_Type: 14개 기본 객체 타입
- Object_Model: 기본 3D 모델

### 7.2 버전 관리
- Prisma Migration 사용
- 마이그레이션 히스토리 관리

### 7.3 백업 정책
- RDS 자동 백업 (일일)
- 30일 보관
- Point-in-time Recovery 활성화

---

**문서 버전**: 1.0  
**최종 수정**: 2024-12-10  
**다음 리뷰**: 개발 시작 후 1주
