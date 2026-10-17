import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AppError } from '../src/utils/AppError';
import { assertItemsActive } from '../src/services/productQuery';
import { reviewService } from '../src/services/reviewService';
import { addressService } from '../src/services/addressService';
import { orderService } from '../src/services/orderService';
import { Review, Address, Order } from '../src/models';

type ResourceKind = 'product' | 'order' | 'review' | 'coupon' | 'address' | 'article';

interface Task9Factories {
  resourceNotFound: (kind: ResourceKind) => AppError;
  duplicateResource: (kind: ResourceKind) => AppError;
  assertOwnership: (owner: unknown, userId: unknown) => void;
}

/** ONE forbidden copy for every ownership (non-owner) rejection — GAP-13. */
const FORBIDDEN_MESSAGE = 'Bạn không có quyền thực hiện thao tác này';

/**
 * Loads the Task 9 seams lazily so this file still evaluates — and each title
 * fails on its own assertion, not on module resolution — before the factories
 * exist (the failing-first proof required by the plan).
 */
async function loadFactories(): Promise<Task9Factories> {
  const mod = (await import('../src/utils/AppError')) as unknown as Record<string, unknown>;
  const names = ['resourceNotFound', 'duplicateResource', 'assertOwnership'];
  const missing = names.filter((name) => typeof mod[name] !== 'function');
  assert.deepEqual(missing, [], `Task 9 factories not implemented yet: ${missing.join(', ')}`);
  return mod as unknown as Task9Factories;
}

function isAppError(err: unknown, statusCode: number, message: string): boolean {
  return err instanceof AppError && err.statusCode === statusCode && err.message === message;
}

function captureError(fn: () => unknown): AppError {
  try {
    fn();
  } catch (err) {
    assert.ok(err instanceof AppError, `expected an AppError, got ${String(err)}`);
    return err;
  }
  return assert.fail('expected a throw');
}

/** Replaces one static model method for one test (zero-dep stub, restored after). */
function stubMethod(
  model: unknown,
  method: string,
  impl: (...args: unknown[]) => unknown,
): { restore: () => void; calls: unknown[][] } {
  const target = model as Record<string, unknown>;
  const own = Object.getOwnPropertyDescriptor(target, method);
  const calls: unknown[][] = [];
  target[method] = (...args: unknown[]) => {
    calls.push(args);
    return impl(...args);
  };
  return {
    calls,
    restore: () => {
      if (own) Object.defineProperty(target, method, own);
      else delete target[method];
    },
  };
}

// --- GAP-13: one 404 copy per resource kind ---

test('resourceNotFound returns 404 with Vietnamese label per kind', async () => {
  const { resourceNotFound } = await loadFactories();

  const expected: Record<ResourceKind, string> = {
    product: 'Không tìm thấy sản phẩm',
    order: 'Không tìm thấy đơn hàng',
    review: 'Không tìm thấy đánh giá',
    coupon: 'Không tìm thấy mã giảm giá',
    address: 'Không tìm thấy địa chỉ',
    article: 'Không tìm thấy bài viết',
  };

  for (const kind of Object.keys(expected) as ResourceKind[]) {
    const err = resourceNotFound(kind);
    assert.ok(err instanceof AppError, `${kind}: expected an AppError`);
    assert.equal(err.statusCode, 404, `${kind}: expected 404`);
    assert.equal(err.message, expected[kind], `${kind}: byte-identical Vietnamese label`);
  }
});

// --- GAP-13: duplicates are conflicts, never 400/404 ---

test('duplicateResource returns 409', async () => {
  const { duplicateResource } = await loadFactories();

  const expected: Record<ResourceKind, string> = {
    product: 'Sản phẩm đã tồn tại',
    order: 'Đơn hàng đã tồn tại',
    review: 'Đánh giá đã tồn tại',
    coupon: 'Mã giảm giá đã tồn tại',
    address: 'Địa chỉ đã tồn tại',
    article: 'Bài viết đã tồn tại',
  };

  for (const kind of Object.keys(expected) as ResourceKind[]) {
    const err = duplicateResource(kind);
    assert.ok(err instanceof AppError, `${kind}: expected an AppError`);
    assert.equal(err.statusCode, 409, `${kind}: expected 409`);
    assert.equal(err.message, expected[kind], `${kind}: byte-identical Vietnamese copy`);
  }

  // The existing admin duplicate copy is reused verbatim (no regression).
  assert.equal(duplicateResource('coupon').message, 'Mã giảm giá đã tồn tại');
});

