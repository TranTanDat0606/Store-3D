import { test } from 'node:test';
import assert from 'node:assert/strict';

interface UserDeletionPlanEntry {
  collection: string;
  action: 'delete' | 'unset';
  fields: string[];
  keep?: boolean;
}

type UserDeletionPlan = () => UserDeletionPlanEntry[];

/** The collections GAP-15 found dangling, each with its user-reference field. */
const DELETION_TARGETS: Record<string, string> = {
  reviews: 'user',
  wishlists: 'user',
  addresses: 'userId',
  usercoupons: 'user',
  gamesessions: 'user',
};

/**
 * Loads the Task 10 seam lazily so each title fails on its own assertion (the
 * seam not existing yet) rather than on module resolution — the failing-first
 * proof required by the plan, same style as userActive.test.ts (Task 7).
 */
async function loadUserDeletionPlan(): Promise<UserDeletionPlan> {
  const mod = (await import('../src/services/userService')) as unknown as Record<string, unknown>;
  return mod.userDeletionPlan as UserDeletionPlan;
}

test('user deletion plan covers Reviews, Wishlist, Addresses, UserCoupons and GameSessions for deletion', async () => {
  const userDeletionPlan = await loadUserDeletionPlan();
  assert.equal(typeof userDeletionPlan, 'function', 'userDeletionPlan seam is missing (Task 10)');

  const plan = userDeletionPlan();
  const deletions = plan.filter((entry) => entry.action === 'delete');

  // Membership assertions: every GAP-15 collection is scheduled for deletion
  // and each step names the reference field that would otherwise dangle.
  for (const [collection, field] of Object.entries(DELETION_TARGETS)) {
    const step = deletions.find((entry) => entry.collection === collection);
    assert.ok(step, `${collection} must be scheduled for deletion when the user is removed`);
    assert.ok(
      step.fields.includes(field),
      `${collection} step must target its user reference field ${field}`,
    );
  }
});

test('user deletion plan keeps Orders as denormalized snapshots', async () => {
  const userDeletionPlan = await loadUserDeletionPlan();
  assert.equal(typeof userDeletionPlan, 'function', 'userDeletionPlan seam is missing (Task 10)');

  const plan = userDeletionPlan();
  const orders = plan.find((entry) => entry.collection === 'orders');

  // Orders are historical records carrying their own `customer` snapshot
  // (name/phone/email/address) plus totals/payment/status — the plan documents
  // the decision with keep:true instead of silently omitting the collection.
  assert.ok(orders, 'orders must appear in the deletion plan');
  assert.equal(orders.keep, true, 'orders must be flagged keep:true (retained snapshot)');
  assert.notEqual(orders.action, 'delete', 'orders must never be scheduled for deletion');
  assert.ok(
    !plan.some((entry) => entry.collection === 'orders' && entry.action === 'delete'),
    'no delete step may ever target orders',
  );
});
