import ThemeProvider from "@/contexts/ThemeContext";
import { Stack } from "expo-router";
import React from "react";

const RootLayout = () => {
  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
      </Stack>
    </ThemeProvider>
  );
};

export default RootLayout;
