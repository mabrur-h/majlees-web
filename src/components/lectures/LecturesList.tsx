import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useLecturesStore } from '../../stores/lecturesStore';
import { useAuthStore } from '../../stores/authStore';
import { useViewStore } from '../../stores/viewStore';
import { useFoldersStore } from '../../stores/foldersStore';
import { useTagsStore } from '../../stores/tagsStore';
import { LectureEditModal } from './LectureEditModal';
import { formatBytes, formatDate } from '../../utils';
import type { LectureStatus, Lecture } from '../../types';
import styles from './LecturesList.module.css';

const STATUS_CONFIG: Record<LectureStatus, { label: string; color: string; icon: string }> = {
  uploaded: { label: 'Yuklandi', color: 'blue', icon: 'solar:upload-bold' },
  extracting: { label: 'Ajratilmoqda', color: 'yellow', icon: 'solar:settings-bold' },
  transcribing: { label: 'Transkripsiya', color: 'yellow', icon: 'solar:microphone-3-bold' },
  summarizing: { label: 'Xulosa', color: 'yellow', icon: 'solar:magic-stick-3-bold' },
  completed: { label: 'Tayyor', color: 'green', icon: 'solar:check-circle-bold' },
  failed: { label: 'Xato', color: 'red', icon: 'solar:danger-triangle-bold' },
};

const FILTER_OPTIONS = [
  { value: '', label: 'Barchasi', icon: 'solar:list-linear' },
  { value: 'completed', label: 'Tayyor', icon: 'solar:check-circle-linear' },
  { value: 'processing', label: 'Jarayonda', icon: 'solar:refresh-circle-linear' },
  { value: 'failed', label: 'Xato', icon: 'solar:danger-circle-linear' },
];

