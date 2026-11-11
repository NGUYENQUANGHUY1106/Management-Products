const { spawn } = require("node:child_process");
const fs = require("node:fs");
if (!fs.existsSync("backend-admin/.env")) {
  console.error("Configure backend-admin/.env first. See README.");
  process.exit(1);
}
const ip = require("./configure-lan.cjs").configureLan();
const env = { ...process.env, REACT_NATIVE_PACKAGER_HOSTNAME: ip };
const backend = spawn(
  process.execPath,
  ["--env-file=backend-admin/.env", "backend-admin/server.js"],
  { stdio: "inherit", env },
);
const frontend = spawn(
  process.execPath,
  ["node_modules/expo/bin/cli", "start", "--web", "--lan", "--port", "8081"],
  { stdio: "inherit", env },
);
const preview = fs.existsSync("dist/index.html")
  ? spawn(process.execPath, ["scripts/serve-export.cjs"], {
      stdio: "inherit",
      env,
    })
  : null;
console.log(
  "UserHub Web: http://localhost:8082 (production build), Expo Go: port 8081. Ctrl+C to stop. Login details: D:/UserHub-Credentials/userhub-login.json",
);
function stop() {
  backend.kill();
  frontend.kill();
  preview?.kill();
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
backend.on("error", stop);
frontend.on("error", stop);
