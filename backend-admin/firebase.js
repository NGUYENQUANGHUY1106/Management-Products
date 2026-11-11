import "dotenv/config";
import { initializeApp, applicationDefault, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
const emulator = !!process.env.FIREBASE_AUTH_EMULATOR_HOST;
if (
  emulator &&
  (!process.env.FIRESTORE_EMULATOR_HOST ||
    !(process.env.GCLOUD_PROJECT || "").startsWith("demo-"))
)
  throw new Error("Emulator phải dùng cả Auth/Firestore và project demo-.");
const app =
  getApps()[0] ||
  initializeApp(
    emulator
      ? { projectId: process.env.GCLOUD_PROJECT }
      : {
          credential: applicationDefault(),
          projectId: process.env.FIREBASE_PROJECT_ID || "management-product-e97a1",
        },
  );
export const auth = getAuth(app);
export const db = getFirestore(app);
export { emulator };
