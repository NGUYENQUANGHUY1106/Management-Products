import { addDoc, collection, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import { ProductData } from "../types/product";
export function validateProduct(value: ProductData): ProductData {
  const { name, price, soluong, image } = value;
  if (!name.trim() || name.trim().length > 150) throw new Error("Tên sản phẩm phải từ 1 đến 150 ký tự.");
  if (!Number.isFinite(price) || price < 0 || price > 1e12) throw new Error("Giá phải là số từ 0 đến 1.000.000.000.000.");
  if (!Number.isSafeInteger(soluong) || soluong < 0 || soluong > 1e9) throw new Error("Số lượng phải là số nguyên từ 0 đến 1.000.000.000.");
  if (!/^https?:\/\/[^\s]+$/.test(image) || image.length > 2048) throw new Error("Hãy chọn ảnh hoặc nhập URL ảnh HTTP/HTTPS hợp lệ.");
  return { name: name.trim(), price, soluong, image };
}
export async function saveProduct(value: ProductData, id?: string) {
  const data = validateProduct(value);
  if (id) await updateDoc(doc(db, "products", id), data);
  else await addDoc(collection(db, "products"), data);
}
export const removeProduct = (id: string) => deleteDoc(doc(db, "products", id));
