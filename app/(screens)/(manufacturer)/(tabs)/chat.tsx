import MainContainer from "@/components/MainContainer";
import Colors from "@/constants/colors";
import { api } from "@/services/api";
import { getAvatarColor } from "@/services/avatarColor";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";

interface Order {
  id: string;
  jobId: string;
  smeId: string;
  smeName: string;
  factoryId: string;
  factoryName: string;
  agreedAmountGhs: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface Message {
  id: string;
  orderId: string;
  senderId: string;
  senderName: string;
  content: string;
  attachmentUrl?: string;
  isRead: boolean;
  createdAt: string;
}

interface Contact {
  id: string;
  name: string;
  initials: string;
  online: boolean;
}

interface LastMessagePreview {
  content: string;
  createdAt: string;
  senderName: string;
}

const formatTime = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 60000;
  if (diff < 1) return "Now";
  if (diff < 60) return `${Math.floor(diff)}m`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h`;
  if (diff < 10080) return `${Math.floor(diff / 1440)}d`;
  return d.toLocaleDateString();
};

const ContactRow = ({
  contact,
  lastMessage,
  unreadCount,
  onPress,
  theme,
}: {
  contact: Contact;
  lastMessage?: LastMessagePreview;
  unreadCount: number;
  onPress: () => void;
  theme: typeof Colors.light;
}) => {
  const c = getAvatarColor(contact.id);
  const preview = lastMessage
    ? lastMessage.senderName === "You"
      ? `You: ${lastMessage.content}`
      : lastMessage.content
    : "No messages yet";
  const time = lastMessage ? formatTime(lastMessage.createdAt) : "";

  return (
    <Pressable
      style={({ pressed }) => [
        styles.contactRow,
        { backgroundColor: pressed ? theme.iconBackground : "transparent" },
      ]}
      onPress={onPress}
    >
      <View style={styles.avatarWrap}>
        <View style={[styles.avatar, { backgroundColor: c.bg }]}>
          <Text style={[styles.avatarText, { color: c.text }]}>
            {contact.initials}
          </Text>
        </View>
        {contact.online && (
          <View style={[styles.onlineDot, { borderColor: theme.background }]} />
        )}
      </View>

      <View style={styles.contactMeta}>
        <View style={styles.contactTopRow}>
          <Text style={[styles.contactName, { color: theme.text }]}>
            {contact.name}
          </Text>
          <Text style={[styles.contactTime, { color: theme.textSecondary }]}>
            {time}
          </Text>
        </View>
        <View style={styles.contactBottomRow}>
          <Text
            numberOfLines={1}
            style={[
              styles.contactPreview,
              unreadCount > 0 && { fontWeight: "500" },
              { color: theme.text },
            ]}
          >
            {preview}
          </Text>
          {unreadCount > 0 && (
            <View style={[styles.badge, { backgroundColor: theme.primary }]}>
              <Text style={[styles.badgeText, { color: theme.onPrimary }]}>
                {unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
};

const Chat = () => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"] || Colors.light;

  const [search, setSearch] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [lastMessages, setLastMessages] = useState<
    Record<string, LastMessagePreview>
  >({});
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        const userRes = await api.get("users/me");
        const currentUserIdFromApi = userRes.data.id;
        setCurrentUserId(currentUserIdFromApi);

        const ordersRes = await api.get("orders", {
          params: { page: 0, size: 100 },
        });
        const allOrders: Order[] = ordersRes.data.content || [];
        setOrders(allOrders);

        type FactoryGroup = {
          factoryId: string;
          factoryName: string;
          orders: Order[];
        };

        const factoryMap = new Map<string, FactoryGroup>();

        allOrders.forEach((order) => {
          if (!factoryMap.has(order.factoryId)) {
            factoryMap.set(order.factoryId, {
              factoryId: order.factoryId,
              factoryName: order.factoryName || "Unknown Manufacturer",
              orders: [],
            });
          }
          factoryMap.get(order.factoryId)!.orders.push(order);
        });

        const lastMsgMap: Record<string, LastMessagePreview> = {};
        const unreadMap: Record<string, number> = {};

        // Aggregate across ALL orders per factory, not just the latest —
        // matches ChatRoom's behavior. Previously this only looked at the
        // single most recent order, so an unread message on an older order
        // with the same factory would silently never show up here even
        // though ChatRoom would surface it once opened.
        await Promise.all(
          Array.from(factoryMap.entries()).map(async ([factoryId, group]) => {
            const results = await Promise.all(
              group.orders.map(async (order) => {
                try {
                  const msgsRes = await api.get<{ content: Message[] }>(
                    `messages/orders/${order.id}`,
                    { params: { page: 0, size: 100 } },
                  );
                  return msgsRes.data.content || [];
                } catch (msgErr) {
                  console.warn(
                    `Failed to fetch messages for order ${order.id}`,
                    msgErr,
                  );
                  return [] as Message[];
                }
              }),
            );

            const allMsgs = results.flat();
            if (allMsgs.length === 0) return;

            const sortedMessages = [...allMsgs].sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime(),
            );
            const last = sortedMessages[0];

            lastMsgMap[factoryId] = {
              content: last.content,
              createdAt: last.createdAt,
              senderName:
                last.senderId === currentUserIdFromApi
                  ? "You"
                  : last.senderName || "",
            };

            unreadMap[factoryId] = allMsgs.filter(
              (m) => !m.isRead && m.senderId !== currentUserIdFromApi,
            ).length;
          }),
        );

        setLastMessages(lastMsgMap);
        setUnreadCounts(unreadMap);
      } catch (error) {
        console.error("Error loading conversations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, []);

  const contacts = useMemo(() => {
    const map = new Map<string, Contact>();
    orders.forEach((order) => {
      if (!map.has(order.factoryId)) {
        const name = order.factoryName || "Unknown Manufacturer";
        const parts = name.split(" ");
        const initials =
          parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : name.slice(0, 2);
        map.set(order.factoryId, {
          id: order.factoryId,
          name,
          initials: initials.toUpperCase(),
          online: false,
        });
      }
    });
    return Array.from(map.values());
  }, [orders]);

  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  const handleContactPress = (contact: Contact) => {
    router.push({
      pathname: "../../ChatRoom",
      params: {
        userType: "sme",
        contactId: contact.id,
        contactName: contact.name,
        contactInitials: contact.initials,
        contactOnline: contact.online ? "1" : "0",
      },
    });
  };

  return (
    <MainContainer safe>
      <Text style={[styles.header, { color: theme.text }]}>Messages</Text>

      <View
        style={[
          styles.searchBar,
          { backgroundColor: theme.cardBackground, borderColor: theme.border },
        ]}
      >
        <Ionicons name="search-outline" size={17} color={theme.textSecondary} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search conversations..."
          placeholderTextColor={theme.textSecondary}
          style={[styles.searchInput, { color: theme.text }]}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch("")}>
            <Ionicons
              name="close-circle"
              size={17}
              color={theme.textSecondary}
            />
          </Pressable>
        )}
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="small" color={theme.icon} />
        </View>
      ) : (
        <FlatList
          data={filteredContacts}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <ContactRow
              contact={item}
              lastMessage={lastMessages[item.id]}
              unreadCount={unreadCounts[item.id] || 0}
              onPress={() => handleContactPress(item)}
              theme={theme}
            />
          )}
          ItemSeparatorComponent={() => (
            <View
              style={[styles.separator, { backgroundColor: theme.border }]}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons
                name="chatbubbles-outline"
                size={52}
                color={theme.border}
              />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No conversations found
              </Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </MainContainer>
  );
};

export default Chat;

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    paddingLeft: 20,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  loading: {
    alignItems: "center",
    marginTop: 150,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  avatarWrap: { position: "relative" },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 17, fontWeight: "700" },
  onlineDot: {
    width: 13,
    height: 13,
    borderRadius: 7,
    position: "absolute",
    bottom: 0,
    right: 0,
    borderWidth: 2,
  },
  contactMeta: { flex: 1 },
  contactTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 3,
  },
  contactName: { fontSize: 15, fontWeight: "600" },
  contactTime: { fontSize: 12, opacity: 0.6 },
  contactBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  contactPreview: { fontSize: 13, opacity: 0.6, flex: 1 },
  badge: {
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  badgeText: { fontSize: 11, fontWeight: "700" },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: 80 },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15 },
});
