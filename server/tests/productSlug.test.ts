import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildAdminProductFilter, buildPublicProductFilter } from '../src/services/productQuery';
import { productService } from '../src/services/productService';
import { Product } from '../src/models';
import { AppError } from '../src/utils/AppError';

// --- Plan 3 T6b: slug must survive the filter build (regression: every PDP URL
// --- used to return the first active product because `slug` was dropped).

test('public product filter keeps an exact slug and still forces status active', () => {
  const filter = buildPublicProductFilter({ slug: 'x' });
  assert.deepEqual(filter, { slug: 'x', status: 'active' });
  // GAP-1 stays intact: the forced status wins over anything the query asks for.
  assert.equal(buildPublicProductFilter({ slug: 'x', status: 'inactive' }).status, 'active');
  // Admin pass-through keeps slug untouched too.
  assert.deepEqual(buildAdminProductFilter({ slug: 'x' }), { slug: 'x' });
});

/** Zero-dep stub of Product.findOne / Product.findById (newsDraft.test.ts pattern), no DB. */
function stubProductFinders(opts: { findOne?: unknown; findById?: unknown }): {
  restore: () => void;
  findOneCalls: unknown[];
  findByIdCalls: unknown[];
} {
  const model = Product as unknown as Record<string, unknown>;
  const ownFindOne = Object.getOwnPropertyDescriptor(model, 'findOne');
  const ownFindById = Object.getOwnPropertyDescriptor(model, 'findById');
  const findOneCalls: unknown[] = [];
  const findByIdCalls: unknown[] = [];
  model.findOne = (query: unknown) => {
    findOneCalls.push(query);
    return { populate: async () => opts.findOne };
  };
  model.findById = (id: unknown) => {
    findByIdCalls.push(id);
    return { populate: async () => opts.findById };
  };
  return {
    findOneCalls,
    findByIdCalls,
    restore: () => {
      if (ownFindOne) Object.defineProperty(model, 'findOne', ownFindOne);
      else delete model['findOne'];
      if (ownFindById) Object.defineProperty(model, 'findById', ownFindById);
      else delete model['findById'];
    },
  };
}

test('getBySlug queries the requested slug with status active and 404s when nothing matches', async () => {
  const stub = stubProductFinders({ findOne: null, findById: null });
  try {
    await assert.rejects(
      productService.getBySlug('slug-khong-ton-tai'),
      (err: unknown) =>
        err instanceof AppError && err.statusCode === 404 && err.message === 'Không tìm thấy sản phẩm',
    );
    // The wire query carries the requested slug — never an empty filter.
    assert.deepEqual(stub.findOneCalls[0], { slug: 'slug-khong-ton-tai', status: 'active' });
    // Not a 24-hex ObjectId → no id fallback.
    assert.equal(stub.findByIdCalls.length, 0);
  } finally {
    stub.restore();
  }
});

test('getBySlug resolves the product whose slug matches', async () => {
  const doc = { _id: '64b000000000000000000002', slug: 'banh-rang-trang-tri', status: 'active' };
  const stub = stubProductFinders({ findOne: doc, findById: null });
  try {
    const product = await productService.getBySlug('banh-rang-trang-tri');
    assert.equal(product, doc);
    assert.deepEqual(stub.findOneCalls[0], { slug: 'banh-rang-trang-tri', status: 'active' });
    assert.equal(stub.findByIdCalls.length, 0);
  } finally {
    stub.restore();
  }
});

test('getBySlug keeps the ObjectId fallback for admin id-edit and 404s when the id has no product', async () => {
  const id = '64b000000000000000000001';
  const doc = { _id: id, slug: 'san-pham-nhap', status: 'inactive' };

  const hit = stubProductFinders({ findOne: null, findById: doc });
  try {
    const product = await productService.getBySlug(id);
    assert.equal(product, doc);
    // Slug (exact match) is tried first…
    assert.deepEqual(hit.findOneCalls[0], { slug: id, status: 'active' });
    // …then the id path resolves inactive products for the admin edit screen.
    assert.equal(hit.findByIdCalls[0], id);
  } finally {
    hit.restore();
  }

  const miss = stubProductFinders({ findOne: null, findById: null });
  try {
    await assert.rejects(
      productService.getBySlug(id),
      (err: unknown) => err instanceof AppError && err.statusCode === 404,
    );
  } finally {
    miss.restore();
  }
});
