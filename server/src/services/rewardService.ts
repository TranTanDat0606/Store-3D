import crypto from 'crypto';
import { GameSession, GameSessionStatus, Order, OrderStatus, UserCoupon, UserCouponSource } from '../models';
import { AppError, FORBIDDEN_MESSAGE } from '../utils/AppError';
import {
  REWARD_TIERS,
  REWARD_COUPON_EXPIRY_DAYS,
  GAME_SESSION_TIMEOUT_MS,
  MAX_GAME_SCORE,
} from '../config/rewards';
import type { StartGameInput, CompleteGameInput } from '../validators/reward';

/**
 * GAP-6 — server-side validation of a game completion (pure seam).
 *
 * Residual limitation (pragmatic anti-cheat, documented per spec): the score
 * itself is chosen by the client inside a verified session and remains
 * unverifiable server-side. The abuse surface is bounded by one session per
 * completed order (unique {user, order} index + completed-session check in
 * `startGame`), the 5-minute session expiry (GAME_SESSION_TIMEOUT_MS), and the
 * 0..MAX_GAME_SCORE range enforced here.
 */
export function validateGameCompletion(
  session: { user: unknown; status: string; expiresAt: Date; order?: unknown } | null,
  userId: unknown,
  score: number,
  now: Date,
): { score: number } {
  if (!session) throw new AppError('Không tìm thấy phiên chơi', 404);
  if (String(session.user) !== String(userId)) throw new AppError(FORBIDDEN_MESSAGE, 403);
  if (session.status !== GameSessionStatus.Active) throw new AppError('Phiên chơi đã kết thúc', 400);
  if (new Date(session.expiresAt).getTime() <= now.getTime()) {
    throw new AppError('Phiên chơi đã hết hạn', 400);
  }
  if (!Number.isInteger(score)) throw new AppError('Điểm không hợp lệ', 400);
  if (score < 0) throw new AppError('Điểm không được âm', 400);
  if (score > MAX_GAME_SCORE) throw new AppError(`Điểm tối đa ${MAX_GAME_SCORE}`, 400);
  return { score };
}

/**
 * Mirrors REWARD_TIERS (single source of truth in config/rewards.ts): the
 * highest tier whose minScore the score reaches. The 200.000₫ discount cap is
 * NOT applied here — order-time redemption caps game coupons (Task 2).
 * `type` is carried through so callers never hardcode the coupon type.
 */
export function tierForScore(score: number): { code: string; percent: number; type: 'percent' } | null {
  const tier = REWARD_TIERS.find((t) => score >= t.minScore);
  if (!tier) return null;
  return { code: `TIER-${tier.minScore}`, percent: tier.discount, type: tier.type };
}

export class RewardService {
  async startGame(userId: string, data: StartGameInput) {
    const order = await Order.findById(data.orderId);
    if (!order) throw new AppError('Không tìm thấy đơn hàng', 404);
    if (String(order.user) !== userId) throw new AppError('Đơn hàng không thuộc về bạn', 403);
    if (order.status !== OrderStatus.Completed) {
      throw new AppError('Chỉ có thể chơi sau khi đơn hàng hoàn thành', 400);
    }

    const existingSession = await GameSession.findOne({
      user: userId,
      order: data.orderId,
      status: GameSessionStatus.Completed,
    });
    if (existingSession) {
      throw new AppError('Đơn hàng này đã được chơi game rồi', 400);
    }

    const activeSession = await GameSession.findOne({
      user: userId,
      order: data.orderId,
      status: GameSessionStatus.Active,
    });

    if (activeSession) {
      if (activeSession.expiresAt > new Date()) {
        return {
          sessionId: String(activeSession._id),
          expiresAt: activeSession.expiresAt,
        };
      }
      // Delete expired session so the unique index {user, order} is freed
      await GameSession.deleteOne({ _id: activeSession._id });
    }

    const expiresAt = new Date(Date.now() + GAME_SESSION_TIMEOUT_MS);
    const session = await GameSession.create({
      user: userId,
      order: data.orderId,
      status: GameSessionStatus.Active,
      expiresAt,
    });

    return {
      sessionId: String(session._id),
      expiresAt,
    };
  }

  /** Admin-only: start a test game without requiring an orderId. */
  async startTestGame(userId: string) {
    const activeSession = await GameSession.findOne({
      user: userId,
      order: null,
      status: GameSessionStatus.Active,
    });

    if (activeSession) {
      if (activeSession.expiresAt > new Date()) {
        return {
          sessionId: String(activeSession._id),
          expiresAt: activeSession.expiresAt,
        };
      }
      await GameSession.deleteOne({ _id: activeSession._id });
    }

    const expiresAt = new Date(Date.now() + GAME_SESSION_TIMEOUT_MS);
    const session = await GameSession.create({
      user: userId,
      status: GameSessionStatus.Active,
      expiresAt,
    });

    return {
      sessionId: String(session._id),
      expiresAt,
    };
  }

  async completeGame(userId: string, data: CompleteGameInput) {
    const now = new Date();

    // GAP-6: validate session state AND score BEFORE any state change or
    // coupon creation (pure seam — see validateGameCompletion for the
    // documented residual limitation of client-chosen scores).
    const lookedUp = await GameSession.findById(data.sessionId);
    validateGameCompletion(lookedUp, userId, data.score, now);

    // Atomic transition: only one caller can move active → completed (no replay).
    const session = await GameSession.findOneAndUpdate(
      { _id: data.sessionId, user: userId, status: GameSessionStatus.Active, expiresAt: { $gt: now } },
      { $set: { status: GameSessionStatus.Completed, score: data.score } },
      { new: true },
    );
    if (!session) {
      // Lost a race after validation — report the session's current state.
      const current = await GameSession.findById(data.sessionId);
      validateGameCompletion(current, userId, data.score, new Date());
      throw new AppError('Phiên chơi đã kết thúc', 400);
    }

    let reward: { code: string; discount: number; expiresAt: Date } | null = null;

    const tier = tierForScore(data.score);
    if (tier) {
      const code = `REWARD-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      const expiresAt = new Date(Date.now() + REWARD_COUPON_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

      const userCoupon = await UserCoupon.create({
        user: userId,
        code,
        discount: tier.percent,
        type: tier.type,
        orderId: session.order,
        source: UserCouponSource.Game,
        expiresAt,
      });

      session.rewardCoupon = userCoupon._id;
      await session.save();
      reward = { code, discount: tier.percent, expiresAt };
    }

    return { score: data.score, reward };
  }

  async getMyCoupons(userId: string) {
    const coupons = await UserCoupon.find({
      user: userId,
    }).sort({ createdAt: -1 });

    return coupons;
  }
}

export const rewardService = new RewardService();
