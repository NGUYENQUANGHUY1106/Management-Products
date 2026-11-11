const { readFileSync, writeFileSync } = require("node:fs");
const { spawnSync } = require("node:child_process");
const login = JSON.parse(
  readFileSync("D:/UserHub-Credentials/userhub-login.json", "utf8"),
);
if (login.liveDataMode === 'single-user') throw new Error('Live test writes are disabled after account cleanup. Run the test suite against Firebase Emulator.');
const result = spawnSync(
  process.execPath,
  [require.resolve("@playwright/test/cli"), "test"],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      USERHUB_TEST_PASSWORD: login.password,
      USERHUB_ADMIN_EMAIL: login.adminEmail,
      USERHUB_USER_EMAIL: login.userEmail,
    },
  },
);
writeFileSync(
  "docs/testing/browser-environment.json",
  JSON.stringify(
    {
      date: new Date().toISOString(),
      environment: "Firebase management-user-86623",
      exitCode: result.status,
    },
    null,
    2,
  ),
);
process.exitCode = result.status ?? 1;
