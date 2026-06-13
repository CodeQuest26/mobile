import { FadeIn } from "@/components/FadeIn";
import Colors from "@/constants/colors";
import { useTheme } from "@/contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Theme = (typeof Colors)["light"];

const MANUFACTURER_PROFILE = {
  companyName: "Mensah Fabrications Ltd",
  initials: "MF",
  verified: true,
  location: "Tema Industrial Area, Tema, Ghana",
  registrationNumber: "CS0123456789",
  since: "2018",
  category: "Metal Fabrication",
  email: "info@mensahfab.com",
  phone: "+233 30 123 4567",
  website: "www.mensahfab.com",
  bankName: "GCB Bank",
  accountNumber: "****1234",
  accountName: "Mensah Fabrications Ltd",
  avatarUri: null as string | null,
  coverUri: null as string | null,
  stats: {
    totalOrders: 128,
    completedOrders: 112,
    avgRating: 4.8,
    totalEarned: "GH₵ 892,000",
  },
};

export default function ManufacturerProfile() {
  const { theme, colorScheme, setColorScheme } = useTheme();
  const isDark = colorScheme === "dark";

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => router.replace("/(auth)/login"),
      },
    ]);
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      {/* Cover — purely visual, no touch handling */}
      <View style={styles.coverContainer} pointerEvents="none">
        {MANUFACTURER_PROFILE.coverUri ? (
          <Image
            source={{ uri: MANUFACTURER_PROFILE.coverUri }}
            style={styles.coverImage}
          />
        ) : (
          <View
            style={[
              styles.coverPlaceholder,
              { backgroundColor: theme.primary },
            ]}
          >
            <Ionicons
              name="business-outline"
              size={48}
              color="rgba(255,255,255,0.5)"
            />
          </View>
        )}
        <BlurView
          intensity={isDark ? 80 : 60}
          tint={isDark ? "dark" : "light"}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      </View>

      {/* Buttons outside cover so BlurView cannot intercept touches */}
      <Pressable
        style={[styles.backBtn, { backgroundColor: theme.icon + "20" }]}
        onPress={() => router.back()}
      >
        <Ionicons name="chevron-back" size={24} color={theme.icon} />
      </Pressable>

      <Pressable
        style={[styles.editBtn, { backgroundColor: theme.icon + "20" }]}
        onPress={() =>
          router.push("/(screens)/(manufacturer)/(screens)/editProfile")
        }
      >
        <Ionicons name="create-outline" size={24} color={theme.icon} />
      </Pressable>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Avatar + company info */}
        <View style={styles.headerContainer}>
          <View style={styles.avatarRow}>
            <View
              style={[
                styles.avatarContainer,
                { borderColor: theme.background },
              ]}
            >
              {MANUFACTURER_PROFILE.avatarUri ? (
                <Image
                  source={{ uri: MANUFACTURER_PROFILE.avatarUri }}
                  style={styles.avatar}
                />
              ) : (
                <View
                  style={[
                    styles.avatarPlaceholder,
                    { backgroundColor: theme.primary },
                  ]}
                >
                  <Text style={styles.avatarInitials}>
                    {MANUFACTURER_PROFILE.initials}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <FadeIn delay={0}>
            <View style={styles.companyInfo}>
              <View style={styles.companyNameRow}>
                <Text style={[styles.companyName, { color: theme.text }]}>
                  {MANUFACTURER_PROFILE.companyName}
                </Text>
                {MANUFACTURER_PROFILE.verified && (
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={theme.primary}
                    style={styles.verifiedIcon}
                  />
                )}
              </View>
              <View style={styles.locationRow}>
                <Ionicons
                  name="location-outline"
                  size={14}
                  color={theme.textSecondary}
                />
                <Text
                  style={[styles.locationText, { color: theme.textSecondary }]}
                >
                  {MANUFACTURER_PROFILE.location}
                </Text>
              </View>
            </View>
          </FadeIn>
        </View>

        {/* Contact */}
        <FadeIn delay={200}>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Contact
            </Text>
            <View
              style={[
                styles.detailCard,
                {
                  backgroundColor: theme.cardBackground,
                  borderColor: theme.border,
                },
              ]}
            >
              <DetailRow
                icon="mail-outline"
                label="Email"
                value={MANUFACTURER_PROFILE.email}
                theme={theme}
              />
              <DetailRow
                icon="call-outline"
                label="Phone"
                value={MANUFACTURER_PROFILE.phone}
                theme={theme}
              />
              <DetailRow
                icon="globe-outline"
                label="Website"
                value={MANUFACTURER_PROFILE.website}
                theme={theme}
              />
            </View>
          </View>
        </FadeIn>

        {/* Preferences */}
        <FadeIn delay={280}>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Preferences
            </Text>
            <View
              style={[
                styles.detailCard,
                {
                  backgroundColor: theme.cardBackground,
                  borderColor: theme.border,
                },
              ]}
            >
              <View style={styles.preferenceRow}>
                <View style={styles.preferenceLeft}>
                  <Ionicons
                    name="notifications-outline"
                    size={20}
                    color={theme.textSecondary}
                  />
                  <Text style={[styles.preferenceLabel, { color: theme.text }]}>
                    Push Notifications
                  </Text>
                </View>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{ false: "#767577", true: theme.primary }}
                />
              </View>

              <View style={styles.preferenceRow}>
                <View style={styles.preferenceLeft}>
                  <Ionicons
                    name={isDark ? "moon-outline" : "sunny-outline"}
                    size={20}
                    color={theme.textSecondary}
                  />
                  <Text style={[styles.preferenceLabel, { color: theme.text }]}>
                    {isDark ? "Dark Mode" : "Light Mode"}
                  </Text>
                </View>
                <Switch
                  value={isDark}
                  onValueChange={(val) =>
                    setColorScheme(val ? "dark" : "light")
                  }
                  trackColor={{ false: "#767577", true: theme.primary }}
                />
              </View>
            </View>
          </View>
        </FadeIn>

        {/* Logout */}
        <FadeIn delay={320}>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[
                styles.actionBtn,
                {
                  backgroundColor: theme.cardBackground,
                  borderColor: theme.border,
                },
              ]}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={20} color={theme.error} />
              <Text style={[styles.actionBtnText, { color: theme.error }]}>
                Logout
              </Text>
            </TouchableOpacity>
          </View>
        </FadeIn>

        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

