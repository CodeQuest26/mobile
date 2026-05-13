import MainContainer from "@/components/MainContainer";
import { ThemedText } from "@/components/themed-text";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// ─── Types ────────────────────────────────────────────────────────────────────

type Contact = {
  id: string;
  name: string;
  initials: string;
  online: boolean;
  role?: string;
};

type Message = {
  id: string;
  text: string;
  sender: "user" | "other";
  timestamp: number;
};

// ─── Data ─────────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  { bg: "#EDE9FF", text: "#5B21B6" },
  { bg: "#D1FAE5", text: "#065F46" },
  { bg: "#FEE2E2", text: "#991B1B" },
  { bg: "#DBEAFE", text: "#1E40AF" },
  { bg: "#FEF3C7", text: "#92400E" },
  { bg: "#FCE7F3", text: "#9D174D" },
];

const DUMMY_CONTACTS: Contact[] = [
  {
    id: "1",
    name: "Abena Mensah",
    initials: "AM",
    online: true,
    role: "Family",
  },
  {
    id: "2",
    name: "Kweku Asante",
    initials: "KA",
    online: true,
    role: "Friend",
  },
  {
    id: "3",
    name: "Efua Boateng",
    initials: "EB",
    online: false,
    role: "Colleague",
  },
  {
    id: "4",
    name: "Kofi Agyeman",
    initials: "KO",
    online: false,
    role: "Friend",
  },
];

