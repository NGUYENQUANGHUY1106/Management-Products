import { auth } from "../backend-admin/firebase.js";
const uid = process.argv[2];
if (!uid) throw new Error("Usage: node scripts/set-admin-claim.mjs UID");
const u = await auth.getUser(uid);
await auth.setCustomUserClaims(uid, { ...u.customClaims, admin: true });
console.log(
  "Đã cấp claim admin cho UID",
  uid,
  "; đăng nhập lại để nhận token mới.",
);
