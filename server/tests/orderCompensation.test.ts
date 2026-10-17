import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  compensationPlanFor,
  runCompensation,
  type CompensationAction,
  type CompensationContext,
} from '../src/services/orderCreation';

// --- compensationPlanFor (GAP-4): inverse side effects, reverse order ---

test('compensation for items-created failure deletes the created order', () => {
  const ctx: CompensationContext = { orderId: 'oid-1', items: [], couponActions: [] };
  const plan = compensationPlanFor('items-created', ctx);
  // The already-created order must be deleted; possibly half-inserted items go too.
  assert.deepEqual(plan.map((a) => a.kind), ['delete-items', 'delete-order']);
  const deleteOrder = plan[plan.length - 1];
  assert.equal(deleteOrder.kind, 'delete-order');
  assert.equal(deleteOrder.payload, 'oid-1');
});

test('compensation for stock-updated failure restores stock then deletes order', () => {
  const ctx: CompensationContext = {
    orderId: 'oid-2',
    items: [{ product: 'p1', quantity: 2 }],
    couponActions: [],
  };
  const plan = compensationPlanFor('stock-updated', ctx);
  assert.deepEqual(plan.map((a) => a.kind), ['restore-stock', 'delete-items', 'delete-order']);
  const restoreIdx = plan.findIndex((a) => a.kind === 'restore-stock');
  const deleteOrderIdx = plan.findIndex((a) => a.kind === 'delete-order');
  assert.ok(restoreIdx < deleteOrderIdx, 'stock is restored before the order is deleted');
  assert.equal(plan[restoreIdx].payload, ctx.items, 'restores exactly the decremented items');
});

test('compensation for coupon-marked failure releases coupon, restores stock, then deletes order', () => {
  const couponActions = [{ kind: 'coupon-restore', id: 'SAVE10' }] as CompensationContext['couponActions'];
  const ctx: CompensationContext = {
    orderId: 'oid-3',
    items: [{ product: 'p1', quantity: 1 }],
    couponActions,
  };
  const plan = compensationPlanFor('coupon-marked', ctx);
  assert.deepEqual(plan.map((a) => a.kind), ['release-coupon', 'restore-stock', 'delete-items', 'delete-order']);
  assert.equal((plan[0].payload as CompensationContext['couponActions'])[0].id, 'SAVE10');
});

test('no compensation actions after the done step', () => {
  const ctx: CompensationContext = {
    orderId: 'oid-4',
    items: [{ product: 'p1', quantity: 1 }],
    couponActions: [{ kind: 'coupon-restore', id: 'SAVE10' }],
  };
  assert.deepEqual(compensationPlanFor('done', ctx), []);
});

// --- runCompensation: best-effort execution, siblings continue on failure ---

test('compensation continues remaining actions after one action fails', async () => {
  const attempted: string[] = [];
  const actions: CompensationAction[] = (
    ['release-coupon', 'restore-stock', 'delete-items'] as const
  ).map((kind) => ({ kind, payload: undefined }));
  await runCompensation(actions, (action) => {
    attempted.push(action.kind);
    if (action.kind === 'restore-stock') throw new Error('executor exploded');
  });
  // The failing action does not stop its siblings, and nothing propagates.
  assert.deepEqual(attempted, ['release-coupon', 'restore-stock', 'delete-items']);
});
