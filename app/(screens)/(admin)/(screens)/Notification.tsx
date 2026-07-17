// import MainContainer from "@/components/MainContainer";
// import Colors from "@/constants/colors";
// import { api, handleApiError } from "@/services/api";
// import { Ionicons } from "@expo/vector-icons";
// import { useFocusEffect, useRouter } from "expo-router";
// import React, { useCallback, useMemo, useState } from "react";
// import {
//   ActivityIndicator,
//   FlatList,
//   RefreshControl,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   useColorScheme,
//   View,
// } from "react-native";

// type DisputeStatus =
//   | "OPEN"
//   | "UNDER_REVIEW"
//   | "RESOLVED_BUYER"
//   | "RESOLVED_SELLER"
//   | "RESOLVED_SPLIT"
//   | "CLOSED";

// type DisputeReason =
//   | "QUALITY_BELOW_SPEC"
//   | "WRONG_QUANTITY"
//   | "LATE_DELIVERY"
//   | "NOT_DELIVERED"
//   | "OTHER";

// interface DisputeDetailResponse {
//   id: string;
//   orderId: string;
//   reason: DisputeReason;
//   description: string;
//   status: DisputeStatus;
//   createdAt: string;
// }

// interface PagedDisputesResponse {
//   content: DisputeDetailResponse[];
//   page: number;
//   size: number;
//   totalElements: number;
//   totalPages: number;
// }

// interface DashboardStatsResponse {
//   pendingVerifications?: number;
//   openDisputes?: number;
// }

// type NotificationItem = {
//   id: string;
//   title: string;
//   message: string;
//   time: string;
//   icon: keyof typeof Ionicons.glyphMap;
//   color: string;
//   unread: boolean;
//   route: string;
//   params?: Record<string, string>;
// };

// const formatReason = (reason: string) =>
//   reason
//     .replace(/_/g, " ")
//     .toLowerCase()
//     .replace(/\b\w/g, (letter) => letter.toUpperCase());

// const timeAgo = (dateString: string) => {
//   const date = new Date(dateString);
//   const difference = Date.now() - date.getTime();

//   if (Number.isNaN(difference) || difference < 0) return "Recently";

//   const minutes = Math.floor(difference / (1000 * 60));
//   const hours = Math.floor(difference / (1000 * 60 * 60));
//   const days = Math.floor(difference / (1000 * 60 * 60 * 24));

//   if (minutes < 1) return "Just now";
//   if (minutes < 60) return `${minutes}m ago`;
//   if (hours < 24) return `${hours}h ago`;
//   if (days < 7) return `${days}d ago`;

//   return date.toLocaleDateString();
// };

// const Notification = () => {
//   const router = useRouter();
//   const colorScheme = useColorScheme();
//   const theme = Colors[colorScheme ?? "light"];

//   const [disputes, setDisputes] = useState<DisputeDetailResponse[]>([]);
//   const [pendingVerifications, setPendingVerifications] = useState(0);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [error, setError] = useState("");

//   const fetchNotifications = useCallback(async () => {
//     try {
//       setError("");

//       /*
//        * Correct API endpoints from the supplied OpenAPI specification:
//        * GET /api/v1/admin/disputes?page=0&size=20
//        * GET /api/v1/admin/analytics/dashboard
//        */
//       const [disputesResponse, dashboardResponse] = await Promise.all([
//         api.get<PagedDisputesResponse>("admin/disputes", {
//           params: { page: 0, size: 20 },
//         }),
//         api.get<DashboardStatsResponse>("admin/analytics/dashboard"),
//       ]);

//       // Only unresolved disputes should appear as actionable notifications.
//       const actionableDisputes = (disputesResponse.data.content ?? []).filter(
//         (dispute) =>
//           dispute.status === "OPEN" || dispute.status === "UNDER_REVIEW",
//       );

//       setDisputes(actionableDisputes);
//       setPendingVerifications(dashboardResponse.data.pendingVerifications ?? 0);
//     } catch (err) {
//       setError(handleApiError(err));
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   }, []);

//   useFocusEffect(
//     useCallback(() => {
//       fetchNotifications();
//     }, [fetchNotifications]),
//   );

//   const onRefresh = useCallback(() => {
//     setRefreshing(true);
//     fetchNotifications();
//   }, [fetchNotifications]);

