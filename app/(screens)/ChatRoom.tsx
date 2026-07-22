import MainContainer from "@/components/MainContainer";
import Colors from "@/constants/colors";
import { api } from "@/services/api";
import { getAvatarColor } from "@/services/avatarColor";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ApiOrder {
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

interface ApiMessage {
  id: string;
  orderId: string;
  senderId: string;
  senderName: string;
  content: string;
  attachmentUrl?: string;
  isRead: boolean;
  createdAt: string;
}

type DateSeparator = {
  id: string;
  separator: true;
  label: string;
};

type ChatItem = ApiMessage | DateSeparator;

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

const formatDateLabel = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d >= today) return "Today";
  if (d >= yesterday) return "Yesterday";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

// ─── Sub-components ──────────────────────────────────────────────────────────

const Bubble = ({
  item,
  isCurrentUser,
  theme,
}: {
  item: ApiMessage;
  isCurrentUser: boolean;
  theme: typeof Colors.light;
}) => {
  return (
    <View
      style={[
        styles.messageRow,
        isCurrentUser ? styles.messageRowRight : styles.messageRowLeft,
      ]}
    >
      <View
        style={[
          styles.bubble,
          isCurrentUser
            ? [styles.bubbleUser, { backgroundColor: theme.info }]
            : [styles.bubbleOther, { backgroundColor: theme.iconBackground }],
        ]}
      >
        <Text
          style={[
            styles.bubbleText,
            { color: isCurrentUser ? "white" : theme.text },
          ]}
        >
          {item.content}
        </Text>
      </View>

      <Text
        style={[
          styles.timestamp,
          isCurrentUser ? styles.timestampRight : styles.timestampLeft,
          { color: theme.textSecondary },
        ]}
      >
        {formatTime(item.createdAt)}
        {isCurrentUser && (
          <Ionicons
            name={item.isRead ? "checkmark-done" : "checkmark"}
            size={15}
            color={item.isRead ? theme.primary : theme.textSecondary}
            accessibilityLabel={item.isRead ? "Read" : "Sent"}
          />
        )}
      </Text>
    </View>
  );
};

const DateSeparatorLine = ({
  label,
  theme,
}: {
  label: string;
  theme: typeof Colors.light;
}) => (
  <View style={styles.dateSep}>
    <View style={[styles.dateLine, { backgroundColor: theme.border }]} />
    <Text style={[styles.dateText, { color: theme.textSecondary }]}>
      {label}
    </Text>
    <View style={[styles.dateLine, { backgroundColor: theme.border }]} />
  </View>
);

// ─── Chat Room Screen ────────────────────────────────────────────────────────

