import React, { useEffect, useRef } from 'react';
import {
  Dialog,
  Box,
  Typography,
  IconButton,
  Avatar,
} from '@mui/material';
import CallEndIcon from '@mui/icons-material/CallEnd';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import { useCallStore } from '../store/callStore';
import { useWebRTC } from '../hooks/useWebRTC';

export const CallModal: React.FC = () => {
  const {
    callStatus,
    callType,
    remoteUser,
    isMicMuted,
    isCameraOff,
    callDuration,
    localStream,
    remoteStream,
  } = useCallStore();

  const { endCall, toggleMute, toggleVideo } = useWebRTC();

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  // Attach local stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Attach remote stream
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const isOpen = callStatus === 'calling' || callStatus === 'connected';

  if (!isOpen) return null;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isVideo = callType === 'video';

  return (
    <Dialog
      fullScreen
      open={isOpen}
      PaperProps={{
        sx: {
          bgcolor: '#0a0f1d',
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        },
      }}
    >
      {/* Top Header */}
      <Box
        sx={{
          position: 'absolute',
          top: 24,
          left: 24,
          right: 24,
          zIndex: 10,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backdropFilter: 'blur(10px)',
          bgcolor: 'rgba(15, 23, 42, 0.65)',
          px: 3,
          py: 1.5,
          borderRadius: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar src={remoteUser?.avatar} alt={remoteUser?.displayName}>
            {remoteUser?.displayName?.[0] || 'U'}
          </Avatar>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {remoteUser?.displayName || 'Peer'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#38bdf8' }}>
              {callStatus === 'calling' ? 'Calling...' : `In Call • ${formatDuration(callDuration)}`}
            </Typography>
          </Box>
        </Box>
        <Typography variant="body2" sx={{ bgcolor: 'rgba(255,255,255,0.1)', px: 2, py: 0.5, borderRadius: 2 }}>
          {isVideo ? 'WebRTC HD Video' : 'WebRTC HD Audio'}
        </Typography>
      </Box>

      {/* Main View Area */}
      <Box
        sx={{
          flex: 1,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {isVideo ? (
          <>
            {/* Remote Peer Video Stream */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />

            {/* Local Picture-in-Picture Video Stream */}
            <Box
              sx={{
                position: 'absolute',
                bottom: 120,
                right: 32,
                width: { xs: 120, sm: 220 },
                height: { xs: 160, sm: 290 },
                borderRadius: 3,
                overflow: 'hidden',
                boxShadow: '0 10px 25px rgba(0,0,0,0.6)',
                border: '2px solid rgba(255,255,255,0.2)',
                bgcolor: '#1e293b',
                zIndex: 5,
              }}
            >
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transform: 'scaleX(-1)', // Mirror local camera
                }}
              />
              {isCameraOff && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    bgcolor: 'rgba(0,0,0,0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <VideocamOffIcon sx={{ color: '#94a3b8' }} />
                </Box>
              )}
            </Box>
          </>
        ) : (
          /* Voice Call UI */
          <Box sx={{ textAlign: 'center', my: 'auto' }}>
            <Avatar
              src={remoteUser?.avatar}
              alt={remoteUser?.displayName}
              sx={{
                width: 140,
                height: 140,
                mx: 'auto',
                mb: 3,
                border: '4px solid #38bdf8',
                boxShadow: '0 0 40px rgba(56, 189, 248, 0.4)',
              }}
            >
              {remoteUser?.displayName?.[0] || 'U'}
            </Avatar>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              {remoteUser?.displayName}
            </Typography>
            <Typography variant="h6" sx={{ color: '#38bdf8' }}>
              {callStatus === 'calling' ? 'Calling...' : formatDuration(callDuration)}
            </Typography>
            {/* Hidden audio element for remote stream */}
            <audio ref={remoteVideoRef as any} autoPlay />
          </Box>
        )}
      </Box>

      {/* Bottom Floating Control Bar */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 32,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          gap: 3,
          zIndex: 10,
        }}
      >
        {/* Toggle Microphone */}
        <IconButton
          onClick={toggleMute}
          sx={{
            width: 56,
            height: 56,
            bgcolor: isMicMuted ? '#ef4444' : 'rgba(255, 255, 255, 0.15)',
            color: '#fff',
            backdropFilter: 'blur(10px)',
            '&:hover': { bgcolor: isMicMuted ? '#dc2626' : 'rgba(255, 255, 255, 0.25)' },
          }}
        >
          {isMicMuted ? <MicOffIcon /> : <MicIcon />}
        </IconButton>

        {/* Toggle Camera (if video call) */}
        {isVideo && (
          <IconButton
            onClick={toggleVideo}
            sx={{
              width: 56,
              height: 56,
              bgcolor: isCameraOff ? '#ef4444' : 'rgba(255, 255, 255, 0.15)',
              color: '#fff',
              backdropFilter: 'blur(10px)',
              '&:hover': { bgcolor: isCameraOff ? '#dc2626' : 'rgba(255, 255, 255, 0.25)' },
            }}
          >
            {isCameraOff ? <VideocamOffIcon /> : <VideocamIcon />}
          </IconButton>
        )}

        {/* Hang Up Button */}
        <IconButton
          onClick={endCall}
          sx={{
            width: 56,
            height: 56,
            bgcolor: '#ef4444',
            color: '#fff',
            '&:hover': { bgcolor: '#dc2626' },
            boxShadow: '0 8px 20px rgba(239, 68, 68, 0.5)',
          }}
        >
          <CallEndIcon fontSize="large" />
        </IconButton>
      </Box>
    </Dialog>
  );
};
