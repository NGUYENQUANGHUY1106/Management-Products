import React, { useState } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useAuth } from "../../contexts/AuthContext";
import { Shell } from "../../components/Shell";
import { Button, ErrorBox, Field, styles } from "../../components/ui";
import { AvatarPicker } from "../../components/AvatarPicker";
import { errorMessage, validate } from "../../utils/validation";
export default function EditProfile() {
  const { user, profile, refresh } = useAuth();
  const [name, setName] = useState(profile?.hoten || "");
  const [image, setImage] = useState(profile?.hinhanh || "");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  async function save() {
    if (!user || !profile || busy || uploading) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      validate(profile.email, name);
      await updateDoc(doc(db, "users", user.uid), {
        hoten: name.trim(),
        hinhanh: image,
      });
      await refresh();
      setMessage("Đã lưu hồ sơ thành công.");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Shell
      title="Chỉnh sửa hồ sơ"
      subtitle="Thêm một dấu ấn riêng cho tài khoản của bạn."
    >
      <View style={[styles.card, { maxWidth: 720 }]}>
        {profile ? (
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
              label="Email (chỉ đọc)"
              value={profile.email}
              editable={false}
            />
            <ErrorBox message={error} />
            {message ? (
              <Text accessibilityRole="alert" style={{ color: "#087C67" }}>
                {message}
              </Text>
            ) : null}
            <View style={styles.row}>
              <Button
                title="Lưu thay đổi"
                busy={busy}
                disabled={uploading}
                onPress={() => {
                  void save();
                }}
              />
              <Button
                secondary
                title="Quay lại hồ sơ"
                disabled={busy || uploading}
                onPress={() => router.replace("/user/profile")}
              />
            </View>
          </>
        ) : (
          <>
            <Text style={styles.subtitle}>
              Cần có hồ sơ trước khi chỉnh sửa.
            </Text>
            <Button
              title="Về hồ sơ"
              onPress={() => router.replace("/user/profile")}
            />
          </>
        )}
      </View>
    </Shell>
  );
}
