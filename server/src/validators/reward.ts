import { z } from 'zod';
import { MAX_GAME_SCORE } from '../config/rewards';

export const startGameSchema = z.object({
  orderId: z.string().min(1, 'Đơn hàng là bắt buộc'),
});

export const completeGameSchema = z.object({
  sessionId: z.string().min(1, 'Phiên chơi là bắt buộc'),
  score: z
    .number()
    .int()
    .min(0, 'Điểm không được âm')
    .max(MAX_GAME_SCORE, `Điểm tối đa ${MAX_GAME_SCORE}`),
});

export type StartGameInput = z.infer<typeof startGameSchema>;
export type CompleteGameInput = z.infer<typeof completeGameSchema>;
