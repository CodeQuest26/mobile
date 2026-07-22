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
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

import ActivityItem from "../(screens)/ActivityItem";
import AdminKPICard from "../(screens)/AdminKPI";

/* ================= TYPES FROM OPENAPI SPEC ================= */

interface DashboardStatsResponse {
  totalUsers?: number;
  verifiedFactories?: number;
  pendingVerifications?: number;
  totalOrders?: number;
  completedOrders?: number;
  openDisputes?: number;
  gmvLast30Days?: number;
  feeRevenueLast30Days?: number;
  escrowSuccessRate?: number;
}

interface DisputeDetailResponse {
  id: string;
  orderId: string;
  raisedById: string;
  reason:
    | "QUALITY_BELOW_SPEC"
    | "WRONG_QUANTITY"
    | "LATE_DELIVERY"
    | "NOT_DELIVERED"
    | "OTHER";
  description: string;
  evidenceUrls?: string[];
  status:
    | "OPEN"
    | "UNDER_REVIEW"
    | "RESOLVED_BUYER"
    | "RESOLVED_SELLER"
    | "RESOLVED_SPLIT"
    | "CLOSED";
  assignedAdminId?: string;
  adminNotes?: string;
  resolutionAmountGhs?: number;
  resolvedAt?: string;
  createdAt: string;
}

interface PagedResponseDisputeDetailResponse {
  content: DisputeDetailResponse[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

/* ================= HELPER FUNCTIONS ================= */

const formatCurrency = (amount?: number): string => {
  if (amount == null) return "GHS 0.00";
  if (amount >= 1000) {
    return `GHS ${(amount / 1000).toFixed(1)}k`;
  }
  return `GHS ${amount.toLocaleString()}`;
};

const formatReason = (reason: string): string => {
  return reason
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase());
};

const formatTimeAgo = (dateString: string): string => {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
};

const AdminHomeScreen = () => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];

  const [stats, setStats] = useState<DashboardStatsResponse | null>(null);
  const [disputes, setDisputes] = useState<DisputeDetailResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /* ================= API FETCHING ================= */

  const fetchData = useCallback(async () => {
    setErrorMessage(null);
    try {
      // Fetch both Dashboard Stats and Disputes concurrently
      const [statsRes, disputesRes] = await Promise.all([
        api.get<DashboardStatsResponse>("admin/analytics/dashboard"),
        api.get<PagedResponseDisputeDetailResponse>("admin/disputes", {
          params: { page: 0, size: 5 },
        }),
      ]);

      setStats(statsRes.data);
      setDisputes(disputesRes.data?.content || []);
    } catch (err) {
      setErrorMessage(handleApiError(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Reload data every time screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  /* ================= DYNAMIC KPI DATA ================= */

  const kpiCards = [
    {
      id: "1",
      title: "Total Users",
      value: stats?.totalUsers?.toLocaleString() ?? "0",
      icon: "people-outline",
      route: "/(admin)/userManagement",
    },
    {
      id: "2",
      title: "Pending Factories",
      value: stats?.pendingVerifications?.toString() ?? "0",
      icon: "time-outline",
      route: "/(admin)/verification",
    },
    {
      id: "3",
      title: "Open Disputes",
      value: stats?.openDisputes?.toString() ?? "0",
      color: theme.error,
      icon: "alert-circle-outline",
      // Was "../(screens)/Disputes" — inconsistent with the "See All"
      // link and the dispute-list screen below. Standardized on the
      // same route used everywhere else disputes are linked.
      route: "/admin/disputes",
    },
    {
      id: "4",
      title: "30D Fee Revenue",
      value: formatCurrency(stats?.feeRevenueLast30Days),
      icon: "cash-outline",
      route: "../(screens)/Revenue",
    },
  ];

  return (
    <MainContainer safe>
      {/* Top Header Bar with Title and Notification Icon */}
      <View style={styles.headerRow}>
        <Text style={[styles.header, { color: theme.text }]}>Dashboard</Text>

        <TouchableOpacity
          style={[
            styles.notificationBtn,
            { backgroundColor: theme.cardBackground },
          ]}
          onPress={() => router.push("../(screens)/Notification" as any)}
          activeOpacity={0.7}
        >
          <Ionicons name="notifications-outline" size={24} color={theme.text} />
          {/* Unread indicator dot */}
          <View style={styles.notificationBadge} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
      >
        {/* Error Banner — re-enabled; this was silently swallowing
            fetch failures with no user-visible feedback. */}
        {errorMessage && (
          <View style={styles.errorContainer}>
            <Ionicons name="warning-outline" size={18} color="#FF4D4D" />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {/* Loading Indicator for Initial Load */}
        {loading && !refreshing ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="small" color={theme.icon} />
          </View>
        ) : (
          <>
            {/* KPI Cards Section */}
            <FlatList
              horizontal
              data={kpiCards}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.kpiList}
              renderItem={({ item }) => (
                <View style={styles.kpiWrapper}>
                  <AdminKPICard
                    title={item.title}
                    value={item.value}
                    color={item.color}
                    icon={item.icon}
                    onPress={() => router.push(item.route as any)}
                  />
                </View>
              )}
            />

            {/* Disputes Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Recent Disputes
                </Text>

                <TouchableOpacity
                  onPress={() => router.push("/admin/disputes" as any)}
                >
                  <Text style={[styles.seeAllText, { color: theme.primary }]}>
                    See All ({stats?.openDisputes ?? disputes.length})
                  </Text>
                </TouchableOpacity>
              </View>

              {disputes.length > 0 ? (
                disputes.map((dispute) => (
                  <TouchableOpacity
                    key={dispute.id}
                    activeOpacity={0.8}
                    onPress={() =>
                      router.push({
                        pathname: "/admin/disputes/[id]" as any,

                        params: {
                          id: dispute.id,
                          dispute: JSON.stringify(dispute),
                        },
                      })
                    }
                  >
                    <ActivityItem
                      title={formatReason(dispute.reason)}
                      description={`Order #${dispute.orderId.substring(0, 8)} - ${dispute.description}`}
                      time={formatTimeAgo(dispute.createdAt)}
                      icon={
                        dispute.status === "RESOLVED_BUYER" ||
                        dispute.status === "RESOLVED_SELLER" ||
                        dispute.status === "RESOLVED_SPLIT"
                          ? "checkmark-circle"
                          : "alert-circle"
                      }
                      color={
                        dispute.status === "OPEN"
                          ? theme.error
                          : dispute.status === "UNDER_REVIEW"
                            ? theme.warning
                            : theme.primary
                      }
                    />
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.emptyContainer}>
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={36}
                    color={theme.textSecondary}
                  />
                  <Text
                    style={[styles.emptyText, { color: theme.textSecondary }]}
                  >
                    No pending disputes found.
                  </Text>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </MainContainer>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 16,
  },

  header: {
    fontSize: 28,
    fontWeight: "700",
  },

  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  notificationBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF4D4D",
  },

  loaderContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },

  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF4D4D1A",
    marginHorizontal: 20,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },

  errorText: {
    color: "#FF4D4D",
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
  },

  kpiList: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },

  kpiWrapper: {
    marginRight: 14,
  },

  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },

  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
  },

  seeAllText: {
    fontSize: 14,
    fontWeight: "600",
  },

  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    gap: 8,
  },

  emptyText: {
    fontSize: 14,
  },
});

export default AdminHomeScreen;
