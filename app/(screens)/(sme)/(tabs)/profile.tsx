import Colors from "@/constants/colors";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuthStore } from "@/store/auth";
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
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");
const COVER_HEIGHT = 200;

type Theme = (typeof Colors)["light"];

// ── Info Row ──────────────────────────────────────────────────
const InfoRow = ({
  icon,
  label,
  value,
  theme,
  last,
  onPress,
  loading,
  destructive,
}: {
  icon: string;
  label: string;
  value: string;
  theme: Theme;
  last?: boolean;
  onPress?: () => void;
  loading?: boolean;
  destructive?: boolean;
}) => {
  const tint = destructive ? theme.error : theme.primary;

  if (loading) {
    return (
      <View
        style={[
          styles.infoRow,
          !last && {
            borderBottomWidth: 1,
            borderBottomColor: theme.border + "60",
          },
        ]}
      >
        <ActivityIndicator
          color={tint}
          style={{ flex: 1, paddingVertical: 2 }}
        />
      </View>
    );
  }

  const content = (
    <>
      <View style={styles.infoLeft}>
        <View style={[styles.infoIconWrap]}>
          <Ionicons name={icon as any} size={20} color={theme.icon} />
        </View>
        {!!label && (
          <Text
            style={[
              styles.infoLabel,
              { color: destructive ? tint : theme.textSecondary },
            ]}
          >
            {label}
          </Text>
        )}
      </View>
      <View style={styles.infoRight}>
        <Text
          style={[styles.infoValue, { color: destructive ? tint : theme.text }]}
          numberOfLines={1}
        >
          {value}
        </Text>
        {onPress && (
          <Ionicons
            name="chevron-forward"
            size={14}
            color={theme.textSecondary}
          />
        )}
      </View>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        style={[
          styles.infoRow,
          !last && {
            borderBottomWidth: 1,
            borderBottomColor: theme.border + "60",
          },
        ]}
        onPress={onPress}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View
      style={[
        styles.infoRow,
        !last && {
          borderBottomWidth: 1,
          borderBottomColor: theme.border + "60",
        },
      ]}
    >
      {content}
    </View>
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
export default function SMEProfile() {
  const { theme, colorScheme, setColorScheme } = useTheme();
  const isDark = colorScheme === "dark";

  const { user, token, hasHydrated, getMe, logout } = useAuthStore();

  const [notifications, setNotifications] = useState(true);
  const [isLoading, setIsLoading] = useState<
    "logout" | "delete" | "reset" | null
  >(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!hasHydrated || !token) return;
    // Refresh user in case profile changed since last login
    getMe();
  }, [hasHydrated, token]);

  const initials = user?.fullName
    ? user.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "??";

  const p = {
    companyName: user?.fullName || "Company Name",
    initials,
    verified: user?.isVerified || false,
    city: (user as any)?.town || "City",
    region: user?.region || "Region",
    email: "N/A", // not returned by /users/me — see note below
    phone: user?.phoneNumber || "N/A",
    avatarUri: user?.profileImageUrl || null,
    coverUri: null as string | null,
  };

  // No reset-password endpoint exists in the API spec yet — this is a
  // placeholder until the backend adds one. Don't fake success.
  const handleResetPassword = () => {
    Alert.alert(
      "Not available yet",
      "Password reset isn't supported by the app yet. Please contact support if you need to change your password.",
    );
  };

  const handleLogout = () => {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: async () => {
          setIsLoading("logout");
          try {
            await logout();
            router.replace("/(auth)/login");
          } finally {
            setIsLoading(null);
          }
        },
      },
    ]);
  };

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

  if (!hasHydrated) {
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
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }

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
          onPress={() => router.push("/(screens)/(sme)/(screens)/editProfile")}
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
          <View style={styles.profileMasterCard}>
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
                  <Text
                    style={[styles.avatarInitials, { color: theme.onPrimary }]}
                  >
                    {p.initials}
                  </Text>
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

              <View style={styles.subDetailRow}>
                <Ionicons
                  name="location-outline"
                  size={13}
                  color={theme.textSecondary}
                />
                <Text
                  style={[styles.subDetailText, { color: theme.textSecondary }]}
                >
                  {p.region ? `${p.city}, ${p.region}` : p.city}
                </Text>
              </View>
            </View>
          </View>

          <Section title="Account" theme={theme}>
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
                icon="call-outline"
                label="Phone"
                value={p.phone}
                theme={theme}
                last
              />
              <InfoRow
                icon="mail-outline"
                label="Email"
                value={p.email}
                theme={theme}
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
              <View
                style={[
                  styles.toggleConfigRow,
                  {
                    borderBottomWidth: 1,
                    borderBottomColor: theme.border + "40",
                  },
                ]}
              >
                <View style={styles.toggleLeft}>
                  <View
                    style={[
                      styles.configIconWrap,
                      { backgroundColor: theme.primary + "0A" },
                    ]}
                  >
                    <Ionicons
                      name={
                        notifications ? "notifications" : "notifications-off"
                      }
                      size={16}
                      color={theme.primary}
                    />
                  </View>
                  <Text style={[styles.configLabel, { color: theme.text }]}>
                    Notifications
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

              <InfoRow
                icon="key-outline"
                label="Security"
                value="Reset password"
                theme={theme}
                onPress={handleResetPassword}
                loading={isLoading === "reset"}
                last
              />
            </View>
          </Section>

          <Section title="Account actions" theme={theme}>
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
                icon="log-out-outline"
                label=""
                value="Log out"
                theme={theme}
                onPress={handleLogout}
                loading={isLoading === "logout"}
                destructive
                last
              />
            </View>
          </Section>
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
    elevation: 2,
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
  avatarInitials: { fontSize: 26, fontWeight: "700", letterSpacing: -0.5 },
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
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  groupedCard: { borderRadius: 16, overflow: "hidden" },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  infoLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  infoIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  infoLabel: { fontSize: 14, fontWeight: "500" },
  infoRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    justifyContent: "flex-end",
    flex: 1,
  },
  infoValue: { fontSize: 15, fontWeight: "500", maxWidth: "80%" },
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
});
