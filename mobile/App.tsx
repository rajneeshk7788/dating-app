import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { ChatProvider } from './src/context/ChatContext';
import { CallProvider } from './src/context/CallContext';
import { RootNavigator } from './src/navigation/RootNavigator';

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ChatProvider>
          <CallProvider>
            <RootNavigator />
          </CallProvider>
        </ChatProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

export default App;
