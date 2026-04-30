import { Stack } from "expo-router";
import React from "react";
import { StyleSheet } from "react-native";

const ManufacturerScreensLayout = () => {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="filterScreen" />
    </Stack>
  );
};

export default ManufacturerScreensLayout;

const styles = StyleSheet.create({});
