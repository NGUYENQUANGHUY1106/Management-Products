import { mkdir, writeFile } from "node:fs/promises";
if (
  process.env.GCLOUD_PROJECT !== "demo-userhub" ||
  !process.env.FIREBASE_AUTH_EMULATOR_HOST ||
  !process.env.FIRESTORE_EMULATOR_HOST
)
  throw Error("Seed is restricted to demo-userhub Emulator.");
const { auth, db } = await import("../backend-admin/firebase.js");
const password = "EmulatorOnly!42";
async function account(email, name, admin = false) {
  let user;
  try {
    user = await auth.getUserByEmail(email);
  } catch (e) {
    if (e.code !== "auth/user-not-found") throw e;
    user = await auth.createUser({ email, password, displayName: name });
  }
  if (admin) {
    await auth.setCustomUserClaims(user.uid, { admin: true });
    return;
  }
  await db
    .doc(`users/${user.uid}`)
    .set({ email, hoten: name, hinhanh: "", matkhau: "AUTH_MANAGED" });
}
await account("admin@userhub.test", "UserHub Admin", true);
for (const [i, name] of [
  "Nguyễn Quang Huy",
  "Trần Bảo An",
  "Lê Minh Anh",
  "Phạm Hoàng Nam",
  "Đỗ Ngọc Hà",
  "Vũ Thanh Tâm",
  "Bùi Khánh Linh",
  "Hoàng Gia Bảo",
  "Phan Thùy Dương",
  "Đặng Đức Minh",
  "Mai Phương Thảo",
  "Ngô Hải Yến",
].entries())
  await account(`member${i + 1}@userhub.test`, name);
await mkdir("docs/database", { recursive: true });
const snap = await db.collection("users").get();
await writeFile(
  "docs/database/users.emulator.json",
  JSON.stringify(
    Object.fromEntries(snap.docs.map((d) => [d.id, d.data()])),
    null,
    2,
  ),
);
console.log(
  "Emulator seeded. Login admin@userhub.test or member1@userhub.test; demo-only password in README.",
);
