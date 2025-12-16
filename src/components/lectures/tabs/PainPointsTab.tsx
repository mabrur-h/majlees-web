import { Icon } from '@iconify/react';
import type { PainPoint } from '../../../types';
import styles from './Tabs.module.css';

interface PainPointsTabProps {
  painPoints?: PainPoint[];
}

export function PainPointsTab({ painPoints }: PainPointsTabProps) {
  if (!painPoints || painPoints.length === 0) {
    return (
      <div className={styles.empty}>
        <Icon icon="solar:danger-circle-linear" width={48} height={48} />
        <p>No pain points identified</p>
      </div>
    );
  }

  return (
    <div className={styles.painPointsContainer}>
      {painPoints.map((pp, index) => (
        <div key={index} className={styles.painPointCard}>
          <div className={styles.painPointHeader}>
            <div className={styles.painPointIcon}>
              <Icon icon="solar:danger-triangle-bold" width={18} height={18} />
            </div>
            <span className={styles.painPointTitle}>{pp.painPoint}</span>
          </div>
          <div className={styles.painPointImpact}>
            <div className={styles.impactLabel}>
              <Icon icon="solar:bolt-circle-linear" width={12} height={12} />
              Impact
            </div>
            <p className={styles.impactText}>{pp.impact}</p>
          </div>
          {/* {pp.timestampMs && (
            <div className={styles.keyPointFooter}>
              <span className={styles.time}>
                <Icon icon="solar:clock-circle-linear" width={12} height={12} />
                {formatTimestamp(pp.timestampMs)}
              </span>
            </div>
          )} */}
        </div>
      ))}
    </div>
  );
}
