import MainContainer from "@/components/MainContainer";
import Colors from "@/constants/colors";
import {
  AVATAR_COLORS,
  formatDateLabel,
  formatTime,
  Message,
} from "@/constants/contacts";
import { useChatConversations } from "@/hooks/useChatConversations";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
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
type DateSeparator = {
  id: string;
  separator: true;
  label: string;
};

type ChatItem = Message | DateSeparator;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getAvatarColor = (id: string) => {
  const numeric = parseInt(id.replace(/\D/g, ""), 10);
  const index = Number.isFinite(numeric)
    ? numeric % AVATAR_COLORS.length
    : Array.from(id).reduce((sum, char) => sum + char.charCodeAt(0), 0) %
      AVATAR_COLORS.length;

  return AVATAR_COLORS[index];
};

// ─── Sub-components ───────────────────────────────────────────────────────────
const Bubble = ({
  item,
  theme,
}: {
  item: Message;
  theme: typeof Colors.light;
}) => {
  const isUser = item.sender === "user";
  return (
    <View
      style={[
        styles.messageRow,
        isUser ? styles.messageRowRight : styles.messageRowLeft,
      ]}
    >
      <View
        style={[
          styles.bubble,
          isUser
            ? [styles.bubbleUser, { backgroundColor: theme.info }]
            : [styles.bubbleOther, { backgroundColor: theme.iconBackground }],
        ]}
      >
        <Text
          style={[styles.bubbleText, { color: isUser ? "white" : theme.text }]}
        >
          {item.text}
        </Text>
      </View>

      {/* Timestamp outside the bubble */}
      <Text
        style={[
          styles.timestamp,
          isUser ? styles.timestampRight : styles.timestampLeft,
          { color: theme.textSecondary },
        ]}
      >
        {formatTime(item.timestamp)}
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

// ─── Chat Room Screen ─────────────────────────────────────────────────────────
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

  if (!contactId) return null;

  const { conversations, setConversations } = useChatConversations(
    userType ?? "manufacturer",
  );
  const [inputText, setInputText] = useState("");
  const flatListRef = useRef<FlatList>(null);

  const online = contactOnline === "1";

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timeout);
  }, [conversations, contactId, scrollToBottom]);

  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed || !contactId) return;
    setConversations((prev) => ({
      ...prev,
      [contactId]: [
        ...(prev[contactId] ?? []),
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

  const getChatItems = useCallback((): ChatItem[] => {
    if (!contactId) return [];
    const msgs = conversations[contactId] ?? [];
    const items: ChatItem[] = [];
    let lastDate = "";
    msgs.forEach((msg) => {
      const label = formatDateLabel(msg.timestamp);
      if (label !== lastDate) {
        items.push({ id: `sep-${msg.timestamp}`, separator: true, label });
        lastDate = label;
      }
      items.push(msg);
    });
    return items;
  }, [conversations, contactId]);

  if (!contactId) return null;

  const c = getAvatarColor(contactId);
  const chatItems = getChatItems();

  return (
    <MainContainer safe>
      {/* Header — outside KeyboardAvoidingView, stays fixed at top */}
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
              {online ? "🟢 Online" : "Offline"}
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

      {/* Content area — messages + input */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {/* Messages list */}
        <FlatList
          ref={flatListRef}
          data={chatItems}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            if ("separator" in item) {
              return <DateSeparatorLine label={item.label} theme={theme} />;
            }
            return <Bubble item={item} theme={theme} />;
          }}
          contentContainerStyle={styles.msgList}
          onContentSizeChange={scrollToBottom}
          onLayout={scrollToBottom}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />

        {/* Input bar — safe area inset applied to bottom padding */}
        <View
          style={[
            styles.inputBar,
            {
              backgroundColor: theme.background,
              borderTopColor: theme.border,
              paddingBottom: insets.bottom + 8,
              justifyContent: "center",
              alignContent: "center",
            },
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => console.log("open attachment menu")}
            style={{
              // backgroundColor: theme.iconBackground,
              minHeight: 42,
              maxHeight: 100,
              width: 42,
              borderRadius: 21,
              justifyContent: "center",
              alignItems: "center",
            }}
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
      </KeyboardAvoidingView>
    </MainContainer>
  );
};

export default ChatRoom;

// ─── Styles ───────────────────────────────────────────────────────────────────
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

  // Message row — wraps bubble + timestamp
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

  // Bubble
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

  // Timestamp — outside bubble
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
});
