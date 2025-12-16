import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useLecturesStore } from '../../stores/lecturesStore';
import { AudioPlayer } from '../audio';
import { TranscriptionTab } from './tabs/TranscriptionTab';
import { SummaryTab } from './tabs/SummaryTab';
import { KeyPointsTab } from './tabs/KeyPointsTab';
import { CustDevSummaryTab } from './tabs/CustDevSummaryTab';
import { PainPointsTab } from './tabs/PainPointsTab';
import { SuggestionsTab } from './tabs/SuggestionsTab';
import { ActionsTab } from './tabs/ActionsTab';
import { MindMapTab } from './tabs/MindMapTab';
import { LectureEditModal } from './LectureEditModal';
import { formatBytes, formatDate } from '../../utils';
import type { LectureStatus } from '../../types';
import styles from './LectureDetails.module.css';

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

export function LectureDetails() {
  const { selectedLecture, clearSelection, deleteLecture } = useLecturesStore();
  const [activeTab, setActiveTab] = useState('transcription');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  if (!selectedLecture) {
    return null;
  }

  const isCustDev = selectedLecture.summarizationType === 'custdev';
  const tabs = isCustDev ? CUSTDEV_TABS : LECTURE_TABS;
  const typeLabel = isCustDev ? 'CustDev tahlili' : 'Lecture xulosa';
  const status = STATUS_CONFIG[selectedLecture.status];
  const isProcessing = ['extracting', 'transcribing', 'summarizing'].includes(selectedLecture.status);

  const handleDelete = async () => {
    if (window.confirm('Ushbu yozuvni o\'chirmoqchimisiz?')) {
      setIsDeleting(true);
      await deleteLecture(selectedLecture.id);
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    clearSelection();
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'transcription':
        return <TranscriptionTab transcription={selectedLecture.transcription} />;
      case 'summary':
        return <SummaryTab summary={selectedLecture.summary} />;
      case 'keypoints':
        return <KeyPointsTab keyPoints={selectedLecture.keyPoints} />;
      case 'custdevSummary':
        return <CustDevSummaryTab custdevData={selectedLecture.summary?.custdevData} />;
      case 'mindmap':
        return <MindMapTab mindMap={selectedLecture.summary?.custdevData?.mindMap} />;
      case 'painpoints':
        return <PainPointsTab painPoints={selectedLecture.summary?.custdevData?.keyPainPoints} />;
      case 'suggestions':
        return (
          <SuggestionsTab
            positiveFeedback={selectedLecture.summary?.custdevData?.positiveFeedback}
            productSuggestions={selectedLecture.summary?.custdevData?.productSuggestions}
          />
        );
      case 'actions':
        return <ActionsTab actionItems={selectedLecture.summary?.custdevData?.internalActionItems} />;
      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      {selectedLecture && (
        <>
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />
          <motion.div
            className={styles.panel}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            {/* Header */}
            <div className={styles.header}>
              <button className={styles.closeBtn} onClick={handleClose}>
                <Icon icon="solar:arrow-left-linear" width={24} height={24} />
              </button>
              <div className={styles.headerActions}>
                <button
                  className={styles.actionBtn}
                  onClick={() => setIsEditModalOpen(true)}
                  title="Tahrirlash"
                >
                  <Icon icon="solar:pen-linear" width={20} height={20} />
                </button>
                <button className={styles.actionBtn} title="Ulashish">
                  <Icon icon="solar:share-linear" width={20} height={20} />
                </button>
                <button
                  className={`${styles.actionBtn} ${styles.deleteBtn}`}
                  onClick={handleDelete}
                  disabled={isDeleting}
                  title="O'chirish"
                >
                  <Icon icon="solar:trash-bin-trash-linear" width={20} height={20} />
                </button>
              </div>
            </div>

            {/* Title Section */}
            <div className={styles.titleSection}>
              <div className={styles.titleIcon}>
                <Icon
                  icon={isCustDev ? 'solar:users-group-rounded-bold' : 'solar:document-text-bold'}
                  width={24}
                  height={24}
                />
              </div>
              <div className={styles.titleContent}>
                <h2 className={styles.title}>
                  {selectedLecture.title || selectedLecture.originalFilename}
                </h2>
                <div className={styles.subtitle}>
                  <span className={styles.typeBadge}>{typeLabel}</span>
                  <span className={`${styles.statusBadge} ${styles[status.color]}`}>
                    {isProcessing && (
                      <span className={styles.processingDot} />
                    )}
                    {status.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Tags Display */}
            {selectedLecture.tags && selectedLecture.tags.length > 0 && (
              <div className={styles.tagsSection}>
                {selectedLecture.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className={styles.tag}
                    style={{
                      '--tag-color': tag.color || 'var(--color-accent)',
                    } as React.CSSProperties}
                  >
                    <span
                      className={styles.tagDot}
                      style={{ backgroundColor: tag.color || 'var(--color-accent)' }}
                    />
                    {tag.name}
                  </span>
                ))}
              </div>
            )}

            {/* Meta Info */}
            <div className={styles.metaSection}>
              <div className={styles.metaGrid}>
                {selectedLecture.durationFormatted && (
                  <div className={styles.metaItem}>
                    <Icon icon="solar:clock-circle-linear" width={16} height={16} />
                    <span>{selectedLecture.durationFormatted}</span>
                  </div>
                )}
                <div className={styles.metaItem}>
                  <Icon icon="solar:folder-linear" width={16} height={16} />
                  <span>{formatBytes(selectedLecture.fileSizeBytes)}</span>
                </div>
                <div className={styles.metaItem}>
                  <Icon icon="solar:global-linear" width={16} height={16} />
                  <span>{selectedLecture.language?.toUpperCase() || 'N/A'}</span>
                </div>
                <div className={styles.metaItem}>
                  <Icon icon="solar:calendar-linear" width={16} height={16} />
                  <span>{formatDate(selectedLecture.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* Audio Player */}
            {selectedLecture.audioUrl && (
              <div className={styles.audioSection}>
                <AudioPlayer audioUrl={selectedLecture.audioUrl} />
              </div>
            )}

            {/* Error Message */}
            {selectedLecture.errorMessage && (
              <div className={styles.errorMessage}>
                <Icon icon="solar:danger-triangle-bold" width={18} height={18} />
                <span>{selectedLecture.errorMessage}</span>
              </div>
            )}

            {/* Tabs */}
            <div className={styles.tabsContainer}>
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
          </motion.div>

          {/* Edit Modal */}
          <LectureEditModal
            lecture={selectedLecture}
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
          />
        </>
      )}
    </AnimatePresence>
  );
}
