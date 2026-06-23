import MainContainer from "@/components/MainContainer";
import Spacer from "@/components/Spacer";
import Colors from "@/constants/colors";
import {
  getBidsForJob,
  JobStatus,
  SME_JOBS,
  SMEJob,
} from "@/constants/Jobstore";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
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

//  FadeIn
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

//  Stat pill
const StatPill = ({
  icon,
  label,
  color,
  theme,
}: {
  icon: string;
  label: string;
  color?: string;
  theme: any;
}) => (
  <View
    style={[
      styles.statPill,
      { backgroundColor: theme.cardBackground, borderColor: theme.border },
    ]}
  >
    <Ionicons
      name={icon as any}
      size={13}
      color={color ?? theme.textSecondary}
    />
    <Text
      style={[styles.statPillText, { color: color ?? theme.textSecondary }]}
      numberOfLines={1}
    >
      {label}
    </Text>
  </View>
);

//  Job card
const JobCard = ({
  job,
  theme,
  delay,
  isDark,
}: {
  job: SMEJob;
  theme: any;
  delay: number;
  isDark: boolean;
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const bids = getBidsForJob(job.id);

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
              {/* Top row */}
              <View style={styles.cardTopRow}>
                <View style={styles.cardLeft}>
                  <View style={[styles.statusBadge]}></View>
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
                </View>

                {job.image ? (
                  <Image
                    source={{ uri: job.image }}
                    style={[
                      styles.cardImage,
                      {
                        backgroundColor: theme.background,
                      },
                    ]}
                    resizeMode="contain"
                  />
                ) : (
                  <View
                    style={[
                      styles.cardImagePlaceholder,
                      {
                        backgroundColor: theme.background,
                      },
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

              {/* Stats */}
              {/* <View style={styles.statsRow}>
                <StatPill
                  icon="cash-outline"
                  label={job.budget}
                  color={theme.primary}
                  theme={theme}
                />
                <StatPill
                  icon="location-outline"
                  label={job.location}
                  theme={theme}
                />
              </View> */}

              {/* Footer */}
              <View style={styles.cardFooter}>
                {/* Bids count — show manufacturer avatars if any */}
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

                  {/* Manufacturer name previews (up to 2) */}
                  {bids.length > 0 && (
                    <Text
                      style={[
                        styles.bidPreview,
                        { color: theme.textSecondary },
                      ]}
                      numberOfLines={1}
                    >
                      ·{" "}
                      {bids
                        .slice(0, 2)
                        .map((b) => b.manufacturer.name)
                        .join(", ")}
                      {bids.length > 2 ? ` +${bids.length - 2}` : ""}
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
        <View
          style={[
            styles.emptyIconWrap,
            { backgroundColor: theme.primary + "12" },
          ]}
        >
          <Ionicons name={cfg.icon as any} size={40} color={theme.primary} />
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
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.emptyBtnText}>{cfg.cta}</Text>
          </TouchableOpacity>
        )}
      </View>
    </FadeIn>
  );
};

const MyJobs = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = Colors[colorScheme ?? "light"] ?? Colors.light;
  const [activeTab, setActiveTab] = useState<JobStatus>("active");

  const filteredJobs = SME_JOBS.filter((j) => j.status === activeTab);
  const tabCount = (key: JobStatus) =>
    SME_JOBS.filter((j) => j.status === key).length;

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
                <Ionicons name="add" size={18} color="#fff" />

                <Text style={styles.postBtnText}>Post Job</Text>
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
                            { color: isActive ? "#fff" : theme.textSecondary },
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

        {/* List */}
        <View style={styles.listContainer}>
          {filteredJobs.length > 0 ? (
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

//  Styles
const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerEyebrow: {
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  headerTitle: { fontSize: 28, fontWeight: "800", letterSpacing: -0.8 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  postBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 12,
  },
  postBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },

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

  card: {
    borderRadius: 18,
    borderWidth: 0,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 14,
  },
  categoryAccent: { height: 3 },
  cardInner: { padding: 16 },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  cardLeft: { flex: 1, marginRight: 12 },
  categoryChip: {
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
  categoryDot: { width: 6, height: 6, borderRadius: 3 },
  categoryChipText: { fontSize: 11, fontWeight: "700", letterSpacing: 0.2 },
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
  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
    flexWrap: "wrap",
  },
  statPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
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
  footerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusText: { fontSize: 12, fontWeight: "700" },
  deadlinePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  deadlineText: { fontSize: 12 },

  emptyState: {
    alignItems: "center",
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyIconWrap: {
    width: 88,
    height: 88,
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
    marginBottom: 10,
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
  emptyBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
