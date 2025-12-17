import { useState, useEffect, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { api } from '../../services/api';
import type { LinkedAccountsStatus } from '../../types';
import styles from './LinkedAccounts.module.css';

interface LinkedAccountsProps {
  onAccountLinked?: () => void;
}

export function LinkedAccounts({ onAccountLinked }: LinkedAccountsProps) {
  const [status, setStatus] = useState<LinkedAccountsStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [linkingInProgress, setLinkingInProgress] = useState<'telegram' | 'google' | null>(null);
  const [unlinkingInProgress, setUnlinkingInProgress] = useState<'telegram' | 'google' | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await api.getLinkedAccountsStatus();
      if (response.success && response.data) {
        setStatus(response.data);
        setError(null);
      } else {
        setError(response.error?.message || "Ma'lumotlarni olishda xatolik");
      }
    } catch {
      setError("Server bilan bog'lanishda xatolik");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Poll for status changes when linking is in progress
  useEffect(() => {
    if (linkingInProgress === 'telegram') {
      const interval = setInterval(async () => {
        const response = await api.getLinkedAccountsStatus();
        if (response.success && response.data) {
          setStatus(response.data);
          if (response.data.telegram.linked) {
            setLinkingInProgress(null);
            onAccountLinked?.();
          }
        }
      }, 3000);

      // Stop polling after 5 minutes
      const timeout = setTimeout(() => {
        clearInterval(interval);
        setLinkingInProgress(null);
      }, 300000);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [linkingInProgress, onAccountLinked]);

  const handleLinkTelegram = async () => {
    setLinkingInProgress('telegram');
    setError(null);

    try {
      const response = await api.initTelegramLink();
      if (response.success && response.data) {
        // Open Telegram deep link in new tab
        window.open(response.data.deepLink, '_blank');
      } else {
        setError(response.error?.message || "Telegram ulashni boshlashda xatolik");
        setLinkingInProgress(null);
      }
    } catch {
      setError("Server bilan bog'lanishda xatolik");
      setLinkingInProgress(null);
    }
  };

  const handleUnlinkTelegram = async () => {
    if (!confirm("Telegram hisobingizni uzishni xohlaysizmi? Faqat Google orqali tizimga kirishingiz mumkin bo'ladi.")) {
      return;
    }

    setUnlinkingInProgress('telegram');
    setError(null);

    try {
      const response = await api.unlinkTelegram();
      if (response.success) {
        await fetchStatus();
        onAccountLinked?.();
      } else {
        setError(response.error?.message || "Telegram uzishda xatolik");
      }
    } catch {
      setError("Server bilan bog'lanishda xatolik");
    } finally {
      setUnlinkingInProgress(null);
    }
  };

  const handleUnlinkGoogle = async () => {
    if (!confirm("Google hisobingizni uzishni xohlaysizmi? Faqat Telegram orqali tizimga kirishingiz mumkin bo'ladi.")) {
      return;
    }

    setUnlinkingInProgress('google');
    setError(null);

    try {
      const response = await api.unlinkGoogle();
      if (response.success) {
        await fetchStatus();
        onAccountLinked?.();
      } else {
        setError(response.error?.message || "Google uzishda xatolik");
      }
    } catch {
      setError("Server bilan bog'lanishda xatolik");
    } finally {
      setUnlinkingInProgress(null);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <Icon icon="solar:refresh-circle-bold" width={24} height={24} className={styles.spinning} />
        <span>Yuklanmoqda...</span>
      </div>
    );
  }

  if (!status) {
    return null;
  }

  return (
    <div className={styles.container}>
      {error && (
        <div className={styles.error}>
          <Icon icon="solar:danger-triangle-bold" width={18} height={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Google Account */}
      <div className={styles.accountRow}>
        <div className={styles.accountInfo}>
          <div className={`${styles.accountIcon} ${styles.google}`}>
            <Icon icon="logos:google-icon" width={20} height={20} />
          </div>
          <div className={styles.accountDetails}>
            <span className={styles.accountProvider}>Google</span>
            {status.google.linked ? (
              <span className={styles.accountStatus}>
                <Icon icon="solar:check-circle-bold" width={14} height={14} className={styles.connectedIcon} />
                {status.google.email || 'Ulangan'}
              </span>
            ) : (
              <span className={styles.accountStatusDisconnected}>Ulanmagan</span>
            )}
          </div>
        </div>
        <div className={styles.accountActions}>
          {status.google.linked ? (
            <button
              className={styles.unlinkBtn}
              onClick={handleUnlinkGoogle}
              disabled={!status.telegram.linked || unlinkingInProgress === 'google'}
              title={!status.telegram.linked ? "Avval Telegram ulang" : ""}
            >
              {unlinkingInProgress === 'google' ? (
                <Icon icon="solar:refresh-circle-bold" width={16} height={16} className={styles.spinning} />
              ) : (
                <Icon icon="solar:link-broken-linear" width={16} height={16} />
              )}
              <span>Uzish</span>
            </button>
          ) : (
            <span className={styles.notAvailable}>
              <Icon icon="solar:info-circle-linear" width={14} height={14} />
              Web ilovada ulang
            </span>
          )}
        </div>
      </div>

      {/* Telegram Account */}
      <div className={styles.accountRow}>
        <div className={styles.accountInfo}>
          <div className={`${styles.accountIcon} ${styles.telegram}`}>
            <Icon icon="logos:telegram" width={20} height={20} />
          </div>
          <div className={styles.accountDetails}>
            <span className={styles.accountProvider}>Telegram</span>
            {status.telegram.linked ? (
              <span className={styles.accountStatus}>
                <Icon icon="solar:check-circle-bold" width={14} height={14} className={styles.connectedIcon} />
                @{status.telegram.username || 'Ulangan'}
              </span>
            ) : (
              <span className={styles.accountStatusDisconnected}>Ulanmagan</span>
            )}
          </div>
        </div>
        <div className={styles.accountActions}>
          {status.telegram.linked ? (
            <button
              className={styles.unlinkBtn}
              onClick={handleUnlinkTelegram}
              disabled={!status.google.linked || unlinkingInProgress === 'telegram'}
              title={!status.google.linked ? "Avval Google ulang" : ""}
            >
              {unlinkingInProgress === 'telegram' ? (
                <Icon icon="solar:refresh-circle-bold" width={16} height={16} className={styles.spinning} />
              ) : (
                <Icon icon="solar:link-broken-linear" width={16} height={16} />
              )}
              <span>Uzish</span>
            </button>
          ) : (
            <button
              className={styles.linkBtn}
              onClick={handleLinkTelegram}
              disabled={linkingInProgress === 'telegram'}
            >
              {linkingInProgress === 'telegram' ? (
                <>
                  <Icon icon="solar:refresh-circle-bold" width={16} height={16} className={styles.spinning} />
                  <span>Kutilmoqda...</span>
                </>
              ) : (
                <>
                  <Icon icon="solar:link-linear" width={16} height={16} />
                  <span>Ulash</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Info text */}
      <div className={styles.infoText}>
        <Icon icon="solar:info-circle-linear" width={16} height={16} />
        <span>
          Hisoblarni ulash orqali siz Google va Telegram orqali bir xil ma'lumotlarga kirishingiz mumkin.
          Kamida bitta autentifikatsiya usuli ulangan bo'lishi kerak.
        </span>
      </div>

      {/* Telegram linking instructions */}
      {linkingInProgress === 'telegram' && (
        <div className={styles.linkingInstructions}>
          <Icon icon="solar:chat-round-dots-linear" width={20} height={20} />
          <div>
            <strong>Telegram bot ochildi</strong>
            <p>Telegram ilovasida "START" tugmasini bosing va hisobingiz avtomatik ulanadi.</p>
          </div>
        </div>
      )}
    </div>
  );
}
