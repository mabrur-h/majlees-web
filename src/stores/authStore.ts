import { create } from 'zustand';
import { api } from '../services/api';
import { telegram } from '../services/telegram';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isTelegramAuth: boolean;
  isNewUser: boolean;
  _initialized: boolean;
  _listenerAttached: boolean;

  // Actions
  loginWithGoogle: (idToken: string) => Promise<boolean>;
  loginWithTelegram: () => Promise<boolean>;
  logout: () => void;
  fetchUser: () => Promise<void>;
  clearError: () => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: api.isAuthenticated(),
  isLoading: false,
  error: null,
  isTelegramAuth: false,
  isNewUser: false,
  _initialized: false,
  _listenerAttached: false,

  loginWithGoogle: async (idToken: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.googleAuth(idToken);
      if (response.success && response.data) {
        set({
          user: response.data.user,
          isAuthenticated: true,
          isLoading: false,
          isNewUser: (response.data as any).isNewUser ?? false,
        });
        return true;
      } else {
        set({
          error: response.error?.message || 'Google login failed',
          isLoading: false,
        });
        return false;
      }
    } catch (error) {
      set({
        error: (error as Error).message,
        isLoading: false,
      });
      return false;
    }
  },

  loginWithTelegram: async () => {
    set({ isLoading: true, error: null });

    try {
      const initDataRaw = telegram.getInitDataRaw();
      if (!initDataRaw) {
        set({ error: 'Not running inside Telegram', isLoading: false });
        return false;
      }

      const response = await api.telegramAuth(initDataRaw);
      if (response.success && response.data) {
        set({
          user: response.data.user,
          isAuthenticated: true,
          isLoading: false,
          isTelegramAuth: true,
          isNewUser: response.data.isNewUser,
        });
        return true;
      } else {
        set({
          error: response.error?.message || 'Telegram authentication failed',
          isLoading: false,
        });
        return false;
      }
    } catch (error) {
      set({
        error: (error as Error).message,
        isLoading: false,
      });
      return false;
    }
  },

  logout: () => {
    api.logout();
    set({
      user: null,
      isAuthenticated: false,
      error: null,
      isTelegramAuth: false,
      isNewUser: false,
    });
  },

  fetchUser: async () => {
    if (!api.isAuthenticated()) return;

    try {
      const response = await api.getMe();
      if (response.success && response.data) {
        set({ user: response.data.user });
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
    }
  },

  clearError: () => set({ error: null }),

  initialize: async () => {
    // Prevent multiple initializations
    if (get()._initialized) {
      return;
    }
    set({ _initialized: true });

    // Setup auth:logout event listener (fired when API detects user no longer exists)
    if (!get()._listenerAttached) {
      set({ _listenerAttached: true });
      window.addEventListener('auth:logout', () => {
        set({
          user: null,
          isAuthenticated: false,
          error: null,
          isTelegramAuth: false,
          isNewUser: false,
        });
      });
    }

    // First, try to initialize Telegram SDK
    const isTelegram = await telegram.initialize();

    if (isTelegram && telegram.isTelegramEnvironment) {
      // Auto-login with Telegram if inside Mini App
      const initDataRaw = telegram.getInitDataRaw();

      // Skip if no init data or if it looks like mock data (contains "mock" or test user id)
      const isMockData = initDataRaw?.includes('mock') || initDataRaw?.includes('"id":12345678');

      if (initDataRaw && !isMockData) {
        set({ isLoading: true });
        try {
          const response = await api.telegramAuth(initDataRaw);

          if (response.success && response.data) {
            set({
              user: response.data.user,
              isAuthenticated: true,
              isTelegramAuth: true,
              isNewUser: response.data.isNewUser,
              isLoading: false,
            });
            return;
          }
        } catch (error) {
          // Telegram auth failed, will fall back to token-based auth
        }
        set({ isLoading: false });
      }
    }

    // Fallback to existing token-based auth
    if (api.isAuthenticated()) {
      set({ isAuthenticated: true });
      const response = await api.getMe();
      if (response.success && response.data) {
        set({ user: response.data.user });
      } else {
        // Token might be invalid, clear it
        api.logout();
        set({ isAuthenticated: false, user: null });
      }
    }
  },
}));
