import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { computeDiscount, computePreviewSubtotal } from '../src/services/discountMath';
import { applyCouponSchema, parsePreviewItems, previewItemsSchema } from '../src/validators/coupon';
import { AppError } from '../src/utils/AppError';

const MIN_ORDER_MESSAGE = 'Đơn hàng chưa đạt giá trị tối thiểu để dùng mã giảm giá';

/** Synthetic cart for the items-cap tests. */
const manyItems = (n: number) => Array.from({ length: n }, (_, i) => ({ product: `p${i}`, quantity: 1 }));

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

  // Game cap applies to the claimed subtotal the preview hands to the shared
  // formula. Preview ≡ order parity is asserted structurally in the next test
  // (single formula site) — NOT by comparing two identical calls.
  const claimed = await computePreviewSubtotal({ subtotal: 5_000_000 }, noLookup);
  const capped = computeDiscount(
    { type: 'percent', value: 10, minOrder: 0, source: 'game' },
    claimed.subtotalVnd,
  );
  assert.equal(capped.discountVnd, 200_000);
  assert.equal(capped.capped, true);
});

// --- (a2) AC4: preview ≡ order parity is structural, not numeric ---

test('AC4 parity: order and preview enter the same formula with the same CouponMathInput', () => {
  // Invoking orderService would need a live DB, so parity is enforced here at
  // the source seam: both services must (1) call computeDiscount and (2) pass
  // byte-identical CouponMathInput objects; the formula itself must exist ONLY
  // in discountMath.ts — a second inline copy in either service fails this test.
  const codeOnly = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  const order = codeOnly(readFileSync(new URL('../src/services/orderService.ts', import.meta.url), 'utf8'));
  const preview = codeOnly(readFileSync(new URL('../src/services/couponService.ts', import.meta.url), 'utf8'));
  const ADMIN = "{ type: coupon.type, value: coupon.discount, minOrder: coupon.minOrder, source: 'admin' }";
  const GAME = "{ type: userCoupon.type, value: userCoupon.discount, minOrder: 0, source: 'game' }";
  for (const src of [order, preview]) {
    assert.doesNotMatch(src, /\/\s*100|MAX_DISCOUNT_VND/, 'discount formula leaked outside discountMath.ts');
    assert.ok(src.includes('computeDiscount(') && src.includes(ADMIN) && src.includes(GAME));
  }
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

test('preview items schema rejects more than 50 items', () => {
  const items = manyItems(51);
  const schema = previewItemsSchema.safeParse(items);
  assert.equal(schema.success, false);
  assert.equal(
    schema.success === false && schema.error.issues.some((i) => i.message.includes('tối đa 50')),
    true,
  );
  // The trusted POST-body route (applyCouponSchema) inherits the same cap.
  assert.equal(applyCouponSchema.safeParse({ code: 'SAVE10', items }).success, false);
  // Boundary: exactly 50 items stays valid.
  assert.equal(previewItemsSchema.safeParse(items.slice(0, 50)).success, true);
});

test('GET preview falls back to claimed subtotal when items exceed the schema cap', async () => {
  const raw = JSON.stringify(manyItems(51));
  // Same tolerant-parser seam as above: an over-cap `items` query must never
  // 500 — it is dropped, so resolvePreview falls back to the claimed subtotal
  // and no DB price lookup ever runs (noLookup throws).
  assert.equal(parsePreviewItems(raw), undefined);
  const preview = await computePreviewSubtotal(
    { items: parsePreviewItems(raw), subtotal: 250_000 },
    noLookup,
  );
  assert.deepEqual(preview, { subtotalVnd: 250_000, basis: 'client-claimed' });
});
