import FadeIn from "@/components/common/FadeIn";
import MainContainer from "@/components/MainContainer";
import BidCard from "@/components/sme/BidCard";
import ManufacturerModal from "@/components/sme/ManufacturerModal";
import Colors from "@/constants/colors";
import {
  BidStatus,
  getDaysUntilDeadline,
  getJobWithBids,
  JobWithBids,
} from "@/constants/Jobstore";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

// ─── Constants (only those needed in this file) ───────────────────────────────
const CATEGORY_COLORS: Record<string, string> = {
  Packaging: "#3B82F6",
  Hardware: "#8B5CF6",
  Electronics: "#06B6D4",
  Textiles: "#EC4899",
  "Food Processing": "#F97316",
};
const getCategoryColor = (cat: string) => CATEGORY_COLORS[cat] ?? "#6B7280";

// Info row component (unchanged)
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

  const [job, setJob] = useState<JobWithBids | undefined>(() =>
    getJobWithBids(id),
  );
  const [selectedBid, setSelectedBid] = useState<any | null>(null);

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
            {/* <View
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
            /> */}
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
  heroImage: { width: 80, height: 80, borderRadius: 14, borderWidth: 1 },
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
