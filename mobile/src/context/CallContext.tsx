import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { User, CallType, CallStatus, CallRecord } from '../types';
import { socketService } from '../services/socket';
import { mutateCreateCallRecord, mutateUpdateCallStatus, fetchCallHistory } from '../services/graphql';
import { useAuth } from './AuthContext';

export type ActiveCallState = 'idle' | 'calling' | 'incoming' | 'connected' | 'ended';

interface CallContextType {
  callState: ActiveCallState;
  callPartner: User | null;
  callType: CallType;
  duration: number; // in seconds
  isMuted: boolean;
  isVideoEnabled: boolean;
  isSpeakerOn: boolean;
  callHistory: CallRecord[];
  startCall: (targetUser: User, type: CallType, conversationId?: string) => Promise<void>;
  acceptCall: () => Promise<void>;
  rejectCall: () => Promise<void>;
  endCall: () => Promise<void>;
  toggleMute: () => void;
  toggleVideo: () => void;
  toggleSpeaker: () => void;
  refreshCallHistory: () => Promise<void>;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [callState, setCallState] = useState<ActiveCallState>('idle');
  const [callPartner, setCallPartner] = useState<User | null>(null);
  const [callType, setCallType] = useState<CallType>('audio');
  const [duration, setDuration] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState<boolean>(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState<boolean>(false);
  const [currentCallRecordId, setCurrentCallRecordId] = useState<string | null>(null);
  const [callHistory, setCallHistory] = useState<CallRecord[]>([]);

  const timerRef = useRef<any>(null);

  const refreshCallHistory = async () => {
    try {
      const records = await fetchCallHistory();
      setCallHistory(records);
    } catch (err) {
      console.warn('[Call] Failed to fetch call history:', err);
    }
  };

  useEffect(() => {
    if (user) {
      refreshCallHistory();
    } else {
      setCallHistory([]);
    }
  }, [user]);

  // Duration timer when connected
  useEffect(() => {
    if (callState === 'connected') {
      setDuration(0);
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [callState]);

  // Socket call signaling listeners
  useEffect(() => {
    if (!user) return;

    const unsubCall = socketService.onCallEvent((evt, payload) => {
      console.log('[Call Event]', evt, payload);

      if (evt === 'call:incoming') {
        setCallPartner(payload.caller);
        setCallType(payload.callType || 'audio');
        setCallState('incoming');
      } else if (evt === 'call:accepted') {
        setCallState('connected');
      } else if (evt === 'call:rejected') {
        setCallState('ended');
        setTimeout(() => resetCall(), 2000);
      } else if (evt === 'call:ended' || evt === 'call:busy') {
        setCallState('ended');
        setTimeout(() => resetCall(), 2000);
      }
    });

    return () => {
      unsubCall();
    };
  }, [user]);

  const resetCall = () => {
    setCallState('idle');
    setCallPartner(null);
    setDuration(0);
    setIsMuted(false);
    setIsVideoEnabled(true);
    setIsSpeakerOn(false);
    setCurrentCallRecordId(null);
  };

  const startCall = async (targetUser: User, type: CallType, conversationId?: string) => {
    try {
      setCallPartner(targetUser);
      setCallType(type);
      setCallState('calling');
      setIsVideoEnabled(type === 'video');

      // Create record on server
      const record = await mutateCreateCallRecord({
        receiverId: targetUser.id,
        callType: type,
        conversationId,
      });
      setCurrentCallRecordId(record.id);

      // Signal receiver
      socketService.initiateCall(targetUser.id, type);
    } catch (err) {
      console.error('[Call] Start call failed:', err);
      resetCall();
    }
  };

  const acceptCall = async () => {
    if (!callPartner) return;
    try {
      socketService.acceptCall(callPartner.id);
      setCallState('connected');

      if (currentCallRecordId) {
        await mutateUpdateCallStatus(currentCallRecordId, 'accepted');
      }
    } catch (err) {
      console.error('[Call] Accept error:', err);
    }
  };

  const rejectCall = async () => {
    if (!callPartner) return;
    try {
      socketService.rejectCall(callPartner.id, 'rejected');
      if (currentCallRecordId) {
        await mutateUpdateCallStatus(currentCallRecordId, 'rejected');
      }
    } catch (err) {
      console.error('[Call] Reject error:', err);
    } finally {
      resetCall();
      refreshCallHistory();
    }
  };

  const endCall = async () => {
    if (callPartner) {
      socketService.endCall(callPartner.id);
    }

    if (currentCallRecordId) {
      try {
        await mutateUpdateCallStatus(currentCallRecordId, 'completed', duration);
      } catch (err) {
        console.warn('[Call] Failed updating completed call status:', err);
      }
    }

    setCallState('ended');
    setTimeout(() => {
      resetCall();
      refreshCallHistory();
    }, 1500);
  };

  const toggleMute = () => setIsMuted((p) => !p);
  const toggleVideo = () => setIsVideoEnabled((p) => !p);
  const toggleSpeaker = () => setIsSpeakerOn((p) => !p);

  return (
    <CallContext.Provider
      value={{
        callState,
        callPartner,
        callType,
        duration,
        isMuted,
        isVideoEnabled,
        isSpeakerOn,
        callHistory,
        startCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleVideo,
        toggleSpeaker,
        refreshCallHistory,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

export const useCall = (): CallContextType => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
};
