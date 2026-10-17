import type { CouponReleaseAction } from './orderService';

/**
 * GAP-4 — order-creation compensation (pure seam; no DB access here).
 *
 * `OrderService.create` runs without a multi-document transaction (MongoDB
 * Community standalone), so every persisted side effect is tagged with the
 * step that was in-flight when the write happened. If a later step throws,
 * `compensationPlanFor` returns the inverse actions — in reverse order — for
 * everything that actually persisted, and `runCompensation` executes them
 * best-effort (a failing action is logged, never masks the original error).
 */
export type OrderCreationStep =
  | 'order-created'
  | 'items-created'
  | 'stock-updated'
  | 'coupon-marked'
  | 'done';

export type CompensationAction =
  | { kind: 'delete-order'; payload: unknown }
  | { kind: 'delete-items'; payload: unknown }
  | { kind: 'restore-stock'; payload: unknown }
  | { kind: 'release-coupon'; payload: unknown };

/**
 * What actually persisted at the time of failure:
 * - `orderId`: the created order's id (null when creation itself failed);
 * - `items`: only the stock decrements that actually applied (partial-safe);
 * - `couponActions`: coupon usage actually consumed (GAP-3 release actions).
 */
export interface CompensationContext {
  orderId: unknown;
  items: Array<{ product: unknown; quantity: number }>;
  couponActions: CouponReleaseAction[];
}

/**
 * Inverse side effects for a failure at `failedStep` (the step in-flight when
 * the error was thrown). `'done'` means the creation fully succeeded — an
 * empty plan. Steps are a linear ladder: the later the failure, the more must
 * be undone. Coupon release comes first (its usage may predate the order —
 * reward coupons are claimed before `Order.create` per GAP-5).
 */
export function compensationPlanFor(
  failedStep: OrderCreationStep,
  ctx: CompensationContext,
): CompensationAction[] {
  const plan: CompensationAction[] = [];
  if (failedStep === 'done') return plan;

  if (ctx.couponActions.length > 0) {
    plan.push({ kind: 'release-coupon', payload: ctx.couponActions });
  }
  if (failedStep === 'order-created') return plan; // no order persisted yet

  if (failedStep !== 'items-created') {
    // Stock was (partially) decremented — restore exactly what applied.
    plan.push({ kind: 'restore-stock', payload: ctx.items });
  }
  plan.push({ kind: 'delete-items', payload: ctx.orderId });
  plan.push({ kind: 'delete-order', payload: ctx.orderId });
  return plan;
}

/**
 * Best-effort executor: runs every action in order; a throwing action is
 * reported via `onError` (logging) and its siblings still run. Never throws —
 * so the caller can always rethrow the ORIGINAL creation error unmasked.
 */
export async function runCompensation(
  actions: CompensationAction[],
  execute: (action: CompensationAction) => Promise<unknown> | unknown,
  onError: (err: unknown, action: CompensationAction) => void = () => {},
): Promise<void> {
  for (const action of actions) {
    try {
      await execute(action);
    } catch (err) {
      onError(err, action);
    }
  }
}
