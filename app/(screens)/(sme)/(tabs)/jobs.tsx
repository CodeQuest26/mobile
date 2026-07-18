import MainContainer from "@/components/MainContainer";
import Spacer from "@/components/Spacer";
import Colors from "@/constants/colors";
import { api } from "@/services/api";
import { useAuthStore } from "@/store/auth";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

// ---------- Types ----------
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
  status: string; // OPEN, DRAFT, etc.
  createdAt: string;
  updatedAt: string;
}

interface PagedJobs {
  content: JobApiResponse[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

interface BidApiResponse {
  id: string;
  jobId: string;
  factoryId: string;
  factoryName: string;
  factorySectorTags: string[];
  pricePerUnitGhs: number;
  totalPriceGhs: number;
  productionDays: number;
  deliveryDateEstimate: string;
  message?: string;
  status: string;
  createdAt: string;
}

type JobStatus = "active" | "completed" | "draft";

// ---------- Helpers ----------
function mapApiStatusToTab(status: string): JobStatus {
  if (status === "DRAFT") return "draft";
  if (status === "COMPLETED") return "completed";
  // OPEN, BIDDING, AWARDED, IN_PRODUCTION → "active"
  return "active";
}

function transformJob(job: JobApiResponse, bids: BidApiResponse[]) {
  const budget =
    job.budgetMinGhs && job.budgetMaxGhs
      ? `GHS ${job.budgetMinGhs} – ${job.budgetMaxGhs}`
      : "Budget not set";

  return {
    id: job.id,
    product: job.title,
    quantity: `${job.quantity} pcs`,
    budget,
    image: job.attachmentUrls?.[0] ?? null,
    bidsCount: bids.length,
    bids,
    status: mapApiStatusToTab(job.status),
    rawStatus: job.status,
  };
}

// ---------- FadeIn wrapper ----------
const FadeIn = ({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 480,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 440,
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

// ---------- StatPill ----------
const StatPill = ({
  icon,
  label,
  theme,
}: {
  icon: string;
  label: string;
  color?: string;
  theme: any;
}) => (
  <View style={[styles.statPill, { backgroundColor: theme.cardBackground }]}>
    <Ionicons name={icon as any} size={13} color={theme.textSecondary} />
    <Text
      style={[styles.statPillText, { color: theme.textSecondary }]}
      numberOfLines={1}
    >
      {label}
    </Text>
  </View>
);

// ---------- JobCard ----------
const JobCard = ({
  job,
  theme,
  delay,
}: {
  job: ReturnType<typeof transformJob>;
  theme: any;
  delay: number;
  isDark: boolean;
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    router.push({
      pathname: "/(screens)/(sme)/(screens)/jobDetails",
      params: { id: job.id },
    });
  };

  return (
    <FadeIn delay={delay}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          onPress={handlePress}
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
            style={[styles.card, { backgroundColor: theme.cardBackground }]}
          >
            <View style={styles.cardInner}>
              <View style={styles.cardTopRow}>
                <View style={styles.cardLeft}>
                  <View style={styles.statusBadge} />
                  <Text
                    style={[styles.cardTitle, { color: theme.text }]}
                    numberOfLines={2}
                  >
                    {job.product}
                  </Text>

                  <Text
                    style={[styles.cardQty, { color: theme.textSecondary }]}
                  >
                    {job.quantity}
                  </Text>

                  <StatPill
                    icon="cash-outline"
                    label={job.budget}
                    theme={theme}
                  />
                </View>

                {job.image ? (
                  <Image
                    source={{ uri: job.image }}
                    style={[
                      styles.cardImage,
                      {
                        backgroundColor: theme.background,
                        borderWidth: 1,
                        borderColor: theme.border,
                      },
                    ]}
                    resizeMode="contain"
                  />
                ) : (
                  <View
                    style={[
                      styles.cardImagePlaceholder,
                      { backgroundColor: theme.background },
                    ]}
                  >
                    <Ionicons
                      name="cube-outline"
                      size={28}
                      color={theme.textSecondary}
                    />
                  </View>
                )}
              </View>

              <View
                style={[styles.divider, { backgroundColor: theme.border }]}
              />

              <View style={styles.cardFooter}>
                <View style={styles.bidsRow}>
                  <View
                    style={[
                      styles.bidsIconWrap,
                      { backgroundColor: theme.primary + "18" },
                    ]}
                  >
                    <Ionicons name="people" size={13} color={theme.primary} />
                  </View>
                  <Text style={[styles.bidsCount, { color: theme.primary }]}>
                    {job.bidsCount}
                  </Text>
                  <Text
                    style={[styles.bidsLabel, { color: theme.textSecondary }]}
                  >
                    {job.bidsCount === 1 ? "bid" : "bids"}
                  </Text>
                  {job.bids.length > 0 && (
                    <Text
                      style={[
                        styles.bidPreview,
                        { color: theme.textSecondary },
                      ]}
                      numberOfLines={1}
                    >
                      ·{" "}
                      {job.bids
                        .slice(0, 2)
                        .map((b) => b.factoryName)
                        .join(", ")}
                      {job.bids.length > 2 ? ` +${job.bids.length - 2}` : ""}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </FadeIn>
  );
};

// ---------- EmptyState ----------
const EmptyState = ({
  activeTab,
  theme,
}: {
  activeTab: JobStatus;
  theme: any;
}) => {
  const cfg = {
    active: {
      icon: "briefcase-outline",
      title: "No active jobs yet",
      subtitle:
        "Post your first job and start receiving bids from manufacturers across Ghana.",
      cta: "Post a Job",
    },
    completed: {
      icon: "checkmark-done-circle-outline",
      title: "No completed jobs",
      subtitle: "Your completed jobs will appear here once they're wrapped up.",
      cta: null,
    },
    draft: {
      icon: "document-text-outline",
      title: "No drafts saved",
      subtitle:
        "Jobs you save as drafts will appear here, ready to post later.",
      cta: null,
    },
  }[activeTab];

  return (
    <FadeIn delay={100}>
      <View style={styles.emptyState}>
        <View style={[styles.emptyIconWrap]}>
          <Ionicons name={cfg.icon as any} size={30} color={theme.icon} />
        </View>
        <Text style={[styles.emptyTitle, { color: theme.text }]}>
          {cfg.title}
        </Text>
        <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
          {cfg.subtitle}
        </Text>
        {cfg.cta && (
          <TouchableOpacity
            onPress={() => router.push("/(screens)/(sme)/(screens)/postJob")}
            style={[styles.emptyBtn, { backgroundColor: theme.primary }]}
          >
            <Ionicons name="add" size={18} color={theme.onPrimary} />
            <Text style={[styles.emptyBtnText, { color: theme.onPrimary }]}>
              {cfg.cta}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </FadeIn>
  );
};

// ---------- Main Screen ----------
const MyJobs = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = Colors[colorScheme ?? "light"] ?? Colors.light;
  const [activeTab, setActiveTab] = useState<JobStatus>("active");
  const [jobs, setJobs] = useState<ReturnType<typeof transformJob>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);

  const user = useAuthStore((s) => s.user);
  console.log("Current role:", user?.role);

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get<PagedJobs>(
        "jobs/my-jobs?page=0&size=1000",
      );

      console.log("Jobs response:", response.data);

      const jobsArray = response.data.content ?? [];

      const jobsWithBids = await Promise.all(
        jobsArray.map(async (jobApi) => {
          try {
            const bidsResponse = await api.get<BidApiResponse[]>(
              `jobs/${jobApi.id}/bids`,
            );

            return transformJob(jobApi, bidsResponse.data);
          } catch (error) {
            // still show job if bids fail
            return transformJob(jobApi, []);
          }
        }),
      );

      setJobs(jobsWithBids);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.log("STATUS:", error.response?.status);
        console.log("DATA:", error.response?.data);
        console.log("HEADERS:", error.response?.headers);
      } else {
        console.log(error);
      }

      setError("Failed to load jobs.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Refetch every time this screen regains focus (e.g. returning from
  // postJob or jobDetails), not just on first mount — useEffect only
  // fired once, so newly posted jobs or accepted bids wouldn't show up
  // without a full remount.
  useFocusEffect(
    useCallback(() => {
      if (!hasHydrated || !isAuthenticated) return;

      fetchJobs();
    }, [fetchJobs, hasHydrated, isAuthenticated]),
  );

  const filteredJobs = jobs.filter((j) => j.status === activeTab);
  const tabCount = (key: JobStatus) =>
    jobs.filter((j) => j.status === key).length;

  const tabs: { key: JobStatus; label: string }[] = [
    { key: "active", label: "Active" },
    { key: "completed", label: "Completed" },
    { key: "draft", label: "Drafts" },
  ];

  return (
    <MainContainer safe>
      <ScrollView
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[1]}
      >
        {/* Header */}
        <FadeIn delay={0}>
          <View style={styles.header}>
            <View>
              <Text style={[styles.headerTitle, { color: theme.text }]}>
                My Jobs
              </Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={() =>
                  router.push("/(screens)/(sme)/(screens)/postJob")
                }
                style={[styles.postBtn, { backgroundColor: theme.primary }]}
              >
                <Ionicons name="add" size={18} color={theme.onPrimary} />
                <Text style={[styles.postBtnText, { color: theme.onPrimary }]}>
                  Post Job
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </FadeIn>

        {/* Sticky tabs */}
        <View
          style={[
            styles.tabsWrapper,
            {
              backgroundColor: isDark
                ? theme.background
                : "rgba(255,255,255,0.96)",
              borderBottomColor: theme.border,
              alignItems: "center",
            },
          ]}
        >
          <FadeIn delay={80}>
            <View style={styles.tabsRow}>
              {tabs.map((tab) => {
                const isActive = activeTab === tab.key;
                const count = tabCount(tab.key);
                return (
                  <TouchableOpacity
                    key={tab.key}
                    onPress={() => setActiveTab(tab.key)}
                    style={[
                      styles.tab,
                      isActive && [
                        styles.tabActive,
                        { borderBottomColor: theme.primary },
                      ],
                    ]}
                  >
                    <Text
                      style={[
                        styles.tabLabel,
                        {
                          color: isActive ? theme.primary : theme.textSecondary,
                          fontWeight: isActive ? "700" : "500",
                        },
                      ]}
                    >
                      {tab.label}
                    </Text>
                    {count > 0 && (
                      <View
                        style={[
                          styles.tabCountBubble,
                          {
                            backgroundColor: isActive
                              ? theme.primary
                              : theme.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.tabCountText,
                            {
                              color: isActive
                                ? theme.onPrimary
                                : theme.textSecondary,
                            },
                          ]}
                        >
                          {count}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </FadeIn>
        </View>

        {/* Job list */}
        <View style={styles.listContainer}>
          {!hasHydrated ? (
            <View style={styles.centered}>
              <ActivityIndicator size="small" color={theme.icon} />
            </View>
          ) : loading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="small" color={theme.icon} />
              <Text
                style={[styles.loadingText, { color: theme.textSecondary }]}
              >
                Fetching your jobs...
              </Text>
            </View>
          ) : error ? (
            <View style={styles.centered}>
              <Ionicons
                name="alert-circle-outline"
                size={40}
                color={theme.error}
              />
              <Text style={[styles.errorText, { color: theme.error }]}>
                {error}
              </Text>
              <TouchableOpacity
                onPress={fetchJobs}
                style={[styles.emptyBtn, { backgroundColor: theme.primary }]}
              >
                <Text style={styles.emptyBtnText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : filteredJobs.length > 0 ? (
            filteredJobs.map((job, i) => (
              <JobCard
                key={job.id}
                job={job}
                theme={theme}
                delay={100 + i * 60}
                isDark={isDark}
              />
            ))
          ) : (
            <EmptyState activeTab={activeTab} theme={theme} />
          )}
        </View>

        <Spacer style={{ height: 40 }} />
      </ScrollView>
    </MainContainer>
  );
};

export default MyJobs;

// (styles remain the same as before – omitted here for brevity)
const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTitle: { fontSize: 28, fontWeight: "800", letterSpacing: -0.8 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  postBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 12,
  },
  postBtnText: { fontSize: 14, fontWeight: "700" },
  tabsWrapper: { borderBottomWidth: 1, paddingHorizontal: 20 },
  tabsRow: { flexDirection: "row" },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingVertical: 14,
    paddingHorizontal: 4,
    marginRight: 24,
    borderBottomWidth: 2.5,
    borderBottomColor: "transparent",
  },
  tabActive: {},
  tabLabel: { fontSize: 14 },
  tabCountBubble: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  tabCountText: { fontSize: 11, fontWeight: "700" },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 48,
    gap: 14,
  },
  centered: { alignItems: "center", paddingVertical: 48 },
  loadingText: { fontSize: 15, marginTop: 12 },
  errorText: { fontSize: 15, marginTop: 8, marginBottom: 20 },
  card: {
    borderRadius: 18,
    borderWidth: 0,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    marginBottom: 14,
  },
  cardInner: { padding: 16 },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  cardLeft: { flex: 1, marginRight: 12 },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    lineHeight: 22,
    letterSpacing: -0.3,
    marginBottom: 3,
  },
  cardQty: { fontSize: 13, fontWeight: "500" },
  cardImage: { width: 72, height: 72, borderRadius: 14 },
  cardImagePlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  divider: { height: 1, marginBottom: 12, opacity: 0.5 },
  statPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 5,
    borderRadius: 20,
    maxWidth: width * 0.45,
  },
  statPillText: { fontSize: 12, fontWeight: "600", flexShrink: 1 },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bidsRow: { flexDirection: "row", alignItems: "center", gap: 5, flex: 1 },
  bidsIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  bidsCount: { fontSize: 14, fontWeight: "800" },
  bidsLabel: { fontSize: 13 },
  bidPreview: { fontSize: 12, flex: 1 },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyIconWrap: {
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: -0.4,
    // marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 23,
    marginBottom: 28,
  },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
  },
  emptyBtnText: { fontSize: 16, fontWeight: "700" },
});
