import MainContainer from "@/components/MainContainer";
import Spacer from "@/components/Spacer";
import Colors from "@/constants/colors";
import { adminService } from "@/services/admin";
import { handleApiError } from "@/services/api";
import { getAvatarColor } from "@/services/avatarColor";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ListRenderItem,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

export type ManagedUser = {
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
  isActive?: boolean; 
  enabled?: boolean;
  active?: boolean;
  suspended?: boolean;
  isSuspended?: boolean;
  isVerified?: boolean;
  verified?: boolean;
  createdAt?: string;
};

type FilterTab = "ALL" | "ACTIVE" | "SUSPENDED";

export const getUserDisplayName = (user: ManagedUser) => {
  const joinedName = [user.firstName, user.lastName].filter(Boolean).join(" ");
  return (
    user.fullName || user.name || joinedName || user.username || "Unnamed User"
  );
};

export const getUserContact = (user: ManagedUser) =>
  user.email ||
  user.emailAddress ||
  user.phoneNumber ||
  user.phone ||
  "No contact provided";

export const isUserSuspended = (user: ManagedUser) => {
  if (user.suspended !== undefined) return user.suspended;
  if (user.isSuspended !== undefined) return user.isSuspended;
  if (user.status) {
    const s = user.status.toUpperCase();
    if (s === "SUSPENDED" || s === "DISABLED") return true;
    if (s === "ACTIVE" || s === "ENABLED") return false;
  }
  if (user.isActive !== undefined) return !user.isActive;
  if (user.enabled !== undefined) return !user.enabled;
  if (user.active !== undefined) return !user.active;
  return false;
};

export const isUserVerified = (user: ManagedUser) =>
  user.isVerified ?? user.verified ?? user.status === "VERIFIED";

const getRoleIcon = (role?: string) => {
  const r = role?.toUpperCase();
  if (r?.includes("ADMIN")) return "shield-checkmark-outline";
  if (r?.includes("MANUFACTURER") || r?.includes("FACTORY"))
    return "business-outline";
  return "person-outline";
};

const formatRole = (role?: string) => {
  if (!role) return "User";
  return role
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase());
};

