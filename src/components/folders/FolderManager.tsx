import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal } from '../ui/Modal';
import { ColorPicker } from '../ui/ColorPicker';
import { useFoldersStore } from '../../stores/foldersStore';
import type { Folder } from '../../types';
import styles from './FolderManager.module.css';

interface FolderManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FolderManager({ isOpen, onClose }: FolderManagerProps) {
  const { folders, foldersTree, loadFolders, loadFoldersTree, createFolder, updateFolder, deleteFolder, isLoading } = useFoldersStore();
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({ name: '', color: undefined as string | undefined, parentId: undefined as string | undefined });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadFolders();
      loadFoldersTree();
    }
  }, [isOpen]);

  const resetForm = () => {
    setFormData({ name: '', color: undefined, parentId: undefined });
    setEditingFolder(null);
    setIsCreating(false);
  };

  const handleCreate = () => {
    setIsCreating(true);
    setEditingFolder(null);
    setFormData({ name: '', color: undefined, parentId: undefined });
  };

  const handleEdit = (folder: Folder) => {
    setEditingFolder(folder);
    setIsCreating(false);
    setFormData({
      name: folder.name,
      color: folder.color,
      parentId: folder.parentId || undefined,
    });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return;

    setIsSaving(true);
    try {
      if (editingFolder) {
        await updateFolder(editingFolder.id, {
          name: formData.name.trim(),
          color: formData.color || null,
          parentId: formData.parentId || null,
        });
      } else {
        await createFolder({
          name: formData.name.trim(),
          color: formData.color,
          parentId: formData.parentId,
        });
      }
      resetForm();
    } catch (error) {
      console.error('Failed to save folder:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (folder: Folder) => {
    if (window.confirm(`Delete folder "${folder.name}"? Lectures in this folder won't be deleted.`)) {
      await deleteFolder(folder.id);
      if (editingFolder?.id === folder.id) {
        resetForm();
      }
    }
  };

  const renderFolderTree = (folderList: Folder[], level = 0) => {
    return folderList.map((folder) => (
      <div key={folder.id}>
        <motion.div
          className={`${styles.folderItem} ${editingFolder?.id === folder.id ? styles.active : ''}`}
          style={{ paddingLeft: `calc(var(--space-4) + ${level * 20}px)` }}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: level * 0.05 }}
        >
          <div className={styles.folderInfo}>
            <span
              className={styles.folderIcon}
              style={{ color: folder.color || 'var(--color-accent)' }}
            >
              <Icon icon="solar:folder-bold" width={20} height={20} />
            </span>
            <span className={styles.folderName}>{folder.name}</span>
            {folder.lectureCount !== undefined && folder.lectureCount > 0 && (
              <span className={styles.folderCount}>{folder.lectureCount}</span>
            )}
          </div>
          <div className={styles.folderActions}>
            <button
              className={styles.actionBtn}
              onClick={() => handleEdit(folder)}
              title="Edit"
            >
              <Icon icon="solar:pen-linear" width={16} height={16} />
            </button>
            <button
              className={`${styles.actionBtn} ${styles.deleteBtn}`}
              onClick={() => handleDelete(folder)}
              title="Delete"
            >
              <Icon icon="solar:trash-bin-trash-linear" width={16} height={16} />
            </button>
          </div>
        </motion.div>
        {folder.children && folder.children.length > 0 && (
          <div className={styles.children}>
            {renderFolderTree(folder.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Folders" size="lg">
      <div className={styles.container}>
        {/* Folders List */}
        <div className={styles.foldersList}>
          <div className={styles.listHeader}>
            <span className={styles.listTitle}>Your Folders</span>
            <button className={styles.createBtn} onClick={handleCreate}>
              <Icon icon="solar:add-circle-linear" width={18} height={18} />
              New Folder
            </button>
          </div>

          {isLoading && folders.length === 0 ? (
            <div className={styles.loading}>
              <Icon icon="solar:refresh-circle-bold" width={24} height={24} className={styles.spinning} />
              Loading folders...
            </div>
          ) : folders.length === 0 ? (
            <div className={styles.empty}>
              <Icon icon="solar:folder-open-linear" width={48} height={48} />
              <p>No folders yet</p>
              <button className={styles.emptyBtn} onClick={handleCreate}>
                Create your first folder
              </button>
            </div>
          ) : (
            <div className={styles.foldersScroll}>
              {renderFolderTree(foldersTree)}
            </div>
          )}
        </div>

        {/* Edit/Create Form */}
        <AnimatePresence>
          {(isCreating || editingFolder) && (
            <motion.div
              className={styles.formPanel}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div className={styles.formHeader}>
                <h3 className={styles.formTitle}>
                  {editingFolder ? 'Edit Folder' : 'New Folder'}
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
                    placeholder="Folder name"
                    autoFocus
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Parent Folder</label>
                  <select
                    className={styles.select}
                    value={formData.parentId || ''}
                    onChange={(e) => setFormData({ ...formData, parentId: e.target.value || undefined })}
                  >
                    <option value="">None (root level)</option>
                    {folders
                      .filter(f => f.id !== editingFolder?.id)
                      .map((folder) => (
                        <option key={folder.id} value={folder.id}>
                          {folder.name}
                        </option>
                      ))}
                  </select>
                </div>

                <ColorPicker
                  label="Color"
                  value={formData.color}
                  onChange={(color) => setFormData({ ...formData, color })}
                />

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
                      {editingFolder ? 'Save Changes' : 'Create Folder'}
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
