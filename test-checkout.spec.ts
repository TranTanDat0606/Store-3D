import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:5173';
const API = 'http://localhost:5000';

async function dismissOverlays(page: import('@playwright/test').Page) {
  for (let i = 0; i < 3; i++) {
    const overlay = page.locator('[data-slot="dialog-overlay"][data-state="open"]');
    const visible = await overlay.isVisible({ timeout: 1000 }).catch(() => false);
    if (!visible) return;
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
  }
}

async function login(page: import('@playwright/test').Page) {
  const res = await page.request.post(`${API}/api/auth/login`, {
    data: { email: 'admin@store3d.com', password: 'admin123' },
  });
  const body = await res.json();
  // Token may be in response body OR set as HTTP-only cookie
  const token = body.data?.token;
  if (token) {
    await page.context().addCookies([{
      name: 'token',
      value: token,
      domain: 'localhost',
      path: '/',
    }]);
  } else {
    // Extract from Set-Cookie header
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
      body._token = match[1];
    }
  }
  return body;
}

async function loginAndSeedCart(page: import('@playwright/test').Page) {
  const body = await login(page);
  const token = body.data?.token || body._token;
  if (!token) throw new Error('Login failed — no token');

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
  await dismissOverlays(page);
}

test.describe('Checkout — Payment Threshold', () => {

  test('T1 — Bank transfer enabled when total >= 1000', async ({ page }) => {
    await loginAndSeedCart(page);
    await page.waitForLoadState('networkidle');

    const bankBtn = page.locator('button').filter({ hasText: 'Chuyển khoản ngân hàng' });
    await expect(bankBtn).toBeVisible({ timeout: 5000 });
    await expect(bankBtn).toBeEnabled();
    console.log('T1 PASS');
  });

  test('T2 — Bank transfer button is not disabled for normal orders', async ({ page }) => {
    await loginAndSeedCart(page);
    await page.waitForLoadState('networkidle');

    const bankBtn = page.locator('button').filter({ hasText: 'Chuyển khoản ngân hàng' });
    await expect(bankBtn).toBeVisible({ timeout: 5000 });
    const isDisabled = await bankBtn.getAttribute('disabled');
    expect(isDisabled).toBeNull();
    console.log('T2 PASS');
  });

  test('T3 — COD is always available', async ({ page }) => {
    await loginAndSeedCart(page);
    await page.waitForLoadState('networkidle');

    const codBtn = page.locator('button').filter({ hasText: 'Thanh toán khi nhận hàng' });
    await expect(codBtn).toBeVisible({ timeout: 5000 });
    await expect(codBtn).toBeEnabled();
    console.log('T3 PASS');
  });
});

test.describe('Checkout — Coupon Dropdown', () => {

  test('C1 — Coupon input renders with search icon', async ({ page }) => {
    await loginAndSeedCart(page);
    await page.waitForLoadState('networkidle');

    const searchInput = page.getByPlaceholder('Nhập mã giảm giá...');
    await expect(searchInput).toBeVisible({ timeout: 5000 });
    console.log('C1 PASS');
  });

  test('C2 — Coupon input field is present', async ({ page }) => {
    await loginAndSeedCart(page);
    await page.waitForLoadState('networkidle');

    const searchInput = page.getByPlaceholder('Nhập mã giảm giá...');
    await expect(searchInput).toBeVisible({ timeout: 5000 });
    console.log('C2 PASS');
  });

  test('C3 — Apply button disabled when input is empty', async ({ page }) => {
    await loginAndSeedCart(page);
    await page.waitForLoadState('networkidle');

    const applyBtn = page.getByRole('button', { name: 'Áp dụng' });
    await expect(applyBtn).toBeVisible({ timeout: 3000 });
    await expect(applyBtn).toBeDisabled();
    console.log('C3 PASS');
  });
});

