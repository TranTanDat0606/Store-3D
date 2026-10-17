import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Types } from 'mongoose';
import { authService } from '../src/services/authService';
import { requireAuth, optionalAuth, type AuthRequest } from '../src/middleware/auth';
import { User } from '../src/models';
import { signToken } from '../src/utils/token';
import { AppError } from '../src/utils/AppError';

// signToken/verifyToken read config.jwt lazily; fall back when no .env is present.
process.env.JWT_SECRET ??= 'test-secret';
process.env.MONGODB_URI ??= 'mongodb://127.0.0.1:27017/store3d-test';

type AssertUserActive = (user: { active?: boolean }) => void;

/**
 * Loads the Task 7 seam lazily so this file still evaluates (and each title
 * fails on its own assertion, not on module resolution) before the seam
 * exists — the failing-first proof required by the plan.
 */
async function loadAssertUserActive(): Promise<AssertUserActive> {
  const mod = (await import('../src/services/authService')) as unknown as Record<string, unknown>;
  return mod.assertUserActive as AssertUserActive;
}

/** Replaces a User model static for one test (zero-dep stub, restored after). */
function stubUserMethod(name: 'findOne' | 'findById', impl: () => unknown): () => void {
  const model = User as unknown as Record<string, unknown>;
  const own = Object.getOwnPropertyDescriptor(model, name);
  model[name] = impl;
  return () => {
    if (own) Object.defineProperty(model, name, own);
    else delete model[name];
  };
}

function fakeLoginUser(active: boolean, passwordOk: boolean) {
  return {
    active,
    comparePassword: async () => passwordOk,
    toObject: () => ({
      _id: '64b000000000000000000001',
      fullname: 'Người Dùng Test',
      email: 'user@test.com',
      role: 'customer',
      active,
      password: 'hash',
      comparePassword: async () => false,
    }),
  };
}

interface MiddlewareRun {
  req: AuthRequest;
  nextError: unknown;
  nextCalls: number;
}

async function runAuthMiddleware(
  middleware: typeof requireAuth,
  token: string,
  userDoc: unknown,
): Promise<MiddlewareRun> {
  const restore = stubUserMethod('findById', () => ({ select: async () => userDoc }));
  const req = { cookies: { token }, headers: {} } as unknown as AuthRequest;
  let nextError: unknown;
  let nextCalls = 0;
  try {
    await middleware(req, {} as never, (err?: unknown) => {
      nextCalls += 1;
      nextError = err;
    });
  } finally {
    restore();
  }
  return { req, nextError, nextCalls };
}

// --- login (GAP-11): inactive accounts can no longer establish a session ---

test('login accepts users with active true', async () => {
  const assertUserActive = await loadAssertUserActive();
  assert.doesNotThrow(() => assertUserActive({ active: true }));

  const restore = stubUserMethod('findOne', () => ({
    select: async () => fakeLoginUser(true, true),
  }));
  try {
    const { user } = await authService.login({ email: 'user@test.com', password: 'pw' });
    assert.equal(user.email, 'user@test.com');
  } finally {
    restore();
  }
});

test('login rejects inactive users with 403 Vietnamese message', async () => {
  const assertUserActive = await loadAssertUserActive();
  // Seam contract: message-first AppError, 403, exact Vietnamese copy.
  assert.throws(
    () => assertUserActive({ active: false }),
    (err: unknown) =>
      err instanceof AppError &&
      err.statusCode === 403 &&
      err.message === 'Tài khoản đã bị vô hiệu hóa',
  );

  const restore = stubUserMethod('findOne', () => ({
    select: async () => fakeLoginUser(false, true),
  }));
  try {
    // Correct password, deactivated account → exact 403 rejection.
    await assert.rejects(
      authService.login({ email: 'user@test.com', password: 'pw' }),
      (err: unknown) =>
        err instanceof AppError &&
        err.statusCode === 403 &&
        err.message === 'Tài khoản đã bị vô hiệu hóa',
    );

    // Message order pinned: credentials are checked BEFORE the active flag,
    // so wrong-password behaviour is unchanged even for a deactivated account.
    const restoreWrongPw = stubUserMethod('findOne', () => ({
      select: async () => fakeLoginUser(false, false),
    }));
    try {
      await assert.rejects(
        authService.login({ email: 'user@test.com', password: 'sai' }),
        (err: unknown) =>
          err instanceof AppError &&
          err.statusCode === 401 &&
          err.message === 'Email hoặc mật khẩu không đúng',
      );
    } finally {
      restoreWrongPw();
    }

    // User-not-found behaviour is unchanged as well.
    const restoreMissing = stubUserMethod('findOne', () => ({
      select: async () => null,
    }));
    try {
      await assert.rejects(
        authService.login({ email: 'khong-ton-tai@test.com', password: 'pw' }),
        (err: unknown) =>
          err instanceof AppError &&
          err.statusCode === 401 &&
          err.message === 'Email hoặc mật khẩu không đúng',
      );
    } finally {
      restoreMissing();
    }
  } finally {
    restore();
  }
});

// --- requireAuth (GAP-11): the session is revalidated on every request ---

test('requireAuth rejects sessions whose user has been deactivated', async () => {
  const token = signToken(new Types.ObjectId(), 'customer');
  const userId = '64b000000000000000000001';

  const deactivated = await runAuthMiddleware(requireAuth, token, {
    _id: userId,
    role: 'customer',
    active: false,
  });
  assert.equal(deactivated.nextCalls, 1);
  assert.ok(deactivated.nextError instanceof AppError);
  const err = deactivated.nextError as AppError;
  assert.equal(err.statusCode, 403);
  assert.equal(err.message, 'Tài khoản đã bị vô hiệu hóa');
  // The request stops here: no user is attached to a deactivated session.
  assert.equal(deactivated.req.user, undefined);

  const active = await runAuthMiddleware(requireAuth, token, {
    _id: userId,
    role: 'customer',
    active: true,
  });
  assert.equal(active.nextError, undefined);
  assert.equal(active.req.user?._id, userId);
  assert.equal(active.req.user?.role, 'customer');
});

// --- optionalAuth (Task 1b preserved): degrade to anonymous, never 403 ---

test('optional auth ignores inactive users and treats them as anonymous', async () => {
  const token = signToken(new Types.ObjectId(), 'admin');
  const userId = '64b000000000000000000001';

  const inactive = await runAuthMiddleware(optionalAuth, token, {
    _id: userId,
    role: 'admin',
    active: false,
  });
  // Never errors a public route (no 403)…
  assert.equal(inactive.nextCalls, 1);
  assert.equal(inactive.nextError, undefined);
  // …but the deactivated admin degrades to anonymous/public behaviour.
  assert.equal(inactive.req.user, undefined);

  const active = await runAuthMiddleware(optionalAuth, token, {
    _id: userId,
    role: 'admin',
    active: true,
  });
  assert.equal(active.nextError, undefined);
  assert.equal(active.req.user?.role, 'admin');
});
