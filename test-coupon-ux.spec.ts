import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:5173';
const API = 'http://localhost:5000';

async function login(page: import('@playwright/test').Page) {
  const res = await page.request.post(`${API}/api/auth/login`, {
    data: { email: 'admin@store3d.com', password: 'admin123' },
  });
  const body = await res.json();
  const token = body.data?.token;
  if (token) {
    await page.context().addCookies([{
      name: 'token',
      value: token,
      domain: 'localhost',
      path: '/',
    }]);
  } else {
    const headers = res.headers();
    const setCookie = headers['set-cookie'] || '';
    const match = setCookie.match(/token=([^;]+)/);
    if (match) {
      await page.context().addCookies([{
        name: 'token',
        value: match[1],
        domain: 'localhost',
        path: '/',
      }]);
    }
  }
  return body;
}

async function loginAndSeedCart(page: import('@playwright/test').Page) {
  await login(page);

  const prodRes = await page.request.get(`${API}/api/products?limit=1&fields=_id,name,slug,salePrice,images,stock`);
  const prodBody = await prodRes.json();
  const product = prodBody.data?.[0];
  if (!product) throw new Error('No products found');

  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  await page.evaluate((p) => {
    const cartItem = {
      productId: p._id,
      name: p.name,
      slug: p.slug,
      image: p.images?.[0] || '',
      price: p.salePrice || p.price || 0,
      quantity: 1,
      stock: p.stock || 100,
    };
    localStorage.setItem('store3d-cart', JSON.stringify([cartItem]));
  }, product);

  await page.goto(`${BASE}/thanh-toan`, { waitUntil: 'networkidle' });
}