const UserManagementScreen = () => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];

  
  const [allUsers, setAllUsers] = useState<ManagedUser[]>([]);
  const [filterTab, setFilterTab] = useState<FilterTab>("ALL");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const fetchUsers = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      setError(null);

      const { data } = await adminService.getAllUsers();
      const list: ManagedUser[] = Array.isArray(data)
        ? data
        : data?.content ?? [];

      setAllUsers(list);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);


  useFocusEffect(
    useCallback(() => {
      fetchUsers(false);
    }, []),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void fetchUsers(false);
  }, [fetchUsers]);

  const handleSelectFilter = (tab: FilterTab) => {
    if (tab === filterTab) return;
    setFilterTab(tab);
  };

  const filteredUsers = allUsers
    .filter((user) => {
      if (filterTab === "ACTIVE") return !isUserSuspended(user);
      if (filterTab === "SUSPENDED") return isUserSuspended(user);
      return true;
    })
    .filter((user) => {
      const term = search.trim().toLowerCase();
      return (
        !term ||
        getUserDisplayName(user).toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term) ||
        user.emailAddress?.toLowerCase().includes(term) ||
        user.phoneNumber?.toLowerCase().includes(term) ||
        user.phone?.toLowerCase().includes(term) ||
        user.role?.toLowerCase().includes(term)
      );
    });

  const renderUser: ListRenderItem<ManagedUser> = ({ item }) => {
    const suspended = isUserSuspended(item);
    const verified = isUserVerified(item);
    const avatarColor = getAvatarColor(item.id || item.email || "default");
    const displayName = getUserDisplayName(item);

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        style={[
          styles.card,
          {
            backgroundColor: theme.cardBackground,
            borderColor: colorScheme === "dark" ? "#2D3748" : "#E2E8F0",
          },
        ]}
        onPress={() =>
          router.push({
            pathname: "/admin/user-details/[id]" as any,
            params: { id: item.id, user: JSON.stringify(item) },
          })
        }
      >
        <View style={styles.cardHeader}>
          <View style={styles.avatarWrapper}>
            <View style={[styles.avatar, { borderWidth:1, borderColor: suspended ? theme.error: theme.primary }]}>
              <Text style={[styles.avatarText, { color: suspended ? theme.error: theme.primary }]}>
                {displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.userInfoContainer}>
            <View style={styles.nameRow}>
              <Text
                style={[styles.userName, { color: theme.text }]}
                numberOfLines={1}
              >
                {displayName}
              </Text>
            </View>

            <View style={styles.contactRow}>
              <Ionicons
                name="mail-outline"
                size={13}
                color={theme.textSecondary}
              />
              <Text
                style={[styles.userContact, { color: theme.textSecondary }]}
                numberOfLines={1}
              >
                {getUserContact(item)}
              </Text>
            </View>

            <View style={styles.metaRow}>
              <View
                style={[
                  styles.roleChip,
                  {
                    backgroundColor:
                      colorScheme === "dark" ? "#1E293B" : "#F1F5F9",
                  },
                ]}
              >
                <Ionicons
                  name={getRoleIcon(item.role) as any}
                  size={12}
                  color={theme.primary}
                />
                <Text style={[styles.roleChipText, { color: theme.text }]}>
                  {formatRole(item.role) == 'Sme Owner' ? "Enterprise" : "Manufacturer"}
                </Text>
              </View>

            
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <MainContainer safe>
      <View style={styles.headerContainer}>
        <View style={styles.topRow}>
          <View>
            <Text style={[styles.header, { color: theme.text }]}>
              User Management
            </Text>
            <Text style={[styles.countText, { color: theme.textSecondary }]}>
              {filteredUsers.length} registered users
            </Text>
          </View>
        </View>

        <View style={styles.filterContainer}>
          {(["ALL", "ACTIVE", "SUSPENDED"] as FilterTab[]).map((tab) => {
            const isActive = filterTab === tab;
            const label =
              tab === "ALL"
                ? "All Users"
                : tab === "ACTIVE"
                  ? "Active"
                  : "Suspended";
            return (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.filterPill,
                  isActive
                    ? { backgroundColor: theme.primary }
                    : {
                        backgroundColor: theme.cardBackground,
                        borderWidth: 1,
                        borderColor:
                          colorScheme === "dark" ? "#334155" : "#E2E8F0",
                      },
                ]}
                onPress={() => handleSelectFilter(tab)}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    isActive
                      ? { color: "#FFF" }
                      : { color: theme.textSecondary },
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View
          style={[
            styles.searchBarContainer,
            {
              backgroundColor: theme.cardBackground,
              borderColor: colorScheme === "dark" ? "#334155" : "#E2E8F0",
            },
          ]}
        >
          <Ionicons
            name="search-outline"
            size={18}
            color={theme.textSecondary}
          />
          <TextInput
            placeholder="Search by name, email, or role..."
            placeholderTextColor={theme.textSecondary}
            value={search}
            onChangeText={setSearch}
            style={[styles.searchBar, { color: theme.text }]}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons
                name="close-circle"
                size={18}
                color={theme.textSecondary}
              />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator
          size="small"
          color={theme.primary}
          style={{ marginTop: 50 }}
        />
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.error }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: theme.primary }]}
            onPress={() => fetchUsers(true)}
          >
            <Text style={{ color: theme.onPrimary, fontWeight: "600" }}>
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          renderItem={renderUser}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons
                name="people-outline"
                size={48}
                color={theme.textSecondary}
              />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No {filterTab.toLowerCase()} users found.
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.primary}
            />
          }
        />
      )}
      <Spacer style={{ height: 90 }} />
    </MainContainer>
  );
};

const styles = StyleSheet.create({
  headerContainer: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 12 },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  header: { fontSize: 24, fontWeight: "800", letterSpacing: -0.5 },
  countText: { fontSize: 13, marginTop: 2 },
  filterContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: "600",
  },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  searchBar: {
    flex: 1,
    fontSize: 14,
  },
  list: { paddingHorizontal: 20, paddingBottom: 24 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  cardHeader: {
    flexDirection: "row",
    padding: 16,
    alignItems: "flex-start",
  },
  avatarWrapper: {
    position: "relative",
    marginRight: 14,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontWeight: "800",
    fontSize: 20,
  },
  userInfoContainer: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: "700",
    marginRight: 6,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 10,
  },
  userContact: {
    fontSize: 12.5,
    fontWeight: "400",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  roleChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  roleChipText: {
    fontSize: 11.5,
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 60,
    gap: 12,
  },
  emptyText: { fontSize: 15 },
  errorContainer: {
    alignItems: "center",
    marginTop: 40,
    paddingHorizontal: 20,
    gap: 12,
  },
  errorText: { textAlign: "center", fontSize: 14 },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
});

export default UserManagementScreen;