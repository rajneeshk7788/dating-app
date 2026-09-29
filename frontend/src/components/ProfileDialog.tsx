import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Avatar,
  CircularProgress,
  Typography,
} from '@mui/material';
import { useMutation } from '@apollo/client';
import { UPDATE_PROFILE } from '../graphql/mutations';
import { GET_CURRENT_USER } from '../graphql/queries';
import { useAuthStore } from '../store/authStore';

interface Props {
  open: boolean;
  onClose: () => void;
}

export const ProfileDialog: React.FC<Props> = ({ open, onClose }) => {
  const { user, updateUser } = useAuthStore();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [statusMessage, setStatusMessage] = useState(user?.statusMessage || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');

  const [updateProfileMutation, { loading }] = useMutation(UPDATE_PROFILE, {
    refetchQueries: [{ query: GET_CURRENT_USER }],
  });

  const handleSave = async () => {
    try {
      const res = await updateProfileMutation({
        variables: {
          input: {
            displayName,
            bio,
            statusMessage,
            avatar,
          },
        },
      });

      if (res.data?.UpdateProfile) {
        updateUser(res.data.UpdateProfile);
        onClose();
      }
    } catch (err: any) {
      alert('Failed to update profile: ' + err.message);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 700 }}>Edit Your Profile</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 2 }}>
          <Avatar
            src={avatar}
            alt={displayName}
            sx={{ width: 90, height: 90, mb: 1, border: '3px solid #38bdf8' }}
          >
            {displayName[0] || 'U'}
          </Avatar>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            DiceBear Avatar URL or Image Link
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
          <TextField
            label="Display Name"
            fullWidth
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
          <TextField
            label="Avatar Image URL"
            fullWidth
            value={avatar}
            onChange={(e) => setAvatar(e.target.value)}
          />
          <TextField
            label="Status Message"
            fullWidth
            value={statusMessage}
            onChange={(e) => setStatusMessage(e.target.value)}
          />
          <TextField
            label="Bio (Tell others about yourself)"
            fullWidth
            multiline
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2.5 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={loading}
          sx={{ borderRadius: 2, textTransform: 'none', px: 3 }}
        >
          {loading ? <CircularProgress size={24} /> : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
