import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildVietQrPayload, crc16, getBankName, renderQrDataUrl } from '../src/services/vietQrService';

const bank = { bin: '970418', accountNumber: '123456789012', accountName: 'STORE 3D' };

test('buildVietQrPayload emits EMVCo-compliant payload', () => {
  const payload = buildVietQrPayload(bank, 150000, 'ST3D-ABCDEF');
  assert.ok(payload.startsWith('000201010212'));
  assert.ok(payload.includes('A000000727'));
  assert.ok(payload.includes('970418'));
  assert.ok(payload.includes('123456789012'));
  assert.ok(payload.includes('150000'));
  assert.ok(payload.includes('ST3D-ABCDEF'));
  assert.match(payload, /6304[0-9A-F]{4}$/);
});

test('crc16 matches reference CCITT value', () => {
  assert.equal(crc16('123456789'), 0x29b1);
});

test('getBankName resolves known and unknown BINs', () => {
  assert.equal(getBankName('970418'), 'Vietcombank');
  assert.equal(getBankName('999999'), 'Ngân hàng (999999)');
});

test('renderQrDataUrl returns a PNG data URL', async () => {
  const url = await renderQrDataUrl('0002010102122615A0000007270124980123456');
  assert.ok(url.startsWith('data:image/png;base64,'));
  assert.ok(url.length > 100);
});