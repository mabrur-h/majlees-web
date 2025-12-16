import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal } from '../ui/Modal';
import { ColorPicker } from '../ui/ColorPicker';
import { useTagsStore } from '../../stores/tagsStore';
import type { Tag } from '../../types';
import styles from './TagManager.module.css';

interface TagManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TagManager({ isOpen, onClose }: TagManagerProps) {
  const { tags, loadTags, createTag, updateTag, deleteTag, isLoading } = useTagsStore();
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({ name: '', color: undefined as string | undefined });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadTags(true);
    }
  }, [isOpen]);

  const resetForm = () => {
    setFormData({ name: '', color: undefined });
    setEditingTag(null);
    setIsCreating(false);
  };

  const handleCreate = () => {
    setIsCreating(true);
    setEditingTag(null);
    setFormData({ name: '', color: undefined });
  };

  const handleEdit = (tag: Tag) => {
    setEditingTag(tag);
    setIsCreating(false);
    setFormData({
      name: tag.name,
      color: tag.color,
    });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return;

    setIsSaving(true);
    try {
      if (editingTag) {
        await updateTag(editingTag.id, {
          name: formData.name.trim(),
          color: formData.color || null,
        });
      } else {
        await createTag({
          name: formData.name.trim(),
          color: formData.color,
        });
      }
      resetForm();
    } catch (error) {
      console.error('Failed to save tag:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (tag: Tag) => {
    if (window.confirm(`Delete tag "${tag.name}"? It will be removed from all lectures.`)) {
      await deleteTag(tag.id);
      if (editingTag?.id === tag.id) {
        resetForm();
      }
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Tags" size="lg">
      <div className={styles.container}>
        {/* Tags List */}
        <div className={styles.tagsList}>
          <div className={styles.listHeader}>
            <span className={styles.listTitle}>Your Tags</span>
            <button className={styles.createBtn} onClick={handleCreate}>
              <Icon icon="solar:add-circle-linear" width={18} height={18} />
              New Tag
            </button>
          </div>

          {isLoading && tags.length === 0 ? (
            <div className={styles.loading}>
              <Icon icon="solar:refresh-circle-bold" width={24} height={24} className={styles.spinning} />
              Loading tags...
            </div>
          ) : tags.length === 0 ? (
            <div className={styles.empty}>
              <Icon icon="solar:tag-linear" width={48} height={48} />
              <p>No tags yet</p>
              <button className={styles.emptyBtn} onClick={handleCreate}>
                Create your first tag
              </button>
            </div>
          ) : (
            <div className={styles.tagsGrid}>
              {tags.map((tag, index) => (
                <motion.div
                  key={tag.id}
                  className={`${styles.tagItem} ${editingTag?.id === tag.id ? styles.active : ''}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.03 }}
                  style={{
                    '--tag-color': tag.color || 'var(--color-accent)',
                  } as React.CSSProperties}
                >
                  <div className={styles.tagInfo}>
                    <span
                      className={styles.tagDot}
                      style={{ backgroundColor: tag.color || 'var(--color-accent)' }}
                    />
                    <span className={styles.tagName}>{tag.name}</span>
                    {tag.lectureCount !== undefined && tag.lectureCount > 0 && (
                      <span className={styles.tagCount}>{tag.lectureCount}</span>
                    )}
                  </div>
                  <div className={styles.tagActions}>
                    <button
                      className={styles.actionBtn}
                      onClick={() => handleEdit(tag)}
                      title="Edit"
                    >
                      <Icon icon="solar:pen-linear" width={14} height={14} />
                    </button>
                    <button
                      className={`${styles.actionBtn} ${styles.deleteBtn}`}
                      onClick={() => handleDelete(tag)}
                      title="Delete"
                    >
                      <Icon icon="solar:trash-bin-trash-linear" width={14} height={14} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Edit/Create Form */}
        <AnimatePresence>
          {(isCreating || editingTag) && (
            <motion.div
              className={styles.formPanel}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div className={styles.formHeader}>
                <h3 className={styles.formTitle}>
                  {editingTag ? 'Edit Tag' : 'New Tag'}
                </h3>
                <button className={styles.closeFormBtn} onClick={resetForm}>
                  <Icon icon="solar:close-circle-linear" width={20} height={20} />
                </button>
              </div>

              <div className={styles.form}>
                <div className={styles.field}>
                  <label className={styles.label}>Name</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Tag name"
                    autoFocus
                  />
                </div>

                <ColorPicker
                  label="Color"
                  value={formData.color}
                  onChange={(color) => setFormData({ ...formData, color })}
                />

                {/* Preview */}
                <div className={styles.preview}>
                  <span className={styles.previewLabel}>Preview</span>
                  <span
                    className={styles.previewTag}
                    style={{
                      '--tag-color': formData.color || 'var(--color-accent)',
                      backgroundColor: formData.color ? `${formData.color}20` : 'var(--color-accent-subtle)',
                      borderColor: formData.color || 'var(--color-accent)',
                      color: formData.color || 'var(--color-accent)',
                    } as React.CSSProperties}
                  >
                    <span
                      className={styles.previewDot}
                      style={{ backgroundColor: formData.color || 'var(--color-accent)' }}
                    />
                    {formData.name || 'Tag name'}
                  </span>
                </div>

                <button
                  className={styles.saveBtn}
                  onClick={handleSave}
                  disabled={!formData.name.trim() || isSaving}
                >
                  {isSaving ? (
                    <>
                      <Icon icon="solar:refresh-circle-bold" width={18} height={18} className={styles.spinning} />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Icon icon="solar:check-circle-bold" width={18} height={18} />
                      {editingTag ? 'Save Changes' : 'Create Tag'}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Modal>
  );
}
