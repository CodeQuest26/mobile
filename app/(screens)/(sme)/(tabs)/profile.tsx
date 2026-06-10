import MainContainer from "@/components/MainContainer";
import Spacer from "@/components/Spacer";
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
            // Handle logout logic
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
              // Handle account deletion logic
            }, 1000);
          },
        },
      ],
    );
  };

  return (
    <MainContainer>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Cover Image */}
        <View style={[styles.coverImage, { backgroundColor: theme.primary }]} />

        {/* Profile Section */}
        <View style={styles.profileSection}>
          {/* Profile Image */}
          <View
            style={[
              styles.profileImageContainer,
              {
                backgroundColor: theme.cardBackground,
                borderColor: theme.border,
              },
            ]}
          >
            <View
              style={[
                styles.profileImage,
                { backgroundColor: theme.iconBackground },
              ]}
            >
              <Ionicons name="person" size={50} color={theme.primary} />
            </View>
          </View>

          {/* User Info */}
          <Text style={[styles.userName, { color: theme.text }]}>
            Company name
          </Text>

          <View style={{ flexDirection: "row" }}>
            <Ionicons
              name="location-outline"
              size={15}
              color={theme.textSecondary}
            />
            <Text style={[{ color: theme.textSecondary, fontWeight: 600 }]}>
              location
            </Text>
          </View>
        </View>

        <View style={{ height: 15 }} />

        <View style={{ paddingHorizontal: 15 }}>
          {/* Account Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Account
            </Text>
            <Spacer style={{ height: 15 }} />

            {/* Email */}
            <View
              style={[
                styles.accountItem,
                {
                  backgroundColor: theme.cardBackground,
                },
              ]}
            >
              <View style={styles.itemContent}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: theme.iconBackground },
                  ]}
                >
                  <Ionicons name="mail" size={20} color={theme.icon} />
                </View>
                <View style={styles.textContent}>
                  <Text style={[styles.label, { color: theme.textSecondary }]}>
                    Email
                  </Text>
                  <Text style={[styles.value, { color: theme.text }]}>
                    user@example.com
                  </Text>
                </View>
              </View>
            </View>

            <Spacer style={{ height: 15 }} />

            {/* Phone */}
            <View
              style={[
                styles.accountItem,
                {
                  backgroundColor: theme.cardBackground,
                  borderColor: theme.border,
                },
              ]}
            >
              <View style={styles.itemContent}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: theme.iconBackground },
                  ]}
                >
                  <Ionicons name="call" size={20} color={theme.icon} />
                </View>
                <View style={styles.textContent}>
                  <Text style={[styles.label, { color: theme.textSecondary }]}>
                    Phone
                  </Text>
                  <Text style={[styles.value, { color: theme.text }]}>
                    +1 (555) 123-4567
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <Spacer style={{ height: 25 }} />

          {/* Preferences Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Preferences
            </Text>
            <View style={{ height: 10 }} />

            {/* Theme Toggle */}
            <View
              style={[
                styles.preferenceItem,
                {
                  backgroundColor: theme.cardBackground,
                },
              ]}
            >
              <View style={styles.itemContent}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: theme.iconBackground },
                  ]}
                >
                  <Ionicons
                    name={isDarkMode ? "moon" : "sunny"}
                    size={20}
                    color={theme.icon}
                  />
                </View>
                <View style={styles.textContent}>
                  <Text style={[styles.label, { color: theme.textSecondary }]}>
                    Dark Mode
                  </Text>
                  <Text style={[styles.value, { color: theme.text }]}>
                    {isDarkMode ? "Enabled" : "Disabled"}
                  </Text>
                </View>
              </View>

              <Switch
                value={isDarkMode}
                onValueChange={setIsDarkMode}
                trackColor={{ false: "#E0E0E0", true: theme.primary }}
                thumbColor={isDarkMode ? theme.onPrimary : "#F0F0F0"}
              />
            </View>

            <Spacer style={{ height: 15 }} />

            {/* Notifications Toggle */}
            <View
              style={[
                styles.preferenceItem,
                {
                  backgroundColor: theme.cardBackground,
                },
              ]}
            >
              <View style={styles.itemContent}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: theme.iconBackground },
                  ]}
                >
                  <Ionicons
                    name={
                      notificationsEnabled
                        ? "notifications"
                        : "notifications-off"
                    }
                    size={20}
                    color={theme.icon}
                  />
                </View>
                <View style={styles.textContent}>
                  <Text style={[styles.label, { color: theme.textSecondary }]}>
                    Notifications
                  </Text>
                  <Text style={[styles.value, { color: theme.text }]}>
                    {notificationsEnabled ? "Enabled" : "Disabled"}
                  </Text>
                </View>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: "#E0E0E0", true: theme.primary }}
                thumbColor={notificationsEnabled ? theme.onPrimary : "#F0F0F0"}
              />
            </View>

            <Spacer style={{ height: 15 }} />

            {/* Reset Password */}
            <TouchableOpacity
              disabled={isLoading}
              onPress={handleResetPassword}
              style={[
                styles.accountItem,
                {
                  backgroundColor: theme.cardBackground,
                  borderColor: theme.border,
                },
              ]}
            >
              <View style={styles.itemContent}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: theme.iconBackground },
                  ]}
                >
                  <Ionicons name="key" size={20} color={theme.icon} />
                </View>
                <View style={styles.textContent}>
                  <Text style={[styles.label, { color: theme.textSecondary }]}>
                    Reset Password
                  </Text>
                  <Text style={[styles.value, { color: theme.text }]}>
                    Change your password
                  </Text>
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={theme.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <Spacer style={{ height: 25 }} />

          {/* Account Actions Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Account Actions
            </Text>
            <Spacer style={{ height: 10 }} />

            {/* Logout Button */}
            <TouchableOpacity
              disabled={isLoading}
              onPress={handleLogout}
              style={[
                styles.actionButton,
                {
                  backgroundColor: theme.cardBackground,
                  borderColor: theme.primary,
                  opacity: isLoading ? 0.7 : 1,
                },
              ]}
            >
              {isLoading ? (
                <ActivityIndicator color={theme.primary} />
              ) : (
                <>
                  <Ionicons name="log-out" size={20} color={theme.primary} />
                  <Text
                    style={[styles.actionButtonText, { color: theme.primary }]}
                  >
                    Log Out
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <Spacer style={{ height: 15 }} />

            {/* Delete Account Button */}
            <TouchableOpacity
              disabled={isLoading}
              onPress={handleDeleteAccount}
              style={[
                styles.actionButton,
                {
                  // backgroundColor: theme.error,
                  borderColor: theme.error,
                  opacity: isLoading ? 0.7 : 1,
                },
              ]}
            >
              {isLoading ? (
                <ActivityIndicator color={theme.error} />
              ) : (
                <>
                  <Ionicons name="trash" size={20} color={theme.error} />
                  <Text
                    style={[styles.actionButtonText, { color: theme.error }]}
                  >
                    Delete Account
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <Spacer style={{ height: 100 }} />
        </View>
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
    // paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 32,
  },
  coverImage: {
    height: 200,
    width: "100%",
  },
  profileSection: {
    alignItems: "center",
    marginTop: -50,
    marginBottom: 24,
  },
  profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    padding: 3,
    borderWidth: 3,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  profileImage: {
    width: "100%",
    height: "100%",
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  userName: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    fontWeight: "500",
  },
  header: {
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
  },
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  accountItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
  },
  preferenceItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
  },
  itemContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  textContent: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 4,
  },
  value: {
    fontSize: 15,
    fontWeight: "500",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
