import { test } from 'node:test';
import assert from 'node:assert/strict';
import { OrderStatus } from '../src/models/Order';
import { ALLOWED_NEXT_STATUS } from '../src/services/orderService';

function assertTransition(from: OrderStatus, to: OrderStatus, allowed: boolean) {
  const next = ALLOWED_NEXT_STATUS[from];
  if (allowed) {
    assert.ok(next.includes(to), `expected ${from} -> ${to} to be allowed`);
  } else {
    assert.ok(!next.includes(to), `expected ${from} -> ${to} to be rejected`);
  }
}

test('order status flows forward only along the chain', () => {
  assertTransition(OrderStatus.Pending, OrderStatus.Confirmed, true);
  assertTransition(OrderStatus.Confirmed, OrderStatus.Shipping, true);
  assertTransition(OrderStatus.Shipping, OrderStatus.Completed, true);
});

test('backward transitions are rejected', () => {
  assertTransition(OrderStatus.Shipping, OrderStatus.Pending, false);
  assertTransition(OrderStatus.Completed, OrderStatus.Confirmed, false);
  assertTransition(OrderStatus.Confirmed, OrderStatus.Pending, false);
  assertTransition(OrderStatus.Shipping, OrderStatus.Confirmed, false);
  assertTransition(OrderStatus.Completed, OrderStatus.Shipping, false);
});

test('skipped transitions are rejected', () => {
  assertTransition(OrderStatus.Pending, OrderStatus.Shipping, false);
  assertTransition(OrderStatus.Pending, OrderStatus.Completed, false);
  assertTransition(OrderStatus.Confirmed, OrderStatus.Completed, false);
});

test('a pending order may be cancelled, terminal states are immutable', () => {
  assertTransition(OrderStatus.Pending, OrderStatus.Cancelled, true);
  assert.deepEqual(ALLOWED_NEXT_STATUS[OrderStatus.Completed], []);
  assert.deepEqual(ALLOWED_NEXT_STATUS[OrderStatus.Cancelled], []);
  assertTransition(OrderStatus.Cancelled, OrderStatus.Pending, false);
  assertTransition(OrderStatus.Completed, OrderStatus.Cancelled, false);
});