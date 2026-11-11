const fs = require("node:fs");
const os = require("node:os");
function configureLan() {
  const interfaces = Object.entries(os.networkInterfaces());
  const preferred = interfaces.filter(([name]) => /wi-?fi|wlan/i.test(name));
  const fallback = interfaces.filter(
    ([name]) =>
      /ethernet/i.test(name) && !/virtual|zerotier|ethernet \d/i.test(name),
  );
  const ip =
    [...preferred, ...fallback]
      .flatMap(([, rows]) => rows || [])
      .find((r) => r.family === "IPv4" && !r.internal)?.address || "localhost";
  function update(file, values) {
    if (!fs.existsSync(file)) return;
    let text = fs.readFileSync(file, "utf8");
    for (const [key, value] of Object.entries(values)) {
      const re = new RegExp("^" + key + "=.*$", "m");
      text = re.test(text)
        ? text.replace(re, key + "=" + value)
        : text.trimEnd() + "\n" + key + "=" + value + "\n";
    }
    fs.writeFileSync(file, text);
  }
  update(".env", { EXPO_PUBLIC_ADMIN_API_BASE_URL: `http://${ip}:3001` });
  update("backend-admin/.env", {
    PUBLIC_API_URL: `http://${ip}:3001`,
    ALLOWED_ORIGINS: `http://localhost:8081,http://localhost:8082,http://${ip}:8081,http://${ip}:8082`,
  });
  return ip;
}
module.exports = { configureLan };
if (require.main === module) console.log("LAN configured:", configureLan());
