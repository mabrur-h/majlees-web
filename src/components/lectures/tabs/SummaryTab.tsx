import { Icon } from '@iconify/react';
import type { LectureSummary } from '../../../types';
import styles from './Tabs.module.css';

interface SummaryTabProps {
  summary?: LectureSummary;
}

export function SummaryTab({ summary }: SummaryTabProps) {
  // Check if summary is completely missing or empty
  if (!summary) {
    return (
      <div className={styles.empty}>
        <Icon icon="solar:list-check-linear" width={48} height={48} />
        <p>Summary not available yet</p>
      </div>
    );
  }

  // Check if summary exists but has no meaningful content
  const hasOverview = summary.overview && summary.overview.trim().length > 0;
  const hasChapters = summary.chapters && summary.chapters.length > 0;

  if (!hasOverview && !hasChapters) {
    return (
      <div className={styles.empty}>
        <Icon icon="solar:list-check-linear" width={48} height={48} />
        <p>Summary content is empty</p>
      </div>
    );
  }

  return (
    <div className={styles.summaryContainer}>
      {/* Overview Card */}
      {hasOverview && (
        <div className={styles.overviewCard}>
          <div className={styles.overviewLabel}>
            <Icon icon="solar:document-text-bold" width={16} height={16} />
            <span>Overview</span>
          </div>
          <p className={styles.overviewText}>{summary.overview}</p>
        </div>
      )}

      {/* Chapters Section */}
      {hasChapters && (
        <div>
          <div className={styles.sectionTitle}>
            <Icon icon="solar:bookmark-bold" width={18} height={18} />
            <span>Chapters</span>
          </div>
          <div className={styles.chaptersGrid}>
            {summary.chapters.map((chapter, index) => (
              <div key={index} className={styles.chapterCard}>
                <div className={styles.chapterHeader}>
                  <span className={styles.chapterNumber}>{index + 1}</span>
                  <span className={styles.chapterTitle}>{chapter.title || `Chapter ${index + 1}`}</span>
                  {chapter.startTimeFormatted && chapter.endTimeFormatted && (
                    <span className={styles.time}>
                      {chapter.startTimeFormatted} - {chapter.endTimeFormatted}
                    </span>
                  )}
                </div>
                {chapter.summary && (
                  <p className={styles.chapterSummary}>{chapter.summary}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
