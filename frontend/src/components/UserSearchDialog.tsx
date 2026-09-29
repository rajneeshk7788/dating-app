import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Button,
  Box,
  Typography,
  CircularProgress,
  Badge,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import { useQuery, useMutation } from '@apollo/client';
import { SEARCH_USERS, GET_CONVERSATIONS } from '../graphql/queries';
import { CREATE_CONVERSATION } from '../graphql/mutations';
import { useChatStore } from '../store/chatStore';
import { User } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
}

export const UserSearchDialog: React.FC<Props> = ({ open, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { setSelectedConversation, onlineUserIds } = useChatStore();

  const { data, loading, error } = useQuery(SEARCH_USERS, {
    variables: { query: searchTerm },
    fetchPolicy: 'network-only',
    skip: !open,
  });

  const [createConversation, { loading: creating }] = useMutation(CREATE_CONVERSATION, {
    refetchQueries: [{ query: GET_CONVERSATIONS }],
  });

  const handleStartChat = async (user: User) => {
    try {
      const res = await createConversation({
        variables: { participantId: user.id },
      });
      if (res.data?.CreateConversation) {
        setSelectedConversation(res.data.CreateConversation);
        onClose();
      }
    } catch (err: any) {
      alert('Failed to start conversation: ' + err.message);
    }
  };

  const users: User[] = data?.SearchUsers || [];

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ pb: 1, fontWeight: 700 }}>Discover People & Start Chatting</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, mt: 1 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search by name or username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
            }}
          />
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={32} />
          </Box>
        ) : users.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
            <Typography variant="body1">No users found matching your search.</Typography>
          </Box>
        ) : (
          <List sx={{ pt: 0 }}>
            {users.map((user) => {
              const isOnline = onlineUserIds.has(user.id) || user.isOnline;
              return (
                <ListItem
                  key={user.id}
                  sx={{
                    borderRadius: 2,
                    mb: 1,
                    bgcolor: 'action.hover',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  secondaryAction={
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<ChatBubbleOutlineIcon />}
                      disabled={creating}
                      onClick={() => handleStartChat(user)}
                      sx={{ borderRadius: 2, textTransform: 'none' }}
                    >
                      Chat
                    </Button>
                  }
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
                      <Avatar src={user.avatar} alt={user.displayName}>
                        {user.displayName[0]}
                      </Avatar>
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {user.displayName}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          @{user.username}
                        </Typography>
                      </Box>
                    }
                    secondary={user.bio || user.statusMessage || 'ConnectPulse member'}
                  />
                </ListItem>
              );
            })}
          </List>
        )}
      </DialogContent>
    </Dialog>
  );
};
