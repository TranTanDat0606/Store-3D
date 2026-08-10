import { Response } from 'express';

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface ApiResponseOptions {
  status?: number;
  message?: string;
  pagination?: PaginationMeta;
}

/** Standard API response envelope: { success, message, data, pagination, errors } */
export function successResponse<T>(
  res: Response,
  data: T,
  options: ApiResponseOptions = {},
) {
  const { status = 200, message = 'Thành công', pagination } = options;
  return res.status(status).json({
    success: true,
    message,
    data,
    ...(pagination ? { pagination } : {}),
  });
}

export function errorResponse(
  res: Response,
  status: number,
  message: string,
  errors: unknown[] = [],
) {
  return res.status(status).json({
    success: false,
    message,
    data: null,
    errors,
  });
}
