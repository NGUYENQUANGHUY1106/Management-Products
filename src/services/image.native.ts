import type { ImagePickerAsset } from "expo-image-picker";
import { File } from "expo-file-system";
import { fetch as expoFetch } from "expo/fetch";
import { auth } from "../config/firebase";
import { apiBase } from "./api";

export async function uploadImage(asset: ImagePickerAsset): Promise<string> {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("Bạn cần đăng nhập để tải ảnh.");
  // Expo SDK 58 serializes Blob/File parts with bytes(), not legacy { uri } records.
  const file = new File(asset.uri);
  if (file.size > 5 * 1024 * 1024) throw new Error("Ảnh tối đa 5 MB.");
  const body = new FormData();
  body.append("image", file);
  const response = await expoFetch(apiBase + "/images", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body,
    signal: AbortSignal.timeout(45000),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Không tải được ảnh.");
  return data.url;
}
