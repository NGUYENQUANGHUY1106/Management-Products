import React, { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { Redirect } from "expo-router";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "../config/firebase";
import { useAuth } from "../contexts/AuthContext";
import { Button, ErrorBox, Field, Loading, styles } from "../components/ui";
import { errorMessage } from "../utils/validation";
export default function Login() {
  const session = useAuth();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function login() {
    setBusy(true); setError("");
    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      if ((await credential.user.getIdTokenResult(true)).claims.admin !== true) {
        await signOut(auth); throw new Error("Tài khoản không có quyền quản trị.");
      }
    } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
  }
  if (session.loading) return <Loading />;
  if (session.admin) return <Redirect href="/admin/products" />;
  return <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24, backgroundColor: "#F3F6F4" }}>
    <View style={[styles.card, { width: "100%", maxWidth: 460, alignSelf: "center" }]}>
      <Text style={styles.subtitle}>MANAGEMENT PRODUCT / ADMIN</Text>
      <Text style={styles.title}>Quản lý sản phẩm</Text>
      <Text style={styles.subtitle}>Đăng nhập tài khoản quản trị để quản lý kho sản phẩm.</Text>
      <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" editable={!busy} />
      <Field label="Mật khẩu" value={password} onChangeText={setPassword} secret editable={!busy} onSubmitEditing={() => { if (!busy) void login(); }} />
      <ErrorBox message={error || session.error || (session.user ? "Tài khoản không có quyền quản trị." : "")} />
      <Button title="Đăng nhập" busy={busy} onPress={() => { void login(); }} />
    </View>
  </ScrollView>;
}
