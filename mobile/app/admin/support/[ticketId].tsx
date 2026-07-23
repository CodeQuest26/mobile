import MainContainer from "@/components/MainContainer";
import Colors from "@/constants/colors";
import { api, handleApiError } from "@/services/api";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

type SupportTicket = {
  id: string;
  ticketNumber?: string;
  userName?: string;
  subject?: string;
  category?: string;
  priority?: string;
  status?: string;
  targetSlaDeadline?: string;
  createdAt?: string;
  slaBreached?: boolean;
};

const formatDate = (value?: string) =>
  value
    ? new Date(value).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "N/A";

const DetailRow = ({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) => (
  <View style={styles.detailRow}>
    <Text style={[styles.label, { color }]}>{label}</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);

const SupportTicketDetailScreen = () => {
  const router = useRouter();
  const theme = Colors[useColorScheme() ?? "light"];
  const params = useLocalSearchParams<{
    ticketId: string;
    ticket?: string;
  }>();

  const [ticket, setTicket] = useState<SupportTicket | null>(() => {
    if (!params.ticket) return null;
    try {
      return JSON.parse(params.ticket);
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(!ticket);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ticket || !params.ticketId) return;

    const fetchTicket = async () => {
      try {
        setError(null);
        const { data } = await api.get<SupportTicket>(
          `support/tickets/${params.ticketId}`,
        );
        setTicket(data);
      } catch (err) {
        setError(handleApiError(err));
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [params.ticketId, ticket]);

  if (loading) {
    return (
      <MainContainer safe>
        <ActivityIndicator
          size="small"
          color={theme.primary}
          style={{ marginTop: 40 }}
        />
      </MainContainer>
    );
  }

  if (error || !ticket) {
    return (
      <MainContainer safe>
        <Text style={[styles.error, { color: theme.error }]}>
          {error || "Ticket not found."}
        </Text>
      </MainContainer>
    );
  }

  return (
    <MainContainer safe>
      <ScrollView contentContainerStyle={styles.container}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={{ color: theme.primary }}>Back</Text>
        </Pressable>

        <Text style={[styles.title, { color: theme.text }]}>
          {ticket.subject || "Support Ticket"}
        </Text>
        <Text style={[styles.meta, { color: theme.textSecondary }]}>
          #{ticket.ticketNumber || ticket.id}
        </Text>

        <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
          <DetailRow
            label="User"
            value={ticket.userName || "N/A"}
            color={theme.primary}
          />
          <DetailRow
            label="Category"
            value={(ticket.category || "N/A").replace(/_/g, " ")}
            color={theme.primary}
          />
          <DetailRow
            label="Priority"
            value={ticket.priority || "N/A"}
            color={theme.primary}
          />
          <DetailRow
            label="Status"
            value={(ticket.status || "N/A").replace(/_/g, " ")}
            color={theme.primary}
          />
          <DetailRow
            label="Created"
            value={formatDate(ticket.createdAt)}
            color={theme.primary}
          />
          <DetailRow
            label="SLA Deadline"
            value={formatDate(ticket.targetSlaDeadline)}
            color={theme.primary}
          />
          <DetailRow
            label="SLA Breached"
            value={ticket.slaBreached ? "Yes" : "No"}
            color={theme.primary}
          />
        </View>
      </ScrollView>
    </MainContainer>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
  backButton: { marginBottom: 16 },
  title: { fontSize: 24, fontWeight: "700" },
  meta: { marginTop: 4, marginBottom: 16 },
  card: { padding: 16, borderRadius: 8 },
  detailRow: { marginBottom: 14 },
  label: { fontSize: 12, fontWeight: "700", marginBottom: 4 },
  value: { fontSize: 15 },
  error: { textAlign: "center", marginTop: 40 },
});

export default SupportTicketDetailScreen;
