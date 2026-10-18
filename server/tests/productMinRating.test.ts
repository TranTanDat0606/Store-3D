import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildAdminProductFilter, buildPublicProductFilter } from '../src/services/productQuery';
import { productQuerySchema } from '../src/validators/product';

test('minRating keeps only products rated at or above the requested stars', () => {
  // Validator: integer 1–5, coerced from query strings; anything else is a 400.
  assert.equal(productQuerySchema.parse({ minRating: '4' }).minRating, 4);
  assert.equal(productQuerySchema.parse({ minRating: 1 }).minRating, 1);
  assert.equal(productQuerySchema.parse({}).minRating, undefined);
  assert.equal(productQuerySchema.safeParse({ minRating: '0' }).success, false);
  assert.equal(productQuerySchema.safeParse({ minRating: '6' }).success, false);
  assert.equal(productQuerySchema.safeParse({ minRating: '2.5' }).success, false);
  assert.equal(productQuerySchema.safeParse({ minRating: 'abc' }).success, false);

  // Query filter: rating $gte on both builders, absent when not requested.
  assert.deepEqual(buildPublicProductFilter({ minRating: '4' }).rating, { $gte: 4 });
  assert.deepEqual(buildAdminProductFilter({ minRating: '1' }).rating, { $gte: 1 });
  assert.equal(buildPublicProductFilter({}).rating, undefined);
  assert.equal(buildAdminProductFilter({}).rating, undefined);

  // Public list stays forced-active alongside the rating constraint (GAP-1).
  const combined = buildPublicProductFilter({ minRating: '3', status: 'inactive', material: 'PLA' });
  assert.equal(combined.status, 'active');
  assert.equal(combined.material, 'PLA');
  assert.deepEqual(combined.rating, { $gte: 3 });
});
