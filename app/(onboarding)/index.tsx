import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

import { storage } from "@/store/mmkv";
import MainContainer from "../../components/MainContainer";
import Colors from "../../constants/colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// --- Role-specific onboarding content ---
const ONBOARDING_CONTENT = {
  sme: [
    {
      icon: "storefront-outline",
      title: "Your business,\nall in one place.",
      body: "Manage orders, track deliveries, and oversee your operations from a single dashboard built for business owners like you.",
      highlight: "orders & deliveries",
    },
    {
      icon: "people-outline",
      title: "Connect with\ntop manufacturers.",
      body: "Browse verified manufacturers, send production requests, and collaborate in real-time. No middlemen, no delays.",
      highlight: "verified manufacturers",
    },
    {
      icon: "trending-up-outline",
      title: "Grow faster\nwith smart insights.",
      body: "Get sales analytics, stock alerts, and performance reports that help you make better business decisions every day.",
      highlight: "smart insights",
    },
  ],
  manufacturer: [
    {
      icon: "construct-outline",
      title: "Production\nunder control.",
      body: "Track every production run, manage your factory floor, and monitor output quality — all from your phone.",
      highlight: "production runs",
    },
    {
      icon: "cube-outline",
      title: "Inventory &\nsupply chain.",
      body: "Get real-time visibility into raw material levels, finished goods, and supplier deliveries. Never miss a restock.",
      highlight: "real-time visibility",
    },
    {
      icon: "flash-outline",
      title: "More orders,\nless friction.",
      body: "Receive production requests from SMEs instantly, confirm timelines, and manage fulfillment — streamlined end to end.",
      highlight: "instantly",
    },
  ],
};

// --- Dot Indicator ---
const DotIndicator = ({
  count,
  activeIndex,
  color,
}: {
  count: number;
  activeIndex: number;
  color: string;
}) => (
  <View style={styles.dotsRow}>
    {Array.from({ length: count }).map((_, i) => (
      <View
        key={i}
        style={[
          styles.dot,
          {
            backgroundColor: color,
            opacity: i === activeIndex ? 1 : 0.25,
            width: i === activeIndex ? 24 : 8,
          },
        ]}
      />
    ))}
  </View>
);

// --- Single Slide ---
const Slide = ({
  item,
  theme,
  index,
}: {
  item: (typeof ONBOARDING_CONTENT.sme)[0];
  theme: any;
  index: number;
}) => {
  const BG_COLORS = [
    theme.primary + "12",
    theme.primary + "0D",
    theme.primary + "10",
  ];

  return (
    <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
      {/* Illustration area */}
      <View
        style={[
          styles.illustrationBox,
          { backgroundColor: BG_COLORS[index] ?? BG_COLORS[0] },
        ]}
      >
        {/* Decorative rings */}
        <View
          style={[
            styles.ring,
            styles.ringOuter,
            { borderColor: theme.primary + "18" },
          ]}
        />
        <View
          style={[
            styles.ring,
            styles.ringMiddle,
            { borderColor: theme.primary + "25" },
          ]}
        />
        <View
          style={[
            styles.ring,
            styles.ringInner,
            { borderColor: theme.primary + "35" },
          ]}
        />

        {/* Icon circle */}
        <View style={[styles.iconCircle, { backgroundColor: theme.primary }]}>
          <Ionicons name={item.icon as any} size={40} color={theme.onPrimary} />
        </View>

        {/* Floating accent chips */}
        <View
          style={[
            styles.chip,
            styles.chipTopRight,
            {
              backgroundColor: theme.cardBackground,
              shadowColor: theme.primary,
            },
          ]}
        >
          <Ionicons name={item.icon as any} size={14} color={theme.primary} />
          <Text style={[styles.chipText, { color: theme.primary }]}>
            {item.highlight}
          </Text>
        </View>

        <View
          style={[
            styles.chip,
            styles.chipBottomLeft,
            {
              backgroundColor: theme.cardBackground,
              shadowColor: theme.primary,
            },
          ]}
        >
          <Ionicons name="checkmark-circle" size={14} color="#22C55E" />
          <Text style={[styles.chipText, { color: theme.text }]}>
            {index === 0 ? "Ready" : index === 1 ? "Connected" : "Live"}
          </Text>
        </View>
      </View>

      {/* Text content */}
      <View style={styles.textContent}>
        <Text style={[styles.slideTitle, { color: theme.text }]}>
          {item.title}
        </Text>
        <Text style={[styles.slideBody, { color: theme.textSecondary }]}>
          {item.body}
        </Text>
      </View>
    </View>
  );
};

