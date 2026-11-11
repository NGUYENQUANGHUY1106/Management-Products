import React from "react";
import { Stack } from "expo-router";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "../contexts/AuthContext";
export default function Layout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <SafeAreaView style={{ flex: 1 }}>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }} />
        </SafeAreaView>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
