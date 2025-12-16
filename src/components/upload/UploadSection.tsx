import { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useUploadStore } from '../../stores/uploadStore';
import { useAuthStore } from '../../stores/authStore';
import { useLecturesStore } from '../../stores/lecturesStore';
import { formatBytes } from '../../utils';
import type { Language, SummarizationType } from '../../types';
import styles from './UploadSection.module.css';

const LANGUAGES: { value: Language; label: string; flag: string }[] = [
  { value: 'uz', label: 'O\'zbekcha', flag: '🇺🇿' },
  { value: 'ru', label: 'Ruscha', flag: '🇷🇺' },
  { value: 'en', label: 'Inglizcha', flag: '🇺🇸' },
];

const TYPES: { value: SummarizationType; label: string; icon: string; desc: string }[] = [
  { value: 'lecture', label: 'Lecture', icon: 'solar:document-text-bold', desc: 'Ma\'ruzalar va majlislar boblari bilan' },
  { value: 'custdev', label: 'CustDev', icon: 'solar:users-group-rounded-bold', desc: 'Mijozlar bilan suhbatlar va tahlillar' },
];

export function UploadSection() {
  const { isAuthenticated } = useAuthStore();
  const { loadLectures } = useLecturesStore();
  const {
    selectedFile,
    title,
    language,
    summarizationType,
    isUploading,
    progress,
    logs,
    setFile,
    setTitle,
    setLanguage,
    setSummarizationType,
    startUpload,
    cancelUpload,
  } = useUploadStore();

  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length) {
        setFile(e.dataTransfer.files[0]);
      }
    },
    [setFile]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.length) {
        setFile(e.target.files[0]);
      }
    },
    [setFile]
  );

  const handleUpload = () => {
    startUpload(() => {
      loadLectures();
    });
  };

  const canUpload = isAuthenticated && selectedFile && !isUploading;
  const isAudio = selectedFile?.type.startsWith('audio/');
  const isVideo = selectedFile?.type.startsWith('video/');

  const dropZoneClass = [
    styles.dropZone,
    isDragging ? styles.dragging : '',
    selectedFile ? styles.hasFile : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerIcon}>
          <Icon icon="solar:microphone-3-bold-duotone" width={32} height={32} />
        </div>
        <h1 className={styles.title}>Yangi yozuv</h1>
        <p className={styles.subtitle}>Transkripsiya qilish uchun audio yoki video yuklang</p>
      </div>

      {/* Drop Zone */}
      <div
        className={dropZoneClass}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="fileInput"
          accept="video/*,audio/*"
          onChange={handleFileChange}
          className={styles.fileInput}
        />

        <AnimatePresence mode="wait">
          {!selectedFile ? (
            <motion.label
              key="empty"
              htmlFor="fileInput"
              className={styles.dropContent}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className={styles.dropIcon}>
                <Icon icon="solar:cloud-upload-bold-duotone" width={48} height={48} />
              </div>
              <div className={styles.dropTextGroup}>
                <p className={styles.dropText}>
                  Fayl tanlash uchun bosing yoki bu yerga tashlang
                </p>
                <p className={styles.dropHint}>MP4, MP3, WAV, WebM 2GB gacha</p>
              </div>
            </motion.label>
          ) : (
            <motion.div
              key="file"
              className={styles.filePreview}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className={styles.fileIcon}>
                <Icon
                  icon={isAudio ? 'solar:music-note-2-bold' : isVideo ? 'solar:video-frame-bold' : 'solar:file-bold'}
                  width={24}
                  height={24}
                />
              </div>
              <div className={styles.fileInfo}>
                <p className={styles.fileName}>{selectedFile.name}</p>
                <p className={styles.fileSize}>{formatBytes(selectedFile.size)}</p>
              </div>
              {!isUploading && (
                <button className={styles.removeBtn} onClick={() => setFile(null)}>
                  <Icon icon="solar:close-circle-bold" width={22} height={22} />
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress */}
        {isUploading && progress && (
          <div className={styles.progress}>
            <div className={styles.progressBar}>
              <motion.div
                className={styles.progressFill}
                initial={{ width: 0 }}
                animate={{ width: `${progress.percentage}%` }}
              />
            </div>
            <p className={styles.progressText}>
              {progress.percentage}% yuklandi
            </p>
          </div>
        )}
      </div>

      {/* Options */}
      <div className={styles.options}>
        {/* Title */}
        <div className={styles.optionGroup}>
          <label className={styles.optionLabel}>
            <Icon icon="solar:text-bold" width={16} height={16} />
            Sarlavha (ixtiyoriy)
          </label>
          <input
            type="text"
            placeholder="Yozuvingizga nom bering"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={styles.textInput}
          />
        </div>

        {/* Language */}
        <div className={styles.optionGroup}>
          <label className={styles.optionLabel}>
            <Icon icon="solar:global-bold" width={16} height={16} />
            Til
          </label>
          <div className={styles.languageGrid}>
            {LANGUAGES.map((lang) => (
              <motion.button
                key={lang.value}
                className={`${styles.languageBtn} ${language === lang.value ? styles.active : ''}`}
                onClick={() => setLanguage(lang.value)}
                whileTap={{ scale: 0.97 }}
              >
                <span className={styles.langFlag}>{lang.flag}</span>
                <span>{lang.label}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Type */}
        <div className={styles.optionGroup}>
          <label className={styles.optionLabel}>
            <Icon icon="solar:magic-stick-3-bold" width={16} height={16} />
            Tahlil turi
          </label>
          <div className={styles.typeGrid}>
            {TYPES.map((type) => (
              <motion.button
                key={type.value}
                className={`${styles.typeBtn} ${summarizationType === type.value ? styles.active : ''}`}
                onClick={() => setSummarizationType(type.value)}
                whileTap={{ scale: 0.98 }}
              >
                <div className={styles.typeIcon}>
                  <Icon icon={type.icon} width={24} height={24} />
                </div>
                <div className={styles.typeInfo}>
                  <span className={styles.typeLabel}>{type.label}</span>
                  <span className={styles.typeDesc}>{type.desc}</span>
                </div>
                {summarizationType === type.value && (
                  <div className={styles.typeCheck}>
                    <Icon icon="solar:check-circle-bold" width={20} height={20} />
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        {!isUploading ? (
          <motion.button
            className={styles.uploadBtn}
            onClick={handleUpload}
            disabled={!canUpload}
            whileHover={{ scale: canUpload ? 1.02 : 1 }}
            whileTap={{ scale: canUpload ? 0.98 : 1 }}
          >
            <Icon icon="solar:play-bold" width={20} height={20} />
            <span>Ishga tushirish</span>
          </motion.button>
        ) : (
          <motion.button
            className={styles.cancelBtn}
            onClick={cancelUpload}
            whileTap={{ scale: 0.98 }}
          >
            <Icon icon="solar:stop-bold" width={20} height={20} />
            <span>Bekor qilish</span>
          </motion.button>
        )}
      </div>

      {/* Recent Logs */}
      {logs.length > 0 && (
        <div className={styles.logs}>
          <h3 className={styles.logsTitle}>
            <Icon icon="solar:history-bold" width={16} height={16} />
            Faoliyat
          </h3>
          <div className={styles.logsList}>
            {logs.slice(-5).map((log, index) => (
              <motion.div
                key={index}
                className={`${styles.logItem} ${styles[log.type]}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Icon
                  icon={
                    log.type === 'success'
                      ? 'solar:check-circle-bold'
                      : log.type === 'error'
                      ? 'solar:danger-triangle-bold'
                      : 'solar:refresh-bold'
                  }
                  width={16}
                  height={16}
                  className={log.type === 'info' ? styles.spinning : ''}
                />
                <span className={styles.logMessage}>{log.message}</span>
                <span className={styles.logTime}>{log.time}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
