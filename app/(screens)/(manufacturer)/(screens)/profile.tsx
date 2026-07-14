import Colors from "@/constants/colors";
import { api } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

const { width } = Dimensions.get("window");
const COVER_HEIGHT = 200;

type Theme = (typeof Colors)["light"];

// ── API Types ──────────────────────────────────────────────────────────────
interface ApiUser {
  id: string;
  phoneNumber: string;
  fullName: string;
  role: string;
  isVerified: boolean;
  region?: string;
  town?: string;
  profileImageUrl?: string;
}

interface ApiOrder {
  id: string;
  agreedAmountGhs: number;
  status: string;
  // ... other fields
}

// ── Star rating ──────────────────────────────────────────────────────────────
const StarRating = ({ rating, count }: { rating: number; count: number }) => {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <View style={styles.starContainer}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons
          key={i}
          name={
            i <= full
              ? "star"
              : i === full + 1 && half
                ? "star-half"
                : "star-outline"
          }
          size={13}
          color="#F59E0B"
        />
      ))}
      <Text style={styles.starText}>
        {rating.toFixed(1)} <Text style={{ opacity: 0.5 }}>({count})</Text>
      </Text>
    </View>
  );
};

// ── Info Row ──────────────────────────────────────────────────
const InfoRow = ({
  icon,
  label,
  value,
  theme,
  last,
}: {
  icon: string;
  label: string;
  value: string;
  theme: Theme;
  last?: boolean;
}) => (
  <Pressable
    style={[
      styles.infoRow,
      !last && { borderBottomWidth: 1, borderBottomColor: theme.border + "60" },
    ]}
    onPress={() => Alert.alert(label, value)}
  >
    <View style={styles.infoLeft}>
      <View
        style={[styles.infoIconWrap, { backgroundColor: theme.primary + "0A" }]}
      >
        <Ionicons name={icon as any} size={15} color={theme.primary} />
      </View>
      <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
        {label}
      </Text>
    </View>
    <View style={styles.infoRight}>
      <Text style={[styles.infoValue, { color: theme.text }]} numberOfLines={1}>
        {value}
      </Text>
      <Ionicons name="chevron-forward" size={14} color={theme.textSecondary} />
    </View>
  </Pressable>
);

// ── Section ────────────────────────────────────────────────────
const Section = ({
  title,
  children,
  theme,
}: {
  title: string;
  children: React.ReactNode;
  theme: Theme;
}) => (
  <View style={styles.section}>
    <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
      {title.toUpperCase()}
    </Text>
    {children}
  </View>
);

