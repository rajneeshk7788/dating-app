import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { AuthResponse, User } from '../../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/auth';

class AuthService {
  private api: AxiosInstance;
  private isRefreshing = false;
  private refreshSubscribers: ((token: string) => void)[] = [];

  constructor() {
    this.api = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to attach access token
    this.api.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = this.getAccessToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle auto token refresh on 401
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (originalRequest.url?.includes('/login') || originalRequest.url?.includes('/register') || originalRequest.url?.includes('/refresh-token')) {
            return Promise.reject(error);
          }

          if (this.isRefreshing) {
            return new Promise((resolve) => {
              this.refreshSubscribers.push((token: string) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                resolve(this.api(originalRequest));
              });
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const refreshToken = this.getRefreshToken();
            if (!refreshToken) {
              this.clearTokens();
              return Promise.reject(error);
            }

            const response = await axios.post(`${API_URL}/refresh-token`, { refreshToken });
            const { accessToken, refreshToken: newRefreshToken } = response.data.data;

            this.setTokens(accessToken, newRefreshToken);
            this.onRefreshed(accessToken);

            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return this.api(originalRequest);
          } catch (refreshErr) {
            this.clearTokens();
            return Promise.reject(refreshErr);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private onRefreshed(token: string) {
    this.refreshSubscribers.forEach((cb) => cb(token));
    this.refreshSubscribers = [];
  }

  // Token Storage Helpers
  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  setTokens(accessToken: string, refreshToken: string) {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  }

  clearTokens() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('cached_user');
  }

  // REST API Methods (Strictly Authentication Only)
  async register(data: {
    username: string;
    email: string;
    password: string;
    displayName: string;
    gender?: string;
    bio?: string;
  }): Promise<AuthResponse> {
    const res = await this.api.post('/register', data);
    const authData: AuthResponse = res.data.data;
    this.setTokens(authData.accessToken, authData.refreshToken);
    localStorage.setItem('cached_user', JSON.stringify(authData.user));
    return authData;
  }

  async login(data: { email: string; password: string }): Promise<AuthResponse> {
    const res = await this.api.post('/login', data);
    const authData: AuthResponse = res.data.data;
    this.setTokens(authData.accessToken, authData.refreshToken);
    localStorage.setItem('cached_user', JSON.stringify(authData.user));
    return authData;
  }

  async logout(): Promise<void> {
    try {
      const refreshToken = this.getRefreshToken();
      await this.api.post('/logout', { refreshToken });
    } catch (err) {
      console.warn('Logout error (clearing local state anyway):', err);
    } finally {
      this.clearTokens();
    }
  }

  async refreshToken(): Promise<{ accessToken: string; refreshToken: string }> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) throw new Error('No refresh token available');
    const res = await this.api.post('/refresh-token', { refreshToken });
    const { accessToken, refreshToken: newRefreshToken } = res.data.data;
    this.setTokens(accessToken, newRefreshToken);
    return { accessToken, refreshToken: newRefreshToken };
  }

  async forgotPassword(email: string): Promise<{ message: string; resetToken?: string }> {
    const res = await this.api.post('/forgot-password', { email });
    return res.data;
  }

  async resetPassword(data: { resetToken: string; newPassword: string }): Promise<{ message: string }> {
    const res = await this.api.post('/reset-password', data);
    return res.data;
  }

  async getMe(): Promise<User> {
    const res = await this.api.get('/me');
    const user: User = res.data.data.user;
    localStorage.setItem('cached_user', JSON.stringify(user));
    return user;
  }
}

export const authService = new AuthService();
