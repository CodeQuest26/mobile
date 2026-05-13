// src/app/(screens)/(manufacturer)/(screens)/notification.tsx
import { FadeIn } from "@/components/FadeIn";
import MainContainer from "@/components/MainContainer";
import Colors from "@/constants/colors";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { RectButton, Swipeable } from "react-native-gesture-handler";
// Optional: import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get("window");

interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: "order" | "bid" | "payment" | "system";
}

// Mock data – replace with API call
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    title: "Order Update",
    message:
      "AfroDrinks Ltd has marked 'Aluminium Cans' as Quality Check completed.",
    timestamp: "10 minutes ago",
    read: false,
    type: "order",
  },
  {
    id: "2",
    title: "New Bid",
    message: "Your bid for 'Plastic Containers' has been accepted!",
    timestamp: "1 hour ago",
    read: false,
    type: "bid",
  },
  {
    id: "3",
    title: "Payment Received",
    message: "GH₵ 32,200 has been released from escrow for 'Steel Frames'.",
    timestamp: "3 hours ago",
    read: true,
    type: "payment",
  },
  {
    id: "4",
    title: "System Update",
    message:
      "New features available: milestone tracking and chat enhancements.",
    timestamp: "Yesterday",
    read: true,
    type: "system",
  },
  {
    id: "5",
    title: "Urgent: Delivery Reminder",
    message: "Order 'Aluminium Cans' is due in 3 days. Please update status.",
    timestamp: "Yesterday",
    read: false,
    type: "order",
  },
];

const getIcon = (type: string, read: boolean, theme: any) => {
  let iconName = "notifications-outline";
  let color = theme.textSecondary;
  switch (type) {
    case "order":
      iconName = "cube-outline";
      color = "#6366F1";
      break;
    case "bid":
      iconName = "hammer-outline";
      color = "#F59E0B";
      break;
    case "payment":
      iconName = "wallet-outline";
      color = "#22C55E";
      break;
    case "system":
      iconName = "settings-outline";
      color = "#8B5CF6";
      break;
  }
  return (
    <Ionicons
      name={iconName as any}
      size={22}
      color={read ? theme.textSecondary : color}
    />
  );
};

