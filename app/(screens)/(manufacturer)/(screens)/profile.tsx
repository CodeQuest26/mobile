import Colors from "@/constants/colors";
import { api } from "@/services/api";
import { useAuthStore } from "@/store/auth";
import { mmkvStorage } from "@/store/mmkv";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  Linking,
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

interface ApiOrder {
  id: string;
  agreedAmountGhs: number;
  status: string;
}

interface Stats {
  totalOrders: number;
  completedOrders: number;
  totalEarned: number;
}

// ---------------------------------------------------------------------
// There is still no GET /users/factory-profile (or equivalent) in the
// API — only POST (create) and PUT (update). That means companyName,
// description, sectorTags, machineryList, minOrderQuantity,
// maxOrderQuantity, and address genuinely cannot be fetched from the
// backend here. As a stopgap, this screen reads the same locally
// cached draft that EditManufacturerProfile.tsx writes to MMKV after
// every successful save (same DRAFT_KEY). This is NOT authoritative —
// it's whatever was last saved *from this device*. A reinstall, a new
// device, or an edit made elsewhere (e.g. by an admin) won't be
// reflected until the backend adds a real read endpoint for this data.
// User-level fields (email, region, town, profileImageUrl,
// ghanaCardNumber, createdAt) ARE real, fetched via GET /users/me
// through the auth store, and don't have this limitation.
// ---------------------------------------------------------------------
const DRAFT_KEY = "factoryProfileDraft";

interface CachedFactoryDraft {
  companyName?: string;
  description?: string;
  sectorTagsInput?: string;
  machineryList?: string;
  minOrderQuantity?: string;
  maxOrderQuantity?: string;
  address?: string;
}

