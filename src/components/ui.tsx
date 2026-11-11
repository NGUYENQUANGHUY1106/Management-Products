import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import { colors as c } from "../constants/theme";
import { resolveImageUrl } from "../utils/imageUrl";
export const styles = StyleSheet.create({
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: c.forest,
    letterSpacing: -1,
  },
  subtitle: { color: c.muted, fontSize: 15, lineHeight: 24 },
  card: {
    backgroundColor: c.white,
    padding: 26,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 20,
    gap: 18,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  label: { color: c.forest, fontSize: 14, fontWeight: "600" },
  input: {
    borderColor: c.border,
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: c.forest,
    backgroundColor: c.light,
    minHeight: 48,
    flex: 1,
  },
  button: {
    minHeight: 46,
    minWidth: 46,
    backgroundColor: c.teal,
    borderRadius: 10,
    paddingHorizontal: 19,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { color: c.white, fontSize: 14, fontWeight: "600" },
  error: {
    color: c.error,
    lineHeight: 22,
    backgroundColor: "#FFF1EE",
    padding: 14,
    borderRadius: 10,
  },
});
export function Button({
  title,
  onPress,
  busy,
  secondary,
  danger,
  disabled,
}: {
  title: string;
  onPress: () => void;
  busy?: boolean;
  secondary?: boolean;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      disabled={busy || disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary && { backgroundColor: c.cream },
        danger && { backgroundColor: c.error },
        (busy || disabled) && { opacity: 0.5 },
        pressed && { opacity: 0.75 },
      ]}
    >
      {busy ? (
        <ActivityIndicator color={secondary ? c.teal : c.white} />
      ) : (
        <Text style={[styles.buttonText, secondary && { color: c.forest }]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}
export function Field({
  label,
  secret,
  ...props
}: TextInputProps & { label: string; secret?: boolean }) {
  const [show, setShow] = useState(false);
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.label}>{label}</Text>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <TextInput
          {...props}
          accessibilityLabel={label}
          secureTextEntry={secret && !show}
          autoCapitalize={props.autoCapitalize || (secret ? "none" : undefined)}
          style={[styles.input, props.style]}
        />
        {secret && (
          <Button
            secondary
            title={show ? "Ẩn" : "Hiện"}
            onPress={() => setShow(!show)}
          />
        )}
      </View>
    </View>
  );
}
export function ErrorBox({ message }: { message?: string }) {
  return message ? (
    <Text accessibilityRole="alert" style={styles.error}>
      {message}
    </Text>
  ) : null;
}
export function Avatar({
  name,
  uri,
  size = 52,
}: {
  name: string;
  uri?: string;
  size?: number;
}) {
  const [failedUri, setFailedUri] = useState<string>();
  return uri && failedUri !== uri ? (
    <Image
      accessibilityLabel={`Ảnh đại diện ${name}`}
      source={{ uri: resolveImageUrl(uri) }}
      onError={() => setFailedUri(uri)}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: c.cream,
      }}
    />
  ) : (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: c.cream,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color: c.teal, fontSize: size / 3, fontWeight: "700" }}>
        {name
          .trim()
          .split(/\s+/)
          .slice(-2)
          .map((x) => x[0])
          .join("")
          .toUpperCase() || "U"}
      </Text>
    </View>
  );
}
export function Loading() {
  return (
    <View style={{ flex: 1, padding: 50, alignItems: "center", gap: 16 }}>
      <ActivityIndicator color={c.teal} />
      <Text style={styles.subtitle}>Đang tải dữ liệu…</Text>
    </View>
  );
}