// --- GAP-13: non-owner access is 403 (never masked as 404) ---

test('accessing another user\'s review, order, wishlist entry or address is rejected with 403', async () => {
  const { assertOwnership } = await loadFactories();

  const me = '64b000000000000000000001';
  const someoneElse = '64b000000000000000000002';

  // One guard, one forbidden copy, every ownership context (review / order /
  // wishlist entry / address) — wishlist itself is keyed by user, so the same
  // guard is what any future owner check must go through.
  for (const kind of ['review', 'order', 'wishlist', 'address']) {
    assert.throws(
      () => assertOwnership(someoneElse, me),
      (err: unknown) => isAppError(err, 403, FORBIDDEN_MESSAGE),
      `${kind}: foreign owner must be 403`,
    );
    assert.doesNotThrow(() => assertOwnership(me, me), `${kind}: own resource stays allowed`);
  }

  // Wire: the review service rejects a review that belongs to another user.
  const reviewStub = stubMethod(Review, 'findById', () => ({
    _id: '64b000000000000000000010',
    user: someoneElse,
    product: '64b000000000000000000020',
    rating: 5,
    comment: '',
    images: [],
  }));
  try {
    await assert.rejects(
      reviewService.update(me, '64b000000000000000000010', { rating: 1 }),
      (err: unknown) => isAppError(err, 403, FORBIDDEN_MESSAGE),
    );
  } finally {
    reviewStub.restore();
  }

  // Wire: the address service rejects an address that belongs to another user.
  const addressStub = stubMethod(Address, 'findOne', () => ({
    _id: '64b000000000000000000030',
    userId: someoneElse,
    recipientName: 'Khác',
  }));
  try {
    await assert.rejects(
      addressService.update('64b000000000000000000030', me, { recipientName: 'Tôi' }),
      (err: unknown) => isAppError(err, 403, FORBIDDEN_MESSAGE),
    );
  } finally {
    addressStub.restore();
  }

  // Wire: cancelling an order that belongs to another user stays 403.
  const updateStub = stubMethod(Order, 'findOneAndUpdate', () => null);
  const findStub = stubMethod(Order, 'findById', () => ({ user: someoneElse, status: 'pending' }));
  try {
    await assert.rejects(
      orderService.cancelByUser(me, '64b000000000000000000040'),
      (err: unknown) => isAppError(err, 403, FORBIDDEN_MESSAGE),
    );
  } finally {
    updateStub.restore();
    findStub.restore();
  }
});

// --- GAP-13: missing product is 404, an unsellable one stays a 400 rule ---

test('missing product during order creation is 404 while inactive product stays 400', async () => {
  const { resourceNotFound } = await loadFactories();

  // The order-create guard (Task 1) rejects a requested product that does not exist…
  const missing = captureError(() => assertItemsActive([], [{ product: '64b000000000000000000050', quantity: 1 }]));
  assert.equal(missing.statusCode, 404);
  assert.equal(missing.message, 'Không tìm thấy sản phẩm');

  // …and the shared factory is byte-identical, so swapping call sites onto it
  // cannot regress the pinned copy.
  const factory = resourceNotFound('product');
  assert.equal(factory.statusCode, missing.statusCode);
  assert.equal(factory.message, missing.message);

  // A product that exists but may not be sold stays a 400 business rule.
  const inactive = captureError(() =>
    assertItemsActive(
      [{ _id: '64b000000000000000000050', status: 'inactive' }],
      [{ product: '64b000000000000000000050', quantity: 1 }],
    ),
  );
  assert.equal(inactive.statusCode, 400);
  assert.equal(inactive.message, 'Sản phẩm không khả dụng hoặc đã ngừng kinh doanh');
});
