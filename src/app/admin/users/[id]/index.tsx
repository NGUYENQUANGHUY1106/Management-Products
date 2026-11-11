import React, { useCallback, useState } from "react";
import { Modal, Text, View } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../../config/firebase";
import { UserProfile } from "../../../../types/user";
import { api } from "../../../../services/api";
import { Shell } from "../../../../components/Shell";
import {
  Avatar,
  Button,
  ErrorBox,
  Loading,
  styles,
} from "../../../../components/ui";
import { errorMessage } from "../../../../utils/validation";
export default function Detail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const load = useCallback(() => {
    setLoading(true);
    setError("");
    getDoc(doc(db, "users", id))
      .then((s) => {
        if (!s.exists()) throw new Error("Không tìm thấy hồ sơ.");
        setProfile(s.data() as UserProfile);
      })
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, [id]);
  useFocusEffect(load);
  async function remove() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await api(`/admin/users/${id}`, "DELETE");
      setConfirm(false);
      router.replace("/admin/users");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Shell
      title="Chi tiết người dùng"
      subtitle="Thông tin và các thao tác quản lý tài khoản."
    >
      <ErrorBox message={!confirm ? error : ""} />
      {loading ? (
        <Loading />
      ) : profile ? (
        <View style={[styles.card, { maxWidth: 720 }]}>
          <Avatar name={profile.hoten} uri={profile.hinhanh} size={110} />
          <Text style={[styles.title, { fontSize: 27 }]}>{profile.hoten}</Text>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.subtitle}>{profile.email}</Text>
          <View style={styles.row}>
            <Button
              title="Chỉnh sửa người dùng"
              onPress={() => router.push(`/admin/users/${id}/edit`)}
            />
            <Button
              danger
              title="Xóa tài khoản"
              onPress={() => setConfirm(true)}
            />
            <Button
              secondary
              title="Về danh sách"
              onPress={() => router.replace("/admin/users")}
            />
          </View>
        </View>
      ) : (
        <Button title="Thử tải lại" onPress={load} />
      )}
      <Modal
        visible={confirm}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!busy) setConfirm(false);
        }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(23,53,57,0.55)",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <View
            accessibilityViewIsModal
            style={[styles.card, { maxWidth: 460, width: "100%" }]}
          >
            <Text
              accessibilityRole="header"
              style={[styles.title, { fontSize: 25 }]}
            >
              Xóa tài khoản này?
            </Text>
            <Text style={styles.subtitle}>
              Tài khoản đăng nhập và hồ sơ của {profile?.hoten} (
              {profile?.email}) sẽ bị xóa. Thao tác này không thể hoàn tác.
            </Text>
            <ErrorBox message={error} />
            <Button
              danger
              title="Xác nhận xóa"
              busy={busy}
              onPress={() => {
                void remove();
              }}
            />
            <Button
              secondary
              title="Hủy xóa"
              disabled={busy}
              onPress={() => setConfirm(false)}
            />
          </View>
        </View>
      </Modal>
    </Shell>
  );
}
