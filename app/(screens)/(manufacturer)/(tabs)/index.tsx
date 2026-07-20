import Colors from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  ImageBackground,
  LayoutChangeEvent,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

import { FadeIn } from "@/components/FadeIn";
import JobPeekCard from "@/components/JobPeekCard";
import MainContainer from "@/components/MainContainer";
import OrderCard from "@/components/OrderCard";
import Spacer from "@/components/Spacer";
import { api } from "@/services/api";
import { useAuthStore } from "@/store/auth";
import { mmkvStorage } from "@/store/mmkv";
import { router } from "expo-router";

const CardImg = require("../../../../assets/images/Production.jpeg");

// Same cache the profile screens read/write — see the long comment in
// ManufacturerProfile.tsx for why this exists: there's still no
// GET /users/factory-profile, only POST/PUT, so companyName, address,
// and the uploaded logo can't be fetched from the backend directly.
// This is NOT authoritative — it's whatever was last saved *from this
// device* via EditManufacturerProfile. `user` fields remain the
// fallback for anything not yet present in the draft.
const DRAFT_KEY = "factoryProfileDraft";

interface CachedFactoryDraft {
  companyName?: string;
  address?: string;
  logoUrl?: string;
}

interface JobInfo {
  title: string;
  deadline?: string;
}

interface ApiJob {
  id: string;
  title: string;
  productType: string;
  sectorTag: string;
  quantity: number;
  specifications?: string;
  budgetMinGhs: number;
  budgetMaxGhs: number;
  deadline: string;
  deliveryAddress?: string;
  attachmentUrls?: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
  smeName: string;
  smeId: string;
}

interface ApiOrder {
  id: string;
  jobId: string;
  bidId: string;
  smeId: string;
  factoryId: string;
  factoryName: string;
  smeName: string;
  agreedAmountGhs: number;
  platformFeeGhs: number;
  factoryPayoutGhs: number;
  status:
    | "PAYMENT_PENDING"
    | "IN_ESCROW"
    | "IN_PRODUCTION"
    | "QUALITY_CHECK"
    | "DELIVERED"
    | "COMPLETED"
    | "DISPUTED"
    | "REFUNDED"
    | "CANCELLED";
  qualityCheckDeadline?: string;
  deliveredAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface HeroStats {
  escrowHeld: number;
  released: number;
  rating: number;
}

interface OrderCardData {
  id: string;
  job: string;
  sme: string;
  amount: string;
  milestone: number;
  milestoneLabel: string;
  dueIn: string;
  progress: number; // 0..1
  urgent: boolean;
}

// --- Helper functions ---
const getTimeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
};

const formatBudget = (min: number, max: number) => {
  if (!min && !max) return "GHS 0";
  const minStr = min ? `GHS ${min.toLocaleString()}` : "";
  const maxStr = max ? `GHS ${max.toLocaleString()}` : "";
  if (minStr && maxStr) return `${minStr} - ${maxStr}`;
  return minStr || maxStr;
};

const mapStatusToMilestone = (status: ApiOrder["status"]) => {
  const map: Record<ApiOrder["status"], { milestone: number; label: string }> =
    {
      PAYMENT_PENDING: { milestone: 0, label: "Awaiting Payment" },
      IN_ESCROW: { milestone: 0, label: "Payment Secured" },
      IN_PRODUCTION: { milestone: 1, label: "In Production" },
      QUALITY_CHECK: { milestone: 2, label: "Quality Check" },
      DELIVERED: { milestone: 3, label: "Delivered" },
      COMPLETED: { milestone: 4, label: "Completed" },
      DISPUTED: { milestone: 0, label: "Disputed" },
      REFUNDED: { milestone: 4, label: "Refunded" },
      CANCELLED: { milestone: 4, label: "Cancelled" },
    };
  return map[status] || { milestone: 0, label: "Unknown" };
};

