import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:5173';

test.describe('TOP Badge — Home Page', () => {

  test('H1 — TOP 1 visible on first product', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    const section = page.getByRole('heading', { name: 'Sản phẩm bán chạy' }).locator('xpath=ancestor::section');
    const firstCard = section.locator('a[href^="/san-pham/"]').first();
    const badge = firstCard.locator('span[data-slot="badge"]').filter({ hasText: /TOP 1/ });
    await expect(badge).toBeVisible({ timeout: 5000 });
    console.log('H1 PASS');
  });

  test('H2 — TOP 2 visible on second product', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    const section = page.getByRole('heading', { name: 'Sản phẩm bán chạy' }).locator('xpath=ancestor::section');
    const secondCard = section.locator('a[href^="/san-pham/"]').nth(1);
    const badge = secondCard.locator('span[data-slot="badge"]').filter({ hasText: /TOP 2/ });
    await expect(badge).toBeVisible({ timeout: 5000 });
    console.log('H2 PASS');
  });

  test('H3 — TOP 3 visible on third product', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    const section = page.getByRole('heading', { name: 'Sản phẩm bán chạy' }).locator('xpath=ancestor::section');
    const thirdCard = section.locator('a[href^="/san-pham/"]').nth(2);
    const badge = thirdCard.locator('span[data-slot="badge"]').filter({ hasText: /TOP 3/ });
    await expect(badge).toBeVisible({ timeout: 5000 });
    console.log('H3 PASS');
  });

  test('H4 — Fourth product has NO TOP badge', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    const section = page.getByRole('heading', { name: 'Sản phẩm bán chạy' }).locator('xpath=ancestor::section');
    const fourthCard = section.locator('a[href^="/san-pham/"]').nth(3);
    const count = await fourthCard.locator('span[data-slot="badge"]').filter({ hasText: /TOP [123]/ }).count();
    expect(count).toBe(0);
    console.log('H4 PASS');
  });

  test('H5 — "Nổi bật" badge removed', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    const section = page.getByRole('heading', { name: 'Sản phẩm bán chạy' }).locator('xpath=ancestor::section');
    const count = await section.locator('span[data-slot="badge"]').filter({ hasText: 'Nổi bật' }).count();
    expect(count).toBe(0);
    console.log('H5 PASS');
  });

  test('H6 — TOP badge is LEFT-side vertical stack', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    const section = page.getByRole('heading', { name: 'Sản phẩm bán chạy' }).locator('xpath=ancestor::section');
    const firstCard = section.locator('a[href^="/san-pham/"]').first();
    const badgeContainer = firstCard.locator('.absolute.top-3.left-3.flex.flex-col');
    const count = await badgeContainer.count();
    expect(count).toBeGreaterThan(0);
    console.log('H6 PASS');
  });

  test('H7 — Discount + TOP badge coexist (vertical)', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    const section = page.getByRole('heading', { name: 'Sản phẩm bán chạy' }).locator('xpath=ancestor::section');
    const firstCard = section.locator('a[href^="/san-pham/"]').first();
    const topBadge = firstCard.locator('span[data-slot="badge"]').filter({ hasText: /TOP 1/ });
    await expect(topBadge).toBeVisible({ timeout: 5000 });
    const discountBadge = firstCard.locator('span[data-slot="badge"]').filter({ hasText: /^-\d+%$/ });
    const discountCount = await discountBadge.count();
    if (discountCount > 0) {
      await expect(discountBadge.first()).toBeVisible();
      const discountBox = await discountBadge.first().boundingBox();
      const topBox = await topBadge.boundingBox();
      if (discountBox && topBox) {
        expect(topBox.y).toBeGreaterThan(discountBox.y);
      }
      console.log('H7 PASS: Both visible, TOP below discount');
    } else {
      console.log('H7 PASS: TOP 1 visible (no discount on this product)');
    }
  });
});

