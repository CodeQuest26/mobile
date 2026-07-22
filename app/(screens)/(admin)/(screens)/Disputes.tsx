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

interface Dispute {
  id: string;
  orderId: string;
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

interface DisputeResponse {
  content: Dispute[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

const statusColor = (status: string) => {
  switch (status) {
    case "OPEN":
      return "#E53935";

    case "UNDER_REVIEW":
      return "#FB8C00";

    case "RESOLVED_BUYER":
    case "RESOLVED_SELLER":
    case "RESOLVED_SPLIT":
    case "CLOSED":
      return "#2E7D32";

    default:
      return "#999";
  }
};

const formatReason = (reason: string) =>
  reason
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

const formatDate = (date: string) => new Date(date).toLocaleDateString();

const Disputes = () => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [error, setError] = useState("");

  const fetchDisputes = useCallback(async () => {
    try {
      setError("");

      const { data } = await api.get<DisputeResponse>("admin/disputes", {
        params: {
          page: 0,
          size: 20,
        },
      });

      setDisputes(data.content);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchDisputes();
    }, [fetchDisputes]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchDisputes();
  };

  const renderItem = ({ item }: { item: Dispute }) => (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: theme.cardBackground,
        },
      ]}
      activeOpacity={0.8}
      onPress={() =>
        router.push({
          pathname: "/admin/disputes/[id]" as any,
          params: { id: item.id, dispute: JSON.stringify(item) },
        } as any)
      }
    >
      <View style={styles.header}>
        <Text
          style={[
            styles.reason,
            {
              color: theme.text,
            },
          ]}
        >
          {formatReason(item.reason)}
        </Text>

        <View
          style={[
            styles.status,
            {
              backgroundColor: statusColor(item.status),
            },
          ]}
        >
          <Text style={styles.statusText}>
            {item.status.replace(/_/g, " ")}
          </Text>
        </View>
      </View>

      <Text
        style={[
          styles.description,
          {
            color: theme.textSecondary,
          },
        ]}
        numberOfLines={2}
      >
        {item.description}
      </Text>

      <View style={styles.footer}>
        <Text style={{ color: theme.textSecondary }}>
          Order #{item.orderId.slice(0, 8)}
        </Text>

        <Text style={{ color: theme.textSecondary }}>
          {formatDate(item.createdAt)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <MainContainer safe>
      <View style={styles.container}>
        <Text
          style={[
            styles.title,
            {
              color: theme.text,
            },
          ]}
        >
          Disputes
        </Text>

        {loading ? (
          <ActivityIndicator
            size="large"
            color={theme.primary}
            style={{ marginTop: 40 }}
          />
        ) : error ? (
          <View style={styles.empty}>
            <Ionicons name="alert-circle-outline" size={60} color="#E53935" />
            <Text style={styles.error}>{error}</Text>
          </View>
        ) : (
          <FlatList
            data={disputes}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={theme.primary}
              />
            }
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={60}
                  color={theme.textSecondary}
                />
                <Text
                  style={{
                    color: theme.textSecondary,
                    marginTop: 12,
                  }}
                >
                  No disputes found.
                </Text>
              </View>
            }
          />
        )}
      </View>
    </MainContainer>
  );
};

export default Disputes;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },

  title: {
    fontSize: 30,
    fontWeight: "700",
    marginVertical: 20,
  },

  card: {
    padding: 18,
    borderRadius: 14,
    marginBottom: 14,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  reason: {
    fontWeight: "700",
    fontSize: 16,
    flex: 1,
    marginRight: 10,
  },

  description: {
    marginTop: 10,
    lineHeight: 20,
    fontSize: 14,
  },

  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
  },

  status: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },

  statusText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 12,
  },

  empty: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 80,
    paddingHorizontal: 20,
  },

  error: {
    marginTop: 16,
    textAlign: "center",
    color: "#E53935",
    fontSize: 15,
  },
});
