import MainContainer from "@/components/MainContainer";
import Colors from "@/constants/colors";
import { useAuthStore } from "@/store/auth";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    useColorScheme,
    View,
} from "react-native";

const AdminProfileScreen = () => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to end your admin session?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log Out", style: "destructive", onPress: () => logout() },
    ]);
  };

  return (
    <MainContainer safe>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header Avatar Section */}
        <View style={styles.headerSection}>
          <View
            style={[styles.avatar, { backgroundColor: theme.cardBackground }]}
          >
            <Ionicons name="person" size={40} color={theme.text} />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>
            {user?.fullName || "Admin"}
          </Text>
          <Text style={{ color: theme.textSecondary }}>
            System Administrator
          </Text>
        </View>

        {/* Profile Info Cards */}
        <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
          <ProfileRow
            icon="mail"
            label="Email"
            value={"admin@repairnear.com"}
            theme={theme}
          />
          <View style={styles.divider} />
          <ProfileRow
            icon="shield-checkmark"
            label="Role"
            value={user?.role || "ADMIN"}
            theme={theme}
          />
          <View style={styles.divider} />
          <ProfileRow
            icon="calendar"
            label="Member Since"
            value="July 2026"
            theme={theme}
          />
        </View>

        {/* Footer Actions */}
        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={theme.error} />
          <Text style={styles.logoutText}>Log Out</Text>
        </Pressable>

        <Text style={[styles.version, { color: theme.textSecondary }]}>
          App Version 1.0.0
        </Text>
      </ScrollView>
    </MainContainer>
  );
};

const ProfileRow = ({ icon, label, value, theme }: any) => (
  <View style={styles.row}>
    <Ionicons
      name={icon}
      size={20}
      color={theme.textSecondary}
      style={styles.icon}
    />
    <View>
      <Text style={[styles.label, { color: theme.textSecondary }]}>
        {label}
      </Text>
      <Text style={[styles.value, { color: theme.text }]}>{value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { padding: 20 },
  headerSection: { alignItems: "center", marginVertical: 30 },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  title: { fontSize: 24, fontWeight: "bold" },
  card: { padding: 20, borderRadius: 20 },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
  icon: { marginRight: 15 },
  label: { fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 },
  value: { fontSize: 16, fontWeight: "600", marginTop: 2 },
  divider: {
    height: 1,
    backgroundColor: "#CCC",
    marginVertical: 10,
    opacity: 0.2,
  },
  logoutButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 40,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FF4D4D",
  },
  logoutText: {
    color: "#FF4D4D",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 10,
  },
  version: { textAlign: "center", marginTop: 30, fontSize: 12 },
});

export default AdminProfileScreen;
