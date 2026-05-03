import MainContainer from "@/components/MainContainer";
import Spacer from "@/components/Spacer";
import Colors from "@/constants/colors";
import {
  BidStatus,
  BidWithManufacturer,
  getDaysUntilDeadline,
  getJobWithBids,
  JobWithBids,
} from "@/constants/Jobstore";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Animated,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

// FadeIn
const FadeIn = ({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;
  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 420,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 380,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
};

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORY_COLORS: Record<string, string> = {
  Packaging: "#3B82F6",
  Hardware: "#8B5CF6",
  Electronics: "#06B6D4",
  Textiles: "#EC4899",
  "Food Processing": "#F97316",
};
const getCategoryColor = (cat: string) => CATEGORY_COLORS[cat] ?? "#6B7280";

const BID_STATUS: Record<
  BidStatus,
  { label: string; color: string; bg: string }
> = {
  pending: { label: "Pending", color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
  accepted: {
    label: "Accepted",
    color: "#10B981",
    bg: "rgba(16,185,129,0.12)",
  },
  rejected: { label: "Rejected", color: "#EF4444", bg: "rgba(239,68,68,0.12)" },
};

//  Star rating
const StarRating = ({ rating, color }: { rating: number; color: string }) => (
  <View style={{ flexDirection: "row", gap: 2 }}>
    {[1, 2, 3, 4, 5].map((star) => (
      <Ionicons
        key={star}
        name={
          rating >= star
            ? "star"
            : rating >= star - 0.5
              ? "star-half"
              : "star-outline"
        }
        size={13}
        color={color}
      />
    ))}
  </View>
);

// ── Info row
const InfoRow = ({
  icon,
  label,
  value,
  theme,
  valueColor,
}: {
  icon: string;
  label: string;
  value: string;
  theme: any;
  valueColor?: string;
}) => (
  <View style={styles.infoRow}>
    <View
      style={[styles.infoIconWrap, { backgroundColor: theme.primary + "15" }]}
    >
      <Ionicons name={icon as any} size={15} color={theme.primary} />
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

//  Manufacturer detail modal
const ManufacturerModal = ({
  visible,
  manufacturer,
  bid,
  theme,
  onClose,
  onAccept,
  onReject,
}: {
  visible: boolean;
  manufacturer: BidWithManufacturer["manufacturer"] | null;
  bid: BidWithManufacturer | null;
  theme: any;
  onClose: () => void;
  onAccept: () => void;
  onReject: () => void;
}) => {
  if (!manufacturer || !bid) return null;
  const bidStatus = BID_STATUS[bid.status];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View
        style={[styles.modalContainer, { backgroundColor: theme.background }]}
      >
        {/* Modal handle */}
        <View style={[styles.modalHandle, { backgroundColor: theme.border }]} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Header */}
          <View
            style={[styles.modalHeader, { borderBottomColor: theme.border }]}
          >
            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.modalCloseBtn,
                {
                  backgroundColor: theme.cardBackground,
                  borderColor: theme.border,
                },
              ]}
            >
              <Ionicons name="close" size={20} color={theme.text} />
            </TouchableOpacity>

            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Manufacturer Profile
            </Text>

            <View style={{ width: 40 }} />
          </View>

          <View style={{ paddingHorizontal: 20 }}>
            {/* Identity block */}
            <View
              style={[
                styles.identityBlock,
                {
                  backgroundColor: theme.cardBackground,
                  borderColor: theme.border,
                },
              ]}
            >
              <View style={styles.identityRow}>
                {manufacturer.logo ? (
                  <Image
                    source={{ uri: manufacturer.logo }}
                    style={styles.manufacturerLogo}
                  />
                ) : (
                  <View
                    style={[
                      styles.logoPlaceholder,
                      { backgroundColor: theme.primary + "20" },
                    ]}
                  >
                    <Text
                      style={[styles.logoInitials, { color: theme.primary }]}
                    >
                      {manufacturer.name
                        .split(" ")
                        .map((w) => w[0])
                        .join("")
                        .slice(0, 2)}
                    </Text>
                  </View>
                )}
                <View style={styles.identityText}>
                  <View style={styles.nameRow}>
                    <Text
                      style={[styles.manufacturerName, { color: theme.text }]}
                    >
                      {manufacturer.name}
                    </Text>
                    {manufacturer.verified && (
                      <View style={styles.verifiedBadge}>
                        <Ionicons
                          name="checkmark-circle"
                          size={14}
                          color="#3B82F6"
                        />
                        <Text style={styles.verifiedText}>Verified</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.ratingRow}>
                    <StarRating rating={manufacturer.rating} color="#F59E0B" />
                    <Text
                      style={[
                        styles.ratingText,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {manufacturer.rating} ({manufacturer.reviewCount} reviews)
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.manufacturerLocation,
                      { color: theme.textSecondary },
                    ]}
                  >
                    <Ionicons name="location-outline" size={12} />{" "}
                    {manufacturer.location}
                  </Text>
                </View>
              </View>

              <Text
                style={[
                  styles.manufacturerDesc,
                  { color: theme.textSecondary, borderTopColor: theme.border },
                ]}
              >
                {manufacturer.description}
              </Text>
            </View>

            {/* Manufacturer stats */}
            {/* <View style={styles.statsGrid}>
              {[
                {
                  icon: "briefcase-outline",
                  label: "Jobs Done",
                  value: String(manufacturer.completedJobs),
                },
                {
                  icon: "flash-outline",
                  label: "Response Time",
                  value: manufacturer.responseTime,
                },
                {
                  icon: "cube-outline",
                  label: "Capacity",
                  value: manufacturer.capacity,
                },
              ].map((stat) => (
                <View
                  key={stat.label}
                  style={[
                    styles.statGridCard,
                    {
                      backgroundColor: theme.cardBackground,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Ionicons
                    name={stat.icon as any}
                    size={20}
                    color={theme.primary}
                  />
                  <Text style={[styles.statGridValue, { color: theme.text }]}>
                    {stat.value}
                  </Text>
                  <Text
                    style={[
                      styles.statGridLabel,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {stat.label}
                  </Text>
                </View>
              ))}
            </View> */}

            {/* Specialties */}
            <Text style={[styles.sectionHeading, { color: theme.text }]}>
              Specialties
            </Text>
            <View style={styles.tagsWrap}>
              {manufacturer.specialties.map((s) => (
                <View
                  key={s}
                  style={[
                    styles.tag,
                    {
                      backgroundColor: theme.primary + "15",
                      borderColor: theme.primary + "30",
                    },
                  ]}
                >
                  <Text style={[styles.tagText, { color: theme.primary }]}>
                    {s}
                  </Text>
                </View>
              ))}
            </View>

            {/* Bid details */}
            <Text style={[styles.sectionHeading, { color: theme.text }]}>
              Their Bid
            </Text>
            <View
              style={[
                styles.bidDetailCard,
                {
                  backgroundColor: theme.cardBackground,
                  borderColor: theme.border,
                },
              ]}
            >
              <View style={styles.bidDetailRow}>
                <View style={styles.bidAmountBlock}>
                  <Text
                    style={[
                      styles.bidAmountLabel,
                      { color: theme.textSecondary },
                    ]}
                  >
                    Bid Amount
                  </Text>
                  <Text
                    style={[styles.bidAmountValue, { color: theme.primary }]}
                  >
                    {bid.amount}
                  </Text>
                </View>
                <View
                  style={[
                    styles.bidStatusBadge,
                    { backgroundColor: bidStatus.bg },
                  ]}
                >
                  <Text
                    style={[styles.bidStatusText, { color: bidStatus.color }]}
                  >
                    {bidStatus.label}
                  </Text>
                </View>
              </View>
              <View
                style={[styles.bidDivider, { backgroundColor: theme.border }]}
              />
              <View style={styles.bidMeta}>
                <View style={styles.bidMetaItem}>
                  <Ionicons
                    name="time-outline"
                    size={15}
                    color={theme.textSecondary}
                  />
                  <Text
                    style={[styles.bidMetaText, { color: theme.textSecondary }]}
                  >
                    Delivery in{" "}
                    <Text style={{ color: theme.text, fontWeight: "700" }}>
                      {bid.deliveryDays} days
                    </Text>
                  </Text>
                </View>
                <View style={styles.bidMetaItem}>
                  <Ionicons
                    name="calendar-outline"
                    size={15}
                    color={theme.textSecondary}
                  />
                  <Text
                    style={[styles.bidMetaText, { color: theme.textSecondary }]}
                  >
                    Submitted{" "}
                    <Text style={{ color: theme.text, fontWeight: "700" }}>
                      {bid.submittedAt}
                    </Text>
                  </Text>
                </View>
              </View>
              <View
                style={[
                  styles.bidNoteBox,
                  {
                    backgroundColor: theme.primary + "0A",
                    borderColor: theme.primary + "25",
                  },
                ]}
              >
                <Text style={[styles.bidNoteLabel, { color: theme.primary }]}>
                  Note from manufacturer
                </Text>
                <Text style={[styles.bidNoteText, { color: theme.text }]}>
                  {bid.notes}
                </Text>
              </View>
            </View>

            {/* Actions */}
            {bid.status === "pending" && (
              <View style={styles.actionRow}>
                <TouchableOpacity
                  onPress={onReject}
                  style={[styles.rejectBtn, { borderColor: "#EF4444" }]}
                >
                  <Ionicons
                    name="close-circle-outline"
                    size={18}
                    color="#EF4444"
                  />
                  <Text style={[styles.rejectBtnText, { color: "#EF4444" }]}>
                    Decline Bid
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={onAccept}
                  style={[styles.acceptBtn, { backgroundColor: "#10B981" }]}
                >
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={18}
                    color="#fff"
                  />
                  <Text style={styles.acceptBtnText}>Accept Bid</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Contact */}
            <TouchableOpacity
              style={[
                styles.contactBtn,
                {
                  backgroundColor: theme.cardBackground,
                  borderColor: theme.border,
                },
              ]}
            >
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={18}
                color={theme.primary}
              />
              <Text style={[styles.contactBtnText, { color: theme.primary }]}>
                Message {manufacturer.name}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

//  Bid card
const BidCard = ({
  bid,
  theme,
  delay,
  onPress,
}: {
  bid: BidWithManufacturer;
  theme: any;
  delay: number;
  onPress: () => void;
}) => {
  const { manufacturer } = bid;
  const bidStatus = BID_STATUS[bid.status];
  const scaleAnim = useRef(new Animated.Value(1)).current;

  return (
    <FadeIn delay={delay}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          onPress={onPress}
          onPressIn={() =>
            Animated.spring(scaleAnim, {
              toValue: 0.975,
              useNativeDriver: true,
              speed: 40,
            }).start()
          }
          onPressOut={() =>
            Animated.spring(scaleAnim, {
              toValue: 1,
              useNativeDriver: true,
              speed: 30,
            }).start()
          }
          activeOpacity={1}
        >
          <View
            style={[
              styles.bidCard,
              {
                backgroundColor: theme.cardBackground,
                borderColor: theme.border,
              },
            ]}
          >
            {/* Manufacturer identity */}
            <View style={styles.bidCardHeader}>
              <View style={styles.bidManufacturerRow}>
                {manufacturer.logo ? (
                  <Image
                    source={{ uri: manufacturer.logo }}
                    style={styles.bidLogo}
                  />
                ) : (
                  <View
                    style={[
                      styles.bidLogoPlaceholder,
                      { backgroundColor: theme.primary + "20" },
                    ]}
                  >
                    <Text
                      style={[styles.bidLogoInitials, { color: theme.primary }]}
                    >
                      {manufacturer.name
                        .split(" ")
                        .map((w) => w[0])
                        .join("")
                        .slice(0, 2)}
                    </Text>
                  </View>
                )}
                <View style={styles.bidManufacturerInfo}>
                  <View style={styles.bidNameRow}>
                    <Text
                      style={[
                        styles.bidManufacturerName,
                        { color: theme.text },
                      ]}
                      numberOfLines={1}
                    >
                      {manufacturer.name}
                    </Text>

                    {manufacturer.verified && (
                      <Ionicons
                        name="checkmark-circle"
                        size={14}
                        color="#3B82F6"
                        style={{}}
                      />
                    )}
                  </View>

                  <View style={styles.bidRatingRow}>
                    <StarRating rating={manufacturer.rating} color="#F59E0B" />

                    <Text
                      style={[
                        styles.bidRatingText,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {manufacturer.rating}
                    </Text>
                  </View>

                  <View style={{ flexDirection: "row", marginTop: 5, gap: 3 }}>
                    <Ionicons
                      name="location-outline"
                      size={15}
                      color={theme.textSecondary}
                    />
                    <Text
                      style={[
                        styles.bidLocationText,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {manufacturer.location}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Key figures */}
            <View style={[styles.bidFiguresRow]}>
              <View style={styles.bidFigure}>
                <Text
                  style={[
                    styles.bidFigureLabel,
                    { color: theme.textSecondary },
                  ]}
                >
                  Bid Amount
                </Text>

                <Text style={[styles.bidFigureValue, { color: theme.primary }]}>
                  {bid.amount}
                </Text>
              </View>

              <View
                style={[
                  styles.bidFigureDivider,
                  { backgroundColor: theme.border },
                ]}
              />

              <View style={styles.bidFigure}>
                <Text
                  style={[
                    styles.bidFigureLabel,
                    { color: theme.textSecondary },
                  ]}
                >
                  Delivery
                </Text>

                <Text style={[styles.bidFigureValue, { color: theme.text }]}>
                  {bid.deliveryDays} days
                </Text>
              </View>
            </View>
            <Spacer style={{ height: 15 }} />
          </View>
        </TouchableOpacity>
      </Animated.View>
    </FadeIn>
  );
};

// ─── Screen ───────────────────────────────────────────────────────────────────
const JobDetails = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"] ?? Colors.light;

  const [job, setJob] = useState<JobWithBids | undefined>(() =>
    getJobWithBids(id),
  );
  const [selectedBid, setSelectedBid] = useState<BidWithManufacturer | null>(
    null,
  );

  if (!job) {
    return (
      <MainContainer safe>
        <View style={styles.notFound}>
          <Ionicons
            name="alert-circle-outline"
            size={48}
            color={theme.textSecondary}
          />
          <Text style={[styles.notFoundText, { color: theme.textSecondary }]}>
            No Available Job Found.
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backBtn, { backgroundColor: theme.primary }]}
          >
            <Text style={{ color: "#fff", fontWeight: "700" }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </MainContainer>
    );
  }

  const catColor = getCategoryColor(job.category);
  const daysLeft = getDaysUntilDeadline(job.deadline);
  const isUrgent = daysLeft <= 7 && job.status === "active";

  const handleAcceptBid = () => {
    if (!selectedBid) return;
    setJob((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        bids: prev.bids.map((b) =>
          b.id === selectedBid.id
            ? { ...b, status: "accepted" as BidStatus }
            : b.status === "pending"
              ? { ...b, status: "rejected" as BidStatus }
              : b,
        ),
      };
    });
    setSelectedBid(null);
  };

  const handleRejectBid = () => {
    if (!selectedBid) return;
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

  return (
    <MainContainer safe>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 48 }}
      >
        {/* ── Back + action header ── */}
        <FadeIn delay={0}>
          <View style={styles.detailHeader}>
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

            <TouchableOpacity
              style={[
                styles.editBtn,
                {
                  backgroundColor: theme.cardBackground,
                  borderColor: theme.border,
                },
              ]}
            >
              <Ionicons name="create-outline" size={18} color={theme.primary} />
            </TouchableOpacity>
          </View>
        </FadeIn>

        {/* ── Hero card ── */}
        <FadeIn delay={40}>
          <View
            style={[
              styles.heroCard,
              {
                backgroundColor: theme.cardBackground,
                borderColor: theme.border,
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
                    style={[styles.heroImage, { borderColor: theme.border }]}
                    resizeMode="contain"
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

        {/* ── Info rows ── */}
        <FadeIn delay={80}>
          <View
            style={[
              styles.infoCard,
              {
                backgroundColor: theme.cardBackground,
                borderColor: theme.border,
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
            <View
              style={[
                styles.infoCardDivider,
                { backgroundColor: theme.border },
              ]}
            />
            <InfoRow
              icon="calendar-outline"
              label="Deadline"
              value={job.deadline}
              theme={theme}
              valueColor={isUrgent ? "#EF4444" : undefined}
            />
            <View
              style={[
                styles.infoCardDivider,
                { backgroundColor: theme.border },
              ]}
            />
            <InfoRow
              icon="time-outline"
              label="Posted"
              value={job.postedAt}
              theme={theme}
            />
          </View>
        </FadeIn>

        {/* ── Bids section ── */}
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
                <Text style={styles.bidsCountBubbleText}>
                  {job.bids.length}
                </Text>
              </View>
            </View>

            {job.bids.length === 0 ? (
              <View
                style={[
                  styles.noBidsBox,
                  {
                    backgroundColor: theme.cardBackground,
                    borderColor: theme.border,
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
              job.bids.map((bid, i) => (
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

      {/* ── Manufacturer detail modal ── */}
      <ManufacturerModal
        visible={!!selectedBid}
        manufacturer={selectedBid?.manufacturer ?? null}
        bid={selectedBid}
        theme={theme}
        onClose={() => setSelectedBid(null)}
        onAccept={handleAcceptBid}
        onReject={handleRejectBid}
      />
    </MainContainer>
  );
};

export default JobDetails;

const styles = StyleSheet.create({
  // Header
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
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  detailHeaderTitle: { fontSize: 17, fontWeight: "700", letterSpacing: -0.3 },
  editBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  // Hero card
  heroCard: {
    marginHorizontal: 20,
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 4,
  },
  heroAccent: { height: 3 },
  heroInner: { padding: 16 },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  heroLeft: { flex: 1, marginRight: 12 },
  heroCategoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 8,
  },
  heroCategoryDot: { width: 6, height: 6, borderRadius: 3 },
  heroCategoryText: { fontSize: 11, fontWeight: "700", letterSpacing: 0.2 },
  heroTitle: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
    lineHeight: 27,
    marginBottom: 4,
  },
  heroQuantity: { fontSize: 14, fontWeight: "500" },
  heroImage: { width: 80, height: 80, borderRadius: 14, borderWidth: 1 },
  heroDescription: {
    fontSize: 14,
    lineHeight: 21,
    borderTopWidth: 1,
    paddingTop: 14,
    marginTop: 4,
  },

  // Info card
  infoCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 4,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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

  // Bids section
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
  bidsCountBubbleText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  noBidsBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 32,
    alignItems: "center",
    gap: 12,
  },
  noBidsText: { fontSize: 15, textAlign: "center", lineHeight: 22 },

  // Bid card
  bidCard: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  bidCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 14,
  },
  bidManufacturerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  bidLogo: { width: 46, height: 46, borderRadius: 12 },
  bidLogoPlaceholder: {
    width: 46,
    height: 46,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  bidLogoInitials: { fontSize: 16, fontWeight: "800" },
  bidManufacturerInfo: { flex: 1 },
  bidNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 3,
  },
  bidManufacturerName: { fontSize: 15, fontWeight: "700", flex: 1 },
  bidRatingRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  bidRatingText: { fontSize: 12, fontWeight: "600" },
  bidLocationText: { fontSize: 12, flex: 1 },
  bidStatusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  bidStatusPillText: { fontSize: 12, fontWeight: "700" },
  bidFiguresRow: {
    flexDirection: "row",
  },
  bidFigure: { flex: 1, paddingVertical: 12, alignItems: "center" },
  bidFigureDivider: { width: 1 },
  bidFigureLabel: { fontSize: 11, fontWeight: "500", marginBottom: 3 },
  bidFigureValue: { fontSize: 15, fontWeight: "800", letterSpacing: -0.3 },
  bidNotes: {
    fontSize: 13,
    lineHeight: 20,
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  bidTapHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 14,
  },
  bidTapHintText: { fontSize: 13, fontWeight: "600" },

  // Modal
  modalContainer: { flex: 1, paddingTop: 12 },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 8,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    marginBottom: 20,
  },
  modalCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalTitle: { fontSize: 17, fontWeight: "700" },

  // Modal — identity block
  identityBlock: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  identityRow: { flexDirection: "row", gap: 14, marginBottom: 12 },
  manufacturerLogo: { width: 64, height: 64, borderRadius: 14 },
  logoPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  logoInitials: { fontSize: 22, fontWeight: "800" },
  identityText: { flex: 1, justifyContent: "center", gap: 4 },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  manufacturerName: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.4,
    flex: 1,
  },
  verifiedBadge: { flexDirection: "row", alignItems: "center", gap: 3 },
  verifiedText: { fontSize: 12, color: "#3B82F6", fontWeight: "600" },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  ratingText: { fontSize: 12 },
  manufacturerLocation: { fontSize: 13 },
  manufacturerDesc: {
    fontSize: 14,
    lineHeight: 21,
    borderTopWidth: 1,
    paddingTop: 12,
  },

  // Modal — stats grid
  statsGrid: { flexDirection: "row", gap: 10, marginBottom: 20 },
  statGridCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    alignItems: "center",
    gap: 4,
  },
  statGridValue: { fontSize: 14, fontWeight: "800", textAlign: "center" },
  statGridLabel: { fontSize: 11, fontWeight: "500", textAlign: "center" },

  // Modal — specialties
  sectionHeading: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
    marginBottom: 10,
  },
  tagsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  tagText: { fontSize: 13, fontWeight: "600" },

  // Modal — bid detail card
  bidDetailCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  bidDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  bidAmountBlock: {},
  bidAmountLabel: { fontSize: 11, fontWeight: "500", marginBottom: 2 },
  bidAmountValue: { fontSize: 24, fontWeight: "800", letterSpacing: -0.5 },
  bidStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  bidStatusText: { fontSize: 13, fontWeight: "700" },
  bidDivider: { height: 1, marginBottom: 12 },
  bidMeta: { gap: 8, marginBottom: 14 },
  bidMetaItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  bidMetaText: { fontSize: 14 },
  bidNoteBox: { borderRadius: 12, borderWidth: 1, padding: 14 },
  bidNoteLabel: { fontSize: 12, fontWeight: "700", marginBottom: 6 },
  bidNoteText: { fontSize: 14, lineHeight: 21 },

  // Actions
  actionRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  rejectBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  rejectBtnText: { fontSize: 15, fontWeight: "700" },
  acceptBtn: {
    flex: 1.5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  acceptBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  contactBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  contactBtnText: { fontSize: 15, fontWeight: "700" },

  // Not found
  notFound: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  notFoundText: { fontSize: 16 },
  backBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
});
