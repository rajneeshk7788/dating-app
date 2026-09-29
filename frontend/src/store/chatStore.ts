import { create } from 'zustand';
import { Conversation, Message, User } from '../types';

interface ChatState {
  activeTab: 'chats' | 'users' | 'calls';
  setActiveTab: (tab: 'chats' | 'users' | 'calls') => void;
  selectedConversation: Conversation | null;
  setSelectedConversation: (conv: Conversation | null) => void;
  onlineUserIds: Set<string>;
  setOnlineUsers: (ids: string[]) => void;
  addOnlineUser: (id: string) => void;
  removeOnlineUser: (id: string) => void;
  typingUsers: Record<string, string[]>; // conversationId -> array of usernames
  setTypingUser: (conversationId: string, username: string, isTyping: boolean) => void;
  searchDialogOpen: boolean;
  setSearchDialogOpen: (open: boolean) => void;
  profileDialogOpen: boolean;
  setProfileDialogOpen: (open: boolean) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  activeTab: 'chats',
  setActiveTab: (tab) => set({ activeTab: tab }),
  selectedConversation: null,
  setSelectedConversation: (conv) => set({ selectedConversation: conv }),
  onlineUserIds: new Set<string>(),
  setOnlineUsers: (ids) => set({ onlineUserIds: new Set(ids) }),
  addOnlineUser: (id) =>
    set((state) => {
      const next = new Set(state.onlineUserIds);
      next.add(id);
      return { onlineUserIds: next };
    }),
  removeOnlineUser: (id) =>
    set((state) => {
      const next = new Set(state.onlineUserIds);
      next.delete(id);
      return { onlineUserIds: next };
    }),
  typingUsers: {},
  setTypingUser: (conversationId, username, isTyping) =>
    set((state) => {
      const current = state.typingUsers[conversationId] || [];
      const updated = isTyping
        ? Array.from(new Set([...current, username]))
        : current.filter((u) => u !== username);
      return {
        typingUsers: {
          ...state.typingUsers,
          [conversationId]: updated,
        },
      };
    }),
  searchDialogOpen: false,
  setSearchDialogOpen: (open) => set({ searchDialogOpen: open }),
  profileDialogOpen: false,
  setProfileDialogOpen: (open) => set({ profileDialogOpen: open }),
}));
