import { FadeIn } from "@/components/FadeIn";
import MainContainer from "@/components/MainContainer";
import Colors from "@/constants/colors";
import { api } from "@/services/api";
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
  useColorScheme,
  View,
} from "react-native";
import { RectButton, Swipeable } from "react-native-gesture-handler";
import Animated, { LinearTransition } from "react-native-reanimated";

const { width } = Dimensions.get("window");

// ─── Types ──────────────────────────────────────────────────────────────────
interface ApiNotification {
  id: string;
  title: string;
  message: string;
  createdAt: string; // ISO date
  read: boolean;
  type?: "order" | "bid" | "payment" | "system"; // if not provided, default to "system"
}

// Internal shape (with formatted timestamp)
interface Notification extends ApiNotification {
  timestamp: string; // formatted relative time
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getTimeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
};

const getIconName = (type?: string) => {
  switch (type) {
    case "order":
      return "cube-outline";
    case "bid":
      return "hammer-outline";
    case "payment":
      return "wallet-outline";
    case "system":
      return "settings-outline";
    default:
      return "notifications-outline";
  }
};

// ─── Main Screen ────────────────────────────────────────────────────────────
export default function NotificationsScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"] || Colors.light;
  const isDark = colorScheme === "dark";

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");
  const [loading, setLoading] = useState(true);

  const swipeableRefs = useRef(new Map<string, Swipeable>());

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const response = await api.get("/api/v1/notifications", {
        params: { page: 0, size: 100 },
      });
      const items: ApiNotification[] = response.data.content || [];
      const formatted: Notification[] = items.map((n) => ({
        ...n,
        timestamp: getTimeAgo(n.createdAt),
      }));
      setNotifications(formatted);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Mark as read
  const markAsRead = useCallback(async (id: string) => {
    try {
      await api.patch(`/api/v1/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  }, []);

  // Delete
  const deleteNotification = useCallback(async (id: string) => {
    try {
      await api.delete(`/api/v1/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    const unread = notifications.filter((n) => !n.read);
    if (unread.length === 0) return;
    Alert.alert(
      "Clear all notifications",
      `Clear all ${unread.length} active updates?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          onPress: async () => {
            try {
              await api.patch("/api/v1/notifications/read-all");
              setNotifications((prev) =>
                prev.map((n) => ({ ...n, read: true })),
              );
            } catch (error) {
              console.error("Failed to mark all as read:", error);
            }
          },
        },
      ],
    );
  }, [notifications]);

  // Pull-to-refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications();
  }, [fetchNotifications]);

  // Derived data
  const activeUnread = notifications.filter((n) => !n.read);
  const unreadCount = activeUnread.length;

  const filteredNotifications =
    activeTab === "all"
      ? activeUnread
      : activeUnread.filter((n) => n.type === "order");

  const renderRightActions = useCallback(
    (id: string) => {
      return (
        <RectButton
          style={[styles.deleteButton, { backgroundColor: theme.error }]}
          onPress={() => deleteNotification(id)}
        >
          <Ionicons name="trash-outline" size={20} color={theme.onPrimary} />
          <Text style={[styles.deleteText, { color: theme.onPrimary }]}>
            Delete
          </Text>
        </RectButton>
      );
    },
    [deleteNotification, isDark],
  );

  const renderNotification = useCallback(
    ({ item, index }: { item: Notification; index: number }) => {
      return (
        <Animated.View layout={LinearTransition.springify().mass(0.8)}>
          <FadeIn delay={index * 15}>
            <Swipeable
              ref={(ref) => {
                if (ref) swipeableRefs.current.set(item.id, ref);
                else swipeableRefs.current.delete(item.id);
              }}
              renderRightActions={() => renderRightActions(item.id)}
              onSwipeableOpen={() => {
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
                  },
                ]}
                onPress={() => markAsRead(item.id)}
                activeOpacity={0.85}
              >
                <View style={styles.iconContainer}>
                  <Ionicons
                    name={getIconName(item.type) as any}
                    size={18}
                    color={theme.text}
                  />
                </View>

                <View style={styles.contentColumn}>
                  <View style={styles.contentRowHeader}>
                    <Text
                      style={[styles.itemTitle, { color: theme.text }]}
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>
                    <Text
                      style={[
                        styles.timestamp,
                        { color: theme.textSecondary + "75" },
                      ]}
                    >
                      {item.timestamp}
                    </Text>
                  </View>
                  <Text
                    style={[styles.message, { color: theme.textSecondary }]}
                    numberOfLines={2}
                  >
                    {item.message}
                  </Text>
                </View>
              </TouchableOpacity>
            </Swipeable>
            <View
              style={[
                styles.itemDivider,
                { backgroundColor: theme.border + "30" },
              ]}
            />
          </FadeIn>
        </Animated.View>
      );
    },
    [theme, markAsRead, renderRightActions],
  );

  return (
    <>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        translucent
        backgroundColor="transparent"
      />
      <MainContainer>
        <View style={[styles.screen, { backgroundColor: theme.background }]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backBtn}
            >
              <Ionicons name="chevron-back" size={24} color={theme.text} />
            </TouchableOpacity>

            <Text style={[styles.headerTitle, { color: theme.text }]}>
              Notifications
            </Text>

            {unreadCount > 0 ? (
              <TouchableOpacity
                style={styles.markAllBtn}
                onPress={markAllAsRead}
              >
                <Text style={[styles.markAllText, { color: theme.primary }]}>
                  Clear all
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={{ width: 40 }} />
            )}
          </View>

          {/* Tab Bar */}
          <View
            style={[styles.tabContainerPill, { borderColor: theme.border }]}
          >
            <TouchableOpacity
              style={[
                styles.tabPill,
                activeTab === "all" && {
                  backgroundColor: theme.primary,
                },
              ]}
              onPress={() => setActiveTab("all")}
              activeOpacity={0.9}
            >
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color:
                      activeTab === "all"
                        ? theme.onPrimary
                        : theme.textSecondary,
                    fontWeight: activeTab === "all" ? "700" : "500",
                  },
                ]}
              >
                Inbox {unreadCount > 0 && `(${unreadCount})`}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabPill,
                activeTab === "unread" && {
                  backgroundColor: theme.primary,
                },
              ]}
              onPress={() => setActiveTab("unread")}
              activeOpacity={0.9}
            >
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color:
                      activeTab === "unread"
                        ? theme.onPrimary
                        : theme.textSecondary,
                    fontWeight: activeTab === "unread" ? "700" : "500",
                  },
                ]}
              >
                Orders
              </Text>
            </TouchableOpacity>
          </View>

          {/* List Feed */}
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
                tintColor={theme.text}
              />
            }
            ListEmptyComponent={
              loading ? (
                <View style={styles.emptyState}>
                  <Text style={{ color: theme.textSecondary }}>
                    Loading notifications...
                  </Text>
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <View
                    style={[
                      styles.emptyIconCircle,
                      { borderColor: theme.border },
                    ]}
                  >
                    <Ionicons
                      name="checkmark-outline"
                      size={24}
                      color={theme.text}
                    />
                  </View>
                  <Text style={[styles.emptyText, { color: theme.text }]}>
                    Inbox is empty
                  </Text>
                  <Text
                    style={[
                      styles.emptySubtext,
                      { color: theme.textSecondary },
                    ]}
                  >
                    Tapping modifications updates them out of your immediate
                    workflow grid.
                  </Text>
                </View>
              )
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
    paddingTop: 54,
    paddingBottom: 14,
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.4,
  },
  markAllBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  markAllText: {
    fontSize: 13,
    fontWeight: "600",
  },
  tabContainerPill: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 24,
    borderWidth: 1,
  },
  tabPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  tabLabel: {
    fontSize: 13,
    letterSpacing: -0.1,
  },
  listContent: {
    paddingBottom: 40,
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  contentColumn: {
    flex: 1,
  },
  contentRowHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
    marginRight: 8,
    letterSpacing: -0.1,
  },
  message: {
    fontSize: 13,
    lineHeight: 18,
  },
  timestamp: {
    fontSize: 11,
    fontWeight: "400",
  },
  itemDivider: {
    height: 1,
    marginHorizontal: 16,
  },
  deleteButton: {
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    height: "100%",
  },
  deleteText: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 120,
    paddingHorizontal: 40,
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 6,
  },
  emptySubtext: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
  },
});
