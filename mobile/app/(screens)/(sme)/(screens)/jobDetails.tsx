import FadeIn from "@/components/common/FadeIn";
import MainContainer from "@/components/MainContainer";
import BidCard from "@/components/sme/BidCard";
import ManufacturerModal, {
  type ManufacturerProfile,
} from "@/components/sme/ManufacturerModal";
import Spacer from "@/components/Spacer";
import Colors from "@/constants/colors";
import { BidStatus, getDaysUntilDeadline } from "@/constants/Jobstore";
import { api } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

// ---------- API response types (per OpenAPI spec) ----------
interface JobApiResponse {
  id: string;
  smeId: string;
  smeName: string;
  title: string;
  productType: string;
  sectorTag: string;
  quantity: number;
  specifications?: string;
  budgetMinGhs: number;
  budgetMaxGhs: number;
  deadline: string;
  attachmentUrls?: string[];
  deliveryAddress?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface BidApiResponse {
  id: string;
  jobId: string;
  factoryId: string;
  factoryName: string;
  factorySectorTags?: string[];
  factory?: {
    id?: string;
    name?: string;
    companyName?: string;
    logoUrl?: string | null;
    profileImageUrl?: string | null;
    verified?: boolean;
    isVerified?: boolean;
    rating?: number | null;
    averageRating?: number | null;
    reviewCount?: number | null;
    ratingCount?: number | null;
    location?: string | null;
    address?: string | null;
    town?: string | null;
    region?: string | null;
    description?: string | null;
    sectorTags?: string[];
    specialties?: string[];
  };
  factoryLogoUrl?: string | null;
  factoryProfileImageUrl?: string | null;
  factoryVerified?: boolean;
  factoryRating?: number | null;
  factoryAverageRating?: number | null;
  factoryReviewCount?: number | null;
  factoryRatingCount?: number | null;
  factoryLocation?: string | null;
  factoryAddress?: string | null;
  factoryTown?: string | null;
  factoryRegion?: string | null;
  reviewCount?: number | null;
  ratingCount?: number | null;
  averageRating?: number | null;
  factoryDescription?: string | null;
  pricePerUnitGhs: number;
  totalPriceGhs: number;
  productionDays: number;
  deliveryDateEstimate: string;
  message?: string;
  status: string; // PENDING, ACCEPTED, REJECTED, WITHDRAWN, EXPIRED
  createdAt: string;
}

// Trimmed OrderDetailResponse — just enough to resolve a bid's order
// and hand its id to the payment endpoint.
interface OrderApiResponse {
  id: string;
  bidId: string;
}

// ---------- Local display types (what BidCard / ManufacturerModal expect) ----------
interface DisplayBid {
  id: string;
  status: BidStatus;
  amount: string;
  deliveryDays: number;
  notes: string;
  submittedAt: string;
  manufacturer: ManufacturerProfile;
}

interface DisplayJob {
  id: string;
  product: string;
  quantity: string;
  image: string | null;
  description: string;
  budget: string;
  location: string;
  deadline: string;
  status: "active" | "completed" | "draft";
  bids: DisplayBid[];
}

// ---------- Mappers ----------
function mapApiStatusToTab(status: string): DisplayJob["status"] {
  if (status === "DRAFT") return "draft";
  if (status === "COMPLETED") return "completed";
  return "active";
}

function mapBidStatus(status: string): BidStatus {
  const normalizedStatus = status?.toUpperCase();
  if (normalizedStatus === "ACCEPTED") return "accepted";
  if (
    normalizedStatus === "REJECTED" ||
    normalizedStatus === "WITHDRAWN" ||
    normalizedStatus === "EXPIRED"
  ) {
    return "rejected";
  }
  return "pending";
}

function transformManufacturer(bid: BidApiResponse): ManufacturerProfile {
  const factory = bid.factory;
  const rating =
    factory?.averageRating ??
    factory?.rating ??
    bid.factoryAverageRating ??
    bid.averageRating ??
    bid.factoryRating;
  const reviewCount =
    factory?.reviewCount ??
    factory?.ratingCount ??
    bid.factoryReviewCount ??
    bid.factoryRatingCount ??
    bid.reviewCount ??
    bid.ratingCount;

  return {
    id: factory?.id || bid.factoryId,
    name:
      factory?.companyName ||
      factory?.name ||
      bid.factoryName ||
      "Manufacturer",
    logo:
      factory?.logoUrl ||
      factory?.profileImageUrl ||
      bid.factoryLogoUrl ||
      bid.factoryProfileImageUrl ||
      null,
    verified:
      factory?.verified ?? factory?.isVerified ?? bid.factoryVerified ?? false,
    rating: typeof rating === "number" && Number.isFinite(rating) ? rating : 0,
    reviewCount:
      typeof reviewCount === "number" && Number.isFinite(reviewCount)
        ? reviewCount
        : 0,
    location:
      factory?.location ||
      factory?.address ||
      factory?.town ||
      factory?.region ||
      bid.factoryLocation ||
      bid.factoryAddress ||
      [bid.factoryTown, bid.factoryRegion].filter(Boolean).join(", ") ||
      "Location not provided",
    description:
      factory?.description ||
      bid.factoryDescription ||
      "No company description provided.",
    specialties: [
      ...(factory?.sectorTags || factory?.specialties || []),
      ...(bid.factorySectorTags || []),
    ].filter((tag, index, tags) => Boolean(tag) && tags.indexOf(tag) === index),
  };
}

function transformBid(bid: BidApiResponse): DisplayBid {
  return {
    id: bid.id,
    status: mapBidStatus(bid.status),
    amount: `GHS ${bid.totalPriceGhs.toLocaleString()}`,
    deliveryDays: bid.productionDays,
    notes: bid.message ?? "No message from manufacturer.",
    submittedAt: new Date(bid.createdAt).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    manufacturer: transformManufacturer(bid),
  };
}

function transformJob(job: JobApiResponse, bids: BidApiResponse[]): DisplayJob {
  const budget =
    job.budgetMinGhs && job.budgetMaxGhs
      ? `GHS ${job.budgetMinGhs} – ${job.budgetMaxGhs}`
      : "Budget not set";

  return {
    id: job.id,
    product: job.title,
    quantity: `${job.quantity} pcs`,
    image: job.attachmentUrls?.[0] ?? null,
    description: job.specifications ?? "No specifications provided.",
    budget,
    location: job.deliveryAddress ?? "Not specified",
    deadline: job.deadline,
    status: mapApiStatusToTab(job.status),
    bids: bids.map(transformBid),
  };
}

const InfoRow = ({ icon, label, value, theme, valueColor }: any) => (
  <View style={styles.infoRow}>
    <View
      style={[styles.infoIconWrap, { backgroundColor: theme.primary + "15" }]}
    >
      <Ionicons name={icon} size={15} color={theme.primary} />
    </View>
    <View style={styles.infoTextWrap}>
      <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
        {label}
      </Text>
      <Text style={[styles.infoValue, { color: valueColor ?? theme.text }]}>
        {value}
      </Text>
    </View>
  </View>
);

// ─── Main Screen ─────────────────────────────────────────────────────────────
const JobDetails = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"] ?? Colors.light;

