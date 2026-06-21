import MainContainer from "@/components/MainContainer";
import Colors from "@/constants/colors";
import {
    Contact,
    CONTACTS,
    formatListTime,
    getAvatarColor,
    Message,
} from "@/constants/contacts";
import { useChatConversations } from "@/hooks/useChatConversations";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    useColorScheme,
    View,
} from "react-native";

// ─── Contact Row Component ────────────────────────────────────────────────────
const ContactRow = ({
  contact,
  conversations,
  lastRead,
  onPress,
  theme,
}: {
  contact: Contact;
  conversations: Record<string, Message[]>;
  lastRead: Record<string, number>;
  onPress: () => void;
  theme: typeof Colors.light;
}) => {
  const msgs = conversations[contact.id] ?? [];
  const last = msgs[msgs.length - 1];
  const preview = last
    ? last.sender === "user"
      ? `You: ${last.text}`
      : last.text
    : "No messages yet";
  const time = last ? formatListTime(last.timestamp) : "";
  const unread = msgs.filter(
    (m) => m.sender === "other" && m.timestamp > (lastRead[contact.id] ?? 0),
  ).length;
  const c = getAvatarColor(contact.id);

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
          <Text
            style={[
              styles.contactTime,
              unread > 0 && { fontWeight: "600" },
              { color: theme.textSecondary },
            ]}
          >
            {time}
          </Text>
        </View>
        <View style={styles.contactBottomRow}>
          <Text
            numberOfLines={1}
            style={[
              styles.contactPreview,
              unread > 0 && { fontWeight: "500" },
              { color: theme.text },
            ]}
          >
            {preview}
          </Text>
          {unread > 0 && (
            <View style={[styles.badge, { backgroundColor: theme.primary }]}>
              <Text style={styles.badgeText}>{unread}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
};

// ─── Chat List Screen ─────────────────────────────────────────────────────────
const Chat = () => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"] || Colors.light;

  const { conversations, setConversations, lastRead, setLastRead } =
    useChatConversations("sme");
  const [search, setSearch] = React.useState("");

  const filteredContacts = CONTACTS.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  const handleContactPress = (contact: Contact) => {
    setLastRead((prev) => ({ ...prev, [contact.id]: Date.now() }));
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
      <Text style={[styles.header, { color: theme.text }]}>Chat</Text>

      {/* Search */}
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

      <FlatList
        data={filteredContacts}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <ContactRow
            contact={item}
            conversations={conversations}
            lastRead={lastRead}
            onPress={() => handleContactPress(item)}
            theme={theme}
          />
        )}
        ItemSeparatorComponent={() => (
          <View style={[styles.separator, { backgroundColor: theme.border }]} />
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
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: 80 },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15 },
});
