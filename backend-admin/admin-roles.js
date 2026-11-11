import { auth } from "./firebase.js";

export async function findAccount(identifier) {
  if (typeof identifier !== "string" || !identifier.trim() || identifier.length > 254) {
    throw Object.assign(new Error("Hãy nhập email hoặc UID tài khoản."), { status: 400 });
  }
  const key = identifier.trim();
  try {
    return key.includes("@") ? await auth.getUserByEmail(key.toLowerCase()) : await auth.getUser(key);
  } catch (e) {
    if (e.code === "auth/user-not-found") throw Object.assign(new Error("Tài khoản chưa tồn tại trong Firebase Authentication."), { status: 404 });
    throw e;
  }
}

export async function setAdminRole(identifier, enabled, callerUid) {
  if (typeof enabled !== "boolean") throw Object.assign(new Error("Quyền admin phải là true hoặc false."), { status: 400 });
  const user = await findAccount(identifier);
  if (!enabled && user.uid === callerUid) throw Object.assign(new Error("Không thể tự thu hồi quyền admin đang sử dụng."), { status: 409 });
  if (enabled && user.disabled) throw Object.assign(new Error("Tài khoản đang bị vô hiệu hóa."), { status: 409 });
  const claims = { ...user.customClaims };
  if (enabled) claims.admin = true;
  else delete claims.admin;
  await auth.setCustomUserClaims(user.uid, claims);
  if (!enabled) await auth.revokeRefreshTokens(user.uid);
  return { uid: user.uid, email: user.email || "", admin: enabled };
}
