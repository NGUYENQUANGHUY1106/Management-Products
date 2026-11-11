import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
// Firebase's web declaration excludes this native-only export; Metro uses the react-native entry.
import {
  connectAuthEmulator,
  // @ts-ignore Firebase exposes this only from its react-native entry.
  getReactNativePersistence,
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
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
export const db = getFirestore(app);
if (isEmulator) {
  connectAuthEmulator(auth, `http://${emulatorHost}:9099`, {
    disableWarnings: true,
  });
  connectFirestoreEmulator(db, emulatorHost, 8080);
}
