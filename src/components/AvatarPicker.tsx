import React, { useState } from "react";
import { Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { uploadImage } from "../services/image";
import { Avatar, Button, ErrorBox, styles } from "./ui";
import { errorMessage } from "../utils/validation";
export function AvatarPicker({
  name,
  value,
  onChange,
  onBusy,
  onSelect,
  disabled,
}: {
  name: string;
  value: string;
  onChange: (url: string) => void;
  onBusy?: (busy: boolean) => void;
  onSelect?: (asset: ImagePicker.ImagePickerAsset) => void;
  disabled?: boolean;
}) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState("");
  async function choose() {
    if (busy || disabled) return;
    setError("");
    setBusy(true);
    onBusy?.(true);
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
      if (onSelect) {
        onSelect(asset);
        onChange(asset.uri);
      } else {
        onChange(await uploadImage(asset));
      }
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
            disabled={disabled}
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
