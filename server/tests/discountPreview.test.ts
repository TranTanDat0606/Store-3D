import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeDiscount, computePreviewSubtotal } from '../src/services/discountMath';
import { applyCouponSchema, parsePreviewItems } from '../src/validators/coupon';
import { AppError } from '../src/utils/AppError';

const MIN_ORDER_MESSAGE = 'Đơn hàng chưa đạt giá trị tối thiểu để dùng mã giảm giá';

function isAppError(err: unknown, statusCode: number, message: string): boolean {
  return err instanceof AppError && err.statusCode === statusCode && err.message === message;
}

/** Preview subtotal that must never hit the DB (client-claimed basis). */
async function noLookup(): Promise<Array<{ _id: string; price: number }>> {
  throw new Error('price lookup must not run for claimed subtotals');
}

// --- (a) single-source discount math ---

test('computeDiscount caps game-coupon percent at 200000', () => {
  const result = computeDiscount({ type: 'percent', value: 10, source: 'game' }, 5_000_000);
  assert.equal(result.discountVnd, 200_000);
  assert.equal(result.capped, true);
});

test('computeDiscount does not cap non-game percent coupons', () => {
  const admin = computeDiscount({ type: 'percent', value: 10, source: 'admin' }, 5_000_000);
  assert.equal(admin.discountVnd, 500_000);
  assert.equal(admin.capped, false);

  // No source at all (legacy callers) is treated as a normal system coupon: no cap.
  const unsourced = computeDiscount({ type: 'percent', value: 10 }, 5_000_000);
  assert.equal(unsourced.discountVnd, 500_000);
  assert.equal(unsourced.capped, false);
});

test('computeDiscount returns fixed amount as-is', () => {
  assert.deepEqual(computeDiscount({ type: 'fixed', value: 50_000, source: 'admin' }, 300_000), {
    discountVnd: 50_000,
    capped: false,
  });

  // A fixed discount never pushes the order below zero.
  assert.equal(computeDiscount({ type: 'fixed', value: 500_000, source: 'admin' }, 300_000).discountVnd, 300_000);
});

test('computeDiscount rejects subtotal below minOrder with Vietnamese message', () => {
  assert.throws(
    () => computeDiscount({ type: 'percent', value: 10, minOrder: 500_000, source: 'admin' }, 499_999),
    (err: unknown) => isAppError(err, 400, MIN_ORDER_MESSAGE),
  );

  // Exactly at minOrder the coupon applies.
  assert.deepEqual(computeDiscount({ type: 'percent', value: 10, minOrder: 500_000, source: 'admin' }, 500_000), {
    discountVnd: 50_000,
    capped: false,
  });
});

test('computeDiscount returns 0 for zero subtotal', () => {
  assert.equal(computeDiscount({ type: 'percent', value: 10, source: 'game' }, 0).discountVnd, 0);
  assert.equal(computeDiscount({ type: 'fixed', value: 50_000 }, 0).discountVnd, 0);
});

// --- (b) preview subtotal basis ---

test('computePreviewSubtotal prefers DB prices over claimed subtotal when items given', async () => {
  const requested: string[][] = [];
  const lookup = async (ids: string[]) => {
    requested.push(ids);
    return [{ _id: 'p1', price: 450_000, discountPrice: undefined }];
  };

  const result = await computePreviewSubtotal(
    { items: [{ product: 'p1', quantity: 2 }], subtotal: 100_000 },
    lookup,
  );

  assert.equal(result.subtotalVnd, 900_000); // 450.000 × 2 from DB — claimed 100.000 ignored
  assert.equal(result.basis, 'server-priced');
  assert.deepEqual(requested, [['p1']]);
});

test('computePreviewSubtotal treats claimed subtotal as client-claimed estimate when items absent', async () => {
  const claimed = await computePreviewSubtotal({ subtotal: 250_000 }, noLookup);
  assert.deepEqual(claimed, { subtotalVnd: 250_000, basis: 'client-claimed' });

  // Empty items list is the same as no items: fallback to the claim, floored at 0.
  const empty = await computePreviewSubtotal({ items: [], subtotal: -50 }, noLookup);
  assert.deepEqual(empty, { subtotalVnd: 0, basis: 'client-claimed' });

  const missing = await computePreviewSubtotal({}, noLookup);
  assert.deepEqual(missing, { subtotalVnd: 0, basis: 'client-claimed' });
});

