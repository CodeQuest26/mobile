import MainContainer from "@/components/MainContainer";
import Colors from "@/constants/colors";
import { adminService } from "@/services/admin";
import { api, handleApiError } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

type UserDetail = {
  id: string;
  fullName?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
  emailAddress?: string;
  phoneNumber?: string;
  phone?: string;
  role?: string;
  status?: string;
  enabled?: boolean;
  active?: boolean;
  suspended?: boolean;
  isSuspended?: boolean;
  isVerified?: boolean;
  verified?: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
};

const formatDate = (value?: string) =>
  value
    ? new Date(value).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "N/A";

const getDisplayName = (user: UserDetail) =>
  user.fullName ||
  user.name ||
  [user.firstName, user.lastName].filter(Boolean).join(" ") ||
  user.username ||
  "Unnamed User";

const getContact = (user: UserDetail) =>
  user.email ||
  user.emailAddress ||
  user.phoneNumber ||
  user.phone ||
  "No contact provided";

const isUserSuspended = (user: UserDetail) => {
  if (user.suspended !== undefined) return user.suspended;
  if (user.isSuspended !== undefined) return user.isSuspended;
  if (user.status) {
    const s = user.status.toUpperCase();
    if (s === "SUSPENDED" || s === "DISABLED") return true;
    if (s === "ACTIVE" || s === "ENABLED") return false;
  }
  if (user.enabled !== undefined) return !user.enabled;
  if (user.active !== undefined) return !user.active;
  return false;
};

const isUserVerified = (user: UserDetail) =>
  user.isVerified ?? user.verified ?? user.status === "VERIFIED";

const formatRole = (role?: string) =>
  role?.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) || "N/A";

const formatStatus = (status?: string, suspended?: boolean) => {
  if (suspended) return "Suspended";
  return (
    status?.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) ||
    "Active"
  );
};

