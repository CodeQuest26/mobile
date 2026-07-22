import { FadeIn } from "@/components/FadeIn";
import MainContainer from "@/components/MainContainer";
import OrderCard from "@/components/OrderCard";
import Colors from "@/constants/colors";
import { api, handleApiError } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

interface ApiOrder {
  id: string;
  jobId: string;
  bidId: string;
  smeId: string;
  factoryId: string;
  factoryName: string;
  smeName: string;
  agreedAmountGhs: number;
  platformFeeGhs: number;
  factoryPayoutGhs: number;
  status:
    | "PAYMENT_PENDING"
    | "IN_ESCROW"
    | "IN_PRODUCTION"
    | "QUALITY_CHECK"
    | "DELIVERED"
    | "COMPLETED"
    | "DISPUTED"
    | "REFUNDED"
    | "CANCELLED";
  qualityCheckDeadline?: string;
  deliveredAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  overallRating?: number | null;
}

interface JobInfo {
  title: string;
  deadline?: string;
  attachmentUrls?: string[];
}

// The shape expected by OrderCard
interface OrderCardData {
  id: string;
  job: string;
  sme: string;
  smeLogo: string | null;
  amount: string;
  milestone: number;
  milestoneLabel: string;
  dueIn: string;
  progress: number;
  urgent: boolean;
  jobImage?: string | null;
  rating?: number | null;
}

type TabType = "active" | "completed";

const ACTIVE_TAB_LABEL: Record<TabType, string> = {
  active: "active",
  completed: "completed",
};

