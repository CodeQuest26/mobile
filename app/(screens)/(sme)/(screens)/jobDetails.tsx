import MainContainer from "@/components/MainContainer";
import Colors from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useRef } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

// FadeIn animation component
const FadeIn = ({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;

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

// Mock data (same as in jobs.tsx)
const MOCK_BIDS = [
  {
    id: "b1",
    jobId: "j1",
    manufacturerId: "m1",
    manufacturerName: "Accra Metal Works",
    amount: "GH₵ 48,500",
    deliveryTime: "21 days",
    notes:
      "ISO 9001 certified with 10+ years experience in beverage packaging. We have state-of-the-art printing equipment and can handle custom branding requirements.",
    submittedAt: "2025-04-29",
    status: "pending",
    rating: 4.8,
    completedJobs: 89,
  },
  {
    id: "b2",
    jobId: "j1",
    manufacturerId: "m2",
    manufacturerName: "Ghana Industrial Ltd",
    amount: "GH₵ 51,200",
    deliveryTime: "18 days",
    notes:
      "Full-service manufacturing with integrated design capabilities. Our facility includes CNC machining and custom printing services.",
    submittedAt: "2025-04-30",
    status: "pending",
    rating: 4.6,
    completedJobs: 156,
  },
  {
    id: "b3",
    jobId: "j1",
    manufacturerId: "m3",
    manufacturerName: "Tema Manufacturing Co.",
    amount: "GH₵ 49,800",
    deliveryTime: "25 days",
    notes:
      "Specialized in metal packaging solutions with extensive quality control processes. We offer competitive pricing with guaranteed delivery.",
    submittedAt: "2025-04-28",
    status: "pending",
    rating: 4.4,
    completedJobs: 67,
  },
];

const SME_JOBS = [
  {
    id: "j1",
    category: "Packaging",
    product: "Aluminium Beverage Cans",
    quantity: "10,000 units",
    budget: "GH₵ 52,000",
    location: "Spintex Road, Accra",
    description:
      "We need a reliable manufacturer to produce 10,000 aluminium beverage cans with custom printed branding. Cans must meet food-grade standards and be ready for filling at our Spintex facility.",
    deadline: "2025-05-15",
    postedAt: "2025-04-28",
    status: "active",
    bidsCount: 8,
    image:
      "https://5.imimg.com/data5/SELLER/Default/2025/10/549803421/JE/WZ/UK/136717440/500ml-aluminium-beverage-can-1000x1000.png",
  },
];

interface BidCardProps {
  bid: any;
  theme: any;
  delay: number;
  onAccept: (bidId: string) => void;
  onViewProfile: (manufacturerId: string) => void;
}

const BidCard = ({
  bid,
  theme,
  delay,
  onAccept,
  onViewProfile,
}: BidCardProps) => {
  return (
    <FadeIn delay={delay}>
      <View
        style={[
          styles.bidCard,
          { backgroundColor: theme.cardBackground, borderColor: theme.border },
        ]}
      >
        {/* Header */}
        <View style={styles.bidHeader}>
          <TouchableOpacity
            onPress={() => onViewProfile(bid.manufacturerId)}
            style={styles.manufacturerInfo}
          >
            <View
              style={[styles.avatar, { backgroundColor: theme.primary + "20" }]}
            >
              <Text style={[styles.avatarText, { color: theme.primary }]}>
                {bid.manufacturerName
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")}
              </Text>
            </View>
            <View style={styles.manufacturerDetails}>
              <Text style={[styles.manufacturerName, { color: theme.text }]}>
                {bid.manufacturerName}
              </Text>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={12} color="#FBBF24" />
                <Text
                  style={[styles.ratingText, { color: theme.textSecondary }]}
                >
                  {bid.rating} ({bid.completedJobs} jobs)
                </Text>
              </View>
            </View>
          </TouchableOpacity>
          <Text style={[styles.bidAmount, { color: theme.primary }]}>
            {bid.amount}
          </Text>
        </View>

        {/* Bid Details */}
        <View style={styles.bidDetails}>
          <View style={styles.detailRow}>
            <Ionicons
              name="time-outline"
              size={16}
              color={theme.textSecondary}
            />
            <Text style={[styles.detailText, { color: theme.textSecondary }]}>
              Delivery: {bid.deliveryTime}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons
              name="calendar-outline"
              size={16}
              color={theme.textSecondary}
            />
            <Text style={[styles.detailText, { color: theme.textSecondary }]}>
              Submitted: {new Date(bid.submittedAt).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Notes */}
        <Text style={[styles.bidNotes, { color: theme.text }]}>
          {bid.notes}
        </Text>

        {/* Actions */}
        <View style={styles.bidActions}>
          <TouchableOpacity
            onPress={() => onViewProfile(bid.manufacturerId)}
            style={[styles.secondaryBtn, { borderColor: theme.border }]}
          >
            <Text style={[styles.secondaryBtnText, { color: theme.text }]}>
              View Profile
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onAccept(bid.id)}
            style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
          >
            <Text style={[styles.primaryBtnText, { color: theme.onPrimary }]}>
              Accept Bid
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </FadeIn>
  );
};

const JobDetails = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"] ?? Colors.light;

  // Mock job data - in real app, fetch by ID
  const job = SME_JOBS.find((j) => j.id === id) || SME_JOBS[0];
  const bids = MOCK_BIDS.filter((b) => b.jobId === id);

  const handleAcceptBid = (bidId: string) => {
    Alert.alert(
      "Accept Bid",
      "Are you sure you want to accept this bid? This will create a binding contract with the manufacturer.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Accept",
          style: "destructive",
          onPress: () => {
            // TODO: Accept bid API call
            Alert.alert(
              "Success",
              "Bid accepted! The manufacturer will be notified.",
            );
          },
        },
      ],
    );
  };

  const handleViewProfile = (manufacturerId: string) => {
    // TODO: Navigate to manufacturer profile
    console.log("Navigate to manufacturer profile:", manufacturerId);
  };

  const daysLeft = Math.ceil(
    (new Date(job.deadline).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24),
  );

  return (
    <MainContainer safe>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Header */}
        <FadeIn delay={0}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backBtn}
            >
              <Ionicons name="chevron-back" size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.text }]}>
              Job Details
            </Text>
            <View style={{ width: 32 }} />
          </View>
        </FadeIn>

        {/* Job Overview */}
        <FadeIn delay={50}>
          <View
            style={[
              styles.jobOverview,
              {
                backgroundColor: theme.cardBackground,
                borderColor: theme.border,
              },
            ]}
          >
            <View style={styles.jobHeader}>
              <Text style={[styles.jobTitle, { color: theme.text }]}>
                {job.product}
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: "#10B981" + "20" },
                ]}
              >
                <Text style={[styles.statusText, { color: "#10B981" }]}>
                  Active
                </Text>
              </View>
            </View>

            <Text style={[styles.jobCategory, { color: theme.textSecondary }]}>
              {job.category} • {job.quantity}
            </Text>

            <View style={styles.jobStats}>
              <View style={styles.stat}>
                <Ionicons name="cash-outline" size={20} color={theme.primary} />
                <Text style={[styles.statValue, { color: theme.primary }]}>
                  {job.budget}
                </Text>
                <Text
                  style={[styles.statLabel, { color: theme.textSecondary }]}
                >
                  Budget
                </Text>
              </View>
              <View style={styles.stat}>
                <Ionicons
                  name="location-outline"
                  size={20}
                  color={theme.textSecondary}
                />
                <Text style={[styles.statValue, { color: theme.text }]}>
                  {job.location}
                </Text>
                <Text
                  style={[styles.statLabel, { color: theme.textSecondary }]}
                >
                  Location
                </Text>
              </View>
              <View style={styles.stat}>
                <Ionicons
                  name="time-outline"
                  size={20}
                  color={daysLeft <= 7 ? "#EF4444" : theme.textSecondary}
                />
                <Text style={[styles.statValue, { color: theme.text }]}>
                  {daysLeft > 0 ? `${daysLeft} days` : "Overdue"}
                </Text>
                <Text
                  style={[styles.statLabel, { color: theme.textSecondary }]}
                >
                  Deadline
                </Text>
              </View>
            </View>

            <Text style={[styles.jobDescription, { color: theme.text }]}>
              {job.description}
            </Text>
          </View>
        </FadeIn>

        {/* Bids Section */}
        <FadeIn delay={100}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Bids Received ({bids.length})
            </Text>
            <TouchableOpacity>
              <Text style={{ color: theme.primary, fontWeight: "600" }}>
                Sort by Price
              </Text>
            </TouchableOpacity>
          </View>
        </FadeIn>

        {bids.length > 0 ? (
          <View style={styles.bidsContainer}>
            {bids.map((bid, index) => (
              <BidCard
                key={bid.id}
                bid={bid}
                theme={theme}
                delay={150 + index * 50}
                onAccept={handleAcceptBid}
                onViewProfile={handleViewProfile}
              />
            ))}
          </View>
        ) : (
          <FadeIn delay={150}>
            <View style={styles.emptyBids}>
              <Ionicons
                name="people-outline"
                size={48}
                color={theme.textSecondary}
                style={{ marginBottom: 16 }}
              />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                No Bids Yet
              </Text>
              <Text
                style={[styles.emptySubtitle, { color: theme.textSecondary }]}
              >
                Manufacturers are reviewing your job. Bids will appear here
                soon.
              </Text>
            </View>
          </FadeIn>
        )}
      </ScrollView>
    </MainContainer>
  );
};

export default JobDetails;

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 8,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },

  // Job Overview
  jobOverview: {
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  jobHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  jobTitle: {
    fontSize: 20,
    fontWeight: "700",
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  jobCategory: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 16,
  },
  jobStats: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 20,
  },
  stat: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4,
    textAlign: "center",
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "400",
    marginTop: 2,
    textAlign: "center",
  },
  jobDescription: {
    fontSize: 15,
    lineHeight: 22,
  },

  // Bids Section
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  bidsContainer: {
    paddingHorizontal: 16,
    gap: 16,
  },

  // Bid Cards
  bidCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  bidHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  manufacturerInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "700",
  },
  manufacturerDetails: {
    flex: 1,
  },
  manufacturerName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "500",
  },
  bidAmount: {
    fontSize: 18,
    fontWeight: "700",
  },
  bidDetails: {
    marginBottom: 12,
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    fontWeight: "500",
  },
  bidNotes: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  bidActions: {
    flexDirection: "row",
    gap: 12,
  },
  secondaryBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
  primaryBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },

  // Empty State
  emptyBids: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontWeight: "400",
    textAlign: "center",
    lineHeight: 20,
  },
});