const getProgress = (status: ApiOrder["status"]) => {
  const progressMap: Record<ApiOrder["status"], number> = {
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
  return progressMap[status] || 0.0;
};

const computeDueInfo = (
  order: ApiOrder,
  jobInfo?: JobInfo,
): { dueIn: string; urgent: boolean } => {
  if (["COMPLETED", "REFUNDED", "CANCELLED"].includes(order.status)) {
    return { dueIn: "Completed", urgent: false };
  }
  if (order.status === "DELIVERED") {
    return { dueIn: "Awaiting confirmation", urgent: false };
  }

  const deadlineSource = order.qualityCheckDeadline || jobInfo?.deadline;
  if (deadlineSource) {
    const diff = new Date(deadlineSource).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) {
      return { dueIn: "Overdue", urgent: true };
    }
    if (days <= 3) {
      return { dueIn: `${days} day${days !== 1 ? "s" : ""}`, urgent: true };
    }
    return { dueIn: `${days} day${days !== 1 ? "s" : ""}`, urgent: false };
  }

  return { dueIn: "In progress", urgent: false };
};

// Transform a single API order to OrderCardData
const transformOrder = (
  order: ApiOrder,
  jobInfoMap: Map<string, JobInfo>,
): OrderCardData => {
  const { milestone, label } = mapStatusToMilestone(order.status);
  const progress = getProgress(order.status);
  const jobInfo = jobInfoMap.get(order.jobId);
  const { dueIn, urgent } = computeDueInfo(order, jobInfo);

  const amount = `GH₵ ${order.agreedAmountGhs?.toFixed(2) || "0.00"}`;

  const job = jobInfo?.title || `Job #${order.jobId?.slice(0, 8) || "Unknown"}`;

  return {
    id: order.id,
    job,
    sme: order.smeName || "Unknown SME",
    amount,
    milestone,
    milestoneLabel: label,
    dueIn,
    progress,
    urgent,
  };
};

// --- HeroCard Component ---
interface HeroCardProps {
  theme: any;
  isDark: boolean;
  scrollY: Animated.Value;
  onCompanyLayout: (event: LayoutChangeEvent) => void;
  user: {
    fullName?: string;
    town?: string;
    region?: string;
    isVerified?: boolean;
    profileImageUrl?: string;
  } | null;
  factoryDraft: CachedFactoryDraft | null;
  stats: HeroStats;
}

