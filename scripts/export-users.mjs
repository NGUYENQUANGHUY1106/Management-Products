import { db } from "../backend-admin/firebase.js";
import { mkdir, writeFile } from "node:fs/promises";
const docs = await db.collection("users").get();
const result = {};
for (const d of docs.docs) {
  const p = d.data();
  if (
    Object.keys(p).sort().join(",") !== "email,hinhanh,hoten,matkhau" ||
    p.matkhau !== "AUTH_MANAGED"
  )
    throw Error("Invalid request. Please check your data or retry." + d.id);
  result[d.id] = p;
}
await mkdir("docs/database", { recursive: true });
await writeFile("docs/database/users.json", JSON.stringify(result, null, 2));
console.log("Exported", docs.size, "profiles");