// Machinery is stored server-side as a JSON array string (see
// EditManufacturerProfile's handleSave), so parse it back into a
// readable, comma-joined list here. Falls back to treating it as a
// plain comma list if it isn't valid JSON, so older cached drafts
// (saved before that fix) still render something sensible instead of
// a raw JSON string.
const parseMachineryList = (raw?: string): string[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter(Boolean);
  } catch {
    // Not JSON — fall through to comma-split.
  }
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const parseSectorTags = (raw?: string): string[] =>
  (raw || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

// Basic sanity check before attempting a tel:/mailto: deep link, so we
// don't fire Linking.openURL on placeholder strings like "Not provided".
const isUsableContactValue = (value: string) =>
  Boolean(value) && value !== "Not provided";

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

// ── Info Row v2 ─────────────────────────────────────────────
// variant "action"   -> tinted icon + chevron, tappable to open a deep link
// variant "readonly" -> neutral icon + copy glyph, tap still shows full value
// variant "default"  -> neutral icon, no trailing glyph, tap shows full value
type InfoRowVariant = "default" | "action" | "readonly";

const InfoRow = ({
  icon,
  label,
  value,
  theme,
  last,
  variant = "default",
  onPress,
  multiline,
}: {
  icon: string;
  label: string;
  value: string;
  theme: Theme;
  last?: boolean;
  variant?: InfoRowVariant;
  onPress?: () => void;
  multiline?: boolean;
}) => {
  const [pressed, setPressed] = useState(false);

  const handlePress = () => {
    if (onPress) return onPress();
    Alert.alert(label, value);
  };

  return (
    <Pressable
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onPress={handlePress}
      style={[
        styles.infoRowV2,
        !last && {
          borderBottomWidth: 1,
          borderBottomColor: theme.border + "40",
        },
        pressed && { backgroundColor: theme.primary + "06" },
      ]}
    >
      {pressed && (
        <View style={[styles.accentBar, { backgroundColor: theme.primary }]} />
      )}

      <View
        style={[
          styles.infoIconWrapV2,
          {
            backgroundColor:
              variant === "action" ? theme.primary + "12" : theme.border + "50",
          },
        ]}
      >
        <Ionicons
          name={icon as any}
          size={15}
          color={variant === "action" ? theme.primary : theme.textSecondary}
        />
      </View>

      <View style={styles.infoBodyV2}>
        <Text style={[styles.infoLabelV2, { color: theme.textSecondary }]}>
          {label}
        </Text>
        <Text
          style={[styles.infoValueV2, { color: theme.text }]}
          numberOfLines={multiline ? 2 : 1}
        >
          {value}
        </Text>
      </View>

      {variant === "action" && (
        <Ionicons
          name="chevron-forward"
          size={15}
          color={theme.textSecondary}
        />
      )}
      {variant === "readonly" && (
        <Ionicons name="copy-outline" size={14} color={theme.textSecondary} />
      )}
    </Pressable>
  );
};

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

  // Pull auth state from the store instead of re-fetching independently.
  // This guarantees we only read `user` once the store has hydrated
  // and the api client has its Authorization header attached.
  const { user, token, hasHydrated, getMe, logout } = useAuthStore();

  const [notifications, setNotifications] = useState(true);
  const scrollY = useRef(new Animated.Value(0)).current;

  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0,
    completedOrders: 0,
    totalEarned: 0,
  });
  const [factoryDraft, setFactoryDraft] = useState<CachedFactoryDraft | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wait for the persisted auth store to rehydrate (and thus for the
    // api instance's Authorization header to be set) before hitting the API.
    if (!hasHydrated) return;

    if (!token) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);

        // Refresh user in case profile changed since last login
        await getMe();

        const ordersRes = await api.get("orders", {
          params: { page: 0, size: 1000 },
        });
        const allOrders: ApiOrder[] = ordersRes.data.content || [];
        setOrders(allOrders);

        const completed = allOrders.filter((o) => o.status === "COMPLETED");
        const totalEarned = completed.reduce(
          (sum, o) => sum + (o.agreedAmountGhs || 0),
          0,
        );

        setStats({
          totalOrders: allOrders.length,
          completedOrders: completed.length,
          totalEarned,
        });
      } catch (error) {
        console.error("Error fetching profile data:", error);
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

  const sectorTags = parseSectorTags(factoryDraft?.sectorTagsInput);
  const machineryItems = parseMachineryList(factoryDraft?.machineryList);
  const hasFactoryDetails = Boolean(
    factoryDraft?.companyName || sectorTags.length > 0,
  );

  const registrationYear = user?.createdAt
    ? new Date(user.createdAt).getFullYear().toString()
    : null;

  const profile = {
    companyName: factoryDraft?.companyName || user?.fullName || "Manufacturer",
    initials: (factoryDraft?.companyName || user?.fullName || "MF")
      .split(" ")
      .map((n) => n[0])
      .filter(Boolean)
      .join("")
      .toUpperCase()
      .slice(0, 2),
    verified: user?.isVerified || false,
    bio: factoryDraft?.description || "No company description added yet.",
    city: (user as any)?.town || "City",
    region: user?.region || "Region",
    country: "Ghana",
    registrationNumber: (user as any)?.ghanaCardNumber || "Not provided",
    since: registrationYear || new Date().getFullYear().toString(),
    sectorTags,
    machineryItems,
    minOrderQuantity: factoryDraft?.minOrderQuantity || null,
    maxOrderQuantity: factoryDraft?.maxOrderQuantity || null,
    address: factoryDraft?.address || null,

    website: "Not provided",
    email: (user as any)?.email || "Not provided",
    phone: user?.phoneNumber || "Not provided",
    avatarUri: (user as any)?.profileImageUrl || null,
    coverUri: null,

    averageRating: 0,
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
          onPress: async () => {
            await logout();
            router.replace("/(auth)/login");
          },
        },
      ],
    );
  };

  const goToEdit = () =>
    router.push("/(screens)/(manufacturer)/(screens)/editProfile");

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

  if (!hasHydrated || loading) {
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
        <ActivityIndicator size="small" color={theme.primary} />
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
          onPress={goToEdit}
          style={[
            styles.navBtn,
            { backgroundColor: theme.cardBackground + "E0" },
          ]}
        >
          <Ionicons name="pencil-sharp" size={18} color={theme.text} />
        </TouchableOpacity>
      </View>

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
          <View
            style={[
              styles.profileMasterCard,
              {
                backgroundColor: theme.cardBackground,
                borderColor: theme.border,
              },
            ]}
          >
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

              <View style={styles.tagShelf}>
                {p.sectorTags.length > 0 ? (
                  p.sectorTags.map((tag) => (
                    <View
                      key={tag}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: theme.primary + "0A",
                          borderColor: theme.primary + "1A",
                        },
                      ]}
                    >
                      <Text style={[styles.chipText, { color: theme.primary }]}>
                        {tag}
                      </Text>
                    </View>
                  ))
                ) : (
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
                      Manufacturing
                    </Text>
                  </View>
                )}
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

              <View style={[styles.subDetailRow, { marginTop: 10 }]}>
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
              </View>

              <View style={{ marginTop: 10 }}>
                <StarRating rating={p.averageRating} count={p.ratingCount} />
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

          {!hasFactoryDetails && (
            <TouchableOpacity
              onPress={goToEdit}
              activeOpacity={0.85}
              style={[
                styles.setupBanner,
                {
                  backgroundColor: theme.primary + "0A",
                  borderColor: theme.primary + "1A",
                },
              ]}
            >
              <Ionicons
                name="construct-outline"
                size={18}
                color={theme.primary}
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.setupBannerTitle, { color: theme.text }]}>
                  Finish setting up your company profile
                </Text>
                <Text
                  style={[
                    styles.setupBannerSubtitle,
                    { color: theme.textSecondary },
                  ]}
                >
                  Add your company name, sectors, and details so buyers can find
                  you.
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={theme.textSecondary}
              />
            </TouchableOpacity>
          )}

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
                variant={isUsableContactValue(p.email) ? "action" : "default"}
                onPress={
                  isUsableContactValue(p.email)
                    ? () => Linking.openURL(`mailto:${p.email}`)
                    : undefined
                }
              />
              <InfoRow
                icon="call-outline"
                label="Business Line"
                value={p.phone}
                theme={theme}
                variant={isUsableContactValue(p.phone) ? "action" : "default"}
                onPress={
                  isUsableContactValue(p.phone)
                    ? () => Linking.openURL(`tel:${p.phone}`)
                    : undefined
                }
              />
              <InfoRow
                icon="globe-outline"
                label="Corporate Website"
                value={p.website}
                theme={theme}
                last={!p.address}
              />
              {p.address && (
                <InfoRow
                  icon="location-outline"
                  label="Factory Address"
                  value={p.address}
                  theme={theme}
                  variant="readonly"
                  multiline
                  last
                />
              )}
            </View>
          </Section>

          {(p.minOrderQuantity ||
            p.maxOrderQuantity ||
            p.machineryItems.length > 0) && (
            <Section title="Capacity" theme={theme}>
              <View
                style={[
                  styles.groupedCard,
                  {
                    backgroundColor: theme.cardBackground,
                    borderColor: theme.border,
                  },
                ]}
              >
                {(p.minOrderQuantity || p.maxOrderQuantity) && (
                  <InfoRow
                    icon="cube-outline"
                    label="Order Quantity Range"
                    value={
                      p.minOrderQuantity && p.maxOrderQuantity
                        ? `${p.minOrderQuantity} – ${p.maxOrderQuantity} units`
                        : `${p.minOrderQuantity || p.maxOrderQuantity} units`
                    }
                    theme={theme}
                    last={p.machineryItems.length === 0}
                  />
                )}
                {p.machineryItems.length > 0 && (
                  <InfoRow
                    icon="construct-outline"
                    label="Machinery"
                    value={p.machineryItems.join(", ")}
                    theme={theme}
                    variant="readonly"
                    multiline
                    last
                  />
                )}
              </View>
            </Section>
          )}

          <Section title="Registration" theme={theme}>
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
                icon="card-outline"
                label="Ghana Card Number"
                value={p.registrationNumber}
                theme={theme}
                variant="readonly"
                last
              />
            </View>
          </Section>

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
  screen: { flex: 1 },
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
  headerTitle: { fontSize: 15, fontWeight: "600" },
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
  coverImage: { width: "100%", height: "100%" },
  scrollContent: { paddingTop: COVER_HEIGHT - 40, paddingBottom: 40 },
  mainCardPositioner: { paddingHorizontal: 16 },
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
  metaInformation: { alignItems: "center", width: "100%", marginTop: 12 },
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
  subDetailText: { fontSize: 13, marginLeft: 3, fontWeight: "500" },
  starContainer: { flexDirection: "row", alignItems: "center", gap: 2 },
  starText: {
    fontSize: 12.5,
    fontWeight: "600",
    color: "#F59E0B",
    marginLeft: 3,
  },
  tagShelf: {
    flexDirection: "row",
    flexWrap: "wrap",
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
  chipText: { fontSize: 11, fontWeight: "600" },
  divider: { height: 1, width: "100%", marginVertical: 16 },
  bioText: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    paddingHorizontal: 8,
  },
  setupBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },
  setupBannerTitle: { fontSize: 13.5, fontWeight: "600" },
  setupBannerSubtitle: { fontSize: 12, marginTop: 2, lineHeight: 16 },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  groupedCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },

  infoRowV2: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 16,
    position: "relative",
  },
  accentBar: {
    position: "absolute",
    left: 0,
    top: 8,
    bottom: 8,
    width: 3,
    borderRadius: 2,
  },
  infoIconWrapV2: {
    width: 30,
    height: 30,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 1,
  },
  infoBodyV2: {
    flex: 1,
  },
  infoLabelV2: {
    fontSize: 11.5,
    fontWeight: "600",
    letterSpacing: 0.2,
    marginBottom: 2,
    textTransform: "uppercase",
    opacity: 0.75,
  },
  infoValueV2: {
    fontSize: 14.5,
    fontWeight: "500",
    lineHeight: 19,
  },

  toggleConfigRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  toggleLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  configIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  configLabel: { fontSize: 13.5, fontWeight: "500" },
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
  signOutLabel: { fontSize: 14, fontWeight: "600" },
  statValue: { fontSize: 20, fontWeight: "700" },
  statLabel: { fontSize: 12, marginTop: 4 },
});
