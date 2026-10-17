import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildAdminProductFilter, buildPublicProductFilter, assertItemsActive } from '../src/services/productQuery';
import { AppError } from '../src/utils/AppError';

function isAppError(err: unknown, statusCode: number, message: string): boolean {
  return err instanceof AppError && err.statusCode === statusCode && err.message === message;
}

test('public product filter always forces status active even when query requests another status', () => {
  const forced = buildPublicProductFilter({ status: 'inactive', material: 'PLA', minPrice: '1000' });
  assert.equal(forced.status, 'active');
  assert.equal(forced.material, 'PLA');
  assert.deepEqual(forced.salePrice, { $gte: 1000 });

  assert.equal(buildPublicProductFilter({}).status, 'active');
  assert.equal(buildPublicProductFilter({ status: 'out-of-stock' }).status, 'active');
});

test('admin product filter passes status through untouched', () => {
  assert.equal(buildAdminProductFilter({ status: 'inactive' }).status, 'inactive');
  assert.equal(buildAdminProductFilter({ status: 'out-of-stock' }).status, 'out-of-stock');
  assert.equal(buildAdminProductFilter({}).status, undefined);
});

test('assertItemsActive throws 404 when a requested product does not exist', () => {
  assert.throws(
    () =>
      assertItemsActive(
        [{ _id: 'p1', status: 'active' }],
        [
          { product: 'p1', quantity: 1 },
          { product: 'missing', quantity: 2 },
        ],
      ),
    (err: unknown) => isAppError(err, 404, 'Không tìm thấy sản phẩm'),
  );

  assert.throws(
    () => assertItemsActive([], [{ product: 'p1', quantity: 1 }]),
    (err: unknown) => isAppError(err, 404, 'Không tìm thấy sản phẩm'),
  );
});

test('assertItemsActive throws 400 when a requested product is inactive', () => {
  assert.throws(
    () =>
      assertItemsActive(
        [
          { _id: 'p1', status: 'active' },
          { _id: 'p2', status: 'inactive' },
        ],
        [
          { product: 'p1', quantity: 1 },
          { product: 'p2', quantity: 1 },
        ],
      ),
    (err: unknown) => isAppError(err, 400, 'Sản phẩm không khả dụng hoặc đã ngừng kinh doanh'),
  );

  assert.throws(
    () =>
      assertItemsActive(
        [{ _id: 'p3', status: 'out-of-stock' }],
        [{ product: 'p3', quantity: 1 }],
      ),
    (err: unknown) => isAppError(err, 400, 'Sản phẩm không khả dụng hoặc đã ngừng kinh doanh'),
  );
});

test('assertItemsActive passes when all requested products are active', () => {
  assert.doesNotThrow(() =>
    assertItemsActive(
      [
        { _id: 'p1', status: 'active' },
        { _id: 'p2', status: 'active' },
      ],
      [
        { product: 'p1', quantity: 3 },
        { product: 'p2', quantity: 1 },
      ],
    ),
  );
});
