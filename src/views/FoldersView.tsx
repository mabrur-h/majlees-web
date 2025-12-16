import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useFoldersStore } from '../stores/foldersStore';
import { useLecturesStore } from '../stores/lecturesStore';
import { useViewStore } from '../stores/viewStore';
import { ColorPicker } from '../components/ui/ColorPicker';
import { formatDate } from '../utils';
import type { Folder, Lecture } from '../types';
import styles from './FoldersView.module.css';

export function FoldersView() {
  const {
    folders,
    foldersTree,
    loadFolders,
    loadFoldersTree,
    createFolder,
    updateFolder,
    deleteFolder,
    isLoading: foldersLoading,
  } = useFoldersStore();
  const { lectures, loadLectures, updateLecture, isLoading: lecturesLoading } = useLecturesStore();

  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({ name: '', color: undefined as string | undefined, parentId: undefined as string | undefined });
  const [isSaving, setIsSaving] = useState(false);
  const [selectedLectures, setSelectedLectures] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [movingToFolder, setMovingToFolder] = useState<string | null>(null);

  useEffect(() => {
    loadFolders();
    loadFoldersTree();
    loadLectures();
  }, [loadFolders, loadFoldersTree, loadLectures]);

  // Get lectures for the selected folder
  const folderLectures = useMemo(() => {
    if (!selectedFolder) {
      // Show unorganized lectures (no folder)
      return lectures.filter(l => !l.folderId);
    }
    return lectures.filter(l => l.folderId === selectedFolder.id);
  }, [lectures, selectedFolder]);

  const unorganizedCount = useMemo(() => {
    return lectures.filter(l => !l.folderId).length;
  }, [lectures]);

  const resetForm = () => {
    setFormData({ name: '', color: undefined, parentId: undefined });
    setEditingFolder(null);
    setIsCreating(false);
  };

  const handleCreateFolder = () => {
    setIsCreating(true);
    setEditingFolder(null);
    setFormData({ name: '', color: undefined, parentId: selectedFolder?.id });
  };

  const handleEditFolder = (folder: Folder, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingFolder(folder);
    setIsCreating(false);
    setFormData({
      name: folder.name,
      color: folder.color,
      parentId: folder.parentId || undefined,
    });
  };

  const handleSaveFolder = async () => {
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

  const handleDeleteFolder = async (folder: Folder, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`"${folder.name}" papkasini o'chirmoqchimisiz? Yozuvlar "Tartiblanmagan" ga ko'chiriladi.`)) {
      await deleteFolder(folder.id);
      if (selectedFolder?.id === folder.id) {
        setSelectedFolder(null);
      }
      if (editingFolder?.id === folder.id) {
        resetForm();
      }
    }
  };

  const toggleLectureSelection = (lectureId: string) => {
    const newSelection = new Set(selectedLectures);
    if (newSelection.has(lectureId)) {
      newSelection.delete(lectureId);
    } else {
      newSelection.add(lectureId);
    }
    setSelectedLectures(newSelection);
  };

  const selectAllLectures = () => {
    setSelectedLectures(new Set(folderLectures.map(l => l.id)));
  };

  const clearSelection = () => {
    setSelectedLectures(new Set());
    setIsSelectionMode(false);
  };

  const handleMoveLectures = async (targetFolderId: string | null) => {
    setMovingToFolder(targetFolderId);
    try {
      const promises = Array.from(selectedLectures).map(lectureId =>
        updateLecture(lectureId, { folderId: targetFolderId })
      );
      await Promise.all(promises);
      clearSelection();
    } catch (error) {
      console.error('Failed to move lectures:', error);
    } finally {
      setMovingToFolder(null);
    }
  };

  const renderFolderTree = (folderList: Folder[], level = 0) => {
    return folderList.map((folder) => (
      <div key={folder.id}>
        <motion.div
          className={`${styles.folderItem} ${selectedFolder?.id === folder.id ? styles.active : ''}`}
          style={{ paddingLeft: `calc(var(--space-3) + ${level * 16}px)` }}
          onClick={() => setSelectedFolder(folder)}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: level * 0.03 }}
        >
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
          <div className={styles.folderActions}>
            <button
              className={styles.folderActionBtn}
              onClick={(e) => handleEditFolder(folder, e)}
              title="Tahrirlash"
            >
              <Icon icon="solar:pen-linear" width={14} height={14} />
            </button>
            <button
              className={`${styles.folderActionBtn} ${styles.deleteBtn}`}
              onClick={(e) => handleDeleteFolder(folder, e)}
              title="O'chirish"
            >
              <Icon icon="solar:trash-bin-trash-linear" width={14} height={14} />
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
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Papkalar</h1>
          <p className={styles.subtitle}>Majlislaringizni tartiblang</p>
        </div>
        <button className={styles.newFolderBtn} onClick={handleCreateFolder}>
          <Icon icon="solar:folder-add-bold" width={20} height={20} />
          <span>Yangi papka</span>
        </button>
      </div>

      <div className={styles.layout}>
        {/* Folders Sidebar */}
        <div className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <span className={styles.sidebarTitle}>Barcha papkalar</span>
          </div>

          <div className={styles.foldersList}>
            {/* Unorganized */}
            <button
              className={`${styles.folderItem} ${styles.unorganized} ${!selectedFolder ? styles.active : ''}`}
              onClick={() => setSelectedFolder(null)}
            >
              <span className={styles.folderIcon}>
                <Icon icon="solar:inbox-linear" width={20} height={20} />
              </span>
              <span className={styles.folderName}>Tartiblanmagan</span>
              {unorganizedCount > 0 && (
                <span className={styles.folderCount}>{unorganizedCount}</span>
              )}
            </button>

            {/* Folder Tree */}
            {foldersLoading && folders.length === 0 ? (
              <div className={styles.loading}>
                <Icon icon="solar:refresh-circle-bold" width={20} height={20} className={styles.spinning} />
                <span>Yuklanmoqda...</span>
              </div>
            ) : (
              renderFolderTree(foldersTree)
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className={styles.main}>
          {/* Folder Header / Create Form */}
          <AnimatePresence mode="wait">
            {isCreating || editingFolder ? (
              <motion.div
                key="form"
                className={styles.folderForm}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className={styles.formHeader}>
                  <h2 className={styles.formTitle}>
                    {editingFolder ? 'Papkani tahrirlash' : 'Yangi papka'}
                  </h2>
                  <button className={styles.cancelBtn} onClick={resetForm}>
                    <Icon icon="solar:close-circle-linear" width={20} height={20} />
                  </button>
                </div>
                <div className={styles.formFields}>
                  <input
                    type="text"
                    className={styles.input}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Papka nomi"
                    autoFocus
                  />
                  <select
                    className={styles.select}
                    value={formData.parentId || ''}
                    onChange={(e) => setFormData({ ...formData, parentId: e.target.value || undefined })}
                  >
                    <option value="">Asosiy papka (root)</option>
                    {folders
                      .filter(f => f.id !== editingFolder?.id)
                      .map((folder) => (
                        <option key={folder.id} value={folder.id}>
                          {folder.name}
                        </option>
                      ))}
                  </select>
                  <ColorPicker
                    value={formData.color}
                    onChange={(color) => setFormData({ ...formData, color })}
                  />
                  <button
                    className={styles.saveBtn}
                    onClick={handleSaveFolder}
                    disabled={!formData.name.trim() || isSaving}
                  >
                    {isSaving ? (
                      <Icon icon="solar:refresh-circle-bold" width={18} height={18} className={styles.spinning} />
                    ) : (
                      <Icon icon="solar:check-circle-bold" width={18} height={18} />
                    )}
                    <span>{editingFolder ? 'Saqlash' : 'Yaratish'}</span>
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="header"
                className={styles.contentHeader}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className={styles.contentHeaderLeft}>
                  {selectedFolder ? (
                    <>
                      <span
                        className={styles.contentIcon}
                        style={{ color: selectedFolder.color || 'var(--color-accent)' }}
                      >
                        <Icon icon="solar:folder-bold" width={24} height={24} />
                      </span>
                      <div className={styles.contentInfo}>
                        <h2 className={styles.contentTitle}>{selectedFolder.name}</h2>
                        <span className={styles.contentCount}>
                          {folderLectures.length} ta majlis
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className={styles.contentIcon}>
                        <Icon icon="solar:inbox-bold" width={24} height={24} />
                      </span>
                      <div className={styles.contentInfo}>
                        <h2 className={styles.contentTitle}>Tartiblanmagan</h2>
                        <span className={styles.contentCount}>
                          {folderLectures.length} ta majlis
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {folderLectures.length > 0 && (
                  <div className={styles.contentActions}>
                    {isSelectionMode ? (
                      <>
                        <button className={styles.actionBtn} onClick={selectAllLectures}>
                          <Icon icon="solar:check-square-linear" width={18} height={18} />
                          Barchasini tanlash
                        </button>
                        <button className={styles.actionBtn} onClick={clearSelection}>
                          <Icon icon="solar:close-square-linear" width={18} height={18} />
                          Bekor qilish
                        </button>
                      </>
                    ) : (
                      <button
                        className={styles.actionBtn}
                        onClick={() => setIsSelectionMode(true)}
                      >
                        <Icon icon="solar:checklist-linear" width={18} height={18} />
                        Tanlash
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Selection Actions */}
          <AnimatePresence>
            {selectedLectures.size > 0 && (
              <motion.div
                className={styles.selectionBar}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <span className={styles.selectionCount}>
                  {selectedLectures.size} ta tanlandi
                </span>
                <div className={styles.moveToMenu}>
                  <span className={styles.moveLabel}>Ko'chirish:</span>
                  {selectedFolder && (
                    <button
                      className={styles.moveBtn}
                      onClick={() => handleMoveLectures(null)}
                      disabled={movingToFolder !== null}
                    >
                      <Icon icon="solar:inbox-linear" width={16} height={16} />
                      Tartiblanmagan
                    </button>
                  )}
                  {folders
                    .filter(f => f.id !== selectedFolder?.id)
                    .slice(0, 5)
                    .map(folder => (
                      <button
                        key={folder.id}
                        className={styles.moveBtn}
                        onClick={() => handleMoveLectures(folder.id)}
                        disabled={movingToFolder !== null}
                      >
                        <Icon
                          icon="solar:folder-bold"
                          width={16}
                          height={16}
                          style={{ color: folder.color || 'var(--color-accent)' }}
                        />
                        {folder.name}
                      </button>
                    ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Lectures Grid */}
          <div className={styles.lecturesGrid}>
            {lecturesLoading && folderLectures.length === 0 ? (
              <div className={styles.loadingState}>
                {[1, 2, 3].map(i => (
                  <div key={i} className={styles.skeletonCard} />
                ))}
              </div>
            ) : folderLectures.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <Icon icon="solar:folder-open-linear" width={48} height={48} />
                </div>
                <h3 className={styles.emptyTitle}>
                  {selectedFolder ? 'Bu papkada majlislar yo\'q' : 'Tartiblanmagan majlislar yo\'q'}
                </h3>
                <p className={styles.emptyText}>
                  {selectedFolder
                    ? 'Tartibga solish uchun majlislaringizni bu yerga ko\'chiring'
                    : 'Barcha majlislaringiz papkalarga tartiblangan'}
                </p>
              </div>
            ) : (
              <AnimatePresence>
                {folderLectures.map((lecture, index) => (
                  <LectureItem
                    key={lecture.id}
                    lecture={lecture}
                    index={index}
                    isSelectionMode={isSelectionMode}
                    isSelected={selectedLectures.has(lecture.id)}
                    onToggleSelect={() => toggleLectureSelection(lecture.id)}
                    folders={folders}
                    currentFolderId={selectedFolder?.id || null}
                    onMoveToFolder={(folderId) => {
                      updateLecture(lecture.id, { folderId });
                    }}
                  />
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface LectureItemProps {
  lecture: Lecture;
  index: number;
  isSelectionMode: boolean;
  isSelected: boolean;
  onToggleSelect: () => void;
  folders: Folder[];
  currentFolderId: string | null;
  onMoveToFolder: (folderId: string | null) => void;
}

function LectureItem({
  lecture,
  index,
  isSelectionMode,
  isSelected,
  onToggleSelect,
  folders,
  currentFolderId,
  onMoveToFolder,
}: LectureItemProps) {
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const { openLectureDetail } = useViewStore();
  const isCustDev = lecture.summarizationType === 'custdev';

  const handleCardClick = () => {
    if (isSelectionMode) {
      onToggleSelect();
    } else {
      openLectureDetail(lecture.id);
    }
  };

  return (
    <motion.div
      className={`${styles.lectureCard} ${isSelected ? styles.selected : ''}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.03 }}
      onClick={handleCardClick}
    >
      {isSelectionMode && (
        <div className={styles.checkbox}>
          <Icon
            icon={isSelected ? 'solar:check-square-bold' : 'solar:square-linear'}
            width={22}
            height={22}
          />
        </div>
      )}

      <div className={`${styles.lectureIcon} ${isCustDev ? styles.custdev : ''}`}>
        <Icon
          icon={isCustDev ? 'solar:users-group-rounded-bold' : 'solar:document-text-bold'}
          width={20}
          height={20}
        />
      </div>

      <div className={styles.lectureContent}>
        <span className={styles.lectureTitle}>
          {lecture.title || lecture.originalFilename}
        </span>
        <span className={styles.lectureMeta}>
          {formatDate(lecture.createdAt)}
          {lecture.durationFormatted && ` • ${lecture.durationFormatted}`}
        </span>
      </div>

      {!isSelectionMode && (
        <div className={styles.lectureActions}>
          <div className={styles.moveDropdown}>
            <button
              className={styles.moveDropdownBtn}
              onClick={(e) => {
                e.stopPropagation();
                setShowMoveMenu(!showMoveMenu);
              }}
              title="Papkaga ko'chirish"
            >
              <Icon icon="solar:folder-send-linear" width={18} height={18} />
            </button>
            {showMoveMenu && (
              <>
                <div className={styles.dropdownBackdrop} onClick={() => setShowMoveMenu(false)} />
                <div className={styles.dropdownMenu}>
                  <div className={styles.dropdownHeader}>Papkaga ko'chirish</div>
                  {currentFolderId && (
                    <button
                      className={styles.dropdownItem}
                      onClick={() => {
                        onMoveToFolder(null);
                        setShowMoveMenu(false);
                      }}
                    >
                      <Icon icon="solar:inbox-linear" width={16} height={16} />
                      Tartiblanmagan
                    </button>
                  )}
                  {folders
                    .filter(f => f.id !== currentFolderId)
                    .map(folder => (
                      <button
                        key={folder.id}
                        className={styles.dropdownItem}
                        onClick={() => {
                          onMoveToFolder(folder.id);
                          setShowMoveMenu(false);
                        }}
                      >
                        <Icon
                          icon="solar:folder-bold"
                          width={16}
                          height={16}
                          style={{ color: folder.color || 'var(--color-accent)' }}
                        />
                        {folder.name}
                      </button>
                    ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
