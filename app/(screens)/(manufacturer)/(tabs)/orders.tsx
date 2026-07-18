import { FadeIn } from "@/components/FadeIn";
import MainContainer from "@/components/MainContainer";
import OrderCard from "@/components/OrderCard";
import Colors from "@/constants/colors";
import { api } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

// Define the shape of an order as returned by the API
// Based on OrderDetailResponse from the OpenAPI spec
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
  qualityCheckDeadline?: string; // ISO date
  deliveredAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  jobTitle?: string;
}

// The shape expected by OrderCard
interface OrderCardData {
  id: string;
  job: string;
  sme: string;
  amount: string;
  milestone: number;
  milestoneLabel: string;
  dueIn: string;
  progress: number; // 0..1
  urgent: boolean;
}

type TabType = "active" | "completed";

export default function ManufacturerOrders() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme] || Colors.light;
  const isDark = colorScheme === "dark";
  const [activeTab, setActiveTab] = useState<TabType>("active");

  // State for real orders from API
  const [orders, setOrders] = useState<OrderCardData[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch orders from API
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get("orders", {
        params: {
          page: 0,
          size: 1000,
        },
      });
      // response.data should be PagedResponseOrderDetailResponse (not in spec, but we'll assume)
      const apiOrders: ApiOrder[] = response.data.content || [];

      console.log(response?.data);

      // Transform to OrderCardData
      const transformed = apiOrders.map((order) => transformOrder(order));
      setOrders(transformed);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

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

  // Helper to compute dueIn text and urgency
  const computeDueInfo = (
    order: ApiOrder,
  ): { dueIn: string; urgent: boolean } => {
    // If completed/refunded/cancelled, show "Completed"
    if (["COMPLETED", "REFUNDED", "CANCELLED"].includes(order.status)) {
      return { dueIn: "Completed", urgent: false };
    }
    // If DELIVERED, show "Awaiting confirmation" maybe?
    if (order.status === "DELIVERED") {
      return { dueIn: "Awaiting confirmation", urgent: false };
    }
    // Use qualityCheckDeadline if available, else fallback to createdAt + some days? Not ideal.
    // Actually we don't have a clear deadline field in OrderDetailResponse.
    // We could use the job deadline, but we don't have it here.
    // As a fallback, we'll use the qualityCheckDeadline if present, else a dummy.
    if (order.qualityCheckDeadline) {
      const diff = new Date(order.qualityCheckDeadline).getTime() - Date.now();
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      if (days <= 3)
        return { dueIn: `${days} day${days !== 1 ? "s" : ""}`, urgent: true };
      return { dueIn: `${days} day${days !== 1 ? "s" : ""}`, urgent: false };
    }
    // No deadline, return generic
    return { dueIn: "In progress", urgent: false };
  };

  // Transform a single API order to OrderCardData
  const transformOrder = (order: ApiOrder): OrderCardData => {
    const { milestone, label } = mapStatusToMilestone(order.status);
    const progress = getProgress(order.status);
    const { dueIn, urgent } = computeDueInfo(order);

    // Amount as currency string
    const amount = `GH₵ ${order.agreedAmountGhs?.toFixed(2) || "0.00"}`;

    // Job title: try to use order.jobTitle if available, else use jobId as fallback
    const job =
      order.jobTitle || `Job #${order.jobId?.slice(0, 8) || "Unknown"}`;

    return {
      id: order.id,
      job,
      sme: order.smeName || "Unknown SME",
      amount,
      milestone,
      milestoneLabel: label,
      dueIn,
      progress,
      urgent,
    };
  };

  // Filter orders based on activeTab
  const filteredOrders = orders.filter((order) => {
    // Active: statuses not completed/refunded/cancelled (we use progress < 1 as active)
    // But we have milestone 4 for completed, so we can filter by milestone < 4
    // However, DISPUTED might be active? We'll consider it active if progress < 1.
    if (activeTab === "active") {
      return order.progress < 1.0;
    } else {
      return order.progress >= 1.0;
    }
  });

  const hasOrders = filteredOrders.length > 0;

  const getTabStyle = (tab: TabType) => ({
    backgroundColor: activeTab === tab ? theme.primary : "transparent",
    borderColor: activeTab === tab ? theme.primary : theme.border,
  });

  const getTabTextStyle = (tab: TabType) => ({
    color: activeTab === tab ? theme.onPrimary : theme.textSecondary,
  });

  const handleFilterBtn = () => {
    router.push("/filterScreen");
  };

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
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={{ color: theme.textSecondary }}>
                  Loading orders...
                </Text>
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
                  No {activeTab} orders found
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
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "500",
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
});