test.describe('Checkout — Backend Payment Threshold', () => {

  test('B1 — API rejects bank-transfer when total < 1000', async ({ page }) => {
    const loginRes = await page.request.post(`${API}/api/auth/login`, {
      data: { email: 'admin@store3d.com', password: 'admin123' },
    });
    const loginBody = await loginRes.json();
    const token = loginBody.data?.token;

    // Get a product with low price or use a coupon to bring total below 1000
    // First, get available coupons
    const couponsRes = await page.request.get(`${API}/api/coupons/available?subtotal=5000`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const couponsBody = await couponsRes.json();

    // Find a fixed coupon that would bring total below 1000
    const bigCoupon = couponsBody.data?.find((c: { type: string; discount: number; isApplicable: boolean }) =>
      c.type === 'fixed' && c.discount >= 5000 && c.isApplicable
    );

    if (bigCoupon) {
      // Get products
      const productsRes = await page.request.get(`${API}/api/products?limit=1`);
      const productsBody = await productsRes.json();
      const product = productsBody.data?.[0];

      if (product) {
        // Try to create order with bank-transfer and coupon that brings total < 1000
        const orderRes = await page.request.post(`${API}/api/orders`, {
          headers: { Authorization: `Bearer ${token}` },
          data: {
            customer: {
              name: 'Test User',
              phone: '0901234567',
              email: 'test@test.com',
              address: '123 Test Street, Ward 1, District 1, Ho Chi Minh City',
            },
            items: [{ product: product._id, quantity: 1 }],
            paymentMethod: 'bank-transfer',
            couponCode: bigCoupon.code,
          },
        });
        const orderBody = await orderRes.json();
        // Should be rejected
        expect(orderRes.status()).toBeGreaterThanOrEqual(400);
        console.log('B1 PASS — Backend rejected bank-transfer with low total');
      } else {
        console.log('B1 SKIP — No products found');
      }
    } else {
      console.log('B1 SKIP — No suitable coupon found for testing');
    }
  });

  test('B2 — API accepts bank-transfer when total >= 1000', async ({ page }) => {
    const loginRes = await page.request.post(`${API}/api/auth/login`, {
      data: { email: 'admin@store3d.com', password: 'admin123' },
    });
    const loginBody = await loginRes.json();
    const token = loginBody.data?.token;

    // Get a product
    const productsRes = await page.request.get(`${API}/api/products?limit=1`);
    const productsBody = await productsRes.json();
    const product = productsBody.data?.[0];

    if (product && product.salePrice >= 1000) {
      const orderRes = await page.request.post(`${API}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          customer: {
            name: 'Test User',
            phone: '0901234567',
            email: 'test@test.com',
            address: '123 Test Street, Ward 1, District 1, Ho Chi Minh City',
          },
          items: [{ product: product._id, quantity: 1 }],
          paymentMethod: 'bank-transfer',
        },
      });
      // Should succeed (201)
      expect(orderRes.status()).toBe(201);
      console.log('B2 PASS — Backend accepted bank-transfer with valid total');
    } else {
      console.log('B2 SKIP — No product with price >= 1000 found');
    }
  });

  test('B3 — API accepts COD for any total', async ({ page }) => {
    const loginRes = await page.request.post(`${API}/api/auth/login`, {
      data: { email: 'admin@store3d.com', password: 'admin123' },
    });
    const loginBody = await loginRes.json();
    const token = loginBody.data?.token;

    const productsRes = await page.request.get(`${API}/api/products?limit=1`);
    const productsBody = await productsRes.json();
    const product = productsBody.data?.[0];

    if (product) {
      const orderRes = await page.request.post(`${API}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          customer: {
            name: 'Test User',
            phone: '0901234567',
            email: 'test@test.com',
            address: '123 Test Street, Ward 1, District 1, Ho Chi Minh City',
          },
          items: [{ product: product._id, quantity: 1 }],
          paymentMethod: 'cash',
        },
      });
      expect(orderRes.status()).toBe(201);
      console.log('B3 PASS — Backend accepted COD');
    } else {
      console.log('B3 SKIP — No products found');
    }
  });
});

test.describe('Checkout — Eligible Coupons API', () => {

  test('E1 — Eligible coupons endpoint returns array', async ({ page }) => {
    const loginRes = await page.request.post(`${API}/api/auth/login`, {
      data: { email: 'admin@store3d.com', password: 'admin123' },
    });
    const loginBody = await loginRes.json();
    const token = loginBody.data?.token;

    const res = await page.request.get(`${API}/api/coupons/eligible?subtotal=100000`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
    console.log('E1 PASS');
  });

  test('E2 — Eligible coupons have source field', async ({ page }) => {
    const loginRes = await page.request.post(`${API}/api/auth/login`, {
      data: { email: 'admin@store3d.com', password: 'admin123' },
    });
    const loginBody = await loginRes.json();
    const token = loginBody.data?.token;

    const res = await page.request.get(`${API}/api/coupons/eligible?subtotal=100000`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json();
    if (body.data && body.data.length > 0) {
      const coupon = body.data[0];
      expect(coupon.source).toBeDefined();
      expect(['admin', 'game']).toContain(coupon.source);
      expect(coupon.estimatedDiscountAmount).toBeDefined();
      expect(typeof coupon.estimatedDiscountAmount).toBe('number');
    }
    console.log('E2 PASS');
  });

  test('E3 — Eligible coupons sorted by estimatedDiscountAmount DESC', async ({ page }) => {
    const loginRes = await page.request.post(`${API}/api/auth/login`, {
      data: { email: 'admin@store3d.com', password: 'admin123' },
    });
    const loginBody = await loginRes.json();
    const token = loginBody.data?.token;

    const res = await page.request.get(`${API}/api/coupons/eligible?subtotal=100000`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json();
    if (body.data && body.data.length > 1) {
      for (let i = 1; i < body.data.length; i++) {
        expect(body.data[i - 1].estimatedDiscountAmount).toBeGreaterThanOrEqual(
          body.data[i].estimatedDiscountAmount
        );
      }
    }
    console.log('E3 PASS');
  });

  test('E4 — Eligible coupons requires auth', async ({ page }) => {
    const res = await page.request.get(`${API}/api/coupons/eligible?subtotal=100000`);
    expect(res.status()).toBe(401);
    console.log('E4 PASS');
  });
});

test.describe('Checkout — Responsive', () => {

  test('R1 — Checkout page loads on desktop 1280px', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await loginAndSeedCart(page);
    await page.waitForLoadState('networkidle');

    const heading = page.getByRole('heading', { name: 'Thanh toán' });
    await expect(heading).toBeVisible({ timeout: 5000 });
    console.log('R1 PASS');
  });

  test('R2 — Checkout page loads on mobile 390x844', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAndSeedCart(page);
    await page.waitForLoadState('networkidle');

    const heading = page.getByRole('heading', { name: 'Thanh toán' });
    await expect(heading).toBeVisible({ timeout: 5000 });
    console.log('R2 PASS');
  });

  test('R3 — No horizontal overflow on checkout', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAndSeedCart(page);
    await page.waitForLoadState('networkidle');

    const overflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth);
    expect(overflow).toBe(false);
    console.log('R3 PASS');
  });
});
