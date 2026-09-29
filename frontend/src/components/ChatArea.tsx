import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Avatar,
  IconButton,
  TextField,
  Paper,
  CircularProgress,
  Badge,
  Tooltip,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import PhoneIcon from '@mui/icons-material/Phone';
import VideocamIcon from '@mui/icons-material/Videocam';
import DoneIcon from '@mui/icons-material/Done';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import { useQuery, useMutation } from '@apollo/client';
import { GET_MESSAGES, GET_CONVERSATIONS } from '../graphql/queries';
import { SEND_MESSAGE, MARK_MESSAGE_AS_READ } from '../graphql/mutations';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import { socketService } from '../services/socket/socket.service';
import { useWebRTC } from '../hooks/useWebRTC';
import { Message, User } from '../types';

export const ChatArea: React.FC = () => {
  const { user } = useAuthStore();
  const {
    selectedConversation,
    onlineUserIds,
    typingUsers,
    setTypingUser,
  } = useChatStore();

  const { startCall } = useWebRTC();
  const [content, setContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<any>(null);

  const otherParticipant: User | undefined = selectedConversation?.participants.find(
    (p) => p.id !== user?.id
  );

  const isOtherOnline = otherParticipant
    ? onlineUserIds.has(otherParticipant.id) || otherParticipant.isOnline
    : false;

  const {
    data: messagesData,
    loading: messagesLoading,
    refetch: refetchMessages,
  } = useQuery(GET_MESSAGES, {
    variables: { conversationId: selectedConversation?.id },
    skip: !selectedConversation?.id,
    fetchPolicy: 'network-only',
  });

  const [sendMessageMutation, { loading: sending }] = useMutation(SEND_MESSAGE, {
    refetchQueries: [{ query: GET_CONVERSATIONS }],
  });

  const [markReadMutation] = useMutation(MARK_MESSAGE_AS_READ);

  const messages: Message[] = messagesData?.GetMessages || [];

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Join Socket.IO conversation room
  useEffect(() => {
    if (!selectedConversation?.id) return;

    socketService.joinConversation(selectedConversation.id);

    const socket = socketService.getSocket();
    if (!socket) return;

    const handleNewMessage = (newMsg: any) => {
      if (newMsg.conversationId === selectedConversation.id) {
        refetchMessages();
        // Mark as read if received from other
        if (newMsg.sender?.id !== user?.id && newMsg.sender?._id !== user?.id) {
          markReadMutation({ variables: { messageId: newMsg.id || newMsg._id } });
          socketService.sendReadAck(selectedConversation.id, newMsg.id || newMsg._id);
        }
      }
    };

    const handleTypingStarted = (data: { conversationId: string; userId: string; username: string }) => {
      if (data.conversationId === selectedConversation.id && data.userId !== user?.id) {
        setTypingUser(data.conversationId, data.username, true);
      }
    };

    const handleTypingStopped = (data: { conversationId: string; userId: string }) => {
      if (data.conversationId === selectedConversation.id) {
        setTypingUser(data.conversationId, '', false);
      }
    };

    const handleMessageRead = (data: { conversationId: string; messageId: string }) => {
      if (data.conversationId === selectedConversation.id) {
        refetchMessages();
      }
    };

    socket.on('message:new', handleNewMessage);
    socket.on('typing:started', handleTypingStarted);
    socket.on('typing:stopped', handleTypingStopped);
    socket.on('message:read', handleMessageRead);

    return () => {
      socketService.leaveConversation(selectedConversation.id);
      socket.off('message:new', handleNewMessage);
      socket.off('typing:started', handleTypingStarted);
      socket.off('typing:stopped', handleTypingStopped);
      socket.off('message:read', handleMessageRead);
    };
  }, [selectedConversation?.id, user?.id, refetchMessages, markReadMutation, setTypingUser]);

  // Handle typing input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContent(e.target.value);
    if (!selectedConversation?.id) return;

    socketService.sendTypingStart(selectedConversation.id, user?.displayName);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socketService.sendTypingStop(selectedConversation.id);
    }, 2000);
  };

  // Send message via GraphQL mutation
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !selectedConversation?.id) return;

    const messageText = content.trim();
    setContent('');
    socketService.sendTypingStop(selectedConversation.id);

    try {
      await sendMessageMutation({
        variables: {
          conversationId: selectedConversation.id,
          content: messageText,
          type: 'text',
        },
      });
      refetchMessages();
    } catch (err: any) {
      console.error('Error sending message:', err);
    }
  };

  const handleStartCall = (type: 'audio' | 'video') => {
    if (!otherParticipant) return;
    startCall(otherParticipant, type, selectedConversation?.id);
  };

  if (!selectedConversation) {
    return (
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
          p: 3,
          textAlign: 'center',
        }}
      >
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            bgcolor: 'action.hover',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 2,
            color: 'primary.main',
          }}
        >
          <PhoneIcon fontSize="large" />
        </Box>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
          Select a chat to begin
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 400 }}>
          Experience end-to-end communication with REST authentication, GraphQL application data, Socket.IO real-time events, and peer-to-peer WebRTC video/audio calls.
        </Typography>
      </Box>
    );
  }

  const activeTypers = (typingUsers[selectedConversation.id] || []).filter(Boolean);

  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        bgcolor: 'background.default',
      }}
    >
      {/* Chat Top Header */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: 1,
          borderColor: 'divider',
          borderRadius: 0,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            variant="dot"
            sx={{
              '& .MuiBadge-badge': {
                backgroundColor: isOtherOnline ? '#22c55e' : '#94a3b8',
                boxShadow: '0 0 0 2px white',
              },
            }}
          >
            <Avatar src={otherParticipant?.avatar} alt={otherParticipant?.displayName}>
              {otherParticipant?.displayName?.[0] || 'U'}
            </Avatar>
          </Badge>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              {otherParticipant?.displayName}
            </Typography>
            <Typography variant="caption" sx={{ color: isOtherOnline ? 'success.main' : 'text.secondary' }}>
              {isOtherOnline ? 'Online via Socket.IO' : 'Offline'}
            </Typography>
          </Box>
        </Box>

        {/* Audio / Video WebRTC Call Buttons */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Voice Call (WebRTC)">
            <IconButton
              color="primary"
              onClick={() => handleStartCall('audio')}
              sx={{ bgcolor: 'action.hover' }}
            >
              <PhoneIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Video Call (WebRTC)">
            <IconButton
              color="secondary"
              onClick={() => handleStartCall('video')}
              sx={{ bgcolor: 'action.hover' }}
            >
              <VideocamIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>

      {/* Messages Scroll Area */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 2.5,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
        }}
      >
        {messagesLoading && messages.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 'auto' }}>
            <CircularProgress size={32} />
          </Box>
        ) : messages.length === 0 ? (
          <Box sx={{ textAlign: 'center', my: 'auto', color: 'text.secondary' }}>
            <Typography variant="body2">No messages yet. Say hello to {otherParticipant?.displayName}!</Typography>
          </Box>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender.id === user?.id;
            const isRead = msg.status === 'read' || (msg.readBy && msg.readBy.length > 1);

            return (
              <Box
                key={msg.id}
                sx={{
                  display: 'flex',
                  justifyContent: isMe ? 'flex-end' : 'flex-start',
                  alignItems: 'flex-end',
                  gap: 1,
                }}
              >
                {!isMe && (
                  <Avatar
                    src={msg.sender.avatar}
                    sx={{ width: 28, height: 28, mb: 0.5 }}
                  >
                    {msg.sender.displayName[0]}
                  </Avatar>
                )}
                <Paper
                  elevation={0}
                  sx={{
                    px: 2,
                    py: 1.2,
                    borderRadius: 3,
                    maxWidth: { xs: '85%', sm: '65%' },
                    bgcolor: isMe ? 'primary.main' : 'background.paper',
                    color: isMe ? 'primary.contrastText' : 'text.primary',
                    border: isMe ? 'none' : '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {msg.content}
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      gap: 0.5,
                      mt: 0.5,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: '0.68rem',
                        opacity: 0.8,
                        color: isMe ? 'primary.contrastText' : 'text.secondary',
                      }}
                    >
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Typography>
                    {isMe && (
                      isRead ? (
                        <DoneAllIcon sx={{ fontSize: 14, color: '#38bdf8' }} />
                      ) : (
                        <DoneIcon sx={{ fontSize: 14, opacity: 0.7 }} />
                      )
                    )}
                  </Box>
                </Paper>
              </Box>
            );
          })
        )}

        {/* Typing indicator banner */}
        {activeTypers.length > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
            <Typography variant="caption" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
              {activeTypers.join(', ')} is typing...
            </Typography>
          </Box>
        )}

        <div ref={messagesEndRef} />
      </Box>

      {/* Message Input Bar */}
      <Paper
        component="form"
        onSubmit={handleSendMessage}
        elevation={2}
        sx={{
          p: 1.5,
          m: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          borderRadius: 3,
          border: 1,
          borderColor: 'divider',
        }}
      >
        <TextField
          fullWidth
          size="small"
          placeholder={`Message ${otherParticipant?.displayName || ''}...`}
          value={content}
          onChange={handleInputChange}
          variant="standard"
          InputProps={{ disableUnderline: true }}
          sx={{ px: 1 }}
        />
        <IconButton
          type="submit"
          color="primary"
          disabled={!content.trim() || sending}
          sx={{
            bgcolor: 'primary.main',
            color: '#fff',
            '&:hover': { bgcolor: 'primary.dark' },
            '&.Mui-disabled': { bgcolor: 'action.disabledBackground' },
          }}
        >
          {sending ? <CircularProgress size={20} color="inherit" /> : <SendIcon fontSize="small" />}
        </IconButton>
      </Paper>
    </Box>
  );
};
