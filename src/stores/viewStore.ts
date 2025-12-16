import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type View = 'home' | 'upload' | 'lectures' | 'folders' | 'settings' | 'lecture-detail' | 'shared-lecture';

interface ViewState {
  currentView: View;
  previousView: View | null;
  selectedLectureId: string | null;
  sharedLectureSlug: string | null;
  sidebarOpen: boolean;
  setView: (view: View) => void;
  openLectureDetail: (lectureId: string) => void;
  openSharedLecture: (slug: string) => void;
  goBack: () => void;
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
}

export const useViewStore = create<ViewState>()(
  persist(
    (set, get) => ({
      currentView: 'home',
      previousView: null,
      selectedLectureId: null,
      sharedLectureSlug: null,
      sidebarOpen: false,

      setView: (view) => set({
        currentView: view,
        sidebarOpen: false,
        // Clear lecture selection when navigating away
        selectedLectureId: view !== 'lecture-detail' ? null : get().selectedLectureId,
        sharedLectureSlug: view !== 'shared-lecture' ? null : get().sharedLectureSlug,
      }),

      openLectureDetail: (lectureId) => set((state) => ({
        previousView: state.currentView,
        currentView: 'lecture-detail',
        selectedLectureId: lectureId,
        sidebarOpen: false,
      })),

      openSharedLecture: (slug) => set((state) => ({
        previousView: state.currentView,
        currentView: 'shared-lecture',
        sharedLectureSlug: slug,
        sidebarOpen: false,
      })),

      goBack: () => set((state) => ({
        currentView: state.previousView || 'home',
        previousView: null,
        selectedLectureId: null,
        sharedLectureSlug: null,
      })),

      openSidebar: () => set({ sidebarOpen: true }),
      closeSidebar: () => set({ sidebarOpen: false }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    }),
    {
      name: 'view-storage',
      partialize: (state) => ({
        currentView: state.currentView,
        previousView: state.previousView,
        selectedLectureId: state.selectedLectureId,
        // Don't persist sharedLectureSlug or sidebarOpen
      }),
    }
  )
);
