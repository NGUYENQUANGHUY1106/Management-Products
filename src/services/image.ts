import type { ImagePickerAsset } from "expo-image-picker";
import { auth } from "../config/firebase";
import { apiBase } from "./api";

export async function uploadImage(asset: ImagePickerAsset): Promise<string> {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("Bạn cần đăng nhập để tải ảnh.");
  const blob = await (await fetch(asset.uri)).blob();
  if (blob.size > 5 * 1024 * 1024) throw new Error("Ảnh tối đa 5 MB.");
  const body = new FormData();
  body.append("image", blob, asset.fileName || "product.jpg");
  const response = await fetch(apiBase + "/images", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body,
    signal: AbortSignal.timeout(45000),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Không tải được ảnh.");
  return data.url;
}
