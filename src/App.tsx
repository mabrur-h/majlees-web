import { useEffect, useState } from 'react';
import { useAuthStore } from './stores/authStore';
import { useViewStore } from './stores/viewStore';
import { Layout } from './components/layout';
import { AuthSection } from './components/auth/AuthSection';
import { UploadSection } from './components/upload/UploadSection';
import { LecturesList } from './components/lectures/LecturesList';
import { LectureDetailView } from './views/LectureDetailView';
import { SharedLectureView } from './views/SharedLectureView';
import { SettingsView } from './views/SettingsView';
import { HomeView } from './views/HomeView';
import { FoldersView } from './views/FoldersView';
import { telegram } from './services/telegram';

function App() {
  const [isInitializing, setIsInitializing] = useState(true);
  const { initialize, isAuthenticated, isLoading } = useAuthStore();
  const { currentView, setView, openSharedLecture, openLectureDetail } = useViewStore();

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      await initialize();

      // Check for shared lecture or lecture deep link from various sources
      let slug: string | null = null;
      let lectureId: string | null = null;

      // 1. Check Telegram startapp parameter (from deep link)
      const startParam = telegram.getStartParam();
      if (startParam?.startsWith('share_')) {
        slug = startParam.replace('share_', '');
      } else if (startParam?.startsWith('lecture_')) {
        lectureId = startParam.replace('lecture_', '');
      }

      // 2. Check URL query parameter (from web share link)
      const urlParams = new URLSearchParams(window.location.search);
      const shareParam = urlParams.get('share');
      if (shareParam) {
        slug = shareParam;
        // Clean up URL without reloading
        window.history.replaceState({}, '', window.location.pathname);
      }

      // 3. Check URL query parameter for lecture deep link
      const lectureParam = urlParams.get('lecture');
      if (lectureParam) {
        lectureId = lectureParam;
        window.history.replaceState({}, '', window.location.pathname);
      }

      if (mounted) {
        if (slug) {
          openSharedLecture(slug);
        } else if (lectureId) {
          openLectureDetail(lectureId);
        }
        setIsInitializing(false);
      }
    };
    init();
    return () => {
      mounted = false;
    };
  }, [initialize, openSharedLecture, openLectureDetail]);

  // Show loading screen during initialization
  if (isInitializing || isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Shared lecture view - accessible without authentication
  if (currentView === 'shared-lecture') {
    return <SharedLectureView />;
  }

  // Show auth screen if not authenticated
  if (!isAuthenticated) {
    return <AuthSection />;
  }

  // Lecture detail is rendered as a full page without Layout wrapper
  if (currentView === 'lecture-detail') {
    return <LectureDetailView />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <HomeView onNavigate={setView} />;
      case 'upload':
        return <UploadSection />;
      case 'lectures':
        return <LecturesList />;
      case 'folders':
        return <FoldersView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <HomeView onNavigate={setView} />;
    }
  };

  return (
    <Layout>
      {renderView()}
    </Layout>
  );
}

export default App;
