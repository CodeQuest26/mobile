import MainContainer from "@/components/MainContainer";
import Colors from "@/constants/colors";
import { api, handleApiError } from "@/services/api"; // adjust path if needed
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

/* ================= TYPES (from DashboardStatsResponse) ================= */

interface DashboardStats {
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

/* ================= HELPERS ================= */

const formatGhs = (amount?: number): string => {
  if (amount == null) return "GHS 0.00";
  return `GHS ${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatPercent = (value?: number): string => {
  if (value == null) return "0%";
  // Handles both 0-1 fractions and 0-100 values
  const pct = value <= 1 ? value * 100 : value;
  return `${pct.toFixed(1)}%`;
};

const Revenue = () => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchStats = useCallback(async () => {
    try {
      setError("");
      const { data } = await api.get<DashboardStats>(
        "admin/analytics/dashboard",
      );
      setStats(data);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchStats();
    }, [fetchStats]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  /* ================= UI PIECES ================= */

  const completionRate =
    stats?.totalOrders && stats.totalOrders > 0
      ? ((stats.completedOrders ?? 0) / stats.totalOrders) * 100
      : 0;

  const secondaryStats = [
    {
      label: "Total Orders",
      value: stats?.totalOrders?.toLocaleString() ?? "0",
      icon: "cart-outline",
    },
    {
      label: "Completed Orders",
      value: stats?.completedOrders?.toLocaleString() ?? "0",
      icon: "checkmark-done-outline",
    },
    {
      label: "Open Disputes",
      value: stats?.openDisputes?.toLocaleString() ?? "0",
      icon: "alert-circle-outline",
    },
    {
      label: "Verified Factories",
      value: stats?.verifiedFactories?.toLocaleString() ?? "0",
      icon: "business-outline",
    },
  ];

  return (
    <MainContainer safe>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
      >
        <Text style={[styles.title, { color: theme.text }]}>Revenue</Text>

        {loading ? (
          <ActivityIndicator
            size="small"
            color={theme.primary}
            style={{ marginTop: 60 }}
          />
        ) : error ? (
          <View style={styles.empty}>
            <Ionicons
              name="alert-circle-outline"
              size={60}
              color={theme.error}
            />
            <Text style={styles.error}>{error}</Text>
          </View>
        ) : (
          <>
            {/* Primary Revenue Card (GMV) */}
            <View style={[styles.heroCard, { backgroundColor: theme.primary }]}>
              <Text style={styles.heroLabel}>Gross Merch. Value (30d)</Text>
              <Text style={styles.heroValue}>
                {formatGhs(stats?.gmvLast30Days)}
              </Text>

              <View style={styles.heroDivider} />

              <View style={styles.heroRow}>
                <View>
                  <Text style={styles.heroSubLabel}>Fee Revenue (30d)</Text>
                  <Text style={styles.heroSubValue}>
                    {formatGhs(stats?.feeRevenueLast30Days)}
                  </Text>
                </View>

                <View style={styles.heroBadge}>
                  <Ionicons
                    name="trending-up"
                    size={18}
                    color={theme.onPrimary}
                  />
                </View>
              </View>
            </View>

            {/* Escrow Success Rate */}
            <View
              style={[
                styles.rateCard,
                { backgroundColor: theme.cardBackground },
              ]}
            >
              <View style={styles.rateHeader}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={22}
                  color="#34C759"
                />
                <Text style={[styles.rateTitle, { color: theme.text }]}>
                  Escrow Success Rate
                </Text>
              </View>

              <Text style={[styles.rateValue, { color: theme.text }]}>
                {formatPercent(stats?.escrowSuccessRate)}
              </Text>

              {/* Progress Bar */}
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(
                        stats?.escrowSuccessRate != null
                          ? stats.escrowSuccessRate <= 1
                            ? stats.escrowSuccessRate * 100
                            : stats.escrowSuccessRate
                          : 0,
                        100,
                      )}%`,
                    },
                  ]}
                />
              </View>
            </View>

            {/* Order Completion Rate */}
            <View
              style={[
                styles.rateCard,
                { backgroundColor: theme.cardBackground },
              ]}
            >
              <View style={styles.rateHeader}>
                <Ionicons
                  name="stats-chart-outline"
                  size={22}
                  color="#4A90E2"
                />
                <Text style={[styles.rateTitle, { color: theme.text }]}>
                  Order Completion Rate
                </Text>
              </View>

              <Text style={[styles.rateValue, { color: theme.text }]}>
                {completionRate.toFixed(1)}%
              </Text>

              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(completionRate, 100)}%`,
                      backgroundColor: "#4A90E2",
                    },
                  ]}
                />
              </View>
            </View>

            {/* Secondary Stats Grid */}
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Overview
            </Text>

            <View style={styles.grid}>
              {secondaryStats.map((item) => (
                <View
                  key={item.label}
                  style={[
                    styles.statCard,
                    { backgroundColor: theme.cardBackground },
                  ]}
                >
                  <View
                    style={[
                      styles.iconCircle,
                      { backgroundColor: theme.iconBackground },
                    ]}
                  >
                    <Ionicons
                      name={item.icon as any}
                      size={22}
                      color={theme.icon}
                    />
                  </View>

                  <Text style={[styles.statValue, { color: theme.text }]}>
                    {item.value}
                  </Text>
                  <Text
                    style={[styles.statLabel, { color: theme.textSecondary }]}
                  >
                    {item.label}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </MainContainer>
  );
};

export default Revenue;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  title: {
    fontSize: 30,
    fontWeight: "700",
    marginVertical: 20,
  },

  /* Hero Card */
  heroCard: {
    borderRadius: 20,
    padding: 22,
    marginBottom: 18,
  },

  heroLabel: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    fontWeight: "500",
  },

  heroValue: {
    color: "#fff",
    fontSize: 34,
    fontWeight: "800",
    marginTop: 6,
  },

  heroDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginVertical: 16,
  },

  heroRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  heroSubLabel: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
  },

  heroSubValue: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginTop: 2,
  },

  heroBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },

  /* Rate Cards */
  rateCard: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
  },

  rateHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  rateTitle: {
    fontSize: 15,
    fontWeight: "600",
  },

  rateValue: {
    fontSize: 26,
    fontWeight: "800",
    marginTop: 10,
    marginBottom: 12,
  },

  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(120,120,120,0.2)",
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: "#34C759",
  },

  /* Secondary Grid */
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 12,
    marginBottom: 14,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  statCard: {
    width: "48%",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },

  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },

  statValue: {
    fontSize: 22,
    fontWeight: "800",
  },

  statLabel: {
    fontSize: 13,
    marginTop: 4,
  },

  empty: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 80,
  },

  error: {
    marginTop: 16,
    textAlign: "center",
    color: "#FF4D4D",
    fontSize: 15,
    paddingHorizontal: 20,
  },
});
