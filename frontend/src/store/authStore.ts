import { create } from 'zustand';
import { User } from '../types';
import { authService } from '../services/auth/auth.service';
import { socketService } from '../services/socket/socket.service';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  initAuth: () => Promise<void>;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (data: {
    username: string;
    email: string;
    password: string;
    displayName: string;
    gender?: string;
    bio?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: !!authService.getAccessToken(),
  isLoading: true,
  error: null,

  initAuth: async () => {
    const token = authService.getAccessToken();
    if (!token) {
      set({ user: null, isAuthenticated: false, isLoading: false });
      return;
    }

    try {
      set({ isLoading: true, error: null });
      const user = await authService.getMe();
      set({ user, isAuthenticated: true, isLoading: false });
      // Connect Socket.IO
      socketService.connect();
    } catch (err: any) {
      console.warn('Auth initialization failed:', err.message);
      authService.clearTokens();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (credentials) => {
    try {
      set({ isLoading: true, error: null });
      const authData = await authService.login(credentials);
      set({ user: authData.user, isAuthenticated: true, isLoading: false });
      // Connect Socket.IO
      socketService.connect();
    } catch (err: any) {
      set({
        isLoading: false,
        error: err.response?.data?.message || err.message || 'Login failed',
      });
      throw err;
    }
  },

  register: async (data) => {
    try {
      set({ isLoading: true, error: null });
      const authData = await authService.register(data);
      set({ user: authData.user, isAuthenticated: true, isLoading: false });
      // Connect Socket.IO
      socketService.connect();
    } catch (err: any) {
      set({
        isLoading: false,
        error: err.response?.data?.message || err.message || 'Registration failed',
      });
      throw err;
    }
  },

  logout: async () => {
    try {
      set({ isLoading: true });
      await authService.logout();
    } finally {
      socketService.disconnect();
      set({ user: null, isAuthenticated: false, isLoading: false, error: null });
    }
  },

  updateUser: (partialUser) => {
    const current = get().user;
    if (current) {
      const updated = { ...current, ...partialUser };
      set({ user: updated });
      localStorage.setItem('cached_user', JSON.stringify(updated));
    }
  },

  clearError: () => set({ error: null }),
}));
