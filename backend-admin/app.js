import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import multer from "multer";
import sharp from "sharp";
import { randomUUID, createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { auth, db, emulator } from "./firebase.js";
import validation from "../shared/validation.cjs";
const { validateProfile } = validation;
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
function admin(req, res, next) {
  if (req.identity.admin !== true)
    return res.status(403).json({ error: "Chỉ Admin được phép thực hiện." });
  next();
}
app.use("/admin", signedIn, admin);
const locks = new Set();
async function locked(uid, fn) {
  if (locks.has(uid)) {
    const e = new Error("Tài khoản đang được xử lý. Hãy thử lại.");
    e.status = 409;
    throw e;
  }
  locks.add(uid);
  try {
    return await fn();
  } finally {
    locks.delete(uid);
  }
}
async function editable(uid, caller) {
  if (uid === caller) {
    const e = new Error("Không được thay đổi tài khoản Admin của bạn.");
    e.status = 403;
    throw e;
  }
  try {
    const u = await auth.getUser(uid);
    if (u.customClaims?.admin) {
      const e = new Error("Không được thay đổi tài khoản Admin.");
      e.status = 403;
      throw e;
    }
    return u;
  } catch (e) {
    if (e.code === "auth/user-not-found") return null;
    throw e;
  }
}
app.get("/admin/users", async (_req, res) => {
  const s = await db.collection("users").get();
  res.json(s.docs.map((d) => ({ uid: d.id, ...d.data() })));
});
app.post("/admin/users", async (req, res) => {
  let profile;
  try {
    profile = validateProfile(req.body, { password: true });
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
  const u = await auth.createUser({
    email: profile.email,
    password: req.body.password,
    displayName: profile.hoten,
  });
  try {
    await db
      .doc(`users/${u.uid}`)
      .create({ ...profile, matkhau: "AUTH_MANAGED" });
  } catch (e) {
    try {
      await auth.deleteUser(u.uid);
    } catch {
      console.error("RECONCILE_CREATE", u.uid);
    }
    throw e;
  }
  res.status(201).json({ uid: u.uid, ...profile });
});
app.patch("/admin/users/:uid", async (req, res) =>
  locked(req.params.uid, async () => {
    let profile;
    try {
      profile = validateProfile(req.body);
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }
    const old = await editable(req.params.uid, req.identity.uid);
    if (!old || !(await db.doc(`users/${old.uid}`).get()).exists)
      return res
        .status(404)
        .json({ error: "Tài khoản hoặc hồ sơ không tồn tại." });
    await auth.updateUser(old.uid, {
      email: profile.email,
      displayName: profile.hoten,
    });
    try {
      await db
        .doc(`users/${old.uid}`)
        .set({ ...profile, matkhau: "AUTH_MANAGED" });
    } catch (e) {
      try {
        await auth.updateUser(old.uid, {
          email: old.email,
          displayName: old.displayName || "",
        });
      } catch {
        console.error("RECONCILE_UPDATE", old.uid);
      }
      throw e;
    }
    res.json({ uid: old.uid, ...profile });
  }),
);
app.delete("/admin/users/:uid", async (req, res) =>
  locked(req.params.uid, async () => {
    const u = await editable(req.params.uid, req.identity.uid);
    // Idempotent retry: if Auth already deleted, finish deleting the remaining profile.
    if (u) {
      await auth.revokeRefreshTokens(u.uid);
      await auth.deleteUser(u.uid);
    }
    await db.doc(`users/${req.params.uid}`).delete();
    res.status(204).end();
  }),
);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});
app.post("/images", signedIn, upload.single("image"), async (req, res) => {
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
    const folder = "userhub";
    const signature = createHash("sha1")
      .update(
        `folder=${folder}&timestamp=${timestamp}${process.env.CLOUDINARY_API_SECRET}`,
      )
      .digest("hex");
    const form = new FormData();
    form.set("file", new Blob([buffer], { type: "image/jpeg" }), "avatar.jpg");
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