  const [job, setJob] = useState<DisplayJob | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acceptingBidId, setAcceptingBidId] = useState<string | null>(null);
  const [selectedBid, setSelectedBid] = useState<DisplayBid | null>(null);
  // Drives the per-card spinner on BidCard's own quick-action button —
  // separate from ManufacturerModal's internal "resolvingPayment"
  // state, since that button lives outside the modal.
  const [payingBidId, setPayingBidId] = useState<string | null>(null);

  const fetchJobDetails = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);

      const [jobRes, bidsRes] = await Promise.all([
        api.get<JobApiResponse>(`jobs/${id}`),
        api.get<BidApiResponse[]>(`jobs/${id}/bids`),
      ]);

      setJob(transformJob(jobRes.data, bidsRes.data));
    } catch (err) {
      if (axios.isAxiosError(err)) {
        console.log("STATUS:", err.response?.status);
        console.log("DATA:", err.response?.data);
      } else {
        console.log(err);
      }
      setError("Failed to load job details.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      fetchJobDetails();
    }, [fetchJobDetails]),
  );

  const handleAcceptBid = async () => {
    if (!selectedBid) return;

    try {
      setAcceptingBidId(selectedBid.id);
      await api.patch(`bids/${selectedBid.id}/accept`);
      await fetchJobDetails();
      // Keep the modal open and transition to the payment step by updating the bid status
      setSelectedBid((prev) =>
        prev ? { ...prev, status: "accepted" as BidStatus } : null,
      );
    } catch (err) {
      if (axios.isAxiosError(err)) {
        console.log(
          "ACCEPT BID ERROR:",
          err.response?.status,
          err.response?.data,
        );
      } else {
        console.log(err);
      }
      setError("Failed to accept bid. Please try again.");
    } finally {
      setAcceptingBidId(null);
    }
  };

  const handleRejectBid = () => {
    if (!selectedBid) return;

    console.warn(
      "handleRejectBid: no backend endpoint exists for this — local UI only.",
    );

    setJob((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        bids: prev.bids.map((b) =>
          b.id === selectedBid.id
            ? { ...b, status: "rejected" as BidStatus }
            : b,
        ),
      };
    });
    setSelectedBid(null);
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

  if (error || !job) {
    return (
      <MainContainer safe>
        <View style={styles.notFound}>
          <Ionicons
            name="alert-circle-outline"
            size={48}
            color={theme.textSecondary}
          />
          <Text style={[styles.notFoundText, { color: theme.textSecondary }]}>
            {error ?? "No Available Job Found."}
          </Text>

          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backBtn, { backgroundColor: theme.primary }]}
          >
            <Text style={{ color: theme.onPrimary, fontWeight: "700" }}>
              Go Back
            </Text>
          </TouchableOpacity>
        </View>
      </MainContainer>
    );
  }

  const daysLeft = getDaysUntilDeadline(job.deadline);
  const isUrgent = daysLeft <= 7 && job.status === "active";
  const visibleBids = job.bids.filter((bid) => bid.status !== "rejected");

  return (
    <MainContainer safe>
      <View style={styles.detailHeader}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            gap: 10,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={[
              styles.backCircleBtn,
              {
                backgroundColor: theme.cardBackground,
                borderColor: theme.border,
              },
            ]}
          >
            <Ionicons name="chevron-back" size={20} color={theme.text} />
          </TouchableOpacity>

          <Text style={[styles.detailHeaderTitle, { color: theme.text }]}>
            Job Details
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 48 }}
      >
        <FadeIn delay={40}>
          <Spacer style={{ height: 20 }} />

          <View
            style={[
              styles.heroCard,
              {
                backgroundColor: theme.cardBackground,
              },
            ]}
          >
            <View style={styles.heroInner}>
              <View style={styles.heroTop}>
                <View style={styles.heroLeft}>
                  <Text style={[styles.heroTitle, { color: theme.text }]}>
                    {job.product}
                  </Text>
                  <Text
                    style={[
                      styles.heroQuantity,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {job.quantity}
                  </Text>
                </View>

                {job.image && (
                  <Image
                    source={{ uri: job.image }}
                    style={[
                      styles.heroImage,
                      { borderWidth: 1, borderColor: theme.border },
                    ]}
                    resizeMode="cover"
                  />
                )}
              </View>

              <Text
                style={[
                  styles.heroDescription,
                  { color: theme.textSecondary, borderTopColor: theme.border },
                ]}
              >
                {job.description}
              </Text>
            </View>
          </View>
        </FadeIn>

        <FadeIn delay={80}>
          <View
            style={[
              styles.infoCard,
              {
                backgroundColor: theme.cardBackground,
              },
            ]}
          >
            <InfoRow
              icon="cash-outline"
              label="Budget"
              value={job.budget}
              theme={theme}
              valueColor={theme.primary}
            />
            <View
              style={[
                styles.infoCardDivider,
                { backgroundColor: theme.border },
              ]}
            />
            <InfoRow
              icon="location-outline"
              label="Location"
              value={job.location}
              theme={theme}
            />
          </View>
        </FadeIn>

        <FadeIn delay={120}>
          <View style={styles.bidsSection}>
            <View style={styles.bidsSectionHeader}>
              <Text style={[styles.bidsSectionTitle, { color: theme.text }]}>
                Bids Received
              </Text>

              <View
                style={[
                  styles.bidsCountBubble,
                  { backgroundColor: theme.primary },
                ]}
              >
                <Text
                  style={[
                    styles.bidsCountBubbleText,
                    { color: theme.onPrimary },
                  ]}
                >
                  {job.bids.length}
                </Text>
              </View>
            </View>

            {visibleBids.length === 0 ? (
              <View
                style={[
                  styles.noBidsBox,
                  {
                    backgroundColor: theme.cardBackground,
                  },
                ]}
              >
                <Ionicons
                  name="hourglass-outline"
                  size={32}
                  color={theme.textSecondary}
                />
                <Text
                  style={[styles.noBidsText, { color: theme.textSecondary }]}
                >
                  No bids yet. Manufacturers will respond soon.
                </Text>
              </View>
            ) : (
              visibleBids.map((bid, i) => (
                <BidCard
                  key={bid.id}
                  bid={bid}
                  theme={theme}
                  delay={160 + i * 60}
                  onPress={() => setSelectedBid(bid)}
                />
              ))
            )}
          </View>
        </FadeIn>
      </ScrollView>

      <ManufacturerModal
        visible={!!selectedBid}
        manufacturer={selectedBid?.manufacturer ?? null}
        bid={selectedBid}
        orderId={selectedBid?.id}
        jobId={id}
        theme={theme}
        onClose={() => setSelectedBid(null)}
        onAccept={handleAcceptBid}
        onReject={handleRejectBid}
        onPaymentComplete={fetchJobDetails}
      />
    </MainContainer>
  );
};

