import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AppError, FORBIDDEN_MESSAGE } from '../src/utils/AppError';
import { GameSession, GameSessionStatus } from '../src/models';
import { rewardService } from '../src/services/rewardService';

interface Task11Seams {
  validateGameCompletion: (
    session: { user: unknown; status: string; expiresAt: Date; order?: unknown } | null,
    userId: unknown,
    score: number,
    now: Date,
  ) => { score: number };
  tierForScore: (score: number) => { code: string; percent: number } | null;
}

/**
 * Loads the Task 11 seams lazily so this file still evaluates — and each title
 * fails on its own assertion, not on module resolution — before the seams
 * exist (the failing-first proof required by the plan).
 */
async function loadSeams(): Promise<Task11Seams> {
  const mod = (await import('../src/services/rewardService')) as unknown as Record<string, unknown>;
  const missing = ['validateGameCompletion', 'tierForScore'].filter(
    (name) => typeof mod[name] !== 'function',
  );
  assert.deepEqual(missing, [], `Task 11 seams not implemented yet: ${missing.join(', ')}`);
  return mod as unknown as Task11Seams;
}

const NOW = new Date('2026-10-17T10:00:00.000Z');
const ME = '64b000000000000000000001';
const SOMEONE_ELSE = '64b000000000000000000002';

function activeSession(overrides: Record<string, unknown> = {}) {
  return {
    user: ME,
    status: GameSessionStatus.Active,
    expiresAt: new Date(NOW.getTime() + 5 * 60 * 1000),
    order: '64b000000000000000000010',
    ...overrides,
  };
}

function isAppError(err: unknown, statusCode: number, message: string): boolean {
  return err instanceof AppError && err.statusCode === statusCode && err.message === message;
}

/** Replaces one static model method for one test (zero-dep stub, restored after). */
function stubMethod(
  model: unknown,
  method: string,
  impl: (...args: unknown[]) => unknown,
): { restore: () => void; calls: unknown[][] } {
  const target = model as Record<string, unknown>;
  const own = Object.getOwnPropertyDescriptor(target, method);
  const calls: unknown[][] = [];
  target[method] = (...args: unknown[]) => {
    calls.push(args);
    return impl(...args);
  };
  return {
    calls,
    restore: () => {
      if (own) Object.defineProperty(target, method, own);
      else delete target[method];
    },
  };
}

// --- GAP-6: a completion must reference a session that exists (404) ---

test('game completion requires an existing session (404 otherwise)', async () => {
  const { validateGameCompletion } = await loadSeams();

  assert.throws(
    () => validateGameCompletion(null, ME, 100, NOW),
    (err: unknown) => isAppError(err, 404, 'Không tìm thấy phiên chơi'),
  );

  // Wire: completeGame answers 404 before touching any state when the session
  // does not exist (no findOneAndUpdate, no coupon creation).
  const findById = stubMethod(GameSession, 'findById', () => null);
  try {
    await assert.rejects(
      rewardService.completeGame(ME, { sessionId: '64b000000000000000000099', score: 100 }),
      (err: unknown) => isAppError(err, 404, 'Không tìm thấy phiên chơi'),
    );
    assert.equal(findById.calls.length, 1, 'service must look the session up first');
  } finally {
    findById.restore();
  }
});

// --- GAP-6: a session belongs to exactly one user (403) ---

test('game completion rejects sessions owned by another user (403)', async () => {
  const { validateGameCompletion } = await loadSeams();

  assert.throws(
    () => validateGameCompletion(activeSession({ user: SOMEONE_ELSE }), ME, 100, NOW),
    (err: unknown) => isAppError(err, 403, FORBIDDEN_MESSAGE),
  );

  // Wire: the service answers 403 with the shared forbidden copy.
  const findById = stubMethod(GameSession, 'findById', () =>
    activeSession({ user: SOMEONE_ELSE }),
  );
  try {
    await assert.rejects(
      rewardService.completeGame(ME, { sessionId: '64b000000000000000000099', score: 100 }),
      (err: unknown) => isAppError(err, 403, FORBIDDEN_MESSAGE),
    );
  } finally {
    findById.restore();
  }
});

// --- GAP-6: only an unexpired, still-active session can be completed (400) ---

test('game completion rejects expired or non-active sessions (400)', async () => {
  const { validateGameCompletion } = await loadSeams();

  // Non-active (already completed / expired state) — no replay, ever.
  for (const status of [GameSessionStatus.Completed, GameSessionStatus.Expired]) {
    assert.throws(
      () => validateGameCompletion(activeSession({ status }), ME, 100, NOW),
      (err: unknown) => isAppError(err, 400, 'Phiên chơi đã kết thúc'),
      `status ${status} must be rejected`,
    );
  }

  // Active but past its 5-minute window (expiry boundary: exactly now is out).
  assert.throws(
    () => validateGameCompletion(activeSession({ expiresAt: NOW }), ME, 100, NOW),
    (err: unknown) => isAppError(err, 400, 'Phiên chơi đã hết hạn'),
  );
  assert.throws(
    () =>
      validateGameCompletion(
        activeSession({ expiresAt: new Date(NOW.getTime() - 1) }),
        ME,
        100,
        NOW,
      ),
    (err: unknown) => isAppError(err, 400, 'Phiên chơi đã hết hạn'),
  );

  // A session one millisecond inside the window stays valid.
  assert.doesNotThrow(() =>
    validateGameCompletion(activeSession({ expiresAt: new Date(NOW.getTime() + 1) }), ME, 100, NOW),
  );
});

// --- GAP-6: the score is range-checked server-side, never trusted (0..200) ---

test('game completion rejects scores outside 0..200', async () => {
  const { validateGameCompletion } = await loadSeams();

  assert.throws(
    () => validateGameCompletion(activeSession(), ME, -1, NOW),
    (err: unknown) => isAppError(err, 400, 'Điểm không được âm'),
  );
  assert.throws(
    () => validateGameCompletion(activeSession(), ME, 201, NOW),
    (err: unknown) => isAppError(err, 400, 'Điểm tối đa 200'),
  );

  // Both endpoints of the allowed range pass through untouched.
  assert.deepEqual(validateGameCompletion(activeSession(), ME, 0, NOW), { score: 0 });
  assert.deepEqual(validateGameCompletion(activeSession(), ME, 200, NOW), { score: 200 });
});

// --- GAP-6: reward tiers mirror REWARD_TIERS at every boundary ---

test('tier mapping at score boundaries 49/50/60/99/100', async () => {
  const { tierForScore } = await loadSeams();

  assert.equal(tierForScore(49), null, 'below the lowest tier earns nothing');
  assert.equal(tierForScore(50)?.percent, 5);
  assert.equal(tierForScore(60)?.percent, 10);
  assert.equal(tierForScore(99)?.percent, 25, '99 falls into the 90-tier, not 100');
  assert.equal(tierForScore(100)?.percent, 30);
  assert.equal(tierForScore(200)?.percent, 30, 'max possible score keeps the top tier');

  // Every tier is a percent reward (the 200.000₫ cap is applied at order time,
  // not here).
  for (const score of [50, 60, 70, 80, 90, 100, 200]) {
    const tier = tierForScore(score);
    assert.ok(tier, `score ${score} must map to a tier`);
    assert.equal(typeof tier.percent, 'number');
    assert.equal(typeof tier.code, 'string');
  }
});
