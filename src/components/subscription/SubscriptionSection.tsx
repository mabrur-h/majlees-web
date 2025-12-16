import { useEffect } from 'react';
import { Icon } from '@iconify/react';
import { useSubscriptionStore } from '../../stores/subscriptionStore';
import styles from './SubscriptionSection.module.css';

interface SubscriptionSectionProps {
  onUpgrade?: () => void;
}

export function SubscriptionSection({ onUpgrade }: SubscriptionSectionProps) {
  const { balance, isLoadingBalance, fetchBalance } = useSubscriptionStore();

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  if (isLoadingBalance) {
    return (
      <div className={styles.loading}>
        <Icon icon="solar:refresh-circle-bold" width={24} height={24} className={styles.spinning} />
        <span>Balans yuklanmoqda...</span>
      </div>
    );
  }

  if (!balance) {
    return null;
  }

  const percentage = balance.planMinutesTotal > 0
    ? Math.round((balance.planMinutesRemaining / balance.planMinutesTotal) * 100)
    : 0;

  const daysRemaining = Math.ceil(
    (new Date(balance.billingCycleEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className={styles.container}>
      {/* Plan Info */}
      <div className={styles.planInfo}>
        <div className={styles.planBadge}>
          <Icon icon="solar:crown-linear" width={16} height={16} />
          <span>{balance.planDisplayName}</span>
        </div>
        {daysRemaining > 0 && (
          <span className={styles.renewDate}>
            Yangilanadi {formatDate(balance.billingCycleEnd)}
          </span>
        )}
      </div>

      {/* Minutes Progress */}
      <div className={styles.minutesSection}>
        <div className={styles.minutesHeader}>
          <span className={styles.minutesLabel}>Plan daqiqalari</span>
          <span className={styles.minutesValue}>
            {balance.planMinutesRemaining} / {balance.planMinutesTotal} daq
          </span>
        </div>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Bonus Minutes */}
      {balance.bonusMinutes > 0 && (
        <div className={styles.bonusSection}>
          <Icon icon="solar:gift-linear" width={18} height={18} />
          <span>Bonus: {balance.bonusMinutes} daq</span>
        </div>
      )}

      {/* Total Available */}
      <div className={styles.totalSection}>
        <div className={styles.totalLabel}>
          <Icon icon="solar:clock-circle-linear" width={20} height={20} />
          <span>Jami mavjud</span>
        </div>
        <span className={styles.totalValue}>{balance.totalAvailable} daq</span>
      </div>

      {/* Upgrade Button */}
      {onUpgrade && (
        <button className={styles.upgradeBtn} onClick={onUpgrade}>
          <Icon icon="solar:arrow-up-linear" width={18} height={18} />
          <span>Tarifni yangilash</span>
        </button>
      )}
    </div>
  );
}
