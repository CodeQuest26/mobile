import { Stack } from "expo-router";
import React from "react";
import { StyleSheet } from "react-native";

const ScreensLayout = () => {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="notifications" options={{}} />
    </Stack>
  );
};

export default ScreensLayout;

const styles = StyleSheet.create({});
