import { NextFunction, Request, Response } from 'express';
import { User, UserRole } from '../models';
import { AppError } from '../utils/AppError';
import { TOKEN_COOKIE_NAME, verifyToken } from '../utils/token';

export interface AuthRequest extends Request {
  user?: {
    _id: string;
    role: UserRole;
  };
}

/** Reads the JWT from the httpOnly cookie, verifies it and attaches the user. */
export async function requireAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  const token = req.cookies?.[TOKEN_COOKIE_NAME] || req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return next(new AppError('Bạn chưa đăng nhập', 401));
  }

  const payload = verifyToken(token);
  if (!payload) {
    return next(new AppError('Phiên đăng nhập không hợp lệ hoặc đã hết hạn', 401));
  }

  const user = await User.findById(payload.sub).select('_id role');
  if (!user) {
    return next(new AppError('Tài khoản không tồn tại', 401));
  }

  req.user = { _id: String(user._id), role: user.role };
  next();
}

/** Requires an admin role. Must run after requireAuth. */
export function requireAdmin(req: AuthRequest, _res: Response, next: NextFunction) {
  if (req.user?.role !== UserRole.Admin) {
    return next(new AppError('Bạn không có quyền truy cập', 403));
  }
  next();
}
