import MainContainer from "@/components/MainContainer";
import Colors from "@/constants/colors";
import { api, handleApiError } from "@/services/api"; // Correct service import
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
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

type SupportTicket = {
  id: string;
  userFullName: string;
  priority: string;
  description: string;
  status: string;
};

const SupportTicketsScreen = () => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    try {
      setError(null);
      // Correct endpoint as per standard admin dashboard patterns
      const { data } = await api.get<SupportTicket[]>("/admin/support-tickets");
      setTickets(data);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return theme.error;
      case "Medium":
        return theme.warning;
      case "Low":
        return "#4A90E2";
      default:
        return theme.primary;
    }
  };

  const renderTicket = ({ item }: any) => (
    <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.user, { color: theme.text }]}>
          {item.userFullName}
        </Text>
        <View
          style={[
            styles.badge,
            { backgroundColor: `${getPriorityColor(item.priority)}20` },
          ]}
        >
          <Text
            style={{
              color: getPriorityColor(item.priority),
              fontSize: 10,
              fontWeight: "bold",
            }}
          >
            {item.priority}
          </Text>
        </View>
      </View>

      <Text style={[styles.issue, { color: theme.textSecondary }]}>
        {item.description}
      </Text>

      <View style={styles.footerRow}>
        <Text style={[styles.status, { color: theme.text }]}>
          Status: {item.status}
        </Text>
        <Pressable
          onPress={() => router.push(`/admin/support/${item.id}` as any)}
        >
          <Text style={[styles.viewText, { color: theme.textSecondary }]}>
            View Details →
          </Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <MainContainer safe>
      <Text style={[styles.header, { color: theme.text }]}>
        Support Requests
      </Text>

      {loading ? (
        <ActivityIndicator
          size="small"
          color={theme.icon}
          style={{ marginTop: 20 }}
        />
      ) : error ? (
        <Text style={{ color: "red", textAlign: "center", marginTop: 20 }}>
          {error}
        </Text>
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(item) => item.id}
          renderItem={renderTicket}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={fetchTickets}
              tintColor={theme.text}
            />
          }
          ListEmptyComponent={
            <Text
              style={{
                textAlign: "center",
                color: theme.textSecondary,
                marginTop: 20,
              }}
            >
              No support requests found.
            </Text>
          }
        />
      )}
    </MainContainer>
  );
};

const styles = StyleSheet.create({
  header: { fontSize: 24, fontWeight: "bold", margin: 20 },
  list: { paddingHorizontal: 20, paddingBottom: 20 },
  card: { padding: 18, borderRadius: 12, marginBottom: 12 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  user: { fontSize: 16, fontWeight: "600" },
  issue: { fontSize: 14, marginBottom: 12 },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  status: { fontSize: 12, fontStyle: "italic" },
  viewText: { fontWeight: "bold" },
});

export default SupportTicketsScreen;