const INITIAL_MESSAGES: Record<string, Message[]> = {
  "1": [
    {
      id: "1-1",
      text: "Hey! Did you get the GH₵ 200 I sent?",
      sender: "other",
      timestamp: Date.now() - 100000,
    },
    {
      id: "1-2",
      text: "Yes! Thank you so much 🙏",
      sender: "user",
      timestamp: Date.now() - 80000,
    },
    {
      id: "1-3",
      text: "Can you split the dinner bill with me?",
      sender: "other",
      timestamp: Date.now() - 20000,
    },
  ],
  "2": [
    {
      id: "2-1",
      text: "GH₵ 350 sent for the group contribution",
      sender: "other",
      timestamp: Date.now() - 3600000,
    },
    {
      id: "2-2",
      text: "Received! You're all set 👍",
      sender: "user",
      timestamp: Date.now() - 3500000,
    },
  ],
  "3": [
    {
      id: "3-1",
      text: "Hey, are you free this weekend?",
      sender: "other",
      timestamp: Date.now() - 86400000,
    },
  ],
  "4": [
    {
      id: "4-1",
      text: "Payment request: GH₵ 120 for the event",
      sender: "other",
      timestamp: Date.now() - 172800000,
    },
    {
      id: "4-2",
      text: "I'll send it by evening",
      sender: "user",
      timestamp: Date.now() - 170000000,
    },
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const avatarColor = (id: string) =>
  AVATAR_COLORS[parseInt(id) % AVATAR_COLORS.length];

const formatTime = (ts: number) =>
  new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const formatListTime = (ts: number): string => {
  const now = Date.now();
  const diff = now - ts;
  if (diff < 86400000) return formatTime(ts);
  if (diff < 604800000) {
    return new Date(ts).toLocaleDateString([], { weekday: "short" });
  }
  return new Date(ts).toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
};

// ─── Contact Row ─────────────────────────────────────────────────────────────

const ContactRow = ({
  item,
  conversations,
  onPress,
  isDark,
}: {
  item: Contact;
  conversations: Record<string, Message[]>;
  onPress: () => void;
  isDark: boolean;
}) => {
  const msgs = conversations[item.id] ?? [];
  const last = msgs[msgs.length - 1];
  const preview = last
    ? last.sender === "user"
      ? `You: ${last.text}`
      : last.text
    : "No messages yet";
  const time = last ? formatListTime(last.timestamp) : "";
  const c = avatarColor(item.id);
  const unread = msgs.filter((m) => m.sender === "other").length % 2; // simulated

  return (
    <Pressable
      style={({ pressed }) => [
        styles.contactRow,
        {
          backgroundColor: pressed
            ? isDark
              ? "#1a1a2e"
              : "#F5F3FF"
            : "transparent",
        },
      ]}
      onPress={onPress}
    >
      <View style={styles.avatarWrap}>
        <View style={[styles.avatar, { backgroundColor: c.bg }]}>
          <ThemedText style={[styles.avatarText, { color: c.text }]}>
            {item.initials}
          </ThemedText>
        </View>
        {item.online && (
          <View
            style={[
              styles.onlineDot,
              { borderColor: isDark ? "#0f0f1a" : "#fff" },
            ]}
          />
        )}
      </View>

      <View style={styles.contactMeta}>
        <View style={styles.contactTopRow}>
          <ThemedText style={styles.contactName}>{item.name}</ThemedText>
          <ThemedText
            style={[
              styles.contactTime,
              unread > 0 && { color: "#7C3AED", fontWeight: "600" },
            ]}
          >
            {time}
          </ThemedText>
        </View>
        <View style={styles.contactBottomRow}>
          <ThemedText
            numberOfLines={1}
            style={[
              styles.contactPreview,
              unread > 0 && { opacity: 0.9, fontWeight: "500" },
            ]}
          >
            {preview}
          </ThemedText>
          {unread > 0 && (
            <View style={styles.badge}>
              <ThemedText style={styles.badgeText}>{unread}</ThemedText>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
};

// ─── Message Bubble ──────────────────────────────────────────────────────────

const Bubble = ({ item, isDark }: { item: Message; isDark: boolean }) => {
  const isUser = item.sender === "user";
  return (
    <View
      style={[
        styles.bubbleRow,
        isUser ? styles.bubbleRight : styles.bubbleLeft,
      ]}
    >
      <View
        style={[
          styles.bubble,
          isUser
            ? styles.bubbleUser
            : [
                styles.bubbleOther,
                { backgroundColor: isDark ? "#1e1e2e" : "#F3F0FF" },
              ],
        ]}
      >
        <ThemedText
          style={[
            styles.bubbleText,
            { color: isUser ? "#fff" : isDark ? "#e5e7eb" : "#1f1235" },
          ]}
        >
          {item.text}
        </ThemedText>
        <ThemedText
          style={[
            styles.bubbleTime,
            {
              color: isUser
                ? "rgba(255,255,255,0.65)"
                : isDark
                  ? "#6b7280"
                  : "#9CA3AF",
            },
          ]}
        >
          {formatTime(item.timestamp)}
        </ThemedText>
      </View>
    </View>
  );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────

const Messages = () => {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [conversations, setConversations] =
    useState<Record<string, Message[]>>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState("");
  const [search, setSearch] = useState("");
  const flatListRef = useRef<FlatList>(null);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // Auto-reply
  useEffect(() => {
    if (!selectedContact) return;
    const msgs = conversations[selectedContact.id];
    if (!msgs?.length || msgs[msgs.length - 1].sender !== "user") return;
    const t = setTimeout(() => {
      setConversations((prev) => ({
        ...prev,
        [selectedContact.id]: [
          ...prev[selectedContact.id],
          {
            id: `${Date.now()}_auto`,
            text: "Got it! I'll check and get back to you 👍",
            sender: "other",
            timestamp: Date.now(),
          },
        ],
      }));
    }, 1200);
    return () => clearTimeout(t);
  }, [conversations, selectedContact]);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, []);

  useEffect(() => {
    if (selectedContact) scrollToBottom();
  }, [conversations, selectedContact, scrollToBottom]);

  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed || !selectedContact) return;
    setConversations((prev) => ({
      ...prev,
      [selectedContact.id]: [
        ...(prev[selectedContact.id] ?? []),
        {
          id: Date.now().toString(),
          text: trimmed,
          sender: "user",
          timestamp: Date.now(),
        },
      ],
    }));
    setInputText("");
  };

  const goBack = () => {
    setSelectedContact(null);
    setInputText("");
  };

  const filtered = DUMMY_CONTACTS.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  // ─── Chat Screen ───────────────────────────────────────────────────────────

  if (selectedContact) {
    const c = avatarColor(selectedContact.id);
    const msgs = conversations[selectedContact.id] ?? [];

    return (
      <MainContainer safe>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
          {/* Chat Header */}
          <View
            style={[
              styles.chatHeader,
              { borderBottomColor: isDark ? "#1e1e2e" : "#EDE9FE" },
            ]}
          >
            <TouchableOpacity onPress={goBack} style={styles.backBtn}>
              <Ionicons
                name="chevron-back"
                size={24}
                color={isDark ? "#A78BFA" : "#7C3AED"}
              />
            </TouchableOpacity>

            <View style={styles.chatHeaderCenter}>
              <View style={[styles.chatAvatar, { backgroundColor: c.bg }]}>
                <ThemedText style={[styles.chatAvatarText, { color: c.text }]}>
                  {selectedContact.initials}
                </ThemedText>
              </View>
              <View>
                <ThemedText style={styles.chatName}>
                  {selectedContact.name}
                </ThemedText>
                <ThemedText style={styles.chatStatus}>
                  {selectedContact.online ? "🟢 Online" : "Offline"}
                </ThemedText>
              </View>
            </View>

            <TouchableOpacity style={styles.moreBtn}>
              <Ionicons
                name="ellipsis-horizontal"
                size={20}
                color={isDark ? "#9CA3AF" : "#6B7280"}
              />
            </TouchableOpacity>
          </View>

          {/* Messages */}
          <FlatList
            ref={flatListRef}
            data={msgs}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <Bubble item={item} isDark={isDark} />}
            contentContainerStyle={styles.msgList}
            onContentSizeChange={scrollToBottom}
            onLayout={scrollToBottom}
            showsVerticalScrollIndicator={false}
          />

          {/* Input Bar */}
          <View
            style={[
              styles.inputBar,
              {
                backgroundColor: isDark ? "#0f0f1a" : "#fff",
                borderTopColor: isDark ? "#1e1e2e" : "#EDE9FE",
              },
            ]}
          >
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? "#1e1e2e" : "#F3F0FF",
                  color: isDark ? "#F9FAFB" : "#111827",
                },
              ]}
              placeholder="Message..."
              placeholderTextColor={isDark ? "#4B5563" : "#9CA3AF"}
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
                !inputText.trim() && styles.sendBtnDisabled,
              ]}
              onPress={handleSend}
              disabled={!inputText.trim()}
            >
              <Ionicons name="send" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </MainContainer>
    );
  }

  // ─── Contact List Screen ───────────────────────────────────────────────────

  return (
    <MainContainer safe>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>Messages</ThemedText>
        <TouchableOpacity style={styles.newBtn}>
          <Ionicons
            name="create-outline"
            size={22}
            color={isDark ? "#A78BFA" : "#7C3AED"}
          />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View
        style={[
          styles.searchBar,
          {
            backgroundColor: isDark ? "#1e1e2e" : "#F3F0FF",
            borderColor: isDark ? "#2e2e3e" : "#EDE9FE",
          },
        ]}
      >
        <Ionicons
          name="search-outline"
          size={17}
          color={isDark ? "#6B7280" : "#9CA3AF"}
        />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search conversations..."
          placeholderTextColor={isDark ? "#4B5563" : "#9CA3AF"}
          style={[
            styles.searchInput,
            { color: isDark ? "#F9FAFB" : "#111827" },
          ]}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch("")}>
            <Ionicons
              name="close-circle"
              size={17}
              color={isDark ? "#6B7280" : "#9CA3AF"}
            />
          </Pressable>
        )}
      </View>

      {/* Contact List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <ContactRow
            item={item}
            conversations={conversations}
            onPress={() => setSelectedContact(item)}
            isDark={isDark}
          />
        )}
        ItemSeparatorComponent={() => (
          <View
            style={[
              styles.separator,
              { backgroundColor: isDark ? "#1e1e2e" : "#F3F0FF" },
            ]}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons
              name="chatbubbles-outline"
              size={52}
              color={isDark ? "#374151" : "#DDD6FE"}
            />
            <ThemedText style={styles.emptyText}>
              No conversations found
            </ThemedText>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </MainContainer>
  );
};

export default Messages;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  newBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },

  // Search
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
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },

  // Contact row
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
    backgroundColor: "#22C55E",
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
  contactTime: { fontSize: 12, opacity: 0.45 },
  contactBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  contactPreview: { fontSize: 13, opacity: 0.5, flex: 1 },
  badge: {
    backgroundColor: "#7C3AED",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: 80 },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15, opacity: 0.35 },

  // Chat header
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 4,
  },
  backBtn: {
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
  chatStatus: { fontSize: 12, opacity: 0.55, marginTop: 1 },
  moreBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  // Messages
  msgList: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexGrow: 1,
    gap: 6,
  },
  bubbleRow: { flexDirection: "row", marginBottom: 4 },
  bubbleLeft: { justifyContent: "flex-start" },
  bubbleRight: { justifyContent: "flex-end" },
  bubble: {
    maxWidth: "76%",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  bubbleUser: {
    backgroundColor: "#7C3AED",
    borderBottomRightRadius: 5,
  },
  bubbleOther: {
    borderBottomLeftRadius: 5,
  },
  bubbleText: { fontSize: 15, lineHeight: 21 },
  bubbleTime: { fontSize: 10, marginTop: 4, alignSelf: "flex-end" },

  // Input bar
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    gap: 8,
    marginBottom: 90,
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
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: { backgroundColor: "#C4B5FD" },
});
