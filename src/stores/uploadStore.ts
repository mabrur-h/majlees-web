import { create } from 'zustand';
import { uploadService } from '../services/upload';
import type { Language, SummarizationType, UploadProgress } from '../types';

export interface LogEntry {
  time: string;
  message: string;
  type: 'info' | 'success' | 'error';
}

interface UploadState {
  selectedFile: File | null;
  title: string;
  language: Language;
  summarizationType: SummarizationType;
  isUploading: boolean;
  progress: UploadProgress | null;
  logs: LogEntry[];
  error: string | null;

  // Actions
  setFile: (file: File | null) => void;
  setTitle: (title: string) => void;
  setLanguage: (language: Language) => void;
  setSummarizationType: (type: SummarizationType) => void;
  startUpload: (onSuccess?: () => void) => void;
  cancelUpload: () => void;
  addLog: (message: string, type?: 'info' | 'success' | 'error') => void;
  reset: () => void;
  clearLogs: () => void;
}

const getTimeString = () => new Date().toLocaleTimeString();

export const useUploadStore = create<UploadState>((set, get) => ({
  selectedFile: null,
  title: '',
  language: 'uz',
  summarizationType: 'lecture',
  isUploading: false,
  progress: null,
  logs: [],
  error: null,

  setFile: (file: File | null) => {
    set({ selectedFile: file, error: null });
    if (file) {
      get().addLog(`Selected: ${file.name}`, 'info');
    }
  },

  setTitle: (title: string) => set({ title }),
  setLanguage: (language: Language) => set({ language }),
  setSummarizationType: (type: SummarizationType) => set({ summarizationType: type }),

  startUpload: (onSuccess?: () => void) => {
    const { selectedFile, title, language, summarizationType } = get();

    if (!selectedFile) {
      set({ error: 'No file selected' });
      return;
    }

    const typeLabel =
      summarizationType === 'custdev' ? 'CustDev Analysis' : 'Lecture Summary';
    get().addLog(`Starting TUS upload (${typeLabel})...`, 'info');

    set({ isUploading: true, error: null, progress: null });

    uploadService.start({
      file: selectedFile,
      title: title || selectedFile.name,
      language,
      summarizationType,
      onProgress: (progress) => {
        set({ progress });
      },
      onSuccess: (lectureId) => {
        get().addLog('Upload complete!', 'success');
        if (lectureId) {
          get().addLog(`Lecture ID: ${lectureId}`, 'info');
        }
        set({
          isUploading: false,
          selectedFile: null,
          title: '',
          progress: null,
        });
        onSuccess?.();
      },
      onError: (error) => {
        get().addLog(`Upload failed: ${error.message}`, 'error');
        set({
          isUploading: false,
          error: error.message,
        });
      },
    });
  },

  cancelUpload: () => {
    uploadService.abort();
    get().addLog('Upload cancelled', 'info');
    set({
      isUploading: false,
      progress: null,
    });
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

  reset: () => {
    uploadService.abort();
    set({
      selectedFile: null,
      title: '',
      isUploading: false,
      progress: null,
      error: null,
    });
  },

  clearLogs: () => set({ logs: [] }),
}));
