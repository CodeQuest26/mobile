import MainContainer from "@/components/MainContainer";
import Spacer from "@/components/Spacer";
import Colors from "@/constants/colors";
import { adminService } from "@/services/admin";
import { handleApiError } from "@/services/api";
import { getAvatarColor } from "@/services/avatarColor";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
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
  enabled?: boolean;
  active?: boolean;
  suspended?: boolean;
  isSuspended?: boolean;
  isVerified?: boolean;
  verified?: boolean;
  createdAt?: string;
};

type PagedUsers = {
  content: ManagedUser[];
  totalElements?: number;
  totalPages?: number;
  number?: number;
  page?: number;
};

type UsersResponse =
  | ManagedUser[]
  | PagedUsers
  | {
      data?: ManagedUser[] | PagedUsers;
      users?: ManagedUser[];
      totalPages?: number;
      totalElements?: number;
    }
  | null
  | undefined;

type FilterTab = "ALL" | "ACTIVE" | "SUSPENDED";

const getUsersPayload = (data: UsersResponse): UsersResponse => {
  if (data && !Array.isArray(data) && "data" in data) {
    return data.data;
  }
  return data;
};

const getUsersFromResponse = (data: UsersResponse): ManagedUser[] => {
  const payload = getUsersPayload(data);

  if (Array.isArray(payload)) return payload;
  if (payload && !Array.isArray(payload)) {
    if ("content" in payload && Array.isArray(payload.content)) {
      return payload.content;
    }
    if ("users" in payload && Array.isArray(payload.users)) {
      return payload.users;
    }
  }

  return [];
};

const PAGE_SIZE = 20;

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

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [filterTab, setFilterTab] = useState<FilterTab>("ALL");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const fetchUsers = useCallback(
    async (
      pageToLoad = 0,
      append = false,
      showLoader = true,
      currentFilter: FilterTab = filterTab,
    ) => {
      try {
        if (showLoader) setLoading(true);
        setError(null);

        let responseData: UsersResponse = null;

        try {
          if (currentFilter === "ACTIVE") {
            const res = await adminService.getActiveUsers({
              page: pageToLoad,
              size: PAGE_SIZE,
            });
            responseData = res.data;
          } else if (currentFilter === "SUSPENDED") {
            const res = await adminService.getSuspendedUsers({
              page: pageToLoad,
              size: PAGE_SIZE,
            });
            responseData = res.data;
          } else {
            const res = await adminService.getAllUsers({
              page: pageToLoad,
              size: PAGE_SIZE,
            });
            responseData = res.data;
          }
        } catch (err: any) {
          const fallbackRes = await adminService.getUsers({
            page: pageToLoad,
            size: PAGE_SIZE,
          });
          responseData = fallbackRes.data;
        }

        let nextUsers = getUsersFromResponse(responseData);

        if (currentFilter === "ACTIVE") {
          nextUsers = nextUsers.filter((u) => !isUserSuspended(u));
        } else if (currentFilter === "SUSPENDED") {
          nextUsers = nextUsers.filter((u) => isUserSuspended(u));
        }

        const payload = getUsersPayload(responseData);
        const nextTotalPages =
          payload && !Array.isArray(payload) && "totalPages" in payload
            ? payload.totalPages || 1
            : 1;
        const nextTotalElements =
          payload && !Array.isArray(payload) && "totalElements" in payload
            ? payload.totalElements || nextUsers.length
            : nextUsers.length;

        setUsers((current) =>
          append ? [...current, ...nextUsers] : nextUsers,
        );
        setPage(pageToLoad);
        setTotalPages(nextTotalPages);
        setTotalElements(nextTotalElements);
      } catch (err) {
        setError(handleApiError(err));
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [filterTab],
  );

  useEffect(() => {
    fetchUsers(0, false, true, filterTab);
  }, [filterTab]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void fetchUsers(0, false, false, filterTab);
  }, [fetchUsers, filterTab]);

  const onLoadMore = useCallback(() => {
    if (loading || loadingMore || page + 1 >= totalPages || search.trim()) {
      return;
    }

    setLoadingMore(true);
    void fetchUsers(page + 1, true, false, filterTab);
  }, [fetchUsers, filterTab, loading, loadingMore, page, search, totalPages]);

  const handleSelectFilter = (tab: FilterTab) => {
    if (tab === filterTab) return;
    setFilterTab(tab);
  };

  const filteredUsers = users.filter((user) => {
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
        {/* Top Content Row */}
        <View style={styles.cardHeader}>
          {/* Avatar Container with Status Dot */}
          <View style={styles.avatarWrapper}>
            <View style={[styles.avatar, { backgroundColor: avatarColor.bg }]}>
              <Text style={[styles.avatarText, { color: avatarColor.text }]}>
                {displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
          </View>

          {/* User Details */}
          <View style={styles.userInfoContainer}>
            <View style={styles.nameRow}>
              <Text
                style={[styles.userName, { color: theme.text }]}
                numberOfLines={1}
              >
                {displayName}
              </Text>
            </View>

            {/* Email / Contact Row */}
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

            {/* Meta Tags: Role & Status Pill */}
            <View style={styles.metaRow}>
              {/* Role Chip */}
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
                  {formatRole(item.role)}
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
              {totalElements || filteredUsers.length} registered users
            </Text>
          </View>
        </View>

        {/* Filter Pills */}
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

        {/* Search Bar */}
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
            onPress={() => fetchUsers(0, false, true, filterTab)}
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
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.35}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator
                size="small"
                color={theme.primary}
                style={{ marginVertical: 16 }}
              />
            ) : null
          }
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
      <Spacer style={{height:90}}/>
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
  statusDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
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
  verifiedIcon: {
    marginRight: 4,
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
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusChipText: {
    fontSize: 11.5,
    fontWeight: "700",
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  manageText: {
    fontSize: 13,
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