const ChatRoom = () => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"] || Colors.light;
  const insets = useSafeAreaInsets();

  const { userType, contactId, contactName, contactInitials, contactOnline } =
    useLocalSearchParams<{
      userType: "manufacturer" | "sme";
      contactId: string;
      contactName: string;
      contactInitials: string;
      contactOnline: string;
    }>();

  const [messages, setMessages] = useState<ApiMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState("");
  const [messageSearch, setMessageSearch] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  // Poll the REST API while this screen is focused. This provides live
  // updates without requiring a socket endpoint from the backend.
  const loadConversation = useCallback(
    async (background = false) => {
      try {
        if (!background) setLoading(true);
        setError(null);
        // 1. Get current user
        const userRes = await api.get("users/me");
        const user = userRes.data;
        setCurrentUserId(user.id);

        // 2. Fetch all orders for the current user
        const ordersRes = await api.get("orders", {
          params: { page: 0, size: 100 },
        });
        const allOrders: ApiOrder[] = ordersRes.data.content || [];

        const contactOrders = allOrders.filter((o) =>
          userType === "manufacturer"
            ? o.smeId === contactId
            : o.factoryId === contactId,
        );

        if (contactOrders.length === 0) {
          setMessages([]);
          setActiveOrderId(null);
          return;
        }

        // Sort orders by createdAt descending
        const sortedOrders = contactOrders.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        // Use the most recent order as the active one for sending messages
        const latestOrder = sortedOrders[0];
        setActiveOrderId(latestOrder.id);

        // 3. Fetch messages for all orders with this contact, in parallel
        const results = await Promise.all(
          sortedOrders.map(async (order) => {
            try {
              const msgsRes = await api.get<{ content: ApiMessage[] }>(
                `messages/orders/${order.id}`,
                { params: { page: 0, size: 100 } },
              );
              return msgsRes.data.content || [];
            } catch (err) {
              console.warn(
                `Failed to fetch messages for order ${order.id}`,
                err,
              );
              return [] as ApiMessage[];
            }
          }),
        );

        const allMessages = results.flat();

        // Sort messages by createdAt ascending
        allMessages.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
        setMessages(allMessages);
      } catch (error) {
        console.error("Error fetching chat data:", error);
        setError("Couldn’t refresh this conversation. Please try again.");
      } finally {
        if (!background) setLoading(false);
      }
    },
    [contactId, userType],
  );

  useFocusEffect(
    useCallback(() => {
      if (!contactId) return;

      void loadConversation();
      const refreshInterval = setInterval(() => {
        void loadConversation(true);
      }, 5000);

      return () => clearInterval(refreshInterval);
    }, [contactId, loadConversation]),
  );

  // Scroll to bottom when messages change
  const scrollToBottom = useCallback(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, []);

  useEffect(() => {
    if (!loading) {
      setTimeout(scrollToBottom, 100);
    }
  }, [messages, loading, scrollToBottom]);

  const handleSend = async () => {
    const trimmed = inputText.trim();
    if (!trimmed || !contactId || !activeOrderId || !currentUserId) return;

    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const newMsg: ApiMessage = {
      id: tempId,
      orderId: activeOrderId,
      senderId: currentUserId,
      senderName: "You",
      content: trimmed,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newMsg]);
    setInputText("");
    scrollToBottom();

    try {
      // Send to API
      const response = await api.post<ApiMessage>("messages", {
        orderId: activeOrderId,
        content: trimmed,
        // attachmentUrl optional
      });
      const sentMsg = response.data;
      // Replace temp message with real one
      setMessages((prev) => prev.map((m) => (m.id === tempId ? sentMsg : m)));
    } catch (error) {
      console.error("Failed to send message:", error);
      // Optionally revert or show error
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    }
  };

  // Build chat items with date separators
  const getChatItems = useCallback((): ChatItem[] => {
    const items: ChatItem[] = [];
    let lastDate = "";
    messages.forEach((msg) => {
      const label = formatDateLabel(msg.createdAt);
      if (label !== lastDate) {
        items.push({ id: `sep-${msg.createdAt}`, separator: true, label });
        lastDate = label;
      }
      items.push(msg);
    });
    return items;
  }, [messages]);

  if (!contactId) return null;

  const c = getAvatarColor(contactId);
  const searchTerm = messageSearch.trim().toLowerCase();
  const chatItems = getChatItems().filter(
    (item) =>
      "separator" in item ||
      !searchTerm ||
      item.content.toLowerCase().includes(searchTerm),
  );
  const online = contactOnline === "1";

  return (
    <MainContainer safe>
      {/* Header */}
      <View style={[styles.chatHeader, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={24} color={theme.icon} />
        </TouchableOpacity>

        <View style={styles.chatHeaderCenter}>
          <View style={[styles.chatAvatar, { backgroundColor: c.bg }]}>
            <Text style={[styles.chatAvatarText, { color: c.text }]}>
              {contactInitials}
            </Text>
          </View>
          <View>
            <Text style={[styles.chatName, { color: theme.text }]}>
              {contactName}
            </Text>
            <Text style={[styles.chatStatus, { color: theme.textSecondary }]}>
              {online ? "Online" : "Offline"}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons
            name="ellipsis-horizontal"
            size={20}
            color={theme.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* Messages + Input */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size={"small"} color={theme.primary} />
            <Text style={{ color: theme.textSecondary, marginTop: 20 }}>
              Loading messages...
            </Text>
          </View>
        ) : (
          <>
            {error && (
              <Text style={[styles.refreshError, { color: theme.error }]}>
                {error}
              </Text>
            )}
            <FlatList
              ref={flatListRef}
              data={chatItems}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                if ("separator" in item) {
                  return <DateSeparatorLine label={item.label} theme={theme} />;
                }
                const isCurrentUser = item.senderId === currentUserId;
                return (
                  <Bubble
                    item={item}
                    isCurrentUser={isCurrentUser}
                    theme={theme}
                  />
                );
              }}
              contentContainerStyle={styles.msgList}
              onContentSizeChange={scrollToBottom}
              onLayout={scrollToBottom}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Text style={{ color: theme.textSecondary }}>
                    No messages yet. Start a conversation!
                  </Text>
                </View>
              }
            />

            <View
              style={[
                styles.inputBar,
                {
                  backgroundColor: theme.background,
                  borderTopColor: theme.border,
                  paddingBottom: insets.bottom + 8,
                },
              ]}
            >
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => console.log("open attachment menu")}
                style={styles.attachBtn}
              >
                <Ionicons name="add" size={30} color={theme.icon} />
              </TouchableOpacity>

              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: theme.cardBackground, color: theme.text },
                ]}
                placeholder="Message..."
                placeholderTextColor={theme.textSecondary}
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={handleSend}
                returnKeyType="send"
                multiline
                blurOnSubmit={false}
              />

              <TouchableOpacity
                style={[
                  styles.sendBtn,
                  { backgroundColor: theme.primary },
                  !inputText.trim() && styles.sendBtnDisabled,
                ]}
                onPress={handleSend}
                disabled={!inputText.trim()}
              >
                <Ionicons name="send" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </MainContainer>
  );
};

export default ChatRoom;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  chatHeaderCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  chatAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  chatAvatarText: { fontSize: 14, fontWeight: "700" },
  chatName: { fontSize: 15, fontWeight: "600" },
  chatStatus: { fontSize: 12, opacity: 0.7, marginTop: 1 },
  msgList: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexGrow: 1,
  },
  messageRow: {
    marginBottom: 8,
    maxWidth: "76%",
  },
  messageRowLeft: {
    alignSelf: "flex-start",
  },
  messageRowRight: {
    alignSelf: "flex-end",
  },
  bubble: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  bubbleUser: {
    borderBottomRightRadius: 5,
  },
  bubbleOther: {
    borderBottomLeftRadius: 5,
  },
  bubbleText: { fontSize: 15, lineHeight: 21 },
  timestamp: {
    fontSize: 10,
    marginTop: 3,
    opacity: 0.6,
  },
  timestampLeft: {
    alignSelf: "flex-start",
  },
  timestampRight: {
    alignSelf: "flex-end",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 100,
    borderRadius: 21,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: { opacity: 0.5 },
  attachBtn: {
    minHeight: 42,
    maxHeight: 100,
    width: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
  },
  dateSep: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 12,
  },
  dateLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    opacity: 0.3,
  },
  dateText: {
    marginHorizontal: 12,
    fontSize: 12,
    fontWeight: "500",
    opacity: 0.6,
    textTransform: "uppercase",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  refreshError: {
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 40,
  },
});
