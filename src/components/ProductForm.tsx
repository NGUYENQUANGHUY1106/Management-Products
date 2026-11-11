import React, { useState } from "react";
import { Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Product } from "../types/product";
import { saveProduct } from "../services/products";
import { uploadImage } from "../services/image";
import { errorMessage } from "../utils/validation";
import { ErrorBox, Field } from "./ui";
import { Action, adminStyles as s, ModalFrame, palette as c, ProductImage } from "./admin-ui";

export function ProductForm({ product, onDone }: { product?: Product; onDone: (saved?: boolean) => void }) {
  const [name, setName] = useState(product?.name || "");
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const [quantity, setQuantity] = useState(product ? String(product.soluong) : "");
  const [image, setImage] = useState(product?.image || "");
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  async function choose() {
    setBusy(true); setError("");
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, quality: 0.85 });
      if (!result.canceled) {
        const url = await uploadImage(result.assets[0]);
        setImage(url); setFileName(result.assets[0].fileName || "Ảnh sản phẩm đã tải lên");
      }
    } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
  }
  async function submit() {
    setBusy(true); setError("");
    try {
      if (!price.trim() || !quantity.trim()) throw new Error("Hãy nhập giá và số lượng.");
      await saveProduct({ name, price: Number(price), soluong: Number(quantity), image }, product?.id);
      onDone(true);
    } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
  }
  function close() { if (!busy) onDone(); }
  return <ModalFrame title={product ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"} onClose={close}>
    <View style={{ padding: 23, gap: 7, borderBottomWidth: 1, borderColor: c.line }}>
      <View style={[s.row, { justifyContent: "space-between" }]}>
        <Text style={{ color: c.teal, fontSize: 10, fontWeight: "700", letterSpacing: 1 }}>{product ? "✎  BIỂU MẪU CẬP NHẬT" : "＋  SẢN PHẨM MỚI"}</Text>
        <Action title="×" label="Đóng biểu mẫu" variant="ghost" small disabled={busy} onPress={close} />
      </View>
      <Text style={{ fontSize: 21, fontWeight: "700", color: c.ink }}>{product ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}</Text>
      <Text style={s.muted}>{product ? "Cập nhật thông tin chi tiết cho sản phẩm đã chọn." : "Nhập thông tin sản phẩm mới vào hệ thống kho."}</Text>
    </View>
    <View style={{ padding: 23, gap: 19 }}>
      <Field label="Tên sản phẩm" value={name} onChangeText={setName} maxLength={150} editable={!busy} autoFocus placeholder="Nhập tên sản phẩm (vd: Chuột không dây...)" />
      <View style={[s.row, { alignItems: "flex-start" }]}>
        <View style={{ flex: 1, minWidth: 130 }}><Field label="Giá sản phẩm (VNĐ)" value={price} onChangeText={setPrice} keyboardType="decimal-pad" editable={!busy} placeholder="Nhập giá bán" /></View>
        <View style={{ flex: 1, minWidth: 110 }}><Field label="Số lượng" value={quantity} onChangeText={setQuantity} keyboardType="number-pad" editable={!busy} placeholder="Nhập số lượng tồn kho" /></View>
      </View>
      <View style={{ gap: 10 }}>
        <View style={[s.row, { justifyContent: "space-between" }]}><Text style={s.label}>Hình ảnh sản phẩm <Text style={{ color: c.red }}>*</Text></Text><Text style={[s.muted, { fontSize: 11 }]}>PNG, JPG, WEBP · tối đa 5 MB</Text></View>
        <Action variant="outline" icon="↥" title={image ? "Thay đổi ảnh" : "Chọn ảnh từ máy tính"} label="Chọn ảnh sản phẩm" busy={busy} onPress={() => { void choose(); }} />
        <Field label="URL hình ảnh" value={image} onChangeText={value => { setImage(value); setFileName(""); }} placeholder="Hoặc dán URL ảnh trực tiếp..." autoCapitalize="none" editable={!busy} />
        <View style={[s.row, s.border, { padding: 12, backgroundColor: c.background, alignItems: "center" }]}>
          <ProductImage uri={image} name="xem trước" size={78} />
          <View style={{ flex: 1, gap: 5 }}><Text style={[s.label, { fontSize: 12 }]} numberOfLines={2}>{fileName || (image ? "Ảnh sản phẩm đã chọn" : "Chưa có ảnh nào được chọn")}</Text><Text style={[s.muted, { fontSize: 11 }]}>{image ? "Ảnh sẽ được hiển thị trong danh sách sản phẩm." : "Khung xem trước sẽ hiển thị ngay khi chọn hoặc dán liên kết."}</Text>
            {!!image && <Action title="Gỡ ảnh" variant="ghost" small disabled={busy} onPress={() => { setImage(""); setFileName(""); }} />}
          </View>
        </View>
      </View>
      <ErrorBox message={error} />
      <View style={s.divider} />
      <View style={[s.row, { justifyContent: "flex-end" }]}>
        <Action variant="outline" title="Hủy" disabled={busy} onPress={close} />
        <Action icon={product ? "▣" : "＋"} title={product ? "Lưu thay đổi" : "Thêm sản phẩm"} label="Lưu sản phẩm" busy={busy} onPress={() => { void submit(); }} />
      </View>
    </View>
  </ModalFrame>;
}