export default function NotificationsScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme] || Colors.light;
  const isDark = colorScheme === "dark";

  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");

  const swipeableRefs = useRef(new Map<string, Swipeable>());

  // Cleanup refs on unmount
  useEffect(() => {
    return () => {
      swipeableRefs.current.clear();
    };
  }, []);

  const filteredNotifications =
    activeTab === "all" ? notifications : notifications.filter((n) => !n.read);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif)),
    );
    // Optional haptic feedback
    // Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const deleteNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    // Optional haptic
    // Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Replace with your actual API call
    try {
      // Simulate network request
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // If API call returns fresh data, update state here
      // setNotifications(freshNotifications);
    } catch (error) {
      console.error("Refresh failed", error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const markAllAsRead = () => {
    if (unreadCount === 0) return;
    Alert.alert(
      "Mark all as read",
      `Mark ${unreadCount} notification${unreadCount > 1 ? "s" : ""} as read?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Mark All",
          onPress: () => {
            setNotifications((prev) =>
              prev.map((notif) => ({ ...notif, read: true })),
            );
            // Optional haptic
            // Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ],
    );
  };

  const renderRightActions = useCallback(
    (id: string) => {
      return (
        <RectButton
          style={[styles.deleteButton, { backgroundColor: "#EF4444" }]}
          onPress={() => deleteNotification(id)}
        >
          <Ionicons name="trash-outline" size={22} color="#fff" />
          <Text style={styles.deleteText}>Delete</Text>
        </RectButton>
      );
    },
    [deleteNotification],
  );

  const renderNotification = useCallback(
    ({ item, index }: { item: Notification; index: number }) => (
      <FadeIn delay={index * 30}>
        <Swipeable
          ref={(ref) => {
            if (ref) swipeableRefs.current.set(item.id, ref);
            else swipeableRefs.current.delete(item.id);
          }}
          renderRightActions={() => renderRightActions(item.id)}
          onSwipeableOpen={() => {
            // Close any other open swipeable
            swipeableRefs.current.forEach((ref, key) => {
              if (key !== item.id && ref) ref.close();
            });
          }}
        >
          <TouchableOpacity
            style={[
              styles.notificationItem,
              {
                backgroundColor: theme.cardBackground,
                borderColor: theme.border,
                opacity: item.read ? 0.7 : 1,
              },
            ]}
            onPress={() => markAsRead(item.id)}
            activeOpacity={0.7}
          >
            <View style={styles.iconColumn}>
              {getIcon(item.type, item.read, theme)}
            </View>
            <View style={styles.contentColumn}>
              <Text
                style={[styles.title, { color: theme.text }]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              <Text
                style={[styles.message, { color: theme.textSecondary }]}
                numberOfLines={2}
              >
                {item.message}
              </Text>
              <Text style={[styles.timestamp, { color: theme.textSecondary }]}>
                {item.timestamp}
              </Text>
            </View>
            {!item.read && (
              <View
                style={[styles.unreadDot, { backgroundColor: theme.primary }]}
              />
            )}
          </TouchableOpacity>
        </Swipeable>
      </FadeIn>
    ),
    [theme, markAsRead, renderRightActions],
  );

  const getTabStyle = (tab: "all" | "unread") => ({
    backgroundColor: activeTab === tab ? theme.primary : "transparent",
    borderColor: activeTab === tab ? theme.primary : theme.border,
  });

  const getTabTextStyle = (tab: "all" | "unread") => ({
    color: activeTab === tab ? "#fff" : theme.textSecondary,
  });

  return (
    <>
      <StatusBar barStyle={"default"} />
      <MainContainer safe>
        <View style={[styles.screen]}>
          {/* Header */}
          <View
            style={[
              styles.header,
              {
                justifyContent:
                  unreadCount == 0 ? "flex-start" : "space-between",
                gap: unreadCount == 0 ? "9.5%" : 0,
              },
            ]}
          >
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backBtn}
            >
              <Ionicons name="chevron-back" size={24} color={theme.text} />
            </TouchableOpacity>

            <Text
              style={[
                styles.title,
                {
                  color: theme.text,
                  marginLeft: 70,
                },
              ]}
            >
              Notifications
            </Text>

            {unreadCount > 0 && (
              <TouchableOpacity
                style={styles.markAllBtn}
                onPress={markAllAsRead}
              >
                <Text style={[styles.markAllText, { color: theme.primary }]}>
                  Mark all read
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Tabs */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tab, getTabStyle("all")]}
              onPress={() => setActiveTab("all")}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, getTabTextStyle("all")]}>All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, getTabStyle("unread")]}
              onPress={() => setActiveTab("unread")}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, getTabTextStyle("unread")]}>
                Unread {unreadCount > 0 && `(${unreadCount})`}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Notifications List */}
          <FlatList
            data={filteredNotifications}
            keyExtractor={(item) => item.id}
            renderItem={renderNotification}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={theme.primary}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons
                  name="notifications-off-outline"
                  size={64}
                  color={theme.textSecondary + "50"}
                />
                <Text
                  style={[styles.emptyText, { color: theme.textSecondary }]}
                >
                  No {activeTab === "unread" ? "unread " : ""}notifications
                </Text>
              </View>
            }
          />
        </View>
      </MainContainer>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  backBtn: { padding: 4 },
  title: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  markAllBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  markAllText: {
    fontSize: 13,
    fontWeight: "600",
  },
  tabBar: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 30,
    backgroundColor: "transparent",
    gap: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 30,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
  },
  iconColumn: {
    marginRight: 12,
    width: 40,
    alignItems: "center",
  },
  contentColumn: {
    flex: 1,
  },
  // title: {
  //   fontSize: 15,
  //   fontWeight: "700",
  //   marginBottom: 4,
  // },
  message: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 6,
  },
  timestamp: {
    fontSize: 11,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 10,
  },
  deleteButton: {
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    height: "90%",
    // marginTop: 0,
    // marginBottom: 10,
    marginLeft: 10,
    borderRadius: 12,
  },
  deleteText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "500",
  },
});
