const { createRequire } = require("node:module");
const path = require("node:path");
const backendRequire = createRequire(
  path.resolve("backend-admin/package.json"),
);
const express = backendRequire("express");
const app = express();
app.use(express.static(path.resolve("dist")));
app.get("/{*splat}", (_req, res) =>
  res.sendFile(path.resolve("dist/index.html")),
);
app.listen(8082, "127.0.0.1", () =>
  console.log("Production Web preview: http://localhost:8082"),
);