// --- Screen ---
const OnboardingScreen = () => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme] || Colors.light;

  const { role } = useLocalSearchParams<{ role: string }>();
  const slides =
    ONBOARDING_CONTENT[role as keyof typeof ONBOARDING_CONTENT] ??
    ONBOARDING_CONTENT.sme;

  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const isLast = activeIndex === slides.length - 1;

  // Auto-scroll effect
  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = (activeIndex + 1) % slides.length;
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
    }, 4000); // Auto-scroll every 4 seconds

    return () => clearInterval(interval);
  }, [activeIndex, slides.length]);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveIndex(index);
  };

  const finishOnboarding = () => {
    storage.set("has_launched", true);

    router.replace({
      pathname: "/(auth)/login",
      params: { role },
    });
  };

  const goNext = () => {
    if (isLast) {
      finishOnboarding();
      return;
    }

    flatListRef.current?.scrollToIndex({
      index: activeIndex + 1,
      animated: true,
    });
  };

  const skip = () => {
    finishOnboarding();
  };

  const handleSwitchRole = () => {
    router.replace("/(auth)");
  };

  return (
    <MainContainer safe style={{ backgroundColor: theme.background }}>
      {/* Top bar */}
      <View style={styles.topBar}>
        {/* Step counter */}
        <View
          style={[styles.stepBadge, { backgroundColor: theme.cardBackground }]}
        >
          <Text style={[styles.stepText, { color: theme.textSecondary }]}>
            <Text style={{ color: theme.primary, fontWeight: "700" }}>
              {activeIndex + 1}
            </Text>
            {" / "}
            {slides.length}
          </Text>
        </View>

        {/* Skip */}
        {/* {!isLast && (
          <TouchableOpacity onPress={skip} activeOpacity={0.7}>
            <Text style={[styles.skipText, { color: theme.textSecondary }]}>
              Skip
            </Text>
          </TouchableOpacity>
        )} */}

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleSwitchRole}
          style={[]}
        >
          <Ionicons
            name="swap-horizontal"
            size={25}
            color={theme.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* Slides */}
      <Animated.FlatList
        ref={flatListRef}
        data={slides}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false },
        )}
        onMomentumScrollEnd={handleScroll}
        renderItem={({ item, index }) => (
          <Slide item={item} theme={theme} index={index} />
        )}
        scrollEventThrottle={16}
      />

      {/* Bottom controls */}
      <View style={styles.bottomBar}>
        <DotIndicator
          count={slides.length}
          activeIndex={activeIndex}
          color={theme.primary}
        />

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={goNext}
          style={[
            styles.nextBtn,
            {
              backgroundColor: theme.primary,
              width: isLast ? 130 : 56,
              height: 56,
            },
          ]}
        >
          {isLast ? (
            <Text style={[styles.nextBtnText, { color: theme.onPrimary }]}>
              Get Started
            </Text>
          ) : (
            <Ionicons name="arrow-forward" size={22} color={theme.onPrimary} />
          )}
        </TouchableOpacity>
      </View>
    </MainContainer>
  );
};

export default OnboardingScreen;

// --- Styles ---
const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
  },
  stepBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  stepText: {
    fontSize: 13,
    fontWeight: "500",
  },
  skipText: {
    fontSize: 14,
    fontWeight: "500",
  },

  slide: {
    flex: 1,
    paddingHorizontal: 24,
  },

  illustrationBox: {
    flex: 1,
    marginTop: 12,
    marginBottom: 28,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },

  // Decorative rings
  ring: {
    position: "absolute",
    borderWidth: 1,
    borderRadius: 999,
  },
  ringOuter: {
    width: 280,
    height: 280,
  },
  ringMiddle: {
    width: 200,
    height: 200,
  },
  ringInner: {
    width: 130,
    height: 130,
  },

  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },

  // Floating chips
  chip: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  chipTopRight: {
    top: 28,
    right: 24,
  },
  chipBottomLeft: {
    bottom: 28,
    left: 24,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "600",
  },

  textContent: {
    paddingBottom: 8,
  },
  slideTitle: {
    fontSize: 30,
    fontWeight: "800",
    lineHeight: 38,
    letterSpacing: -0.5,
    marginBottom: 14,
  },
  slideBody: {
    fontSize: 15.5,
    lineHeight: 24,
  },

  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 16,
  },

  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },

  nextBtn: {
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  nextBtnText: {
    fontSize: 15,
    fontWeight: "700",
    paddingHorizontal: 20,
  },
});
