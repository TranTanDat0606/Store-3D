import crypto from 'crypto';
import { GameSession, GameSessionStatus, Order, OrderStatus, UserCoupon, UserCouponSource } from '../models';
import { AppError } from '../utils/AppError';
import { REWARD_TIERS, REWARD_COUPON_EXPIRY_DAYS, GAME_SESSION_TIMEOUT_MS } from '../config/rewards';
import type { StartGameInput, CompleteGameInput } from '../validators/reward';

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
      activeSession.status = GameSessionStatus.Expired;
      await activeSession.save();
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

  async completeGame(userId: string, data: CompleteGameInput) {
    const session = await GameSession.findById(data.sessionId);
    if (!session) throw new AppError('Không tìm thấy phiên chơi', 404);
    if (String(session.user) !== userId) throw new AppError('Phiên chơi không thuộc về bạn', 403);
    if (session.status !== GameSessionStatus.Active) {
      throw new AppError('Phiên chơi đã kết thúc', 400);
    }
    if (session.expiresAt <= new Date()) {
      session.status = GameSessionStatus.Expired;
      await session.save();
      throw new AppError('Phiên chơi đã hết hạn', 400);
    }

    session.score = data.score;
    session.status = GameSessionStatus.Completed;

    let reward: { code: string; discount: number; expiresAt: Date } | null = null;

    const tier = REWARD_TIERS.find((t) => data.score >= t.minScore);
    if (tier) {
      const code = `REWARD-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      const expiresAt = new Date(Date.now() + REWARD_COUPON_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

      const userCoupon = await UserCoupon.create({
        user: userId,
        code,
        discount: tier.discount,
        type: tier.type,
        orderId: session.order,
        source: UserCouponSource.Game,
        expiresAt,
      });

      session.rewardCoupon = userCoupon._id;
      reward = { code, discount: tier.discount, expiresAt };
    }

    await session.save();

    return { score: data.score, reward };
  }

  async getMyCoupons(userId: string) {
    const coupons = await UserCoupon.find({
      user: userId,
      usedAt: null,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    return coupons;
  }
}

export const rewardService = new RewardService();
