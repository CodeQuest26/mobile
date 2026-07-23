import Colors from "@/constants/colors";
import { api, handleApiError } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/* Matches DisputeDetailResponse from the OpenAPI spec */
interface Dispute {
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
  status:
    | "OPEN"
    | "UNDER_REVIEW"
    | "RESOLVED_BUYER"
    | "RESOLVED_SELLER"
    | "RESOLVED_SPLIT"
    | "CLOSED";
  createdAt: string;
}

const REASON_LABELS: Record<Dispute["reason"], string> = {
  QUALITY_BELOW_SPEC: "Quality Below Spec",
  WRONG_QUANTITY: "Wrong Quantity",
  LATE_DELIVERY: "Late Delivery",
  NOT_DELIVERED: "Not Delivered",
  OTHER: "Other",
};

const STATUS_COLORS: Record<Dispute["status"], string> = {
  OPEN: "#FF4D4D",
  UNDER_REVIEW: "#F5A623",
  RESOLVED_BUYER: "#34C759",
  RESOLVED_SELLER: "#34C759",
  RESOLVED_SPLIT: "#34C759",
  CLOSED: "#7ED321",
};

const PAGE_SIZE = 20;

const DisputesScreen = () => {
  const router = useRouter();
  const theme = Colors[useColorScheme() ?? "light"];

  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDisputes = useCallback(
    async (pageToLoad: number, append: boolean) => {
      try {
        setError(null);
        // No leading slash — baseURL already includes /api/v1.
        // "pageable" is required on this endpoint per the spec.
        const { data } = await api.get("admin/disputes", {
          params: { page: pageToLoad, size: PAGE_SIZE },
        });
        const content = data?.content ?? (Array.isArray(data) ? data : []);
        setDisputes((prev) => (append ? [...prev, ...content] : content));
        setTotalPages(data?.totalPages ?? 1);
        setPage(pageToLoad);
      } catch (err) {
        setError(handleApiError(err));
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [],
  );

  useFocusEffect(
    useCallback(() => {
      fetchDisputes(0, false);
    }, [fetchDisputes]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchDisputes(0, false);
  };

  const onLoadMore = () => {
    if (loadingMore || loading || page + 1 >= totalPages) return;
    setLoadingMore(true);
    fetchDisputes(page + 1, true);
  };

  const openDispute = (dispute: Dispute) => {
    router.push({
      pathname: "/admin/disputes/[id]" as any,
      // Pass the object so the detail screen renders immediately —
      // there's no GET /admin/disputes/{id} in the spec to refetch from.
      params: { id: dispute.id, dispute: JSON.stringify(dispute) },
    });
  };

  const renderItem = ({ item }: { item: Dispute }) => (
    <Pressable
      style={[styles.card, { backgroundColor: theme.cardBackground }]}
      onPress={() => openDispute(item)}
    >
      <View style={styles.headerRow}>
        <Text style={[styles.orderText, { color: theme.text }]}>
          Order #{item.orderId.slice(0, 8)}
        </Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: STATUS_COLORS[item.status] + "1A" },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              { backgroundColor: STATUS_COLORS[item.status] },
            ]}
          />
          <Text
            style={[styles.statusText, { color: STATUS_COLORS[item.status] }]}
          >
            {item.status.replace(/_/g, " ")}
          </Text>
        </View>
      </View>

      <Text style={[styles.reason, { color: theme.text }]}>
        {REASON_LABELS[item.reason]}
      </Text>

      <Text
        style={[styles.description, { color: theme.textSecondary }]}
        numberOfLines={2}
      >
        {item.description}
      </Text>

      <View style={styles.footerRow}>
        <Text style={[styles.date, { color: theme.textSecondary }]}>
          {new Date(item.createdAt).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </Text>
        <Ionicons
          name="chevron-forward"
          size={16}
          color={theme.textSecondary}
        />
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <Text style={[styles.header, { color: theme.text }]}>Disputes</Text>

      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={18} color="#FF4D4D" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {loading && !refreshing ? (
        <ActivityIndicator
          size="large"
          color={theme.text}
          style={{ marginTop: 50 }}
        />
      ) : (
        <FlatList
          data={disputes}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          onEndReachedThreshold={0.4}
          onEndReached={onLoadMore}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.text}
            />
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator
                size="small"
                color={theme.text}
                style={{ marginVertical: 16 }}
              />
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons
                name="shield-checkmark-outline"
                size={36}
                color={theme.textSecondary}
              />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No disputes found.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

export default DisputesScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { fontSize: 24, fontWeight: "bold", margin: 20 },
  list: { paddingHorizontal: 20, paddingBottom: 20 },
  card: { padding: 16, borderRadius: 12, marginBottom: 12 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  orderText: { fontSize: 13, fontWeight: "600" },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: "700" },
  reason: { fontSize: 16, fontWeight: "700", marginBottom: 4 },
  description: { fontSize: 13, lineHeight: 18, marginBottom: 10 },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  date: { fontSize: 11.5 },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF4D4D1A",
    marginHorizontal: 20,
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  errorText: { color: "#FF4D4D", fontSize: 13, fontWeight: "500", flex: 1 },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 8,
  },
  emptyText: { fontSize: 14 },
});
