import { create } from 'zustand';
import { api } from '../services/api';

export interface ConfigLogEntry {
  time: string;
  message: string;
  type: 'info' | 'success' | 'error';
}

interface ConfigState {
  apiUrl: string;
  isConnected: boolean;
  isTesting: boolean;
  logs: ConfigLogEntry[];

  // Actions
  setApiUrl: (url: string) => void;
  testConnection: () => Promise<void>;
  addLog: (message: string, type?: 'info' | 'success' | 'error') => void;
  clearLogs: () => void;
}

const getTimeString = () => new Date().toLocaleTimeString();

export const useConfigStore = create<ConfigState>((set, get) => ({
  apiUrl: api.getBaseUrl(),
  isConnected: false,
  isTesting: false,
  logs: [],

  setApiUrl: (url: string) => {
    api.setBaseUrl(url);
    set({ apiUrl: url, isConnected: false });
  },

  testConnection: async () => {
    set({ isTesting: true });
    const result = await api.testConnection();

    if (result.ok) {
      get().addLog(`Connected to ${api.getBaseUrl()} - Status: ${result.status}`, 'success');
      set({ isConnected: true });
    } else {
      get().addLog(`Connection failed: ${result.error}`, 'error');
      set({ isConnected: false });
    }

    set({ isTesting: false });
  },

  addLog: (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    set((state) => ({
      logs: [
        ...state.logs,
        {
          time: getTimeString(),
          message,
          type,
        },
      ],
    }));
  },

  clearLogs: () => set({ logs: [] }),
}));
