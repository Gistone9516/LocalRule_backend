import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'LocalRule Backend API',
      version: '1.0.0',
      description: '센서 기반 VR 공간 규칙 탐색 플랫폼 백엔드 API',
      contact: {
        name: 'LocalRule Team',
      },
    },
    servers: [
      {
        url: '/api/v1',
        description: 'API v1',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT 인증 토큰',
        },
      },
      schemas: {
        // Common response schemas
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object' },
            meta: {
              type: 'object',
              properties: {
                timestamp: { type: 'string', format: 'date-time' },
                requestId: { type: 'string' },
              },
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
                details: { type: 'object' },
              },
            },
            meta: {
              type: 'object',
              properties: {
                timestamp: { type: 'string', format: 'date-time' },
                requestId: { type: 'string' },
              },
            },
          },
        },
        // Auth schemas
        RegisterRequest: {
          type: 'object',
          required: ['email', 'password', 'name'],
          properties: {
            email: { type: 'string', format: 'email', example: 'admin@example.com' },
            password: { type: 'string', minLength: 8, example: 'Password123!' },
            name: { type: 'string', example: '홍길동' },
            phone: { type: 'string', example: '010-1234-5678' },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'admin@example.com' },
            password: { type: 'string', example: 'Password123!' },
          },
        },
        AuthTokens: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
            expiresIn: { type: 'number', example: 3600 },
          },
        },
        Admin: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            phone: { type: 'string' },
            plan: { type: 'string', enum: ['free', 'basic', 'premium'] },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        // Space schemas
        CreateSpaceRequest: {
          type: 'object',
          required: ['name', 'width', 'depth'],
          properties: {
            name: { type: 'string', example: '201호' },
            description: { type: 'string', example: '2층 더블룸' },
            width: { type: 'number', example: 5.0 },
            depth: { type: 'number', example: 4.0 },
            height: { type: 'number', example: 2.5 },
          },
        },
        Space: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            description: { type: 'string' },
            width: { type: 'number' },
            depth: { type: 'number' },
            height: { type: 'number' },
            status: { type: 'string', enum: ['draft', 'published', 'archived'] },
            adminId: { type: 'string', format: 'uuid' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        // Object schemas
        CreateObjectRequest: {
          type: 'object',
          required: ['objectTypeId', 'position'],
          properties: {
            objectTypeId: { type: 'string', format: 'uuid' },
            customName: { type: 'string', example: '침대' },
            position: {
              type: 'object',
              properties: {
                x: { type: 'number' },
                y: { type: 'number' },
                z: { type: 'number' },
              },
            },
            rotation: {
              type: 'object',
              properties: {
                x: { type: 'number' },
                y: { type: 'number' },
                z: { type: 'number' },
              },
            },
            scale: {
              type: 'object',
              properties: {
                x: { type: 'number' },
                y: { type: 'number' },
                z: { type: 'number' },
              },
            },
          },
        },
        SpaceObject: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            objectTypeId: { type: 'string', format: 'uuid' },
            customName: { type: 'string' },
            positionX: { type: 'number' },
            positionY: { type: 'number' },
            positionZ: { type: 'number' },
            rotationX: { type: 'number' },
            rotationY: { type: 'number' },
            rotationZ: { type: 'number' },
            scaleX: { type: 'number' },
            scaleY: { type: 'number' },
            scaleZ: { type: 'number' },
            spaceId: { type: 'string', format: 'uuid' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        ObjectType: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            category: { type: 'string' },
            defaultModelUrl: { type: 'string' },
          },
        },
        // Rule schemas
        CreateRuleRequest: {
          type: 'object',
          required: ['title', 'description', 'iconType'],
          properties: {
            title: { type: 'string', maxLength: 30, example: '사용 금지' },
            description: { type: 'string', example: '이 물건은 사용하지 마세요' },
            iconType: { type: 'string', enum: ['prohibited', 'warning', 'tip', 'info'] },
            priority: { type: 'integer', minimum: 1, maximum: 10, example: 1 },
          },
        },
        LocalRule: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            description: { type: 'string' },
            iconType: { type: 'string', enum: ['prohibited', 'warning', 'tip', 'info'] },
            priority: { type: 'integer' },
            displayOrder: { type: 'integer' },
            objectId: { type: 'string', format: 'uuid' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        // Trigger schemas
        CreateTriggerRequest: {
          type: 'object',
          required: ['position', 'radius', 'triggerType', 'message'],
          properties: {
            position: {
              type: 'object',
              properties: {
                x: { type: 'number' },
                y: { type: 'number' },
                z: { type: 'number' },
              },
            },
            radius: { type: 'number', minimum: 0.5, maximum: 3.0, example: 1.0 },
            triggerType: { type: 'string', enum: ['warning', 'caution', 'info'] },
            message: { type: 'string', example: '주의하세요!' },
            autoCloseSeconds: { type: 'integer', example: 5 },
          },
        },
        TriggerZone: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            positionX: { type: 'number' },
            positionY: { type: 'number' },
            positionZ: { type: 'number' },
            radius: { type: 'number' },
            triggerType: { type: 'string', enum: ['warning', 'caution', 'info'] },
            message: { type: 'string' },
            autoCloseSeconds: { type: 'integer' },
            spaceId: { type: 'string', format: 'uuid' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        // QR schemas
        QRCode: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            code: { type: 'string', example: 'ABC12345' },
            qrImageUrl: { type: 'string' },
            scanCount: { type: 'integer' },
            lastScannedAt: { type: 'string', format: 'date-time' },
            spaceId: { type: 'string', format: 'uuid' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        // Visit schemas
        StartVisitRequest: {
          type: 'object',
          required: ['spaceId', 'deviceId', 'language', 'mode'],
          properties: {
            spaceId: { type: 'string', format: 'uuid' },
            deviceId: { type: 'string' },
            language: { type: 'string', enum: ['ko', 'en', 'ja', 'zh'] },
            mode: { type: 'string', enum: ['vr', 'ar'] },
          },
        },
        GuestVisit: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            deviceId: { type: 'string' },
            language: { type: 'string' },
            mode: { type: 'string' },
            startedAt: { type: 'string', format: 'date-time' },
            endedAt: { type: 'string', format: 'date-time' },
            durationSeconds: { type: 'integer' },
            spaceId: { type: 'string', format: 'uuid' },
          },
        },
        LogEventRequest: {
          type: 'object',
          required: ['eventType'],
          properties: {
            eventType: { type: 'string', enum: ['object_click', 'trigger_enter', 'trigger_exit', 'rule_view'] },
            objectId: { type: 'string', format: 'uuid' },
            triggerId: { type: 'string', format: 'uuid' },
            ruleId: { type: 'string', format: 'uuid' },
            metadata: { type: 'object' },
          },
        },
        SpaceStats: {
          type: 'object',
          properties: {
            totalVisits: { type: 'integer' },
            averageDuration: { type: 'number' },
            popularObjects: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  objectId: { type: 'string' },
                  clickCount: { type: 'integer' },
                },
              },
            },
          },
        },
        // Upload schemas
        FileUpload: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            fileType: { type: 'string', enum: ['image', 'model', 'mesh'] },
            originalName: { type: 'string' },
            storedName: { type: 'string' },
            fileUrl: { type: 'string' },
            mimeType: { type: 'string' },
            fileSize: { type: 'string' }, // BigInt returned as string json
            status: { type: 'string', enum: ['pending', 'completed', 'failed'] },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    tags: [
      { name: 'Auth', description: '인증 관련 API' },
      { name: 'Spaces', description: '공간 관리 API' },
      { name: 'Objects', description: '객체 관리 API' },
      { name: 'Rules', description: '규칙 관리 API' },
      { name: 'Triggers', description: '트리거 존 관리 API' },
      { name: 'QR', description: 'QR 코드 API' },
      { name: 'Visits', description: '방문 기록 API' },
      { name: 'Upload', description: '파일 업로드 및 관리 API' },
    ],
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
