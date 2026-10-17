import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  canMarkPaid,
  assertCanMarkPaid,
  webhookRoutePolicy,
  assertWebhookBootConfig,
} from '../src/services/paymentService';
import { AppError } from '../src/utils/AppError';

// --- canMarkPaid (GAP-9): webhook must not resurrect non-payable orders ---

test('canMarkPaid allows pending and confirmed orders', () => {
  assert.equal(canMarkPaid('pending'), true);
  assert.equal(canMarkPaid('confirmed'), true);
});

test('canMarkPaid rejects shipping, completed and cancelled orders', () => {
  assert.equal(canMarkPaid('shipping'), false);
  assert.equal(canMarkPaid('completed'), false);
  assert.equal(canMarkPaid('cancelled'), false);
  // The wired guard throws the exact 409 the route surfaces to the caller…
  assert.throws(
    () => assertCanMarkPaid('cancelled'),
    (err: unknown) =>
      err instanceof AppError &&
      err.statusCode === 409 &&
      err.message === 'Đơn hàng không ở trạng thái có thể xác nhận thanh toán',
  );
  // …while a payable status passes straight through.
  assert.doesNotThrow(() => assertCanMarkPaid('pending'));
});

// --- webhookRoutePolicy (GAP-10): signature mandatory, simulate gone in prod ---

test('webhook policy requires a signature and disables the simulate route in production', () => {
  assert.deepEqual(webhookRoutePolicy('production', true), {
    requireSignature: true,
    simulateEnabled: false,
  });
  // Production never falls back to unsigned webhooks, secret present or not.
  assert.deepEqual(webhookRoutePolicy('production', false), {
    requireSignature: true,
    simulateEnabled: false,
  });
});

test('webhook policy keeps simulate available in development', () => {
  // Development mirrors current behavior: signature checked only when a
  // secret is configured; the simulate route stays reachable for local QA.
  assert.deepEqual(webhookRoutePolicy('development', true), {
    requireSignature: true,
    simulateEnabled: true,
  });
  assert.deepEqual(webhookRoutePolicy('development', false), {
    requireSignature: false,
    simulateEnabled: true,
  });
});

// --- boot guard: production refuses to start without a webhook secret ---

test('boot fails fast in production without PAYMENT_WEBHOOK_SECRET', () => {
  assert.throws(
    () => assertWebhookBootConfig('production', ''),
    (err: unknown) => err instanceof Error && /PAYMENT_WEBHOOK_SECRET/.test(err.message),
  );
  assert.doesNotThrow(() => assertWebhookBootConfig('production', 's3cret'));
  assert.doesNotThrow(() => assertWebhookBootConfig('development', ''));
});
