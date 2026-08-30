export const REWARD_TIERS = [
  { minScore: 100, discount: 30, type: 'percent' as const },
  { minScore: 90, discount: 25, type: 'percent' as const },
  { minScore: 80, discount: 20, type: 'percent' as const },
  { minScore: 70, discount: 15, type: 'percent' as const },
  { minScore: 60, discount: 10, type: 'percent' as const },
  { minScore: 50, discount: 5, type: 'percent' as const },
] as const;

export const REWARD_COUPON_EXPIRY_DAYS = 14;
export const GAME_SESSION_TIMEOUT_MS = 5 * 60 * 1000;
export const MAX_GAME_SCORE = 200;
export const MAX_DISCOUNT_VND = 200000;
