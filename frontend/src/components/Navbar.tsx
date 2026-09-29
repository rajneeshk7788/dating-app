import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Chip,
  Tooltip,
  useTheme,
} from '@mui/material';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { useChatStore } from '../store/chatStore';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { mode, toggleTheme } = useThemeStore();
  const { setSearchDialogOpen, setProfileDialogOpen } = useChatStore();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleOpenProfile = () => {
    handleCloseMenu();
    setProfileDialogOpen(true);
  };

  const handleLogout = async () => {
    handleCloseMenu();
    await logout();
  };

  return (
    <AppBar
      position="static"
      color="default"
      elevation={1}
      sx={{
        borderBottom: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        {/* Brand */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: 2.5,
              background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
              color: '#fff',
            }}
          >
            <WhatshotIcon />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.1 }}>
              ConnectPulse
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
              Dating & Real-Time Peer Calling
            </Typography>
          </Box>
        </Box>

        {/* Architecture Badges & Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, mr: 2 }}>
            <Chip label="REST Auth" size="small" color="primary" variant="outlined" />
            <Chip label="GraphQL Data" size="small" color="secondary" variant="outlined" />
            <Chip label="Socket.IO Real-Time" size="small" color="success" variant="outlined" />
            <Chip label="WebRTC P2P" size="small" color="info" variant="outlined" />
          </Box>

          {/* Discover / Search Users Button */}
          <Tooltip title="Find People">
            <IconButton onClick={() => setSearchDialogOpen(true)} color="primary">
              <PersonSearchIcon />
            </IconButton>
          </Tooltip>

          {/* Dark / Light Toggle */}
          <Tooltip title={mode === 'dark' ? 'Switch to Light' : 'Switch to Dark'}>
            <IconButton onClick={toggleTheme}>
              {mode === 'dark' ? <LightModeIcon sx={{ color: '#facc15' }} /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>

          {/* User Profile Avatar / Menu */}
          <Box sx={{ ml: 1 }}>
            <IconButton onClick={handleOpenMenu} sx={{ p: 0 }}>
              <Avatar
                src={user?.avatar}
                alt={user?.displayName}
                sx={{ width: 38, height: 38, border: '2px solid #8b5cf6' }}
              >
                {user?.displayName?.[0] || 'U'}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleCloseMenu}
              PaperProps={{ sx: { minWidth: 180, borderRadius: 2, mt: 1.5 } }}
            >
              <Box sx={{ px: 2, py: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {user?.displayName}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  @{user?.username}
                </Typography>
              </Box>
              <MenuItem onClick={handleOpenProfile}>
                <AccountCircleIcon fontSize="small" sx={{ mr: 1.5, color: 'text.secondary' }} />
                Edit Profile
              </MenuItem>
              <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                <LogoutIcon fontSize="small" sx={{ mr: 1.5 }} />
                Logout (REST)
              </MenuItem>
            </Menu>
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
};
