import Colors from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  ImageBackground,
  LayoutChangeEvent,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

import { FadeIn } from "@/components/FadeIn";
import JobPeekCard from "@/components/JobPeekCard";
import OrderCard from "@/components/OrderCard";
import {
  ACTIVE_ORDERS,
  NEW_JOBS,
  QUICK_ACTIONS,
  USER,
} from "@/constants/manufacturerData";

import MainContainer from "@/components/MainContainer";
import { router } from "expo-router";
const CardImg = require("../../../../assets/images/Production.jpeg");

const time = new Date().getHours();
const greeting = `Good ${time < 12 ? "morning" : time < 18 ? "afternoon" : "evening"}`;

//  HeroCard
interface HeroCardProps {
  theme: any;
  isDark: boolean;
  scrollY: Animated.Value;
  onCompanyLayout: (event: LayoutChangeEvent) => void;
}

const HeroCard = ({
  theme,
  isDark,
  scrollY,
  onCompanyLayout,
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
            <Text style={styles.heroDate}>
              {new Date().toLocaleDateString("en-GB", {
                weekday: "short",
                day: "numeric",
                month: "short",
              })}
            </Text>
            <TouchableOpacity
              onPress={() =>
                router.push("/(screens)/(manufacturer)/(screens)/notification")
              }
              style={styles.notifHero}
            >
              <Ionicons
                name="notifications-outline"
                size={20}
                color="rgba(255,255,255,0.9)"
              />
              <View style={styles.notifHeroDot} />
            </TouchableOpacity>
          </View>

          <View style={styles.heroCompanyRow} onLayout={onCompanyLayout}>
            <View style={styles.heroLogoBox}>
              <Text style={styles.heroLogoText}>{USER.initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.heroNameRow}>
                <Text style={styles.heroCompany} numberOfLines={1}>
                  {USER.company}
                </Text>
                {USER.verified && (
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color="#93C5FD"
                    style={{ marginLeft: 6 }}
                  />
                )}
              </View>
              <View style={styles.heroLocRow}>
                <Ionicons
                  name="location-outline"
                  size={12}
                  color="rgba(255,255,255,0.65)"
                />
                <Text style={styles.heroLocation}>{USER.location}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.heroTagline}>
            {greeting} 👋 Here's your factory overview
          </Text>
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
              GH₵ 52,000
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
              GH₵ 32,200
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
                4.8
              </Text>
            </View>
          </View>
        </View>
      </View>
    </FadeIn>
  );
};

export default function ManufacturerHome() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"] || Colors.light;
  const isDark = colorScheme === "dark";

  const scrollY = useRef(new Animated.Value(0)).current;
  const blurOpacity = useRef(new Animated.Value(0)).current;
  const [companyNameTop, setCompanyNameTop] = useState<number | null>(null);

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
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

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
          {/* Quick Actions */}
          <FadeIn delay={160}>
            <View style={[styles.section, { marginTop: 0 }]}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Quick Actions
                </Text>
              </View>
              <View style={styles.quickActions}>
                {QUICK_ACTIONS.map((qa) => (
                  <TouchableOpacity
                    key={qa.label}
                    activeOpacity={0.8}
                    onPress={() => qa.route && router.push(qa.route as any)}
                    style={[
                      styles.qaBtn,
                      {
                        backgroundColor: theme.cardBackground,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.qaIcon,
                        { backgroundColor: qa.color + "18" },
                      ]}
                    >
                      <Ionicons
                        name={qa.icon as any}
                        size={20}
                        color={qa.color}
                      />
                    </View>
                    <Text style={[styles.qaLabel, { color: theme.text }]}>
                      {qa.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </FadeIn>

          {/* Active Orders */}
          <FadeIn delay={240}>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
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
              {ACTIVE_ORDERS.map((o, i) => (
                <OrderCard key={o.id} order={o} theme={theme} delay={i * 60} />
              ))}
            </View>
          </FadeIn>

          {/* New Job Posts */}
          <FadeIn delay={320}>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  New Job Posts
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    router.push("/(screens)/(manufacturer)/(tabs)/bids" as any)
                  }
                >
                  <Text style={[styles.seeAll, { color: theme.primary }]}>
                    Browse all
                  </Text>
                </TouchableOpacity>
              </View>
              <Animated.ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.jobsHScroll}
              >
                {NEW_JOBS.map((j) => (
                  <JobPeekCard key={j.id} job={j} theme={theme} />
                ))}
                <TouchableOpacity
                  onPress={() =>
                    router.push("/(screens)/(manufacturer)/(tabs)/bids" as any)
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
                  <Text style={[styles.moreCardText, { color: theme.primary }]}>
                    View all posts
                  </Text>
                </TouchableOpacity>
              </Animated.ScrollView>
            </View>
          </FadeIn>

          <View style={{ height: 70 }} />
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
  section: { marginTop: 24, paddingHorizontal: 16 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 17, fontWeight: "800", letterSpacing: -0.3 },
  seeAll: { fontSize: 13, fontWeight: "600" },
  quickActions: { flexDirection: "row", gap: 10 },
  qaBtn: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: "center",
    gap: 8,
  },
  qaIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  qaLabel: { fontSize: 11, fontWeight: "600", textAlign: "center" },
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
  },
  moreCardText: { fontSize: 13, fontWeight: "700", textAlign: "center" },
  heroWrapper: { marginBottom: 24 },
  heroBg: {
    overflow: "hidden",
  },
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
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 22,
  },
  heroDate: {
    fontSize: 12.5,
    color: "rgba(255,255,255,0.65)",
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
    backgroundColor: "#FCD34D",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.3)",
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
  },
  heroLogoText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.5,
  },
  heroNameRow: { flexDirection: "row", alignItems: "center" },
  heroCompany: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
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
    color: "rgba(255,255,255,0.65)",
    fontWeight: "500",
    flexShrink: 1,
  },
  heroTagline: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "500",
    lineHeight: 18,
    textAlign: "center",
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
});
