import React from "react";
import { Pressable, Text } from "react-native";

export function FavoriteButton({ name, selected, disabled, showLabel, onPress }: { name: string; selected: boolean; disabled?: boolean; showLabel?: boolean; onPress: () => void }) {
  const label = `${selected ? "Hủy yêu thích" : "Yêu thích"} ${name}`;
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected, disabled }} aria-pressed={selected} disabled={disabled} onPress={onPress}
    style={({ pressed }) => ({ flexDirection: "row", gap: 7, minWidth: 40, minHeight: 40, justifyContent: "center", alignItems: "center", paddingHorizontal: showLabel ? 12 : 6, borderRadius: 6, borderWidth: 1, borderColor: selected ? "#FECDD3" : "#DFE3EB", backgroundColor: selected ? "#FFF1F2" : "white", opacity: disabled ? 0.45 : pressed ? 0.7 : 1 })}>
    <Text aria-hidden style={{ color: selected ? "#E11D48" : "#647084", fontSize: 22 }}>{selected ? "♥" : "♡"}</Text>
    {showLabel && <Text style={{ color: "#BE123C", fontSize: 12, fontWeight: "600" }}>Hủy yêu thích</Text>}
  </Pressable>;
}
