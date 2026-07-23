import { Icon, Label } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import React from "react";
import { useColorScheme } from "react-native";

const AdminLayout = () => {
  const colorScheme = useColorScheme();
  return (
    <NativeTabs iconColor={colorScheme === "dark" ? "#fff" : "#000"}>
      <NativeTabs.Trigger name="index">
        <Icon sf="house.fill" md="home" />
        <Label>Home</Label>
        <NativeTabs.Trigger.Icon />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="verification">
        <Icon sf="person.badge.key.fill" md="manage_accounts" />
        <Label>Verification</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="userManagement">
        <Icon sf="chart.bar.fill" md="report" />
        <Label>Manage Users</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="support">
        <Icon sf="questionmark.circle.fill" md="help" />
        <Label>Support</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Icon sf="person.fill" md="help" />
        <Label>Profile</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
};

export default AdminLayout;