const DetailRow = ({
  icon,
  label,
  value,
  theme,
}: {
  icon: string;
  label: string;
  value: string;
  theme: Theme;
}) => (
  <View style={styles.detailRow}>
    <View style={styles.detailLeft}>
      <Ionicons name={icon as any} size={18} color={theme.textSecondary} />
      <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
        {label}
      </Text>
    </View>
    <Text style={[styles.detailValue, { color: theme.text }]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { paddingBottom: 20, marginTop: 180 },

  coverContainer: {
    height: 180,
    width: "100%",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 0,
  },
  coverPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  coverImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  backBtn: {
    borderRadius: 10,
    padding: 6,
    position: "absolute",
    top: 60,
    left: 16,
    zIndex: 10,
  },
  editBtn: {
    borderRadius: 10,
    padding: 6,
    position: "absolute",
    top: 60,
    right: 16,
    zIndex: 10,
  },

  headerContainer: { marginBottom: 16 },
  avatarRow: {
    alignItems: "center",
    marginTop: -50,
    marginBottom: 12,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitials: {
    fontSize: 32,
    fontWeight: "800",
    color: "#fff",
  },
  avatar: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  companyInfo: {
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 8,
  },
  companyNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  companyName: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  verifiedIcon: { marginLeft: 4 },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  locationText: { fontSize: 13 },

  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  detailCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    flexShrink: 1,
    textAlign: "right",
  },

  preferenceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  preferenceLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  preferenceLabel: {
    fontSize: 14,
    fontWeight: "500",
  },

  actionButtons: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 30,
    borderWidth: 1,
    paddingVertical: 12,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