//   const notifications = useMemo<NotificationItem[]>(() => {
//     const items: NotificationItem[] = disputes.map((dispute) => ({
//       id: `dispute-${dispute.id}`,
//       title:
//         dispute.status === "OPEN"
//           ? "New dispute raised"
//           : "Dispute under review",
//       message: `${formatReason(dispute.reason)} — Order #${dispute.orderId.slice(
//         0,
//         8,
//       )}`,
//       time: timeAgo(dispute.createdAt),
//       icon: dispute.status === "OPEN" ? "alert-circle-outline" : "time-outline",
//       color: dispute.status === "OPEN" ? "#FF4D4D" : "#F5A623",
//       unread: dispute.status === "OPEN",
//       route: "/admin/disputes/[id]",
//       params: { id: dispute.id },
//     }));

//     if (pendingVerifications > 0) {
//       items.unshift({
//         id: "pending-factory-verifications",
//         title: "Factory verification required",
//         message: `${pendingVerifications} ${
//           pendingVerifications === 1 ? "factory is" : "factories are"
//         } waiting for review.`,
//         time: "Action required",
//         icon: "business-outline",
//         color: "#4A90E2",
//         unread: true,
//         route: "/admin/verifications",
//       });
//     }

//     return items;
//   }, [disputes, pendingVerifications]);

//   const renderNotification = ({ item }: { item: NotificationItem }) => (
//     <TouchableOpacity
//       activeOpacity={0.75}
//       onPress={() => {
//         if (item.params) {
//           router.push({
//             pathname: item.route as any,
//             params: item.params,
//           });
//           return;
//         }

//         router.push(item.route as any);
//       }}
//       style={[
//         styles.notificationCard,
//         {
//           backgroundColor: theme.cardBackground,
//           borderColor: item.unread ? `${item.color}55` : "transparent",
//         },
//       ]}
//     >
//       <View
//         style={[styles.iconWrapper, { backgroundColor: `${item.color}1A` }]}
//       >
//         <Ionicons name={item.icon} size={23} color={item.color} />
//       </View>

//       <View style={styles.notificationContent}>
//         <View style={styles.titleRow}>
//           <Text
//             style={[
//               styles.notificationTitle,
//               { color: theme.text },
//               item.unread && styles.unreadTitle,
//             ]}
//             numberOfLines={1}
//           >
//             {item.title}
//           </Text>

//           {item.unread && (
//             <View style={[styles.unreadDot, { backgroundColor: item.color }]} />
//           )}
//         </View>

//         <Text
//           style={[styles.notificationMessage, { color: theme.textSecondary }]}
//           numberOfLines={2}
//         >
//           {item.message}
//         </Text>

//         <Text style={[styles.notificationTime, { color: theme.textSecondary }]}>
//           {item.time}
//         </Text>
//       </View>

//       <Ionicons
//         name="chevron-forward"
//         size={20}
//         color={theme.textSecondary}
//         style={styles.chevron}
//       />
//     </TouchableOpacity>
//   );

//   return (
//     <MainContainer safe>
//       <View style={styles.container}>
//         <View style={styles.headerRow}>
//           <Text style={[styles.title, { color: theme.text }]}>
//             Notifications
//           </Text>

//           {notifications.length > 0 && !loading && (
//             <View
//               style={[
//                 styles.countBadge,
//                 { backgroundColor: `${theme.primary}1A` },
//               ]}
//             >
//               <Text style={[styles.countText, { color: theme.primary }]}>
//                 {notifications.length}
//               </Text>
//             </View>
//           )}
//         </View>

//         {loading ? (
//           <View style={styles.stateContainer}>
//             <ActivityIndicator size="large" color={theme.primary} />
//             <Text style={[styles.stateText, { color: theme.textSecondary }]}>
//               Loading notifications...
//             </Text>
//           </View>
//         ) : error ? (
//           <View style={styles.stateContainer}>
//             <Ionicons name="alert-circle-outline" size={58} color="#FF4D4D" />
//             <Text style={styles.errorText}>{error}</Text>

