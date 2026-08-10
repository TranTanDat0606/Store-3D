import { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/AppError';

/** 404 handler for unmatched routes. */
export function notFoundHandler(_req: Request, _res: Response, next: NextFunction) {
  next(new AppError('Không tìm thấy tài nguyên', 404));
}
