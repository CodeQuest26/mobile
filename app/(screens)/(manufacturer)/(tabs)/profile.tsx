import { FadeIn } from "@/components/FadeIn";
import Colors from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

import { BlurView } from "expo-blur";

// Mock data for the manufacturer profile
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
  avatarUri: null, // would be a remote URL in real app
  coverUri: null,
  stats: {
    totalOrders: 128,
    completedOrders: 112,
    avgRating: 4.8,
    totalEarned: "GH₵ 892,000",
  },
};

export default function ManufacturerProfile() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme] || Colors.light;
  const isDark = colorScheme === "dark";

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(isDark);

  const handleEditProfile = () => {
    Alert.alert("Edit Profile", "This will open an edit form.");
  };

  const handleSettings = () => {
    Alert.alert("Settings", "Open settings screen.");
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive" },
    ]);
  };

  return (
    <>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <View style={[styles.screen, { backgroundColor: theme.background }]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          {/* Header with cover and avatar */}
          <View style={styles.headerContainer}>
            <View style={styles.coverContainer}>
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
                style={styles.coverOverlay}
              />
            </View>

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

              <TouchableOpacity
                style={styles.editAvatarButton}
                onPress={handleEditProfile}
              >
                <Ionicons name="camera-outline" size={18} color="#fff" />
              </TouchableOpacity>
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
                    style={[
                      styles.locationText,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {MANUFACTURER_PROFILE.location}
                  </Text>
                </View>
              </View>
            </FadeIn>
          </View>

          {/* Stats Cards */}
          <FadeIn delay={80}>
            <View style={styles.statsGrid}>
              <View
                style={[
                  styles.statCard,
                  {
                    backgroundColor: theme.cardBackground,
                    borderColor: theme.border,
                  },
                ]}
              >
                <Text style={[styles.statValue, { color: theme.text }]}>
                  {MANUFACTURER_PROFILE.stats.totalOrders}
                </Text>
                <Text
                  style={[styles.statLabel, { color: theme.textSecondary }]}
                >
                  Total Orders
                </Text>
              </View>
              <View
                style={[
                  styles.statCard,
                  {
                    backgroundColor: theme.cardBackground,
                    borderColor: theme.border,
                  },
                ]}
              >
                <Text style={[styles.statValue, { color: theme.text }]}>
                  {MANUFACTURER_PROFILE.stats.completedOrders}
                </Text>
                <Text
                  style={[styles.statLabel, { color: theme.textSecondary }]}
                >
                  Completed
                </Text>
              </View>
              <View
                style={[
                  styles.statCard,
                  {
                    backgroundColor: theme.cardBackground,
                    borderColor: theme.border,
                  },
                ]}
              >
                <View style={styles.ratingRow}>
                  <Text style={[styles.statValue, { color: theme.text }]}>
                    {MANUFACTURER_PROFILE.stats.avgRating}
                  </Text>
                  <Ionicons name="star" size={14} color="#F59E0B" />
                </View>
                <Text
                  style={[styles.statLabel, { color: theme.textSecondary }]}
                >
                  Rating
                </Text>
              </View>
              <View
                style={[
                  styles.statCard,
                  {
                    backgroundColor: theme.cardBackground,
                    borderColor: theme.border,
                  },
                ]}
              >
                <Text style={[styles.statValue, { color: theme.text }]}>
                  {MANUFACTURER_PROFILE.stats.totalEarned}
                </Text>
                <Text
                  style={[styles.statLabel, { color: theme.textSecondary }]}
                >
                  Total Earned
                </Text>
              </View>
            </View>
          </FadeIn>

          {/* Business Details */}
          <FadeIn delay={160}>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Business Details
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
                  icon="document-text-outline"
                  label="Registration #"
                  value={MANUFACTURER_PROFILE.registrationNumber}
                  theme={theme}
                />
                <DetailRow
                  icon="calendar-outline"
                  label="Since"
                  value={MANUFACTURER_PROFILE.since}
                  theme={theme}
                />
                <DetailRow
                  icon="briefcase-outline"
                  label="Category"
                  value={MANUFACTURER_PROFILE.category}
                  theme={theme}
                />
              </View>
            </View>
          </FadeIn>

          {/* Contact Information */}
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

          {/* Payment Details */}
          <FadeIn delay={240}>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Payment Details
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
                  icon="business-outline"
                  label="Bank"
                  value={MANUFACTURER_PROFILE.bankName}
                  theme={theme}
                />
                <DetailRow
                  icon="card-outline"
                  label="Account Number"
                  value={MANUFACTURER_PROFILE.accountNumber}
                  theme={theme}
                />
                <DetailRow
                  icon="person-outline"
                  label="Account Name"
                  value={MANUFACTURER_PROFILE.accountName}
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
                    <Text
                      style={[styles.preferenceLabel, { color: theme.text }]}
                    >
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
                      name="moon-outline"
                      size={20}
                      color={theme.textSecondary}
                    />
                    <Text
                      style={[styles.preferenceLabel, { color: theme.text }]}
                    >
                      Dark Mode
                    </Text>
                  </View>
                  <Switch
                    value={darkModeEnabled}
                    onValueChange={setDarkModeEnabled}
                    trackColor={{ false: "#767577", true: theme.primary }}
                  />
                </View>
              </View>
            </View>
          </FadeIn>

          {/* Action Buttons */}
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
                onPress={handleEditProfile}
              >
                <Ionicons
                  name="create-outline"
                  size={20}
                  color={theme.primary}
                />
                <Text style={[styles.actionBtnText, { color: theme.primary }]}>
                  Edit Profile
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  {
                    backgroundColor: theme.cardBackground,
                    borderColor: theme.border,
                  },
                ]}
                onPress={handleSettings}
              >
                <Ionicons
                  name="settings-outline"
                  size={20}
                  color={theme.textSecondary}
                />
                <Text
                  style={[styles.actionBtnText, { color: theme.textSecondary }]}
                >
                  Settings
                </Text>
              </TouchableOpacity>
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
                <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                <Text style={[styles.actionBtnText, { color: "#EF4444" }]}>
                  Logout
                </Text>
              </TouchableOpacity>
            </View>
          </FadeIn>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </>
  );
}

// Helper component for detail rows
const DetailRow = ({
  icon,
  label,
  value,
  theme,
}: {
  icon: string;
  label: string;
  value: string;
  theme: any;
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
  scroll: { paddingBottom: 20 },
  headerContainer: {
    marginBottom: 16,
  },
  coverContainer: {
    height: 180,
    width: "100%",
    position: "relative",
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
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
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
  editAvatarButton: {
    position: "absolute",
    bottom: 0,
    right: 30,
    backgroundColor: "#6366F1",
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
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
  verifiedIcon: {
    marginLeft: 4,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  locationText: {
    fontSize: 13,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 10,
    marginTop: 16,
  },
  statCard: {
    width: (Dimensions.get("window").width - 52) / 2,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  statLabel: {
    fontSize: 12,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
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
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 16,
    marginTop: 24,
  },
  actionBtn: {
    flex: 1,
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

// Missing import for Dimensions
import { Dimensions } from "react-native";
