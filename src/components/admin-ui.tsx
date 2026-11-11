import React, { useState } from "react";
import { ActivityIndicator, Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View, ViewStyle } from "react-native";
import { apiBase } from "../services/api";
import { resolveProductImageUrl } from "../utils/productImage";

export const palette = { ink: "#142740", muted: "#647084", teal: "#007D73", line: "#DFE3EB", background: "#F7F8FD", blue: "#E6EEFF", red: "#DC2626" };
export const adminStyles = StyleSheet.create({
  text: { color: palette.ink, fontSize: 14 },
  muted: { color: palette.muted, fontSize: 13, lineHeight: 20 },
  label: { color: palette.ink, fontSize: 13, fontWeight: "600" },
  row: { flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" },
  border: { borderWidth: 1, borderColor: palette.line, borderRadius: 7, backgroundColor: "white" },
  divider: { height: 1, backgroundColor: palette.line },
});

export function Action({ title, label, icon, onPress, variant = "primary", busy, disabled, small }: {
  title: string; label?: string; icon?: string; onPress: () => void; variant?: "primary" | "outline" | "danger" | "delete" | "ghost";
  busy?: boolean; disabled?: boolean; small?: boolean;
}) {
  const foreground = variant === "primary" || variant === "danger" ? "white" : variant === "delete" ? "#B91C1C" : palette.ink;
  return <Pressable accessibilityRole="button" accessibilityLabel={label || title} disabled={busy || disabled} onPress={onPress}
    style={({ pressed }) => ({ flexDirection: "row", gap: 7, justifyContent: "center", alignItems: "center", minHeight: small ? 34 : 40, paddingHorizontal: small ? 11 : 16, paddingVertical: 8, borderRadius: 5,
      borderWidth: variant === "outline" ? 1 : 0, borderColor: palette.line, backgroundColor: variant === "primary" ? palette.teal : variant === "danger" ? palette.red : variant === "delete" ? "#FEE2E2" : variant === "ghost" ? "transparent" : "white",
      opacity: busy || disabled ? 0.5 : pressed ? 0.75 : 1 })}>
    {busy ? <ActivityIndicator color={foreground} size="small" /> : <>{!!icon && <Text style={{ color: foreground, fontSize: 16 }} aria-hidden>{icon}</Text>}<Text style={{ color: foreground, fontSize: small ? 12 : 13, fontWeight: "600" }}>{title}</Text></>}
  </Pressable>;
}

export function ProductImage({ uri, name, size = 48 }: { uri: string; name: string; size?: number }) {
  const [failed, setFailed] = useState("");
  return uri && failed !== uri ? <Image accessibilityLabel={`Ảnh ${name}`} source={{ uri: resolveProductImageUrl(uri, apiBase) }} onError={() => setFailed(uri)} style={{ width: size, height: size, borderRadius: 6, backgroundColor: "#F0F2F5" }} resizeMode="cover" /> :
    <View accessibilityLabel={`Chưa có ảnh ${name}`} style={{ width: size, height: size, borderRadius: 6, backgroundColor: "#E9EEF6", justifyContent: "center", alignItems: "center" }}><Text style={{ fontSize: size / 3, color: "#8996A8" }}>▧</Text></View>;
}

export function ModalFrame({ children, onClose, title, width = 560 }: { children: React.ReactNode; onClose: () => void; title: string; width?: number }) {
  return <Modal transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
      <View style={[{ flex: 1, backgroundColor: "rgba(24,35,56,0.40)" }, Platform.OS === "web" && ({ backdropFilter: "blur(3px)" } as ViewStyle)]}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, justifyContent: "center", alignItems: "center", padding: 18 }}>
          <View accessibilityViewIsModal role="dialog" accessibilityLabel={title} style={{ backgroundColor: "white", borderRadius: 8, width: "100%", maxWidth: width, boxShadow: "0px 18px 60px rgba(15,23,42,0.22)", overflow: "hidden" }}>{children}</View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  </Modal>;
}
