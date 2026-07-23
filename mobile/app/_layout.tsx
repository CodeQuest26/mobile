import ThemeProvider from "@/contexts/ThemeContext";
import { useNotifications } from "@/hooks/useNotifications";
import { SessionExpiredToast } from "@/components/common/SessionExpiredToast";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { KeyboardProvider } from "react-native-keyboard-controller";

const RootLayout = () => {
  // Registers push notification permissions and FCM token for the whole session.
  useNotifications();

  return (
    <KeyboardProvider>
      <ThemeProvider>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(onboarding)" />
          <Stack.Screen name="(screens)" />
        </Stack>
        {/* Session expired toast — rendered above all screens, zero extra deps */}
        <SessionExpiredToast />
      </ThemeProvider>
    </KeyboardProvider>
  );
};

export default RootLayout;