test.describe('TOP Badge — Best-Selling Page', () => {

  test('B1 — Navigate to best-selling page', async ({ page }) => {
    await page.goto(`${BASE}/san-pham?sort=best-selling`, { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { name: 'Sản phẩm bán chạy' })).toBeVisible({ timeout: 10000 });
    console.log('B1 PASS');
  });

  test('B2 — TOP 1 visible on first product', async ({ page }) => {
    await page.goto(`${BASE}/san-pham?sort=best-selling`, { waitUntil: 'networkidle' });
    const firstCard = page.locator('a[href^="/san-pham/"]').first();
    await expect(firstCard).toBeVisible({ timeout: 10000 });
    const badge = firstCard.locator('span[data-slot="badge"]').filter({ hasText: /TOP 1/ });
    await expect(badge).toBeVisible({ timeout: 5000 });
    console.log('B2 PASS');
  });

  test('B3 — TOP 2 visible on second product', async ({ page }) => {
    await page.goto(`${BASE}/san-pham?sort=best-selling`, { waitUntil: 'networkidle' });
    const secondCard = page.locator('a[href^="/san-pham/"]').nth(1);
    const badge = secondCard.locator('span[data-slot="badge"]').filter({ hasText: /TOP 2/ });
    await expect(badge).toBeVisible({ timeout: 5000 });
    console.log('B3 PASS');
  });

  test('B4 — TOP 3 visible on third product', async ({ page }) => {
    await page.goto(`${BASE}/san-pham?sort=best-selling`, { waitUntil: 'networkidle' });
    const thirdCard = page.locator('a[href^="/san-pham/"]').nth(2);
    const badge = thirdCard.locator('span[data-slot="badge"]').filter({ hasText: /TOP 3/ });
    await expect(badge).toBeVisible({ timeout: 5000 });
    console.log('B4 PASS');
  });

  test('B5 — Fourth product has NO TOP badge', async ({ page }) => {
    await page.goto(`${BASE}/san-pham?sort=best-selling`, { waitUntil: 'networkidle' });
    const fourthCard = page.locator('a[href^="/san-pham/"]').nth(3);
    const count = await fourthCard.locator('span[data-slot="badge"]').filter({ hasText: /TOP [123]/ }).count();
    expect(count).toBe(0);
    console.log('B5 PASS');
  });

  test('B6 — Click product navigates to detail', async ({ page }) => {
    await page.goto(`${BASE}/san-pham?sort=best-selling`, { waitUntil: 'networkidle' });
    const firstCard = page.locator('a[href^="/san-pham/"]').first();
    await expect(firstCard).toBeVisible({ timeout: 10000 });
    await firstCard.click();
    await page.waitForURL(/\/san-pham\/.+/, { timeout: 5000 });
    expect(page.url()).toContain('/san-pham/');
    console.log('B6 PASS');
  });
});

test.describe('TOP Badge — Colors', () => {

  test('C1 — TOP 1 is amber/gold', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    const section = page.getByRole('heading', { name: 'Sản phẩm bán chạy' }).locator('xpath=ancestor::section');
    const badge = section.locator('a[href^="/san-pham/"]').first().locator('span[data-slot="badge"]').filter({ hasText: /TOP 1/ });
    await expect(badge).toBeVisible({ timeout: 5000 });
    const cls = await badge.getAttribute('class');
    expect(cls).toContain('amber');
    console.log('C1 PASS');
  });

  test('C2 — TOP 2 is slate/silver', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    const section = page.getByRole('heading', { name: 'Sản phẩm bán chạy' }).locator('xpath=ancestor::section');
    const badge = section.locator('a[href^="/san-pham/"]').nth(1).locator('span[data-slot="badge"]').filter({ hasText: /TOP 2/ });
    await expect(badge).toBeVisible({ timeout: 5000 });
    const cls = await badge.getAttribute('class');
    expect(cls).toContain('slate');
    console.log('C2 PASS');
  });

  test('C3 — TOP 3 is orange/bronze', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    const section = page.getByRole('heading', { name: 'Sản phẩm bán chạy' }).locator('xpath=ancestor::section');
    const badge = section.locator('a[href^="/san-pham/"]').nth(2).locator('span[data-slot="badge"]').filter({ hasText: /TOP 3/ });
    await expect(badge).toBeVisible({ timeout: 5000 });
    const cls = await badge.getAttribute('class');
    expect(cls).toContain('orange');
    console.log('C3 PASS');
  });

  test('C4 — All TOP badges have Trophy icon', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    const section = page.getByRole('heading', { name: 'Sản phẩm bán chạy' }).locator('xpath=ancestor::section');
    for (let rank = 1; rank <= 3; rank++) {
      const badge = section.locator('a[href^="/san-pham/"]').nth(rank - 1).locator('span[data-slot="badge"]').filter({ hasText: new RegExp(`TOP ${rank}`) });
      await expect(badge).toBeVisible({ timeout: 5000 });
      const svgCount = await badge.locator('svg').count();
      expect(svgCount).toBeGreaterThan(0);
    }
    console.log('C4 PASS');
  });
});

