import { createUserWithEmailAndPassword, deleteUser } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";
import { normalizeEmail, validate } from "../utils/validation";
import type { ImagePickerAsset } from "expo-image-picker";
import { uploadImage } from "./image";
export async function register(
  email: string,
  hoten: string,
  password: string,
  confirm: string,
  image?: ImagePickerAsset,
) {
  validate(email, hoten, password, confirm);
  const credential = await createUserWithEmailAndPassword(
    auth,
    normalizeEmail(email),
    password,
  );
  try {
    const imageUrl = image ? await uploadImage(image) : "";
    await setDoc(doc(db, "users", credential.user.uid), {
      email: normalizeEmail(email),
      hoten: hoten.trim(),
      matkhau: "AUTH_MANAGED",
      hinhanh: imageUrl,
    });
  } catch (error) {
    try {
      await deleteUser(credential.user);
    } catch {
      throw new Error(
        "Chưa tạo được hồ sơ. Đăng nhập lại để khôi phục hồ sơ; không đăng ký lần nữa.",
      );
    }
    throw error;
  }
  return credential.user;
}
