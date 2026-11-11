import { emulator } from "../backend-admin/firebase.js";
import { setAdminRole } from "../backend-admin/admin-roles.js";
const [identifier, mode = "grant", ...extra] = process.argv.slice(2);
if (!identifier || extra.length || !["grant", "revoke"].includes(mode)) throw new Error("Usage: npm run admin:role -- EMAIL_OR_UID [grant|revoke]");
if (!emulator && process.env.FIREBASE_PROJECT_ID !== "management-product-e97a1") throw new Error("Expected management-product-e97a1.");
const result = await setAdminRole(identifier, mode === "grant");
console.log(JSON.stringify(result));
console.log(result.admin ? "Đăng xuất rồi đăng nhập lại để nhận quyền admin." : "Đã thu hồi claim và phiên làm mới. ID token Firestore hiện có có thể còn hiệu lực tối đa khoảng 1 giờ.");
