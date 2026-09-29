import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import {
  loginApi,
  registerApi,
  logoutApi,
  getMeApi,
  storeAuthSession,
  clearAuthSession,
  getStoredToken,
  getStoredUser,
  LoginParams,
  RegisterParams,
} from '../services/api';
import { initServerUrl, getServerUrl, setServerUrl } from '../config';
import { socketService } from '../services/socket';

interface AuthContextType {
  user: User | null;
  token: string | null;
  serverUrl: string;
  loading: boolean;
  login: (params: LoginParams) => Promise<void>;
  register: (params: RegisterParams) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateServerUrl: (url: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [serverUrl, setServerUrlState] = useState<string>(getServerUrl());
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize server URL and stored auth session on app boot
  useEffect(() => {
    const bootstrap = async () => {
      try {
        const activeUrl = await initServerUrl();
        setServerUrlState(activeUrl);

        const savedToken = await getStoredToken();
        const savedUser = await getStoredUser();

        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(savedUser);

          // Verify token validity with backend
          try {
            const me = await getMeApi();
            setUser(me);
            await socketService.connect();
          } catch (err) {
            console.warn('[Auth] Token validation failed:', err);
            await clearAuthSession();
            setToken(null);
            setUser(null);
          }
        } else {
          await clearAuthSession();
          setToken(null);
          setUser(null);
        }
      } catch (err) {
        console.error('[Auth] Bootstrap error:', err);
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  const login = async (params: LoginParams) => {
    setLoading(true);
    try {
      const data = await loginApi(params);
      await storeAuthSession(data.token, data.refreshToken, data.user);
      setToken(data.token);
      setUser(data.user);
      await socketService.connect();
    } finally {
      setLoading(false);
    }
  };

  const register = async (params: RegisterParams) => {
    setLoading(true);
    try {
      const data = await registerApi(params);
      await storeAuthSession(data.token, data.refreshToken, data.user);
      setToken(data.token);
      setUser(data.user);
      await socketService.connect();
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    socketService.disconnect();
    await logoutApi();
    setUser(null);
    setToken(null);
  };

  const refreshUser = async () => {
    try {
      const me = await getMeApi();
      setUser(me);
    } catch (err) {
      console.error('[Auth] Refresh user error:', err);
    }
  };

  const updateServerUrl = async (url: string) => {
    await setServerUrl(url);
    setServerUrlState(getServerUrl());
    socketService.disconnect();
    if (token) {
      await socketService.connect();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        serverUrl,
        loading,
        login,
        register,
        logout,
        refreshUser,
        updateServerUrl,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
