import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Conversation, Message, User, MessageType } from '../types';
import {
  fetchConversations,
  fetchMessages,
  mutateSendMessage,
  mutateCreateConversation,
  mutateMarkMessageAsRead,
} from '../services/graphql';
import { socketService } from '../services/socket';
import { useAuth } from './AuthContext';

interface ChatContextType {
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  onlineUserIds: Set<string>;
  typingUsers: Record<string, string[]>;
  loadingConversations: boolean;
  loadingMessages: boolean;
  refreshConversations: () => Promise<void>;
  loadMessagesForConversation: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, content: string, type?: MessageType) => Promise<Message>;
  startConversation: (participantId: string) => Promise<Conversation>;
  markMessageRead: (conversationId: string, messageId: string) => Promise<void>;
  setTyping: (conversationId: string, isTyping: boolean) => void;
  isUserOnline: (userId: string) => boolean;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});
  const [loadingConversations, setLoadingConversations] = useState<boolean>(false);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);

  // Fetch initial conversations when user logs in
  const refreshConversations = useCallback(async () => {
    if (!token || !user) return;
    setLoadingConversations(true);
    try {
      const convs = await fetchConversations();
      setConversations(convs);
    } catch (err) {
      console.warn('[Chat] Failed to load conversations:', err);
    } finally {
      setLoadingConversations(false);
    }
  }, [token, user]);

  useEffect(() => {
    if (user && token) {
      refreshConversations();
    } else {
      setConversations([]);
      setMessages({});
      setOnlineUserIds(new Set());
      setTypingUsers({});
    }
  }, [user, token, refreshConversations]);

  // Real-time socket event bindings
  useEffect(() => {
    if (!user || !token) return;

    // Incoming messages
    const unsubMsg = socketService.onMessage((newMsg: Message) => {
      setMessages((prev) => {
        const convMessages = prev[newMsg.conversationId] || [];
        // Avoid duplicate message appending
        if (convMessages.some((m) => m.id === newMsg.id)) {
          return prev;
        }
        return {
          ...prev,
          [newMsg.conversationId]: [...convMessages, newMsg],
        };
      });

      // Update conversations list with latest message
      setConversations((prev) => {
        const found = prev.find((c) => c.id === newMsg.conversationId);
        if (!found) {
          refreshConversations();
          return prev;
        }
        const updated = prev.map((c) => {
          if (c.id === newMsg.conversationId) {
            return {
              ...c,
              lastMessage: newMsg,
              updatedAt: new Date().toISOString(),
            };
          }
          return c;
        });
        // Sort most recently updated conversation to top
        return updated.sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      });
    });

    // Message read receipts
    const unsubRead = socketService.onMessageRead(({ messageId, userId, conversationId }) => {
      if (!conversationId) return;
      setMessages((prev) => {
        const list = prev[conversationId];
        if (!list) return prev;
        return {
          ...prev,
          [conversationId]: list.map((m) => {
            if (m.id === messageId) {
              const readBy = Array.from(new Set([...m.readBy, userId]));
              return { ...m, readBy, status: 'read' as const };
            }
            return m;
          }),
        };
      });
    });

    // Typing indicators
    const unsubTyping = socketService.onTyping(({ conversationId, userId, username, isTyping }) => {
      if (userId === user.id) return;
      const display = username || 'Someone';

      setTypingUsers((prev) => {
        const current = prev[conversationId] || [];
        const next = isTyping
          ? Array.from(new Set([...current, display]))
          : current.filter((u) => u !== display);

        return {
          ...prev,
          [conversationId]: next,
        };
      });
    });

    // Presence updates
    const unsubPresence = socketService.onPresence(({ onlineUserIds: allIds, userId, isOnline }) => {
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        if (allIds) {
          allIds.forEach((id) => next.add(id));
        }
        if (userId) {
          if (isOnline) {
            next.add(userId);
          } else {
            next.delete(userId);
          }
        }
        return next;
      });
    });

    // Conversation created
    const unsubConv = socketService.onConversationCreated((newConv: Conversation) => {
      setConversations((prev) => {
        if (prev.some((c) => c.id === newConv.id)) return prev;
        return [newConv, ...prev];
      });
    });

    return () => {
      unsubMsg();
      unsubRead();
      unsubTyping();
      unsubPresence();
      unsubConv();
    };
  }, [user, token, refreshConversations]);

  const loadMessagesForConversation = async (conversationId: string) => {
    socketService.joinConversation(conversationId);
    setLoadingMessages(true);
    try {
      const fetched = await fetchMessages(conversationId, 50, 0);
      setMessages((prev) => ({
        ...prev,
        [conversationId]: fetched,
      }));
    } catch (err) {
      console.warn('[Chat] Failed to load messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const sendMessage = async (
    conversationId: string,
    content: string,
    type: MessageType = 'text'
  ): Promise<Message> => {
    const sent = await mutateSendMessage(conversationId, content, type);
    // Append to local message cache immediately
    setMessages((prev) => {
      const current = prev[conversationId] || [];
      if (current.some((m) => m.id === sent.id)) return prev;
      return {
        ...prev,
        [conversationId]: [...current, sent],
      };
    });

    // Update conversation lastMessage
    setConversations((prev) => {
      return prev
        .map((c) => (c.id === conversationId ? { ...c, lastMessage: sent } : c))
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    });

    return sent;
  };

  const startConversation = async (participantId: string): Promise<Conversation> => {
    // Check if conversation already exists in memory
    const existing = conversations.find((c) =>
      c.participants.some((p) => p.id === participantId)
    );
    if (existing) {
      return existing;
    }

    const created = await mutateCreateConversation(participantId);
    setConversations((prev) => [created, ...prev]);
    return created;
  };

  const markMessageRead = async (conversationId: string, messageId: string) => {
    try {
      await mutateMarkMessageAsRead(messageId);
      setMessages((prev) => {
        const list = prev[conversationId];
        if (!list) return prev;
        return {
          ...prev,
          [conversationId]: list.map((m) =>
            m.id === messageId ? { ...m, status: 'read' as const } : m
          ),
        };
      });
    } catch (err) {
      console.warn('[Chat] Failed to mark read:', err);
    }
  };

  const setTyping = (conversationId: string, isTyping: boolean) => {
    if (isTyping) {
      socketService.startTyping(conversationId, user?.displayName || user?.username);
    } else {
      socketService.stopTyping(conversationId);
    }
  };

  const isUserOnline = (userId: string): boolean => {
    return onlineUserIds.has(userId);
  };

  return (
    <ChatContext.Provider
      value={{
        conversations,
        messages,
        onlineUserIds,
        typingUsers,
        loadingConversations,
        loadingMessages,
        refreshConversations,
        loadMessagesForConversation,
        sendMessage,
        startConversation,
        markMessageRead,
        setTyping,
        isUserOnline,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
