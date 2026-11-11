import React, { useState } from "react";
import { Platform, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { auth } from "../config/firebase";
import { apiBase } from "../services/api";
import { Avatar, Button, ErrorBox, styles } from "./ui";
import { errorMessage } from "../utils/validation";
export function AvatarPicker({
  name,
  value,
  onChange,
  onBusy,
}: {
  name: string;
  value: string;
  onChange: (url: string) => void;
  onBusy?: (busy: boolean) => void;
}) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState("");
  async function choose() {
    setError("");
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024)
        throw new Error("Ảnh tối đa 5 MB.");
      setPreview(asset.uri);
      setBusy(true);
      onBusy?.(true);
      const form = new FormData();
      if (Platform.OS === "web") {
        const blob = await (await fetch(asset.uri)).blob();
        form.append("image", blob, asset.fileName || "avatar.jpg");
      } else
        form.append("image", {
          uri: asset.uri,
          name: asset.fileName || "avatar.jpg",
          type: asset.mimeType || "image/jpeg",
        } as unknown as Blob);
      const token = await auth.currentUser?.getIdToken();
      const r = await fetch(apiBase + "/images", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
        signal: AbortSignal.timeout(45000),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Không tải được ảnh.");
      onChange(data.url);
      setPreview("");
    } catch (e) {
      setError(errorMessage(e));
      setPreview("");
    } finally {
      setBusy(false);
      onBusy?.(false);
    }
  }
  return (
    <View style={{ gap: 14 }}>
      <View style={styles.row}>
        <Avatar name={name} uri={preview || value} size={86} />
        <View style={{ gap: 8 }}>
          <Button
            secondary
            title="Chọn ảnh đại diện"
            busy={busy}
            onPress={() => {
              void choose();
            }}
          />
          <Text style={styles.subtitle}>
            {busy ? "Đang tải ảnh…" : "JPEG, PNG, WebP · tối đa 5 MB"}
          </Text>
        </View>
      </View>
      <ErrorBox message={error} />
    </View>
  );
}
