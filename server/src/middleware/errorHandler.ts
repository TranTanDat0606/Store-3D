import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { config } from '../config';
import { AppError } from '../utils/AppError';
import { errorResponse } from '../utils/apiResponse';

interface MongoError extends Error {
  code?: number;
  keyPattern?: Record<string, unknown>;
}

/** Central error handler. Returns the standard error envelope. */
export function errorHandler(
  err: Error | AppError | MongoError,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  let statusCode = 500;
  let message = 'Đã có lỗi xảy ra, vui lòng thử lại';

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join('; ');
  } else if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = 'Dữ liệu không hợp lệ';
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn';
  } else if (err.name === 'MulterError') {
    statusCode = 400;
    message = err.message === 'File too large' ? 'File ảnh quá lớn (tối đa 5MB)' : 'File tải lên không hợp lệ';
  } else if (err.name === 'CloudinaryError' || err.message?.includes('cloudinary') || err.message?.includes('Cloudinary')) {
    statusCode = 502;
    message = 'Tải ảnh lên đám mây thất bại. Vui lòng thử lại sau.';
  } else {
    const mongoErr = err as MongoError;
    if (mongoErr.code === 11000) {
      statusCode = 409;
      const field = Object.keys(mongoErr.keyPattern ?? {})[0] ?? 'field';
      message = `${field} đã tồn tại`;
    }
  }

  if (config.env === 'development') {
    console.error('[Error]', err.message, err.stack);
  }

  return errorResponse(res, statusCode, message);
}
