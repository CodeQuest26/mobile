import MainContainer from "@/components/MainContainer";
import Colors from "@/constants/colors";
import { api } from "@/services/api";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";

const UserManagementScreen = () => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  const fetchUsers = async () => {
    try {
      setError(null);
      const { data } = await api.get("/admin/users");
      setUsers(data);
      console.log(users);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUsers();
  }, []);

  const renderUser = ({ item }: { item: any }) => (
    <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
      <View style={styles.row}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.fullName?.charAt(0) || "U"}
          </Text>
        </View>
        <View style={styles.info}>
          <Text style={[styles.name, { color: theme.text }]}>
            {item.fullName}
          </Text>
          <Text style={[styles.email, { color: theme.textSecondary }]}>
            {item.phoneNumber}
          </Text>
        </View>
        <View
          style={[
            styles.badge,
            { backgroundColor: item.isVerified ? "#D4EDDA" : "#F8D7DA" },
          ]}
        >
          <Text
            style={{
              color: item.isVerified ? "#155724" : "#721C24",
              fontSize: 10,
              fontWeight: "bold",
            }}
          >
            {item.isVerified ? "Verified" : "Pending"}
          </Text>
        </View>
      </View>

      <Pressable
        style={styles.manageButton}
        onPress={() => router.push(`/admin/user-details/${item.id}`)}
      >
        <Text style={styles.manageText}>Manage Account</Text>
      </Pressable>
    </View>
  );

  return (
    <MainContainer safe>
      <View style={styles.headerContainer}>
        <Text style={[styles.header, { color: theme.text }]}>
          User Management
        </Text>
        <TextInput
          placeholder="Search by name or phone..."
          placeholderTextColor={theme.textSecondary}
          value={search}
          onChangeText={setSearch}
          style={[
            styles.searchBar,
            { backgroundColor: theme.cardBackground, color: theme.text },
          ]}
        />
      </View>

      {loading ? (
        <ActivityIndicator
          size="small"
          color={theme.icon}
          style={{ marginTop: 50 }}
        />
      ) : error ? (
        <Text style={{ color: "red", textAlign: "center", marginTop: 20 }}>
          {error}
        </Text>
      ) : (
        <FlatList
          data={users.filter((u) =>
            u.fullName?.toLowerCase().includes(search.toLowerCase()),
          )}
          keyExtractor={(item) => item.id}
          renderItem={renderUser}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.text}
            />
          }
        />
      )}
    </MainContainer>
  );
};

const styles = StyleSheet.create({
  headerContainer: { padding: 20 },
  header: { fontSize: 24, fontWeight: "bold", marginBottom: 15 },
  searchBar: {
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  list: { paddingHorizontal: 20, paddingBottom: 20 },
  card: { padding: 15, borderRadius: 12, marginBottom: 12, elevation: 2 },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 15 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#4A90E2",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: { color: "#FFF", fontWeight: "bold" },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: "600" },
  email: { fontSize: 12 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  manageButton: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#4A90E2",
    alignItems: "center",
  },
  manageText: { color: "#4A90E2", fontWeight: "600" },
});

export default UserManagementScreen;
