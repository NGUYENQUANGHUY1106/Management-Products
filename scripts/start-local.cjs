const { spawn } = require("node:child_process");
const fs = require("node:fs");
const net = require("node:net");
const children = [];
let stopping = false;
function free(port) {
  return new Promise(resolve => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.listen(port, "0.0.0.0", () => server.close(() => resolve(true)));
  });
}
function stop() {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill();
}
function launch(args, env) {
  const child = spawn(process.execPath, args, { stdio: "inherit", env });
  children.push(child);
  child.on("error", error => { console.error(error.message); stop(); process.exitCode = 1; });
  child.on("exit", code => { if (!stopping && code) { process.exitCode = code; stop(); } });
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
(async () => {
  if (!fs.existsSync(".env") || !fs.existsSync("backend-admin/.env")) throw Error("Configure .env and backend-admin/.env first. See docs/run-project.md.");
  const ip = require("./configure-lan.cjs").configureLan();
  const env = { ...process.env, REACT_NATIVE_PACKAGER_HOSTNAME: ip };
  if (await free(3001)) launch(["--env-file=backend-admin/.env", "backend-admin/server.js"], env);
  else {
    const response = await fetch("http://localhost:3001/health", { signal: AbortSignal.timeout(5000) });
    if (!response.ok || !(await response.json()).ok) throw Error("Port 3001 is used by another application.");
    console.log("Reusing API on port 3001. If Wi-Fi/IP changed, restart its terminal to reload backend-admin/.env.");
  }
  if (await free(8081)) launch(["node_modules/expo/bin/cli", "start", "--web", "--lan", "--go", "--port", "8081"], env);
  else console.log("Port 8081 already running. Reuse its Expo terminal or stop it and restart this command.");
  if (fs.existsSync("dist/index.html") && await free(8082)) launch(["scripts/serve-export.cjs"], env);
  console.log(`Web: http://localhost:8081\nExpo Go: exp://${ip}:8081\nImage API: http://${ip}:3001/health\nBuild preview (if built): http://localhost:8082\nLogin file: D:/ManagementProduct-Credentials/admin-login.json\nPress Ctrl+C to stop services launched here.`);
})().catch(error => { console.error(error.message); process.exitCode = 1; stop(); });
