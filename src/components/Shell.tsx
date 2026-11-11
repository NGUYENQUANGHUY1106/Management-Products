import React from "react";
import { ScrollView, Text, useWindowDimensions, View } from "react-native";
import { router, usePathname } from "expo-router";
import { signOut } from "firebase/auth";
import { auth } from "../config/firebase";
import { useAuth } from "../contexts/AuthContext";
import { colors as c } from "../constants/theme";
import { Button, ErrorBox, styles } from "./ui";
export function Shell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const { width } = useWindowDimensions();
  const { user, admin } = useAuth();
  const path = usePathname();
  const [error, setError] = React.useState("");
  const desktop = width >= 1024;
  const nav = (
    <View style={{ gap: 10 }}>
      {admin && (
        <>
          <Button
            secondary={path !== "/admin/dashboard"}
            title="Tổng quan"
            onPress={() => router.push("/admin/dashboard")}
          />
          <Button
            secondary={!path.includes("/admin/users")}
            title="Danh sách người dùng"
            onPress={() => router.push("/admin/users")}
          />
        </>
      )}
      <Button
        secondary={!path.includes("/user/")}
        title="Hồ sơ của tôi"
        onPress={() => router.push("/user/profile")}
      />
    </View>
  );
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: c.cream,
        flexDirection: desktop ? "row" : "column",
      }}
    >
      {desktop && (
        <View
          style={{
            width: 250,
            backgroundColor: c.forest,
            padding: 28,
            gap: 36,
          }}
        >
          <Text style={{ fontSize: 28, fontWeight: "700", color: "white" }}>
            ◈ UserHub
          </Text>
          <Text style={{ color: "#B5CCC5", letterSpacing: 3, fontSize: 11 }}>
            VERDANT LEDGER
          </Text>
          {nav}
          <View style={{ flex: 1 }} />
          <Text style={{ color: "#B5CCC5", fontSize: 12 }}>
            Không gian quản lý tài khoản
            {admin ? "\nDành cho quản trị viên" : "\nHồ sơ cá nhân"}
          </Text>
        </View>
      )}
      <View style={{ flex: 1 }}>
        <View
          style={{
            paddingHorizontal: desktop ? 36 : 20,
            paddingVertical: 17,
            backgroundColor: c.white,
            borderBottomColor: c.border,
            borderBottomWidth: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <Text
            numberOfLines={1}
            style={{ color: c.forest, flex: 1, fontWeight: "600" }}
          >
            {desktop
              ? admin
                ? "KHÔNG GIAN QUẢN TRỊ"
                : "TÀI KHOẢN CÁ NHÂN"
              : "◈ UserHub"}
          </Text>
          {desktop && <Text style={styles.subtitle}>{user?.email}</Text>}
          <Button
            secondary
            title="Đăng xuất"
            onPress={() => {
              signOut(auth).catch(() =>
                setError("Chưa đăng xuất được. Hãy thử lại."),
              );
            }}
          />
        </View>
        <ScrollView
          contentContainerStyle={{
            padding: desktop ? 36 : 20,
            gap: 24,
            maxWidth: 1272,
            width: "100%",
            alignSelf: "center",
          }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ gap: 8 }}>
            <Text
              style={{
                color: c.teal,
                letterSpacing: 2,
                fontSize: 11,
                fontWeight: "700",
              }}
            >
              USERHUB / {admin ? "ADMIN" : "MY ACCOUNT"}
            </Text>
            <Text accessibilityRole="header" style={styles.title}>
              {title}
            </Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
          <ErrorBox message={error} />
          {children}
        </ScrollView>
        {!desktop && (
          <View
            style={{
              padding: 12,
              backgroundColor: c.white,
              borderTopWidth: 1,
              borderColor: c.border,
            }}
          >
            {nav}
          </View>
        )}
      </View>
    </View>
  );
}
