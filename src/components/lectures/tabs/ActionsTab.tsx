import { Icon } from '@iconify/react';
import type { ActionItem } from '../../../types';
import { formatTimestamp } from '../../../utils';
import styles from './Tabs.module.css';

interface ActionsTabProps {
  actionItems?: ActionItem[];
}

export function ActionsTab({ actionItems }: ActionsTabProps) {
  if (!actionItems || actionItems.length === 0) {
    return (
      <div className={styles.empty}>
        <Icon icon="solar:checklist-linear" width={48} height={48} />
        <p>No action items identified</p>
      </div>
    );
  }

  return (
    <div className={styles.actionsContainer}>
      {actionItems.map((ai, index) => (
        <div key={index} className={styles.actionCard}>
          <div className={styles.actionHeader}>
            <span className={styles.actionIndex}>{index + 1}</span>
            <span className={styles.ownerBadge}>
              <Icon icon="solar:user-bold" width={12} height={12} />
              {ai.owner}
            </span>
          </div>
          <p className={styles.actionText}>{ai.action}</p>
          {/* {ai.timestampMs && (
            <div className={styles.keyPointFooter}>
              <span className={styles.time}>
                <Icon icon="solar:clock-circle-linear" width={12} height={12} />
                {formatTimestamp(ai.timestampMs)}
              </span>
            </div>
          )} */}
        </div>
      ))}
    </div>
  );
}
