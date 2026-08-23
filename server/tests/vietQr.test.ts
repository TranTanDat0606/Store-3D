import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildVietQrQuickLink, getBankName } from '../src/services/vietQrService';

const bank = { bin: '970423', accountNumber: '70877769859', accountName: 'TRAN TAN DAT' };

test('buildVietQrQuickLink returns the official VietQR Quick Link', () => {
  const url = buildVietQrQuickLink({ ...bank, amount: 250000, content: 'ST3D-ABCDEF' });
  assert.ok(url.startsWith('https://img.vietqr.io/image/970423-70877769859-qr_only.png?'));
  assert.ok(url.includes('amount=250000'));
  assert.ok(url.includes('addInfo=ST3D-ABCDEF'));
  assert.ok(url.includes('accountName=TRAN+TAN+DAT'));
});

test('buildVietQrQuickLink URL-encodes the account name', () => {
  const url = buildVietQrQuickLink({ ...bank, accountName: 'Trần Tấn Đạt', amount: 100000, content: 'ST3D-TEST001' });
  assert.ok(url.includes('accountName=Tr%E1%BA%A7n+T%E1%BA%A5n+%C4%90%E1%BA%A1t'));
});

test('official VietQR CDN serves a QR image for the generated link', async () => {
  const link = buildVietQrQuickLink({ ...bank, amount: 250000, content: 'ST3D-TEST001' });
  const res = await fetch(link);
  assert.equal(res.ok, true);
  assert.match(res.headers.get('content-type') ?? '', /^image\//);
});

test('getBankName resolves known and unknown BINs', () => {
  assert.equal(getBankName('970423'), 'TPBank – Tiên Phong Bank');
  assert.equal(getBankName('970418'), 'Vietcombank');
  assert.equal(getBankName('999999'), 'Ngân hàng (999999)');
});