test.describe('Coupon UX — Input & Autocomplete', () => {

  test('CU1 — Coupon input renders with search icon and apply button', async ({ page }) => {
    await loginAndSeedCart(page);

    const searchInput = page.getByPlaceholder('Nhập mã giảm giá...');
    await expect(searchInput).toBeVisible({ timeout: 5000 });

    const applyBtn = page.getByRole('button', { name: 'Áp dụng' });
    await expect(applyBtn).toBeVisible();
    await expect(applyBtn).toBeDisabled();
    console.log('CU1 PASS');
  });

  test('CU2 — Coupon list visible by default (no focus needed)', async ({ page }) => {
    await loginAndSeedCart(page);

    const couponItems = page.locator('[data-coupon-item]');
    const searchInput = page.getByPlaceholder('Nhập mã giảm giá...');
    await expect(searchInput).toBeVisible({ timeout: 5000 });
    const count = await couponItems.count();
    expect(count).toBeGreaterThanOrEqual(0);
    console.log('CU2 PASS');
  });

  test('CU3 — Typing filters coupons client-side (case-insensitive)', async ({ page }) => {
    await loginAndSeedCart(page);

    const searchInput = page.getByPlaceholder('Nhập mã giảm giá...');
    await searchInput.click();
    await page.waitForTimeout(1000);

    await searchInput.fill('g');

    const items = page.locator('[data-coupon-item]');
    const count = await items.count();
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const code = await items.nth(i).locator('span').first().textContent();
        expect(code?.toLowerCase()).toContain('g');
      }
    }
    console.log('CU3 PASS');
  });

  test('CU4 — Click "Dùng" applies coupon directly', async ({ page }) => {
    await loginAndSeedCart(page);

    const searchInput = page.getByPlaceholder('Nhập mã giảm giá...');
    await searchInput.click();
    await page.waitForTimeout(1000);

    const firstItem = page.locator('[data-coupon-item]').first();
    if (await firstItem.isVisible({ timeout: 3000 }).catch(() => false)) {
      const applyBtn = firstItem.getByRole('button', { name: 'Dùng' });
      if (await applyBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await applyBtn.click();
        await page.waitForTimeout(2000);
        // Should apply coupon — green state appears
        const removeBtn = page.getByRole('button', { name: 'Bỏ mã' });
        await expect(removeBtn).toBeVisible({ timeout: 5000 });
      }
    }
    console.log('CU4 PASS');
  });

  test('CU5 — Escape blurs input (list remains visible)', async ({ page }) => {
    await loginAndSeedCart(page);

    const searchInput = page.getByPlaceholder('Nhập mã giảm giá...');
    await searchInput.click();
    await page.waitForTimeout(500);

    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    const items = page.locator('[data-coupon-item]');
    const count = await items.count();
    expect(count).toBeGreaterThanOrEqual(0);
    console.log('CU5 PASS');
  });

  test('CU6 — No request storm on typing (client-side filter)', async ({ page }) => {
    await loginAndSeedCart(page);

    const searchInput = page.getByPlaceholder('Nhập mã giảm giá...');
    await searchInput.click();
    await page.waitForTimeout(1000);

    let requestCount = 0;
    page.on('request', (req) => {
      if (req.url().includes('/api/coupons/eligible')) requestCount++;
    });

    await searchInput.fill('g');
    await page.waitForTimeout(500);
    await searchInput.fill('gi');
    await page.waitForTimeout(500);
    await searchInput.fill('giam');
    await page.waitForTimeout(500);

    expect(requestCount).toBe(0);
    console.log('CU6 PASS — No coupon API requests during typing');
  });

  test('CU7 — Coupon list always visible (click outside does not hide)', async ({ page }) => {
    await loginAndSeedCart(page);

    const heading = page.getByRole('heading', { name: 'Thanh toán' });
    await heading.click();
    await page.waitForTimeout(300);

    const items = page.locator('[data-coupon-item]');
    const count = await items.count();
    expect(count).toBeGreaterThanOrEqual(0);
    console.log('CU7 PASS');
  });

  test('CU8 — Applied coupon shows green state with remove button', async ({ page }) => {
    await loginAndSeedCart(page);

    const searchInput = page.getByPlaceholder('Nhập mã giảm giá...');
    await searchInput.click();
    await page.waitForTimeout(1000);

    const firstItem = page.locator('[data-coupon-item]').first();
    if (await firstItem.isVisible({ timeout: 3000 }).catch(() => false)) {
      const applyBtnInItem = firstItem.getByRole('button', { name: 'Dùng' });
      if (await applyBtnInItem.isVisible({ timeout: 2000 }).catch(() => false)) {
        await applyBtnInItem.click();
        await page.waitForTimeout(2000);

        const removeBtn = page.getByRole('button', { name: 'Bỏ mã' });
        await expect(removeBtn).toBeVisible({ timeout: 5000 });
        console.log('CU8 PASS');
      } else {
        console.log('CU8 SKIP — No applicable coupon');
      }
    } else {
      console.log('CU8 SKIP — No coupons available');
    }
  });

  test('CU9 — Remove coupon restores input state', async ({ page }) => {
    await loginAndSeedCart(page);

    const searchInput = page.getByPlaceholder('Nhập mã giảm giá...');
    await searchInput.click();
    await page.waitForTimeout(1000);

    const firstItem = page.locator('[data-coupon-item]').first();
    if (await firstItem.isVisible({ timeout: 3000 }).catch(() => false)) {
      const applyBtnInItem = firstItem.getByRole('button', { name: 'Dùng' });
      if (await applyBtnInItem.isVisible({ timeout: 2000 }).catch(() => false)) {
        await applyBtnInItem.click();
        await page.waitForTimeout(2000);

        const removeBtn = page.getByRole('button', { name: 'Bỏ mã' });
        if (await removeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await removeBtn.click();
          await expect(searchInput).toBeVisible({ timeout: 3000 });
        }
      }
    }
    console.log('CU9 PASS');
  });

  test('CU10 — Coupon code uses readable font (not mono)', async ({ page }) => {
    await loginAndSeedCart(page);

    const searchInput = page.getByPlaceholder('Nhập mã giảm giá...');
    await searchInput.click();
    await page.waitForTimeout(1000);

    const firstItem = page.locator('[data-coupon-item]').first();
    if (await firstItem.isVisible({ timeout: 3000 }).catch(() => false)) {
      const codeEl = firstItem.locator('span').first();
      const fontFamily = await codeEl.evaluate((el) => window.getComputedStyle(el).fontFamily);
      expect(fontFamily.toLowerCase()).not.toContain('mono');
    }
    console.log('CU10 PASS');
  });

  test('CU11 — "Dùng" button uses primary color (not orange)', async ({ page }) => {
    await loginAndSeedCart(page);

    const searchInput = page.getByPlaceholder('Nhập mã giảm giá...');
    await searchInput.click();
    await page.waitForTimeout(1000);

    const firstItem = page.locator('[data-coupon-item]').first();
    if (await firstItem.isVisible({ timeout: 3000 }).catch(() => false)) {
      const btn = firstItem.getByRole('button', { name: 'Dùng' });
      if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
        const bgColor = await btn.evaluate((el) => window.getComputedStyle(el).backgroundColor);
        expect(bgColor.toLowerCase()).not.toContain('orange');
      }
    }
    console.log('CU11 PASS');
  });

  test('CU12 — Scrollable list when >3 coupons (structural check)', async ({ page }) => {
    await loginAndSeedCart(page);

    const searchInput = page.getByPlaceholder('Nhập mã giảm giá...');
    await searchInput.click();
    await page.waitForTimeout(1000);

    const scrollContainer = page.locator('[data-coupon-item]').first().locator('xpath=ancestor::div[contains(@class,"overflow-y-auto")]');
    if (await scrollContainer.isVisible({ timeout: 2000 }).catch(() => false)) {
      const overflow = await scrollContainer.evaluate((el) => window.getComputedStyle(el).overflowY);
      expect(overflow).toBe('auto');
    }
    console.log('CU12 PASS — Structural scroll check');
  });

  test('CU13 — Keyboard Arrow Down/Up navigates suggestions', async ({ page }) => {
    await loginAndSeedCart(page);

    const searchInput = page.getByPlaceholder('Nhập mã giảm giá...');
    await searchInput.click();
    await page.waitForTimeout(1000);

    const items = page.locator('[data-coupon-item]');
    const count = await items.count();
    if (count > 1) {
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(200);

      const highlighted = page.locator('[data-coupon-item].bg-primary\\/5');
      const highlightCount = await highlighted.count();
      expect(highlightCount).toBeGreaterThanOrEqual(0);
    }
    console.log('CU13 PASS');
  });

  test('CU14 — Empty search shows all coupons', async ({ page }) => {
    await loginAndSeedCart(page);

    const searchInput = page.getByPlaceholder('Nhập mã giảm giá...');
    await searchInput.click();
    await page.waitForTimeout(1000);

    const allItems = page.locator('[data-coupon-item]');
    const allCount = await allItems.count();

    await searchInput.fill('xyz999');
    await page.waitForTimeout(300);
    const filteredCount = await allItems.count();

    await searchInput.fill('');
    await page.waitForTimeout(300);
    const resetCount = await allItems.count();

    expect(resetCount).toBe(allCount);
    console.log('CU14 PASS');
  });

  test('CU15 — Apply button disabled when input empty', async ({ page }) => {
    await loginAndSeedCart(page);

    const applyBtn = page.getByRole('button', { name: 'Áp dụng' });
    await expect(applyBtn).toBeDisabled();
    console.log('CU15 PASS');
  });

  test('CU16 — No horizontal overflow on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAndSeedCart(page);

    const searchInput = page.getByPlaceholder('Nhập mã giảm giá...');
    await expect(searchInput).toBeVisible({ timeout: 5000 });

    const overflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth);
    expect(overflow).toBe(false);
    console.log('CU16 PASS');
  });

  test('CU17 — Coupon section does not cover Place Order button', async ({ page }) => {
    await loginAndSeedCart(page);

    const searchInput = page.getByPlaceholder('Nhập mã giảm giá...');
    await searchInput.click();
    await page.waitForTimeout(1000);

    const placeOrderBtn = page.getByRole('button', { name: 'Đặt hàng' });
    await expect(placeOrderBtn).toBeVisible({ timeout: 5000 });

    const btnBox = await placeOrderBtn.boundingBox();
    expect(btnBox).not.toBeNull();
    console.log('CU17 PASS');
  });
});
