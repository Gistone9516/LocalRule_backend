import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta: {
    timestamp: string;
    requestId: string;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: ApiResponse['meta'] & {
    pagination: PaginationMeta;
  };
}

function createMeta(requestId?: string): ApiResponse['meta'] {
  return {
    timestamp: new Date().toISOString(),
    requestId: requestId || uuidv4(),
  };
}

export function successResponse<T>(
  res: Response,
  data: T,
  statusCode: number = 200,
  requestId?: string
): Response {
  const response: ApiResponse<T> = {
    success: true,
    data,
    meta: createMeta(requestId),
  };
  return res.status(statusCode).json(response);
}

export function paginatedResponse<T>(
  res: Response,
  data: T[],
  pagination: PaginationMeta,
  requestId?: string
): Response {
  const response: PaginatedResponse<T> = {
    success: true,
    data,
    meta: {
      ...createMeta(requestId),
      pagination,
    },
  };
  return res.status(200).json(response);
}

export function errorResponse(
  res: Response,
  code: string,
  message: string,
  statusCode: number = 400,
  details?: Record<string, unknown>,
  requestId?: string
): Response {
  const response: ApiResponse = {
    success: false,
    error: {
      code,
      message,
      details,
    },
    meta: createMeta(requestId),
  };
  return res.status(statusCode).json(response);
}

export function createdResponse<T>(res: Response, data: T, requestId?: string): Response {
  return successResponse(res, data, 201, requestId);
}

export function noContentResponse(res: Response): Response {
  return res.status(204).send();
}
