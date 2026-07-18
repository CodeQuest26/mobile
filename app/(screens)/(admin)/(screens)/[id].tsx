import MainContainer from "@/components/MainContainer";
import Colors from "@/constants/colors";
import { api, handleApiError } from "@/services/api";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    useColorScheme,
    View,
} from "react-native";

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

/* Matches ResolveDisputeRequest.resolution enum */
type Resolution =
  | "UNDER_REVIEW"
  | "RESOLVED_BUYER"
  | "RESOLVED_SELLER"
  | "RESOLVED_SPLIT"
  | "CLOSED";

const RESOLUTION_OPTIONS: { value: Resolution; label: string }[] = [
  { value: "UNDER_REVIEW", label: "Mark Under Review" },
  { value: "RESOLVED_BUYER", label: "Resolve for Buyer" },
  { value: "RESOLVED_SELLER", label: "Resolve for Seller" },
  { value: "RESOLVED_SPLIT", label: "Split Resolution" },
  { value: "CLOSED", label: "Close (No Action)" },
];

const formatReason = (reason: string) =>
  reason
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase());

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const DisputeDetailScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; dispute?: string }>();
  const theme = Colors[useColorScheme() ?? "light"];

  const [dispute, setDispute] = useState<Dispute | null>(() => {
    // If the list screen already passed the object, use it immediately
    // and skip the extra round trip — the spec has no GET-by-id endpoint.
    if (params.dispute) {
      try {
        return JSON.parse(params.dispute);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(!dispute);
  const [error, setError] = useState<string | null>(null);

  const [selectedResolution, setSelectedResolution] =
    useState<Resolution | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Fallback path: no serialized dispute in params (e.g. deep link,
  // or a refresh that wiped route params). Fetch the list page and
  // find the matching id, since there's no single-resource GET.
  const fetchFromList = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get("admin/disputes", {
        params: { page: 0, size: 100 },
      });
      const list = Array.isArray(data) ? data : data.content || [];
      const found = list.find((d: Dispute) => d.id === params.id);
      if (found) {
        setDispute(found);
        setAdminNotes(found.adminNotes || "");
      } else {
        setError("Dispute not found.");
      }
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!dispute && params.id) {
      fetchFromList();
    } else if (dispute) {
      setAdminNotes(dispute.adminNotes || "");
    }
  }, [params.id]);

  const handleResolve = async () => {
    if (!dispute || !selectedResolution) return;

    const trimmedRefund = refundAmount.trim();
    const parsedRefund = trimmedRefund ? Number(trimmedRefund) : undefined;

    if (trimmedRefund && (isNaN(parsedRefund!) || parsedRefund! < 0)) {
      Alert.alert("Invalid Amount", "Refund amount must be a valid number.");
      return;
    }

    setSubmitting(true);
    try {
      // No leading slash — same baseURL/path-resolution issue as the
      // other admin screens.
      await api.patch(`admin/disputes/${dispute.id}/resolve`, {
        resolution: selectedResolution,
        adminNotes: adminNotes.trim() || undefined,
        refundAmountGhs: parsedRefund,
      });

      Alert.alert("Success", "Dispute updated.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert("Action Failed", handleApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <MainContainer safe>
        <ActivityIndicator
          size="large"
          color={theme.text}
          style={{ marginTop: 50 }}
        />
      </MainContainer>
    );
  }

  if (error || !dispute) {
    return (
      <MainContainer safe>
        <Text style={{ color: "red", textAlign: "center", marginTop: 50 }}>
          {error || "Dispute not found."}
        </Text>
      </MainContainer>
    );
  }

  const isResolved =
    dispute.status !== "OPEN" && dispute.status !== "UNDER_REVIEW";

  return (
    <MainContainer safe>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: theme.text }]}>
            {formatReason(dispute.reason)}
          </Text>
          <View
            style={[styles.statusBadge, { backgroundColor: theme.background }]}
          >
            <Text style={[styles.statusText, { color: theme.textSecondary }]}>
              {dispute.status.replace(/_/g, " ")}
            </Text>
          </View>
        </View>

        <Text style={[styles.meta, { color: theme.textSecondary }]}>
          Order #{dispute.orderId.slice(0, 8)} · Filed{" "}
          {formatDate(dispute.createdAt)}
        </Text>

        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
          DESCRIPTION
        </Text>
        <Text style={[styles.description, { color: theme.text }]}>
          {dispute.description}
        </Text>

        {dispute.evidenceUrls && dispute.evidenceUrls.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
              EVIDENCE ({dispute.evidenceUrls.length})
            </Text>
            {dispute.evidenceUrls.map((url, idx) => (
              <Text
                key={idx}
                style={[styles.evidenceLink, { color: theme.primary }]}
                numberOfLines={1}
              >
                {url}
              </Text>
            ))}
          </>
        )}

        {dispute.resolvedAt && (
          <>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
              RESOLUTION
            </Text>
            <Text style={[styles.description, { color: theme.text }]}>
              Resolved {formatDate(dispute.resolvedAt)}
              {dispute.resolutionAmountGhs != null &&
                ` · Refund: GHS ${dispute.resolutionAmountGhs.toLocaleString()}`}
            </Text>
            {dispute.adminNotes && (
              <Text
                style={[styles.description, { color: theme.textSecondary }]}
              >
                {dispute.adminNotes}
              </Text>
            )}
          </>
        )}

        {!isResolved && (
          <>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
              RESOLVE THIS DISPUTE
            </Text>

            <View style={styles.optionsGrid}>
              {RESOLUTION_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.value}
                  style={[
                    styles.optionChip,
                    {
                      borderColor: theme.border,
                      backgroundColor:
                        selectedResolution === opt.value
                          ? theme.primary
                          : theme.cardBackground,
                    },
                  ]}
                  onPress={() => setSelectedResolution(opt.value)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      {
                        color:
                          selectedResolution === opt.value
                            ? theme.onPrimary
                            : theme.text,
                      },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {(selectedResolution === "RESOLVED_BUYER" ||
              selectedResolution === "RESOLVED_SPLIT") && (
              <>
                <Text
                  style={[styles.sectionLabel, { color: theme.textSecondary }]}
                >
                  REFUND AMOUNT (GHS)
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: theme.text,
                      borderColor: theme.border,
                      backgroundColor: theme.background,
                    },
                  ]}
                  placeholder="0.00"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="decimal-pad"
                  value={refundAmount}
                  onChangeText={setRefundAmount}
                />
              </>
            )}

            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
              ADMIN NOTES
            </Text>
            <TextInput
              style={[
                styles.input,
                styles.notesInput,
                {
                  color: theme.text,
                  borderColor: theme.border,
                  backgroundColor: theme.background,
                },
              ]}
              placeholder="Optional notes…"
              placeholderTextColor={theme.textSecondary}
              value={adminNotes}
              onChangeText={setAdminNotes}
              maxLength={4000}
              multiline
            />

            <Pressable
              style={[
                styles.submitBtn,
                {
                  backgroundColor: selectedResolution
                    ? theme.primary
                    : theme.border,
                },
              ]}
              onPress={handleResolve}
              disabled={!selectedResolution || submitting}
            >
              {submitting ? (
                <ActivityIndicator color={theme.onPrimary} size="small" />
              ) : (
                <Text style={[styles.submitText, { color: theme.onPrimary }]}>
                  Submit Resolution
                </Text>
              )}
            </Pressable>
          </>
        )}
      </ScrollView>
    </MainContainer>
  );
};

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 40 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  },
  title: { fontSize: 22, fontWeight: "700", flex: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: "700", letterSpacing: 0.3 },
  meta: { fontSize: 13, marginTop: 4, marginBottom: 10 },
  sectionLabel: {
    fontSize: 10.5,
    fontWeight: "700",
    letterSpacing: 1,
    marginTop: 18,
    marginBottom: 6,
  },
  description: { fontSize: 14, lineHeight: 20 },
  evidenceLink: { fontSize: 13, marginBottom: 4 },
  optionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  optionChip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  optionText: { fontSize: 13, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
  },
  notesInput: { minHeight: 80, textAlignVertical: "top" },
  submitBtn: {
    marginTop: 20,
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  submitText: { fontWeight: "700", fontSize: 15 },
});

export default DisputeDetailScreen;
