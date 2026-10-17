import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  transitionGuardQuery,
  assertTransitionApplied,
  rewardCouponClaimQuery,
} from '../src/services/orderService';
import {
  couponQuantityGuardQuery,
  assertCouponQuantityApplied,
} from '../src/services/couponService';
import { AppError } from '../src/utils/AppError';

// --- transitionGuardQuery (GAP-7): one atomic guarded status write ---

test('transition guard requires the expected from-status in the update filter', () => {
  const guard = transitionGuardQuery('64b000000000000000000000', 'pending');
  assert.equal(guard.status, 'pending');
  // A different expected from-status produces a different guard — the filter
  // is what makes the transition conditional, not just the order id.
  const other = transitionGuardQuery('64b000000000000000000000', 'shipping');
  assert.equal(other.status, 'shipping');
  assert.notEqual(guard.status, other.status);
});

test('transition guard targets the given order id', () => {
  const guard = transitionGuardQuery('order-42', 'confirmed');
  assert.equal(guard._id, 'order-42');
});

test('a guard miss throws 409 with Vietnamese concurrent-edit message', () => {
  assert.throws(
    () => assertTransitionApplied(null),
    (err: unknown) =>
      err instanceof AppError &&
      err.statusCode === 409 &&
      err.message === 'Đơn hàng vừa được thay đổi trạng thái bởi quản trị viên khác',
  );
  // A winning result passes straight through.
  const winner = { _id: 'order-42', status: 'cancelled' };
  assert.equal(assertTransitionApplied(winner), winner);
});

// --- couponQuantityGuardQuery (GAP-8): conditional atomic increment ---

test('coupon quantity guard only matches while usedCount below quantity', () => {
  const { filter } = couponQuantityGuardQuery('coupon-7');
  assert.equal(filter._id, 'coupon-7');
  // The guard is an expression comparing the two fields — the match only
  // succeeds while usedCount < quantity, so the last unit cannot be taken twice.
  assert.deepEqual((filter as { $expr?: unknown }).$expr, { $lt: ['$usedCount', '$quantity'] });
});

test('coupon quantity guard increments usedCount atomically', () => {
  const { update } = couponQuantityGuardQuery('coupon-7');
  // The increment rides in the SAME findOneAndUpdate as the guard filter —
  // there is no separate read-then-write window.
  assert.deepEqual(update, { $inc: { usedCount: 1 } });
});

test('a quantity miss throws 400 with Vietnamese sold-out message', () => {
  assert.throws(
    () => assertCouponQuantityApplied(null),
    (err: unknown) =>
      err instanceof AppError &&
      err.statusCode === 400 &&
      err.message === 'Mã giảm giá đã hết lượt sử dụng',
  );
  const claimed = { _id: 'coupon-7', usedCount: 3 };
  assert.equal(assertCouponQuantityApplied(claimed), claimed);
});

// --- reward coupon claim (Task 3 carry-over): expiry enforced at claim time ---

test('reward coupon claim rejects expired coupons', () => {
  const now = new Date('2026-10-17T12:00:00.000Z');
  const filter = rewardCouponClaimQuery('usercoupon-9', now);
  assert.equal(filter._id, 'usercoupon-9');
  assert.equal(filter.usedAt, null);
  // Expiry must be part of the claim filter itself — an expired reward coupon
  // is never claimable, even between the peek and the claim.
  assert.deepEqual(filter.expiresAt, { $gt: now });
});
