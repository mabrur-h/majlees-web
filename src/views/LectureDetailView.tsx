import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useViewStore } from '../stores/viewStore';
import { useLecturesStore } from '../stores/lecturesStore';
import { useFoldersStore } from '../stores/foldersStore';
import { api } from '../services/api';
import { AudioPlayer } from '../components/audio';
import { TranscriptionTab } from '../components/lectures/tabs/TranscriptionTab';
import { SummaryTab } from '../components/lectures/tabs/SummaryTab';
import { KeyPointsTab } from '../components/lectures/tabs/KeyPointsTab';
import { CustDevSummaryTab } from '../components/lectures/tabs/CustDevSummaryTab';
import { PainPointsTab } from '../components/lectures/tabs/PainPointsTab';
import { SuggestionsTab } from '../components/lectures/tabs/SuggestionsTab';
import { ActionsTab } from '../components/lectures/tabs/ActionsTab';
import { MindMapTab } from '../components/lectures/tabs/MindMapTab';
import { LectureEditModal } from '../components/lectures/LectureEditModal';
import { ShareModal } from '../components/lectures/ShareModal';
import { formatBytes, formatDate } from '../utils';
import type {
  LectureStatus,
  Transcription,
  LectureSummary,
  KeyPoint,
  CustDevData,
} from '../types';
import styles from './LectureDetailView.module.css';

// Tab content cache type
interface TabContentCache {
  transcription?: Transcription;
  summary?: LectureSummary;
  keyPoints?: KeyPoint[];
  custdevData?: CustDevData;
}

const STATUS_CONFIG: Record<LectureStatus, { label: string; color: string; icon: string }> = {
  uploaded: { label: 'Yuklandi', color: 'blue', icon: 'solar:upload-bold' },
  extracting: { label: 'Ajratilmoqda', color: 'yellow', icon: 'solar:settings-bold' },
  transcribing: { label: 'Transkripsiya', color: 'yellow', icon: 'solar:microphone-3-bold' },
  summarizing: { label: 'Xulosa', color: 'yellow', icon: 'solar:magic-stick-3-bold' },
  completed: { label: 'Tayyor', color: 'green', icon: 'solar:check-circle-bold' },
  failed: { label: 'Xato', color: 'red', icon: 'solar:danger-triangle-bold' },
};

const LECTURE_TABS = [
  { id: 'transcription', label: 'Transkripsiya', icon: 'solar:document-text-linear' },
  { id: 'summary', label: 'Xulosa', icon: 'solar:list-check-linear' },
  { id: 'keypoints', label: 'Asosiy fikrlar', icon: 'solar:star-linear' },
];

const CUSTDEV_TABS = [
  { id: 'transcription', label: 'Transkripsiya', icon: 'solar:document-text-linear' },
  { id: 'custdevSummary', label: 'Xulosa', icon: 'solar:list-check-linear' },
  { id: 'mindmap', label: 'Mind Map', icon: 'solar:atom-linear' },
  { id: 'painpoints', label: 'Muammolar', icon: 'solar:danger-circle-linear' },
  { id: 'suggestions', label: 'Tushunchalar', icon: 'solar:lightbulb-linear' },
  { id: 'actions', label: 'Harakatlar', icon: 'solar:checklist-linear' },
];

