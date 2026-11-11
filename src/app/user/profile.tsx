import React, { useState } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useAuth } from "../../contexts/AuthContext";
import { Shell } from "../../components/Shell";
import { Avatar, Button, ErrorBox, styles } from "../../components/ui";
import { errorMessage } from "../../utils/validation";
export default function Profile() {
  const { user, profile, admin, error, refresh } = useAuth();
  const [localError, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function recover() {
    setBusy(true);
    setError("");
    try {
      if (user && !profile) {
        await setDoc(doc(db, "users", user.uid), {
          email: user.email,
          matkhau: "AUTH_MANAGED",
          hoten: user.displayName || "Người dùng UserHub",
          hinhanh: "",
        });
        await refresh();
      }
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Shell
      title="Hồ sơ của tôi"
      subtitle="Thông tin cá nhân của bạn, luôn trong tầm tay."
    >
      <ErrorBox message={error || localError} />
      {profile ? (
        <View style={[styles.card, { maxWidth: 720 }]}>
          <View style={styles.row}>
            <Avatar name={profile.hoten} uri={profile.hinhanh} size={100} />
            <View style={{ gap: 8, flex: 1 }}>
              <Text style={[styles.title, { fontSize: 26 }]}>
                {profile.hoten}
              </Text>
              <Text style={styles.subtitle}>
                {admin ? "Quản trị viên" : "Thành viên UserHub"}
              </Text>
            </View>
          </View>
          <View style={{ height: 1, backgroundColor: "#D7E4DD" }} />
          <Text style={styles.label}>Email</Text>
          <Text style={styles.subtitle}>{profile.email}</Text>
          <Text style={styles.subtitle}>
            Bạn có thể thay đổi họ tên và ảnh đại diện. Email được quản lý bởi
            quản trị viên.
          </Text>
          <Button
            title="Chỉnh sửa hồ sơ"
            onPress={() => router.push("/user/edit-profile")}
          />
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.label}>
            {admin
              ? "Tài khoản Admin chưa có hồ sơ cá nhân."
              : "Chưa tìm thấy hồ sơ của bạn."}
          </Text>
          <Text style={styles.subtitle}>
            Thử tải lại dữ liệu trước khi khôi phục hồ sơ.
          </Text>
          <View style={styles.row}>
            <Button
              secondary
              title="Tải lại hồ sơ"
              onPress={() => {
                void refresh();
              }}
            />
            <Button
              title="Tạo hồ sơ còn thiếu"
              busy={busy}
              onPress={() => {
                void recover();
              }}
            />
          </View>
        </View>
      )}
    </Shell>
  );
}
