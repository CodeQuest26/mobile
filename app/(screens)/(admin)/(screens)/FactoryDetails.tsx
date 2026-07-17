import MainContainer from "@/components/MainContainer";
import Colors from "@/constants/colors";
import { api, handleApiError } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

// Matches the Factory schema from the OpenAPI spec
interface Factory {
  id: string;
  companyName: string;
  description?: string | null;
  sectorTags: string[];
  machineryList?: string | null;
  minOrderQuantity?: number | null;
  maxOrderQuantity?: number | null;
  address?: string | null;
  verificationStatus: "PENDING" | "VERIFIED" | "SUSPENDED" | "REJECTED";
  verificationNotes?: string | null;
  isFeatured: boolean;
  featuredUntil?: string | null;
  responseTimeHours?: number | null;
  completionRate?: number | null;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  ownerName: string;
  ownerPhoneNumber: string;
  latitude?: number | null;
  longitude?: number | null;
}

type ActionStatus = "VERIFIED" | "SUSPENDED" | "REJECTED";

const STATUS_COLORS: Record<Factory["verificationStatus"], string> = {
  PENDING: "#D97706",
  VERIFIED: "#16A34A",
  SUSPENDED: "#DC2626",
  REJECTED: "#6B7280",
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const DetailRow = ({
  icon,
  label,
  value,
  theme,
}: {
  icon: string;
  label: string;
  value: string;
  theme: any;
}) => (
  <View style={styles.detailRow}>
    <View
      style={[styles.detailIconWrap, { backgroundColor: theme.background }]}
    >
      <Ionicons name={icon as any} size={15} color={theme.textSecondary} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
        {label}
      </Text>
      <Text style={[styles.detailValue, { color: theme.text }]}>{value}</Text>
    </View>
  </View>
);

const Section = ({
  title,
  children,
  theme,
}: {
  title: string;
  children: React.ReactNode;
  theme: any;
}) => (
  <View style={styles.section}>
    <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
      {title.toUpperCase()}
    </Text>
    <View
      style={[styles.sectionCard, { backgroundColor: theme.cardBackground }]}
    >
      {children}
    </View>
  </View>
);

export default function FactoryDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];

  const [factory, setFactory] = useState<Factory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState<ActionStatus | null>(null);

  // NOTE: there's no GET /admin/factories/{id} in the spec — this screen
  // reuses the verification queue list and finds the matching entry.
  // If the factory has already left the queue (verified/rejected
  // elsewhere), this will come up empty. Flagging this as a gap worth
  // raising with the backend: a dedicated GET for a single factory would
  // make this screen reliable regardless of queue state.
  const fetchFactory = async () => {
    try {
      setError(null);
      const { data } = await api.get("/admin/factories/verification-queue", {
        params: { page: 0, size: 1000 },
      });
      const list: Factory[] = Array.isArray(data) ? data : data.content || [];
      const match = list.find((f) => f.id === id);
      if (!match) {
        setError("This factory is no longer in the verification queue.");
      } else {
        setFactory(match);
        setNotes(match.verificationNotes || "");
      }
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchFactory();
  }, [id]);

  const handleAction = (status: ActionStatus) => {
    const verb =
      status === "VERIFIED"
        ? "verify"
        : status === "SUSPENDED"
          ? "suspend"
          : "reject";

    Alert.alert(
      `${verb.charAt(0).toUpperCase() + verb.slice(1)} this factory?`,
      `This will mark ${factory?.companyName} as ${status.toLowerCase()}.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: verb.charAt(0).toUpperCase() + verb.slice(1),
          style: status === "VERIFIED" ? "default" : "destructive",
          onPress: () => submitAction(status),
        },
      ],
    );
  };

  const submitAction = async (status: ActionStatus) => {
    if (!id) return;
    setSubmitting(status);
    try {
      await api.patch(`/admin/factories/${id}/verify`, {
        status,
        notes: notes.trim() || undefined,
      });
      Alert.alert("Done", `Factory marked as ${status.toLowerCase()}.`, [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert("Action failed", handleApiError(err));
    } finally {
      setSubmitting(null);
    }
  };

  if (loading) {
    return (
      <MainContainer safe>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </MainContainer>
    );
  }

  if (error || !factory) {
    return (
      <MainContainer safe>
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={40} color={theme.error} />
          <Text style={[styles.errorText, { color: theme.error }]}>
            {error || "Factory not found."}
          </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: theme.primary, fontWeight: "600" }}>
              Go back
            </Text>
          </TouchableOpacity>
        </View>
      </MainContainer>
    );
  }

  const statusColor =
    STATUS_COLORS[factory.verificationStatus] ?? theme.textSecondary;
  const hasCoordinates = factory.latitude != null && factory.longitude != null;

  return (
    <MainContainer safe>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: theme.cardBackground }]}
        >
          <Ionicons name="chevron-back" size={20} color={theme.text} />
        </TouchableOpacity>
        <Text
          style={[styles.headerTitle, { color: theme.text }]}
          numberOfLines={1}
        >
          Factory Review
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Identity block */}
        <View style={styles.identityBlock}>
          <Text style={[styles.companyName, { color: theme.text }]}>
            {factory.companyName}
          </Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusColor + "18" },
            ]}
          >
            <View
              style={[styles.statusDot, { backgroundColor: statusColor }]}
            />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {factory.verificationStatus}
            </Text>
          </View>
        </View>

        {factory.sectorTags && factory.sectorTags.length > 0 && (
          <View style={styles.tagRow}>
            {factory.sectorTags.map((tag, idx) => (
              <View
                key={`${tag}-${idx}`}
                style={[
                  styles.tagChip,
                  { backgroundColor: theme.cardBackground },
                ]}
              >
                <Text style={[styles.tagText, { color: theme.textSecondary }]}>
                  {tag}
                </Text>
              </View>
            ))}
          </View>
        )}

        {factory.description ? (
          <Text style={[styles.description, { color: theme.textSecondary }]}>
            {factory.description}
          </Text>
        ) : null}

        {/* Owner */}
        <Section title="Owner" theme={theme}>
          <DetailRow
            icon="person-outline"
            label="Name"
            value={factory.ownerName}
            theme={theme}
          />
          <TouchableOpacity
            onPress={() => Linking.openURL(`tel:${factory.ownerPhoneNumber}`)}
          >
            <DetailRow
              icon="call-outline"
              label="Phone"
              value={factory.ownerPhoneNumber}
              theme={theme}
            />
          </TouchableOpacity>
        </Section>

        {/* Capacity — only shown when present, since these are commonly null pre-verification */}
        {(factory.minOrderQuantity != null ||
          factory.maxOrderQuantity != null ||
          factory.machineryList) && (
          <Section title="Capacity" theme={theme}>
            {(factory.minOrderQuantity != null ||
              factory.maxOrderQuantity != null) && (
              <DetailRow
                icon="cube-outline"
                label="Order Quantity Range"
                value={`${factory.minOrderQuantity ?? "—"} to ${
                  factory.maxOrderQuantity ?? "—"
                } units`}
                theme={theme}
              />
            )}
            {factory.machineryList && (
              <DetailRow
                icon="construct-outline"
                label="Machinery"
                value={factory.machineryList}
                theme={theme}
              />
            )}
          </Section>
        )}

        {/* Location */}
        <Section title="Location" theme={theme}>
          <DetailRow
            icon="location-outline"
            label="Address"
            value={factory.address || "Not provided"}
            theme={theme}
          />
          {hasCoordinates && (
            <DetailRow
              icon="pin-outline"
              label="Coordinates"
              value={`${factory.latitude!.toFixed(5)}, ${factory.longitude!.toFixed(5)}`}
              theme={theme}
            />
          )}
        </Section>

        {/* Timeline */}
        <Section title="Timeline" theme={theme}>
          <DetailRow
            icon="calendar-outline"
            label="Applied"
            value={formatDate(factory.createdAt)}
            theme={theme}
          />
          <DetailRow
            icon="time-outline"
            label="Last Updated"
            value={formatDate(factory.updatedAt)}
            theme={theme}
          />
        </Section>

        {/* Performance — only when the factory has actual history */}
        {(factory.responseTimeHours != null ||
          factory.completionRate != null) && (
          <Section title="Performance" theme={theme}>
            {factory.responseTimeHours != null && (
              <DetailRow
                icon="flash-outline"
                label="Avg. Response Time"
                value={`${factory.responseTimeHours.toFixed(1)} hours`}
                theme={theme}
              />
            )}
            {factory.completionRate != null && (
              <DetailRow
                icon="checkmark-done-outline"
                label="Completion Rate"
                value={`${(factory.completionRate * 100).toFixed(0)}%`}
                theme={theme}
              />
            )}
          </Section>
        )}

        {/* Review notes + actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            REVIEW NOTES
          </Text>
          <TextInput
            style={[
              styles.notesInput,
              {
                backgroundColor: theme.cardBackground,
                color: theme.text,
                borderColor: theme.border,
              },
            ]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Optional notes about this decision…"
            placeholderTextColor={theme.textSecondary + "80"}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: "#16A34A" }]}
            onPress={() => handleAction("VERIFIED")}
            disabled={submitting !== null}
          >
            {submitting === "VERIFIED" ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={16}
                  color="#FFF"
                />
                <Text style={styles.actionBtnText}>Verify</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: "#DC2626" }]}
            onPress={() => handleAction("REJECTED")}
            disabled={submitting !== null}
          >
            {submitting === "REJECTED" ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Ionicons name="close-circle-outline" size={16} color="#FFF" />
                <Text style={styles.actionBtnText}>Reject</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {factory.verificationStatus === "VERIFIED" && (
          <TouchableOpacity
            style={[styles.suspendBtn, { borderColor: "#D97706" }]}
            onPress={() => handleAction("SUSPENDED")}
            disabled={submitting !== null}
          >
            {submitting === "SUSPENDED" ? (
              <ActivityIndicator size="small" color="#D97706" />
            ) : (
              <>
                <Ionicons
                  name="pause-circle-outline"
                  size={16}
                  color="#D97706"
                />
                <Text style={[styles.suspendBtnText, { color: "#D97706" }]}>
                  Suspend Factory
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </MainContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
    textAlign: "center",
  },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 20 },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 32,
  },
  errorText: { fontSize: 15, textAlign: "center" },
  identityBlock: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: 8,
    marginBottom: 10,
    gap: 12,
  },
  companyName: { fontSize: 22, fontWeight: "800", flex: 1 },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: "700", letterSpacing: 0.3 },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 },
  tagChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  tagText: { fontSize: 12, fontWeight: "600" },
  description: { fontSize: 14, lineHeight: 21, marginBottom: 20 },
  section: { marginBottom: 18 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 2,
  },
  sectionCard: { borderRadius: 14, overflow: "hidden" },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  detailIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  detailLabel: { fontSize: 11, fontWeight: "600", marginBottom: 2 },
  detailValue: { fontSize: 14, fontWeight: "500" },
  notesInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
  },
  actionsRow: { flexDirection: "row", gap: 10, marginTop: 4, marginBottom: 10 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 13,
    borderRadius: 12,
  },
  actionBtnText: { color: "#FFF", fontWeight: "700", fontSize: 14 },
  suspendBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  suspendBtnText: { fontWeight: "700", fontSize: 14 },
});
