export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  gender?: string;
  statusMessage?: string;
  isOnline: boolean;
  lastSeen?: string;
  createdAt: string;
  updatedAt: string;
}

export type MessageType = 'text' | 'image' | 'audio' | 'video' | 'call_log';
export type MessageStatus = 'sent' | 'delivered' | 'read';

export interface Message {
  id: string;
  conversationId: string;
  sender: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
  };
  content: string;
  type: MessageType;
  readBy: string[];
  status: MessageStatus;
  createdAt: string;
  updatedAt: string;
}

export interface UnreadCount {
  userId: string;
  count: number;
}

export interface Conversation {
  id: string;
  participants: User[];
  lastMessage?: Message | null;
  unreadCounts: UnreadCount[];
  createdAt: string;
  updatedAt: string;
}

export type CallType = 'audio' | 'video';
export type CallStatus = 'initiated' | 'ringing' | 'accepted' | 'rejected' | 'missed' | 'completed' | 'busy';

export interface CallRecord {
  id: string;
  caller: User;
  receiver: User;
  conversationId?: string;
  callType: CallType;
  status: CallStatus;
  startedAt?: string;
  endedAt?: string;
  duration: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}
