// ─── Types ────────────────────────────────────────────────────────────────────
export type Contact = {
  id: string;
  name: string;
  initials: string;
  online: boolean;
};

export type Message = {
  id: string;
  text: string;
  sender: "user" | "other";
  timestamp: number;
};

// ─── Avatar Colors ────────────────────────────────────────────────────────────
export const AVATAR_COLORS = [
  { bg: "#EDE9FF", text: "#5B21B6" },
  { bg: "#D1FAE5", text: "#065F46" },
  { bg: "#FEE2E2", text: "#991B1B" },
  { bg: "#DBEAFE", text: "#1E40AF" },
  { bg: "#FEF3C7", text: "#92400E" },
  { bg: "#FCE7F3", text: "#9D174D" },
];

// ─── Contacts Data ────────────────────────────────────────────────────────────
export const CONTACTS: Contact[] = [
  { id: "1", name: "AfroDrinks Ltd", initials: "AD", online: true },
  { id: "2", name: "BuildRight Ghana", initials: "BR", online: true },
  { id: "3", name: "Volta Electricals", initials: "VE", online: false },
  { id: "4", name: "PureWater Ghana", initials: "PW", online: false },
];

// ─── Initial Messages ────────────────────────────────────────────────────────
export const INITIAL_MESSAGES: Record<string, Message[]> = {
  "1": [
    {
      id: "1-1",
      text: "We need 2000 units",
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

// ─── Helper Functions ─────────────────────────────────────────────────────────
export const getAvatarColor = (id: string) =>
  AVATAR_COLORS[parseInt(id) % AVATAR_COLORS.length];

export const formatTime = (ts: number) =>
  new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export const formatListTime = (ts: number): string => {
  const now = Date.now();
  const diff = now - ts;
  if (diff < 86400000) return formatTime(ts);
  if (diff < 604800000)
    return new Date(ts).toLocaleDateString([], { weekday: "short" });
  return new Date(ts).toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
};

export const formatDateLabel = (ts: number): string => {
  const now = new Date();
  const msgDate = new Date(ts);
  const diffDays = Math.floor(
    (now.setHours(0, 0, 0, 0) - msgDate.setHours(0, 0, 0, 0)) / 86400000,
  );
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return msgDate.toLocaleDateString([], {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
};
