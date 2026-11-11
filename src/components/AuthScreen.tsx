import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Redirect, router } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../config/firebase";
import { register } from "../services/auth";
import { useAuth } from "../contexts/AuthContext";
import { normalizeEmail, errorMessage, validate } from "../utils/validation";
import { colors as c } from "../constants/theme";
import { Button, ErrorBox, Field, Loading, styles } from "./ui";
import { AvatarPicker } from "./AvatarPicker";
import type { ImagePickerAsset } from "expo-image-picker";
export default function AuthScreen({
  registration = false,
}: {
  registration?: boolean;
}) {
  const { user, admin, loading, refresh } = useAuth();
  const { width } = useWindowDimensions();
  const [email, setEmail] = useState("");
  const [hoten, setHoten] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [image, setImage] = useState<ImagePickerAsset>();
  const [imageUri, setImageUri] = useState("");
  const [pickingImage, setPickingImage] = useState(false);
  if (loading) return <Loading />;
  if (user && !busy && !error)
    return <Redirect href={admin ? "/admin/dashboard" : "/user/profile"} />;
  async function submit() {
    if (busy || pickingImage) return;
    setBusy(true);
    setError("");
    try {
      if (registration) await register(email, hoten, password, confirm, image);
      else {
        validate(email);
        if (!password) throw new Error("Vui lòng nhập mật khẩu.");
        await signInWithEmailAndPassword(auth, normalizeEmail(email), password);
      }
      await refresh();
    } catch (e) {
      await refresh();
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={{
            flex: 1,
            flexDirection: width >= 900 ? "row" : "column",
            backgroundColor: c.cream,
          }}
        >
          <View
            style={{
              flex: width >= 900 ? 1 : undefined,
              backgroundColor: c.forest,
              padding: width >= 900 ? 60 : 28,
              justifyContent: "space-between",
              gap: 40,
            }}
          >
            <Text style={{ fontSize: 29, fontWeight: "700", color: "white" }}>
              ◈ UserHub
            </Text>
            <View style={{ gap: 22 }}>
              <Text
                style={{ color: "#9EC7B8", fontSize: 12, letterSpacing: 3 }}
              >
                VERDANT LEDGER / 2026
              </Text>
              <Text
                style={{
                  fontSize: width >= 900 ? 54 : 32,
                  fontWeight: "700",
                  color: "white",
                  lineHeight: width >= 900 ? 65 : 42,
                }}
              >
                Mỗi kết nối,{"\n"}một khởi đầu.
              </Text>
              <Text
                style={{
                  color: "#BAD1C9",
                  lineHeight: 26,
                  fontSize: 16,
                  maxWidth: 390,
                }}
              >
                Một không gian gọn gàng cho hồ sơ của bạn. Cập nhật thông tin,
                lưu giữ kết nối và quản lý dễ dàng.
              </Text>
            </View>
            {width >= 900 && (
              <View
                style={{
                  borderTopWidth: 1,
                  borderColor: "#3F5A58",
                  paddingTop: 24,
                }}
              >
                <Text style={{ color: "#BAD1C9" }}>
                  01 Tài khoản cá nhân / 02 Quản trị tập trung
                </Text>
              </View>
            )}
          </View>
          <View
            style={{
              flex: 1.1,
              alignItems: "center",
              justifyContent: "center",
              padding: 28,
            }}
          >
            <View style={{ width: "100%", maxWidth: 450, gap: 25 }}>
              <View style={{ gap: 9 }}>
                <Text style={{ color: c.teal, letterSpacing: 2, fontSize: 12 }}>
                  CHÀO MỪNG BẠN
                </Text>
                <Text style={styles.title}>
                  {registration ? "Tạo tài khoản mới" : "Đăng nhập UserHub"}
                </Text>
                <Text style={styles.subtitle}>
                  {registration
                    ? "Bắt đầu với một hồ sơ dành riêng cho bạn."
                    : "Đăng nhập để tiếp tục đến không gian của bạn."}
                </Text>
              </View>
              <View style={styles.card}>
                {registration && (
                  <View style={{ gap: 10 }}>
                    <Text style={styles.label}>
                      Ảnh đại diện (không bắt buộc)
                    </Text>
                    <AvatarPicker
                      name={hoten}
                      value={imageUri}
                      onChange={setImageUri}
                      onSelect={setImage}
                      onBusy={setPickingImage}
                      disabled={busy}
                    />
                    {!!image && (
                      <Text style={styles.subtitle}>
                        Ảnh đã chọn sẽ được tải lên khi tạo tài khoản.
                      </Text>
                    )}
                  </View>
                )}
                {registration && (
                  <Field
                    label="Họ và tên"
                    value={hoten}
                    onChangeText={setHoten}
                    autoComplete="name"
                    maxLength={100}
                  />
                )}
                <Field
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
                <Field
                  label="Mật khẩu"
                  secret
                  value={password}
                  onChangeText={setPassword}
                  autoComplete={
                    registration ? "new-password" : "current-password"
                  }
                />
                {registration && (
                  <>
                    <Text style={{ color: c.muted, fontSize: 12 }}>
                      Từ 8 đến 128 ký tự.
                    </Text>
                    <Field
                      label="Xác nhận mật khẩu"
                      secret
                      value={confirm}
                      onChangeText={setConfirm}
                    />
                  </>
                )}
                <ErrorBox message={error} />
                <Button
                  title={registration ? "Tạo tài khoản" : "Đăng nhập"}
                  busy={busy}
                  disabled={pickingImage}
                  onPress={() => {
                    void submit();
                  }}
                />
              </View>
              <Button
                secondary
                disabled={busy}
                title={
                  registration
                    ? "Đã có tài khoản? Đăng nhập"
                    : "Chưa có tài khoản? Đăng ký"
                }
                onPress={() =>
                  router.replace(registration ? "/login" : "/register")
                }
              />
              <Text
                style={{ color: c.muted, textAlign: "center", fontSize: 12 }}
              >
                Thông tin của bạn được bảo vệ bằng Firebase Authentication.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
