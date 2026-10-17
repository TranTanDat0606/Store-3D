import { test } from 'node:test';
import assert from 'node:assert/strict';
import { releaseOrderCoupon, redemptionPlan } from '../src/services/orderService';

// --- releaseOrderCoupon (GAP-3): what a cancellation must undo ---

test('releaseOrderCoupon returns restore action for system percent/fixed coupon', () => {
  for (const coupon of [
    { code: 'SAVE10', type: 'percent', discount: 10 },
    { code: 'FLAT50K', type: 'fixed', discount: 50_000 },
  ]) {
    assert.deepEqual(releaseOrderCoupon({ coupon }), [{ kind: 'coupon-restore', id: coupon }]);
  }
});

test('releaseOrderCoupon returns release action for game reward coupon', () => {
  const userCoupon = { code: 'REWARD-ABC12345', type: 'percent', discount: 50 };
  assert.deepEqual(releaseOrderCoupon({ userCoupon }), [{ kind: 'usercoupon-release', id: userCoupon }]);
});

test('releaseOrderCoupon returns nothing for order without coupon', () => {
  assert.deepEqual(releaseOrderCoupon({}), []);
  assert.deepEqual(releaseOrderCoupon({ coupon: null, userCoupon: undefined }), []);
});

// --- redemptionPlan (GAP-5): validation strictly precedes marking ---

test('redemptionPlan validates bank-transfer minimum before marking coupon used', () => {
  const coupon = { code: 'REWARD-ABC12345' };
  const plan = redemptionPlan(coupon, { method: 'bank-transfer', totalVnd: 1_000 });
  assert.deepEqual(plan, ['validate-minimum', 'mark-used']);
  // Ordering is the contract: the minimum check runs before any marking.
  assert.ok(plan.indexOf('validate-minimum') < plan.indexOf('mark-used'));
});

test('redemptionPlan omits marking when bank-transfer below 1000 VND', () => {
  assert.deepEqual(
    redemptionPlan({ code: 'REWARD-ABC12345' }, { method: 'bank-transfer', totalVnd: 999 }),
    ['validate-minimum'],
  );
  assert.deepEqual(redemptionPlan({ code: 'REWARD-ABC12345' }, { method: 'bank-transfer', totalVnd: 0 }), [
    'validate-minimum',
  ]);
});

test('redemptionPlan marks cash orders immediately', () => {
  assert.deepEqual(redemptionPlan({ code: 'REWARD-ABC12345' }, { method: 'cash', totalVnd: 0 }), ['mark-used']);

  // Nothing to mark without a coupon — but a bank-transfer order still validates its minimum.
  assert.deepEqual(redemptionPlan(null, { method: 'cash', totalVnd: 0 }), []);
  assert.deepEqual(redemptionPlan(null, { method: 'bank-transfer', totalVnd: 5_000 }), ['validate-minimum']);
});
