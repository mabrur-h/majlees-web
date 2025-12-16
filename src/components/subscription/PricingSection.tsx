import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { useSubscriptionStore } from '../../stores/subscriptionStore';
import type { SubscriptionPlan, MinutePackage } from '../../types';
import styles from './PricingSection.module.css';

type TabType = 'plans' | 'packages';

interface PricingSectionProps {
  onClose?: () => void;
}

export function PricingSection({ onClose }: PricingSectionProps) {
  const [activeTab, setActiveTab] = useState<TabType>('plans');
  const [confirmPlan, setConfirmPlan] = useState<SubscriptionPlan | null>(null);
  const [confirmPackage, setConfirmPackage] = useState<MinutePackage | null>(null);

  const {
    plans,
    packages,
    balance,
    isLoadingPlans,
    isLoadingPackages,
    isActivatingPlan,
    isPurchasingPackage,
    error,
    fetchPlans,
    fetchPackages,
    fetchBalance,
    activatePlan,
    purchasePackage,
    clearError,
  } = useSubscriptionStore();

  useEffect(() => {
    fetchPlans();
    fetchPackages();
    fetchBalance();
  }, [fetchPlans, fetchPackages, fetchBalance]);

  const formatPrice = (priceUzs: number) => {
    if (priceUzs === 0) return "Bepul";
    return new Intl.NumberFormat('uz-UZ').format(priceUzs) + " so'm";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Check if user can change plans (only if on free plan or no plan at all)
  const isOnFreePlan = balance?.planName === 'free';
  const hasNoPlan = !balance || !balance.planName || balance.planName === 'none';
  const canChangePlan = hasNoPlan || isOnFreePlan;

  const handleActivatePlan = async (plan: SubscriptionPlan) => {
    const success = await activatePlan(plan.name);
    if (success) {
      setConfirmPlan(null);
    }
  };

  const handlePurchasePackage = async (pkg: MinutePackage) => {
    const success = await purchasePackage(pkg.name);
    if (success) {
      setConfirmPackage(null);
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h2 className={styles.title}>Narxlar</h2>
          <p className={styles.subtitle}>Tarif tanlang yoki qo'shimcha daqiqa sotib oling</p>
        </div>
        {onClose && (
          <button className={styles.closeBtn} onClick={onClose}>
            <Icon icon="solar:close-circle-linear" width={24} height={24} />
          </button>
        )}
      </div>

      {/* Current Balance */}
      {balance && (
        <div className={styles.currentBalance}>
          <Icon icon="solar:clock-circle-linear" width={20} height={20} />
          <span>Joriy balans: <strong>{balance.totalAvailable} daq</strong></span>
        </div>
      )}

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'plans' ? styles.active : ''}`}
          onClick={() => setActiveTab('plans')}
        >
          <Icon icon="solar:crown-linear" width={18} height={18} />
          <span>Tariflar</span>
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'packages' ? styles.active : ''}`}
          onClick={() => setActiveTab('packages')}
        >
          <Icon icon="solar:add-circle-linear" width={18} height={18} />
          <span>Qo'shimcha daqiqalar</span>
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className={styles.error}>
          <Icon icon="solar:danger-triangle-linear" width={18} height={18} />
          <span>{error}</span>
          <button onClick={clearError}>
            <Icon icon="solar:close-circle-linear" width={16} height={16} />
          </button>
        </div>
      )}

      {/* Plans */}
      {activeTab === 'plans' && (
        <>
          {/* Notice for paid plan users */}
          {!canChangePlan && balance && balance.planName && balance.planName !== 'none' && (
            <div className={styles.planChangeNotice}>
              <Icon icon="solar:info-circle-linear" width={18} height={18} />
              <span>
                Tarifni faqat hozirgi davr tugagandan so'ng o'zgartirish mumkin.
                Keyingi sana: <strong>{formatDate(balance.billingCycleEnd)}</strong>
              </span>
            </div>
          )}
          <div className={styles.plansGrid}>
            {isLoadingPlans ? (
              <div className={styles.loading}>
                <Icon icon="solar:refresh-circle-bold" width={24} height={24} className={styles.spinning} />
                <span>Tariflar yuklanmoqda...</span>
              </div>
            ) : (
              plans.map((plan) => {
                const isCurrentPlan = balance?.planName === plan.name;
                return (
                  <div
                    key={plan.id}
                    className={`${styles.planCard} ${isCurrentPlan ? styles.current : ''}`}
                  >
                    {isCurrentPlan && (
                      <div className={styles.currentBadge}>
                        <Icon icon="solar:check-circle-bold" width={14} height={14} />
                        <span>Joriy</span>
                      </div>
                    )}
                    <div className={styles.planHeader}>
                      <h3 className={styles.planName}>{plan.displayNameUz || plan.displayName}</h3>
                      <div className={styles.planPrice}>
                        <span className={styles.priceValue}>{formatPrice(plan.priceUzs)}</span>
                        {plan.priceUzs > 0 && <span className={styles.pricePeriod}>/oy</span>}
                      </div>
                    </div>
                    <div className={styles.planMinutes}>
                      <Icon icon="solar:clock-circle-linear" width={18} height={18} />
                      <span>{plan.minutesPerMonth} daqiqa/oy</span>
                    </div>
                    {plan.featuresUz && plan.featuresUz.length > 0 && (
                      <ul className={styles.featuresList}>
                        {plan.featuresUz.map((feature, idx) => (
                          <li key={idx}>
                            <Icon icon="solar:check-circle-linear" width={16} height={16} />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {!isCurrentPlan && (
                      <button
                        className={styles.selectBtn}
                        onClick={() => setConfirmPlan(plan)}
                        disabled={isActivatingPlan || !canChangePlan}
                      >
                        {plan.priceUzs === 0 ? 'Tanlash' : "Tarifni o'zgartirish"}
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* Packages */}
      {activeTab === 'packages' && (
        <div className={styles.packagesGrid}>
          {isLoadingPackages ? (
            <div className={styles.loading}>
              <Icon icon="solar:refresh-circle-bold" width={24} height={24} className={styles.spinning} />
              <span>Paketlar yuklanmoqda...</span>
            </div>
          ) : (
            packages.map((pkg) => (
              <div key={pkg.id} className={styles.packageCard}>
                <div className={styles.packageHeader}>
                  <h3 className={styles.packageName}>{pkg.displayNameUz || pkg.displayName}</h3>
                  <div className={styles.packageMinutes}>
                    <Icon icon="solar:clock-circle-linear" width={18} height={18} />
                    <span>{pkg.minutes} daqiqa</span>
                  </div>
                </div>
                <div className={styles.packagePrice}>
                  {formatPrice(pkg.priceUzs)}
                </div>
                {pkg.descriptionUz && (
                  <p className={styles.packageDesc}>{pkg.descriptionUz}</p>
                )}
                <button
                  className={styles.buyBtn}
                  onClick={() => setConfirmPackage(pkg)}
                  disabled={isPurchasingPackage}
                >
                  <Icon icon="solar:cart-plus-linear" width={18} height={18} />
                  <span>Sotib olish</span>
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Confirm Plan Modal */}
      {confirmPlan && (
        <div className={styles.modalOverlay} onClick={() => setConfirmPlan(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Tarifni tasdiqlash</h3>
            <p className={styles.modalText}>
              <strong>{confirmPlan.displayNameUz || confirmPlan.displayName}</strong> tarifiga
              o'tmoqchimisiz?
            </p>
            <p className={styles.modalSubtext}>
              Narxi: {formatPrice(confirmPlan.priceUzs)}/oy
            </p>
            <div className={styles.modalActions}>
              <button
                className={styles.cancelBtn}
                onClick={() => setConfirmPlan(null)}
                disabled={isActivatingPlan}
              >
                Bekor qilish
              </button>
              <button
                className={styles.confirmBtn}
                onClick={() => handleActivatePlan(confirmPlan)}
                disabled={isActivatingPlan}
              >
                {isActivatingPlan ? (
                  <Icon icon="solar:refresh-circle-bold" width={18} height={18} className={styles.spinning} />
                ) : (
                  'Tasdiqlash'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Package Modal */}
      {confirmPackage && (
        <div className={styles.modalOverlay} onClick={() => setConfirmPackage(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Sotib olishni tasdiqlash</h3>
            <p className={styles.modalText}>
              <strong>{confirmPackage.minutes} daqiqa</strong> sotib olmoqchimisiz?
            </p>
            <p className={styles.modalSubtext}>
              Narxi: {formatPrice(confirmPackage.priceUzs)}
            </p>
            <div className={styles.modalActions}>
              <button
                className={styles.cancelBtn}
                onClick={() => setConfirmPackage(null)}
                disabled={isPurchasingPackage}
              >
                Bekor qilish
              </button>
              <button
                className={styles.confirmBtn}
                onClick={() => handlePurchasePackage(confirmPackage)}
                disabled={isPurchasingPackage}
              >
                {isPurchasingPackage ? (
                  <Icon icon="solar:refresh-circle-bold" width={18} height={18} className={styles.spinning} />
                ) : (
                  'Sotib olish'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