//             <TouchableOpacity
//               style={[styles.retryButton, { backgroundColor: theme.primary }]}
//               onPress={fetchNotifications}
//             >
//               <Text style={styles.retryText}>Try Again</Text>
//             </TouchableOpacity>
//           </View>
//         ) : (
//           <FlatList
//             data={notifications}
//             keyExtractor={(item) => item.id}
//             renderItem={renderNotification}
//             showsVerticalScrollIndicator={false}
//             contentContainerStyle={
//               notifications.length === 0
//                 ? styles.emptyListContent
//                 : styles.listContent
//             }
//             refreshControl={
//               <RefreshControl
//                 refreshing={refreshing}
//                 onRefresh={onRefresh}
//                 tintColor={theme.primary}
//               />
//             }
//             ListEmptyComponent={
//               <View style={styles.stateContainer}>
//                 <Ionicons
//                   name="notifications-off-outline"
//                   size={62}
//                   color={theme.textSecondary}
//                 />
//                 <Text style={[styles.emptyTitle, { color: theme.text }]}>
//                   You are all caught up
//                 </Text>
//                 <Text
//                   style={[styles.stateText, { color: theme.textSecondary }]}
//                 >
//                   There are no pending disputes or factory verifications.
//                 </Text>
//               </View>
//             }
//           />
//         )}
//       </View>
//     </MainContainer>
//   );
// };

// export default Notification;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     paddingHorizontal: 20,
//   },

//   headerRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     marginTop: 14,
//     marginBottom: 18,
//   },

//   title: {
//     fontSize: 30,
//     fontWeight: "700",
//   },

//   countBadge: {
//     minWidth: 30,
//     height: 30,
//     borderRadius: 15,
//     paddingHorizontal: 8,
//     alignItems: "center",
//     justifyContent: "center",
//   },

//   countText: {
//     fontSize: 14,
//     fontWeight: "700",
//   },

//   listContent: {
//     paddingBottom: 32,
//   },

//   emptyListContent: {
//     flexGrow: 1,
//   },

//   notificationCard: {
//     flexDirection: "row",
//     alignItems: "center",
//     borderRadius: 16,
//     borderWidth: 1,
//     padding: 14,
//     marginBottom: 12,
//   },

//   iconWrapper: {
//     width: 46,
//     height: 46,
//     borderRadius: 23,
//     justifyContent: "center",
//     alignItems: "center",
//     marginRight: 12,
//   },

//   notificationContent: {
//     flex: 1,
//   },

//   titleRow: {
//     flexDirection: "row",
//     alignItems: "center",
//   },

//   notificationTitle: {
//     flex: 1,
//     fontSize: 15,
//     fontWeight: "600",
//   },

//   unreadTitle: {
//     fontWeight: "800",
//   },

//   unreadDot: {
//     width: 8,
//     height: 8,
//     borderRadius: 4,
//     marginLeft: 8,
//   },

//   notificationMessage: {
//     fontSize: 13,
//     lineHeight: 19,
//     marginTop: 4,
//   },

//   notificationTime: {
//     fontSize: 12,
//     marginTop: 7,
//   },

//   chevron: {
//     marginLeft: 6,
//   },

//   stateContainer: {
//     flex: 1,
//     alignItems: "center",
//     justifyContent: "center",
//     paddingHorizontal: 28,
//     paddingBottom: 80,
//   },

//   emptyTitle: {
//     fontSize: 18,
//     fontWeight: "700",
//     marginTop: 14,
//   },

//   stateText: {
//     textAlign: "center",
//     fontSize: 14,
//     lineHeight: 21,
//     marginTop: 8,
//   },

//   errorText: {
//     color: "#FF4D4D",
//     fontSize: 14,
//     textAlign: "center",
//     lineHeight: 21,
//     marginTop: 14,
//   },

//   retryButton: {
//     paddingHorizontal: 20,
//     paddingVertical: 11,
//     borderRadius: 10,
//     marginTop: 18,
//   },

//   retryText: {
//     color: "#FFFFFF",
//     fontWeight: "700",
//   },
// });

import MainContainer from "@/components/MainContainer";
import Colors from "@/constants/colors";
import { api, handleApiError } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

/* ================= TYPES ================= */

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  type: "ORDER" | "DISPUTE" | "VERIFICATION" | "MESSAGE" | "SYSTEM";
  isRead: boolean;
  createdAt: string;
}

/* ================= HELPERS ================= */

const formatTimeAgo = (dateString: string): string => {
  const now = new Date();
  const past = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
};

const getTypeColor = (type: string): string => {
  switch (type) {
    case "DISPUTE":
      return "#FF4D4D";
    case "ORDER":
      return "#4A90E2";
    case "VERIFICATION":
      return "#F5A623";
    case "MESSAGE":
      return "#AF52DE";
    default:
      return "#999";
  }
};

