# Implementation Plan

- [x] 1. 프로젝트 초기 설정






  - [x] 1.1 Node.js Express TypeScript 프로젝트 생성

    - package.json 생성 및 의존성 설치 (express, typescript, prisma, bcrypt, jsonwebtoken 등)
    - tsconfig.json 설정
    - ESLint, Prettier 설정
    - _Requirements: 1.1, 1.3_

  - [x] 1.2 Prisma 스키마 및 데이터베이스 설정

    - prisma/schema.prisma 작성 (Admin, Space, SpaceObject, LocalRule, TriggerZone, QRCode, GuestVisit 등)
    - PostgreSQL 연결 설정
    - 마이그레이션 실행
    - _Requirements: 1.2_

  - [x] 1.3 Express 앱 기본 구조 설정

    - src/app.ts: Express 앱 설정 (CORS, JSON parser, 에러 핸들러)
    - src/server.ts: 서버 진입점
    - src/config/index.ts: 환경 설정
    - _Requirements: 1.4_

  - [x] 1.4 테스트 환경 설정

    - Jest 설정 (jest.config.js)
    - fast-check 설정
    - 테스트 헬퍼 및 생성기 작성
    - _Requirements: 1.5_

- [x] 2. 공통 유틸리티 및 미들웨어 구현





  - [x] 2.1 응답 유틸리티 구현


    - src/utils/response.ts: 표준화된 JSON 응답 형식
    - success, error 응답 헬퍼 함수
    - _Requirements: 10.5_

  - [x] 2.2 Property test: 응답 형식 표준화

    - **Property 42: Response format is standardized**
    - **Validates: Requirements 10.5**

  - [x] 2.3 에러 처리 구현

    - src/utils/errors.ts: AppError 클래스 및 에러 코드 정의
    - src/middleware/error.middleware.ts: 중앙 집중식 에러 핸들러
    - _Requirements: 10.3, 10.4_
  - [x] 2.4 Property test: 유효하지 않은 데이터 검증


    - **Property 41: Invalid data returns 400**
    - **Validates: Requirements 10.3**

  - [x] 2.5 JWT 유틸리티 구현

    - src/utils/jwt.ts: 토큰 생성, 검증, 디코드 함수
    - _Requirements: 2.3, 2.6_

  - [x] 2.6 비밀번호 유틸리티 구현

    - src/utils/password.ts: 해싱, 검증, 강도 체크 함수
    - _Requirements: 2.1, 2.7_


- [-] 3. 인증 모듈 구현



  - [x] 3.1 인증 서비스 구현


    - src/services/auth.service.ts: register, login, logout, refreshToken 메서드
    - 개발 환경 인증 우회 기능 (dev@localrule.app / DevPass123!)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.8, 2.9_

  - [x] 3.2 인증 컨트롤러 및 라우트 구현


    - src/controllers/auth.controller.ts
    - src/routes/auth.routes.ts
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_



  - [x] 3.3 인증 미들웨어 구현

    - src/middleware/auth.middleware.ts: JWT 검증 미들웨어
    - _Requirements: 10.2_
  - [x] 3.4 Property test: 회원가입 성공


    - **Property 1: Valid registration creates account**
    - **Validates: Requirements 2.1**
  - [x] 3.5 Property test: 중복 이메일 거부

    - **Property 2: Duplicate email registration fails**
    - **Validates: Requirements 2.2**
  - [x] 3.6 Property test: 유효한 로그인

    - **Property 3: Valid credentials return tokens**
    - **Validates: Requirements 2.3**
  - [x] 3.7 Property test: 잘못된 자격증명 거부

    - **Property 4: Invalid credentials are rejected**
    - **Validates: Requirements 2.4**


  - [ ] 3.8 Property test: 로그아웃 토큰 무효화




    - **Property 5: Logout invalidates token**
    - **Validates: Requirements 2.5**


  - [x] 3.9 Property test: 토큰 갱신

    - **Property 6: Refresh token generates new access token**
    - **Validates: Requirements 2.6**
  - [x] 3.10 Property test: 약한 비밀번호 거부

    - **Property 7: Weak passwords are rejected**
    - **Validates: Requirements 2.7**

  - [ ] 3.11 Property test: 인증되지 않은 요청 거부
    - **Property 40: Unauthenticated requests are rejected**
    - **Validates: Requirements 10.2**

