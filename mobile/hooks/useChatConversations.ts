import { INITIAL_MESSAGES, Message } from "@/constants/contacts";
import { useState } from "react";

type UserType = "manufacturer" | "sme";

// Store conversation state separately for each user type
const conversationStore: Record<UserType, Record<string, Message[]>> = {
  manufacturer: { ...INITIAL_MESSAGES },
  sme: { ...INITIAL_MESSAGES },
};

const lastReadStore: Record<UserType, Record<string, number>> = {
  manufacturer: {},
  sme: {},
};

/**
 * Hook to manage conversations independently for each user type
 * Ensures manufacturer and SME have separate conversation histories
 */
export const useChatConversations = (userType: UserType) => {
  const [conversations, setConversations] = useState<Record<string, Message[]>>(
    conversationStore[userType],
  );
  const [lastRead, setLastRead] = useState<Record<string, number>>(
    lastReadStore[userType],
  );

  const updateConversations = (
    updater:
      | Record<string, Message[]>
      | ((prev: Record<string, Message[]>) => Record<string, Message[]>),
  ) => {
    const newConversations =
      typeof updater === "function" ? updater(conversations) : updater;
    setConversations(newConversations);
    conversationStore[userType] = newConversations;
  };

  const updateLastRead = (
    updater:
      | Record<string, number>
      | ((prev: Record<string, number>) => Record<string, number>),
  ) => {
    const newLastRead =
      typeof updater === "function" ? updater(lastRead) : updater;
    setLastRead(newLastRead);
    lastReadStore[userType] = newLastRead;
  };

  return {
    conversations,
    setConversations: updateConversations,
    lastRead,
    setLastRead: updateLastRead,
  };
};
