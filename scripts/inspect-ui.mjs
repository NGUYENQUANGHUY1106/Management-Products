import { chromium, expect } from '@playwright/test';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
const login = JSON.parse(await readFile('D:/ManagementProduct-Credentials/admin-login.json', 'utf8'));
const browser = await chromium.launch();
const checks = [];
await mkdir('docs/screenshots', { recursive: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.setDefaultTimeout(30000);
  await page.goto(process.env.PRODUCT_WEB_URL || 'http://localhost:8082', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.getByLabel('Email', { exact: true }).fill(login.adminEmail);
  await page.getByLabel('Mật khẩu', { exact: true }).fill(login.password);
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await page.getByTestId('product-row').first().waitFor();
  const localImages = page.locator('img[src*="/uploads/"]');
  for (let i = 0; i < await localImages.count(); i++) await expect.poll(() => localImages.nth(i).evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
  checks.push('Existing localhost upload images load through LAN API');
  await page.screenshot({ path: 'docs/screenshots/01-products-web.png', fullPage: true, animations: 'disabled' });
  await page.getByRole('button', { name: 'Thêm sản phẩm', exact: true }).click();
  await page.getByRole('dialog').waitFor();
  await page.screenshot({ path: 'docs/screenshots/02-create-product-web.png', fullPage: true, animations: 'disabled' });
  await page.getByRole('button', { name: 'Đóng biểu mẫu', exact: true }).click();
  const row = page.getByTestId('product-row').first();
  await row.getByRole('button', { name: /^Sửa / }).click();
  await page.screenshot({ path: 'docs/screenshots/03-edit-product-web.png', fullPage: true, animations: 'disabled' });
  await page.getByRole('button', { name: 'Hủy', exact: true }).click();
  await row.getByRole('button', { name: /^Xóa / }).click();
  await page.screenshot({ path: 'docs/screenshots/06-delete-product.png', fullPage: true, animations: 'disabled' });
  await page.getByRole('button', { name: 'Hủy xóa', exact: true }).click();
  for (const width of [820, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    checks.push(`No horizontal overflow at ${width}px`);
    await page.screenshot({ path: `docs/screenshots/${width === 390 ? '04-products-mobile-web' : '10-products-tablet'}.png`, fullPage: true, animations: 'disabled' });
  }
  await row.getByRole('button', { name: /^Sửa / }).click();
  await page.screenshot({ path: 'docs/screenshots/05-image-mobile-web.png', fullPage: true, animations: 'disabled' });
  await page.getByRole('button', { name: 'Đóng biểu mẫu', exact: true }).click();
  checks.push('Add/edit/delete dialogs open and cancel without modifying products');
  await writeFile('docs/testing/ui-layout-results.json', JSON.stringify({ checkedAt: new Date().toISOString(), results: checks.map(name => ({ name, status: 'PASS' })) }, null, 2));
  console.log(checks.join('\n'));
} finally { await browser.close(); }
