import Colors from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Icon, Label, usePathname, useRouter } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

export default function TabLayout() {
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

        <NativeTabs.Trigger name="orders">
          <Icon sf="receipt.fill" />
          <Label>Orders</Label>
        </NativeTabs.Trigger>

        <NativeTabs.Trigger role="search" name="chat">
          <Icon sf="message.fill" />
          <Label>Chat</Label>
        </NativeTabs.Trigger>
      </NativeTabs>
    );
  }
}

function FloatingTabBar() {
  const router = useRouter();
  const pathname = usePathname();

  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme] ?? Colors.light;

  return (
    <View style={styles.wrapper}>
      <BlurView intensity={90} tint="light" style={styles.container}>
        <TabItem
          icon="home"
          label="Home"
          active={pathname === "/"}
          onPress={() => router.push("/")}
        />
        <TabItem
          icon="person"
          label="Profile"
          active={pathname === "/profile"}
          onPress={() => router.push("/profile")}
        />
      </BlurView>
    </View>
  );
}

function TabItem({ icon, label, active, onPress }: any) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Determine icon name: filled when active, outline when inactive
  const iconName = active ? icon : `${icon}-outline`;

  return (
    <TouchableOpacity
      onPress={() => {
        scale.value = withSpring(0.9, {}, () => {
          scale.value = withSpring(1);
        });
        onPress();
      }}
      style={styles.tab}
      activeOpacity={0.8}
    >
      <Animated.View
        style={[styles.inner, animatedStyle, active && styles.activeTab]}
      >
        <Ionicons name={iconName} size={20} color={active ? "#000" : "#666"} />
        {active && <Text style={styles.label}>{label}</Text>}
      </Animated.View>
    </TouchableOpacity>
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