test.describe('TOP Badge — Light/Dark', () => {

  test('D1 — Dark mode Home', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    // Use theme toggle button to switch to dark mode
    const themeToggle = page.locator('button[aria-label*="theme"], button[aria-label*="giao diện"], button').filter({ has: page.locator('svg') }).last();
    // Set dark via localStorage + classList directly (theme system reads this)
    await page.evaluate(() => {
      localStorage.setItem('store3d-theme', 'dark');
      document.documentElement.classList.add('dark');
    });
    await page.waitForTimeout(500);
    const section = page.getByRole('heading', { name: 'Sản phẩm bán chạy' }).locator('xpath=ancestor::section');
    const badge = section.locator('a[href^="/san-pham/"]').first().locator('span[data-slot="badge"]').filter({ hasText: /TOP 1/ });
    await expect(badge).toBeVisible({ timeout: 5000 });
    console.log('D1 PASS');
  });

  test('D2 — Dark mode Best-Selling', async ({ page }) => {
    await page.goto(`${BASE}/san-pham?sort=best-selling`, { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      localStorage.setItem('store3d-theme', 'dark');
      document.documentElement.classList.add('dark');
    });
    await page.waitForTimeout(500);
    const firstCard = page.locator('a[href^="/san-pham/"]').first();
    await expect(firstCard).toBeVisible({ timeout: 10000 });
    const badge = firstCard.locator('span[data-slot="badge"]').filter({ hasText: /TOP 1/ });
    await expect(badge).toBeVisible({ timeout: 5000 });
    console.log('D2 PASS');
  });
});

test.describe('TOP Badge — Responsive', () => {

  test('R1 — Desktop 1280px no overflow (Home)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(BASE, { waitUntil: 'networkidle' });
    const heading = page.getByRole('heading', { name: 'Sản phẩm bán chạy' });
    await expect(heading).toBeVisible();
    const overflow = await heading.locator('xpath=ancestor::section').evaluate(el => el.scrollWidth > el.clientWidth);
    expect(overflow).toBe(false);
    console.log('R1 PASS');
  });

  test('R2 — Mobile 390x844 no overflow (Home)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(BASE, { waitUntil: 'networkidle' });
    const heading = page.getByRole('heading', { name: 'Sản phẩm bán chạy' });
    await expect(heading).toBeVisible();
    const overflow = await heading.locator('xpath=ancestor::section').evaluate(el => el.scrollWidth > el.clientWidth);
    expect(overflow).toBe(false);
    console.log('R2 PASS');
  });

  test('R3 — Mobile 375x667 no overflow (Home)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(BASE, { waitUntil: 'networkidle' });
    const heading = page.getByRole('heading', { name: 'Sản phẩm bán chạy' });
    await expect(heading).toBeVisible();
    const overflow = await heading.locator('xpath=ancestor::section').evaluate(el => el.scrollWidth > el.clientWidth);
    expect(overflow).toBe(false);
    console.log('R3 PASS');
  });

  test('R4 — Mobile 390x844 no overflow (Best-Selling)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE}/san-pham?sort=best-selling`, { waitUntil: 'networkidle' });
    const heading = page.getByRole('heading', { name: 'Sản phẩm bán chạy' });
    await expect(heading).toBeVisible();
    const grid = page.locator('div.grid.grid-cols-2').first();
    await expect(grid).toBeVisible();
    const overflow = await grid.evaluate(el => el.scrollWidth > el.clientWidth);
    expect(overflow).toBe(false);
    console.log('R4 PASS');
  });
});