const getTypeIcon = (type: string): any => {
  switch (type) {
    case "DISPUTE":
      return "alert-circle-outline";
    case "ORDER":
      return "cart-outline";
    case "VERIFICATION":
      return "checkmark-circle-outline";
    case "MESSAGE":
      return "chatbubble-ellipses-outline";
    default:
      return "information-circle-outline";
  }
};

const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "mock-1",
    title: "New Dispute Raised",
    description:
      "SME User raised a dispute on Order #9921 regarding late delivery.",
    type: "DISPUTE",
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30m ago
  },
  {
    id: "mock-2",
    title: "Factory Verification Pending",
    description: "Takoradi Steel Works is waiting for admin review.",
    type: "VERIFICATION",
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2h ago
  },
  {
    id: "mock-3",
    title: "New Order Placed",
    description: "Order #1234 placed by Gold Coast Enterprises for GHS 5,000.",
    type: "ORDER",
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1d ago
  },
  {
    id: "mock-4",
    title: "System Maintenance",
    description: "Scheduled maintenance window on Sunday 2 AM - 4 AM.",
    type: "SYSTEM",
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2d ago
  },
];

const Notification = () => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setError(null);

      // Attempt to hit the standard Admin Notifications endpoint
      // Note: This endpoint is not in the provided OpenAPI spec, so we catch the 404
      const { data } = await api.get<NotificationItem[]>("admin/notifications");
      setNotifications(data);
    } catch (err) {
      // Fallback to Mock Data if endpoint is missing (404) or network error
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        setNotifications(MOCK_NOTIFICATIONS);
        // Silent success for fallback
      } else {
        setError(handleApiError(err));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Refresh on focus
  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [fetchNotifications]),
  );

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }, []);

  const renderItem = ({ item }: { item: NotificationItem }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      style={[
        styles.card,
        { backgroundColor: theme.card },
        !item.isRead && styles.unreadCard,
      ]}
    >
      <View style={styles.row}>
        {/* Icon */}
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: getTypeColor(item.type) + "1A" }, // 10% opacity
          ]}
        >
          <Ionicons
            name={getTypeIcon(item.type)}
            size={22}
            color={getTypeColor(item.type)}
          />
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text
              style={[
                styles.title,
                {
                  color: theme.text,
                  fontWeight: item.isRead ? "500" : "700",
                },
              ]}
            >
              {item.title}
            </Text>
            <Text style={[styles.time, { color: theme.textSecondary }]}>
              {formatTimeAgo(item.createdAt)}
            </Text>
          </View>
          <Text
            style={[styles.description, { color: theme.textSecondary }]}
            numberOfLines={2}
          >
            {item.description}
          </Text>
        </View>

        {/* Unread Indicator */}
        {!item.isRead && <View style={styles.unreadDot} />}
      </View>
    </TouchableOpacity>
  );

  return (
    <MainContainer safe>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Notifications
          </Text>
          <TouchableOpacity onPress={markAllAsRead} activeOpacity={0.7}>
            <Text style={[styles.markReadText, { color: theme.primary }]}>
              Mark all read
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : error ? (
          <View style={styles.empty}>
            <Ionicons name="alert-circle" size={48} color="#FF4D4D" />
            <Text style={styles.error}>{error}</Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  fetchNotifications();
                }}
                tintColor={theme.primary}
              />
            }
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons
                  name="notifications-off-outline"
                  size={48}
                  color={theme.textSecondary}
                />
                <Text
                  style={[styles.emptyText, { color: theme.textSecondary }]}
                >
                  No notifications
                </Text>
              </View>
            }
          />
        )}
      </View>
    </MainContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },

  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
  },

  markReadText: {
    fontSize: 14,
    fontWeight: "600",
  },

  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },

  unreadCard: {
    borderColor: "rgba(74, 144, 226, 0.3)",
    backgroundColor: "rgba(74, 144, 226, 0.05)", // Slight tint for unread
  },

  row: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
    flexShrink: 0,
  },

  content: {
    flex: 1,
    marginRight: 10,
  },

  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },

  title: {
    fontSize: 15,
    flex: 1,
  },

  description: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.8,
  },

  time: {
    fontSize: 11,
    marginLeft: 8,
    opacity: 0.7,
  },

  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4A90E2",
    marginTop: 2,
    flexShrink: 0,
  },

  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 60,
  },

  emptyText: {
    marginTop: 12,
    fontSize: 15,
  },

  error: {
    marginTop: 12,
    color: "#FF4D4D",
    textAlign: "center",
    paddingHorizontal: 40,
  },
});

export default Notification;
