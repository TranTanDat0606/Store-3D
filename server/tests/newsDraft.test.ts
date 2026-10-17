import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newsService } from '../src/services/newsService';
import { News } from '../src/models';
import { AppError } from '../src/utils/AppError';

type PublicNewsSlugQuery = (slug: string) => { slug: string; status: 'published' };
type AdminNewsIdQuery = (id: string) => { _id: string };

/**
 * Loads the Task 8 seams lazily so this file still evaluates (and each title
 * fails on its own assertion, not on module resolution) before the seams
 * exist — the failing-first proof required by the plan.
 */
async function loadSeams(): Promise<{
  publicNewsSlugQuery: PublicNewsSlugQuery;
  adminNewsIdQuery: AdminNewsIdQuery;
}> {
  const mod = (await import('../src/services/newsService')) as unknown as Record<string, unknown>;
  return {
    publicNewsSlugQuery: mod.publicNewsSlugQuery as PublicNewsSlugQuery,
    adminNewsIdQuery: mod.adminNewsIdQuery as AdminNewsIdQuery,
  };
}

/** Replaces News.findOne for one test (zero-dep stub, restored after). */
function stubNewsFindOne(impl: (query: unknown) => unknown): { restore: () => void; calls: unknown[] } {
  const model = News as unknown as Record<string, unknown>;
  const own = Object.getOwnPropertyDescriptor(model, 'findOne');
  const calls: unknown[] = [];
  model.findOne = (query: unknown) => {
    calls.push(query);
    return impl(query);
  };
  return {
    calls,
    restore: () => {
      if (own) Object.defineProperty(model, 'findOne', own);
      else delete model['findOne'];
    },
  };
}

// --- GAP-12: the public slug lookup can only ever resolve published articles ---

test('public news slug query filters to published articles', async () => {
  const { publicNewsSlugQuery } = await loadSeams();
  // Seam contract: slug + status published, nothing else.
  assert.deepEqual(publicNewsSlugQuery('bai-viet-moi'), {
    slug: 'bai-viet-moi',
    status: 'published',
  });

  // Wire: getBySlug issues exactly that query (drafts can no longer match)…
  const stub = stubNewsFindOne(() => null);
  try {
    await assert.rejects(
      newsService.getBySlug('bai-viet-moi'),
      (err: unknown) =>
        err instanceof AppError &&
        err.statusCode === 404 &&
        err.message === 'Không tìm thấy bài viết',
    );
    assert.deepEqual(stub.calls[0], { slug: 'bai-viet-moi', status: 'published' });
  } finally {
    stub.restore();
  }
});

// --- GAP-12: the admin path stays unfiltered so drafts remain editable ---

test('admin news lookups are not status-filtered', async () => {
  const { adminNewsIdQuery } = await loadSeams();
  const id = '64b000000000000000000001';
  const query = adminNewsIdQuery(id);
  assert.deepEqual(query, { _id: id });
  // No status key: admins see drafts by id.
  assert.equal(Object.prototype.hasOwnProperty.call(query, 'status'), false);

  // Wire: getById resolves a draft document unchanged.
  const draft = { _id: id, slug: 'bai-viet-nhap', status: 'draft' };
  const stub = stubNewsFindOne(() => draft);
  try {
    const news = await newsService.getById(id);
    assert.equal(news, draft);
    assert.deepEqual(stub.calls[0], { _id: id });
  } finally {
    stub.restore();
  }
});