- [ ] 4. Checkpoint - 인증 모듈 테스트 완료




  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. 공간 모듈 구현




  - [x] 5.1 공간 서비스 구현

    - src/services/space.service.ts: create, findAll, findById, update, delete, updateStatus, restore, updateFloorPlan
    - 플랜별 공간 제한 로직
    - 소프트 삭제 및 복구 로직
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [x] 5.2 공간 컨트롤러 및 라우트 구현
    - src/controllers/space.controller.ts
    - src/routes/space.routes.ts
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_
  - [x] 5.3 Property test: 공간 생성 성공
    - **Property 8: Valid space creation succeeds**
    - **Validates: Requirements 3.1**
  - [x] 5.4 Property test: 공간 목록 조회
    - **Property 9: Space list contains created spaces**
    - **Validates: Requirements 3.2, 3.3**
  - [x] 5.5 Property test: 공간 수정 반영
    - **Property 10: Space update persists changes**
    - **Validates: Requirements 3.4**
  - [x] 5.6 Property test: 소프트 삭제 및 복구
    - **Property 11: Soft delete allows recovery**
    - **Validates: Requirements 3.5**
  - [x] 5.7 Property test: 상태 전환
    - **Property 12: Status transitions are valid**
    - **Validates: Requirements 3.6**
  - [ ] 5.8 Property test: 무료 플랜 제한

    - **Property 13: Free plan space limit enforced**
    - **Validates: Requirements 3.7**


- [ ] 6. Checkpoint - 공간 모듈 테스트 완료
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. 객체 모듈 구현



  - [x] 7.1 객체 타입 시드 데이터 생성


    - prisma/seed.ts: 기본 객체 타입 (침대, 소파, 세탁기 등) 시드
    - _Requirements: 4.6_

  - [x] 7.2 객체 서비스 구현

    - src/services/object.service.ts: create, findBySpaceId, update, delete, getObjectTypes
    - 공간당 객체 50개 제한 로직
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [x] 7.3 객체 컨트롤러 및 라우트 구현

    - src/controllers/object.controller.ts
    - src/routes/object.routes.ts
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.6_


  - [x] 7.4 Property test: 객체 생성
    - **Property 14: Object creation stores all data**
    - **Validates: Requirements 4.1**
  - [x] 7.5 Property test: 객체 목록 조회
    - **Property 15: Object list includes all objects**
    - **Validates: Requirements 4.2, 4.3**
  - [x] 7.6 Property test: 객체 삭제 시 규칙 삭제
    - **Property 16: Object deletion cascades to rules**
    - **Validates: Requirements 4.4**
  - [ ] 7.7 Property test: 객체 제한

    - **Property 17: Object limit per space enforced**
    - **Validates: Requirements 4.5**

- [x] 8. 규칙 모듈 구현




  - [x] 8.1 규칙 서비스 구현

    - src/services/rule.service.ts: create, findByObjectId, update, delete, updateOrder
    - 객체당 규칙 10개 제한 로직
    - 우선순위 정렬 로직
    - _Requirements: 5.1, 5.3, 5.4, 5.5, 5.6, 5.7_


  - [x] 8.2 규칙 컨트롤러 및 라우트 구현
    - src/controllers/rule.controller.ts
    - src/routes/rule.routes.ts
    - _Requirements: 5.1, 5.3, 5.4, 5.5_
  - [x] 8.3 Property test: 규칙 생성


    - **Property 18: Rule creation stores all data**
    - **Validates: Requirements 5.1**
  - [x] 8.4 Property test: 규칙 우선순위 정렬


    - **Property 19: Rules are sorted by priority**
    - **Validates: Requirements 5.3**
  - [x] 8.5 Property test: 규칙 수정 반영



    - **Property 20: Rule update persists changes**
    - **Validates: Requirements 5.4**

  - [x] 8.6 Property test: 규칙 삭제 시 번역 삭제
    - **Property 21: Rule deletion cascades to translations**
    - **Validates: Requirements 5.5**
  - [x] 8.7 Property test: 규칙 제한

    - **Property 22: Rule limit per object enforced**
    - **Validates: Requirements 5.6**

  - [ ] 8.8 Property test: 제목 길이 검증

    - **Property 23: Rule title length validated**
    - **Validates: Requirements 5.7**

- [ ] 9. Checkpoint - 객체/규칙 모듈 테스트 완료
  - Ensure all tests pass, ask the user if questions arise.


- [x] 10. 트리거 모듈 구현



  - [x] 10.1 트리거 서비스 구현


    - src/services/trigger.service.ts: create, findBySpaceId, update, delete
    - 공간당 트리거 20개 제한 로직
    - 반경 유효성 검증 (0.5m ~ 3.0m)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [x] 10.2 트리거 컨트롤러 및 라우트 구현

    - src/controllers/trigger.controller.ts
    - src/routes/trigger.routes.ts
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  - [x] 10.3 Property test: 트리거 생성


    - **Property 24: Trigger creation stores all data**
    - **Validates: Requirements 6.1**
  - [x] 10.4 Property test: 트리거 목록 조회

    - **Property 25: Trigger list returns all triggers**
    - **Validates: Requirements 6.2**


  - [x] 10.5 Property test: 트리거 수정 반영
    - **Property 26: Trigger update persists changes**
    - **Validates: Requirements 6.3**
  - [x] 10.6 Property test: 트리거 삭제 시 번역 삭제

    - **Property 27: Trigger deletion cascades to translations**
    - **Validates: Requirements 6.4**


  - [x] 10.7 Property test: 트리거 제한

    - **Property 28: Trigger limit per space enforced**

    - **Validates: Requirements 6.5**
  - [x] 10.8 Property test: 반경 검증

    - **Property 29: Trigger radius validated**
    - **Validates: Requirements 6.6**

