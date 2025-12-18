import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { seekAudioTo } from '../../audio';
import type { Transcription } from '../../../types';
import styles from './Tabs.module.css';

interface TranscriptionTabProps {
  transcription?: Transcription;
  onSeek?: (timeMs: number) => void;
}

export function TranscriptionTab({ transcription, onSeek }: TranscriptionTabProps) {
  const [isFullTextExpanded, setIsFullTextExpanded] = useState(false);
  const [isSegmentsExpanded, setIsSegmentsExpanded] = useState(false);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number | null>(null);
  const segmentRefs = useRef<(HTMLDivElement | null)[]>([]);
  const segmentsListRef = useRef<HTMLDivElement>(null);

  // Find the segment that matches the current audio time
  const findSegmentByTime = useCallback((timeMs: number) => {
    if (!transcription?.segments) return -1;

    return transcription.segments.findIndex((segment, index) => {
      const startTime = segment.startTimeMs ?? segment.startTime ?? 0;
      const endTime = segment.endTimeMs ?? segment.endTime ?? (
        transcription.segments![index + 1]
          ? (transcription.segments![index + 1].startTimeMs ?? transcription.segments![index + 1].startTime ?? 0)
          : Infinity
      );
      return timeMs >= startTime && timeMs < endTime;
    });
  }, [transcription?.segments]);

  // Listen for audio time updates
  useEffect(() => {
    const handleTimeUpdate = (e: CustomEvent<{ currentTimeMs: number }>) => {
      const index = findSegmentByTime(e.detail.currentTimeMs);
      if (index !== -1 && index !== activeSegmentIndex) {
        setActiveSegmentIndex(index);
        // Auto-scroll to active segment
        if (isSegmentsExpanded && segmentRefs.current[index]) {
          segmentRefs.current[index]?.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        }
      }
    };

    window.addEventListener('audio-time-update', handleTimeUpdate as EventListener);
    return () => {
      window.removeEventListener('audio-time-update', handleTimeUpdate as EventListener);
    };
  }, [findSegmentByTime, activeSegmentIndex, isSegmentsExpanded]);

  // Handle segment click - seek audio and scroll
  const handleSegmentClick = (index: number, startTimeMs: number | undefined) => {
    if (startTimeMs !== undefined) {
      seekAudioTo(startTimeMs);
      onSeek?.(startTimeMs);
      setActiveSegmentIndex(index);
    }
  };

  if (!transcription) {
    return (
      <div className={styles.empty}>
        <Icon icon="solar:document-text-linear" width={48} height={48} />
        <p>Transkripsiya hali mavjud emas</p>
      </div>
    );
  }

  const hasSegments = transcription.segments && transcription.segments.length > 0;

  return (
    <div className={styles.transcriptionContainer}>
      {/* Full Text Section - Collapsible */}
      <div className={styles.collapsibleSection}>
        <button
          className={styles.collapsibleHeader}
          onClick={() => setIsFullTextExpanded(!isFullTextExpanded)}
        >
          <div className={styles.collapsibleTitle}>
            <Icon icon="solar:document-text-bold" width={20} height={20} />
            <span>To'liq matn</span>
            <span className={styles.wordCount}>{transcription.wordCount || 0} so'z</span>
          </div>
          <motion.div
            animate={{ rotate: isFullTextExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <Icon icon="solar:alt-arrow-down-linear" width={20} height={20} />
          </motion.div>
        </button>

        <AnimatePresence>
          {isFullTextExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={styles.collapsibleContent}
            >
              <div className={styles.transcriptText}>
                {transcription.fullText}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Segments Section - Collapsible */}
      {hasSegments && (
        <div className={styles.collapsibleSection}>
          <button
            className={styles.collapsibleHeader}
            onClick={() => setIsSegmentsExpanded(!isSegmentsExpanded)}
          >
            <div className={styles.collapsibleTitle}>
              <Icon icon="solar:list-check-bold" width={20} height={20} />
              <span>Vaqt belgilari</span>
              <span className={styles.wordCount}>{transcription.segments!.length} segment</span>
            </div>
            <motion.div
              animate={{ rotate: isSegmentsExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <Icon icon="solar:alt-arrow-down-linear" width={20} height={20} />
            </motion.div>
          </button>

          <AnimatePresence>
            {isSegmentsExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className={styles.collapsibleContent}
              >
                <div className={styles.segmentsList} ref={segmentsListRef}>
                  {transcription.segments!.map((segment, index) => {
                    const startTimeMs = segment.startTimeMs ?? segment.startTime;
                    const isActive = activeSegmentIndex === index;
                    return (
                      <div
                        key={index}
                        ref={(el) => { segmentRefs.current[index] = el; }}
                        className={`${styles.segment} ${isActive ? styles.segmentActive : ''}`}
                        onClick={() => handleSegmentClick(index, startTimeMs)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            handleSegmentClick(index, startTimeMs);
                          }
                        }}
                      >
                        <div className={styles.segmentHeader}>
                          <span className={styles.timeBtn}>
                            <Icon icon={isActive ? "solar:play-bold" : "solar:play-circle-linear"} width={14} height={14} />
                            {segment.startTimeFormatted}
                          </span>
                          {segment.speaker && (
                            <span className={styles.speaker}>{segment.speaker}</span>
                          )}
                        </div>
                        <div className={styles.segmentText}>{segment.text}</div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Collapsed hint */}
      {!isFullTextExpanded && !isSegmentsExpanded && (
        <div className={styles.collapsedHint}>
          <Icon icon="solar:info-circle-linear" width={16} height={16} />
          <span>Kontentni kengaytirish uchun yuqoridagi bo'limlarni bosing</span>
        </div>
      )}
    </div>
  );
}
