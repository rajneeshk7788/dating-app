import { io, Socket } from 'socket.io-client';
import { getSocketUrl } from '../config';
import { getStoredToken } from './api';
import { Message, Conversation } from '../types';

let socketInstance: Socket | null = null;

export type MessageHandler = (msg: Message) => void;
export type MessageReadHandler = (data: { messageId: string; userId: string; conversationId?: string }) => void;
export type TypingHandler = (data: { conversationId: string; userId: string; username?: string; isTyping: boolean }) => void;
export type PresenceHandler = (data: { onlineUserIds?: string[]; userId?: string; isOnline: boolean }) => void;
export type ConversationHandler = (conv: Conversation) => void;
export type CallEventHandler = (event: string, payload: any) => void;

class SocketService {
  private socket: Socket | null = null;
  private messageListeners: Set<MessageHandler> = new Set();
  private messageReadListeners: Set<MessageReadHandler> = new Set();
  private typingListeners: Set<TypingHandler> = new Set();
  private presenceListeners: Set<PresenceHandler> = new Set();
  private conversationListeners: Set<ConversationHandler> = new Set();
  private callListeners: Set<CallEventHandler> = new Set();

  async connect(): Promise<Socket | null> {
    const token = await getStoredToken();
    if (!token) {
      console.warn('[Socket] No token found, skipping connection');
      return null;
    }

    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    if (this.socket) {
      this.socket.disconnect();
    }

    const url = getSocketUrl();
    console.log('[Socket] Connecting to:', url);

    this.socket = io(url, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketInstance = this.socket;

    this.setupListeners();
    return this.socket;
  }

  private setupListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('[Socket] Connected successfully with ID:', this.socket?.id);
    });

    this.socket.on('connect_error', (err) => {
      console.warn('[Socket] Connection error:', err.message);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });

    // Presence events
    this.socket.on('presence:sync', (data: { onlineUserIds: string[] }) => {
      this.presenceListeners.forEach((fn) =>
        fn({ onlineUserIds: data.onlineUserIds, isOnline: true })
      );
    });

    this.socket.on('user:online', (data: { userId: string }) => {
      this.presenceListeners.forEach((fn) =>
        fn({ userId: data.userId, isOnline: true })
      );
    });

    this.socket.on('user:offline', (data: { userId: string; lastSeen: string }) => {
      this.presenceListeners.forEach((fn) =>
        fn({ userId: data.userId, isOnline: false })
      );
    });

    // Chat events
    this.socket.on('message:new', (msg: Message) => {
      this.messageListeners.forEach((fn) => fn(msg));
    });

    this.socket.on('message:read', (data: { messageId: string; userId: string; conversationId?: string }) => {
      this.messageReadListeners.forEach((fn) => fn(data));
    });

    this.socket.on('typing:started', (data: { conversationId: string; userId: string; username?: string }) => {
      this.typingListeners.forEach((fn) =>
        fn({ ...data, isTyping: true })
      );
    });

    this.socket.on('typing:stopped', (data: { conversationId: string; userId: string }) => {
      this.typingListeners.forEach((fn) =>
        fn({ ...data, isTyping: false })
      );
    });

    this.socket.on('conversation:created', (conv: Conversation) => {
      this.conversationListeners.forEach((fn) => fn(conv));
    });

    // Call signaling events
    const callEvents = [
      'call:incoming',
      'call:accepted',
      'call:rejected',
      'call:ended',
      'call:busy',
      'call:ice_candidate_received',
    ];

    callEvents.forEach((evt) => {
      this.socket?.on(evt, (payload) => {
        this.callListeners.forEach((fn) => fn(evt, payload));
      });
    });
  }

  joinConversation(conversationId: string) {
    if (this.socket?.connected) {
      this.socket.emit('conversation:join', conversationId);
    }
  }

  leaveConversation(conversationId: string) {
    if (this.socket?.connected) {
      this.socket.emit('conversation:leave', conversationId);
    }
  }

  startTyping(conversationId: string, username?: string) {
    if (this.socket?.connected) {
      this.socket.emit('typing:start', { conversationId, username });
    }
  }

  stopTyping(conversationId: string) {
    if (this.socket?.connected) {
      this.socket.emit('typing:stop', { conversationId });
    }
  }

  // Call actions
  initiateCall(receiverId: string, callType: 'audio' | 'video', offer?: any) {
    if (this.socket?.connected) {
      this.socket.emit('call:initiate', { receiverId, callType, offer });
    }
  }

  acceptCall(callerId: string, answer?: any) {
    if (this.socket?.connected) {
      this.socket.emit('call:accept', { callerId, answer });
    }
  }

  rejectCall(callerId: string, reason: string = 'declined') {
    if (this.socket?.connected) {
      this.socket.emit('call:reject', { callerId, reason });
    }
  }

  endCall(targetUserId: string) {
    if (this.socket?.connected) {
      this.socket.emit('call:end', { targetUserId });
    }
  }

  // Subscription helpers
  onMessage(fn: MessageHandler) {
    this.messageListeners.add(fn);
    return () => this.messageListeners.delete(fn);
  }

  onMessageRead(fn: MessageReadHandler) {
    this.messageReadListeners.add(fn);
    return () => this.messageReadListeners.delete(fn);
  }

  onTyping(fn: TypingHandler) {
    this.typingListeners.add(fn);
    return () => this.typingListeners.delete(fn);
  }

  onPresence(fn: PresenceHandler) {
    this.presenceListeners.add(fn);
    return () => this.presenceListeners.delete(fn);
  }

  onConversationCreated(fn: ConversationHandler) {
    this.conversationListeners.add(fn);
    return () => this.conversationListeners.delete(fn);
  }

  onCallEvent(fn: CallEventHandler) {
    this.callListeners.add(fn);
    return () => this.callListeners.delete(fn);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();
