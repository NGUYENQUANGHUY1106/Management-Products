import { test, expect, Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
const password = process.env.USERHUB_TEST_PASSWORD || "EmulatorOnly!42";
const adminEmail = process.env.USERHUB_ADMIN_EMAIL || "admin@userhub.test";
const userEmail = process.env.USERHUB_USER_EMAIL || "member1@userhub.test";
const stamp = Date.now();
const email = `browser-${stamp}@userhub.test`;
async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByRole("textbox", { name: "Email", exact: true }).fill(email);
  await page.getByLabel("Mật khẩu", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
}
async function shot(page: Page, name: string) {
  await mkdir("docs/screenshots", { recursive: true });
  await page.screenshot({
    path: `docs/screenshots/${name}.png`,
    fullPage: true,
  });
}
test("TC-U01/U02/U03/U04/U05/U07/U08: User lifecycle and protected routes", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error" && m.text().includes("Unexpected text node"))
      errors.push(m.text());
  });
  await page.goto("/register");
  await expect(
    page.getByRole("button", { name: "Tạo tài khoản", exact: true }),
  ).toBeVisible();
  await shot(page, "01-register-web");
  await page
    .getByRole("textbox", { name: "Họ và tên", exact: true })
    .fill("Người dùng kiểm thử");
  await page.getByRole("textbox", { name: "Email", exact: true }).fill(email);
  await page.getByLabel("Mật khẩu", { exact: true }).fill(password);
  await page.getByLabel("Xác nhận mật khẩu", { exact: true }).fill(password);
  await page
    .getByRole("button", { name: "Tạo tài khoản", exact: true })
    .click();
  await expect(page).toHaveURL(/\/user\/profile/);
  await page
    .getByRole("button", { name: "Chỉnh sửa hồ sơ", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Họ và tên", exact: true })
    .fill("Tên đã cập nhật");
  await expect(
    page.getByRole("textbox", { name: "Email (chỉ đọc)", exact: true }),
  ).not.toBeEditable();
  await page.getByRole("button", { name: "Lưu thay đổi", exact: true }).click();
  await expect(page.getByText("Đã lưu hồ sơ thành công.")).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("textbox", { name: "Họ và tên", exact: true }),
  ).toHaveValue("Tên đã cập nhật");
  await page.goto("/admin/users");
  await expect(page).toHaveURL(/\/user\/profile/);
  await shot(page, "02-user-profile-web");
  await page.getByRole("button", { name: "Đăng xuất", exact: true }).click();
  await expect(page).toHaveURL(/\/login/);
  await page.goto("/admin/users");
  await expect(page).toHaveURL(/\/login/);
  await page.reload();
  await expect(page).toHaveURL(/\/login/);
  await page.getByRole("textbox", { name: "Email", exact: true }).fill(email);
  await page.getByLabel("Mật khẩu", { exact: true }).fill("WrongPassword!");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  await page.getByLabel("Mật khẩu", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(/\/user\/profile/);
  await page.getByRole("button", { name: "Đăng xuất", exact: true }).click();
  await page.goto("/register");
  await page
    .getByRole("textbox", { name: "Họ và tên", exact: true })
    .fill("Duplicate User");
  await page.getByRole("textbox", { name: "Email", exact: true }).fill(email);
  await page.getByLabel("Mật khẩu", { exact: true }).fill(password);
  await page.getByLabel("Xác nhận mật khẩu", { exact: true }).fill(password);
  await page
    .getByRole("button", { name: "Tạo tài khoản", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("Email đã được sử dụng");
  expect(errors).toEqual([]);
});
test("TC-A01/A02/A03/A04/A05/A06/A07: Admin create edit search sort pagination cancel and delete", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error" && m.text().includes("Unexpected text node"))
      errors.push(m.text());
  });
  await login(page, adminEmail);
  await expect(page).toHaveURL(/\/admin\/dashboard/);
  await shot(page, "03-admin-dashboard");
  await page
    .getByRole("button", { name: "Mở danh sách người dùng", exact: true })
    .click();
  await expect(page.getByTestId("user-row")).toHaveCount(5);
  await shot(page, "04-admin-directory");
  const firstPage = await page.getByTestId("user-row").allTextContents();
  await page.getByRole("button", { name: "Trang sau", exact: true }).click();
  const secondPage = await page.getByTestId("user-row").allTextContents();
  expect(firstPage.some((x) => secondPage.includes(x))).toBe(false);
  await page
    .getByRole("button", { name: "5 bản ghi/trang", exact: true })
    .click();
  await expect(page.getByTestId("user-row")).toHaveCount(10);
  const ascending = await page.getByTestId("user-row").allTextContents();
  await page.getByRole("button", { name: "Sắp xếp: A–Z", exact: true }).click();
  expect(await page.getByTestId("user-row").allTextContents()).not.toEqual(
    ascending,
  );
  await page
    .getByRole("textbox", { name: "Tìm kiếm họ tên hoặc email" })
    .fill(userEmail.toUpperCase());
  await expect(page.getByTestId("user-row")).toHaveCount(1);
  await page
    .getByRole("textbox", { name: "Tìm kiếm họ tên hoặc email" })
    .fill("no-results-xyz");
  await expect(page.getByText("Không có kết quả phù hợp")).toBeVisible();
  await page
    .getByRole("button", { name: "Thêm người dùng", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Họ và tên", exact: true })
    .fill("Admin Created Browser");
  await page
    .getByRole("textbox", { name: "Email", exact: true })
    .fill(`created-${stamp}@userhub.test`);
  await page.getByLabel("Mật khẩu khởi tạo", { exact: true }).fill(password);
  await page
    .getByRole("button", { name: "Tạo tài khoản User", exact: true })
    .click();
  await expect(
    page.getByText("Admin Created Browser", { exact: true }),
  ).toBeVisible();
  await shot(page, "05-admin-user-detail");
  await page
    .getByRole("button", { name: "Chỉnh sửa người dùng", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Họ và tên", exact: true })
    .fill("Admin Edited Browser");
  await page
    .getByRole("textbox", { name: "Email", exact: true })
    .fill(`edited-${stamp}@userhub.test`);
  await page.getByRole("button", { name: "Lưu thay đổi", exact: true }).click();
  await expect(
    page.getByText("Admin Edited Browser", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Xóa tài khoản", exact: true })
    .click();
  await expect(
    page.getByText("Xóa tài khoản này?", { exact: true }),
  ).toBeVisible();
  await shot(page, "06-confirm-delete");
  await page.getByRole("button", { name: "Hủy xóa", exact: true }).click();
  await expect(
    page.getByText("Xóa tài khoản này?", { exact: true }),
  ).not.toBeVisible();
  await page.reload();
  await expect(
    page.getByText("Admin Edited Browser", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Xóa tài khoản", exact: true })
    .click();
  await page.getByRole("button", { name: "Xác nhận xóa", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/users$/);
  await page.getByRole("button", { name: "Đăng xuất", exact: true }).click();
  await page.goto("/admin/users");
  await expect(page).toHaveURL(/\/login/);
  expect(errors).toEqual([]);
});
test("TC-U06-WEB: choose image upload save and reload", async ({ page }) => {
  await login(page, userEmail);
  await expect(page).toHaveURL(/\/user\/profile/);
  await page
    .getByRole("button", { name: "Chỉnh sửa hồ sơ", exact: true })
    .click();
  const chooserPromise = page.waitForEvent("filechooser");
  await page
    .getByRole("button", { name: "Chọn ảnh đại diện", exact: true })
    .click();
  const chooser = await chooserPromise;
  await chooser.setFiles("tests/fixtures/avatar.png");
  await expect(
    page.getByText("Đang tải ảnh…", { exact: true }),
  ).not.toBeVisible();
  await page.getByRole("button", { name: "Lưu thay đổi", exact: true }).click();
  await expect(page.getByText("Đã lưu hồ sơ thành công.")).toBeVisible();
  await page.reload();
  await expect(page.getByRole("img", { name: /Ảnh đại diện/ })).toBeVisible();
  await shot(page, "07-avatar-upload-web");
});
test("TC-RESP: mobile-sized Web profile and directory (not Expo Go)", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page, userEmail);
  await expect(page).toHaveURL(/\/user\/profile/);
  await shot(page, "08-profile-mobile-web");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Đăng xuất", exact: true }).click();
  await login(page, adminEmail);
  await page
    .getByRole("button", { name: "Mở danh sách người dùng", exact: true })
    .click();
  await expect(page.getByTestId("user-row")).toHaveCount(5);
  await shot(page, "09-directory-mobile-web");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
test("TC-ERROR: network error and retry", async ({ page }) => {
  await login(page, adminEmail);
  await expect(page).toHaveURL(/\/admin\/dashboard/);
  await page.route("**/admin/users", (route) => route.abort());
  await page
    .getByRole("button", { name: "Mở danh sách người dùng", exact: true })
    .click();
  await expect(page.getByRole("alert")).toBeVisible();
  await page.unroute("**/admin/users");
  await page.getByRole("button", { name: "Tải lại", exact: true }).click();
  await expect(page.getByTestId("user-row")).toHaveCount(5);
});
