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

async function loginAdmin(page: import('@playwright/test').Page) {
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
  }
  return body;
}

test.describe('Contact — Textarea & Long Message', () => {
  test('CT1 — Textarea renders with ~200px height and resize-none', async ({ page }) => {
    await page.goto(`${BASE}/lien-he`);
    await page.waitForSelector('textarea', { timeout: 10000 });

    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible();

    const box = await textarea.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(180);
    expect(box!.height).toBeLessThanOrEqual(260);

    const resize = await textarea.evaluate((el) => getComputedStyle(el).resize);
    expect(resize).toBe('none');
  });

  test('CT2 — Textarea maxLength is 2000', async ({ page }) => {
    await page.goto(`${BASE}/lien-he`);
    await page.waitForSelector('textarea', { timeout: 10000 });

    const textarea = page.locator('textarea');
    const maxLength = await textarea.getAttribute('maxlength');
    expect(maxLength).toBe('2000');
  });

  test('CT3 — User can type 1000+ characters without truncation', async ({ page }) => {
    await page.goto(`${BASE}/lien-he`);
    await page.waitForSelector('input[placeholder="Nguyễn Văn A"]', { timeout: 10000 });

    await page.fill('input[placeholder="Nguyễn Văn A"]', 'Test User');
    await page.fill('input[placeholder="0901 234 567"]', '0901234567');
    await page.fill('input[type="email"]', 'test-contact@example.com');

    const longMessage = 'Đây là nội dung hỗ trợ dài. '.repeat(50);
    expect(longMessage.length).toBeGreaterThan(1000);

    await page.fill('textarea', longMessage);

    const value = await page.locator('textarea').inputValue();
    expect(value.length).toBeGreaterThanOrEqual(1000);
    expect(value).toContain('Đây là nội dung hỗ trợ dài.');
  });

  test('CT4 — Submit with long message succeeds', async ({ page }) => {
    await page.goto(`${BASE}/lien-he`);
    await page.waitForSelector('input[placeholder="Nguyễn Văn A"]', { timeout: 10000 });

    await page.fill('input[placeholder="Nguyễn Văn A"]', 'Playwright Test User');
    await page.fill('input[placeholder="0901 234 567"]', '0901234567');
    await page.fill('input[type="email"]', `playwright-contact-${Date.now()}@test.com`);

    const longMessage = 'Nội dung test dài cho QA contact form. '.repeat(30);
    await page.fill('textarea', longMessage);

    await page.click('button[type="submit"]');

    await page.waitForSelector('text=Đã gửi', { timeout: 15000 });
    await expect(page.locator('text=Đã gửi')).toBeVisible();
  });
});

test.describe('Contact — Admin Support Flow', () => {
  test('AS1 — Admin support page loads', async ({ page }) => {
    await loginAdmin(page);
    await page.goto(`${BASE}/admin/ho-tro`);
    await dismissOverlays(page);

    await page.waitForSelector('text=Yêu cầu hỗ trợ', { timeout: 15000 });
    await expect(page.locator('text=Yêu cầu hỗ trợ').first()).toBeVisible();
  });

  test('AS2 — Ticket detail shows customer info and message', async ({ page }) => {
    await loginAdmin(page);
    await page.goto(`${BASE}/admin/ho-tro`);
    await dismissOverlays(page);

    await page.waitForSelector('table', { timeout: 15000 });

    const viewBtn = page.locator('table tbody tr').first().locator('button').last();
    if (await viewBtn.isVisible()) {
      await viewBtn.click();
      await page.waitForSelector('text=Thông tin khách hàng', { timeout: 10000 });
      await expect(page.locator('text=Tên:').first()).toBeVisible();
      await expect(page.locator('text=Email:').first()).toBeVisible();
      await expect(page.locator('text=Điện thoại:').first()).toBeVisible();
    }
  });

  test('AS3 — Admin reply textarea is tall enough', async ({ page }) => {
    await loginAdmin(page);
    await page.goto(`${BASE}/admin/ho-tro`);
    await dismissOverlays(page);

    await page.waitForSelector('table', { timeout: 15000 });

    const viewBtn = page.locator('table tbody tr').first().locator('button').last();
    if (await viewBtn.isVisible()) {
      await viewBtn.click();
      await page.waitForSelector('text=Nội dung xử lý', { timeout: 10000 });

      const replySection = page.locator('text=Nội dung xử lý').locator('..');
      const replyTextarea = replySection.locator('textarea');
      if (await replyTextarea.isVisible()) {
        const box = await replyTextarea.boundingBox();
        expect(box).not.toBeNull();
        expect(box!.height).toBeGreaterThanOrEqual(150);
      }
    }
  });
});

test.describe('Contact — API Security', () => {
  test('SEC1 — Admin endpoints require auth', async ({ request }) => {
    const res = await request.get(`${API}/api/contact/admin`);
    expect(res.status()).toBe(401);
  });

  test('SEC2 — Non-admin cannot access admin endpoints', async ({ page, request }) => {
    const loginRes = await page.request.post(`${API}/api/auth/login`, {
      data: { email: 'khach@store3d.com', password: 'khach123' },
    });
    const loginBody = await loginRes.json();
    const token = loginBody.data?.token;
    if (token) {
      await page.context().addCookies([{
        name: 'token',
        value: token,
        domain: 'localhost',
        path: '/',
      }]);
    }
    const res = await page.request.get(`${API}/api/contact/admin`);
    expect(res.status()).toBe(403);
  });

  test('SEC3 — Contact submit works without auth', async ({ request }) => {
    const res = await request.post(`${API}/api/contact`, {
      data: {
        fullname: 'Public Test',
        email: 'public@test.com',
        phone: '0901234567',
        message: 'Test message',
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});

test.describe('Contact — Email Service Integration', () => {
  test('EM1 — Contact submission creates ticket in DB', async ({ page }) => {
    await loginAdmin(page);

    const email = `email-test-${Date.now()}@example.com`;
    const res = await page.request.post(`${API}/api/contact`, {
      data: {
        fullname: 'Email Test',
        email,
        phone: '0901234567',
        message: 'Email integration test',
      },
    });
    const body = await res.json();
    expect(body.success).toBe(true);
    const ticketId = body.data?.id;
    expect(ticketId).toBeTruthy();

    const detailRes = await page.request.get(`${API}/api/contact/admin/${ticketId}`);
    const detail = await detailRes.json();
    const ticket = detail.data || detail;
    expect(ticket.email).toBe(email);
    expect(ticket.message).toBe('Email integration test');
    expect(ticket.status).toBe('new');
  });

  test('EM2 — Admin reply sets status to in_progress', async ({ page }) => {
    await loginAdmin(page);

    const email = `reply-test-${Date.now()}@example.com`;
    const createRes = await page.request.post(`${API}/api/contact`, {
      data: {
        fullname: 'Reply Test',
        email,
        phone: '0901234567',
        message: 'Test reply flow',
      },
    });
    const createBody = await createRes.json();
    const ticketId = createBody.data?.id;
    expect(ticketId).toBeTruthy();

    const replyRes = await page.request.post(`${API}/api/contact/admin/${ticketId}/send-resolution`, {
      data: { resolutionContent: 'Phản hồi từ admin: Chúng tôi đã xử lý.' },
    });
    expect(replyRes.status()).toBe(200);

    const detailRes = await page.request.get(`${API}/api/contact/admin/${ticketId}`);
    const detail = await detailRes.json();
    const ticket = detail.data || detail;
    expect(ticket.status).toBe('in_progress');
    expect(ticket.resolutionContent).toBe('Phản hồi từ admin: Chúng tôi đã xử lý.');
  });
});
