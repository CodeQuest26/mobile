import { FadeIn } from "@/components/FadeIn";
import MainContainer from "@/components/MainContainer";
import ReviewForm from "@/components/sme/ReviewForm";
import ReportIssueModal from "@/components/sme/ReportIssueModal";
import Colors from "@/constants/colors";
import { api, handleApiError } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

type OrderStatus =
  | "PAYMENT_PENDING"
  | "IN_ESCROW"
  | "IN_PRODUCTION"
  | "QUALITY_CHECK"
  | "DELIVERED"
  | "COMPLETED"
  | "DISPUTED"
  | "REFUNDED"
  | "CANCELLED";

// Trimmed to the fields this screen actually uses, from
// OrderDetailResponse / JobDetailResponse in the OpenAPI spec.
interface ApiOrder {
  id: string;
  jobId: string;
  smeName: string;
  factoryName?: string;
  agreedAmountGhs: number;
  status: OrderStatus;
  qualityCheckDeadline?: string;
  deliveredAt?: string;
  completedAt?: string;
  createdAt: string;
}

interface ApiJob {
  title: string;
  productType?: string;
  quantity?: number;
  specifications?: string;
  deliveryAddress?: string;
  attachmentUrls?: string[];
}

interface ReviewData {
  overallRating: number;
  qualityRating?: number;
  timelinessRating?: number;
  communicationRating?: number;
  comment?: string;
  createdAt: string;
}

interface TimelineItem {
  stage: string;
  date: string;
  completed: boolean;
}

// Mirrors the milestone semantics used on the orders list screen, so
// "milestone 2 of 4" means the same thing everywhere in the app.
const STAGE_LABELS = [
  "Payment Secured",
  "In Production",
  "Quality Check",
  "Delivered",
  "Completed",
];

const mapStatusToMilestone = (status: OrderStatus): number => {
  const map: Record<OrderStatus, number> = {
    PAYMENT_PENDING: 0,
    IN_ESCROW: 0,
    IN_PRODUCTION: 1,
    QUALITY_CHECK: 2,
    DELIVERED: 3,
    COMPLETED: 4,
    DISPUTED: 0,
    REFUNDED: 4,
    CANCELLED: 4,
  };
  return map[status] ?? 0;
};

const getProgress = (status: OrderStatus): number => {
  const map: Record<OrderStatus, number> = {
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
  return map[status] ?? 0;
};

const formatDate = (iso?: string): string => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

// Statuses a manufacturer can manually advance from here, and what
// they advance TO. PAYMENT_PENDING isn't included — that transition
// happens via the payment webhook, not a manual action. DELIVERED
// isn't included either — moving to COMPLETED is the buyer's
// confirm-delivery action (POST /orders/{id}/confirm-delivery), not
// something the manufacturer should be able to force from here.
const MANUFACTURER_ADVANCEABLE: Partial<Record<OrderStatus, OrderStatus>> = {
  IN_ESCROW: "IN_PRODUCTION",
  IN_PRODUCTION: "QUALITY_CHECK",
  QUALITY_CHECK: "DELIVERED",
};

type OrderDetailScreenProps = {
  role?: "manufacturer" | "sme";
};

// Read-only star row used in the manufacturer review display
const ReviewStarRow = ({
  label,
  value,
  theme,
}: {
  label: string;
  value: number;
  theme: any;
}) => (
  <View style={styles.reviewStarRow}>
    <Text style={[styles.reviewStarLabel, { color: theme.textSecondary }]}>
      {label}
    </Text>
    <View style={styles.reviewStars}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Ionicons
          key={n}
          name={n <= value ? "star" : "star-outline"}
          size={16}
          color={n <= value ? "#F59E0B" : theme.textSecondary}
          style={{ marginLeft: 1 }}
        />
      ))}
    </View>
  </View>
);

