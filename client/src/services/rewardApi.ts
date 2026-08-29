import apiClient from './apiClient'
import type { ApiResponse, UserCoupon } from '@/types'

export interface GameStartResponse {
  sessionId: string
  expiresAt: string
}

export interface GameReward {
  code: string
  discount: number
  expiresAt: string
}

export interface GameCompleteResponse {
  score: number
  reward: GameReward | null
}

export const rewardApi = {
  startGame: (orderId: string) =>
    apiClient.post<ApiResponse<GameStartResponse>>('/rewards/game/start', { orderId }).then((r) => r.data.data),

  completeGame: (sessionId: string, score: number) =>
    apiClient.post<ApiResponse<GameCompleteResponse>>('/rewards/game/complete', { sessionId, score }).then((r) => r.data.data),

  myCoupons: () =>
    apiClient.get<ApiResponse<UserCoupon[]>>('/rewards/my-coupons').then((r) => r.data.data),
}
