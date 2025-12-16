import { create } from 'zustand';
import { api } from '../services/api';
import type { Tag, TagCreateRequest, TagUpdateRequest } from '../types';

interface TagsState {
  tags: Tag[];
  isLoading: boolean;
  error: string | null;

  // Actions
  loadTags: (withCounts?: boolean) => Promise<void>;
  createTag: (data: TagCreateRequest) => Promise<Tag | null>;
  updateTag: (id: string, data: TagUpdateRequest) => Promise<Tag | null>;
  deleteTag: (id: string) => Promise<boolean>;
  clearError: () => void;
}

export const useTagsStore = create<TagsState>((set, get) => ({
  tags: [],
  isLoading: false,
  error: null,

  loadTags: async (withCounts = false) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.getTags(withCounts);
      if (response.success && response.data) {
        set({ tags: response.data.tags, isLoading: false });
      } else {
        set({
          error: response.error?.message || 'Failed to load tags',
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

  createTag: async (data: TagCreateRequest) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.createTag(data);
      if (response.success && response.data) {
        // Reload tags after creation
        await get().loadTags();
        return response.data.tag;
      } else {
        set({
          error: response.error?.message || 'Failed to create tag',
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

  updateTag: async (id: string, data: TagUpdateRequest) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.updateTag(id, data);
      if (response.success && response.data) {
        // Reload tags after update
        await get().loadTags();
        return response.data.tag;
      } else {
        set({
          error: response.error?.message || 'Failed to update tag',
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

  deleteTag: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.deleteTag(id);
      if (response.success) {
        // Reload tags after deletion
        await get().loadTags();
        return true;
      } else {
        set({
          error: response.error?.message || 'Failed to delete tag',
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

  clearError: () => set({ error: null }),
}));