const HeroCard = ({
  theme,
  isDark,
  scrollY,
  onCompanyLayout,
  user,
  factoryDraft,
  stats,
}: HeroCardProps) => {
  const heroTranslateY = scrollY.interpolate({
    inputRange: [-200, 0, 200],
    outputRange: [-100, 0, 100],
    extrapolate: "clamp",
  });

  const slash1TranslateY = scrollY.interpolate({
    inputRange: [-200, 200],
    outputRange: [-60, 60],
    extrapolate: "clamp",
  });
  const slash2TranslateY = scrollY.interpolate({
    inputRange: [-200, 200],
    outputRange: [40, -40],
    extrapolate: "clamp",
  });

  const companyName = factoryDraft?.companyName || user?.fullName || "-";

  const initials =
    companyName !== "-"
      ? companyName
          .split(" ")
          .map((n) => n[0])
          .filter(Boolean)
          .join("")
          .toUpperCase()
          .slice(0, 2)
      : "??";

  const logoUri = factoryDraft?.logoUrl || user?.profileImageUrl || null;

  const location = factoryDraft?.address
    ? factoryDraft.address
    : user?.town
      ? `${user.town}, ${user.region || ""}`
      : user?.region || "Unknown location";

  const isVerified = false;

  return (
    <FadeIn delay={0}>
      <View style={styles.heroWrapper}>
        <ImageBackground
          source={CardImg}
          style={styles.heroBgImage}
          imageStyle={styles.heroBgImageStyle}
        >
          <View style={styles.heroOverlay} />
          <Animated.View
            style={[
              styles.heroSlash1,
              {
                transform: [
                  { translateY: slash1TranslateY },
                  { rotate: "25deg" },
                ],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.heroSlash2,
              {
                transform: [
                  { translateY: slash2TranslateY },
                  { rotate: "15deg" },
                ],
              },
            ]}
          />

          <View style={styles.heroTopBar}>
            <TouchableOpacity
              onPress={() =>
                router.push("/(screens)/(manufacturer)/(screens)/notification")
              }
              style={styles.notifHero}
            >
              <Ionicons
                name="notifications-outline"
                size={20}
                color={theme.onPrimary + "CC"}
              />
              <View
                style={[
                  styles.notifHeroDot,
                  {
                    backgroundColor: theme.warning,
                    borderColor: theme.onPrimary,
                  },
                ]}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.heroCompanyRow} onLayout={onCompanyLayout}>
            <Pressable
              style={styles.heroLogoBox}
              onPress={() =>
                router.push("/(screens)/(manufacturer)/(screens)/profile")
              }
            >
              {logoUri ? (
                <Image source={{ uri: logoUri }} style={styles.heroLogoImage} />
              ) : (
                <Text style={[styles.heroLogoText, { color: theme.onPrimary }]}>
                  {initials}
                </Text>
              )}
            </Pressable>

            <View style={{ flex: 1 }}>
              <View style={styles.heroNameRow}>
                <Text
                  style={[styles.heroCompany, { color: theme.onPrimary }]}
                  numberOfLines={1}
                >
                  {companyName}
                </Text>
                {isVerified && (
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={theme.primary}
                    style={{ marginLeft: 6 }}
                  />
                )}
              </View>

              <View style={styles.heroLocRow}>
                <Ionicons
                  name="location-outline"
                  size={12}
                  color={theme.onPrimary + "CC"}
                />
                <Text
                  style={[
                    styles.heroLocation,
                    { color: theme.onPrimary + "CC" },
                  ]}
                  numberOfLines={1}
                >
                  {location}
                </Text>
              </View>
            </View>
          </View>

          <Spacer style={{ height: 20 }} />
        </ImageBackground>

        <View
          style={[
            styles.escrowFloat,
            {
              backgroundColor: theme.cardBackground,
              borderColor: theme.border,
            },
          ]}
        >
          <View style={styles.escrowItem}>
            <Text style={[styles.escrowLabel, { color: theme.textSecondary }]}>
              Escrow Held
            </Text>
            <Text style={[styles.escrowValue, { color: theme.text }]}>
              GH₵ {stats.escrowHeld.toLocaleString()}
            </Text>
          </View>

          <View
            style={[styles.escrowDivider, { backgroundColor: theme.border }]}
          />

          <View style={styles.escrowItem}>
            <Text style={[styles.escrowLabel, { color: theme.textSecondary }]}>
              Released
            </Text>
            <Text style={[styles.escrowValue, { color: theme.text }]}>
              GH₵ {stats.released.toLocaleString()}
            </Text>
          </View>

          <View
            style={[styles.escrowDivider, { backgroundColor: theme.border }]}
          />

          <View style={styles.escrowItem}>
            <Text style={[styles.escrowLabel, { color: theme.textSecondary }]}>
              Rating
            </Text>

            <View style={styles.ratingRow}>
              <Ionicons name="star" size={12} color="#F59E0B" />

              <Text style={[styles.escrowValue, { color: theme.text }]}>
                {stats.rating.toFixed(1)}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </FadeIn>
  );
};

