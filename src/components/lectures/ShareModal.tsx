import { useState, useEffect, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { Modal } from '../ui/Modal';
import { api } from '../../services/api';
import { telegram } from '../../services/telegram';
import type { Lecture, LectureShare, CreateShareRequest, UpdateShareRequest } from '../../types';
import styles from './ShareModal.module.css';

// Bot username for Telegram deep links - should match your bot
const BOT_USERNAME = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'uznotes_bot';

interface ShareModalProps {
  lecture: Lecture;
  isOpen: boolean;
  onClose: () => void;
}

type ShareTab = 'settings' | 'link';

export function ShareModal({ lecture, isOpen, onClose }: ShareModalProps) {
  const [activeTab, setActiveTab] = useState<ShareTab>('settings');
  const [share, setShare] = useState<LectureShare | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedTelegram, setCopiedTelegram] = useState(false);

  // Share settings
  const [showTranscription, setShowTranscription] = useState(true);
  const [showSummary, setShowSummary] = useState(true);
  const [showKeyPoints, setShowKeyPoints] = useState(true);
  const [isPublic, setIsPublic] = useState(true);
  const [customSlug, setCustomSlug] = useState('');

  // Load share settings when modal opens
  const loadShare = useCallback(async () => {
    if (!lecture.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.getShare(lecture.id);
      if (response.success && response.data?.share) {
        const shareData = response.data.share;
        setShare(shareData);
        setShowTranscription(shareData.showTranscription);
        setShowSummary(shareData.showSummary);
        setShowKeyPoints(shareData.showKeyPoints);
        setIsPublic(shareData.isPublic);
        setActiveTab('link');
      } else {
        // No share exists yet
        setShare(null);
        setActiveTab('settings');
      }
    } catch (err) {
      // Share not found is expected for new lectures
      setShare(null);
      setActiveTab('settings');
    } finally {
      setIsLoading(false);
    }
  }, [lecture.id]);

  useEffect(() => {
    if (isOpen) {
      loadShare();
      setCopied(false);
      setCopiedTelegram(false);
      setCustomSlug('');
    }
  }, [isOpen, loadShare]);

  const handleCreateShare = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const data: CreateShareRequest = {
        showTranscription,
        showSummary,
        showKeyPoints,
      };

      if (customSlug.trim()) {
        data.customSlug = customSlug.trim();
      }

      const response = await api.createShare(lecture.id, data);

      if (response.success && response.data) {
        setShare(response.data.share);
        setActiveTab('link');
      } else {
        setError(response.error?.message || 'Failed to create share link');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateShare = async () => {
    if (!share) return;

    setIsSaving(true);
    setError(null);

    try {
      const data: UpdateShareRequest = {
        isPublic,
        showTranscription,
        showSummary,
        showKeyPoints,
      };

      const response = await api.updateShare(lecture.id, data);

      if (response.success && response.data) {
        setShare(response.data.share);
      } else {
        setError(response.error?.message || 'Failed to update share settings');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteShare = async () => {
    if (!share) return;

    if (!window.confirm('Ulashish havolasini bekor qilmoqchimisiz? Havola bo\'lgan har kim endi bu yozuvga kira olmaydi.')) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const response = await api.deleteShare(lecture.id);

      if (response.success) {
        setShare(null);
        setActiveTab('settings');
      } else {
        setError(response.error?.message || 'Failed to revoke share link');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsDeleting(false);
    }
  };

  const getFullShareUrl = () => {
    // Use frontend URL with query parameter format
    const frontendUrl = window.location.origin;
    return share?.slug ? `${frontendUrl}?share=${share.slug}` : '';
  };

  const getTelegramDeepLink = () => {
    if (!share?.slug) return '';
    // Create a deep link that opens the mini app with the share slug as startapp param
    return telegram.generateDeepLink(BOT_USERNAME, `share_${share.slug}`);
  };

  const handleCopyLink = async () => {
    const url = getFullShareUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyTelegramLink = async () => {
    const url = getTelegramDeepLink();
    try {
      await navigator.clipboard.writeText(url);
      setCopiedTelegram(true);
      setTimeout(() => setCopiedTelegram(false), 2000);
    } catch (err) {
      const textarea = document.createElement('textarea');
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedTelegram(true);
      setTimeout(() => setCopiedTelegram(false), 2000);
    }
  };

  const handleShareViaTelegram = () => {
    const telegramLink = getTelegramDeepLink();
    const title = lecture.title || lecture.originalFilename;
    const text = `Check out my lecture notes: ${title}`;

    // Try to use Telegram's native share if available
    const shared = telegram.shareUrl(telegramLink, text);

    if (!shared) {
      // Fallback: open Telegram share URL in new window
      const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(telegramLink)}&text=${encodeURIComponent(text)}`;
      window.open(shareUrl, '_blank');
    }
  };

  const handleNativeShare = async () => {
    const url = getFullShareUrl();
    const title = lecture.title || lecture.originalFilename;

    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: `Check out my lecture notes: ${title}`,
          url: url,
        });
      } catch (err) {
        // User cancelled or error
        console.log('Share cancelled or failed:', err);
      }
    } else {
      // Fallback to copy
      handleCopyLink();
    }
  };

  const isCompleted = lecture.status === 'completed';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ulashish" size="md">
      <div className={styles.content}>
        {!isCompleted ? (
          <div className={styles.notCompleted}>
            <Icon icon="solar:hourglass-bold" width={48} height={48} />
            <h3>Yozuv tayyor emas</h3>
            <p>Faqat tayyor yozuvlarni ulashish mumkin. Jarayon tugashini kuting.</p>
          </div>
        ) : isLoading ? (
          <div className={styles.loading}>
            <Icon icon="solar:refresh-circle-bold" width={32} height={32} className={styles.spinning} />
            <span>Ulashish sozlamalari yuklanmoqda...</span>
          </div>
        ) : (
          <>
            {/* Tabs */}
            {share && (
              <div className={styles.tabs}>
                <button
                  className={`${styles.tab} ${activeTab === 'link' ? styles.active : ''}`}
                  onClick={() => setActiveTab('link')}
                >
                  <Icon icon="solar:link-linear" width={18} height={18} />
                  Ulashish havolasi
                </button>
                <button
                  className={`${styles.tab} ${activeTab === 'settings' ? styles.active : ''}`}
                  onClick={() => setActiveTab('settings')}
                >
                  <Icon icon="solar:settings-linear" width={18} height={18} />
                  Sozlamalar
                </button>
              </div>
            )}

            {error && (
              <div className={styles.error}>
                <Icon icon="solar:danger-triangle-bold" width={18} height={18} />
                <span>{error}</span>
              </div>
            )}

            {activeTab === 'link' && share ? (
              <div className={styles.linkTab}>
                {/* View count */}
                <div className={styles.viewCount}>
                  <Icon icon="solar:eye-bold" width={20} height={20} />
                  <span>{share.viewCount} ta ko'rish</span>
                </div>

                {/* Web Link Section */}
                <div className={styles.linkSection}>
                  <label className={styles.linkLabel}>
                    <Icon icon="solar:global-linear" width={16} height={16} />
                    Web havola
                  </label>
                  <div className={styles.linkBox}>
                    <input
                      type="text"
                      readOnly
                      value={getFullShareUrl()}
                      className={styles.linkInput}
                    />
                    <button
                      className={`${styles.copyBtn} ${copied ? styles.copied : ''}`}
                      onClick={handleCopyLink}
                    >
                      <Icon
                        icon={copied ? 'solar:check-circle-bold' : 'solar:copy-linear'}
                        width={20}
                        height={20}
                      />
                    </button>
                  </div>
                </div>

                {/* Telegram Deep Link Section */}
                <div className={styles.linkSection}>
                  <label className={styles.linkLabel}>
                    <Icon icon="logos:telegram" width={16} height={16} />
                    Telegram havola
                  </label>
                  <div className={styles.linkBox}>
                    <input
                      type="text"
                      readOnly
                      value={getTelegramDeepLink()}
                      className={styles.linkInput}
                    />
                    <button
                      className={`${styles.copyBtn} ${copiedTelegram ? styles.copied : ''}`}
                      onClick={handleCopyTelegramLink}
                    >
                      <Icon
                        icon={copiedTelegram ? 'solar:check-circle-bold' : 'solar:copy-linear'}
                        width={20}
                        height={20}
                      />
                    </button>
                  </div>
                  <p className={styles.linkHint}>
                    Yozuvni to'g'ridan-to'g'ri Telegram Mini App da ochish uchun bu havolani ulashing
                  </p>
                </div>

                {/* Share Buttons */}
                <div className={styles.shareButtons}>
                  <button className={styles.telegramBtn} onClick={handleShareViaTelegram}>
                    <Icon icon="logos:telegram" width={20} height={20} />
                    Telegram orqali ulashish
                  </button>
                  {typeof navigator.share === 'function' && (
                    <button className={styles.shareBtn} onClick={handleNativeShare}>
                      <Icon icon="solar:share-linear" width={20} height={20} />
                      Boshqa usullar
                    </button>
                  )}
                </div>

                {/* Visibility Toggle */}
                <div className={styles.visibilityToggle}>
                  <div className={styles.toggleInfo}>
                    <Icon
                      icon={isPublic ? 'solar:eye-bold' : 'solar:eye-closed-bold'}
                      width={20}
                      height={20}
                    />
                    <div>
                      <span className={styles.toggleLabel}>
                        {isPublic ? 'Havola faol' : 'Havola o\'chirilgan'}
                      </span>
                      <span className={styles.toggleHint}>
                        {isPublic
                          ? 'Havola bo\'lgan har kim bu yozuvni ko\'rishi mumkin'
                          : 'Havola vaqtincha o\'chirilgan'}
                      </span>
                    </div>
                  </div>
                  <button
                    className={`${styles.toggle} ${isPublic ? styles.active : ''}`}
                    onClick={() => {
                      setIsPublic(!isPublic);
                      // Auto-save toggle
                      setTimeout(() => {
                        api.updateShare(lecture.id, {
                          isPublic: !isPublic,
                          showTranscription,
                          showSummary,
                          showKeyPoints,
                        }).then(response => {
                          if (response.success && response.data) {
                            setShare(response.data.share);
                          }
                        });
                      }, 0);
                    }}
                  >
                    <span className={styles.toggleThumb} />
                  </button>
                </div>

                {/* Revoke Button */}
                <button
                  className={styles.revokeBtn}
                  onClick={handleDeleteShare}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <Icon icon="solar:refresh-circle-bold" width={18} height={18} className={styles.spinning} />
                      Bekor qilinmoqda...
                    </>
                  ) : (
                    <>
                      <Icon icon="solar:trash-bin-trash-linear" width={18} height={18} />
                      Havolani bekor qilish
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className={styles.settingsTab}>
                <p className={styles.settingsIntro}>
                  {share
                    ? 'Ulashilgan yozuvda nimani ko\'rsatishni tanlang:'
                    : 'Bu yozuvni ulashish uchun umumiy havola yarating. Nimalarni kiritishni tanlang:'}
                </p>

                {/* Content Toggles */}
                <div className={styles.toggleGroup}>
                  <div className={styles.toggleItem}>
                    <div className={styles.toggleItemInfo}>
                      <Icon icon="solar:document-text-bold" width={20} height={20} />
                      <div>
                        <span className={styles.toggleLabel}>Transkripsiya</span>
                        <span className={styles.toggleHint}>Vaqt belgilari bilan to'liq matn</span>
                      </div>
                    </div>
                    <button
                      className={`${styles.toggle} ${showTranscription ? styles.active : ''}`}
                      onClick={() => setShowTranscription(!showTranscription)}
                    >
                      <span className={styles.toggleThumb} />
                    </button>
                  </div>

                  <div className={styles.toggleItem}>
                    <div className={styles.toggleItemInfo}>
                      <Icon icon="solar:list-check-bold" width={20} height={20} />
                      <div>
                        <span className={styles.toggleLabel}>Xulosa</span>
                        <span className={styles.toggleHint}>Umumiy ko'rinish va boblar</span>
                      </div>
                    </div>
                    <button
                      className={`${styles.toggle} ${showSummary ? styles.active : ''}`}
                      onClick={() => setShowSummary(!showSummary)}
                    >
                      <span className={styles.toggleThumb} />
                    </button>
                  </div>

                  <div className={styles.toggleItem}>
                    <div className={styles.toggleItemInfo}>
                      <Icon icon="solar:star-bold" width={20} height={20} />
                      <div>
                        <span className={styles.toggleLabel}>Asosiy fikrlar</span>
                        <span className={styles.toggleHint}>Asosiy xulosalar va muhim nuqtalar</span>
                      </div>
                    </div>
                    <button
                      className={`${styles.toggle} ${showKeyPoints ? styles.active : ''}`}
                      onClick={() => setShowKeyPoints(!showKeyPoints)}
                    >
                      <span className={styles.toggleThumb} />
                    </button>
                  </div>
                </div>

                {/* Custom Slug (only for new shares) */}
                {!share && (
                  <div className={styles.customSlug}>
                    <label className={styles.slugLabel}>
                      <Icon icon="solar:link-linear" width={16} height={16} />
                      Maxsus URL (ixtiyoriy)
                    </label>
                    <div className={styles.slugInputWrapper}>
                      <span className={styles.slugPrefix}>/s/</span>
                      <input
                        type="text"
                        className={styles.slugInput}
                        value={customSlug}
                        onChange={(e) => setCustomSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                        placeholder="mening-havolam"
                      />
                    </div>
                    <p className={styles.slugHint}>
                      Sarlavhadan avtomatik yaratish uchun bo'sh qoldiring
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className={styles.actions}>
                  <button className={styles.cancelBtn} onClick={onClose}>
                    Bekor qilish
                  </button>
                  <button
                    className={styles.saveBtn}
                    onClick={share ? handleUpdateShare : handleCreateShare}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Icon icon="solar:refresh-circle-bold" width={18} height={18} className={styles.spinning} />
                        {share ? 'Saqlanmoqda...' : 'Yaratilmoqda...'}
                      </>
                    ) : (
                      <>
                        <Icon icon={share ? 'solar:check-circle-bold' : 'solar:link-bold'} width={18} height={18} />
                        {share ? 'O\'zgarishlarni saqlash' : 'Ulashish havolasini yaratish'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
