import { getApp, getApps, initializeApp } from "firebase/app";
import {
  browserLocalPersistence,
  connectAuthEmulator,
  initializeAuth,
} from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";

export const isEmulator = process.env.EXPO_PUBLIC_USE_EMULATORS === "true";
export const emulatorHost =
  process.env.EXPO_PUBLIC_EMULATOR_HOST || "localhost";
const app = getApps().length
  ? getApp()
  : initializeApp({
      apiKey: isEmulator
        ? "demo-api-key"
        : process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: isEmulator
        ? "demo-management-product"
        : process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
      appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    });
// Email/password only: omit popup/redirect dependencies and their hidden auth iframe.
export const auth = initializeAuth(app, {
  persistence: browserLocalPersistence,
});
export const db = getFirestore(app);
if (isEmulator) {
  connectAuthEmulator(auth, `http://${emulatorHost}:9099`, {
    disableWarnings: true,
  });
  connectFirestoreEmulator(db, emulatorHost, 8080);
}
