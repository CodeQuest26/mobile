import MainContainer from "@/components/MainContainer";
import Colors from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

type NotificationItem = {
  id: string;
  title: string;
  body?: string;
  time: string;
  read: boolean;
};

const initialNotifications: NotificationItem[] = [
  {
    id: "1",
    title: "New bid received",
    body: "You have a new bid on your job 'Packaging Design'",
    time: "2h",
    read: false,
  },
  {
    id: "2",
    title: "Job approved",
    body: "Your job 'Prototype' was approved",
    time: "1d",
    read: true,
  },
  {
    id: "3",
    title: "Message from client",
    body: "Can you share more details on the spec?",
    time: "3d",
    read: false,
  },
];

const Notifications = () => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme] ?? Colors.light;

  const [notifications, setNotifications] =
    useState<NotificationItem[]>(initialNotifications);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);

  const toggleRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n)),
    );
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const renderItem = ({ item }: { item: NotificationItem }) => (
    <TouchableOpacity
      onPress={() => toggleRead(item.id)}
      style={[
        styles.notificationCard,
        { backgroundColor: theme.cardBackground, borderColor: theme.border },
      ]}
    >
      <View style={styles.notificationLeft}>
        <View
          style={[
            styles.notificationIcon,
            { backgroundColor: theme.iconBackground },
          ]}
        >
          <Ionicons
            name={item.read ? "notifications" : "notifications-circle"}
            size={20}
            color={theme.icon}
          />
        </View>
      </View>
      <View style={styles.notificationBody}>
        <Text style={[styles.notificationTitle, { color: theme.text }]}>
          {item.title}
        </Text>
        {item.body ? (
          <Text
            style={[styles.notificationText, { color: theme.textSecondary }]}
          >
            {item.body}
          </Text>
        ) : null}
      </View>
      <View style={styles.notificationRight}>
        <Text style={[styles.notificationTime, { color: theme.textSecondary }]}>
          {item.time}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <MainContainer safe>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Notifications
        </Text>
        <TouchableOpacity onPress={markAllRead} style={styles.actionBtn}>
          <Text style={[styles.actionText, { color: theme.primary }]}>
            Mark all read
          </Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.listHeader}>
          <Text style={[styles.listHeaderText, { color: theme.text }]}>
            Recent
          </Text>
        </View>

        <FlatList
          data={notifications}
          keyExtractor={(it) => it.id}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          contentContainerStyle={{ paddingBottom: 48 }}
        />
      </ScrollView>
    </MainContainer>
  );
};

export default Notifications;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  actionBtn: {
    minWidth: 96,
    alignItems: "flex-end",
  },
  actionText: {
    fontSize: 13,
    fontWeight: "600",
  },
  section: {
    marginTop: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: "500",
  },
  listHeader: {
    marginTop: 8,
    marginBottom: 8,
  },
  listHeaderText: {
    fontSize: 14,
    fontWeight: "700",
  },
  notificationCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  notificationLeft: {
    width: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  notificationBody: {
    flex: 1,
    paddingHorizontal: 12,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  notificationText: {
    fontSize: 13,
    marginTop: 4,
  },
  notificationRight: {
    width: 48,
    alignItems: "flex-end",
  },
  notificationTime: {
    fontSize: 12,
    fontWeight: "500",
  },
});
