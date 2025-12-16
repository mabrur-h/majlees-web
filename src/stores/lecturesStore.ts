import { create } from 'zustand';
import { api } from '../services/api';
import type { Lecture, LectureStatus, LectureUpdateRequest, PaginationInfo, Tag } from '../types';

interface LecturesState {
  lectures: Lecture[];
  selectedLecture: Lecture | null;
  pagination: PaginationInfo | null;
  statusFilter: LectureStatus | '';
  isLoading: boolean;
  error: string | null;
  pollingInterval: ReturnType<typeof setInterval> | null;

  // Actions
  loadLectures: (page?: number) => Promise<void>;
  selectLecture: (id: string) => Promise<void>;
  updateLecture: (id: string, data: LectureUpdateRequest) => Promise<Lecture | null>;
  deleteLecture: (id: string) => Promise<boolean>;
  setStatusFilter: (status: LectureStatus | '') => void;
  startPolling: (lectureId: string) => void;
  stopPolling: () => void;
  clearSelection: () => void;
  clearError: () => void;
  // Tag management for lectures
  getLectureTags: (lectureId: string) => Promise<Tag[]>;
  setLectureTags: (lectureId: string, tagIds: string[]) => Promise<Tag[] | null>;
  addTagToLecture: (lectureId: string, tagId: string) => Promise<boolean>;
  removeTagFromLecture: (lectureId: string, tagId: string) => Promise<boolean>;
}

export const useLecturesStore = create<LecturesState>((set, get) => ({
  lectures: [],
  selectedLecture: null,
  pagination: null,
  statusFilter: '',
  isLoading: false,
  error: null,
  pollingInterval: null,

  loadLectures: async (page = 1) => {
    set({ isLoading: true, error: null });
    try {
      const { statusFilter } = get();
      const response = await api.getLectures(page, 10, statusFilter || undefined);

      if (response.success && response.data) {
        set({
          lectures: response.data.data,
          pagination: response.data.pagination,
          isLoading: false,
        });
      } else {
        set({
          error: response.error?.message || 'Failed to load lectures',
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

  selectLecture: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.getLecture(id);

      if (response.success && response.data) {
        const lecture = response.data.lecture;
        set({ selectedLecture: lecture, isLoading: false });

        // Start polling if still processing
        const processingStatuses: LectureStatus[] = [
          'uploaded',
          'extracting',
          'transcribing',
          'summarizing',
        ];
        if (processingStatuses.includes(lecture.status)) {
          get().startPolling(id);
        } else {
          get().stopPolling();
        }
      } else {
        set({
          error: response.error?.message || 'Failed to load lecture',
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

  updateLecture: async (id: string, data: LectureUpdateRequest) => {
    try {
      const response = await api.updateLecture(id, data);
      if (response.success && response.data) {
        const updatedLecture = response.data.lecture;
        // Update selectedLecture if it's the same one
        const { selectedLecture } = get();
        if (selectedLecture?.id === id) {
          set({ selectedLecture: { ...selectedLecture, ...updatedLecture } });
        }
        // Refresh the list
        await get().loadLectures();
        return updatedLecture;
      } else {
        set({ error: response.error?.message || 'Failed to update lecture' });
        return null;
      }
    } catch (error) {
      set({ error: (error as Error).message });
      return null;
    }
  },

  deleteLecture: async (id: string) => {
    try {
      const response = await api.deleteLecture(id);
      if (response.success) {
        const { selectedLecture } = get();
        if (selectedLecture?.id === id) {
          set({ selectedLecture: null });
        }
        await get().loadLectures();
        return true;
      } else {
        set({ error: response.error?.message || 'Failed to delete lecture' });
        return false;
      }
    } catch (error) {
      set({ error: (error as Error).message });
      return false;
    }
  },

  setStatusFilter: (status: LectureStatus | '') => {
    set({ statusFilter: status });
    get().loadLectures();
  },

  startPolling: (lectureId: string) => {
    get().stopPolling();

    const interval = setInterval(async () => {
      try {
        // Use lightweight status endpoint instead of full lecture fetch
        const response = await api.getLectureStatusLight(lectureId);
        if (response.success && response.data) {
          const statusData = response.data;
          const { selectedLecture, lectures } = get();

          // Update selectedLecture status if it matches
          if (selectedLecture?.id === lectureId) {
            set({
              selectedLecture: {
                ...selectedLecture,
                status: statusData.status,
                errorMessage: statusData.errorMessage || undefined,
              },
            });
          }

          // Update the lecture in the list without full refetch
          const updatedLectures = lectures.map(l =>
            l.id === lectureId
              ? { ...l, status: statusData.status, errorMessage: statusData.errorMessage || undefined }
              : l
          );
          set({ lectures: updatedLectures });

          // Stop polling and fetch full data if completed or failed
          if (['completed', 'failed'].includes(statusData.status)) {
            get().stopPolling();
            // Fetch full lecture data now that processing is complete
            if (statusData.status === 'completed') {
              get().selectLecture(lectureId);
            }
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 5000);

    set({ pollingInterval: interval });
  },

  stopPolling: () => {
    const { pollingInterval } = get();
    if (pollingInterval) {
      clearInterval(pollingInterval);
      set({ pollingInterval: null });
    }
  },

  clearSelection: () => {
    get().stopPolling();
    set({ selectedLecture: null });
  },

  clearError: () => set({ error: null }),

  // Tag management for lectures
  getLectureTags: async (lectureId: string) => {
    try {
      const response = await api.getLectureTags(lectureId);
      if (response.success && response.data) {
        return response.data.tags;
      }
      return [];
    } catch (error) {
      console.error('Failed to get lecture tags:', error);
      return [];
    }
  },

  setLectureTags: async (lectureId: string, tagIds: string[]) => {
    try {
      const response = await api.setLectureTags(lectureId, tagIds);
      if (response.success && response.data) {
        // Update selectedLecture tags if it's the same one
        const { selectedLecture } = get();
        if (selectedLecture?.id === lectureId) {
          set({ selectedLecture: { ...selectedLecture, tags: response.data.tags } });
        }
        return response.data.tags;
      } else {
        set({ error: response.error?.message || 'Failed to set lecture tags' });
        return null;
      }
    } catch (error) {
      set({ error: (error as Error).message });
      return null;
    }
  },

  addTagToLecture: async (lectureId: string, tagId: string) => {
    try {
      const response = await api.addTagToLecture(lectureId, tagId);
      if (response.success) {
        // Refresh tags for the lecture
        const tags = await get().getLectureTags(lectureId);
        const { selectedLecture } = get();
        if (selectedLecture?.id === lectureId) {
          set({ selectedLecture: { ...selectedLecture, tags } });
        }
        return true;
      } else {
        set({ error: response.error?.message || 'Failed to add tag' });
        return false;
      }
    } catch (error) {
      set({ error: (error as Error).message });
      return false;
    }
  },

  removeTagFromLecture: async (lectureId: string, tagId: string) => {
    try {
      const response = await api.removeTagFromLecture(lectureId, tagId);
      if (response.success) {
        // Update selectedLecture tags if it's the same one
        const { selectedLecture } = get();
        if (selectedLecture?.id === lectureId && selectedLecture.tags) {
          set({
            selectedLecture: {
              ...selectedLecture,
              tags: selectedLecture.tags.filter(t => t.id !== tagId),
            },
          });
        }
        return true;
      } else {
        set({ error: response.error?.message || 'Failed to remove tag' });
        return false;
      }
    } catch (error) {
      set({ error: (error as Error).message });
      return false;
    }
  },
}));
