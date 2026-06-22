import { Ionicons } from "@expo/vector-icons";
import { Icon, Label, Tabs } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { Platform, StyleSheet, useColorScheme } from "react-native";

export default function TabsLayout() {
  const colorScheme = useColorScheme();

  if (Platform.OS === "ios") {
    return (
      <NativeTabs iconColor={colorScheme === "dark" ? "#fff" : "#000"}>
        <NativeTabs.Trigger name="index">
          <Icon sf="house.fill" />
          <Label>Home</Label>
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="jobs">
          <Icon sf="briefcase.fill" />
          <Label>Jobs</Label>
        </NativeTabs.Trigger>

        <NativeTabs.Trigger role="search" name="chat">
          <Icon sf="message.fill" />
          <Label>Chat</Label>
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="map">
          <Icon sf="map.fill" />
          <Label>Map</Label>
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="profile">
          <Icon sf="person.crop.circle.fill" />
          <Label>Profile</Label>
        </NativeTabs.Trigger>
      </NativeTabs>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colorScheme === "dark" ? "#fff" : "#000",
        tabBarStyle: {
          position: "absolute",
          bottom: 20,
          left: 16,
          right: 16,
          marginHorizontal: 10,
          borderRadius: 30,
          height: 60,
          backgroundColor:
            colorScheme === "dark"
              ? "rgba(0,0,0,0.9)"
              : "rgba(255,255,255,0.9)",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="jobs"
        options={{
          title: "Jobs",
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? "list" : "list-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="map"
        options={{
          title: "Map",
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? "map" : "map-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? "chatbubble" : "chatbubble-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 16,
  },
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 10,
    borderRadius: 30,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.6)",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  tabBarContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  tab: {
    flex: 1,
    alignItems: "center",
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  label: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: "600",
  },
});
