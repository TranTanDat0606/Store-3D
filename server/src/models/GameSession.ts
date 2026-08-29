import { Schema, model, models } from 'mongoose';
import type { Types } from 'mongoose';

export enum GameSessionStatus {
  Active = 'active',
  Completed = 'completed',
  Expired = 'expired',
}

export interface IGameSession {
  user: Types.ObjectId;
  order: Types.ObjectId;
  status: GameSessionStatus;
  score?: number;
  rewardCoupon?: Types.ObjectId;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const gameSessionSchema = new Schema<IGameSession>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Người dùng là bắt buộc'],
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Đơn hàng là bắt buộc'],
    },
    status: {
      type: String,
      enum: Object.values(GameSessionStatus),
      default: GameSessionStatus.Active,
    },
    score: {
      type: Number,
      min: [0, 'Điểm không được âm'],
    },
    rewardCoupon: {
      type: Schema.Types.ObjectId,
      ref: 'UserCoupon',
    },
    expiresAt: {
      type: Date,
      required: [true, 'Thời gian hết hạn là bắt buộc'],
    },
  },
  { timestamps: true },
);

gameSessionSchema.index({ user: 1, order: 1 }, { unique: true });
gameSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const GameSession =
  models.GameSession || model<IGameSession>('GameSession', gameSessionSchema);