export function OrderDetailScreen({
  role = "manufacturer",
}: OrderDetailScreenProps) {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"] || Colors.light;

  const [apiOrder, setApiOrder] = useState<ApiOrder | null>(null);
  const [apiJob, setApiJob] = useState<ApiJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [review, setReview] = useState<ReviewData | null>(null);

  const fetchOrder = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const { data: orderData } = await api.get(`orders/${id}`);
      setApiOrder(orderData);

      // Job fetch is best-effort
      try {
        const { data: jobData } = await api.get(`jobs/${orderData.jobId}`);
        setApiJob(jobData);
      } catch (jobErr) {
        console.warn("Failed to load job details for order:", jobErr);
        setApiJob(null);
      }

      // Fetch review if order is completed
      setReview(null);
      if (orderData.status === "COMPLETED") {
        try {
          const { data: reviewData } = await api.get(
            `reviews/${orderData.id}`,
          );
          if (reviewData?.overallRating) {
            setReview(reviewData);
          }
        } catch {
          // No review exists yet — that's fine
        }
      }
    } catch (err) {
      console.error("Failed to load order:", err);
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleMarkNextMilestone = async () => {
    if (!apiOrder) return;
    const nextStatus = MANUFACTURER_ADVANCEABLE[apiOrder.status];
    if (!nextStatus) return;

    setUpdating(true);
    try {
      await api.patch(`orders/${apiOrder.id}/status`, {
        newStatus: nextStatus,
      });
      // Refetch rather than optimistically patching local state, so
      // the timeline dates and progress reflect what the server
      // actually persisted (e.g. real deliveredAt timestamps).
      await fetchOrder();
    } catch (err) {
      console.error("Failed to update order status:", err);
      Alert.alert("Couldn't update order", handleApiError(err));
    } finally {
      setUpdating(false);
    }
  };

  const handleConfirmDelivery = async () => {
    if (!apiOrder) return;

    Alert.alert(
      "Confirm delivery",
      "Only confirm once you have received the order and checked it.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm received",
          onPress: async () => {
            setUpdating(true);
            try {
              await api.post(`orders/${apiOrder.id}/confirm-delivery`, {
                qualityAccepted: true,
              });
              // Reload the canonical backend state, which should now be
              // COMPLETED, before returning the SME to the refreshed home.
              await fetchOrder();
            } catch (err) {
              console.error("Failed to confirm delivery:", err);
              Alert.alert("Couldn't confirm delivery", handleApiError(err));
            } finally {
              setUpdating(false);
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <MainContainer safe>
        <View style={styles.notFound}>
          <ActivityIndicator size="small" color={theme.primary} />
        </View>
      </MainContainer>
    );
  }

  if (error || !apiOrder) {
    return (
      <MainContainer safe>
        <View style={styles.notFound}>
          <Text style={{ color: theme.text, textAlign: "center" }}>
            {error || "Order not found"}
          </Text>
          {error && (
            <TouchableOpacity onPress={fetchOrder} style={{ marginTop: 12 }}>
              <Text style={{ color: theme.primary, fontWeight: "600" }}>
                Try Again
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ marginTop: 12 }}
          >
            <Text style={{ color: theme.primary }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </MainContainer>
    );
  }

  // ---- Derive the display shape from real API data ----
  const milestone = mapStatusToMilestone(apiOrder.status);
  const progress = getProgress(apiOrder.status);
  const isTerminal = ["COMPLETED", "REFUNDED", "CANCELLED"].includes(
    apiOrder.status,
  );
  const urgent = apiOrder.status === "DISPUTED";

  const dueIn = isTerminal
    ? "Completed"
    : apiOrder.status === "DELIVERED"
      ? "Awaiting confirmation"
      : apiOrder.qualityCheckDeadline
        ? formatDate(apiOrder.qualityCheckDeadline)
        : "In progress";

  const milestoneLabel =
    apiOrder.status === "DISPUTED"
      ? "Disputed"
      : apiOrder.status === "REFUNDED"
        ? "Refunded"
        : apiOrder.status === "CANCELLED"
          ? "Cancelled"
          : apiOrder.status === "PAYMENT_PENDING"
            ? "Awaiting Payment"
            : STAGE_LABELS[milestone];

  // Dates come from real fields where they exist; stages this order
  // hasn't reached yet, or that the API doesn't timestamp individually
  // (there's no "productionStartedAt" field, for example), show "—"
  // rather than a fabricated date.
  const timeline: TimelineItem[] = STAGE_LABELS.map((stage, idx) => {
    const completed = idx < milestone || (idx === milestone && progress >= 1.0);
    let date = "—";
    if (idx === 0) date = formatDate(apiOrder.createdAt);
    if (idx === 2 && apiOrder.qualityCheckDeadline)
      date = formatDate(apiOrder.qualityCheckDeadline);
    if (idx === 3 && apiOrder.deliveredAt)
      date = formatDate(apiOrder.deliveredAt);
    if (idx === 4 && apiOrder.completedAt)
      date = formatDate(apiOrder.completedAt);
    return { stage, date, completed };
  });

  const order = {
    job: apiJob?.title || `Job #${apiOrder.jobId.slice(0, 8)}`,
    counterparty:
      role === "sme"
        ? apiOrder.factoryName || "Manufacturer"
        : apiOrder.smeName || "Unknown SME",
    amount: `GH₵ ${apiOrder.agreedAmountGhs?.toFixed(2) || "0.00"}`,
    milestoneLabel,
    dueIn,
    progress,
    urgent,
    timeline,
    description: apiJob?.specifications || "No specifications provided.",
    quantity: apiJob?.quantity ?? "—",
    productType: apiJob?.productType || "—",
    deliveryAddress: apiJob?.deliveryAddress || "Not provided",
  };

  const canAdvance = Boolean(MANUFACTURER_ADVANCEABLE[apiOrder.status]);
  const isCompleted = isTerminal;

  // 7-day report window (SME only): order must be COMPLETED and completedAt
  // must be within the last 7 days.
  const canReportIssue =
    role === "sme" &&
    !["REFUNDED", "CANCELLED", "DISPUTED"].includes(apiOrder.status) &&
    (() => {
      if (apiOrder.status !== "COMPLETED") return true;
      if (!apiOrder.completedAt) return false;
      const elapsed =
        Date.now() - new Date(apiOrder.completedAt).getTime();
      return elapsed < 7 * 24 * 60 * 60 * 1000;
    })();

  return (
    <>
      <StatusBar barStyle="default" />
      <MainContainer safe>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Order Details
          </Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Job Title & Status */}
          <FadeIn delay={0}>
            <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.cardBackground,
                },
              ]}
            >
              <View style={styles.jobRow}>
                {apiJob?.attachmentUrls?.[0] && (
                  <Image
                    source={{ uri: apiJob.attachmentUrls[0] }}
                    style={styles.orderJobImage}
                  />
                )}
                <Text style={[styles.jobName, { color: theme.text, flex: apiJob?.attachmentUrls?.[0] ? 1 : undefined }]}>
                  {order.job}
                </Text>
                {apiOrder.status === "DISPUTED" && (
                  <View
                    style={[
                      styles.urgentBadge,
                      { backgroundColor: "#EF444420" },
                    ]}
                  >
                    <Text style={[styles.urgentText, { color: theme.error }]}>
                      Disputed
                    </Text>
                  </View>
                )}
              </View>
              <Text style={[styles.smeName, { color: theme.textSecondary }]}>
                {order.counterparty}
              </Text>
              <View style={styles.divider} />
              <View style={styles.amountRow}>
                <Text
                  style={[styles.amountLabel, { color: theme.textSecondary }]}
                >
                  Amount
                </Text>
                <Text style={[styles.amountValue, { color: theme.text }]}>
                  {order.amount}
                </Text>
              </View>
              <View style={styles.milestoneRow}>
                <Text
                  style={[
                    styles.milestoneLabel,
                    { color: theme.textSecondary },
                  ]}
                >
                  Current Stage
                </Text>
                <Text style={[styles.milestoneValue, { color: theme.primary }]}>
                  {order.milestoneLabel}
                </Text>
              </View>
              <View style={styles.dueRow}>
                <Text style={[styles.dueLabel, { color: theme.textSecondary }]}>
                  Due In
                </Text>
                <Text
                  style={[
                    styles.dueValue,
                    { color: order.urgent ? theme.error : theme.text },
                  ]}
                >
                  {order.dueIn}
                </Text>
              </View>
            </View>
          </FadeIn>

          {/* Progress */}
          <FadeIn delay={80}>
            <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.cardBackground,
                },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Progress
              </Text>
              <View
                style={[
                  styles.progressBarContainer,
                  { backgroundColor: "#f0f0f0" },
                ]}
              >
                <View
                  style={[
                    styles.progressBar,
                    {
                      width: `${order.progress * 100}%`,
                      backgroundColor: theme.primary,
                    },
                  ]}
                />
              </View>
              <Text
                style={[styles.progressText, { color: theme.textSecondary }]}
              >
                {Math.round(order.progress * 100)}% Complete
              </Text>
            </View>
          </FadeIn>

          {/* Timeline */}
          <FadeIn delay={120}>
            <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.cardBackground,
                },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Timeline
              </Text>
              {order.timeline.map((item, idx) => (
                <View key={idx} style={styles.timelineItem}>
                  <View style={styles.timelineLeft}>
                    <Ionicons
                      name={
                        item.completed ? "checkmark-circle" : "ellipse-outline"
                      }
                      size={20}
                      color={
                        item.completed ? theme.primary : theme.textSecondary
                      }
                    />
                    {idx < order.timeline.length - 1 && (
                      <View
                        style={[
                          styles.timelineLine,
                          { backgroundColor: theme.border },
                        ]}
                      />
                    )}
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={[styles.timelineStage, { color: theme.text }]}>
                      {item.stage}
                    </Text>
                    <Text
                      style={[
                        styles.timelineDate,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {item.date}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </FadeIn>

          {/* Job Specifications */}
          <FadeIn delay={160}>
            <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.cardBackground,
                },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Job Specifications
              </Text>
              <Text style={[styles.detailText, { color: theme.textSecondary }]}>
                {order.description}
              </Text>
              <View style={styles.specRow}>
                <Text
                  style={[styles.specLabel, { color: theme.textSecondary }]}
                >
                  Quantity:
                </Text>
                <Text style={[styles.specValue, { color: theme.text }]}>
                  {order.quantity}
                </Text>
              </View>
              <View style={styles.specRow}>
                <Text
                  style={[styles.specLabel, { color: theme.textSecondary }]}
                >
                  Product Type:
                </Text>
                <Text style={[styles.specValue, { color: theme.text }]}>
                  {order.productType}
                </Text>
              </View>
            </View>
          </FadeIn>

          {/* Delivery Address */}
          <FadeIn delay={200}>
            <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.cardBackground,
                },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Delivery Address
              </Text>
              <Text
                style={[styles.addressText, { color: theme.textSecondary }]}
              >
                {order.deliveryAddress}
              </Text>
            </View>
          </FadeIn>

          {/* ── Manufacturer-only: Review from SME ── */}
          {role === "manufacturer" && review && (
            <FadeIn delay={240}>
              <View
                style={[
                  styles.card,
                  { backgroundColor: theme.cardBackground },
                ]}
              >
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Review from SME
                </Text>

                {/* Star rows */}
                <ReviewStarRow
                  label="Overall"
                  value={review.overallRating}
                  theme={theme}
                />
                {review.qualityRating != null && review.qualityRating > 0 && (
                  <ReviewStarRow
                    label="Quality"
                    value={review.qualityRating}
                    theme={theme}
                  />
                )}
                {review.timelinessRating != null &&
                  review.timelinessRating > 0 && (
                    <ReviewStarRow
                      label="Timeliness"
                      value={review.timelinessRating}
                      theme={theme}
                    />
                  )}
                {review.communicationRating != null &&
                  review.communicationRating > 0 && (
                    <ReviewStarRow
                      label="Communication"
                      value={review.communicationRating}
                      theme={theme}
                    />
                  )}

                {review.comment ? (
                  <Text
                    style={[
                      styles.reviewComment,
                      { color: theme.textSecondary },
                    ]}
                  >
                    &ldquo;{review.comment}&rdquo;
                  </Text>
                ) : null}

                <Text
                  style={[styles.reviewDate, { color: theme.textSecondary }]}
                >
                  {formatDate(review.createdAt)}
                </Text>
              </View>
            </FadeIn>
          )}

          {/* Action Buttons */}
          {role === "manufacturer" && !isCompleted && canAdvance && (
            <FadeIn delay={280}>
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: theme.primary }]}
                  onPress={handleMarkNextMilestone}
                  disabled={updating}
                >
                  {updating ? (
                    <ActivityIndicator size="small" color={theme.onPrimary} />
                  ) : (
                    <Text
                      style={[styles.actionBtnText, { color: theme.onPrimary }]}
                    >
                      Mark as {STAGE_LABELS[milestone + 1]}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </FadeIn>
          )}

          {role === "manufacturer" && !isCompleted && apiOrder.status === "DELIVERED" && (
            <Text style={[styles.awaitingText, { color: theme.textSecondary }]}>
              Waiting on the buyer to confirm delivery.
            </Text>
          )}

          {role === "sme" && apiOrder.status === "DELIVERED" && (
            <FadeIn delay={280}>
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: theme.primary }]}
                  onPress={handleConfirmDelivery}
                  disabled={updating}
                >
                  {updating ? (
                    <ActivityIndicator size="small" color={theme.onPrimary} />
                  ) : (
                    <Text style={[styles.actionBtnText, { color: theme.onPrimary }]}>
                      Confirm Delivery
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </FadeIn>
          )}

          {/* ── SME-only: Review section (COMPLETED orders) ── */}
          {role === "sme" && isCompleted && (
            <FadeIn delay={300}>
              <View
                style={[
                  styles.card,
                  { backgroundColor: theme.cardBackground },
                ]}
              >
                <ReviewForm orderId={apiOrder.id} theme={theme} />
              </View>
            </FadeIn>
          )}

          {/* ── SME-only: Report Issue button ── */}
          {canReportIssue && (
            <FadeIn delay={340}>
              <TouchableOpacity
                style={[styles.reportBtn, { borderColor: "#EF4444" }]}
                onPress={() => setReportModalVisible(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="flag-outline" size={18} color="#EF4444" />
                <Text style={styles.reportBtnText}>Report an Issue</Text>
              </TouchableOpacity>
            </FadeIn>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </MainContainer>

      <ReportIssueModal
        visible={reportModalVisible}
        orderId={apiOrder.id}
        theme={theme}
        onClose={() => setReportModalVisible(false)}
      />
    </>
  );
}

export default function ManufacturerOrderDetailScreen() {
  return <OrderDetailScreen role="manufacturer" />;
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 15,
    paddingHorizontal: 15,
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  card: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  jobRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  orderJobImage: {
    width: 56,
    height: 56,
    borderRadius: 12,
  },
  jobName: {
    fontSize: 18,
    fontWeight: "800",
    flex: 1,
  },
  urgentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  urgentText: {
    fontSize: 12,
    fontWeight: "700",
  },
  smeName: {
    fontSize: 14,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 12,
  },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  amountLabel: { fontSize: 14 },
  amountValue: { fontSize: 16, fontWeight: "700" },
  milestoneRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  milestoneLabel: { fontSize: 14 },
  milestoneValue: { fontSize: 14, fontWeight: "600" },
  dueRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dueLabel: { fontSize: 14 },
  dueValue: { fontSize: 14, fontWeight: "600" },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  progressBarContainer: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressBar: {
    height: "100%",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    textAlign: "center",
  },
  timelineItem: {
    flexDirection: "row",
    marginBottom: 16,
  },
  timelineLeft: {
    alignItems: "center",
    width: 30,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: 4,
    minHeight: 20,
  },
  timelineContent: {
    flex: 1,
    marginLeft: 8,
  },
  timelineStage: {
    fontSize: 14,
    fontWeight: "500",
  },
  timelineDate: {
    fontSize: 12,
  },
  detailText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  specRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  specLabel: {
    width: 100,
    fontSize: 14,
  },
  specValue: {
    flex: 1,
    fontSize: 14,
  },
  addressText: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 15,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  actionBtnText: {
    fontWeight: "700",
  },
  awaitingText: {
    fontSize: 13,
    textAlign: "center",
    marginTop: 8,
    fontStyle: "italic",
  },
  reportBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 13,
    marginTop: 8,
  },
  reportBtnText: {
    color: "#EF4444",
    fontSize: 14,
    fontWeight: "700",
  },
  reviewStarRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  reviewStarLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  reviewStars: {
    flexDirection: "row",
  },
  reviewComment: {
    fontSize: 14,
    fontStyle: "italic",
    lineHeight: 21,
    marginTop: 8,
    marginBottom: 8,
  },
  reviewDate: {
    fontSize: 12,
    marginTop: 4,
  },
  notFound: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
});