- [x] 11. QR 코드 모듈 구현



  - [x] 11.1 QR 서비스 구현


    - src/services/qr.service.ts: generate, findByCode, incrementScanCount
    - 8자리 고유 코드 생성 로직
    - QR 이미지 생성 (qrcode 라이브러리)
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [x] 11.2 QR 컨트롤러 및 라우트 구현

    - src/controllers/qr.controller.ts
    - src/routes/qr.routes.ts
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [x] 11.3 Property test: QR 코드 고유성

    - **Property 30: QR code is unique and 8 characters**
    - **Validates: Requirements 7.1**

  - [x] 11.4 Property test: QR 조회 시 전체 데이터 반환
    - **Property 31: QR lookup returns full space data**

    - **Validates: Requirements 7.2**
  - [x] 11.5 Property test: 스캔 카운트 증가

    - **Property 32: QR scan increments counter**
    - **Validates: Requirements 7.3**
  - [x] 11.6 Property test: 존재하지 않는 QR 에러

    - **Property 33: Invalid QR returns error**
    - **Validates: Requirements 7.4**

- [ ] 12. Checkpoint - 트리거/QR 모듈 테스트 완료
  - Ensure all tests pass, ask the user if questions arise.


- [ ] 13. 파일 업로드 모듈 구현
  - [ ] 13.1 파일 업로드 서비스 구현
    - src/services/upload.service.ts: uploadImage, uploadModel, uploadMesh
    - 파일 크기 검증 (이미지 2MB, 메쉬 5MB)
    - 파일 형식 검증 (jpg, png, glb, gltf, obj)
    - 로컬 파일 저장 (uploads/ 디렉토리)
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
  - [ ] 13.2 파일 업로드 컨트롤러 및 라우트 구현
    - src/controllers/upload.controller.ts
    - src/routes/upload.routes.ts
    - multer 미들웨어 설정
    - _Requirements: 8.1, 8.4, 8.5_
  - [ ] 13.3 Property test: 이미지 업로드 성공
    - **Property 34: Valid image upload returns URL**
    - **Validates: Requirements 8.1**
  - [ ] 13.4 Property test: 파일 크기 제한
    - **Property 35: Large files are rejected**
    - **Validates: Requirements 8.2**
  - [ ] 13.5 Property test: 파일 형식 제한
    - **Property 36: Invalid formats are rejected**
    - **Validates: Requirements 8.3**



- [x] 14. 방문 기록 모듈 구현



  - [x] 14.1 방문 서비스 구현


    - src/services/visit.service.ts: startVisit, endVisit, logEvent, getStats
    - 체류 시간 계산 로직
    - 통계 집계 로직
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [x] 14.2 방문 컨트롤러 및 라우트 구현

    - src/controllers/visit.controller.ts
    - src/routes/visit.routes.ts
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [x] 14.3 Property test: 방문 세션 생성

    - **Property 37: Visit session records all data**
    - **Validates: Requirements 9.1**

  - [x] 14.4 Property test: 방문 종료 기록

    - **Property 38: Visit end records duration**
    - **Validates: Requirements 9.2**

  - [x] 14.5 Property test: 이벤트 로그 기록
    - **Property 39: Events are logged correctly**
    - **Validates: Requirements 9.3**

- [ ] 15. 번역 모듈 구현
  - [ ] 15.1 번역 서비스 구현
    - src/services/translate.service.ts: translate, translateBatch
    - 개발 환경에서는 Mock 번역 (원문 + [언어코드] 접미사)
    - AWS Translate 연동 준비 (인터페이스만)
    - _Requirements: 5.2_
  - [ ] 15.2 번역 컨트롤러 및 라우트 구현
    - src/controllers/translate.controller.ts (선택적)
    - 규칙/트리거 생성 시 자동 번역 연동
    - _Requirements: 5.2_

- [x] 16. 라우트 통합 및 최종 설정






  - [x] 16.1 모든 라우트 통합

    - src/routes/index.ts: 모든 라우트 통합
    - API 버전 프리픽스 (/api/v1)
    - _Requirements: 10.5_

  - [x] 16.2 Swagger/OpenAPI 문서 생성

    - swagger-jsdoc, swagger-ui-express 설정
    - API 문서 자동 생성
    - _Requirements: 10.5_

- [ ] 17. Final Checkpoint - 전체 테스트 완료
  - Ensure all tests pass, ask the user if questions arise.
