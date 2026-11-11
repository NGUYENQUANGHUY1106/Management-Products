import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import { getDoc, doc } from "firebase/firestore";
import { db } from "../config/firebase";
import { api } from "../services/api";
import { normalizeEmail, validate, errorMessage } from "../utils/validation";
import { Shell } from "./Shell";
import { Button, ErrorBox, Field, Loading, styles } from "./ui";
import { AvatarPicker } from "./AvatarPicker";
export function AdminUserForm({ uid }: { uid?: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [image, setImage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(!!uid);
  const [found, setFound] = useState(!uid);
  useEffect(() => {
    if (uid) {
      getDoc(doc(db, "users", uid))
        .then((s) => {
          if (!s.exists()) throw new Error("Không tìm thấy hồ sơ.");
          const d = s.data();
          setName(d.hoten);
          setEmail(d.email);
          setImage(d.hinhanh);
          setFound(true);
        })
        .catch((e) => setError(errorMessage(e)))
        .finally(() => setLoading(false));
    }
  }, [uid]);
  async function save() {
    if (busy || uploading) return;
    setError("");
    setBusy(true);
    try {
      validate(email, name, uid ? undefined : password);
      const body = {
        email: normalizeEmail(email),
        hoten: name.trim(),
        hinhanh: image,
        ...(!uid ? { password } : {}),
      };
      const result = await api<{ uid: string }>(
        uid ? `/admin/users/${uid}` : "/admin/users",
        uid ? "PATCH" : "POST",
        body,
      );
      setPassword("");
      router.replace(`/admin/users/${result.uid}`);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Shell
      title={uid ? "Chỉnh sửa người dùng" : "Thêm người dùng"}
      subtitle={
        uid
          ? "Cập nhật hồ sơ và email đăng nhập của thành viên."
          : "Tạo tài khoản đăng nhập và hồ sơ cho một thành viên mới."
      }
    >
      {loading ? (
        <Loading />
      ) : (
        <View style={[styles.card, { maxWidth: 760 }]}>
          <ErrorBox message={error} />
          {found && (
            <>
              <AvatarPicker
                name={name}
                value={image}
                onChange={setImage}
                onBusy={setUploading}
              />
              <Field
                label="Họ và tên"
                value={name}
                onChangeText={setName}
                maxLength={100}
              />
              <Field
                label="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {!uid && (
                <Field
                  label="Mật khẩu khởi tạo"
                  secret
                  value={password}
                  onChangeText={setPassword}
                />
              )}
              <Text style={styles.subtitle}>
                {uid
                  ? "Khi đổi email, hệ thống cập nhật đồng thời email đăng nhập."
                  : "Mật khẩu tối thiểu 8 ký tự. Bàn giao riêng cho người nhận tài khoản."}
              </Text>
              <View style={styles.row}>
                <Button
                  title={uid ? "Lưu thay đổi" : "Tạo tài khoản User"}
                  busy={busy}
                  disabled={uploading}
                  onPress={() => {
                    void save();
                  }}
                />
                <Button
                  secondary
                  title="Hủy"
                  disabled={busy || uploading}
                  onPress={() => router.replace("/admin/users")}
                />
              </View>
            </>
          )}
        </View>
      )}
    </Shell>
  );
}
