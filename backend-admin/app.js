import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import multer from "multer";
import sharp from "sharp";
import { randomUUID, createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { auth, emulator } from "./firebase.js";
import { setAdminRole } from "./admin-roles.js";
export const app = express();
app.disable("x-powered-by");
const origins = (
  process.env.ALLOWED_ORIGINS || "http://localhost:8081,http://localhost:19006"
).split(",");
app.use(
  cors({
    origin(origin, cb) {
      cb(null, !origin || origins.includes(origin));
    },
  }),
);
app.use(express.json({ limit: "20kb" }));
app.use(rateLimit({ windowMs: 60000, limit: 120 }));
app.get("/health", (_req, res) =>
  res.json({ ok: true, mode: emulator ? "emulator" : "firebase" }),
);
const uploads = path.resolve("backend-admin/uploads");
if (emulator || process.env.ALLOW_LOCAL_UPLOADS === "true")
  app.use(
    "/uploads",
    express.static(uploads, { immutable: true, maxAge: "1d" }),
  );
async function signedIn(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    if (!header.startsWith("Bearer "))
      return res.status(401).json({ error: "Bạn cần đăng nhập." });
    req.identity = await auth.verifyIdToken(header.slice(7), true);
    next();
  } catch {
    res
      .status(401)
      .json({ error: "Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại." });
  }
}
async function admin(req, res, next) {
  try {
    const account = await auth.getUser(req.identity.uid);
    if (req.identity.admin !== true || account.customClaims?.admin !== true || account.disabled)
    return res.status(403).json({ error: "Chỉ Admin được phép thực hiện." });
    next();
  } catch (e) { next(e); }
}
app.patch("/admin/roles", signedIn, admin, async (req, res) => {
  const result = await setAdminRole(req.body?.identifier, req.body?.admin, req.identity.uid);
  res.json(result);
});
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});
app.post("/images", signedIn, admin, upload.single("image"), async (req, res) => {
  if (!req.file)
    return res.status(400).json({ error: "Hãy chọn ảnh JPEG, PNG hoặc WebP." });
  let buffer;
  try {
    const s = sharp(req.file.buffer, { limitInputPixels: 25000000 });
    const meta = await s.metadata();
    if (!["jpeg", "png", "webp", "heif"].includes(meta.format)) throw Error();
    buffer = await s
      .rotate()
      .resize(800, 800, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();
  } catch {
    return res.status(400).json({ error: "Ảnh không hợp lệ hoặc quá lớn." });
  }
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  if (cloud) {
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = "management-product";
    const signature = createHash("sha1")
      .update(
        `folder=${folder}&timestamp=${timestamp}${process.env.CLOUDINARY_API_SECRET}`,
      )
      .digest("hex");
    const form = new FormData();
    form.set("file", new Blob([buffer], { type: "image/jpeg" }), "product.jpg");
    form.set("api_key", process.env.CLOUDINARY_API_KEY);
    form.set("timestamp", String(timestamp));
    form.set("folder", folder);
    form.set("signature", signature);
    const r = await fetch(
      `https://api.cloudinary.com/v1_1/${cloud}/image/upload`,
      { method: "POST", body: form, signal: AbortSignal.timeout(30000) },
    );
    const data = await r.json();
    if (!r.ok)
      return res
        .status(502)
        .json({ error: "Dịch vụ ảnh chưa sẵn sàng. Vui lòng thử lại." });
    return res.json({ url: data.secure_url });
  }
  if (!emulator && process.env.ALLOW_LOCAL_UPLOADS !== "true")
    return res
      .status(503)
      .json({ error: "Chưa cấu hình dịch vụ ảnh trên backend." });
  await mkdir(uploads, { recursive: true });
  const name = randomUUID() + ".jpg";
  await writeFile(path.join(uploads, name), buffer);
  const base = process.env.PUBLIC_API_URL || "http://localhost:3001";
  res.status(201).json({ url: `${base}/uploads/${name}` });
});
app.use((err, _req, res, _next) => {
  const duplicate = err.code === "auth/email-already-exists";
  const status =
    err.status ||
    (duplicate
      ? 409
      : err.code?.startsWith("auth/invalid")
        ? 400
        : err.code === "LIMIT_FILE_SIZE"
          ? 413
          : 500);
  res
    .status(status)
    .json({
      error: duplicate
        ? "Email đã được sử dụng."
        : status === 413
          ? "Ảnh tối đa 5 MB."
          : status < 500
            ? err.message
            : "Thao tác chưa hoàn tất. Hãy thử lại; liên hệ Admin nếu lỗi kéo dài.",
    });
});