const UserDetailScreen = () => {
  const router = useRouter();
  const theme = Colors[useColorScheme() ?? "light"];
  const params = useLocalSearchParams<{ id: string; user?: string }>();

  const [user, setUser] = useState<UserDetail | null>(() => {
    if (!params.user) return null;
    try {
      return JSON.parse(params.user);
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(!user);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const fetchUser = async () => {
    if (!params.id) return;

    if (!user) setLoading(true);
    setError(null);
    try {
      const { data } = await adminService.getUserDetails(params.id);
      setUser(data);
    } catch (err) {
      if (!user) setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [params.id]);

  /* ================= SUSPEND USER ACTION ================= */
  const handleSuspend = async () => {
    if (!user || updating) return;

    Alert.alert(
      "Suspend User",
      `Are you sure you want to suspend ${getDisplayName(user)}? They will not be able to access their account until unsuspended.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Suspend",
          style: "destructive",
          onPress: async () => {
            setUpdating(true);
            try {
              const targetId =
                user.id ||
                (user as any).userId ||
                (user as any)._id ||
                params.id;
              await adminService.suspendUser(targetId);
              setUser((prev) =>
                prev
                  ? {
                      ...prev,
                      suspended: true,
                      isSuspended: true,
                      enabled: false,
                      active: false,
                      status: "SUSPENDED",
                    }
                  : null,
              );

              Alert.alert("Success", "User suspended successfully.");
            } catch (err) {
              Alert.alert("Action Failed", handleApiError(err));
            } finally {
              setUpdating(false);
            }
          },
        },
      ],
    );
  };

  /* ================= UNSUSPEND USER ACTION ================= */
  const handleUnsuspend = async () => {
    if (!user || updating) return;

    Alert.alert(
      "Unsuspend User",
      `Are you sure you want to unsuspend ${getDisplayName(user)}? Their account access will be restored.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unsuspend",
          onPress: async () => {
            setUpdating(true);
            try {
              const targetId =
                user.id ||
                (user as any).userId ||
                (user as any)._id ||
                params.id;
              await adminService.unsuspendUser(targetId);
              setUser((prev) =>
                prev
                  ? {
                      ...prev,
                      suspended: false,
                      isSuspended: false,
                      enabled: true,
                      active: true,
                      status: "ACTIVE",
                    }
                  : null,
              );
              Alert.alert("Success", "User unsuspended successfully.");
            } catch (err) {
              Alert.alert("Action Failed", handleApiError(err));
            } finally {
              setUpdating(false);
            }
          },
        },
      ],
    );
  };

  /* ================= ROLE UPDATE ACTION ================= */
  const handleUpdateRole = async (newRole: string) => {
    if (!user || updating) return;

    setUpdating(true);
    try {
      await api.patch(`admin/users/${user.id}/role`, { role: newRole });
      setUser((prev) => (prev ? { ...prev, role: newRole } : null));
      Alert.alert("Success", `User role updated to ${formatRole(newRole)}.`);
    } catch (err) {
      Alert.alert("Action Failed", handleApiError(err));
    } finally {
      setUpdating(false);
    }
  };

  /* ================= DELETE USER ACTION ================= */
  const handleDeleteUser = async () => {
    if (!user) return;

    Alert.alert(
      "Delete User",
      `Are you sure you want to permanently delete ${getDisplayName(user)}? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setUpdating(true);
            try {
              await api.delete(`admin/users/${user.id}`);
              Alert.alert("Success", "User deleted successfully.", [
                { text: "OK", onPress: () => router.back() },
              ]);
            } catch (err) {
              Alert.alert("Action Failed", handleApiError(err));
            } finally {
              setUpdating(false);
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <MainContainer safe>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="small" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading user details...
          </Text>
        </View>
      </MainContainer>
    );
  }

  if (error || !user) {
    return (
      <MainContainer safe>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={20} color={theme.primary} />
          <Text style={[styles.backText, { color: theme.primary }]}>Back</Text>
        </TouchableOpacity>
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={theme.error} />
          <Text style={[styles.error, { color: theme.error }]}>
            {error || "User not found."}
          </Text>
        </View>
      </MainContainer>
    );
  }

  const suspended = isUserSuspended(user);
  const verified = isUserVerified(user);

  return (
    <MainContainer safe>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={20} color={theme.icon} />
          <Text style={[styles.backText, { color: theme.textSecondary }]}>
            Back
          </Text>
        </TouchableOpacity>

        {/* User Header Profile Card */}
        <View
          style={[styles.headerCard, { backgroundColor: theme.cardBackground }]}
        >
          <View style={styles.avatarContainer}>
            <View
              style={[
                styles.avatar,
                {
                  backgroundColor: suspended
                    ? theme.error
                    : theme.primary + "CC",
                },
              ]}
            >
              <Text style={styles.avatarText}>
                {getDisplayName(user).charAt(0).toUpperCase()}
              </Text>
            </View>
          </View>

          <Text style={[styles.name, { color: theme.text }]}>
            {getDisplayName(user)}
          </Text>

          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: theme.iconBackground },
              ]}
            >
              <Text
                style={{
                  color: theme.textSecondary,
                  fontSize: 12,
                  fontWeight: "600",
                }}
              >
                {formatRole(user.role)}
              </Text>
            </View>
          </View>
        </View>

        {/* Management Action Buttons Section */}
        <View
          style={[styles.section, { backgroundColor: theme.cardBackground }]}
        >
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            MANAGEMENT ACTIONS
          </Text>

          {suspended ? (
            <TouchableOpacity
              style={[
                styles.actionBtn,
                styles.unsuspendBtn,
                updating && styles.disabledBtn,
                { borderColor: theme.primary },
              ]}
              onPress={handleUnsuspend}
              disabled={updating}
              activeOpacity={0.8}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color={theme.primary}
              />
              <Text
                style={[
                  styles.actionBtnTextTextWhite,
                  { color: theme.primary },
                ]}
              >
                {updating ? (
                  <ActivityIndicator size={"small"} color={theme.onPrimary} />
                ) : (
                  "Unsuspend User"
                )}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.actionBtn,
                styles.suspendBtn,
                updating && styles.disabledBtn,
                {
                  borderColor: theme.textSecondary,
                },
              ]}
              onPress={handleSuspend}
              disabled={updating}
              activeOpacity={0.8}
            >
              <Ionicons
                name="ban-outline"
                size={20}
                color={theme.textSecondary}
              />
              <Text
                style={[
                  styles.actionBtnTextTextWhite,
                  { color: theme.textSecondary },
                ]}
              >
                {updating ? (
                  <ActivityIndicator
                    size={"small"}
                    color={theme.textSecondary}
                  />
                ) : (
                  "Suspend User"
                )}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionBtn, styles.dangerBtn]}
            onPress={handleDeleteUser}
            disabled={updating}
          >
            <Ionicons name="trash-outline" size={20} color={theme.error} />
            <Text style={[styles.actionBtnText, { color: theme.error }]}>
              Delete User Account
            </Text>
          </TouchableOpacity>
        </View>

        {/* Contact Information Section */}
        <View
          style={[styles.section, { backgroundColor: theme.cardBackground }]}
        >
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            CONTACT INFORMATION
          </Text>

          {(user.phoneNumber || user.phone) && (
            <View style={styles.detailRow}>
              <Text
                style={[styles.detailLabel, { color: theme.textSecondary }]}
              >
                Phone Number
              </Text>
              <Text style={[styles.detailValue, { color: theme.text }]}>
                {user.phoneNumber || user.phone}
              </Text>
            </View>
          )}
        </View>

        {/* Account Details Section */}
        <View
          style={[styles.section, { backgroundColor: theme.cardBackground }]}
        >
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            ACCOUNT DETAILS
          </Text>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
              User ID
            </Text>
            <Text
              style={[styles.detailValue, { color: theme.text, fontSize: 12 }]}
              numberOfLines={1}
            >
              {user.id}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
              Role
            </Text>
            <Text style={[styles.detailValue, { color: theme.text }]}>
              {formatRole(user.role)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
              Status
            </Text>
            <Text style={[styles.detailValue, { color: theme.text }]}>
              {formatStatus(user.status, suspended)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
              Verification
            </Text>
            <Text style={[styles.detailValue, { color: theme.text }]}>
              {verified ? "Verified" : "Unverified"}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
              Joined Date
            </Text>
            <Text style={[styles.detailValue, { color: theme.text }]}>
              {formatDate(user.createdAt)}
            </Text>
          </View>
          {(user.updatedAt || user.lastLoginAt) && (
            <View style={styles.detailRow}>
              <Text
                style={[styles.detailLabel, { color: theme.textSecondary }]}
              >
                Last Updated
              </Text>
              <Text style={[styles.detailValue, { color: theme.text }]}>
                {formatDate(user.updatedAt || user.lastLoginAt)}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </MainContainer>
  );
};

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 40 },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    gap: 12,
  },
  loadingText: { fontSize: 14 },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 16,
  },
  backText: { fontSize: 16, fontWeight: "600" },
  headerCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  avatarContainer: { alignItems: "center", marginBottom: 12 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { color: "#FFF", fontSize: 32, fontWeight: "bold" },
  verificationBadge: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  name: { fontSize: 22, fontWeight: "700", marginBottom: 2 },
  username: { fontSize: 14, marginBottom: 12 },
  statusRow: { flexDirection: "row", gap: 8 },
  statusBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  section: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 16,
    letterSpacing: 0.8,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  detailLabel: { fontSize: 13, fontWeight: "500" },
  detailValue: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "right",
    flex: 1,
    marginLeft: 16,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  suspendBtn: {
    borderWidth: 1,
  },
  unsuspendBtn: {
    borderWidth: 1,
  },
  roleBtn: {
    borderWidth: 1,
    backgroundColor: "transparent",
  },
  dangerBtn: {
    borderWidth: 1,
    borderColor: "#DC3545",
    backgroundColor: "transparent",
    marginBottom: 0,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  actionBtnTextTextWhite: {
    fontSize: 15,
    fontWeight: "600",
  },
  actionBtnText: {
    fontSize: 15,
    fontWeight: "600",
  },
  error: { textAlign: "center", fontSize: 16 },
});

export default UserDetailScreen;
