import MainContainer from "@/components/MainContainer";
import Colors from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

const Profile = () => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"] ?? Colors.light;

  const [isDarkMode, setIsDarkMode] = useState(colorScheme === "dark");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleResetPassword = () => {
    Alert.alert(
      "Reset Password",
      "A password reset link will be sent to your email",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send",
          onPress: () => {
            setIsLoading(true);
            setTimeout(() => {
              setIsLoading(false);
              Alert.alert("Success", "Password reset link sent to your email");
            }, 1000);
          },
        },
      ],
    );
  };

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: () => {
          setIsLoading(true);
          setTimeout(() => {
            setIsLoading(false);
          }, 1000);
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This action cannot be undone. All your data will be permanently deleted.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setIsLoading(true);
            setTimeout(() => {
              setIsLoading(false);
            }, 1000);
          },
        },
      ],
    );
  };

  return (
    <MainContainer safe>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Identity Band */}
        <View
          style={[styles.identityBand, { borderBottomColor: theme.border }]}
        >
          {/* Monogram Avatar */}
          <View
            style={[styles.monogram, { backgroundColor: theme.iconBackground }]}
          >
            <Text style={[styles.monogramText, { color: theme.primary }]}>
              CN
            </Text>
          </View>

          {/* Company Info */}
          <View style={styles.identityText}>
            <Text style={[styles.companyName, { color: theme.text }]}>
              Company Name
            </Text>
            <View style={styles.locationRow}>
              <Ionicons
                name="location-outline"
                size={12}
                color={theme.textSecondary}
              />
              <Text
                style={[styles.locationText, { color: theme.textSecondary }]}
              >
                Location
              </Text>
            </View>
          </View>

          {/* Edit Button */}
          <TouchableOpacity
            style={[styles.editBtn, { borderColor: theme.border }]}
          >
            <Ionicons
              name="pencil-outline"
              size={13}
              color={theme.textSecondary}
            />
            <Text style={[styles.editBtnText, { color: theme.textSecondary }]}>
              Edit
            </Text>
          </TouchableOpacity>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
            Account
          </Text>

          <View
            style={[
              styles.sectionCard,
              { backgroundColor: theme.cardBackground },
            ]}
          >
            {/* Email */}
            <View style={styles.row}>
              <View
                style={[
                  styles.rowIcon,
                  { backgroundColor: theme.iconBackground },
                ]}
              >
                <Ionicons name="mail" size={16} color={theme.icon} />
              </View>
              <View style={styles.rowBody}>
                <Text style={[styles.rowLabel, { color: theme.textSecondary }]}>
                  Email
                </Text>
                <Text style={[styles.rowValue, { color: theme.text }]}>
                  user@example.com
                </Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            {/* Phone */}
            <View style={styles.row}>
              <View
                style={[
                  styles.rowIcon,
                  { backgroundColor: theme.iconBackground },
                ]}
              >
                <Ionicons name="call" size={16} color={theme.icon} />
              </View>
              <View style={styles.rowBody}>
                <Text style={[styles.rowLabel, { color: theme.textSecondary }]}>
                  Phone
                </Text>
                <Text style={[styles.rowValue, { color: theme.text }]}>
                  +233 55 123 4567
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
            Preferences
          </Text>

          <View
            style={[
              styles.sectionCard,
              { backgroundColor: theme.cardBackground },
            ]}
          >
            {/* Dark Mode */}
            {/* <View style={styles.row}>
              <View
                style={[
                  styles.rowIcon,
                  { backgroundColor: theme.iconBackground },
                ]}
              >
                <Ionicons
                  name={isDarkMode ? "moon" : "sunny"}
                  size={16}
                  color={theme.icon}
                />
              </View>

              <View style={styles.rowBody}>
                <Text style={[styles.rowLabel, { color: theme.textSecondary }]}>
                  Appearance
                </Text>
                <Text style={[styles.rowValue, { color: theme.text }]}>
                  Dark mode
                </Text>
              </View>

              <Switch
                value={isDarkMode}
                onValueChange={setIsDarkMode}
                trackColor={{ false: "#E0E0E0", true: theme.primary }}
                thumbColor={isDarkMode ? theme.onPrimary : "#F0F0F0"}
              />
            </View> */}

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            {/* Notifications */}
            <View style={styles.row}>
              <View
                style={[
                  styles.rowIcon,
                  { backgroundColor: theme.iconBackground },
                ]}
              >
                <Ionicons
                  name={
                    notificationsEnabled ? "notifications" : "notifications-off"
                  }
                  size={16}
                  color={theme.icon}
                />
              </View>
              <View style={styles.rowBody}>
                <Text style={[styles.rowLabel, { color: theme.textSecondary }]}>
                  Notifications
                </Text>
                <Text style={[styles.rowValue, { color: theme.text }]}>
                  {notificationsEnabled ? "Push & email" : "Disabled"}
                </Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: "#E0E0E0", true: theme.primary }}
                thumbColor={notificationsEnabled ? theme.onPrimary : "#F0F0F0"}
              />
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            {/* Reset Password */}
            <TouchableOpacity
              disabled={isLoading}
              onPress={handleResetPassword}
              style={styles.row}
            >
              <View
                style={[
                  styles.rowIcon,
                  { backgroundColor: theme.iconBackground },
                ]}
              >
                <Ionicons name="key" size={16} color={theme.icon} />
              </View>
              <View style={styles.rowBody}>
                <Text style={[styles.rowLabel, { color: theme.textSecondary }]}>
                  Security
                </Text>
                <Text style={[styles.rowValue, { color: theme.text }]}>
                  Reset password
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={theme.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Account Actions Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
            Account actions
          </Text>

          <View
            style={[
              styles.sectionCard,
              { backgroundColor: theme.cardBackground },
            ]}
          >
            {/* Log Out */}
            <TouchableOpacity
              disabled={isLoading}
              onPress={handleLogout}
              style={[styles.row, { opacity: isLoading ? 0.6 : 1 }]}
            >
              {isLoading ? (
                <ActivityIndicator
                  color={theme.primary}
                  style={styles.actionLoader}
                />
              ) : (
                <>
                  <View
                    style={[
                      styles.rowIcon,
                      { backgroundColor: theme.iconBackground },
                    ]}
                  >
                    <Ionicons name="log-out" size={16} color={theme.primary} />
                  </View>
                  <View style={styles.rowBody}>
                    <Text style={[styles.rowValue, { color: theme.primary }]}>
                      Log out
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={theme.textSecondary}
                  />
                </>
              )}
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            {/* Delete Account */}
            <TouchableOpacity
              disabled={isLoading}
              onPress={handleDeleteAccount}
              style={[styles.row, { opacity: isLoading ? 0.6 : 1 }]}
            >
              {isLoading ? (
                <ActivityIndicator
                  color={theme.error}
                  style={styles.actionLoader}
                />
              ) : (
                <>
                  <View
                    style={[
                      styles.rowIcon,
                      { backgroundColor: theme.iconBackground },
                    ]}
                  >
                    <Ionicons name="trash" size={16} color={theme.error} />
                  </View>
                  <View style={styles.rowBody}>
                    <Text style={[styles.rowValue, { color: theme.error }]}>
                      Delete account
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={theme.textSecondary}
                  />
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </MainContainer>
  );
};

export default Profile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },

  /* Identity band */
  identityBand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  monogram: {
    width: 54,
    height: 54,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  monogramText: {
    fontSize: 20,
    fontWeight: "600",
  },
  identityText: {
    flex: 1,
    minWidth: 0,
  },
  companyName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 3,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  locationText: {
    fontSize: 12,
    fontWeight: "500",
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    flexShrink: 0,
  },
  editBtnText: {
    fontSize: 13,
    fontWeight: "500",
  },

  /* Sections */
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.7,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  sectionCard: {
    borderRadius: 12,
    overflow: "hidden",
  },

  /* Rows */
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
  },
  rowLabel: {
    fontSize: 11,
    fontWeight: "500",
    marginBottom: 1,
  },
  rowValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 58,
  },
  actionLoader: {
    flex: 1,
    paddingVertical: 4,
  },
});
