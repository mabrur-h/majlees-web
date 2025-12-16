import { useState, useEffect, useRef } from 'react';
import { Icon } from '@iconify/react';
import { Modal } from '../ui/Modal';
import { useLecturesStore } from '../../stores/lecturesStore';
import { useFoldersStore } from '../../stores/foldersStore';
import { useTagsStore } from '../../stores/tagsStore';
import type { Lecture, Language } from '../../types';
import styles from './LectureEditModal.module.css';

const TAG_COLORS = [
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#14b8a6', // Teal
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
];

interface LectureEditModalProps {
  lecture: Lecture;
  isOpen: boolean;
  onClose: () => void;
}

const LANGUAGE_OPTIONS: { value: Language; label: string }[] = [
  { value: 'uz', label: 'O\'zbekcha' },
  { value: 'ru', label: 'Ruscha' },
  { value: 'en', label: 'Inglizcha' },
];

export function LectureEditModal({ lecture, isOpen, onClose }: LectureEditModalProps) {
  const { updateLecture, setLectureTags, getLectureTags } = useLecturesStore();
  const { folders, loadFolders } = useFoldersStore();
  const { tags, loadTags, createTag } = useTagsStore();

  const [title, setTitle] = useState(lecture.title || '');
  const [language, setLanguage] = useState<Language>(lecture.language || 'uz');
  const [folderId, setFolderId] = useState<string | null>(lecture.folderId || null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Tag creation state
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);
  const [isTagSaving, setIsTagSaving] = useState(false);
  const tagInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle(lecture.title || '');
      setLanguage(lecture.language || 'uz');
      setFolderId(lecture.folderId || null);
      loadFolders();
      loadTags();
      loadLectureTags();
    }
  }, [isOpen, lecture]);

  const loadLectureTags = async () => {
    setIsLoading(true);
    const lectureTags = await getLectureTags(lecture.id);
    setSelectedTagIds(lectureTags.map(t => t.id));
    setIsLoading(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Update lecture details
      await updateLecture(lecture.id, {
        title: title.trim() || undefined,
        language,
        folderId,
      });

      // Update tags
      await setLectureTags(lecture.id, selectedTagIds);

      onClose();
    } catch (error) {
      console.error('Failed to save lecture:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleTag = (tagId: string) => {
    setSelectedTagIds(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleStartCreateTag = () => {
    setIsCreatingTag(true);
    setNewTagName('');
    setNewTagColor(TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)]);
    setTimeout(() => tagInputRef.current?.focus(), 0);
  };

  const handleCancelCreateTag = () => {
    setIsCreatingTag(false);
    setNewTagName('');
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    setIsTagSaving(true);
    try {
      const newTag = await createTag({
        name: newTagName.trim(),
        color: newTagColor,
      });
      if (newTag) {
        // Auto-select the newly created tag
        setSelectedTagIds(prev => [...prev, newTag.id]);
        setIsCreatingTag(false);
        setNewTagName('');
      }
    } catch (error) {
      console.error('Failed to create tag:', error);
    } finally {
      setIsTagSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Yozuvni tahrirlash" size="md">
      <div className={styles.form}>
        {/* Title */}
        <div className={styles.field}>
          <label className={styles.label}>Sarlavha</label>
          <input
            type="text"
            className={styles.input}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={lecture.originalFilename}
          />
        </div>

        {/* Language */}
        <div className={styles.field}>
          <label className={styles.label}>Til</label>
          <div className={styles.languageOptions}>
            {LANGUAGE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`${styles.languageBtn} ${language === option.value ? styles.active : ''}`}
                onClick={() => setLanguage(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Folder */}
        <div className={styles.field}>
          <label className={styles.label}>Papka</label>
          <select
            className={styles.select}
            value={folderId || ''}
            onChange={(e) => setFolderId(e.target.value || null)}
          >
            <option value="">Papkasiz</option>
            {folders.map((folder) => (
              <option key={folder.id} value={folder.id}>
                {folder.name}
              </option>
            ))}
          </select>
        </div>

        {/* Tags */}
        <div className={styles.field}>
          <div className={styles.labelRow}>
            <label className={styles.label}>Teglar</label>
            {!isCreatingTag && tags.length > 0 && (
              <button
                type="button"
                className={styles.addTagBtn}
                onClick={handleStartCreateTag}
              >
                <Icon icon="solar:add-circle-linear" width={16} height={16} />
                Yangi teg
              </button>
            )}
          </div>
          {isLoading ? (
            <div className={styles.loading}>Teglar yuklanmoqda...</div>
          ) : isCreatingTag ? (
            <div className={styles.createTagForm}>
              <div className={styles.createTagInputRow}>
                <input
                  ref={tagInputRef}
                  type="text"
                  className={styles.createTagInput}
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="Teg nomi"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateTag();
                    if (e.key === 'Escape') handleCancelCreateTag();
                  }}
                />
                <div className={styles.colorPicker}>
                  {TAG_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`${styles.colorOption} ${newTagColor === color ? styles.selectedColor : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewTagColor(color)}
                    />
                  ))}
                </div>
              </div>
              <div className={styles.createTagPreview}>
                <span
                  className={styles.tagPreviewDot}
                  style={{ backgroundColor: newTagColor }}
                />
                <span className={styles.tagPreviewName}>
                  {newTagName || 'Teg ko\'rinishi'}
                </span>
              </div>
              <div className={styles.createTagActions}>
                <button
                  type="button"
                  className={styles.createTagCancel}
                  onClick={handleCancelCreateTag}
                >
                  Bekor qilish
                </button>
                <button
                  type="button"
                  className={styles.createTagSave}
                  onClick={handleCreateTag}
                  disabled={!newTagName.trim() || isTagSaving}
                >
                  {isTagSaving ? (
                    <Icon icon="solar:refresh-circle-bold" width={16} height={16} className={styles.spinning} />
                  ) : (
                    <Icon icon="solar:check-circle-bold" width={16} height={16} />
                  )}
                  Teg yaratish
                </button>
              </div>
            </div>
          ) : tags.length === 0 ? (
            <div className={styles.emptyTags}>
              <Icon icon="solar:tag-linear" width={24} height={24} />
              <span>Hali teglar yaratilmagan</span>
              <button
                type="button"
                className={styles.createFirstTagBtn}
                onClick={handleStartCreateTag}
              >
                <Icon icon="solar:add-circle-bold" width={18} height={18} />
                Birinchi tegni yarating
              </button>
            </div>
          ) : (
            <div className={styles.tagsGrid}>
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  className={`${styles.tagBtn} ${selectedTagIds.includes(tag.id) ? styles.selected : ''}`}
                  onClick={() => toggleTag(tag.id)}
                  style={{
                    '--tag-color': tag.color || 'var(--color-text-tertiary)',
                  } as React.CSSProperties}
                >
                  <span
                    className={styles.tagDot}
                    style={{ backgroundColor: tag.color || 'var(--color-text-tertiary)' }}
                  />
                  {tag.name}
                  {selectedTagIds.includes(tag.id) && (
                    <Icon icon="solar:check-circle-bold" width={16} height={16} />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>
            Bekor qilish
          </button>
          <button
            type="button"
            className={styles.saveBtn}
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Icon icon="solar:refresh-circle-bold" width={18} height={18} className={styles.spinning} />
                Saqlanmoqda...
              </>
            ) : (
              <>
                <Icon icon="solar:check-circle-bold" width={18} height={18} />
                O'zgarishlarni saqlash
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
