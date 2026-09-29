import React from 'react';
import { Box } from '@mui/material';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { ChatArea } from '../components/ChatArea';
import { CallModal } from '../components/CallModal';
import { IncomingCallDialog } from '../components/IncomingCallDialog';
import { UserSearchDialog } from '../components/UserSearchDialog';
import { ProfileDialog } from '../components/ProfileDialog';
import { useChatStore } from '../store/chatStore';

export const ChatDashboardPage: React.FC = () => {
  const {
    searchDialogOpen,
    setSearchDialogOpen,
    profileDialogOpen,
    setProfileDialogOpen,
  } = useChatStore();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        bgcolor: 'background.default',
      }}
    >
      <Navbar />

      <Box
        sx={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden',
        }}
      >
        <Sidebar />
        <ChatArea />
      </Box>

      {/* Global Modals for Real-Time & WebRTC */}
      <CallModal />
      <IncomingCallDialog />
      <UserSearchDialog
        open={searchDialogOpen}
        onClose={() => setSearchDialogOpen(false)}
      />
      <ProfileDialog
        open={profileDialogOpen}
        onClose={() => setProfileDialogOpen(false)}
      />
    </Box>
  );
};
