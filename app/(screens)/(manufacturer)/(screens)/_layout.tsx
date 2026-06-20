import { Stack } from "expo-router";
import React from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

const ManufacturerScreensLayout = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="profile" />
        <Stack.Screen name="filterScreen" />
      </Stack>
    </GestureHandlerRootView>
  );
};

export default ManufacturerScreensLayout;

const styles = StyleSheet.create({});