export default function ManufacturerOrders() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme] || Colors.light;
  const isDark = colorScheme === "dark";
  const [activeTab, setActiveTab] = useState<TabType>("active");
  const [orders, setOrders] = useState<OrderCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState<string | null>(null);

  // Helper to map status to milestone number (0-4) and label
  const mapStatusToMilestone = (
    status: ApiOrder["status"],
  ): { milestone: number; label: string } => {
    const map: Record<
      ApiOrder["status"],
      { milestone: number; label: string }
    > = {
      PAYMENT_PENDING: { milestone: 0, label: "Awaiting Payment" },
      IN_ESCROW: { milestone: 0, label: "Payment Secured" },
      IN_PRODUCTION: { milestone: 1, label: "In Production" },
      QUALITY_CHECK: { milestone: 2, label: "Quality Check" },
      DELIVERED: { milestone: 3, label: "Delivered" },
      COMPLETED: { milestone: 4, label: "Completed" },
      DISPUTED: { milestone: 0, label: "Disputed" },
      REFUNDED: { milestone: 4, label: "Refunded" },
      CANCELLED: { milestone: 4, label: "Cancelled" },
    };
    return map[status] || { milestone: 0, label: "Unknown" };
  };

  // Helper to estimate progress (0-1) based on status
  const getProgress = (status: ApiOrder["status"]): number => {
    const progressMap: Record<ApiOrder["status"], number> = {
      PAYMENT_PENDING: 0.0,
      IN_ESCROW: 0.1,
      IN_PRODUCTION: 0.4,
      QUALITY_CHECK: 0.7,
      DELIVERED: 0.9,
      COMPLETED: 1.0,
      DISPUTED: 0.5,
      REFUNDED: 1.0,
      CANCELLED: 1.0,
    };
    return progressMap[status] || 0.0;
  };

  const computeDueInfo = (
    order: ApiOrder,
    jobInfo?: JobInfo,
  ): { dueIn: string; urgent: boolean } => {
    if (["COMPLETED", "REFUNDED", "CANCELLED"].includes(order.status)) {
      return { dueIn: "Completed", urgent: false };
    }
    if (order.status === "DELIVERED") {
      return { dueIn: "Awaiting confirmation", urgent: false };
    }

    const deadlineSource = order.qualityCheckDeadline || jobInfo?.deadline;
    if (deadlineSource) {
      const diff = new Date(deadlineSource).getTime() - Date.now();
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      if (days < 0) {
        return { dueIn: "Overdue", urgent: true };
      }
      if (days <= 3) {
        return { dueIn: `${days} day${days !== 1 ? "s" : ""}`, urgent: true };
      }
      return { dueIn: `${days} day${days !== 1 ? "s" : ""}`, urgent: false };
    }

    return { dueIn: "In progress", urgent: false };
  };

  // Transform a single API order to OrderCardData
  const transformOrder = (
    order: ApiOrder,
    jobInfoMap: Map<string, JobInfo>,
    ratingMap: Map<string, number>,
  ): OrderCardData => {
    const { milestone, label } = mapStatusToMilestone(order.status);
    const progress = getProgress(order.status);
    const jobInfo = jobInfoMap.get(order.jobId);
    const { dueIn, urgent } = computeDueInfo(order, jobInfo);

    const amount = `GH₵ ${order.agreedAmountGhs?.toFixed(2) || "0.00"}`;

    const job =
      jobInfo?.title || `Job #${order.jobId?.slice(0, 8) || "Unknown"}`;

    const rating =
      order.overallRating ?? ratingMap.get(order.id) ?? null;

    return {
      id: order.id,
      job,
      sme: order.smeName || "Unknown SME",
      smeLogo: null,
      amount,
      milestone,
      milestoneLabel: label,
      dueIn,
      progress,
      urgent,
      jobImage: jobInfo?.attachmentUrls?.[0] ?? null,
      rating,
    };
  };

  // job details
  const fetchJobDetails = async (
    jobIds: string[],
  ): Promise<Map<string, JobInfo>> => {
    const uniqueIds = [...new Set(jobIds.filter(Boolean))];
    const map = new Map<string, JobInfo>();

    if (uniqueIds.length === 0) return map;

    const results = await Promise.allSettled(
      uniqueIds.map((id) => api.get(`jobs/${id}`)),
    );

    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        const job = result.value.data;
        map.set(uniqueIds[index], {
          title: job?.title,
          deadline: job?.deadline,
          attachmentUrls: job?.attachmentUrls,
        });
      }
    });

    return map;
  };

  // Fetch orders from API.
  const fetchOrders = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await api.get("orders", {
        params: { page: 0, size: 1000 },
      });
      const apiOrders: ApiOrder[] = response.data.content || [];

      const jobInfoMap = await fetchJobDetails(apiOrders.map((o) => o.jobId));

      // Fetch reviews for completed orders that don't already have a rating
      const completedWithoutRating = apiOrders.filter(
        (o) =>
          o.status === "COMPLETED" &&
          o.overallRating == null,
      );
      const ratingMap = new Map<string, number>();
      if (completedWithoutRating.length > 0) {
        const reviewResults = await Promise.allSettled(
          completedWithoutRating.map((o) =>
            api.get(`reviews/${o.id}`).then((res) => ({ id: o.id, data: res.data })),
          ),
        );
        reviewResults.forEach((r) => {
          if (r.status === "fulfilled" && r.value.data?.overallRating) {
            ratingMap.set(r.value.id, r.value.data.overallRating);
          }
        });
      }

      const transformed = apiOrders.map((order) =>
        transformOrder(order, jobInfoMap, ratingMap),
      );
      setOrders(transformed);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError(handleApiError(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Filter orders based on activeTab.
  const filteredOrders = orders.filter((order) =>
    activeTab === "active" ? order.progress < 1.0 : order.progress >= 1.0,
  );

  const hasOrders = filteredOrders.length > 0;

  const getTabStyle = (tab: TabType) => ({
    backgroundColor: activeTab === tab ? theme.primary : "transparent",
    borderColor: activeTab === tab ? theme.primary : theme.border,
  });

  const getTabTextStyle = (tab: TabType) => ({
    color: activeTab === tab ? theme.onPrimary : theme.textSecondary,
  });

  return (
    <>
      <StatusBar barStyle={"default"} />

      <MainContainer safe>
        <View style={[styles.screen]}>
          {/* Header */}
          <View style={styles.header}>
            <Text
              style={[
                styles.title,
                { color: theme.text, flex: 1, marginLeft: 20 },
              ]}
            >
              My Orders
            </Text>
          </View>

          {/* Tab Bar */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tab, getTabStyle("active")]}
              onPress={() => setActiveTab("active")}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, getTabTextStyle("active")]}>
                Active
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, getTabStyle("completed")]}
              onPress={() => setActiveTab("completed")}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, getTabTextStyle("completed")]}>
                Completed
              </Text>
            </TouchableOpacity>
          </View>

          {/* Orders List */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => fetchOrders(true)}
                tintColor={theme.primary}
                colors={[theme.primary]}
              />
            }
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size={"small"} color={theme.primary} />
              </View>
            ) : error ? (
              <View style={styles.emptyState}>
                <Ionicons
                  name="alert-circle-outline"
                  size={64}
                  color={theme.error + "80"}
                />
                <Text style={[styles.emptyText, { color: theme.text }]}>
                  Couldn&apos;t load your orders
                </Text>
                <Text
                  style={[styles.errorSubtext, { color: theme.textSecondary }]}
                >
                  {error}
                </Text>
                <TouchableOpacity
                  onPress={() => fetchOrders()}
                  style={[styles.retryBtn, { borderColor: theme.primary }]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.retryBtnText, { color: theme.primary }]}>
                    Try Again
                  </Text>
                </TouchableOpacity>
              </View>
            ) : hasOrders ? (
              filteredOrders.map((order, index) => (
                <FadeIn key={order.id} delay={index * 50}>
                  <OrderCard order={order} theme={theme} delay={0} />
                </FadeIn>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons
                  name="cube-outline"
                  size={64}
                  color={theme.textSecondary + "50"}
                />
                <Text
                  style={[styles.emptyText, { color: theme.textSecondary }]}
                >
                  No {ACTIVE_TAB_LABEL[activeTab]} orders found
                </Text>
              </View>
            )}
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </MainContainer>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  filterBtn: {
    padding: 8,
  },
  tabBar: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginVertical: 16,
    backgroundColor: "transparent",
    gap: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tabText: {
    fontSize: 15,
    fontWeight: "600",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    gap: 12,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
  },
  errorSubtext: {
    fontSize: 13,
    textAlign: "center",
    marginTop: -6,
  },
  retryBtn: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
  },
  retryBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
});