// --- Main Component ---
export default function ManufacturerHome() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"] || Colors.light;
  const isDark = colorScheme === "dark";

  const { user, token, hasHydrated, getMe } = useAuthStore();

  const scrollY = useRef(new Animated.Value(0)).current;
  const blurOpacity = useRef(new Animated.Value(0)).current;
  const [companyNameTop, setCompanyNameTop] = useState<number | null>(null);

  const [activeOrders, setActiveOrders] = useState<any[]>([]);

  const [newJobs, setNewJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [factoryDraft, setFactoryDraft] = useState<CachedFactoryDraft | null>(
    null,
  );

  const fetchJobDetails = async (
    jobIds: string[],
  ): Promise<Map<string, JobInfo>> => {
    const uniqueIds = [...new Set(jobIds.filter(Boolean))];
    const map = new Map<string, JobInfo>();

    if (uniqueIds.length === 0) return map;

    const results = await Promise.allSettled(
      uniqueIds.map((id) => api.get(`jobs/${id}`)),
    );

    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        const job = result.value.data;
        map.set(uniqueIds[index], {
          title: job?.title,
          deadline: job?.deadline,
        });
      }
    });

    return map;
  };

  const [stats, setStats] = useState<HeroStats>({
    escrowHeld: 0,
    released: 0,
    rating: 0,
  });

  useEffect(() => {
    if (!hasHydrated) return;

    if (!token) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);

        // Refresh user info (keeps store + this screen consistent)
        await getMe();

        const ordersRes = await api.get("orders", {
          params: { page: 0, size: 100 },
        });

        const orders: ApiOrder[] = ordersRes.data.content || [];

        const active = orders.filter(
          (o) => !["COMPLETED", "REFUNDED", "CANCELLED"].includes(o.status),
        );

        const jobInfoMap = await fetchJobDetails(active.map((o) => o.jobId));

        const transformed = active.map((order) =>
          transformOrder(order, jobInfoMap),
        );

        setActiveOrders(transformed);

        let held = 0,
          released = 0;
        orders.forEach((o) => {
          if (
            o.status === "IN_ESCROW" ||
            o.status === "IN_PRODUCTION" ||
            o.status === "QUALITY_CHECK"
          ) {
            held += o.agreedAmountGhs || 0;
          } else if (o.status === "DELIVERED" || o.status === "COMPLETED") {
            released += o.agreedAmountGhs || 0;
          }
        });

        setStats({
          escrowHeld: held,
          released,
          rating: 0, // placeholder until ratings are wired in
        });

        const jobsRes = await api.get("jobs", {
          params: { page: 0, size: 10 },
        });
        const jobs: ApiJob[] = jobsRes.data.content || [];
        const sorted = jobs.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );

        const transformedJobs = sorted.slice(0, 10).map((job) => ({
          id: job.id,
          product: job.productType || "Unnamed",
          quantity: job.quantity || 0,
          budget: formatBudget(job.budgetMinGhs, job.budgetMaxGhs),
          location: job.deliveryAddress || "N/A",
          category: job.sectorTag || "Uncategorized",
          timeAgo: getTimeAgo(job.createdAt),
          rating: 0,
          bids: 0,
        }));
        setNewJobs(transformedJobs);
      } catch (error) {
        console.error("Error fetching home data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    const loadCachedFactoryDraft = async () => {
      try {
        const raw = await mmkvStorage.getItem(DRAFT_KEY);
        if (raw) setFactoryDraft(JSON.parse(raw));
      } catch (e) {
        console.warn("Failed to load cached factory draft:", e);
      }
    };
    loadCachedFactoryDraft();
  }, [hasHydrated, token]);

  useEffect(() => {
    if (companyNameTop === null) return;
    const statusBarHeight = StatusBar.currentHeight || 0;
    const threshold = companyNameTop - statusBarHeight;
    const listener = scrollY.addListener(({ value }) => {
      const shouldShow = value > threshold;
      Animated.timing(blurOpacity, {
        toValue: shouldShow ? 1 : 0,
        duration: 180,
        useNativeDriver: true,
      }).start();
    });
    return () => scrollY.removeListener(listener);
  }, [companyNameTop, scrollY, blurOpacity]);

  const handleCompanyLayout = (event: LayoutChangeEvent) => {
    if (companyNameTop === null) {
      setCompanyNameTop(event.nativeEvent.layout.y);
    }
  };

  return (
    <MainContainer>
      <View style={[styles.screen]}>
        <Animated.View
          style={[styles.statusBarBlurWrapper, { opacity: blurOpacity }]}
          pointerEvents="none"
        />

        <HeroCard
          theme={theme}
          isDark={isDark}
          scrollY={scrollY}
          onCompanyLayout={handleCompanyLayout}
          user={user}
          factoryDraft={factoryDraft}
          stats={stats}
        />

        <Animated.ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true },
          )}
        >
          {!hasHydrated || loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.primary} />
            </View>
          ) : (
            <>
              {newJobs.length > 0 && (
                <FadeIn delay={320}>
                  <View style={[styles.section, { paddingHorizontal: 0 }]}>
                    <View
                      style={[styles.sectionHeader, { paddingHorizontal: 15 }]}
                    >
                      <Text
                        style={[styles.sectionTitle, { color: theme.text }]}
                      >
                        New Job Posts
                      </Text>

                      <TouchableOpacity
                        onPress={() =>
                          router.push(
                            "/(screens)/(manufacturer)/(tabs)/jobs" as any,
                          )
                        }
                      >
                        <Text style={[styles.seeAll, { color: theme.primary }]}>
                          See all
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <Animated.ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={[
                        styles.jobsHScroll,
                        { marginLeft: 15 },
                      ]}
                    >
                      {newJobs.map((j) => (
                        <JobPeekCard key={j.id} job={j} theme={theme} />
                      ))}

                      {/* view all card shows if the jobs are more than 2 */}
                      {newJobs.length > 2 && (
                        <TouchableOpacity
                          onPress={() =>
                            router.push(
                              "/(screens)/(manufacturer)/(tabs)/jobs" as any,
                            )
                          }
                          style={[
                            styles.jobPeekCard,
                            styles.moreCard,
                            {
                              backgroundColor: theme.primary + "12",
                              borderColor: theme.primary + "30",
                            },
                          ]}
                        >
                          <Ionicons
                            name="grid-outline"
                            size={28}
                            color={theme.primary}
                          />
                          <Text
                            style={[
                              styles.moreCardText,
                              { color: theme.primary },
                            ]}
                          >
                            View all posts
                          </Text>
                        </TouchableOpacity>
                      )}
                    </Animated.ScrollView>
                  </View>
                </FadeIn>
              )}

              {activeOrders.length > 0 && (
                <FadeIn delay={240}>
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Text
                        style={[styles.sectionTitle, { color: theme.text }]}
                      >
                        Active Orders
                      </Text>
                      <TouchableOpacity
                        onPress={() =>
                          router.push("/(screens)/(manufacturer)/(tabs)/orders")
                        }
                      >
                        <Text style={[styles.seeAll, { color: theme.primary }]}>
                          See all
                        </Text>
                      </TouchableOpacity>
                    </View>
                    {activeOrders.map((o, i) => (
                      <OrderCard
                        key={o.id}
                        order={o}
                        theme={theme}
                        delay={i * 60}
                      />
                    ))}
                  </View>
                </FadeIn>
              )}

              {newJobs.length === 0 && activeOrders.length === 0 && (
                <View style={styles.emptyState}>
                  <Ionicons
                    name="cube-outline"
                    size={64}
                    color={theme.textSecondary + "50"}
                  />
                  <Text
                    style={[styles.emptyText, { color: theme.textSecondary }]}
                  >
                    No jobs or orders yet
                  </Text>
                </View>
              )}
            </>
          )}

          <Spacer style={{ height: 70 }} />
        </Animated.ScrollView>
      </View>
    </MainContainer>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { paddingBottom: 20 },
  statusBarBlurWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    top: StatusBar.currentHeight || 0,
    height: 44,
    zIndex: 10,
    backgroundColor: "transparent",
    overflow: "hidden",
  },
  section: { marginTop: 24, paddingHorizontal: 15 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 17, fontWeight: "800", letterSpacing: -0.3 },
  seeAll: { fontSize: 13, fontWeight: "600" },
  jobsHScroll: { paddingRight: 16, gap: 10 },
  jobPeekCard: {
    width: 160,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  moreCard: {
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 230,
  },
  moreCardText: {
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  heroWrapper: { marginBottom: 24 },
  heroBgImage: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 52,
  },
  heroBgImageStyle: {
    resizeMode: "cover",
  },
  heroOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  heroSlash1: {
    position: "absolute",
    width: 260,
    height: 260,
    backgroundColor: "rgba(255,255,255,0.06)",
    top: -80,
    right: -80,
    borderRadius: 40,
  },
  heroSlash2: {
    position: "absolute",
    width: 180,
    height: 180,
    backgroundColor: "rgba(255,255,255,0.04)",
    bottom: 20,
    left: -60,
    borderRadius: 30,
  },
  heroTopBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginBottom: 22,
  },
  heroDate: {
    fontSize: 12.5,
    fontWeight: "500",
  },
  notifHero: {
    position: "relative",
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  notifHeroDot: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
  },
  heroCompanyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 14,
  },
  heroLogoBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    overflow: "hidden",
  },
  heroLogoImage: {
    width: "100%",
    height: "100%",
  },
  heroLogoText: {
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  heroNameRow: { flexDirection: "row", alignItems: "center" },
  heroCompany: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.4,
    flexShrink: 1,
  },
  heroLocRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  heroLocation: {
    fontSize: 12,
    fontWeight: "500",
    flexShrink: 1,
  },
  escrowFloat: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginTop: -28,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    height: 90,
  },
  escrowItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  escrowLabel: { fontSize: 10.5, fontWeight: "500" },
  escrowValue: { fontSize: 14, fontWeight: "800" },
  escrowDivider: { width: 1 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: "center",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "500",
  },
});
