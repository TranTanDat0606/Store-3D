import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateOrderCode, validateReconcile } from '../src/services/paymentService';

const base = { qrExpiresAt: new Date('2026-08-14T12:05:00.000Z'), total: 150000 };
const now = new Date('2026-08-14T12:00:00.000Z');

test('generateOrderCode returns ST3D-XXXXXX uppercase hex', () => {
  const code = generateOrderCode();
  assert.match(code, /^ST3D-[0-9A-F]{6}$/);
  assert.notEqual(code, generateOrderCode());
});

test('validateReconcile accepts pending_payment, valid expiry, exact amount', () => {
  const r = validateReconcile({ status: 'pending_payment', ...base }, 150000, now);
  assert.deepEqual(r, { ok: true });
});

test('validateReconcile is idempotent for already-paid orders', () => {
  const r = validateReconcile({ status: 'paid', qrExpiresAt: new Date(now.getTime() - 1), total: 0 }, 0, now);
  assert.deepEqual(r, { ok: true });
});

test('validateReconcile rejects non-pending orders', () => {
  const r = validateReconcile({ status: 'unpaid', ...base }, 150000, now);
  assert.equal(r.ok, false);
  assert.equal((r as { code: number }).code, 409);
});

test('validateReconcile rejects expired QR (server clock wins)', () => {
  const r = validateReconcile({ status: 'pending_payment', qrExpiresAt: new Date(now.getTime() - 1), total: 150000 }, 150000, now);
  assert.equal(r.ok, false);
  assert.equal((r as { code: number }).code, 400);
});

test('validateReconcile rejects missing expiry', () => {
  const r = validateReconcile({ status: 'pending_payment', total: 150000 }, 150000, now);
  assert.equal(r.ok, false);
});

test('validateReconcile rejects wrong amount', () => {
  const r = validateReconcile({ status: 'pending_payment', ...base }, 149999, now);
  assert.equal(r.ok, false);
  assert.equal((r as { code: number }).code, 400);
});