export enum ErrorCode {
  // Auth related (AUTH_)
  EMAIL_ALREADY_EXISTS = 'AUTH_001',
  INVALID_CREDENTIALS = 'AUTH_002',
  WEAK_PASSWORD = 'AUTH_003',
  INVALID_TOKEN = 'AUTH_004',
  TOKEN_EXPIRED = 'AUTH_005',

  // Space related (SPACE_)
  SPACE_NOT_FOUND = 'SPACE_001',
  SPACE_LIMIT_EXCEEDED = 'SPACE_002',
  INVALID_DIMENSIONS = 'SPACE_003',

  // Object related (OBJECT_)
  OBJECT_NOT_FOUND = 'OBJECT_001',
  OBJECT_LIMIT_EXCEEDED = 'OBJECT_002',
  INVALID_OBJECT_TYPE = 'OBJECT_003',

  // Rule related (RULE_)
  RULE_NOT_FOUND = 'RULE_001',
  RULE_LIMIT_EXCEEDED = 'RULE_002',
  TITLE_TOO_LONG = 'RULE_003',

  // Trigger related (TRIGGER_)
  TRIGGER_NOT_FOUND = 'TRIGGER_001',
  TRIGGER_LIMIT_EXCEEDED = 'TRIGGER_002',
  INVALID_RADIUS = 'TRIGGER_003',

  // QR related (QR_)
  QR_NOT_FOUND = 'QR_001',

  // Visit related (VISIT_)
  VISIT_NOT_FOUND = 'VISIT_001',

  // File related (FILE_)
  FILE_TOO_LARGE = 'FILE_001',
  INVALID_FILE_FORMAT = 'FILE_002',

  // General (GENERAL_)
  VALIDATION_ERROR = 'GENERAL_001',
  INTERNAL_ERROR = 'GENERAL_002',
  NOT_FOUND = 'GENERAL_003',
  UNAUTHORIZED = 'GENERAL_004',
  FORBIDDEN = 'GENERAL_005',
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number = 400,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'AppError';

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(code: ErrorCode, message: string, details?: Record<string, unknown>): AppError {
    return new AppError(code, message, 400, details);
  }

  static unauthorized(message: string = 'Unauthorized'): AppError {
    return new AppError(ErrorCode.UNAUTHORIZED, message, 401);
  }

  static forbidden(message: string = 'Forbidden'): AppError {
    return new AppError(ErrorCode.FORBIDDEN, message, 403);
  }

  static notFound(code: ErrorCode, message: string): AppError {
    return new AppError(code, message, 404);
  }

  static internal(message: string = 'Internal server error'): AppError {
    return new AppError(ErrorCode.INTERNAL_ERROR, message, 500);
  }
}
