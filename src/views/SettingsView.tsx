import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@iconify/react';
import { useAuthStore } from '../stores/authStore';
import { SubscriptionSection, PricingSection } from '../components/subscription';
import styles from './SettingsView.module.css';

export function SettingsView() {
  const { user } = useAuthStore();
  const [showPricing, setShowPricing] = useState(false);

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Sozlamalar</h1>
          <p className={styles.subtitle}>Hisobingiz va sozlamalarni boshqaring</p>
        </div>
      </div>

      {/* Account Section */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <Icon icon="solar:user-circle-linear" width={20} height={20} />
          <h2 className={styles.sectionTitle}>Hisob</h2>
        </div>
        <div className={styles.card}>
          <div className={styles.accountInfo}>
            <div className={styles.avatar}>
              {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
            </div>
            <div className={styles.accountDetails}>
              <span className={styles.email}>{user?.name || user?.email || 'Tizimga kirilmagan'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Subscription Section */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <Icon icon="solar:crown-linear" width={20} height={20} />
          <h2 className={styles.sectionTitle}>Obuna</h2>
        </div>
        <div className={styles.card}>
          <SubscriptionSection onUpgrade={() => setShowPricing(true)} />
        </div>
      </section>

      {/* API Configuration - commented out for now
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <Icon icon="solar:server-linear" width={20} height={20} />
          <h2 className={styles.sectionTitle}>API Configuration</h2>
        </div>
        <div className={styles.card}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Backend URL</label>
            <p className={styles.labelHint}>Enter the URL of your backend server</p>
            <div className={styles.inputRow}>
              <div className={styles.inputWrapper}>
                <Icon icon="solar:link-linear" width={18} height={18} className={styles.inputIcon} />
                <input
                  type="text"
                  value={tempUrl}
                  onChange={(e) => setTempUrl(e.target.value)}
                  placeholder="http://localhost:3000"
                  className={styles.input}
                />
              </div>
              <button
                className={styles.testBtn}
                onClick={handleSaveUrl}
                disabled={isTesting}
              >
                {isTesting ? (
                  <Icon icon="solar:refresh-circle-bold" width={18} height={18} className={styles.spinning} />
                ) : (
                  <>
                    <Icon icon="solar:check-circle-linear" width={18} height={18} />
                    <span>Test</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {logs.length > 0 && (
            <div className={styles.logs}>
              {logs.slice(-3).map((log, index) => (
                <div
                  key={index}
                  className={`${styles.logItem} ${styles[log.type]}`}
                >
                  {log.type === 'success' ? (
                    <Icon icon="solar:check-circle-bold" width={16} height={16} />
                  ) : log.type === 'error' ? (
                    <Icon icon="solar:danger-triangle-bold" width={16} height={16} />
                  ) : (
                    <Icon icon="solar:refresh-circle-bold" width={16} height={16} className={styles.spinning} />
                  )}
                  <span>{log.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
      */}

      {/* Preferences - commented out for now
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <Icon icon="solar:tuning-2-linear" width={20} height={20} />
          <h2 className={styles.sectionTitle}>Preferences</h2>
        </div>
        <div className={styles.card}>
          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <Icon icon="solar:moon-linear" width={20} height={20} />
              <div>
                <span className={styles.settingLabel}>Dark Mode</span>
                <span className={styles.settingHint}>Always on in neotech theme</span>
              </div>
            </div>
            <div className={styles.toggle + ' ' + styles.active}>
              <div className={styles.toggleKnob} />
            </div>
          </div>

          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <Icon icon="solar:bell-linear" width={20} height={20} />
              <div>
                <span className={styles.settingLabel}>Notifications</span>
                <span className={styles.settingHint}>Get notified when processing completes</span>
              </div>
            </div>
            <div className={styles.toggle}>
              <div className={styles.toggleKnob} />
            </div>
          </div>

          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <Icon icon="solar:translation-linear" width={20} height={20} />
              <div>
                <span className={styles.settingLabel}>Auto-detect Language</span>
                <span className={styles.settingHint}>Automatically detect recording language</span>
              </div>
            </div>
            <div className={styles.toggle + ' ' + styles.active}>
              <div className={styles.toggleKnob} />
            </div>
          </div>
        </div>
      </section>
      */}

      {/* About */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <Icon icon="solar:info-circle-linear" width={20} height={20} />
          <h2 className={styles.sectionTitle}>Haqida</h2>
        </div>
        <div className={styles.card}>
          <div className={styles.aboutContent}>
            <div className={styles.aboutLogo}>
              <Icon icon="solar:magic-stick-3-bold" width={32} height={32} />
            </div>
            <div className={styles.aboutInfo}>
              <h3>Majlees AI</h3>
              <p className={styles.version}>Versiya 0.1.0</p>
              <p className={styles.aboutDesc}>
                AI asosida majlis transkripsiyasi va xulosa
              </p>
            </div>
          </div>
          <div className={styles.aboutLinks}>
            <a href="#" className={styles.aboutLink}>
              <Icon icon="solar:document-text-linear" width={16} height={16} />
              <span>Hujjatlar</span>
            </a>
            <a href="#" className={styles.aboutLink}>
              <Icon icon="solar:shield-check-linear" width={16} height={16} />
              <span>Maxfiylik siyosati</span>
            </a>
            <a href="#" className={styles.aboutLink}>
              <Icon icon="solar:chat-round-line-linear" width={16} height={16} />
              <span>Yordam</span>
            </a>
          </div>
        </div>
      </section>

      {/* Pricing Modal - rendered via portal to escape stacking context */}
      {showPricing && createPortal(
        <div className={styles.modalOverlay} onClick={() => setShowPricing(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <PricingSection onClose={() => setShowPricing(false)} />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
