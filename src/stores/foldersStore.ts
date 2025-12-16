import { create } from 'zustand';
import { api } from '../services/api';
import type { Folder, FolderCreateRequest, FolderUpdateRequest } from '../types';

interface FoldersState {
  folders: Folder[];
  foldersTree: Folder[];
  selectedFolderId: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadFolders: () => Promise<void>;
  loadFoldersTree: () => Promise<void>;
  createFolder: (data: FolderCreateRequest) => Promise<Folder | null>;
  updateFolder: (id: string, data: FolderUpdateRequest) => Promise<Folder | null>;
  deleteFolder: (id: string) => Promise<boolean>;
  selectFolder: (id: string | null) => void;
  clearError: () => void;
}

export const useFoldersStore = create<FoldersState>((set, get) => ({
  folders: [],
  foldersTree: [],
  selectedFolderId: null,
  isLoading: false,
  error: null,

  loadFolders: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.getFolders();
      if (response.success && response.data) {
        set({ folders: response.data.folders, isLoading: false });
      } else {
        set({
          error: response.error?.message || 'Failed to load folders',
          isLoading: false,
        });
      }
    } catch (error) {
      set({
        error: (error as Error).message,
        isLoading: false,
      });
    }
  },

  loadFoldersTree: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.getFoldersTree();
      if (response.success && response.data) {
        set({ foldersTree: response.data.folders, isLoading: false });
      } else {
        set({
          error: response.error?.message || 'Failed to load folders tree',
          isLoading: false,
        });
      }
    } catch (error) {
      set({
        error: (error as Error).message,
        isLoading: false,
      });
    }
  },

  createFolder: async (data: FolderCreateRequest) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.createFolder(data);
      if (response.success && response.data) {
        // Reload folders after creation
        await get().loadFolders();
        await get().loadFoldersTree();
        return response.data.folder;
      } else {
        set({
          error: response.error?.message || 'Failed to create folder',
          isLoading: false,
        });
        return null;
      }
    } catch (error) {
      set({
        error: (error as Error).message,
        isLoading: false,
      });
      return null;
    }
  },

  updateFolder: async (id: string, data: FolderUpdateRequest) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.updateFolder(id, data);
      if (response.success && response.data) {
        // Reload folders after update
        await get().loadFolders();
        await get().loadFoldersTree();
        return response.data.folder;
      } else {
        set({
          error: response.error?.message || 'Failed to update folder',
          isLoading: false,
        });
        return null;
      }
    } catch (error) {
      set({
        error: (error as Error).message,
        isLoading: false,
      });
      return null;
    }
  },

  deleteFolder: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.deleteFolder(id);
      if (response.success) {
        // Clear selection if deleted folder was selected
        const { selectedFolderId } = get();
        if (selectedFolderId === id) {
          set({ selectedFolderId: null });
        }
        // Reload folders after deletion
        await get().loadFolders();
        await get().loadFoldersTree();
        return true;
      } else {
        set({
          error: response.error?.message || 'Failed to delete folder',
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

  selectFolder: (id: string | null) => {
    set({ selectedFolderId: id });
  },

  clearError: () => set({ error: null }),
}));
