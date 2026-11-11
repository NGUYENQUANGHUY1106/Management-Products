import { test, expect, Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
const login = JSON.parse(readFileSync('D:/ManagementProduct-Credentials/admin-login.json', 'utf8'));
async function signIn(page: Page) {
  await page.getByLabel('Email', { exact: true }).fill(login.adminEmail);
  await page.getByLabel('Mật khẩu', { exact: true }).fill(login.password);
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/products$/);
}

test('favorites can be added, persisted, searched and removed on desktop/mobile without changing products', async ({ page }) => {
  await page.goto('/admin/favorites');
  await expect(page).toHaveURL(/\/login$/);
  await signIn(page);
  const add = page.getByRole('button', { name: /^Yêu thích / }).first();
  await expect(add).toBeEnabled();
  const name = (await add.getAttribute('aria-label'))!.replace(/^Yêu thích /, '');
  const addByName = page.getByRole('button', { name: `Yêu thích ${name}`, exact: true });
  const remove = page.getByRole('button', { name: `Hủy yêu thích ${name}`, exact: true });
  await page.evaluate(() => {
    const state = window as unknown as { failFavoriteWrite: boolean };
    state.failFavoriteWrite = true;
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) {
      if (key.startsWith('@management-product/favorites/') && state.failFavoriteWrite) throw new Error('Quota exceeded');
      return original.call(this, key, value);
    };
  });
  await addByName.click();
  await expect(page.getByRole('alert')).toContainText('Không lưu được yêu thích');
  await expect(addByName).toHaveAttribute('aria-pressed', 'false');
  await page.evaluate(() => { (window as unknown as { failFavoriteWrite: boolean }).failFavoriteWrite = false; });
  await addByName.click();
  await expect(remove).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Sản phẩm yêu thích', exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/favorites$/);
  await expect(page.getByTestId('product-row')).toHaveCount(1);
  await page.getByLabel('Tìm kiếm tên sản phẩm', { exact: true }).fill('no-match-' + Date.now());
  await expect(page.getByTestId('product-row')).toHaveCount(0);
  await page.getByLabel('Tìm kiếm tên sản phẩm', { exact: true }).fill('');
  await page.reload();
  await expect(remove).toHaveAttribute('aria-pressed', 'true');
  await page.screenshot({ path: 'docs/screenshots/11-favorites-web.png', fullPage: true, animations: 'disabled' });
  const [key, savedIds] = await page.evaluate(() => {
    const key = Object.keys(localStorage).find(k => k.startsWith('@management-product/favorites/'))!;
    return [key, localStorage.getItem(key)!];
  });
  expect(key).toContain('management-product-e97a1');
  if (login.uid) expect(key).toContain(login.uid);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'docs/screenshots/12-favorites-mobile.png', fullPage: true, animations: 'disabled' });
  await remove.click();
  await expect(page.getByText('Chưa có sản phẩm yêu thích', { exact: true })).toBeVisible();
  // A different account's saved IDs on the same device must not leak into this account.
  await page.evaluate(saved => { localStorage.setItem('@management-product/favorites/v1/management-product-e97a1/another-account', saved); }, savedIds);
  await page.reload();
  await expect(page.getByText('Chưa có sản phẩm yêu thích', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Danh sách sản phẩm', exact: true }).click();
  await expect(addByName).toHaveAttribute('aria-pressed', 'false');
  await addByName.click();
  await expect(remove).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Đăng xuất', exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await signIn(page);
  await page.getByRole('button', { name: 'Sản phẩm yêu thích', exact: true }).click();
  await expect(remove).toHaveAttribute('aria-pressed', 'true');
  await remove.click();
  await expect(page.getByTestId('product-row')).toHaveCount(0);
});

test('favorites read failure can be retried without changing product data', async ({ page, context }) => {
  await context.addInitScript(() => {
    const state = window as unknown as { failFavoriteRead: boolean };
    state.failFavoriteRead = true;
    const original = Storage.prototype.getItem;
    Storage.prototype.getItem = function(key) {
      if (key.startsWith('@management-product/favorites/') && state.failFavoriteRead) throw new Error('Storage unavailable');
      return original.call(this, key);
    };
  });
  await page.goto('/login');
  await signIn(page);
  await expect(page.getByRole('alert')).toContainText('Không tải được danh sách yêu thích');
  await page.evaluate(() => { (window as unknown as { failFavoriteRead: boolean }).failFavoriteRead = false; });
  await page.getByRole('button', { name: 'Thử tải lại yêu thích', exact: true }).click();
  await expect(page.getByRole('button', { name: /^Yêu thích / }).first()).toBeEnabled();
  await page.getByRole('button', { name: 'Sản phẩm yêu thích', exact: true }).click();
  await expect(page.getByText('Chưa có sản phẩm yêu thích', { exact: true })).toBeVisible();
});
