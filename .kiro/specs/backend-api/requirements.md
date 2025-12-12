# Requirements Document

## Introduction

LocalRule 백엔드 API는 센서 기반 VR 공간 규칙 탐색 플랫폼의 핵심 서버 시스템입니다. Node.js와 Express 기반의 RESTful API로, 관리자 대시보드와 게스트 모바일 앱에 데이터를 제공합니다. 온프레미스 개발 환경에서 먼저 구현 및 테스트를 완료한 후 AWS 인프라로 마이그레이션할 예정입니다.

## Glossary

- **Admin**: 숙박시설 운영자/호스트로서 공간과 규칙을 관리하는 사용자
- **Guest**: 숙박시설 이용자로서 VR/AR 앱을 통해 규칙을 탐색하는 사용자
- **Space**: 숙박시설의 방 단위 (예: 201호)
- **Object**: 3D 공간 내 가구/시설물 (침대, 세탁기 등)
- **LocalRule**: 객체별 사용 규칙/안내사항
- **Trigger Zone**: 자동 팝업이 발생하는 3D 공간 영역
- **Backend API**: Node.js Express 기반 REST API 서버
- **JWT**: JSON Web Token 기반 인증 방식
- **Prisma**: TypeScript ORM 라이브러리

## Requirements

### Requirement 1

**User Story:** As a 개발자, I want to 프로젝트 기반 구조를 설정하고 싶다, so that 일관된 코드 품질과 개발 환경을 유지할 수 있다.

#### Acceptance Criteria

1. WHEN 프로젝트가 초기화되면 THE Backend API SHALL Node.js 20, Express 4.18, TypeScript 5.0 기반으로 구성된다
2. WHEN 프로젝트가 초기화되면 THE Backend API SHALL Prisma ORM과 PostgreSQL 연결을 설정한다
3. WHEN 프로젝트가 초기화되면 THE Backend API SHALL ESLint, Prettier 설정을 포함한다
4. WHEN 프로젝트가 초기화되면 THE Backend API SHALL 환경변수 관리를 위한 dotenv 설정을 포함한다
5. WHEN 프로젝트가 초기화되면 THE Backend API SHALL 테스트 프레임워크(Jest)를 설정한다

### Requirement 2

**User Story:** As a 관리자, I want to 회원가입하고 로그인하고 싶다, so that 내 공간을 안전하게 관리할 수 있다.

#### Acceptance Criteria

1. WHEN 관리자가 이메일과 비밀번호로 회원가입을 요청하면 THE Backend API SHALL 새로운 관리자 계정을 생성하고 201 응답을 반환한다
2. WHEN 관리자가 이미 등록된 이메일로 회원가입을 요청하면 THE Backend API SHALL EMAIL_ALREADY_EXISTS 에러를 반환한다
3. WHEN 관리자가 올바른 자격증명으로 로그인하면 THE Backend API SHALL JWT 액세스 토큰과 리프레시 토큰을 반환한다
4. WHEN 관리자가 잘못된 자격증명으로 로그인하면 THE Backend API SHALL INVALID_CREDENTIALS 에러를 반환한다
5. WHEN 관리자가 로그아웃을 요청하면 THE Backend API SHALL 현재 세션을 종료하고 토큰을 무효화한다
6. WHEN 액세스 토큰이 만료되면 THE Backend API SHALL 리프레시 토큰으로 새 액세스 토큰을 발급한다
7. WHEN 비밀번호가 8자 미만이거나 영문+숫자+특수문자 조건을 충족하지 않으면 THE Backend API SHALL WEAK_PASSWORD 에러를 반환한다
8. WHEN 개발 환경에서 개발자 계정(dev@localrule.app / DevPass123!)으로 로그인하면 THE Backend API SHALL 인증을 우회하고 모든 권한을 가진 토큰을 발급한다
9. WHEN NODE_ENV가 development이면 THE Backend API SHALL 개발자 계정 자동 생성 및 인증 우회 기능을 활성화한다

### Requirement 3

**User Story:** As a 관리자, I want to 공간을 생성하고 관리하고 싶다, so that 게스트에게 VR 탐색 환경을 제공할 수 있다.

#### Acceptance Criteria

