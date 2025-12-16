import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useViewStore } from '../stores/viewStore';
import { api } from '../services/api';
import { TranscriptionTab } from '../components/lectures/tabs/TranscriptionTab';
import { SummaryTab } from '../components/lectures/tabs/SummaryTab';
import { KeyPointsTab } from '../components/lectures/tabs/KeyPointsTab';
import { formatDate } from '../utils';
import type { PublicLectureResponse } from '../types';
import styles from './SharedLectureView.module.css';

const LECTURE_TABS = [
  { id: 'transcription', label: 'Transcript', icon: 'solar:document-text-linear' },
  { id: 'summary', label: 'Summary', icon: 'solar:list-check-linear' },
  { id: 'keypoints', label: 'Key Points', icon: 'solar:star-linear' },
];

export function SharedLectureView() {
  const { sharedLectureSlug, goBack, setView } = useViewStore();
  const [lecture, setLecture] = useState<PublicLectureResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('summary');

  useEffect(() => {
    if (!sharedLectureSlug) {
      setError('No lecture slug provided');
      setIsLoading(false);
      return;
    }

    const loadLecture = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await api.getPublicLecture(sharedLectureSlug);
        if (response.success && response.data) {
          setLecture(response.data);
          // Set initial tab based on available content
          if (response.data.summary) {
            setActiveTab('summary');
          } else if (response.data.transcription) {
            setActiveTab('transcription');
          } else if (response.data.keyPoints) {
            setActiveTab('keypoints');
          }
        } else {
          setError(response.error?.message || 'Lecture not found');
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    loadLecture();
  }, [sharedLectureSlug]);

  // Filter tabs based on available content
  const availableTabs = LECTURE_TABS.filter(tab => {
    if (!lecture) return false;
    switch (tab.id) {
      case 'transcription':
        return !!lecture.transcription;
      case 'summary':
        return !!lecture.summary;
      case 'keypoints':
        return !!lecture.keyPoints && lecture.keyPoints.length > 0;
      default:
        return false;
    }
  });

  const renderTabContent = () => {
    if (!lecture) return null;

    switch (activeTab) {
      case 'transcription':
        return lecture.transcription ? (
          <TranscriptionTab transcription={{
            ...lecture.transcription,
            wordCount: lecture.transcription.wordCount ?? 0,
          }} />
        ) : null;
      case 'summary':
        return lecture.summary ? (
          <SummaryTab summary={{
            ...lecture.summary,
            chapters: lecture.summary.chapters ?? [],
          }} />
        ) : null;
      case 'keypoints':
        return lecture.keyPoints ? (
          <KeyPointsTab keyPoints={lecture.keyPoints} />
        ) : null;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={goBack}>
            <Icon icon="solar:arrow-left-linear" width={24} height={24} />
          </button>
          <div className={styles.headerTitle}>Shared Lecture</div>
        </div>
        <div className={styles.loadingState}>
          <Icon icon="solar:refresh-circle-bold" width={32} height={32} className={styles.spinning} />
          <span>Loading shared lecture...</span>
        </div>
      </div>
    );
  }

  if (error || !lecture) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={goBack}>
            <Icon icon="solar:arrow-left-linear" width={24} height={24} />
          </button>
          <div className={styles.headerTitle}>Shared Lecture</div>
        </div>
        <div className={styles.errorState}>
          <Icon icon="solar:sad-circle-bold" width={64} height={64} />
          <h2>Lecture Not Found</h2>
          <p>{error || 'This shared lecture is no longer available or the link is invalid.'}</p>
          <button className={styles.homeBtn} onClick={() => setView('home')}>
            <Icon icon="solar:home-2-linear" width={20} height={20} />
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={goBack}>
          <Icon icon="solar:arrow-left-linear" width={24} height={24} />
        </button>
        <div className={styles.headerTitle}>Shared Lecture</div>
      </div>

      {/* Hero Section */}
      <div className={styles.hero}>
        <div className={styles.sharedBadge}>
          <Icon icon="solar:share-bold" width={14} height={14} />
          Shared by {lecture.ownerName || 'Anonymous'}
        </div>
        <h1 className={styles.title}>{lecture.title || 'Untitled Lecture'}</h1>
        <div className={styles.metaRow}>
          {lecture.durationFormatted && (
            <span className={styles.metaItem}>
              <Icon icon="solar:clock-circle-linear" width={16} height={16} />
              {lecture.durationFormatted}
            </span>
          )}
          <span className={styles.metaItem}>
            <Icon icon="solar:calendar-linear" width={16} height={16} />
            {formatDate(lecture.createdAt)}
          </span>
          <span className={styles.metaItem}>
            <Icon icon="solar:global-linear" width={16} height={16} />
            {lecture.language?.toUpperCase() || 'AUTO'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      {availableTabs.length > 0 && (
        <div className={styles.tabsSection}>
          <div className={styles.tabsScroll}>
            {availableTabs.map((tab) => (
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
      )}

      {/* Content */}
      <div className={styles.content}>
        {availableTabs.length === 0 ? (
          <div className={styles.noContent}>
            <Icon icon="solar:document-bold" width={48} height={48} />
            <p>No content available for this shared lecture.</p>
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
}