export function LectureDetailView() {
  const { selectedLectureId, goBack } = useViewStore();
  const { selectedLecture, selectLecture, deleteLecture, isLoading } = useLecturesStore();
  const { folders, loadFolders } = useFoldersStore();
  const [activeTab, setActiveTab] = useState('transcription');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [tabContent, setTabContent] = useState<TabContentCache>({});
  const [tabLoading, setTabLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (selectedLectureId && (!selectedLecture || selectedLecture.id !== selectedLectureId)) {
      selectLecture(selectedLectureId);
      // Reset tab content cache when lecture changes
      setTabContent({});
      setTabLoading({});
    }
  }, [selectedLectureId, selectedLecture, selectLecture]);

  // Load folders on mount for displaying folder name
  useEffect(() => {
    if (folders.length === 0) {
      loadFolders();
    }
  }, [folders.length, loadFolders]);

  // Lazy load tab content
  const loadTabContent = useCallback(async (tab: string) => {
    if (!selectedLecture?.id || selectedLecture.status !== 'completed') return;

    // Check if already loaded or loading
    if (tabLoading[tab]) return;

    const lectureId = selectedLecture.id;

    switch (tab) {
      case 'transcription':
        if (tabContent.transcription) return;
        setTabLoading(prev => ({ ...prev, transcription: true }));
        try {
          const response = await api.getLectureTranscript(lectureId);
          if (response.success && response.data) {
            setTabContent(prev => ({ ...prev, transcription: response.data!.transcription }));
          }
        } finally {
          setTabLoading(prev => ({ ...prev, transcription: false }));
        }
        break;

      case 'summary':
        if (tabContent.summary) return;
        setTabLoading(prev => ({ ...prev, summary: true }));
        try {
          const response = await api.getLectureSummary(lectureId);
          if (response.success && response.data) {
            setTabContent(prev => ({
              ...prev,
              summary: response.data!.summary,
              keyPoints: response.data!.keyPoints,
            }));
          }
        } finally {
          setTabLoading(prev => ({ ...prev, summary: false }));
        }
        break;

      case 'keypoints':
        if (tabContent.keyPoints) return;
        setTabLoading(prev => ({ ...prev, keypoints: true }));
        try {
          const response = await api.getLectureKeyPoints(lectureId);
          if (response.success && response.data) {
            setTabContent(prev => ({ ...prev, keyPoints: response.data!.keyPoints }));
          }
        } finally {
          setTabLoading(prev => ({ ...prev, keypoints: false }));
        }
        break;

      case 'custdevSummary':
      case 'mindmap':
      case 'painpoints':
      case 'suggestions':
      case 'actions':
        if (tabContent.custdevData) return;
        setTabLoading(prev => ({ ...prev, custdev: true }));
        try {
          const response = await api.getCustDevData(lectureId);
          if (response.success && response.data) {
            setTabContent(prev => ({ ...prev, custdevData: response.data }));
          }
        } finally {
          setTabLoading(prev => ({ ...prev, custdev: false }));
        }
        break;
    }
  }, [selectedLecture?.id, selectedLecture?.status, tabContent, tabLoading]);

  // Load content when tab changes
  useEffect(() => {
    loadTabContent(activeTab);
  }, [activeTab, loadTabContent]);

  // Loading state
  if (isLoading || !selectedLecture) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={goBack}>
            <Icon icon="solar:arrow-left-linear" width={24} height={24} />
          </button>
          <div className={styles.headerTitle}>Yuklanmoqda...</div>
        </div>
        <div className={styles.loadingState}>
          <div className={styles.skeleton} />
          <div className={styles.skeleton} style={{ width: '60%' }} />
          <div className={styles.skeleton} style={{ width: '80%' }} />
        </div>
      </div>
    );
  }

  const isCustDev = selectedLecture.summarizationType === 'custdev';
  const tabs = isCustDev ? CUSTDEV_TABS : LECTURE_TABS;
  const typeLabel = isCustDev ? 'CustDev suhbat' : 'Majlis';
  const status = STATUS_CONFIG[selectedLecture.status];
  const isProcessing = ['extracting', 'transcribing', 'summarizing'].includes(selectedLecture.status);

  const handleDelete = async () => {
    if (window.confirm('Ushbu majlisni o\'chirmoqchimisiz?')) {
      setIsDeleting(true);
      await deleteLecture(selectedLecture.id);
      setIsDeleting(false);
      goBack();
    }
  };

  // Tab loading indicator component
  const TabLoadingState = () => (
    <div className={styles.tabLoading}>
      <div className={styles.tabLoadingSpinner}>
        <Icon icon="solar:refresh-circle-bold" width={24} height={24} className={styles.spinning} />
      </div>
      <span>Yuklanmoqda...</span>
    </div>
  );

  const renderTabContent = () => {
    // Use lazy-loaded content if available, fallback to selectedLecture data
    const transcription = tabContent.transcription || selectedLecture.transcription;
    const summary = tabContent.summary || selectedLecture.summary;
    const keyPoints = tabContent.keyPoints || selectedLecture.keyPoints;
    const custdevData = tabContent.custdevData || selectedLecture.summary?.custdevData;

    switch (activeTab) {
      case 'transcription':
        if (tabLoading.transcription) return <TabLoadingState />;
        return <TranscriptionTab transcription={transcription} />;
      case 'summary':
        if (tabLoading.summary) return <TabLoadingState />;
        return <SummaryTab summary={summary} />;
      case 'keypoints':
        if (tabLoading.keypoints) return <TabLoadingState />;
        return <KeyPointsTab keyPoints={keyPoints} />;
      case 'custdevSummary':
        if (tabLoading.custdev) return <TabLoadingState />;
        return <CustDevSummaryTab custdevData={custdevData} />;
      case 'mindmap':
        if (tabLoading.custdev) return <TabLoadingState />;
        return <MindMapTab mindMap={custdevData?.mindMap} />;
      case 'painpoints':
        if (tabLoading.custdev) return <TabLoadingState />;
        return <PainPointsTab painPoints={custdevData?.keyPainPoints} />;
      case 'suggestions':
        if (tabLoading.custdev) return <TabLoadingState />;
        return (
          <SuggestionsTab
            positiveFeedback={custdevData?.positiveFeedback}
            productSuggestions={custdevData?.productSuggestions}
          />
        );
      case 'actions':
        if (tabLoading.custdev) return <TabLoadingState />;
        return <ActionsTab actionItems={custdevData?.internalActionItems} />;
      default:
        return null;
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={goBack}>
          <Icon icon="solar:arrow-left-linear" width={24} height={24} />
        </button>
        <div className={styles.headerTitle}>Tafsilotlar</div>
        <div className={styles.headerActions}>
          <button
            className={styles.actionBtn}
            onClick={() => setIsEditModalOpen(true)}
            title="Yozuvni tahrirlash"
          >
            <Icon icon="solar:pen-2-linear" width={20} height={20} />
          </button>
          <button
            className={styles.actionBtn}
            onClick={() => setIsShareModalOpen(true)}
            title="Ulashish"
          >
            <Icon icon="solar:share-linear" width={20} height={20} />
          </button>
          <button
            className={`${styles.actionBtn} ${styles.deleteAction}`}
            onClick={handleDelete}
            disabled={isDeleting}
            title="Yozuvni o'chirish"
          >
            <Icon icon="solar:trash-bin-trash-linear" width={20} height={20} />
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroIconWrapper}>
            <div className={styles.heroIcon}>
              <Icon
                icon={isCustDev ? 'solar:users-group-rounded-bold' : 'solar:document-text-bold'}
                width={32}
                height={32}
              />
            </div>
            <div className={styles.heroBadges}>
              <span className={styles.typeBadge}>
                <Icon icon={isCustDev ? 'solar:users-group-rounded-linear' : 'solar:document-text-linear'} width={12} height={12} />
                {typeLabel}
              </span>
              <span className={`${styles.statusBadge} ${styles[status.color]}`}>
                {isProcessing && <span className={styles.processingDot} />}
                <Icon icon={status.icon} width={14} height={14} />
                {status.label}
              </span>
            </div>
          </div>
          <h1 className={styles.title}>
            {selectedLecture.title || selectedLecture.originalFilename}
          </h1>
        </div>
      </div>

      {/* Meta Info Cards */}
      <div className={styles.metaCards}>
        {selectedLecture.durationFormatted && (
          <div className={styles.metaCard}>
            <div className={styles.metaIcon}>
              <Icon icon="solar:clock-circle-bold" width={18} height={18} />
            </div>
            <div className={styles.metaContent}>
              <span className={styles.metaValue}>{selectedLecture.durationFormatted}</span>
              <span className={styles.metaLabel}>Davomiyligi</span>
            </div>
          </div>
        )}
        <div className={styles.metaCard}>
          <div className={styles.metaIcon}>
            <Icon icon="solar:folder-bold" width={18} height={18} />
          </div>
          <div className={styles.metaContent}>
            <span className={styles.metaValue}>{formatBytes(selectedLecture.fileSizeBytes)}</span>
            <span className={styles.metaLabel}>Fayl hajmi</span>
          </div>
        </div>
        <div className={styles.metaCard}>
          <div className={styles.metaIcon}>
            <Icon icon="solar:global-bold" width={18} height={18} />
          </div>
          <div className={styles.metaContent}>
            <span className={styles.metaValue}>{selectedLecture.language?.toUpperCase() || 'AUTO'}</span>
            <span className={styles.metaLabel}>Til</span>
          </div>
        </div>
        <div className={styles.metaCard}>
          <div className={styles.metaIcon}>
            <Icon icon="solar:calendar-bold" width={18} height={18} />
          </div>
          <div className={styles.metaContent}>
            <span className={styles.metaValue}>{formatDate(selectedLecture.createdAt)}</span>
            <span className={styles.metaLabel}>Yaratilgan</span>
          </div>
        </div>
      </div>

      {/* Audio Player */}
      {selectedLecture.audioUrl && (
        <div className={styles.audioSection}>
          <AudioPlayer audioUrl={selectedLecture.audioUrl} />
        </div>
      )}

      {/* Tags and Folder */}
      {(selectedLecture.tags?.length || selectedLecture.folderId) && (
        <div className={styles.tagsSection}>
          {selectedLecture.folderId && (
            <div className={styles.folderInfo}>
              <Icon icon="solar:folder-bold" width={16} height={16} />
              <span>{folders.find(f => f.id === selectedLecture.folderId)?.name || 'Folder'}</span>
            </div>
          )}
          {selectedLecture.tags && selectedLecture.tags.length > 0 && (
            <div className={styles.tagsList}>
              {selectedLecture.tags.map(tag => (
                <span
                  key={tag.id}
                  className={styles.tag}
                  style={{ '--tag-color': tag.color || 'var(--color-text-tertiary)' } as React.CSSProperties}
                >
                  <span className={styles.tagDot} style={{ backgroundColor: tag.color || 'var(--color-text-tertiary)' }} />
                  {tag.name}
                </span>
              ))}
            </div>
          )}
          <button
            className={styles.editTagsBtn}
            onClick={() => setIsEditModalOpen(true)}
          >
            <Icon icon="solar:pen-2-linear" width={14} height={14} />
            Tahrirlash
          </button>
        </div>
      )}

      {/* Error Message */}
      {selectedLecture.errorMessage && (
        <div className={styles.errorMessage}>
          <Icon icon="solar:danger-triangle-bold" width={20} height={20} />
          <div className={styles.errorContent}>
            <span className={styles.errorTitle}>Qayta ishlash xatosi</span>
            <span className={styles.errorText}>{selectedLecture.errorMessage}</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className={styles.tabsSection}>
        <div className={styles.tabsScroll}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon icon={tab.icon} width={18} height={18} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className={styles.content}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Edit Modal */}
      <LectureEditModal
        lecture={selectedLecture}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />

      {/* Share Modal */}
      <ShareModal
        lecture={selectedLecture}
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />
    </div>
  );
}
