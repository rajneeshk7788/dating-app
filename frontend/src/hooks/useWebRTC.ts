import { useEffect, useRef, useCallback } from 'react';
import { useCallStore } from '../store/callStore';
import { useAuthStore } from '../store/authStore';
import { socketService } from '../services/socket/socket.service';
import { WebRTCService } from '../services/webrtc/webrtc.service';
import { CallType } from '../types';

export const useWebRTC = () => {
  const { user } = useAuthStore();
  const {
    callStatus,
    callType,
    callId,
    remoteUser,
    incomingCall,
    isMicMuted,
    isCameraOff,
    callDuration,
    setCallStatus,
    setCallType,
    setCallId,
    setRemoteUser,
    setIncomingCall,
    setIsMicMuted,
    setIsCameraOff,
    setCallDuration,
    setLocalStream,
    setRemoteStream,
    resetCall,
  } = useCallStore();

  const webrtcRef = useRef<WebRTCService | null>(null);
  const timerRef = useRef<any>(null);

  // Initialize WebRTC service instance
  useEffect(() => {
    const rtc = new WebRTCService(
      (remoteStream) => {
        setRemoteStream(remoteStream);
      },
      (candidate) => {
        const targetId = remoteUser?.id || incomingCall?.caller?.id;
        if (targetId) {
          socketService.sendIceCandidate({ targetUserId: targetId, candidate });
        }
      }
    );
    webrtcRef.current = rtc;

    return () => {
      rtc.cleanup();
    };
  }, [remoteUser?.id, incomingCall?.caller?.id]);

  // Duration Timer when call is connected
  useEffect(() => {
    if (callStatus === 'connected') {
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
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
  }, [callStatus]);

  // Socket listener registration
  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket) return;

    // Incoming Call listener
    const handleIncomingCall = (data: any) => {
      console.log('[WebRTC Hook] Received incoming call:', data);
      setIncomingCall({
        callId: data.callId,
        caller: data.caller,
        callType: data.callType,
        conversationId: data.conversationId,
        offer: data.offer,
      });
    };

    // Caller receives acceptance
    const handleCallAccepted = async (data: any) => {
      console.log('[WebRTC Hook] Call accepted by peer:', data);
      if (data.answer && webrtcRef.current) {
        await webrtcRef.current.setRemoteAnswer(data.answer);
      }
      setCallStatus('connected');
    };

    // Caller receives rejection
    const handleCallRejected = (data: any) => {
      console.log('[WebRTC Hook] Call rejected by peer:', data);
      alert(`Call was declined: ${data.reason || 'user busy'}`);
      endCallCleanup();
    };

    // Call ended by remote peer
    const handleCallEnded = (data: any) => {
      console.log('[WebRTC Hook] Call ended by peer:', data);
      endCallCleanup();
    };

    // Remote ICE candidate received
    const handleRemoteIceCandidate = async (data: any) => {
      if (data.candidate && webrtcRef.current) {
        await webrtcRef.current.addIceCandidate(data.candidate);
      }
    };

    socket.on('call:incoming', handleIncomingCall);
    socket.on('call:accepted', handleCallAccepted);
    socket.on('call:rejected', handleCallRejected);
    socket.on('call:ended', handleCallEnded);
    socket.on('webrtc:ice-candidate', handleRemoteIceCandidate);

    return () => {
      socket.off('call:incoming', handleIncomingCall);
      socket.off('call:accepted', handleCallAccepted);
      socket.off('call:rejected', handleCallRejected);
      socket.off('call:ended', handleCallEnded);
      socket.off('webrtc:ice-candidate', handleRemoteIceCandidate);
    };
  }, [incomingCall, remoteUser]);

  const endCallCleanup = useCallback(() => {
    if (webrtcRef.current) {
      webrtcRef.current.cleanup();
    }
    resetCall();
  }, [resetCall]);

  // Initiate an outgoing call
  const startCall = useCallback(
    async (
      targetUser: { id: string; displayName: string; avatar?: string; username?: string },
      type: CallType,
      conversationId?: string
    ) => {
      try {
        setCallType(type);
        setRemoteUser(targetUser);
        setCallStatus('calling');

        // Start media
        const stream = await webrtcRef.current!.startLocalMedia(type === 'video', true);
        setLocalStream(stream);

        // Create Peer Connection and SDP offer
        const offer = await webrtcRef.current!.createOffer();

        // Emit call initiation via Socket.IO
        socketService.initiateCall({
          receiverId: targetUser.id,
          callType: type,
          conversationId,
          offer,
        });
      } catch (err: any) {
        console.error('[WebRTC Hook] Start call failed:', err);
        alert('Could not start call: ' + err.message);
        endCallCleanup();
      }
    },
    [setCallType, setRemoteUser, setCallStatus, setLocalStream, endCallCleanup]
  );

  // Accept incoming call
  const acceptCall = useCallback(async () => {
    if (!incomingCall) return;

    try {
      setCallType(incomingCall.callType);
      setCallId(incomingCall.callId);
      setRemoteUser(incomingCall.caller);
      setCallStatus('connected');

      // Start local media
      const stream = await webrtcRef.current!.startLocalMedia(
        incomingCall.callType === 'video',
        true
      );
      setLocalStream(stream);

      // Create Answer from offer
      const answer = await webrtcRef.current!.createAnswer(incomingCall.offer);

      // Send answer via Socket.IO
      socketService.acceptCall({
        callerId: incomingCall.caller.id,
        callId: incomingCall.callId,
        answer,
      });

      setIncomingCall(null);
    } catch (err: any) {
      console.error('[WebRTC Hook] Accept call failed:', err);
      endCallCleanup();
    }
  }, [incomingCall, setCallType, setCallId, setRemoteUser, setCallStatus, setLocalStream, setIncomingCall, endCallCleanup]);

  // Reject incoming call
  const rejectCall = useCallback(() => {
    if (!incomingCall) return;

    socketService.rejectCall({
      callerId: incomingCall.caller.id,
      callId: incomingCall.callId,
      reason: 'declined',
    });

    setIncomingCall(null);
  }, [incomingCall, setIncomingCall]);

  // End active call
  const endCall = useCallback(() => {
    const targetId = remoteUser?.id || incomingCall?.caller?.id;
    if (targetId) {
      socketService.endCall({
        targetUserId: targetId,
        callId: callId || undefined,
        duration: callDuration,
      });
    }
    endCallCleanup();
  }, [remoteUser, incomingCall, callId, callDuration, endCallCleanup]);

  // Toggle Mute Audio
  const toggleMute = useCallback(() => {
    if (webrtcRef.current) {
      const isMuted = !isMicMuted;
      webrtcRef.current.toggleAudio(!isMuted);
      setIsMicMuted(isMuted);
    }
  }, [isMicMuted, setIsMicMuted]);

  // Toggle Video Camera
  const toggleVideo = useCallback(() => {
    if (webrtcRef.current) {
      const isOff = !isCameraOff;
      webrtcRef.current.toggleVideo(!isOff);
      setIsCameraOff(isOff);
    }
  }, [isCameraOff, setIsCameraOff]);

  return {
    callStatus,
    callType,
    remoteUser,
    incomingCall,
    isMicMuted,
    isCameraOff,
    callDuration,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
  };
};
