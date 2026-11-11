import { chromium } from "@playwright/test";
import { mkdir, writeFile, readFile } from "node:fs/promises";
const credentials=JSON.parse(await readFile("D:/UserHub-Credentials/userhub-login.json","utf8"));
await mkdir("docs/screenshots", { recursive: true });
await mkdir("docs/video", { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  recordVideo: { dir: "docs/video", size: { width: 1440, height: 1000 } },
});
const page = await context.newPage();
page.setDefaultNavigationTimeout(90000);
page.setDefaultTimeout(30000);
await page.goto("http://localhost:8082/login");
await page.getByRole("button", { name: "Đăng nhập", exact: true }).waitFor();
await page.screenshot({
  path: "docs/screenshots/00-login-web.png",
  fullPage: true,
});
await page
  .getByRole("textbox", { name: "Email", exact: true })
  .fill(credentials.adminEmail);
await page.getByLabel("Mật khẩu", { exact: true }).fill(credentials.password);
await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
await page.waitForURL("**/admin/dashboard");
await page
  .getByRole("button", { name: "Mở danh sách người dùng", exact: true })
  .click();
await page.getByTestId("user-row").first().waitFor();
await page
  .getByRole("textbox", { name: "Tìm kiếm họ tên hoặc email" })
  .fill(credentials.userEmail);
await page.getByTestId("user-row").first().waitFor();
await page
  .getByRole("textbox", { name: "Tìm kiếm họ tên hoặc email" })
  .fill("");
await page.getByRole("button", { name: "Sắp xếp: A–Z", exact: true }).click();
await page.getByRole("button", { name: "Trang sau", exact: true }).click();
await page.getByRole("button", { name: "Đăng xuất", exact: true }).click();
await page.waitForURL("**/login");
await page
  .getByRole("textbox", { name: "Email", exact: true })
  .fill(credentials.userEmail);
await page.getByLabel("Mật khẩu", { exact: true }).fill(credentials.password);
await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
await page.waitForURL("**/user/profile");
await page
  .getByRole("button", { name: "Chỉnh sửa hồ sơ", exact: true })
  .click();
await page.getByRole("textbox", { name: "Họ và tên", exact: true }).waitFor();
await page.screenshot({
  path: "docs/screenshots/10-edit-profile-web.png",
  fullPage: true,
});
await page.goto(new URL('../docs/database/auth-evidence.html', import.meta.url).href);
await page.screenshot({path:'docs/screenshots/11-auth-firebase.png',fullPage:true});
await page.goto(new URL('../docs/database/firestore-evidence.html', import.meta.url).href);
await page.screenshot({path:'docs/screenshots/12-firestore-firebase.png',fullPage:true});
const video = page.video();
await context.close();
if (video) await video.saveAs("docs/video/UserHub_Web_Firebase.webm");
await browser.close();
await writeFile(
  "docs/video/README.txt",
  "Actual browser recording of UserHub with real Firebase management-user-86623. This short Web recording does not replace the required 3-6 minute narrated video with physical Expo Go evidence. See docs/demo-script.md.\n",
);
