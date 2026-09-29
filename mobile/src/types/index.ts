export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatar?: string | null;
  bio?: string | null;
  gender?: string | null;
  statusMessage?: string | null;
  isOnline: boolean;
  lastSeen?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type MessageType = 'text' | 'image' | 'audio' | 'video' | 'call_log';
export type MessageStatus = 'sent' | 'delivered' | 'read';

export interface Message {
  id: string;
  conversationId: string;
  sender: User;
  content: string;
  type: MessageType;
  readBy: string[];
  status: MessageStatus;
  createdAt: string;
  updatedAt?: string;
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
export type CallStatus =
  | 'initiated'
  | 'ringing'
  | 'accepted'
  | 'rejected'
  | 'missed'
  | 'completed'
  | 'busy';

export interface CallRecord {
  id: string;
  caller: User;
  receiver: User;
  conversationId?: string | null;
  callType: CallType;
  status: CallStatus;
  startedAt?: string | null;
  endedAt?: string | null;
  duration: number;
  createdAt: string;
  updatedAt?: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  refreshToken: string;
  user: User;
}