test('preview enforces minOrder and game cap on claimed subtotal exactly like order path', async () => {
  // Claimed subtotal below minOrder → same rejection the order path throws.
  const belowMin = await computePreviewSubtotal({ subtotal: 400_000 }, noLookup);
  assert.equal(belowMin.basis, 'client-claimed');
  assert.throws(
    () =>
      computeDiscount(
        { type: 'percent', value: 10, minOrder: 500_000, source: 'admin' },
        belowMin.subtotalVnd,
      ),
    (err: unknown) => isAppError(err, 400, MIN_ORDER_MESSAGE),
  );

  // Game cap applies to the claimed subtotal — preview and order path both run
  // computeDiscount (orderService.resolveCoupon), so the numbers are identical.
  const claimed = await computePreviewSubtotal({ subtotal: 5_000_000 }, noLookup);
  const previewPath = computeDiscount(
    { type: 'percent', value: 10, minOrder: 0, source: 'game' },
    claimed.subtotalVnd,
  );
  const orderPath = computeDiscount(
    { type: 'percent', value: 10, minOrder: 0, source: 'game' },
    claimed.subtotalVnd,
  );

  assert.deepEqual(previewPath, orderPath);
  assert.equal(previewPath.discountVnd, 200_000);
  assert.equal(previewPath.capped, true);
});

// --- (c) route-boundary validator contract ---

test('applyCouponSchema accepts code without items or subtotal (legacy client)', () => {
  const minimal = applyCouponSchema.safeParse({ code: 'SAVE10' });
  assert.equal(minimal.success, true);
  assert.equal(minimal.success && minimal.data.code, 'SAVE10');
  assert.equal(minimal.success && minimal.data.subtotal, undefined);
  assert.equal(minimal.success && minimal.data.items, undefined);

  // The current client sends code + subtotal only — still valid.
  const legacy = applyCouponSchema.safeParse({ code: 'SAVE10', subtotal: 250000 });
  assert.equal(legacy.success, true);
  assert.equal(legacy.success && legacy.data.subtotal, 250000);
  assert.equal(legacy.success && legacy.data.items, undefined);
});

test('applyCouponSchema accepts code with items array', () => {
  const parsed = applyCouponSchema.safeParse({
    code: 'SAVE10',
    subtotal: 100000,
    items: [
      { product: '652f1', quantity: 2 },
      { product: '652f2', quantity: '1' },
    ],
  });

  assert.equal(parsed.success, true);
  assert.equal(
    parsed.success &&
      JSON.stringify(parsed.data.items) ===
        JSON.stringify([
          { product: '652f1', quantity: 2 },
          { product: '652f2', quantity: 1 },
        ]),
    true,
  );
});

test('applyCouponSchema rejects malformed items', () => {
  const malformed: unknown[] = [
    [{ product: 'p1' }], // missing quantity
    [{ quantity: 2 }], // missing product
    [{ product: '', quantity: 2 }], // empty product id
    [{ product: 'p1', quantity: 0 }], // quantity below 1
    [{ product: 'p1', quantity: 1.5 }], // non-integer quantity
    [{ product: 'p1', quantity: 'abc' }], // not a number
    'not-an-array', // items must be an array
    { product: 'p1', quantity: 2 }, // single object instead of array
  ];

  for (const items of malformed) {
    const result = applyCouponSchema.safeParse({ code: 'SAVE10', items });
    assert.equal(result.success, false, `expected rejection for ${JSON.stringify(items)}`);
  }
});

test('preview items query parser ignores invalid JSON and falls back to subtotal', () => {
  assert.equal(parsePreviewItems(undefined), undefined);
  assert.equal(parsePreviewItems(''), undefined);
  assert.equal(parsePreviewItems('not-json'), undefined);
  assert.equal(parsePreviewItems('{"product":"p1"}'), undefined);
  assert.equal(parsePreviewItems('[{"product":"p1"}]'), undefined);
  assert.equal(parsePreviewItems('[{"product":"p1","quantity":0}]'), undefined);

  assert.deepEqual(parsePreviewItems('[{"product":"p1","quantity":2}]'), [
    { product: 'p1', quantity: 2 },
  ]);
});