// ── Main Screen ──────────────────────────────────────────────
export default function ManufacturerProfile() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];
  const isDark = colorScheme === "dark";

  const [notifications, setNotifications] = useState(true);
  const scrollY = useRef(new Animated.Value(0)).current;

  // State for real data
  const [user, setUser] = useState<ApiUser | null>(null);
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // Stats derived from orders
  const stats = {
    totalOrders: 0,
    completedOrders: 0,
    totalEarned: 0,
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // 1. Fetch user
        const userRes = await api.get("users/me");
        setUser(userRes.data);

        // 2. Fetch orders
        const ordersRes = await api.get("orders", {
          params: { page: 0, size: 1000 },
        });
        const allOrders: ApiOrder[] = ordersRes.data.content || [];
        setOrders(allOrders);

        // Compute stats
        const completed = allOrders.filter((o) => o.status === "COMPLETED");
        const totalEarned = completed.reduce(
          (sum, o) => sum + (o.agreedAmountGhs || 0),
          0,
        );
        stats.totalOrders = allOrders.length;
        stats.completedOrders = completed.length;
        stats.totalEarned = totalEarned;
      } catch (error) {
        console.error("Error fetching profile data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Build profile object from API data
  const profile = {
    companyName: user?.fullName || "Manufacturer",
    initials: user?.fullName
      ? user.fullName
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)
      : "MF",
    verified: user?.isVerified || false,
    bio: "Short bio about the manufacturer.", //
    city: user?.town || "City",
    region: user?.region || "Region",
    country: "Ghana",
    registrationNumber: "N/A", // Not available from user endpoint
    since: new Date().getFullYear().toString(), // Placeholder
    category: "Manufacturing", // Placeholder – could be from sectorTags if we had factory profile
    email: "N/A", // Not available from user endpoint
    phone: user?.phoneNumber || "N/A",
    website: "N/A",
    bankName: "N/A",
    accountNumber: "N/A",
    accountName: "N/A",
    avatarUri: user?.profileImageUrl || null,
    coverUri: null,
    averageRating: 0, // Could be computed from reviews if we had them
    ratingCount: 0,
    stats: {
      totalOrders: stats.totalOrders,
      completedOrders: stats.completedOrders,
      totalEarned: `GH₵ ${(stats.totalEarned || 0).toLocaleString()}`,
    },
  };

  const handleLogout = () => {
    Alert.alert(
      "Log out",
      "Are you sure you want to log out from your workspace?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log out",
          style: "destructive",
          onPress: () => {
            // Clear tokens and navigate to login
            router.replace("/(auth)/login");
          },
        },
      ],
    );
  };

  // Nav dynamic blur configs
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 60, 100],
    outputRange: [0, 0.4, 1],
    extrapolate: "clamp",
  });

  const coverScale = scrollY.interpolate({
    inputRange: [-200, 0],
    outputRange: [2, 1],
    extrapolateRight: "clamp",
  });

  const coverTranslateY = scrollY.interpolate({
    inputRange: [-200, 0, COVER_HEIGHT],
    outputRange: [-100, 0, COVER_HEIGHT * 0.5],
    extrapolate: "clamp",
  });

  if (loading) {
    return (
      <View
        style={[
          styles.screen,
          {
            backgroundColor: theme.background,
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        <Text style={{ color: theme.textSecondary }}>Loading profile...</Text>
      </View>
    );
  }

  const p = profile;

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        translucent
        backgroundColor="transparent"
      />

      {/* ── Dynamic Top Bar Floating Navigation ── */}
      <Animated.View
        style={[
          styles.headerBlur,
          { opacity: headerOpacity, borderBottomColor: theme.border },
        ]}
      >
        <BlurView
          intensity={Platform.OS === "ios" ? 85 : 100}
          tint={isDark ? "dark" : "light"}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            {p.companyName}
          </Text>
        </View>
      </Animated.View>

      {/* Floating Buttons */}
      <View
        style={[
          styles.navActionWrapper,
          { top: Platform.OS === "ios" ? 54 : 40 },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={[
            styles.navBtn,
            { backgroundColor: theme.cardBackground + "E0" },
          ]}
        >
          <Ionicons name="chevron-back" size={20} color={theme.text} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() =>
            router.push("/(screens)/(manufacturer)/(screens)/editProfile")
          }
          style={[
            styles.navBtn,
            { backgroundColor: theme.cardBackground + "E0" },
          ]}
        >
          <Ionicons name="pencil-sharp" size={18} color={theme.text} />
        </TouchableOpacity>
      </View>

      {/* ── Background Canvas Parallax Cover ── */}
      <Animated.View
        style={[
          styles.coverContainer,
          {
            transform: [{ scale: coverScale }, { translateY: coverTranslateY }],
          },
        ]}
      >
        {p.coverUri ? (
          <Image source={{ uri: p.coverUri }} style={styles.coverImage} />
        ) : (
          <LinearGradient
            colors={[theme.primary + "25", theme.primary + "05"]}
            style={styles.coverImage}
          />
        )}
      </Animated.View>

      {/* ── Scrollable Body Context ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
        scrollEventThrottle={16}
      >
        <View style={styles.mainCardPositioner}>
          {/* Main Integrated Profile Master Card */}
          <View
            style={[
              styles.profileMasterCard,
              {
                backgroundColor: theme.cardBackground,
                borderColor: theme.border,
              },
            ]}
          >
            {/* Avatar Section Frame */}
            <View
              style={[
                styles.avatarBoundary,
                {
                  borderColor: theme.cardBackground,
                  backgroundColor: theme.cardBackground,
                },
              ]}
            >
              {p.avatarUri ? (
                <Image source={{ uri: p.avatarUri }} style={styles.avatar} />
              ) : (
                <View
                  style={[styles.avatar, { backgroundColor: theme.primary }]}
                >
                  <Text style={styles.avatarInitials}>{p.initials}</Text>
                </View>
              )}
            </View>

            {/* Profile Info Details */}
            <View style={styles.metaInformation}>
              <View style={styles.titleLine}>
                <Text style={[styles.companyName, { color: theme.text }]}>
                  {p.companyName}
                </Text>
                {p.verified && (
                  <View
                    style={[
                      styles.verifiedBadge,
                      { backgroundColor: theme.primary + "12" },
                    ]}
                  >
                    <Ionicons
                      name="checkmark-circle"
                      size={14}
                      color={theme.primary}
                    />
                  </View>
                )}
              </View>

              <View style={styles.subDetailRow}>
                <Ionicons
                  name="location-outline"
                  size={13}
                  color={theme.textSecondary}
                />
                <Text
                  style={[styles.subDetailText, { color: theme.textSecondary }]}
                >
                  {p.city}, {p.region}
                </Text>
                <View
                  style={[
                    styles.dotSeparator,
                    { backgroundColor: theme.border },
                  ]}
                />
                <StarRating rating={p.averageRating} count={p.ratingCount} />
              </View>

              <View style={styles.tagShelf}>
                <View
                  style={[
                    styles.chip,
                    {
                      backgroundColor: theme.primary + "0A",
                      borderColor: theme.primary + "1A",
                    },
                  ]}
                >
                  <Text style={[styles.chipText, { color: theme.primary }]}>
                    {p.category}
                  </Text>
                </View>
                <View
                  style={[
                    styles.chip,
                    {
                      backgroundColor: theme.border + "40",
                      borderColor: "transparent",
                    },
                  ]}
                >
                  <Text
                    style={[styles.chipText, { color: theme.textSecondary }]}
                  >
                    Est. {p.since}
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.divider,
                  { backgroundColor: theme.border + "40" },
                ]}
              />

              <Text style={[styles.bioText, { color: theme.textSecondary }]}>
                {p.bio}
              </Text>
            </View>
          </View>

          {/* Stats Card */}
          <View
            style={[
              styles.groupedCard,
              {
                backgroundColor: theme.cardBackground,
                borderColor: theme.border,
                padding: 16,
                borderRadius: 16,
                borderWidth: 1,
                marginBottom: 20,
              },
            ]}
          >
            <View
              style={{ flexDirection: "row", justifyContent: "space-around" }}
            >
              <View style={{ alignItems: "center" }}>
                <Text style={[styles.statValue, { color: theme.text }]}>
                  {p.stats.totalOrders}
                </Text>
                <Text
                  style={[styles.statLabel, { color: theme.textSecondary }]}
                >
                  Orders
                </Text>
              </View>
              <View style={{ alignItems: "center" }}>
                <Text style={[styles.statValue, { color: theme.text }]}>
                  {p.stats.completedOrders}
                </Text>
                <Text
                  style={[styles.statLabel, { color: theme.textSecondary }]}
                >
                  Completed
                </Text>
              </View>
              <View style={{ alignItems: "center" }}>
                <Text style={[styles.statValue, { color: theme.text }]}>
                  {p.stats.totalEarned}
                </Text>
                <Text
                  style={[styles.statLabel, { color: theme.textSecondary }]}
                >
                  Earned
                </Text>
              </View>
            </View>
          </View>

          {/* Contact Details Module */}
          <Section title="Contact Channels" theme={theme}>
            <View
              style={[
                styles.groupedCard,
                {
                  backgroundColor: theme.cardBackground,
                  borderColor: theme.border,
                },
              ]}
            >
              <InfoRow
                icon="mail-outline"
                label="Email Address"
                value={p.email}
                theme={theme}
              />
              <InfoRow
                icon="call-outline"
                label="Business Line"
                value={p.phone}
                theme={theme}
              />
              <InfoRow
                icon="globe-outline"
                label="Corporate Website"
                value={p.website}
                theme={theme}
                last
              />
            </View>
          </Section>

          {/* Functional System Application Configuration Preferences */}
          <Section title="Preferences" theme={theme}>
            <View
              style={[
                styles.groupedCard,
                {
                  backgroundColor: theme.cardBackground,
                  borderColor: theme.border,
                },
              ]}
            >
              <View style={styles.toggleConfigRow}>
                <View style={styles.toggleLeft}>
                  <View
                    style={[
                      styles.configIconWrap,
                      { backgroundColor: theme.primary + "0A" },
                    ]}
                  >
                    <Ionicons
                      name="notifications-outline"
                      size={16}
                      color={theme.primary}
                    />
                  </View>
                  <Text style={[styles.configLabel, { color: theme.text }]}>
                    Push Alerts
                  </Text>
                </View>
                <Switch
                  value={notifications}
                  onValueChange={setNotifications}
                  trackColor={{
                    false: theme.border,
                    true: theme.primary + "60",
                  }}
                  thumbColor={notifications ? theme.primary : "#F4F3F4"}
                />
              </View>
            </View>
          </Section>

          {/* Secure System Termination Button */}
          <TouchableOpacity
            onPress={handleLogout}
            activeOpacity={0.8}
            style={[styles.signOutAction, { borderColor: theme.error + "50" }]}
          >
            <Ionicons name="log-out-outline" size={18} color={theme.error} />
            <Text style={[styles.signOutLabel, { color: theme.error }]}>
              Sign Out
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  headerBlur: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS === "ios" ? 94 : 80,
    zIndex: 40,
    borderBottomWidth: 0.5,
    justifyContent: "flex-end",
  },
  headerContent: {
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 70,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  navActionWrapper: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 50,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  coverContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: COVER_HEIGHT,
    zIndex: 0,
  },
  coverImage: {
    width: "100%",
    height: "100%",
  },
  scrollContent: {
    paddingTop: COVER_HEIGHT - 40,
    paddingBottom: 40,
  },
  mainCardPositioner: {
    paddingHorizontal: 16,
  },
  profileMasterCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 3,
    marginBottom: 24,
  },
  avatarBoundary: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 4,
    marginTop: -64,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  avatar: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitials: {
    fontSize: 26,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  metaInformation: {
    alignItems: "center",
    width: "100%",
    marginTop: 12,
  },
  titleLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  companyName: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.4,
    textAlign: "center",
  },
  verifiedBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  subDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  subDetailText: {
    fontSize: 13,
    marginLeft: 3,
    fontWeight: "500",
  },
  dotSeparator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 8,
    opacity: 0.6,
  },
  starContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  starText: {
    fontSize: 12.5,
    fontWeight: "600",
    color: "#F59E0B",
    marginLeft: 3,
  },
  tagShelf: {
    flexDirection: "row",
    gap: 6,
    marginTop: 14,
    justifyContent: "center",
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 11,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    width: "100%",
    marginVertical: 16,
  },
  bioText: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    paddingHorizontal: 8,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  groupedCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  infoLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  infoIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 13.5,
    fontWeight: "500",
  },
  infoRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    justifyContent: "flex-end",
    flex: 1,
  },
  infoValue: {
    fontSize: 13.5,
    fontWeight: "500",
    maxWidth: "80%",
  },
  toggleConfigRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  toggleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  configIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  configLabel: {
    fontSize: 13.5,
    fontWeight: "500",
  },
  signOutAction: {
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 15,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  signOutLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
});