const styles = StyleSheet.create({
  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  backCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  detailHeaderTitle: { fontSize: 17, fontWeight: "700", letterSpacing: -0.3 },
  heroCard: {
    marginHorizontal: 20,
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
  },
  heroInner: { padding: 16 },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  heroLeft: { flex: 1, marginRight: 12 },
  heroTitle: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
    lineHeight: 27,
    marginBottom: 4,
  },
  heroQuantity: { fontSize: 14, fontWeight: "500" },
  heroImage: { width: 80, height: 80, borderRadius: 14, overflow: "hidden" },
  heroDescription: {
    fontSize: 14,
    lineHeight: 21,
    borderTopWidth: 1,
    paddingTop: 14,
    marginTop: 4,
  },
  infoCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    paddingVertical: 4,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  infoIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  infoTextWrap: { flex: 1 },
  infoLabel: { fontSize: 11, fontWeight: "500", marginBottom: 2 },
  infoValue: { fontSize: 15, fontWeight: "600" },
  infoCardDivider: { height: 1, marginHorizontal: 16, opacity: 0.5 },
  bidsSection: { paddingHorizontal: 20 },
  bidsSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  bidsSectionTitle: { fontSize: 20, fontWeight: "800", letterSpacing: -0.4 },
  bidsCountBubble: {
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    paddingHorizontal: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  bidsCountBubbleText: { fontSize: 13, fontWeight: "700" },
  noBidsBox: {
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    gap: 12,
  },
  noBidsText: { fontSize: 15, textAlign: "center", lineHeight: 22 },
  notFound: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  notFoundText: { fontSize: 16 },
  backBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
});

export default JobDetails;
