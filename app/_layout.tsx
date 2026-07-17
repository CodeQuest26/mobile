import ThemeProvider from "@/contexts/ThemeContext";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { KeyboardProvider } from "react-native-keyboard-controller";

const RootLayout = () => {
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
      </ThemeProvider>
    </KeyboardProvider>
  );
};

export default RootLayout;