export function LecturesList() {
  const { isAuthenticated } = useAuthStore();
  const { openLectureDetail } = useViewStore();
  const {
    lectures,
    pagination,
    isLoading,
    loadLectures,
    setStatusFilter,
  } = useLecturesStore();
  const { folders, loadFolders, selectedFolderId, selectFolder } = useFoldersStore();
  const { tags, loadTags } = useTagsStore();

  const [activeFilter, setActiveFilter] = useState('');
  const [showFolderDropdown, setShowFolderDropdown] = useState(false);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [editingLecture, setEditingLecture] = useState<Lecture | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadLectures();
      loadFolders();
      loadTags();
    }
  }, [isAuthenticated, loadLectures, loadFolders, loadTags]);

  const handleFilterChange = (value: string) => {
    setActiveFilter(value);
    // 'processing' is a UI-only filter - we fetch all and filter client-side
    // because backend doesn't have a single 'processing' status
    if (value === 'processing') {
      setStatusFilter('');
    } else {
      setStatusFilter(value as LectureStatus | '');
    }
  };

  // Filter lectures client-side for 'processing' status, folder, and tags
  const displayLectures = lectures.filter(l => {
    // Filter by folder
    if (selectedFolderId && l.folderId !== selectedFolderId) {
      return false;
    }
    // Filter by status
    if (activeFilter === 'processing') {
      if (!['uploaded', 'extracting', 'transcribing', 'summarizing'].includes(l.status)) {
        return false;
      }
    }
    // Filter by tags (lecture must have ALL selected tags)
    if (selectedTagIds.length > 0) {
      const lectureTags = l.tags?.map(t => t.id) || [];
      if (!selectedTagIds.every(tagId => lectureTags.includes(tagId))) {
        return false;
      }
    }
    return true;
  });

  const selectedFolder = folders.find(f => f.id === selectedFolderId);
  const selectedTags = tags.filter(t => selectedTagIds.includes(t.id));

  const toggleTagFilter = (tagId: string) => {
    setSelectedTagIds(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const clearTagFilters = () => {
    setSelectedTagIds([]);
  };

  const handleLectureClick = (lecture: Lecture) => {
    openLectureDetail(lecture.id);
  };

  if (!isAuthenticated) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <Icon icon="solar:lock-keyhole-linear" width={48} height={48} />
          </div>
          <h2 className={styles.emptyTitle}>Kirish talab qilinadi</h2>
          <p className={styles.emptyText}>Majlislaringizni ko'rish uchun hisob yarating yoki tizimga kiring.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Majlislarim</h1>
          <p className={styles.subtitle}>
            {pagination?.total || 0} ta yozuv
          </p>
        </div>
        <div className={styles.headerActions}>
          {/* Tag Filter */}
          {tags.length > 0 && (
            <div className={styles.tagFilter}>
              <button
                className={`${styles.tagFilterBtn} ${selectedTagIds.length > 0 ? styles.active : ''}`}
                onClick={() => setShowTagDropdown(!showTagDropdown)}
              >
                <Icon icon="solar:tag-bold" width={18} height={18} />
                <span>
                  {selectedTagIds.length > 0
                    ? `${selectedTagIds.length} ta teg`
                    : 'Teglar'}
                </span>
                <Icon icon="solar:alt-arrow-down-linear" width={14} height={14} />
              </button>
              {showTagDropdown && (
                <>
                  <div className={styles.dropdownBackdrop} onClick={() => setShowTagDropdown(false)} />
                  <div className={styles.tagDropdown}>
                    <div className={styles.tagDropdownHeader}>
                      <span>Teglar bo'yicha filtrlash</span>
                      {selectedTagIds.length > 0 && (
                        <button className={styles.clearTagsBtn} onClick={clearTagFilters}>
                          Tozalash
                        </button>
                      )}
                    </div>
                    <div className={styles.tagDropdownList}>
                      {tags.map(tag => (
                        <button
                          key={tag.id}
                          className={`${styles.tagOption} ${selectedTagIds.includes(tag.id) ? styles.active : ''}`}
                          onClick={() => toggleTagFilter(tag.id)}
                        >
                          <span
                            className={styles.tagDot}
                            style={{ backgroundColor: tag.color || 'var(--color-text-tertiary)' }}
                          />
                          <span className={styles.tagName}>{tag.name}</span>
                          {selectedTagIds.includes(tag.id) && (
                            <Icon icon="solar:check-circle-bold" width={16} height={16} />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
          {/* Folder Filter */}
          <div className={styles.folderFilter}>
            <button
              className={`${styles.folderBtn} ${selectedFolderId ? styles.active : ''}`}
              onClick={() => setShowFolderDropdown(!showFolderDropdown)}
            >
              <Icon icon="solar:folder-bold" width={18} height={18} />
              <span>{selectedFolder?.name || 'Barcha papkalar'}</span>
              <Icon icon="solar:alt-arrow-down-linear" width={14} height={14} />
            </button>
            {showFolderDropdown && (
              <>
                <div className={styles.dropdownBackdrop} onClick={() => setShowFolderDropdown(false)} />
                <div className={styles.folderDropdown}>
                  <button
                    className={`${styles.folderOption} ${!selectedFolderId ? styles.active : ''}`}
                    onClick={() => {
                      selectFolder(null);
                      setShowFolderDropdown(false);
                    }}
                  >
                    <Icon icon="solar:folder-linear" width={16} height={16} />
                    Barcha papkalar
                  </button>
                  {folders.map(folder => (
                    <button
                      key={folder.id}
                      className={`${styles.folderOption} ${selectedFolderId === folder.id ? styles.active : ''}`}
                      onClick={() => {
                        selectFolder(folder.id);
                        setShowFolderDropdown(false);
                      }}
                    >
                      <Icon
                        icon="solar:folder-bold"
                        width={16}
                        height={16}
                        style={{ color: folder.color || 'var(--color-accent)' }}
                      />
                      {folder.name}
                      {folder.lectureCount !== undefined && (
                        <span className={styles.folderCount}>{folder.lectureCount}</span>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <button
            className={styles.refreshBtn}
            onClick={() => loadLectures()}
            disabled={isLoading}
          >
            <Icon
              icon={isLoading ? "solar:refresh-circle-bold" : "solar:refresh-linear"}
              width={22}
              height={22}
              className={isLoading ? styles.spinning : ''}
            />
          </button>
        </div>
      </div>

      {/* Filter Pills */}
      <div className={styles.filterSection}>
        <div className={styles.filterScroll}>
          {FILTER_OPTIONS.map((filter) => (
            <button
              key={filter.value}
              className={`${styles.filterPill} ${activeFilter === filter.value ? styles.active : ''}`}
              onClick={() => handleFilterChange(filter.value)}
            >
              <Icon icon={filter.icon} width={16} height={16} />
              <span>{filter.label}</span>
            </button>
          ))}
          {/* Active Tag Filters */}
          {selectedTags.map(tag => (
            <button
              key={tag.id}
              className={`${styles.filterPill} ${styles.tagPill}`}
              onClick={() => toggleTagFilter(tag.id)}
              style={{
                '--tag-color': tag.color || 'var(--color-accent)',
              } as React.CSSProperties}
            >
              <span
                className={styles.tagDot}
                style={{ backgroundColor: tag.color || 'var(--color-accent)' }}
              />
              <span>{tag.name}</span>
              <Icon icon="solar:close-circle-bold" width={16} height={16} />
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading && displayLectures.length === 0 ? (
        <div className={styles.loadingState}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={styles.skeletonCard}>
              <div className={styles.skeletonHeader}>
                <div className={styles.skeletonIcon} />
                <div className={styles.skeletonBadge} />
              </div>
              <div className={styles.skeletonTitle} />
              <div className={styles.skeletonMeta} />
            </div>
          ))}
        </div>
      ) : displayLectures.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <Icon icon="solar:folder-open-linear" width={48} height={48} />
          </div>
          <h2 className={styles.emptyTitle}>Hali majlislar yo'q</h2>
          <p className={styles.emptyText}>AI asosida transkripsiya va xulosa olish uchun birinchi yozuvingizni yuklang.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          <AnimatePresence>
            {displayLectures.map((lecture, index) => (
              <motion.div
                key={lecture.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
              >
                <LectureCard
                  lecture={lecture}
                  onClick={() => handleLectureClick(lecture)}
                  onEdit={(e) => {
                    e.stopPropagation();
                    setEditingLecture(lecture);
                  }}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.pageBtn}
            onClick={() => loadLectures(pagination.page - 1)}
            disabled={!pagination.hasPrev}
          >
            <Icon icon="solar:arrow-left-linear" width={20} height={20} />
          </button>
          <div className={styles.pageIndicators}>
            {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
              const page = i + 1;
              return (
                <button
                  key={page}
                  className={`${styles.pageIndicator} ${pagination.page === page ? styles.activePage : ''}`}
                  onClick={() => loadLectures(page)}
                />
              );
            })}
          </div>
          <button
            className={styles.pageBtn}
            onClick={() => loadLectures(pagination.page + 1)}
            disabled={!pagination.hasNext}
          >
            <Icon icon="solar:arrow-right-linear" width={20} height={20} />
          </button>
        </div>
      )}

      {/* Edit Modal */}
      {editingLecture && (
        <LectureEditModal
          lecture={editingLecture}
          isOpen={!!editingLecture}
          onClose={() => setEditingLecture(null)}
        />
      )}
    </div>
  );
}

interface LectureCardProps {
  lecture: Lecture;
  onClick: () => void;
  onEdit: (e: React.MouseEvent) => void;
}

function LectureCard({ lecture, onClick, onEdit }: LectureCardProps) {
  const status = STATUS_CONFIG[lecture.status];
  const isProcessing = ['extracting', 'transcribing', 'summarizing'].includes(lecture.status);
  const isCustDev = lecture.summarizationType === 'custdev';

  return (
    <button className={styles.card} onClick={onClick}>
      {/* Card Header */}
      <div className={styles.cardHeader}>
        <div className={`${styles.cardIcon} ${isCustDev ? styles.custdev : ''}`}>
          <Icon
            icon={isCustDev ? 'solar:users-group-rounded-bold' : 'solar:document-text-bold'}
            width={24}
            height={24}
          />
        </div>
        <span className={`${styles.statusBadge} ${styles[status.color]}`}>
          {isProcessing && <span className={styles.processingDot} />}
          {status.label}
        </span>
      </div>

      {/* Card Body */}
      <div className={styles.cardBody}>
        <h3 className={styles.cardTitle}>{lecture.title || lecture.originalFilename}</h3>
        {/* Tags */}
        {lecture.tags && lecture.tags.length > 0 && (
          <div className={styles.cardTags}>
            {lecture.tags.slice(0, 3).map(tag => (
              <span
                key={tag.id}
                className={styles.cardTag}
                style={{
                  '--tag-color': tag.color || 'var(--color-text-tertiary)',
                } as React.CSSProperties}
              >
                <span
                  className={styles.cardTagDot}
                  style={{ backgroundColor: tag.color || 'var(--color-text-tertiary)' }}
                />
                {tag.name}
              </span>
            ))}
            {lecture.tags.length > 3 && (
              <span className={styles.cardTagMore}>+{lecture.tags.length - 3}</span>
            )}
          </div>
        )}
        <div className={styles.cardMeta}>
          <span className={styles.metaItem}>
            <Icon icon="solar:calendar-linear" width={14} height={14} />
            {formatDate(lecture.createdAt)}
          </span>
          {lecture.durationFormatted && (
            <span className={styles.metaItem}>
              <Icon icon="solar:clock-circle-linear" width={14} height={14} />
              {lecture.durationFormatted}
            </span>
          )}
          <span className={styles.metaItem}>
            <Icon icon="solar:folder-linear" width={14} height={14} />
            {formatBytes(lecture.fileSizeBytes)}
          </span>
        </div>
      </div>

      {/* Card Footer */}
      <div className={styles.cardFooter}>
        <span className={`${styles.typeBadge} ${isCustDev ? styles.custdevBadge : ''}`}>
          {isCustDev ? 'CustDev' : 'Lecture'}
        </span>
        <div className={styles.cardActions}>
          <button
            className={styles.editBtn}
            onClick={onEdit}
            title="Tahrirlash"
          >
            <Icon icon="solar:pen-2-linear" width={16} height={16} />
          </button>
          <div className={styles.cardArrow}>
            <Icon icon="solar:arrow-right-linear" width={16} height={16} />
          </div>
        </div>
      </div>
    </button>
  );
}
