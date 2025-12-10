# LocalRule Database Schema 상세 문서

**프로젝트명**: LocalRule - 센서 기반 VR 공간 규칙 탐색 플랫폼  
**버전**: 1.0  
**작성일**: 2024-12-10  
**데이터베이스**: PostgreSQL 15  
**ORM**: Prisma

---

## 목차

1. [개요](#1-개요)
2. [ENUM 타입 정의](#2-enum-타입-정의)
3. [테이블 DDL 스크립트](#3-테이블-ddl-스크립트)
4. [인덱스 정의](#4-인덱스-정의)
5. [제약조건 및 트리거](#5-제약조건-및-트리거)
6. [Prisma 스키마](#6-prisma-스키마)
7. [시드 데이터](#7-시드-데이터)
8. [쿼리 예제](#8-쿼리-예제)

---

## 1. 개요

### 1.1 데이터베이스 구성

| 항목 | 값 |
|------|-----|
| DBMS | PostgreSQL 15 |
| Character Set | UTF-8 |
| Collation | ko_KR.UTF-8 |
| Time Zone | Asia/Seoul |
| 총 테이블 수 | 16개 |
| 총 ENUM 타입 | 12개 |


### 1.2 테이블 목록

| No | 테이블명 | 한글명 | 설명 | 예상 레코드 수 |
|----|----------|--------|------|----------------|
| 1 | admin | 관리자 | 시스템 관리자 계정 | ~10,000 |
| 2 | admin_token | 관리자 토큰 | JWT 리프레시 토큰 | ~30,000 |
| 3 | space | 공간 | VR/AR 공간 정보 | ~50,000 |
| 4 | space_mesh | 공간 메쉬 | AR 3D 메쉬 데이터 | ~50,000 |
| 5 | object_type | 객체 타입 | 객체 분류 마스터 | ~50 |
| 6 | object_model | 객체 모델 | 3D 모델 파일 | ~200 |
| 7 | space_object | 공간 객체 | 공간 내 배치 객체 | ~500,000 |
| 8 | local_rule | 로컬 규칙 | 객체별 규칙 | ~1,000,000 |
| 9 | rule_translation | 규칙 번역 | 다국어 번역 | ~4,000,000 |
| 10 | rule_image | 규칙 이미지 | 규칙 첨부 이미지 | ~500,000 |
| 11 | trigger_zone | 트리거 존 | 위치 기반 트리거 | ~200,000 |
| 12 | trigger_translation | 트리거 번역 | 트리거 다국어 | ~800,000 |
| 13 | qr_code | QR 코드 | 공간 접근 QR | ~50,000 |
| 14 | guest_visit | 게스트 방문 | 방문 세션 기록 | ~10,000,000 |
| 15 | visit_log | 방문 로그 | 상세 이벤트 로그 | ~100,000,000 |
| 16 | file_upload | 파일 업로드 | 업로드 파일 관리 | ~1,000,000 |

---

## 2. ENUM 타입 정의

### 2.1 DDL 스크립트

```sql
-- =====================================================
-- ENUM 타입 생성 스크립트
-- =====================================================

-- 요금제 타입
CREATE TYPE plan_type AS ENUM ('free', 'basic', 'pro', 'enterprise');
COMMENT ON TYPE plan_type IS '관리자 요금제 구분';

-- 공간 상태
CREATE TYPE space_status AS ENUM ('draft', 'published', 'archived');
COMMENT ON TYPE space_status IS '공간 발행 상태';

-- 객체 카테고리
CREATE TYPE object_category AS ENUM ('furniture', 'appliance', 'facility', 'other');
COMMENT ON TYPE object_category IS '객체 분류 카테고리';

-- 규칙 아이콘 타입
CREATE TYPE icon_type AS ENUM ('prohibited', 'warning', 'tip', 'info');
COMMENT ON TYPE icon_type IS '규칙 표시 아이콘 종류';

-- 트리거 타입
CREATE TYPE trigger_type AS ENUM ('warning', 'caution', 'info');
COMMENT ON TYPE trigger_type IS '트리거 존 알림 타입';

-- 진동 패턴
CREATE TYPE vibration_pattern AS ENUM ('none', 'short', 'long');
COMMENT ON TYPE vibration_pattern IS '햅틱 진동 패턴';

-- 소리 효과
CREATE TYPE sound_effect AS ENUM ('none', 'ding', 'alert');
COMMENT ON TYPE sound_effect IS '알림 소리 효과';

-- 언어 코드
CREATE TYPE language_code AS ENUM ('ko', 'en', 'ja', 'zh');
COMMENT ON TYPE language_code IS '지원 언어 코드 (ISO 639-1)';

-- 탐색 모드
CREATE TYPE explore_mode AS ENUM ('vr', 'ar');
COMMENT ON TYPE explore_mode IS 'VR/AR 탐색 모드';

-- 이벤트 타입
CREATE TYPE event_type AS ENUM (
    'object_click', 
    'trigger_enter', 
    'trigger_exit', 
    'mode_switch', 
    'calibration_complete'
);
COMMENT ON TYPE event_type IS '방문 로그 이벤트 종류';

-- 파일 타입
CREATE TYPE file_type AS ENUM ('image', 'model', 'mesh');
COMMENT ON TYPE file_type IS '업로드 파일 종류';

-- 업로드 상태
CREATE TYPE upload_status AS ENUM ('pending', 'completed', 'failed');
COMMENT ON TYPE upload_status IS '파일 업로드 처리 상태';
```


### 2.2 ENUM 값 상세

| ENUM 타입 | 값 | 설명 |
|-----------|-----|------|
| **plan_type** | free | 무료 플랜 (공간 1개) |
| | basic | 기본 플랜 (공간 5개) |
| | pro | 프로 플랜 (공간 20개) |
| | enterprise | 엔터프라이즈 (무제한) |
| **space_status** | draft | 작성 중 (비공개) |
| | published | 발행됨 (공개) |
| | archived | 보관됨 (비활성) |
| **object_category** | furniture | 가구류 |
| | appliance | 가전제품 |
| | facility | 시설물 |
| | other | 기타 |
| **icon_type** | prohibited | 금지 (🚫) |
| | warning | 경고 (⚠️) |
| | tip | 팁 (💡) |
| | info | 정보 (ℹ️) |
| **trigger_type** | warning | 경고 알림 |
| | caution | 주의 알림 |
| | info | 정보 알림 |
| **vibration_pattern** | none | 진동 없음 |
| | short | 짧은 진동 (100ms) |
| | long | 긴 진동 (300ms) |
| **sound_effect** | none | 소리 없음 |
| | ding | 딩 소리 |
| | alert | 경고음 |
| **language_code** | ko | 한국어 |
| | en | 영어 |
| | ja | 일본어 |
| | zh | 중국어 (간체) |
| **explore_mode** | vr | VR 모드 (가상현실) |
| | ar | AR 모드 (증강현실) |
| **event_type** | object_click | 객체 클릭/탭 |
| | trigger_enter | 트리거 존 진입 |
| | trigger_exit | 트리거 존 이탈 |
| | mode_switch | VR↔AR 모드 전환 |
| | calibration_complete | 센서 보정 완료 |
| **file_type** | image | 이미지 파일 |
| | model | 3D 모델 파일 |
| | mesh | AR 메쉬 파일 |
| **upload_status** | pending | 업로드 대기/진행 중 |
| | completed | 업로드 완료 |
| | failed | 업로드 실패 |

---

## 3. 테이블 DDL 스크립트

### 3.1 관리자 (admin)

```sql
CREATE TABLE admin (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    name            VARCHAR(100) NOT NULL,
    phone           VARCHAR(20),
    plan            plan_type NOT NULL DEFAULT 'free',
    is_active       BOOLEAN NOT NULL DEFAULT true,
    email_verified_at TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at      TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT uk_admin_email UNIQUE (email)
);

COMMENT ON TABLE admin IS '시스템 관리자 계정';
COMMENT ON COLUMN admin.id IS '관리자 고유 식별자 (UUID v4)';
COMMENT ON COLUMN admin.email IS '로그인 이메일 (고유)';
COMMENT ON COLUMN admin.password_hash IS 'bcrypt 해시 비밀번호 (cost=12)';
COMMENT ON COLUMN admin.name IS '관리자 표시 이름';
COMMENT ON COLUMN admin.phone IS '연락처 (선택)';
COMMENT ON COLUMN admin.plan IS '요금제 구분';
COMMENT ON COLUMN admin.is_active IS '계정 활성화 상태';
COMMENT ON COLUMN admin.email_verified_at IS '이메일 인증 완료 일시';
COMMENT ON COLUMN admin.deleted_at IS '소프트 삭제 일시';
```


### 3.2 관리자 토큰 (admin_token)

```sql
CREATE TABLE admin_token (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id        UUID NOT NULL,
    refresh_token   VARCHAR(500) NOT NULL,
    expires_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    device_info     VARCHAR(255),
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uk_admin_token_refresh UNIQUE (refresh_token),
    CONSTRAINT fk_admin_token_admin FOREIGN KEY (admin_id) 
        REFERENCES admin(id) ON DELETE CASCADE
);

COMMENT ON TABLE admin_token IS 'JWT 리프레시 토큰 저장';
COMMENT ON COLUMN admin_token.refresh_token IS 'JWT 리프레시 토큰 값';
COMMENT ON COLUMN admin_token.expires_at IS '토큰 만료 일시 (7일)';
COMMENT ON COLUMN admin_token.device_info IS '접속 디바이스 정보 (User-Agent)';
```

### 3.3 공간 (space)

```sql
CREATE TABLE space (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id        UUID NOT NULL,
    name            VARCHAR(100) NOT NULL,
    description     TEXT,
    width           DECIMAL(5,2) NOT NULL,
    height          DECIMAL(5,2) NOT NULL DEFAULT 2.5,
    depth           DECIMAL(5,2) NOT NULL,
    status          space_status NOT NULL DEFAULT 'draft',
    floor_plan_data JSONB,
    thumbnail_url   VARCHAR(500),
    published_at    TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at      TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT fk_space_admin FOREIGN KEY (admin_id) 
        REFERENCES admin(id) ON DELETE CASCADE,
    CONSTRAINT chk_space_dimensions CHECK (
        width > 0 AND width <= 100 AND
        height > 0 AND height <= 10 AND
        depth > 0 AND depth <= 100
    )
);

COMMENT ON TABLE space IS 'VR/AR 탐색 공간';
COMMENT ON COLUMN space.name IS '공간명 (예: 201호 원룸)';
COMMENT ON COLUMN space.width IS '가로 크기 (미터)';
COMMENT ON COLUMN space.height IS '높이 (미터, 기본 2.5m)';
COMMENT ON COLUMN space.depth IS '세로 크기 (미터)';
COMMENT ON COLUMN space.floor_plan_data IS '2D 도면 JSON 데이터';
COMMENT ON COLUMN space.thumbnail_url IS 'S3 썸네일 이미지 URL';
COMMENT ON COLUMN space.published_at IS '최초 발행 일시';
COMMENT ON COLUMN space.deleted_at IS '소프트 삭제 (30일 보관 후 영구 삭제)';
```

### 3.4 공간 메쉬 (space_mesh)

```sql
CREATE TABLE space_mesh (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id        UUID NOT NULL,
    mesh_file_url   VARCHAR(500) NOT NULL,
    mesh_format     VARCHAR(20) NOT NULL,
    file_size       BIGINT NOT NULL,
    mesh_metadata   JSONB,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uk_space_mesh_space UNIQUE (space_id),
    CONSTRAINT fk_space_mesh_space FOREIGN KEY (space_id) 
        REFERENCES space(id) ON DELETE CASCADE,
    CONSTRAINT chk_mesh_file_size CHECK (file_size <= 5242880),
    CONSTRAINT chk_mesh_format CHECK (mesh_format IN ('obj', 'glb', 'gltf'))
);

COMMENT ON TABLE space_mesh IS 'AR 모드용 3D 메쉬 데이터';
COMMENT ON COLUMN space_mesh.mesh_file_url IS 'S3 메쉬 파일 URL';
COMMENT ON COLUMN space_mesh.mesh_format IS '파일 형식 (obj, glb, gltf)';
COMMENT ON COLUMN space_mesh.file_size IS '파일 크기 (bytes, 최대 5MB)';
COMMENT ON COLUMN space_mesh.mesh_metadata IS '메쉬 메타데이터 (정점 수, 면 수 등)';
```


### 3.5 객체 타입 (object_type)

```sql
CREATE TABLE object_type (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                VARCHAR(50) NOT NULL,
    name_ko             VARCHAR(50) NOT NULL,
    name_en             VARCHAR(50) NOT NULL,
    name_ja             VARCHAR(50),
    name_zh             VARCHAR(50),
    category            object_category NOT NULL,
    icon                VARCHAR(50),
    default_model_url   VARCHAR(500),
    is_system           BOOLEAN NOT NULL DEFAULT true,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uk_object_type_name UNIQUE (name)
);

COMMENT ON TABLE object_type IS '객체 타입 마스터 테이블';
COMMENT ON COLUMN object_type.name IS '객체 타입 영문 식별자 (예: bed, sofa)';
COMMENT ON COLUMN object_type.name_ko IS '한국어 표시명';
COMMENT ON COLUMN object_type.name_en IS '영어 표시명';
COMMENT ON COLUMN object_type.name_ja IS '일본어 표시명';
COMMENT ON COLUMN object_type.name_zh IS '중국어 표시명';
COMMENT ON COLUMN object_type.category IS '객체 카테고리';
COMMENT ON COLUMN object_type.icon IS '아이콘 이모지';
COMMENT ON COLUMN object_type.default_model_url IS '기본 3D 모델 URL';
COMMENT ON COLUMN object_type.is_system IS '시스템 제공 여부 (true=수정불가)';
```

### 3.6 객체 모델 (object_model)

```sql
CREATE TABLE object_model (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    object_type_id  UUID NOT NULL,
    model_url       VARCHAR(500) NOT NULL,
    model_format    VARCHAR(20) NOT NULL,
    file_size       BIGINT NOT NULL,
    polygon_count   INTEGER NOT NULL,
    thumbnail_url   VARCHAR(500),
    is_default      BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_object_model_type FOREIGN KEY (object_type_id) 
        REFERENCES object_type(id) ON DELETE CASCADE,
    CONSTRAINT chk_polygon_count CHECK (polygon_count > 0 AND polygon_count <= 50000),
    CONSTRAINT chk_model_format CHECK (model_format IN ('glb', 'gltf'))
);

COMMENT ON TABLE object_model IS '3D 객체 모델 파일';
COMMENT ON COLUMN object_model.model_url IS 'S3 3D 모델 파일 URL';
COMMENT ON COLUMN object_model.model_format IS '파일 형식 (glb, gltf)';
COMMENT ON COLUMN object_model.file_size IS '파일 크기 (bytes)';
COMMENT ON COLUMN object_model.polygon_count IS '폴리곤 수 (최대 50,000)';
COMMENT ON COLUMN object_model.thumbnail_url IS '모델 썸네일 이미지 URL';
COMMENT ON COLUMN object_model.is_default IS '해당 타입의 기본 모델 여부';
```

### 3.7 공간 객체 (space_object)

```sql
CREATE TABLE space_object (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id        UUID NOT NULL,
    object_type_id  UUID NOT NULL,
    model_id        UUID,
    custom_name     VARCHAR(100),
    position_x      DECIMAL(8,4) NOT NULL,
    position_y      DECIMAL(8,4) NOT NULL,
    position_z      DECIMAL(8,4) NOT NULL DEFAULT 0,
    rotation_x      DECIMAL(8,4) NOT NULL DEFAULT 0,
    rotation_y      DECIMAL(8,4) NOT NULL DEFAULT 0,
    rotation_z      DECIMAL(8,4) NOT NULL DEFAULT 0,
    scale_x         DECIMAL(5,3) NOT NULL DEFAULT 1,
    scale_y         DECIMAL(5,3) NOT NULL DEFAULT 1,
    scale_z         DECIMAL(5,3) NOT NULL DEFAULT 1,
    is_ml_detected  BOOLEAN NOT NULL DEFAULT false,
    ml_confidence   DECIMAL(5,4),
    display_order   INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_space_object_space FOREIGN KEY (space_id) 
        REFERENCES space(id) ON DELETE CASCADE,
    CONSTRAINT fk_space_object_type FOREIGN KEY (object_type_id) 
        REFERENCES object_type(id) ON DELETE RESTRICT,
    CONSTRAINT fk_space_object_model FOREIGN KEY (model_id) 
        REFERENCES object_model(id) ON DELETE SET NULL,
    CONSTRAINT chk_ml_confidence CHECK (
        ml_confidence IS NULL OR (ml_confidence >= 0 AND ml_confidence <= 1)
    ),
    CONSTRAINT chk_scale_positive CHECK (
        scale_x > 0 AND scale_y > 0 AND scale_z > 0
    )
);

COMMENT ON TABLE space_object IS '공간 내 배치된 객체';
COMMENT ON COLUMN space_object.custom_name IS '사용자 지정 이름 (예: 안방 침대)';
COMMENT ON COLUMN space_object.position_x IS 'X 좌표 (미터)';
COMMENT ON COLUMN space_object.position_y IS 'Y 좌표 (미터)';
COMMENT ON COLUMN space_object.position_z IS 'Z 좌표 (미터, 높이)';
COMMENT ON COLUMN space_object.rotation_x IS 'X축 회전 (도)';
COMMENT ON COLUMN space_object.rotation_y IS 'Y축 회전 (도)';
COMMENT ON COLUMN space_object.rotation_z IS 'Z축 회전 (도)';
COMMENT ON COLUMN space_object.scale_x IS 'X축 스케일 (1=원본)';
COMMENT ON COLUMN space_object.scale_y IS 'Y축 스케일';
COMMENT ON COLUMN space_object.scale_z IS 'Z축 스케일';
COMMENT ON COLUMN space_object.is_ml_detected IS 'ML 자동 인식 여부';
COMMENT ON COLUMN space_object.ml_confidence IS 'ML 인식 신뢰도 (0~1)';
COMMENT ON COLUMN space_object.display_order IS '목록 표시 순서';
```


### 3.8 로컬 규칙 (local_rule)

```sql
CREATE TABLE local_rule (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    object_id       UUID NOT NULL,
    title           VARCHAR(30) NOT NULL,
    description     TEXT NOT NULL,
    icon_type       icon_type NOT NULL,
    priority        INTEGER NOT NULL DEFAULT 5,
    display_order   INTEGER NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_local_rule_object FOREIGN KEY (object_id) 
        REFERENCES space_object(id) ON DELETE CASCADE,
    CONSTRAINT chk_title_length CHECK (char_length(title) <= 30),
    CONSTRAINT chk_description_length CHECK (char_length(description) <= 200),
    CONSTRAINT chk_priority_range CHECK (priority >= 1 AND priority <= 10)
);

COMMENT ON TABLE local_rule IS '객체별 로컬 규칙';
COMMENT ON COLUMN local_rule.title IS '규칙 제목 (최대 30자)';
COMMENT ON COLUMN local_rule.description IS '규칙 설명 (최대 200자)';
COMMENT ON COLUMN local_rule.icon_type IS '표시 아이콘 타입';
COMMENT ON COLUMN local_rule.priority IS '우선순위 (1=최고, 10=최저)';
COMMENT ON COLUMN local_rule.display_order IS '동일 우선순위 내 표시 순서';
COMMENT ON COLUMN local_rule.is_active IS '활성화 상태';
```

### 3.9 규칙 번역 (rule_translation)

```sql
CREATE TABLE rule_translation (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id             UUID NOT NULL,
    language            language_code NOT NULL,
    title               VARCHAR(50) NOT NULL,
    description         TEXT NOT NULL,
    is_auto_translated  BOOLEAN NOT NULL DEFAULT true,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_rule_translation_rule FOREIGN KEY (rule_id) 
        REFERENCES local_rule(id) ON DELETE CASCADE,
    CONSTRAINT uk_rule_translation_lang UNIQUE (rule_id, language)
);

COMMENT ON TABLE rule_translation IS '규칙 다국어 번역';
COMMENT ON COLUMN rule_translation.language IS '언어 코드';
COMMENT ON COLUMN rule_translation.title IS '번역된 제목';
COMMENT ON COLUMN rule_translation.description IS '번역된 설명';
COMMENT ON COLUMN rule_translation.is_auto_translated IS '자동 번역 여부 (false=수동 검수)';
```

### 3.10 규칙 이미지 (rule_image)

```sql
CREATE TABLE rule_image (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id         UUID NOT NULL,
    image_url       VARCHAR(500) NOT NULL,
    alt_text        VARCHAR(200),
    file_size       BIGINT NOT NULL,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uk_rule_image_rule UNIQUE (rule_id),
    CONSTRAINT fk_rule_image_rule FOREIGN KEY (rule_id) 
        REFERENCES local_rule(id) ON DELETE CASCADE,
    CONSTRAINT chk_image_file_size CHECK (file_size <= 2097152)
);

COMMENT ON TABLE rule_image IS '규칙 첨부 이미지 (1:1)';
COMMENT ON COLUMN rule_image.image_url IS 'S3 이미지 URL';
COMMENT ON COLUMN rule_image.alt_text IS '이미지 대체 텍스트 (접근성)';
COMMENT ON COLUMN rule_image.file_size IS '파일 크기 (bytes, 최대 2MB)';
```

### 3.11 트리거 존 (trigger_zone)

```sql
CREATE TABLE trigger_zone (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id            UUID NOT NULL,
    position_x          DECIMAL(8,4) NOT NULL,
    position_y          DECIMAL(8,4) NOT NULL,
    position_z          DECIMAL(8,4) NOT NULL DEFAULT 0,
    radius              DECIMAL(4,2) NOT NULL,
    trigger_type        trigger_type NOT NULL,
    message             VARCHAR(100) NOT NULL,
    auto_close_seconds  INTEGER,
    vibration_pattern   vibration_pattern NOT NULL DEFAULT 'none',
    sound_effect        sound_effect NOT NULL DEFAULT 'none',
    is_active           BOOLEAN NOT NULL DEFAULT true,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_trigger_zone_space FOREIGN KEY (space_id) 
        REFERENCES space(id) ON DELETE CASCADE,
    CONSTRAINT chk_radius_range CHECK (radius >= 0.5 AND radius <= 3.0),
    CONSTRAINT chk_auto_close CHECK (
        auto_close_seconds IS NULL OR 
        (auto_close_seconds >= 2 AND auto_close_seconds <= 10)
    ),
    CONSTRAINT chk_message_length CHECK (char_length(message) <= 100)
);

COMMENT ON TABLE trigger_zone IS '위치 기반 트리거 존';
COMMENT ON COLUMN trigger_zone.position_x IS '중심 X 좌표 (미터)';
COMMENT ON COLUMN trigger_zone.position_y IS '중심 Y 좌표 (미터)';
COMMENT ON COLUMN trigger_zone.position_z IS '중심 Z 좌표 (미터)';
COMMENT ON COLUMN trigger_zone.radius IS '트리거 반경 (0.5~3.0m)';
COMMENT ON COLUMN trigger_zone.trigger_type IS '트리거 알림 타입';
COMMENT ON COLUMN trigger_zone.message IS '표시 메시지 (최대 100자)';
COMMENT ON COLUMN trigger_zone.auto_close_seconds IS '자동 닫기 시간 (NULL=수동)';
COMMENT ON COLUMN trigger_zone.vibration_pattern IS '햅틱 진동 패턴';
COMMENT ON COLUMN trigger_zone.sound_effect IS '알림 소리';
```


### 3.12 트리거 번역 (trigger_translation)

```sql
CREATE TABLE trigger_translation (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trigger_id          UUID NOT NULL,
    language            language_code NOT NULL,
    message             VARCHAR(150) NOT NULL,
    is_auto_translated  BOOLEAN NOT NULL DEFAULT true,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_trigger_translation_trigger FOREIGN KEY (trigger_id) 
        REFERENCES trigger_zone(id) ON DELETE CASCADE,
    CONSTRAINT uk_trigger_translation_lang UNIQUE (trigger_id, language)
);

COMMENT ON TABLE trigger_translation IS '트리거 메시지 다국어 번역';
COMMENT ON COLUMN trigger_translation.message IS '번역된 메시지 (최대 150자)';
COMMENT ON COLUMN trigger_translation.is_auto_translated IS '자동 번역 여부';
```

### 3.13 QR 코드 (qr_code)

```sql
CREATE TABLE qr_code (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id        UUID NOT NULL,
    code            VARCHAR(20) NOT NULL,
    qr_image_url    VARCHAR(500) NOT NULL,
    scan_count      INTEGER NOT NULL DEFAULT 0,
    last_scanned_at TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uk_qr_code_space UNIQUE (space_id),
    CONSTRAINT uk_qr_code_code UNIQUE (code),
    CONSTRAINT fk_qr_code_space FOREIGN KEY (space_id) 
        REFERENCES space(id) ON DELETE CASCADE,
    CONSTRAINT chk_scan_count CHECK (scan_count >= 0)
);

COMMENT ON TABLE qr_code IS '공간 접근용 QR 코드';
COMMENT ON COLUMN qr_code.code IS 'QR 코드 값 (고유, 8자리 영숫자)';
COMMENT ON COLUMN qr_code.qr_image_url IS 'QR 이미지 URL';
COMMENT ON COLUMN qr_code.scan_count IS '총 스캔 횟수';
COMMENT ON COLUMN qr_code.last_scanned_at IS '마지막 스캔 일시';
```

### 3.14 게스트 방문 (guest_visit)

```sql
CREATE TABLE guest_visit (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id            UUID NOT NULL,
    device_id           VARCHAR(100) NOT NULL,
    language            language_code NOT NULL,
    mode                explore_mode NOT NULL,
    started_at          TIMESTAMP WITH TIME ZONE NOT NULL,
    ended_at            TIMESTAMP WITH TIME ZONE,
    duration_seconds    INTEGER,
    completed_tour      BOOLEAN NOT NULL DEFAULT false,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_guest_visit_space FOREIGN KEY (space_id) 
        REFERENCES space(id) ON DELETE CASCADE,
    CONSTRAINT chk_duration CHECK (
        duration_seconds IS NULL OR duration_seconds >= 0
    )
);

COMMENT ON TABLE guest_visit IS '게스트 방문 세션';
COMMENT ON COLUMN guest_visit.device_id IS '디바이스 고유 식별자';
COMMENT ON COLUMN guest_visit.language IS '선택 언어';
COMMENT ON COLUMN guest_visit.mode IS '탐색 모드 (VR/AR)';
COMMENT ON COLUMN guest_visit.started_at IS '방문 시작 일시';
COMMENT ON COLUMN guest_visit.ended_at IS '방문 종료 일시';
COMMENT ON COLUMN guest_visit.duration_seconds IS '체류 시간 (초)';
COMMENT ON COLUMN guest_visit.completed_tour IS '투어 완료 여부';
```

### 3.15 방문 로그 (visit_log)

```sql
CREATE TABLE visit_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id        UUID NOT NULL,
    event_type      event_type NOT NULL,
    reference_id    UUID,
    event_data      JSONB,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_visit_log_visit FOREIGN KEY (visit_id) 
        REFERENCES guest_visit(id) ON DELETE CASCADE
);

COMMENT ON TABLE visit_log IS '방문 상세 이벤트 로그';
COMMENT ON COLUMN visit_log.event_type IS '이벤트 종류';
COMMENT ON COLUMN visit_log.reference_id IS '참조 ID (객체/트리거 ID)';
COMMENT ON COLUMN visit_log.event_data IS '이벤트 상세 데이터 (JSON)';
```

### 3.16 파일 업로드 (file_upload)

```sql
CREATE TABLE file_upload (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id        UUID NOT NULL,
    file_type       file_type NOT NULL,
    original_name   VARCHAR(255) NOT NULL,
    stored_name     VARCHAR(255) NOT NULL,
    file_url        VARCHAR(500) NOT NULL,
    mime_type       VARCHAR(100) NOT NULL,
    file_size       BIGINT NOT NULL,
    status          upload_status NOT NULL DEFAULT 'pending',
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_file_upload_admin FOREIGN KEY (admin_id) 
        REFERENCES admin(id) ON DELETE CASCADE,
    CONSTRAINT chk_file_size CHECK (file_size > 0)
);

COMMENT ON TABLE file_upload IS '파일 업로드 기록';
COMMENT ON COLUMN file_upload.original_name IS '원본 파일명';
COMMENT ON COLUMN file_upload.stored_name IS 'S3 저장 파일명 (UUID 기반)';
COMMENT ON COLUMN file_upload.file_url IS 'S3 파일 URL';
COMMENT ON COLUMN file_upload.mime_type IS 'MIME 타입';
COMMENT ON COLUMN file_upload.file_size IS '파일 크기 (bytes)';
COMMENT ON COLUMN file_upload.status IS '업로드 처리 상태';
```


---

## 4. 인덱스 정의

### 4.1 Primary Key 인덱스 (자동 생성)

모든 테이블의 `id` 컬럼에 B-tree 인덱스 자동 생성

### 4.2 Foreign Key 인덱스

```sql
-- admin_token
CREATE INDEX idx_admin_token_admin_id ON admin_token(admin_id);
CREATE INDEX idx_admin_token_expires_at ON admin_token(expires_at);

-- space
CREATE INDEX idx_space_admin_id ON space(admin_id);

-- space_object
CREATE INDEX idx_space_object_space_id ON space_object(space_id);
CREATE INDEX idx_space_object_type_id ON space_object(object_type_id);
CREATE INDEX idx_space_object_model_id ON space_object(model_id) WHERE model_id IS NOT NULL;

-- object_model
CREATE INDEX idx_object_model_type_id ON object_model(object_type_id);

-- local_rule
CREATE INDEX idx_local_rule_object_id ON local_rule(object_id);

-- rule_translation
CREATE INDEX idx_rule_translation_rule_id ON rule_translation(rule_id);

-- trigger_zone
CREATE INDEX idx_trigger_zone_space_id ON trigger_zone(space_id);

-- trigger_translation
CREATE INDEX idx_trigger_translation_trigger_id ON trigger_translation(trigger_id);

-- guest_visit
CREATE INDEX idx_guest_visit_space_id ON guest_visit(space_id);

-- visit_log
CREATE INDEX idx_visit_log_visit_id ON visit_log(visit_id);

-- file_upload
CREATE INDEX idx_file_upload_admin_id ON file_upload(admin_id);
```

### 4.3 검색 최적화 인덱스

```sql
-- 관리자 이메일 검색 (로그인)
CREATE INDEX idx_admin_email ON admin(email) WHERE deleted_at IS NULL;

-- 활성 공간 상태별 조회
CREATE INDEX idx_space_status ON space(status) WHERE deleted_at IS NULL;

-- 소프트 삭제 필터링
CREATE INDEX idx_admin_deleted_at ON admin(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX idx_space_deleted_at ON space(deleted_at) WHERE deleted_at IS NOT NULL;

-- QR 코드 조회 (스캔 시)
CREATE INDEX idx_qr_code_code ON qr_code(code);

-- 방문 통계 (날짜별)
CREATE INDEX idx_guest_visit_started_at ON guest_visit(started_at);
CREATE INDEX idx_guest_visit_space_date ON guest_visit(space_id, started_at);

-- 방문 로그 이벤트 타입별
CREATE INDEX idx_visit_log_event_type ON visit_log(event_type);
CREATE INDEX idx_visit_log_created_at ON visit_log(created_at);

-- 규칙 번역 언어별
CREATE INDEX idx_rule_translation_language ON rule_translation(language);

-- 트리거 번역 언어별
CREATE INDEX idx_trigger_translation_language ON trigger_translation(language);

-- 활성 규칙만 조회
CREATE INDEX idx_local_rule_active ON local_rule(object_id) WHERE is_active = true;

-- 활성 트리거만 조회
CREATE INDEX idx_trigger_zone_active ON trigger_zone(space_id) WHERE is_active = true;

-- 파일 업로드 상태별
CREATE INDEX idx_file_upload_status ON file_upload(status) WHERE status = 'pending';
```

### 4.4 복합 인덱스

```sql
-- 공간별 객체 순서 조회
CREATE INDEX idx_space_object_order ON space_object(space_id, display_order);

-- 객체별 규칙 순서 조회
CREATE INDEX idx_local_rule_order ON local_rule(object_id, priority, display_order);

-- 디바이스별 최근 방문
CREATE INDEX idx_guest_visit_device ON guest_visit(device_id, started_at DESC);
```

---

## 5. 제약조건 및 트리거

### 5.1 비즈니스 규칙 제약 함수

```sql
-- 무료 플랜 공간 개수 제한 체크
CREATE OR REPLACE FUNCTION check_space_limit()
RETURNS TRIGGER AS $$
DECLARE
    admin_plan plan_type;
    space_count INTEGER;
    max_spaces INTEGER;
BEGIN
    SELECT plan INTO admin_plan FROM admin WHERE id = NEW.admin_id;
    SELECT COUNT(*) INTO space_count FROM space 
    WHERE admin_id = NEW.admin_id AND deleted_at IS NULL;
    
    max_spaces := CASE admin_plan
        WHEN 'free' THEN 1
        WHEN 'basic' THEN 5
        WHEN 'pro' THEN 20
        WHEN 'enterprise' THEN 999999
    END;
    
    IF space_count >= max_spaces THEN
        RAISE EXCEPTION 'Space limit exceeded for plan %', admin_plan;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_space_limit
    BEFORE INSERT ON space
    FOR EACH ROW
    EXECUTE FUNCTION check_space_limit();
```


```sql
-- 공간당 객체 개수 제한 (최대 50개)
CREATE OR REPLACE FUNCTION check_object_limit()
RETURNS TRIGGER AS $$
DECLARE
    object_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO object_count FROM space_object 
    WHERE space_id = NEW.space_id;
    
    IF object_count >= 50 THEN
        RAISE EXCEPTION 'Object limit (50) exceeded for space %', NEW.space_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_object_limit
    BEFORE INSERT ON space_object
    FOR EACH ROW
    EXECUTE FUNCTION check_object_limit();

-- 객체당 규칙 개수 제한 (최대 10개)
CREATE OR REPLACE FUNCTION check_rule_limit()
RETURNS TRIGGER AS $$
DECLARE
    rule_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO rule_count FROM local_rule 
    WHERE object_id = NEW.object_id;
    
    IF rule_count >= 10 THEN
        RAISE EXCEPTION 'Rule limit (10) exceeded for object %', NEW.object_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_rule_limit
    BEFORE INSERT ON local_rule
    FOR EACH ROW
    EXECUTE FUNCTION check_rule_limit();

-- 공간당 트리거 존 개수 제한 (최대 20개)
CREATE OR REPLACE FUNCTION check_trigger_limit()
RETURNS TRIGGER AS $$
DECLARE
    trigger_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO trigger_count FROM trigger_zone 
    WHERE space_id = NEW.space_id;
    
    IF trigger_count >= 20 THEN
        RAISE EXCEPTION 'Trigger zone limit (20) exceeded for space %', NEW.space_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_trigger_limit
    BEFORE INSERT ON trigger_zone
    FOR EACH ROW
    EXECUTE FUNCTION check_trigger_limit();
```

### 5.2 자동 타임스탬프 업데이트

```sql
-- updated_at 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 각 테이블에 트리거 적용
CREATE TRIGGER trg_admin_updated_at
    BEFORE UPDATE ON admin
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_space_updated_at
    BEFORE UPDATE ON space
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_space_mesh_updated_at
    BEFORE UPDATE ON space_mesh
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_object_type_updated_at
    BEFORE UPDATE ON object_type
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_space_object_updated_at
    BEFORE UPDATE ON space_object
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_local_rule_updated_at
    BEFORE UPDATE ON local_rule
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_rule_translation_updated_at
    BEFORE UPDATE ON rule_translation
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_trigger_zone_updated_at
    BEFORE UPDATE ON trigger_zone
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_trigger_translation_updated_at
    BEFORE UPDATE ON trigger_translation
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_qr_code_updated_at
    BEFORE UPDATE ON qr_code
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### 5.3 QR 스캔 카운트 자동 증가

```sql
-- QR 스캔 시 카운트 증가 및 시간 기록
CREATE OR REPLACE FUNCTION increment_qr_scan()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE qr_code 
    SET scan_count = scan_count + 1,
        last_scanned_at = CURRENT_TIMESTAMP
    WHERE space_id = NEW.space_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_increment_qr_scan
    AFTER INSERT ON guest_visit
    FOR EACH ROW
    EXECUTE FUNCTION increment_qr_scan();
```


---

## 6. Prisma 스키마

### 6.1 Prisma Schema 파일 (schema.prisma)

```prisma
// This is your Prisma schema file
// Learn more: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// =====================================================
// ENUM 정의
// =====================================================

enum PlanType {
  free
  basic
  pro
  enterprise
}

enum SpaceStatus {
  draft
  published
  archived
}

enum ObjectCategory {
  furniture
  appliance
  facility
  other
}

enum IconType {
  prohibited
  warning
  tip
  info
}

enum TriggerType {
  warning
  caution
  info
}

enum VibrationPattern {
  none
  short
  long
}

enum SoundEffect {
  none
  ding
  alert
}

enum LanguageCode {
  ko
  en
  ja
  zh
}

enum ExploreMode {
  vr
  ar
}

enum EventType {
  object_click
  trigger_enter
  trigger_exit
  mode_switch
  calibration_complete
}

enum FileType {
  image
  model
  mesh
}

enum UploadStatus {
  pending
  completed
  failed
}

// =====================================================
// 모델 정의
// =====================================================

model Admin {
  id              String    @id @default(uuid()) @db.Uuid
  email           String    @unique @db.VarChar(255)
  passwordHash    String    @map("password_hash") @db.VarChar(255)
  name            String    @db.VarChar(100)
  phone           String?   @db.VarChar(20)
  plan            PlanType  @default(free)
  isActive        Boolean   @default(true) @map("is_active")
  emailVerifiedAt DateTime? @map("email_verified_at") @db.Timestamptz
  createdAt       DateTime  @default(now()) @map("created_at") @db.Timestamptz
  updatedAt       DateTime  @updatedAt @map("updated_at") @db.Timestamptz
  deletedAt       DateTime? @map("deleted_at") @db.Timestamptz

  tokens      AdminToken[]
  spaces      Space[]
  fileUploads FileUpload[]

  @@index([email])
  @@index([deletedAt])
  @@map("admin")
}

model AdminToken {
  id           String   @id @default(uuid()) @db.Uuid
  adminId      String   @map("admin_id") @db.Uuid
  refreshToken String   @unique @map("refresh_token") @db.VarChar(500)
  expiresAt    DateTime @map("expires_at") @db.Timestamptz
  deviceInfo   String?  @map("device_info") @db.VarChar(255)
  createdAt    DateTime @default(now()) @map("created_at") @db.Timestamptz

  admin Admin @relation(fields: [adminId], references: [id], onDelete: Cascade)

  @@index([adminId])
  @@index([expiresAt])
  @@map("admin_token")
}

model Space {
  id            String      @id @default(uuid()) @db.Uuid
  adminId       String      @map("admin_id") @db.Uuid
  name          String      @db.VarChar(100)
  description   String?     @db.Text
  width         Decimal     @db.Decimal(5, 2)
  height        Decimal     @default(2.5) @db.Decimal(5, 2)
  depth         Decimal     @db.Decimal(5, 2)
  status        SpaceStatus @default(draft)
  floorPlanData Json?       @map("floor_plan_data") @db.JsonB
  thumbnailUrl  String?     @map("thumbnail_url") @db.VarChar(500)
  publishedAt   DateTime?   @map("published_at") @db.Timestamptz
  createdAt     DateTime    @default(now()) @map("created_at") @db.Timestamptz
  updatedAt     DateTime    @updatedAt @map("updated_at") @db.Timestamptz
  deletedAt     DateTime?   @map("deleted_at") @db.Timestamptz

  admin        Admin         @relation(fields: [adminId], references: [id], onDelete: Cascade)
  mesh         SpaceMesh?
  objects      SpaceObject[]
  triggerZones TriggerZone[]
  qrCode       QrCode?
  guestVisits  GuestVisit[]

  @@index([adminId])
  @@index([status])
  @@index([deletedAt])
  @@map("space")
}

model SpaceMesh {
  id           String   @id @default(uuid()) @db.Uuid
  spaceId      String   @unique @map("space_id") @db.Uuid
  meshFileUrl  String   @map("mesh_file_url") @db.VarChar(500)
  meshFormat   String   @map("mesh_format") @db.VarChar(20)
  fileSize     BigInt   @map("file_size")
  meshMetadata Json?    @map("mesh_metadata") @db.JsonB
  createdAt    DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt    DateTime @updatedAt @map("updated_at") @db.Timestamptz

  space Space @relation(fields: [spaceId], references: [id], onDelete: Cascade)

  @@map("space_mesh")
}
```


```prisma
model ObjectType {
  id              String         @id @default(uuid()) @db.Uuid
  name            String         @unique @db.VarChar(50)
  nameKo          String         @map("name_ko") @db.VarChar(50)
  nameEn          String         @map("name_en") @db.VarChar(50)
  nameJa          String?        @map("name_ja") @db.VarChar(50)
  nameZh          String?        @map("name_zh") @db.VarChar(50)
  category        ObjectCategory
  icon            String?        @db.VarChar(50)
  defaultModelUrl String?        @map("default_model_url") @db.VarChar(500)
  isSystem        Boolean        @default(true) @map("is_system")
  createdAt       DateTime       @default(now()) @map("created_at") @db.Timestamptz
  updatedAt       DateTime       @updatedAt @map("updated_at") @db.Timestamptz

  models  ObjectModel[]
  objects SpaceObject[]

  @@map("object_type")
}

model ObjectModel {
  id            String   @id @default(uuid()) @db.Uuid
  objectTypeId  String   @map("object_type_id") @db.Uuid
  modelUrl      String   @map("model_url") @db.VarChar(500)
  modelFormat   String   @map("model_format") @db.VarChar(20)
  fileSize      BigInt   @map("file_size")
  polygonCount  Int      @map("polygon_count")
  thumbnailUrl  String?  @map("thumbnail_url") @db.VarChar(500)
  isDefault     Boolean  @default(false) @map("is_default")
  createdAt     DateTime @default(now()) @map("created_at") @db.Timestamptz

  objectType ObjectType    @relation(fields: [objectTypeId], references: [id], onDelete: Cascade)
  objects    SpaceObject[]

  @@index([objectTypeId])
  @@map("object_model")
}

model SpaceObject {
  id           String   @id @default(uuid()) @db.Uuid
  spaceId      String   @map("space_id") @db.Uuid
  objectTypeId String   @map("object_type_id") @db.Uuid
  modelId      String?  @map("model_id") @db.Uuid
  customName   String?  @map("custom_name") @db.VarChar(100)
  positionX    Decimal  @map("position_x") @db.Decimal(8, 4)
  positionY    Decimal  @map("position_y") @db.Decimal(8, 4)
  positionZ    Decimal  @default(0) @map("position_z") @db.Decimal(8, 4)
  rotationX    Decimal  @default(0) @map("rotation_x") @db.Decimal(8, 4)
  rotationY    Decimal  @default(0) @map("rotation_y") @db.Decimal(8, 4)
  rotationZ    Decimal  @default(0) @map("rotation_z") @db.Decimal(8, 4)
  scaleX       Decimal  @default(1) @map("scale_x") @db.Decimal(5, 3)
  scaleY       Decimal  @default(1) @map("scale_y") @db.Decimal(5, 3)
  scaleZ       Decimal  @default(1) @map("scale_z") @db.Decimal(5, 3)
  isMlDetected Boolean  @default(false) @map("is_ml_detected")
  mlConfidence Decimal? @map("ml_confidence") @db.Decimal(5, 4)
  displayOrder Int      @default(0) @map("display_order")
  createdAt    DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt    DateTime @updatedAt @map("updated_at") @db.Timestamptz

  space      Space        @relation(fields: [spaceId], references: [id], onDelete: Cascade)
  objectType ObjectType   @relation(fields: [objectTypeId], references: [id], onDelete: Restrict)
  model      ObjectModel? @relation(fields: [modelId], references: [id], onDelete: SetNull)
  rules      LocalRule[]

  @@index([spaceId])
  @@index([objectTypeId])
  @@index([modelId])
  @@map("space_object")
}

model LocalRule {
  id           String   @id @default(uuid()) @db.Uuid
  objectId     String   @map("object_id") @db.Uuid
  title        String   @db.VarChar(30)
  description  String   @db.Text
  iconType     IconType @map("icon_type")
  priority     Int      @default(5)
  displayOrder Int      @default(0) @map("display_order")
  isActive     Boolean  @default(true) @map("is_active")
  createdAt    DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt    DateTime @updatedAt @map("updated_at") @db.Timestamptz

  object       SpaceObject       @relation(fields: [objectId], references: [id], onDelete: Cascade)
  translations RuleTranslation[]
  image        RuleImage?

  @@index([objectId])
  @@map("local_rule")
}

model RuleTranslation {
  id               String       @id @default(uuid()) @db.Uuid
  ruleId           String       @map("rule_id") @db.Uuid
  language         LanguageCode
  title            String       @db.VarChar(50)
  description      String       @db.Text
  isAutoTranslated Boolean      @default(true) @map("is_auto_translated")
  createdAt        DateTime     @default(now()) @map("created_at") @db.Timestamptz
  updatedAt        DateTime     @updatedAt @map("updated_at") @db.Timestamptz

  rule LocalRule @relation(fields: [ruleId], references: [id], onDelete: Cascade)

  @@unique([ruleId, language])
  @@index([ruleId])
  @@index([language])
  @@map("rule_translation")
}

model RuleImage {
  id        String   @id @default(uuid()) @db.Uuid
  ruleId    String   @unique @map("rule_id") @db.Uuid
  imageUrl  String   @map("image_url") @db.VarChar(500)
  altText   String?  @map("alt_text") @db.VarChar(200)
  fileSize  BigInt   @map("file_size")
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz

  rule LocalRule @relation(fields: [ruleId], references: [id], onDelete: Cascade)

  @@map("rule_image")
}
```


```prisma
model TriggerZone {
  id               String           @id @default(uuid()) @db.Uuid
  spaceId          String           @map("space_id") @db.Uuid
  positionX        Decimal          @map("position_x") @db.Decimal(8, 4)
  positionY        Decimal          @map("position_y") @db.Decimal(8, 4)
  positionZ        Decimal          @default(0) @map("position_z") @db.Decimal(8, 4)
  radius           Decimal          @db.Decimal(4, 2)
  triggerType      TriggerType      @map("trigger_type")
  message          String           @db.VarChar(100)
  autoCloseSeconds Int?             @map("auto_close_seconds")
  vibrationPattern VibrationPattern @default(none) @map("vibration_pattern")
  soundEffect      SoundEffect      @default(none) @map("sound_effect")
  isActive         Boolean          @default(true) @map("is_active")
  createdAt        DateTime         @default(now()) @map("created_at") @db.Timestamptz
  updatedAt        DateTime         @updatedAt @map("updated_at") @db.Timestamptz

  space        Space                @relation(fields: [spaceId], references: [id], onDelete: Cascade)
  translations TriggerTranslation[]

  @@index([spaceId])
  @@map("trigger_zone")
}

model TriggerTranslation {
  id               String       @id @default(uuid()) @db.Uuid
  triggerId        String       @map("trigger_id") @db.Uuid
  language         LanguageCode
  message          String       @db.VarChar(150)
  isAutoTranslated Boolean      @default(true) @map("is_auto_translated")
  createdAt        DateTime     @default(now()) @map("created_at") @db.Timestamptz
  updatedAt        DateTime     @updatedAt @map("updated_at") @db.Timestamptz

  trigger TriggerZone @relation(fields: [triggerId], references: [id], onDelete: Cascade)

  @@unique([triggerId, language])
  @@index([triggerId])
  @@map("trigger_translation")
}

model QrCode {
  id            String    @id @default(uuid()) @db.Uuid
  spaceId       String    @unique @map("space_id") @db.Uuid
  code          String    @unique @db.VarChar(20)
  qrImageUrl    String    @map("qr_image_url") @db.VarChar(500)
  scanCount     Int       @default(0) @map("scan_count")
  lastScannedAt DateTime? @map("last_scanned_at") @db.Timestamptz
  createdAt     DateTime  @default(now()) @map("created_at") @db.Timestamptz
  updatedAt     DateTime  @updatedAt @map("updated_at") @db.Timestamptz

  space Space @relation(fields: [spaceId], references: [id], onDelete: Cascade)

  @@index([code])
  @@map("qr_code")
}

model GuestVisit {
  id              String       @id @default(uuid()) @db.Uuid
  spaceId         String       @map("space_id") @db.Uuid
  deviceId        String       @map("device_id") @db.VarChar(100)
  language        LanguageCode
  mode            ExploreMode
  startedAt       DateTime     @map("started_at") @db.Timestamptz
  endedAt         DateTime?    @map("ended_at") @db.Timestamptz
  durationSeconds Int?         @map("duration_seconds")
  completedTour   Boolean      @default(false) @map("completed_tour")
  createdAt       DateTime     @default(now()) @map("created_at") @db.Timestamptz

  space Space      @relation(fields: [spaceId], references: [id], onDelete: Cascade)
  logs  VisitLog[]

  @@index([spaceId])
  @@index([startedAt])
  @@index([deviceId, startedAt(sort: Desc)])
  @@map("guest_visit")
}

model VisitLog {
  id          String    @id @default(uuid()) @db.Uuid
  visitId     String    @map("visit_id") @db.Uuid
  eventType   EventType @map("event_type")
  referenceId String?   @map("reference_id") @db.Uuid
  eventData   Json?     @map("event_data") @db.JsonB
  createdAt   DateTime  @default(now()) @map("created_at") @db.Timestamptz

  visit GuestVisit @relation(fields: [visitId], references: [id], onDelete: Cascade)

  @@index([visitId])
  @@index([eventType])
  @@index([createdAt])
  @@map("visit_log")
}

model FileUpload {
  id           String       @id @default(uuid()) @db.Uuid
  adminId      String       @map("admin_id") @db.Uuid
  fileType     FileType     @map("file_type")
  originalName String       @map("original_name") @db.VarChar(255)
  storedName   String       @map("stored_name") @db.VarChar(255)
  fileUrl      String       @map("file_url") @db.VarChar(500)
  mimeType     String       @map("mime_type") @db.VarChar(100)
  fileSize     BigInt       @map("file_size")
  status       UploadStatus @default(pending)
  createdAt    DateTime     @default(now()) @map("created_at") @db.Timestamptz

  admin Admin @relation(fields: [adminId], references: [id], onDelete: Cascade)

  @@index([adminId])
  @@index([status])
  @@map("file_upload")
}
```


---

## 7. 시드 데이터

### 7.1 객체 타입 시드 데이터

```sql
-- 가구 (furniture)
INSERT INTO object_type (id, name, name_ko, name_en, name_ja, name_zh, category, icon, is_system) VALUES
(gen_random_uuid(), 'bed', '침대', 'Bed', 'ベッド', '床', 'furniture', '🛏️', true),
(gen_random_uuid(), 'sofa', '소파', 'Sofa', 'ソファ', '沙发', 'furniture', '🛋️', true),
(gen_random_uuid(), 'chair', '의자', 'Chair', '椅子', '椅子', 'furniture', '🪑', true),
(gen_random_uuid(), 'desk', '책상', 'Desk', '机', '书桌', 'furniture', '🪵', true),
(gen_random_uuid(), 'wardrobe', '옷장', 'Wardrobe', 'ワードローブ', '衣柜', 'furniture', '🚪', true),
(gen_random_uuid(), 'table', '테이블', 'Table', 'テーブル', '桌子', 'furniture', '🪑', true),
(gen_random_uuid(), 'bookshelf', '책장', 'Bookshelf', '本棚', '书架', 'furniture', '📚', true);

-- 가전 (appliance)
INSERT INTO object_type (id, name, name_ko, name_en, name_ja, name_zh, category, icon, is_system) VALUES
(gen_random_uuid(), 'washer', '세탁기', 'Washing Machine', '洗濯機', '洗衣机', 'appliance', '🧺', true),
(gen_random_uuid(), 'refrigerator', '냉장고', 'Refrigerator', '冷蔵庫', '冰箱', 'appliance', '🧊', true),
(gen_random_uuid(), 'aircon', '에어컨', 'Air Conditioner', 'エアコン', '空调', 'appliance', '❄️', true),
(gen_random_uuid(), 'tv', 'TV', 'TV', 'テレビ', '电视', 'appliance', '📺', true),
(gen_random_uuid(), 'microwave', '전자레인지', 'Microwave', '電子レンジ', '微波炉', 'appliance', '📻', true),
(gen_random_uuid(), 'dryer', '건조기', 'Dryer', '乾燥機', '烘干机', 'appliance', '💨', true);

-- 시설 (facility)
INSERT INTO object_type (id, name, name_ko, name_en, name_ja, name_zh, category, icon, is_system) VALUES
(gen_random_uuid(), 'bathroom', '욕실', 'Bathroom', 'バスルーム', '浴室', 'facility', '🛁', true),
(gen_random_uuid(), 'shower', '샤워기', 'Shower', 'シャワー', '淋浴', 'facility', '🚿', true),
(gen_random_uuid(), 'sink', '세면대', 'Sink', '洗面台', '洗手台', 'facility', '🚰', true),
(gen_random_uuid(), 'toilet', '화장실', 'Toilet', 'トイレ', '厕所', 'facility', '🚽', true),
(gen_random_uuid(), 'kitchen', '주방', 'Kitchen', 'キッチン', '厨房', 'facility', '🍳', true),
(gen_random_uuid(), 'window', '창문', 'Window', '窓', '窗户', 'facility', '🪟', true),
(gen_random_uuid(), 'door', '문', 'Door', 'ドア', '门', 'facility', '🚪', true);

-- 기타 (other)
INSERT INTO object_type (id, name, name_ko, name_en, name_ja, name_zh, category, icon, is_system) VALUES
(gen_random_uuid(), 'plant', '화분', 'Plant', '植物', '植物', 'other', '🪴', true),
(gen_random_uuid(), 'lamp', '조명', 'Lamp', 'ランプ', '灯', 'other', '💡', true),
(gen_random_uuid(), 'mirror', '거울', 'Mirror', '鏡', '镜子', 'other', '🪞', true);
```

### 7.2 테스트 관리자 시드 데이터

```sql
-- 테스트 관리자 (비밀번호: Test1234!)
INSERT INTO admin (id, email, password_hash, name, phone, plan, is_active, email_verified_at) VALUES
(
    gen_random_uuid(),
    'test@localrule.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYn.Wd1S1FGi',
    '테스트 관리자',
    '010-1234-5678',
    'pro',
    true,
    CURRENT_TIMESTAMP
);
```


---

## 8. 쿼리 예제

### 8.1 관리자 관련 쿼리

```sql
-- 이메일로 관리자 조회 (로그인)
SELECT id, email, password_hash, name, plan, is_active, email_verified_at
FROM admin
WHERE email = $1 AND deleted_at IS NULL AND is_active = true;

-- 관리자의 공간 목록 조회
SELECT s.id, s.name, s.status, s.thumbnail_url, s.created_at,
       COUNT(so.id) as object_count,
       q.code as qr_code
FROM space s
LEFT JOIN space_object so ON s.id = so.space_id
LEFT JOIN qr_code q ON s.id = q.space_id
WHERE s.admin_id = $1 AND s.deleted_at IS NULL
GROUP BY s.id, q.code
ORDER BY s.created_at DESC;

-- 관리자 요금제별 공간 개수 확인
SELECT a.plan, COUNT(s.id) as space_count
FROM admin a
LEFT JOIN space s ON a.id = s.admin_id AND s.deleted_at IS NULL
WHERE a.id = $1
GROUP BY a.plan;
```

### 8.2 공간 및 객체 관련 쿼리

```sql
-- 공간 상세 정보 조회 (객체 포함)
SELECT s.*,
       json_agg(
           json_build_object(
               'id', so.id,
               'type', ot.name,
               'typeName', ot.name_ko,
               'customName', so.custom_name,
               'position', json_build_object('x', so.position_x, 'y', so.position_y, 'z', so.position_z),
               'rotation', json_build_object('x', so.rotation_x, 'y', so.rotation_y, 'z', so.rotation_z),
               'scale', json_build_object('x', so.scale_x, 'y', so.scale_y, 'z', so.scale_z)
           ) ORDER BY so.display_order
       ) FILTER (WHERE so.id IS NOT NULL) as objects
FROM space s
LEFT JOIN space_object so ON s.id = so.space_id
LEFT JOIN object_type ot ON so.object_type_id = ot.id
WHERE s.id = $1 AND s.deleted_at IS NULL
GROUP BY s.id;

-- 객체별 규칙 조회 (번역 포함)
SELECT lr.id, lr.title, lr.description, lr.icon_type, lr.priority,
       COALESCE(rt.title, lr.title) as translated_title,
       COALESCE(rt.description, lr.description) as translated_description
FROM local_rule lr
LEFT JOIN rule_translation rt ON lr.id = rt.rule_id AND rt.language = $2
WHERE lr.object_id = $1 AND lr.is_active = true
ORDER BY lr.priority, lr.display_order;
```

### 8.3 게스트 탐색 관련 쿼리

```sql
-- QR 코드로 공간 조회 (게스트 접근)
SELECT s.id, s.name, s.description, s.width, s.height, s.depth,
       sm.mesh_file_url, sm.mesh_format
FROM space s
JOIN qr_code q ON s.id = q.space_id
LEFT JOIN space_mesh sm ON s.id = sm.space_id
WHERE q.code = $1 AND s.status = 'published' AND s.deleted_at IS NULL;

-- 공간의 모든 트리거 존 조회 (번역 포함)
SELECT tz.id, tz.position_x, tz.position_y, tz.position_z, tz.radius,
       tz.trigger_type, tz.auto_close_seconds, tz.vibration_pattern, tz.sound_effect,
       COALESCE(tt.message, tz.message) as message
FROM trigger_zone tz
LEFT JOIN trigger_translation tt ON tz.id = tt.trigger_id AND tt.language = $2
WHERE tz.space_id = $1 AND tz.is_active = true;

-- 방문 세션 시작
INSERT INTO guest_visit (space_id, device_id, language, mode, started_at)
VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
RETURNING id;

-- 방문 이벤트 로그 기록
INSERT INTO visit_log (visit_id, event_type, reference_id, event_data)
VALUES ($1, $2, $3, $4);

-- 방문 세션 종료
UPDATE guest_visit
SET ended_at = CURRENT_TIMESTAMP,
    duration_seconds = EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - started_at))::INTEGER,
    completed_tour = $2
WHERE id = $1;
```

### 8.4 통계 관련 쿼리

```sql
-- 공간별 방문 통계 (최근 30일)
SELECT 
    DATE(gv.started_at) as visit_date,
    COUNT(*) as visit_count,
    COUNT(DISTINCT gv.device_id) as unique_visitors,
    AVG(gv.duration_seconds) as avg_duration,
    SUM(CASE WHEN gv.completed_tour THEN 1 ELSE 0 END) as completed_count
FROM guest_visit gv
WHERE gv.space_id = $1 
  AND gv.started_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(gv.started_at)
ORDER BY visit_date DESC;

-- 객체별 클릭 통계
SELECT 
    so.id as object_id,
    ot.name_ko as object_name,
    COUNT(vl.id) as click_count
FROM space_object so
JOIN object_type ot ON so.object_type_id = ot.id
LEFT JOIN visit_log vl ON so.id = vl.reference_id AND vl.event_type = 'object_click'
WHERE so.space_id = $1
GROUP BY so.id, ot.name_ko
ORDER BY click_count DESC;

-- 언어별 방문자 분포
SELECT 
    gv.language,
    COUNT(*) as visit_count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM guest_visit gv
WHERE gv.space_id = $1
GROUP BY gv.language
ORDER BY visit_count DESC;

-- VR/AR 모드 사용 비율
SELECT 
    gv.mode,
    COUNT(*) as usage_count,
    AVG(gv.duration_seconds) as avg_duration
FROM guest_visit gv
WHERE gv.space_id = $1
GROUP BY gv.mode;
```


### 8.5 데이터 정리 쿼리

```sql
-- 만료된 리프레시 토큰 삭제
DELETE FROM admin_token WHERE expires_at < CURRENT_TIMESTAMP;

-- 30일 지난 소프트 삭제 공간 영구 삭제
DELETE FROM space 
WHERE deleted_at IS NOT NULL 
  AND deleted_at < CURRENT_TIMESTAMP - INTERVAL '30 days';

-- 비활성 관리자 계정 정리 (1년 미접속)
UPDATE admin 
SET is_active = false 
WHERE updated_at < CURRENT_TIMESTAMP - INTERVAL '1 year'
  AND is_active = true;

-- 오래된 방문 로그 아카이브 (90일 이상)
-- 실제 운영에서는 별도 아카이브 테이블로 이동
DELETE FROM visit_log 
WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '90 days';

-- 실패한 업로드 파일 정리 (7일 이상)
DELETE FROM file_upload 
WHERE status = 'failed' 
  AND created_at < CURRENT_TIMESTAMP - INTERVAL '7 days';
```

---

## 9. 성능 최적화 가이드

### 9.1 파티셔닝 전략 (대용량 테이블)

```sql
-- visit_log 테이블 월별 파티셔닝
CREATE TABLE visit_log (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    visit_id UUID NOT NULL,
    event_type event_type NOT NULL,
    reference_id UUID,
    event_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
) PARTITION BY RANGE (created_at);

-- 월별 파티션 생성 예시
CREATE TABLE visit_log_2024_12 PARTITION OF visit_log
    FOR VALUES FROM ('2024-12-01') TO ('2025-01-01');

CREATE TABLE visit_log_2025_01 PARTITION OF visit_log
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
```

### 9.2 커넥션 풀 설정 권장값

| 환경 | max_connections | pool_size | 설명 |
|------|-----------------|-----------|------|
| 개발 | 20 | 5 | 로컬 개발 환경 |
| 스테이징 | 50 | 10 | 테스트 환경 |
| 프로덕션 | 100 | 20 | 운영 환경 |

### 9.3 쿼리 최적화 팁

1. **N+1 문제 방지**: Prisma의 `include` 사용
2. **페이지네이션**: cursor 기반 페이지네이션 권장
3. **인덱스 활용**: EXPLAIN ANALYZE로 쿼리 플랜 확인
4. **JSONB 인덱스**: GIN 인덱스 활용

```sql
-- JSONB 필드 검색용 GIN 인덱스
CREATE INDEX idx_visit_log_event_data ON visit_log USING GIN (event_data);

-- 부분 인덱스 활용
CREATE INDEX idx_space_published ON space(admin_id) 
WHERE status = 'published' AND deleted_at IS NULL;
```

---

## 10. 백업 및 복구

### 10.1 백업 전략

| 백업 유형 | 주기 | 보관 기간 | 방법 |
|----------|------|----------|------|
| 전체 백업 | 일 1회 | 30일 | RDS 자동 백업 |
| 증분 백업 | 5분 | 7일 | WAL 아카이브 |
| 스냅샷 | 주 1회 | 90일 | 수동 스냅샷 |

### 10.2 복구 절차

```bash
# Point-in-time Recovery (특정 시점 복구)
aws rds restore-db-instance-to-point-in-time \
    --source-db-instance-identifier localrule-prod \
    --target-db-instance-identifier localrule-recovery \
    --restore-time "2024-12-10T10:00:00Z"

# 스냅샷에서 복구
aws rds restore-db-instance-from-db-snapshot \
    --db-instance-identifier localrule-recovery \
    --db-snapshot-identifier localrule-snapshot-20241210
```

---

## 부록: 변경 이력

| 버전 | 날짜 | 변경 내용 | 작성자 |
|------|------|----------|--------|
| 1.0 | 2024-12-10 | 최초 작성 | - |

---

**문서 버전**: 1.0  
**최종 수정**: 2024-12-10  
**다음 리뷰**: 개발 시작 후 1주
