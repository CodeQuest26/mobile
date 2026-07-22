import { Stack } from "expo-router";
import React from "react";

const ScreensLayout = () => {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="notifications" />
      <Stack.Screen name="editProfile" />
      <Stack.Screen name="jobDetails" />
      <Stack.Screen name="orderDetails" />
      <Stack.Screen name="paymentStatus" />
      <Stack.Screen name="postJob" />
    </Stack>
  );
};

export default ScreensLayout;
