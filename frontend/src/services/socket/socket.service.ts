import { io, Socket } from 'socket.io-client';
import { authService } from '../auth/auth.service';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  public socket: Socket | null = null;
  private isConnected = false;

  connect(): Socket {
    const token = authService.getAccessToken();
    if (!token) {
      console.warn('[SocketService] Cannot connect: No access token');
      return null as any;
    }

    if (this.socket && this.isConnected) {
      return this.socket;
    }

    if (this.socket) {
      this.socket.disconnect();
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      this.isConnected = true;
      console.log('[SocketService] Connected to Socket.IO server with ID:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      console.log('[SocketService] Disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('[SocketService] Connection error:', error.message);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  getSocket(): Socket | null {
    if (!this.socket || !this.isConnected) {
      return this.connect();
    }
    return this.socket;
  }

  // Conversation Room helpers
  joinConversation(conversationId: string) {
    this.socket?.emit('conversation:join', conversationId);
  }

  leaveConversation(conversationId: string) {
    this.socket?.emit('conversation:leave', conversationId);
  }

  // Typing indicators
  sendTypingStart(conversationId: string, username?: string) {
    this.socket?.emit('typing:start', { conversationId, username });
  }

  sendTypingStop(conversationId: string) {
    this.socket?.emit('typing:stop', { conversationId });
  }

  // Read ack
  sendReadAck(conversationId: string, messageId: string) {
    this.socket?.emit('message:read_ack', { conversationId, messageId });
  }

  // WebRTC & Call Signaling
  initiateCall(payload: { receiverId: string; callType: 'audio' | 'video'; conversationId?: string; offer?: any }) {
    this.socket?.emit('call:initiate', payload);
  }

  acceptCall(payload: { callerId: string; callId?: string; answer?: any }) {
    this.socket?.emit('call:accept', payload);
  }

  rejectCall(payload: { callerId: string; callId?: string; reason?: string }) {
    this.socket?.emit('call:reject', payload);
  }

  endCall(payload: { targetUserId: string; callId?: string; duration?: number }) {
    this.socket?.emit('call:end', payload);
  }

  sendIceCandidate(payload: { targetUserId: string; candidate: any }) {
    this.socket?.emit('webrtc:ice-candidate', payload);
  }

  sendOffer(payload: { targetUserId: string; offer: any }) {
    this.socket?.emit('webrtc:offer', payload);
  }

  sendAnswer(payload: { targetUserId: string; answer: any }) {
    this.socket?.emit('webrtc:answer', payload);
  }
}

export const socketService = new SocketService();