1. WHEN 관리자가 공간 생성을 요청하면 THE Backend API SHALL 공간명, 가로, 세로, 높이 정보를 저장하고 201 응답을 반환한다
2. WHEN 관리자가 공간 목록을 요청하면 THE Backend API SHALL 해당 관리자의 공간 목록을 페이지네이션과 함께 반환한다
3. WHEN 관리자가 공간 상세 정보를 요청하면 THE Backend API SHALL 공간 정보와 연관된 객체, 규칙, 트리거 정보를 반환한다
4. WHEN 관리자가 공간 정보를 수정하면 THE Backend API SHALL 변경된 정보를 저장하고 200 응답을 반환한다
5. WHEN 관리자가 공간을 삭제하면 THE Backend API SHALL 소프트 삭제를 수행하고 30일간 복구 가능 상태를 유지한다
6. WHEN 관리자가 공간 상태를 변경하면 THE Backend API SHALL draft, published, archived 상태 간 전환을 수행한다
7. WHEN 무료 플랜 관리자가 2개 이상의 공간을 생성하려 하면 THE Backend API SHALL SPACE_LIMIT_EXCEEDED 에러를 반환한다

### Requirement 4

**User Story:** As a 관리자, I want to 공간에 객체를 배치하고 싶다, so that 게스트가 3D 공간에서 가구와 시설물을 볼 수 있다.

#### Acceptance Criteria

1. WHEN 관리자가 객체 배치를 요청하면 THE Backend API SHALL 객체 타입, 위치, 회전, 스케일 정보를 저장한다
2. WHEN 관리자가 공간의 객체 목록을 요청하면 THE Backend API SHALL 해당 공간의 모든 객체와 연관 규칙을 반환한다
3. WHEN 관리자가 객체 정보를 수정하면 THE Backend API SHALL 위치, 회전, 스케일, 이름 정보를 업데이트한다
4. WHEN 관리자가 객체를 삭제하면 THE Backend API SHALL 객체와 연관된 모든 규칙을 함께 삭제한다
5. WHEN 공간당 객체가 50개를 초과하면 THE Backend API SHALL OBJECT_LIMIT_EXCEEDED 에러를 반환한다
6. WHEN 객체 타입 목록을 요청하면 THE Backend API SHALL 시스템 제공 객체 타입(가구, 가전, 시설물)을 반환한다

### Requirement 5

**User Story:** As a 관리자, I want to 객체에 규칙을 추가하고 싶다, so that 게스트가 사용 방법과 주의사항을 알 수 있다.

#### Acceptance Criteria

1. WHEN 관리자가 규칙 생성을 요청하면 THE Backend API SHALL 제목, 설명, 아이콘 타입, 우선순위를 저장한다
2. WHEN 관리자가 규칙에 자동 번역을 요청하면 THE Backend API SHALL 한국어 원문을 영어, 일본어, 중국어로 번역하여 저장한다
3. WHEN 관리자가 규칙 목록을 요청하면 THE Backend API SHALL 해당 객체의 모든 규칙을 우선순위 순으로 반환한다
4. WHEN 관리자가 규칙을 수정하면 THE Backend API SHALL 변경된 정보를 저장하고 번역 재생성 옵션을 제공한다
5. WHEN 관리자가 규칙을 삭제하면 THE Backend API SHALL 규칙과 연관된 번역, 이미지를 함께 삭제한다
6. WHEN 객체당 규칙이 10개를 초과하면 THE Backend API SHALL RULE_LIMIT_EXCEEDED 에러를 반환한다
7. WHEN 규칙 제목이 30자를 초과하면 THE Backend API SHALL TITLE_TOO_LONG 에러를 반환한다

### Requirement 6

**User Story:** As a 관리자, I want to 트리거 존을 설정하고 싶다, so that 게스트가 특정 위치에 도달했을 때 자동으로 알림을 받을 수 있다.

#### Acceptance Criteria

