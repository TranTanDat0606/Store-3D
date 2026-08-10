import jwt, { type SignOptions } from 'jsonwebtoken';
import { config } from '../config';
import type { Types } from 'mongoose';

interface TokenPayload {
  sub: string;
  role: string;
}

export const TOKEN_COOKIE_NAME = 'token';

const expiresIn = config.jwt.expiresIn as SignOptions['expiresIn'];

/** Signs a JWT for the given user. */
export function signToken(userId: Types.ObjectId, role: string): string {
  const payload: TokenPayload = { sub: String(userId), role };
  return jwt.sign(payload, config.jwt.secret, { expiresIn });
}

/** Verifies a JWT and returns the payload, or null when invalid/expired. */
export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    if (typeof decoded === 'object' && decoded.sub) {
      return { sub: String(decoded.sub), role: String(decoded.role ?? 'customer') };
    }
    return null;
  } catch {
    return null;
  }
}

/** Cookie options: httpOnly + sameSite so the token is not readable by JS. */
export const tokenCookieOptions = {
  httpOnly: true,
  secure: config.env === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};
