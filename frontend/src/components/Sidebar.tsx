import React, { useEffect } from 'react';
import {
  Box,
  Tabs,
  Tab,
  List,
  ListItemButton,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Badge,
  Typography,
  CircularProgress,
  IconButton,
  Divider,
} from '@mui/material';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import PhoneIcon from '@mui/icons-material/Phone';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import CallMadeIcon from '@mui/icons-material/CallMade';
import CallReceivedIcon from '@mui/icons-material/CallReceived';
import VideocamIcon from '@mui/icons-material/Videocam';
import { useQuery } from '@apollo/client';
import { GET_CONVERSATIONS, GET_CALL_HISTORY } from '../graphql/queries';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import { socketService } from '../services/socket/socket.service';
import { Conversation, CallRecord, User } from '../types';

export const Sidebar: React.FC = () => {
  const { user } = useAuthStore();
  const {
    activeTab,
    setActiveTab,
    selectedConversation,
    setSelectedConversation,
    onlineUserIds,
    setOnlineUsers,
    addOnlineUser,
    removeOnlineUser,
    setSearchDialogOpen,
  } = useChatStore();

  const {
    data: convData,
    loading: convLoading,
    refetch: refetchConversations,
  } = useQuery(GET_CONVERSATIONS, {
    pollInterval: 15000,
  });

  const {
    data: callData,
    loading: callLoading,
    refetch: refetchCalls,
  } = useQuery(GET_CALL_HISTORY, {
    skip: activeTab !== 'calls',
  });

  // Listen to Socket.IO Presence and Chat events
  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket) return;

    // Get current online users
    socket.emit('users:get_online', (users: string[]) => {
      setOnlineUsers(users);
    });

    const handleUserOnline = (data: { userId: string }) => {
      addOnlineUser(data.userId);
    };

    const handleUserOffline = (data: { userId: string }) => {
      removeOnlineUser(data.userId);
    };

    const handleOnlineList = (list: string[]) => {
      setOnlineUsers(list);
    };

    const handleNewMessage = () => {
      refetchConversations();
    };

    const handleConversationCreated = () => {
      refetchConversations();
    };

    socket.on('user:online', handleUserOnline);
    socket.on('user:offline', handleUserOffline);
    socket.on('users:online_list', handleOnlineList);
    socket.on('message:new', handleNewMessage);
    socket.on('conversation:created', handleConversationCreated);

    return () => {
      socket.off('user:online', handleUserOnline);
      socket.off('user:offline', handleUserOffline);
      socket.off('users:online_list', handleOnlineList);
      socket.off('message:new', handleNewMessage);
      socket.off('conversation:created', handleConversationCreated);
    };
  }, [setOnlineUsers, addOnlineUser, removeOnlineUser, refetchConversations]);

  const conversations: Conversation[] = convData?.GetConversations || [];
  const calls: CallRecord[] = callData?.GetCallHistory || [];

  const getOtherParticipant = (conv: Conversation): User | undefined => {
    return conv.participants.find((p) => p.id !== user?.id);
  };

  const getUnreadCount = (conv: Conversation): number => {
    const entry = conv.unreadCounts.find((u) => u.userId === user?.id);
    return entry ? entry.count : 0;
  };

  return (
    <Box
      sx={{
        width: { xs: '100%', sm: 340, md: 380 },
        borderRight: 1,
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        bgcolor: 'background.paper',
      }}
    >
      {/* Header Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2, pt: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          sx={{ minHeight: 48 }}
        >
          <Tab
            value="chats"
            icon={<ChatBubbleIcon fontSize="small" />}
            iconPosition="start"
            label="Chats"
            sx={{ textTransform: 'none', fontWeight: 600, minHeight: 48 }}
          />
          <Tab
            value="calls"
            icon={<PhoneIcon fontSize="small" />}
            iconPosition="start"
            label="Call Logs"
            sx={{ textTransform: 'none', fontWeight: 600, minHeight: 48 }}
          />
        </Tabs>

        <IconButton
          color="primary"
          size="small"
          onClick={() => setSearchDialogOpen(true)}
          title="New Chat / Find Matches"
          sx={{ bgcolor: 'action.hover' }}
        >
          <PersonAddAlt1Icon fontSize="small" />
        </IconButton>
      </Box>

      {/* List content */}
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        {activeTab === 'chats' ? (
          convLoading && conversations.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress size={30} />
            </Box>
          ) : conversations.length === 0 ? (
            <Box sx={{ textAlign: 'center', p: 4, color: 'text.secondary' }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>No conversations yet</Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Search for other users and start a chat or video call!
              </Typography>
            </Box>
          ) : (
            <List disablePadding>
              {conversations.map((conv) => {
                const other = getOtherParticipant(conv);
                if (!other) return null;
                const isOnline = onlineUserIds.has(other.id) || other.isOnline;
                const unread = getUnreadCount(conv);
                const isSelected = selectedConversation?.id === conv.id;

                return (
                  <ListItemButton
                    key={conv.id}
                    selected={isSelected}
                    onClick={() => setSelectedConversation(conv)}
                    sx={{
                      py: 1.5,
                      px: 2,
                      borderLeft: isSelected ? '4px solid #8b5cf6' : '4px solid transparent',
                    }}
                  >
                    <ListItemAvatar>
                      <Badge
                        overlap="circular"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        variant="dot"
                        sx={{
                          '& .MuiBadge-badge': {
                            backgroundColor: isOnline ? '#22c55e' : '#94a3b8',
                            boxShadow: '0 0 0 2px white',
                          },
                        }}
                      >
                        <Avatar src={other.avatar} alt={other.displayName}>
                          {other.displayName[0]}
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }} noWrap>
                            {other.displayName}
                          </Typography>
                          {conv.lastMessage && (
                            <Typography variant="caption" sx={{ color: 'text.secondary', ml: 1 }}>
                              {new Date(conv.lastMessage.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </Typography>
                          )}
                        </Box>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              color: unread > 0 ? 'text.primary' : 'text.secondary',
                              fontWeight: unread > 0 ? 600 : 400,
                              fontSize: '0.85rem',
                              maxWidth: 180,
                            }}
                            noWrap
                          >
                            {conv.lastMessage?.content || other.bio || 'Start a conversation'}
                          </Typography>
                          {unread > 0 && (
                            <Badge
                              badgeContent={unread}
                              color="primary"
                              sx={{ ml: 1 }}
                            />
                          )}
                        </Box>
                      }
                    />
                  </ListItemButton>
                );
              })}
            </List>
          )
        ) : (
          /* Calls History List */
          callLoading && calls.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress size={30} />
            </Box>
          ) : calls.length === 0 ? (
            <Box sx={{ textAlign: 'center', p: 4, color: 'text.secondary' }}>
              <Typography variant="subtitle2">No call history recorded yet.</Typography>
            </Box>
          ) : (
            <List disablePadding>
              {calls.map((call) => {
                const isOutgoing = call.caller.id === user?.id;
                const peer = isOutgoing ? call.receiver : call.caller;
                const isVideo = call.callType === 'video';

                return (
                  <ListItemButton key={call.id} sx={{ py: 1.5, px: 2 }}>
                    <ListItemAvatar>
                      <Avatar src={peer?.avatar}>{peer?.displayName?.[0]}</Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {peer?.displayName}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {new Date(call.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mt: 0.5 }}>
                          {isOutgoing ? (
                            <CallMadeIcon fontSize="small" sx={{ color: '#38bdf8' }} />
                          ) : (
                            <CallReceivedIcon
                              fontSize="small"
                              sx={{ color: call.status === 'missed' ? '#ef4444' : '#22c55e' }}
                            />
                          )}
                          {isVideo ? (
                            <VideocamIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                          ) : (
                            <PhoneIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                          )}
                          <Typography variant="caption" sx={{ textTransform: 'capitalize' }}>
                            {call.status} {call.duration > 0 && `(${call.duration}s)`}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItemButton>
                );
              })}
            </List>
          )
        )}
      </Box>
    </Box>
  );
};