1. WHEN 관리자가 트리거 존 생성을 요청하면 THE Backend API SHALL 위치, 반경, 타입, 메시지, 자동닫기 시간을 저장한다
2. WHEN 관리자가 트리거 존 목록을 요청하면 THE Backend API SHALL 해당 공간의 모든 트리거 존을 반환한다
3. WHEN 관리자가 트리거 존을 수정하면 THE Backend API SHALL 변경된 정보를 저장한다
4. WHEN 관리자가 트리거 존을 삭제하면 THE Backend API SHALL 트리거와 연관된 번역을 함께 삭제한다
5. WHEN 공간당 트리거 존이 20개를 초과하면 THE Backend API SHALL TRIGGER_LIMIT_EXCEEDED 에러를 반환한다
6. WHEN 트리거 반경이 0.5m 미만이거나 3.0m 초과이면 THE Backend API SHALL INVALID_RADIUS 에러를 반환한다

### Requirement 7

**User Story:** As a 관리자, I want to QR 코드를 생성하고 싶다, so that 게스트가 쉽게 공간에 접근할 수 있다.

#### Acceptance Criteria

1. WHEN 관리자가 QR 코드 생성을 요청하면 THE Backend API SHALL 고유한 8자리 코드와 QR 이미지를 생성한다
2. WHEN 게스트가 QR 코드로 공간을 조회하면 THE Backend API SHALL 해당 공간의 전체 정보(객체, 규칙, 트리거)를 반환한다
3. WHEN QR 코드가 스캔되면 THE Backend API SHALL 스캔 횟수와 마지막 스캔 시간을 업데이트한다
4. WHEN 존재하지 않는 QR 코드로 조회하면 THE Backend API SHALL QR_NOT_FOUND 에러를 반환한다

### Requirement 8

**User Story:** As a 관리자, I want to 파일을 업로드하고 싶다, so that 규칙에 이미지를 첨부하고 3D 모델을 사용할 수 있다.

#### Acceptance Criteria

1. WHEN 관리자가 이미지 업로드를 요청하면 THE Backend API SHALL 파일을 저장하고 접근 URL을 반환한다
2. WHEN 이미지 파일이 2MB를 초과하면 THE Backend API SHALL FILE_TOO_LARGE 에러를 반환한다
3. WHEN 지원하지 않는 파일 형식이 업로드되면 THE Backend API SHALL INVALID_FILE_FORMAT 에러를 반환한다
4. WHEN 3D 모델 업로드를 요청하면 THE Backend API SHALL glb, gltf 형식의 파일을 저장한다
5. WHEN AR 메쉬 업로드를 요청하면 THE Backend API SHALL obj, glb 형식의 파일을 5MB 이하로 저장한다

### Requirement 9

**User Story:** As a 게스트, I want to 방문 기록을 남기고 싶다, so that 관리자가 사용 통계를 확인할 수 있다.

#### Acceptance Criteria

1. WHEN 게스트가 공간 탐색을 시작하면 THE Backend API SHALL 방문 세션을 생성하고 디바이스 ID, 언어, 모드를 기록한다
2. WHEN 게스트가 공간 탐색을 종료하면 THE Backend API SHALL 방문 종료 시간과 체류 시간을 기록한다
3. WHEN 게스트가 객체를 클릭하거나 트리거 존에 진입하면 THE Backend API SHALL 이벤트 로그를 기록한다
4. WHEN 관리자가 통계를 요청하면 THE Backend API SHALL 방문 수, 평균 체류 시간, 인기 객체 등을 반환한다

### Requirement 10

**User Story:** As a 개발자, I want to API가 안정적으로 동작하길 원한다, so that 서비스 품질을 보장할 수 있다.

#### Acceptance Criteria

1. WHEN API 요청이 들어오면 THE Backend API SHALL 500ms 이내에 응답한다
2. WHEN 인증되지 않은 요청이 보호된 엔드포인트에 접근하면 THE Backend API SHALL 401 Unauthorized 응답을 반환한다
3. WHEN 요청 데이터가 유효하지 않으면 THE Backend API SHALL 400 Bad Request와 상세 에러 메시지를 반환한다
4. WHEN 서버 에러가 발생하면 THE Backend API SHALL 500 Internal Server Error와 요청 ID를 반환한다
5. WHEN API 요청이 처리되면 THE Backend API SHALL 표준화된 JSON 응답 형식(success, data, meta)을 반환한다
