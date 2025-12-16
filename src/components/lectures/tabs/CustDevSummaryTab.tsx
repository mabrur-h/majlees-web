import { Icon } from '@iconify/react';
import type { CustDevData } from '../../../types';
import styles from './Tabs.module.css';

interface CustDevSummaryTabProps {
  custdevData?: CustDevData;
}

const getMoodEmoji = (mood: string) => {
  const lowerMood = mood.toLowerCase();
  if (lowerMood.includes('positive') || lowerMood.includes('happy') || lowerMood.includes('excited')) {
    return '😊';
  }
  if (lowerMood.includes('negative') || lowerMood.includes('frustrated') || lowerMood.includes('angry')) {
    return '😔';
  }
  if (lowerMood.includes('neutral') || lowerMood.includes('calm')) {
    return '😐';
  }
  if (lowerMood.includes('curious') || lowerMood.includes('interested')) {
    return '🤔';
  }
  return '💭';
};

export function CustDevSummaryTab({ custdevData }: CustDevSummaryTabProps) {
  if (!custdevData?.callSummary) {
    return (
      <div className={styles.empty}>
        <Icon icon="solar:users-group-rounded-linear" width={48} height={48} />
        <p>CustDev analysis not available yet</p>
      </div>
    );
  }

  const { callSummary } = custdevData;

  return (
    <div className={styles.custdevContainer}>
      {/* Call Summary Card */}
      <div className={styles.callSummaryCard}>
        <h3 className={styles.callTitle}>{callSummary.title}</h3>
        <p className={styles.callOverview}>{callSummary.overview}</p>

        {/* Customer Mood */}
        <div className={styles.moodCard}>
          <div className={styles.moodIcon}>
            {getMoodEmoji(callSummary.customerMood)}
          </div>
          <div className={styles.moodContent}>
            <div className={styles.moodLabel}>Customer Mood</div>
            <div className={styles.moodValue}>{callSummary.customerMood}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
