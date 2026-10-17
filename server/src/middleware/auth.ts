import { NextFunction, Request, Response } from 'express';
import { User, UserRole } from '../models';
import { AppError } from '../utils/AppError';
import { assertUserActive } from '../services/authService';
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

  const user = await User.findById(payload.sub).select('_id role active');
  if (!user) {
    return next(new AppError('Tài khoản không tồn tại', 401));
  }

  // GAP-11 (Task 7): the session is revalidated on EVERY request — a user
  // deactivated after logging in loses their existing cookie immediately.
  try {
    assertUserActive(user);
  } catch (err) {
    return next(err);
  }

  req.user = { _id: String(user._id), role: user.role };
  next();
}

/**
 * Optional auth (Task 1b): attaches the user ONLY when a valid token is
 * present; on a missing/invalid/expired token or a failed lookup it simply
 * leaves `req.user` unset. It never calls `next(err)`, so it can never turn a
 * public route into a 401 — read-only decoration for `GET /api/products`.
 *
 * Task 7 (GAP-11): a deactivated account is also left unattached — an
 * inactive admin degrades to anonymous/public behaviour on a public GET
 * instead of getting a 403.
 */
export async function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[TOKEN_COOKIE_NAME] || req.headers.authorization?.replace('Bearer ', '');
    if (!token) return next();

    const payload = verifyToken(token);
    if (!payload) return next();

    const user = await User.findById(payload.sub).select('_id role active');
    if (!user) return next();

    // Throws for a deactivated account → caught below → treated as anonymous.
    assertUserActive(user);
    req.user = { _id: String(user._id), role: user.role };
  } catch {
    // Never fail a public route because of auth decoration.
    req.user = undefined;
  }
  next();
}

/** Requires an admin role. Must run after requireAuth. */
export function requireAdmin(req: AuthRequest, _res: Response, next: NextFunction) {
  if (req.user?.role !== UserRole.Admin) {
    return next(new AppError('Bạn không có quyền truy cập', 403));
  }
  next();
}
