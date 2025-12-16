import { Icon } from '@iconify/react';
import type { KeyPoint } from '../../../types';
import styles from './Tabs.module.css';

interface KeyPointsTabProps {
  keyPoints?: KeyPoint[];
}

export function KeyPointsTab({ keyPoints }: KeyPointsTabProps) {
  if (!keyPoints || keyPoints.length === 0) {
    return (
      <div className={styles.empty}>
        <Icon icon="solar:star-linear" width={48} height={48} />
        <p>Key points not available yet</p>
      </div>
    );
  }

  const renderStars = (importance: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={styles.importanceStar}
        style={{ opacity: i < importance ? 1 : 0.3 }}
      >
        ★
      </span>
    ));
  };

  return (
    <div className={styles.keyPointsContainer}>
      {keyPoints.map((kp, index) => (
        <div key={index} className={styles.keyPointCard}>
          <div className={styles.keyPointHeader}>
            <span className={styles.keyPointIndex}>{kp.index}</span>
            <span className={styles.keyPointTitle}>{kp.title}</span>
          </div>
          {kp.description && (
            <p className={styles.keyPointDescription}>{kp.description}</p>
          )}
          {(kp.timestampFormatted || kp.importance) && (
            <div className={styles.keyPointFooter}>
              {kp.timestampFormatted && (
                <span className={styles.time}>
                  <Icon icon="solar:clock-circle-linear" width={12} height={12} />
                  {kp.timestampFormatted}
                </span>
              )}
              {kp.importance && (
                <span className={styles.importance}>
                  {renderStars(kp.importance)}
                </span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
