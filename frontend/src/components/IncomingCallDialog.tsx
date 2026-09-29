import React from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Avatar,
  IconButton,
  keyframes,
} from '@mui/material';
import CallEndIcon from '@mui/icons-material/CallEnd';
import CallIcon from '@mui/icons-material/Call';
import VideocamIcon from '@mui/icons-material/Videocam';
import { useWebRTC } from '../hooks/useWebRTC';

const pulse = keyframes`
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7); }
  70% { transform: scale(1.05); box-shadow: 0 0 0 20px rgba(76, 175, 80, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(76, 175, 80, 0); }
`;

export const IncomingCallDialog: React.FC = () => {
  const { incomingCall, acceptCall, rejectCall } = useWebRTC();

  if (!incomingCall) return null;

  const isVideo = incomingCall.callType === 'video';

  return (
    <Dialog
      open={!!incomingCall}
      disableEscapeKeyDown
      PaperProps={{
        sx: {
          borderRadius: 4,
          p: 3,
          textAlign: 'center',
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          color: '#fff',
          minWidth: 320,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        },
      }}
    >
      <DialogContent sx={{ p: 1 }}>
        <Typography variant="overline" sx={{ letterSpacing: 2, color: '#38bdf8' }}>
          Incoming {isVideo ? 'Video' : 'Audio'} Call...
        </Typography>

        <Box sx={{ my: 3, display: 'flex', justifyContent: 'center' }}>
          <Box sx={{ animation: `${pulse} 2s infinite`, borderRadius: '50%' }}>
            <Avatar
              src={incomingCall.caller?.avatar}
              alt={incomingCall.caller?.displayName}
              sx={{ width: 100, height: 100, border: '3px solid #38bdf8' }}
            >
              {incomingCall.caller?.displayName?.[0] || 'C'}
            </Avatar>
          </Box>
        </Box>

        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
          {incomingCall.caller?.displayName || 'Unknown Caller'}
        </Typography>

        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4 }}>
          @{incomingCall.caller?.username || 'user'} is calling you
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4 }}>
          {/* Decline Button */}
          <Box sx={{ textAlign: 'center' }}>
            <IconButton
              onClick={rejectCall}
              sx={{
                bgcolor: '#ef4444',
                color: '#fff',
                width: 60,
                height: 60,
                '&:hover': { bgcolor: '#dc2626' },
                boxShadow: '0 8px 16px rgba(239, 68, 68, 0.4)',
              }}
            >
              <CallEndIcon fontSize="large" />
            </IconButton>
            <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#94a3b8' }}>
              Decline
            </Typography>
          </Box>

          {/* Accept Button */}
          <Box sx={{ textAlign: 'center' }}>
            <IconButton
              onClick={acceptCall}
              sx={{
                bgcolor: '#22c55e',
                color: '#fff',
                width: 60,
                height: 60,
                '&:hover': { bgcolor: '#16a34a' },
                boxShadow: '0 8px 16px rgba(34, 197, 94, 0.4)',
              }}
            >
              {isVideo ? <VideocamIcon fontSize="large" /> : <CallIcon fontSize="large" />}
            </IconButton>
            <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#94a3b8' }}>
              Accept
            </Typography>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};
