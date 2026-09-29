import { create } from 'zustand';
import { CallType, User } from '../types';

export type CallStatusState = 'idle' | 'calling' | 'incoming' | 'connected' | 'ended';

interface CallState {
  callStatus: CallStatusState;
  callType: CallType;
  callId: string | null;
  remoteUser: {
    id: string;
    username?: string;
    displayName: string;
    avatar?: string;
  } | null;
  incomingCall: {
    callId: string;
    caller: {
      id: string;
      username?: string;
      displayName: string;
      avatar?: string;
    };
    callType: CallType;
    conversationId?: string;
    offer?: any;
  } | null;
  isMicMuted: boolean;
  isCameraOff: boolean;
  callDuration: number;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;

  setCallStatus: (status: CallStatusState) => void;
  setCallType: (type: CallType) => void;
  setCallId: (id: string | null) => void;
  setRemoteUser: (user: CallState['remoteUser']) => void;
  setIncomingCall: (call: CallState['incomingCall']) => void;
  setIsMicMuted: (muted: boolean) => void;
  setIsCameraOff: (off: boolean) => void;
  setCallDuration: (duration: number | ((prev: number) => number)) => void;
  setLocalStream: (stream: MediaStream | null) => void;
  setRemoteStream: (stream: MediaStream | null) => void;
  resetCall: () => void;
}

export const useCallStore = create<CallState>((set) => ({
  callStatus: 'idle',
  callType: 'video',
  callId: null,
  remoteUser: null,
  incomingCall: null,
  isMicMuted: false,
  isCameraOff: false,
  callDuration: 0,
  localStream: null,
  remoteStream: null,

  setCallStatus: (callStatus) => set({ callStatus }),
  setCallType: (callType) => set({ callType }),
  setCallId: (callId) => set({ callId }),
  setRemoteUser: (remoteUser) => set({ remoteUser }),
  setIncomingCall: (incomingCall) => set({ incomingCall }),
  setIsMicMuted: (isMicMuted) => set({ isMicMuted }),
  setIsCameraOff: (isCameraOff) => set({ isCameraOff }),
  setCallDuration: (updater) =>
    set((state) => ({
      callDuration: typeof updater === 'function' ? updater(state.callDuration) : updater,
    })),
  setLocalStream: (localStream) => set({ localStream }),
  setRemoteStream: (remoteStream) => set({ remoteStream }),
  resetCall: () =>
    set({
      callStatus: 'idle',
      callId: null,
      remoteUser: null,
      incomingCall: null,
      isMicMuted: false,
      isCameraOff: false,
      callDuration: 0,
      localStream: null,
      remoteStream: null,
    }),
}));
