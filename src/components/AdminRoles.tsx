import React, { useState } from "react";
import { Text, View } from "react-native";
import { api } from "../services/api";
import { errorMessage } from "../utils/validation";
import { Button, ErrorBox, Field, styles } from "./ui";

export function AdminRoles() {
  const [identifier, setIdentifier] = useState("");
  const [pending, setPending] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  async function apply() {
    if (pending === null) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const result = await api<{ uid: string; email: string; admin: boolean }>("/admin/roles", "PATCH", { identifier: identifier.trim(), admin: pending });
      setNotice(`${result.admin ? "Đã cấp" : "Đã thu hồi"} quyền admin: ${result.email || result.uid}. ${result.admin ? "Tài khoản cần đăng xuất rồi đăng nhập lại." : "Phiên hiện có có thể còn quyền đọc/ghi Firestore đến khi ID token hết hạn (tối đa khoảng 1 giờ)."}`);
      setPending(null);
    } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
  }
  return <View style={styles.card}>
    <Text style={[styles.title, { fontSize: 24 }]}>Phân quyền admin</Text>
    <Text style={styles.subtitle}>Tạo tài khoản tại Firebase Authentication → Add user, sau đó nhập email hoặc UID bên dưới để cấp quyền quản trị.</Text>
    <Field label="Email hoặc UID tài khoản" value={identifier} onChangeText={value => { setIdentifier(value); setPending(null); setError(""); setNotice(""); }} autoCapitalize="none" editable={!busy} />
    <View style={styles.row}>
      <Button title="Cấp quyền admin" disabled={busy || !identifier.trim()} onPress={() => { setPending(true); setNotice(""); setError(""); }} />
      <Button danger title="Thu hồi quyền admin" disabled={busy || !identifier.trim()} onPress={() => { setPending(false); setNotice(""); setError(""); }} />
    </View>
    {pending !== null && <View style={{ gap: 12 }}>
      <Text style={styles.label}>{pending ? "Cấp" : "Thu hồi"} quyền admin cho “{identifier.trim()}”?</Text>
      <View style={styles.row}><Button title="Xác nhận phân quyền" busy={busy} onPress={() => { void apply(); }} /><Button secondary title="Hủy phân quyền" disabled={busy} onPress={() => setPending(null)} /></View>
    </View>}
    <ErrorBox message={error} />
    {!!notice && <Text accessibilityRole="alert" style={styles.label}>{notice}</Text>}
  </View>;
}
