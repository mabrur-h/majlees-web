import { Icon } from '@iconify/react';
import { useAuthStore } from '../../stores/authStore';
import type { View } from '../../stores/viewStore';
import styles from './Sidebar.module.css';

interface SidebarProps {
  currentView: View;
  onViewChange: (view: View) => void;
  isOpen: boolean;
  onClose: () => void;
}

const NAV_ITEMS = [
  { id: 'home' as const, label: 'Bosh sahifa', icon: 'solar:home-2-linear', iconActive: 'solar:home-2-bold' },
  { id: 'lectures' as const, label: 'Majlislarim', icon: 'solar:document-text-linear', iconActive: 'solar:document-text-bold' },
  { id: 'folders' as const, label: 'Papkalar', icon: 'solar:folder-with-files-linear', iconActive: 'solar:folder-with-files-bold' },
  { id: 'upload' as const, label: 'Yangi yozuv', icon: 'solar:microphone-3-linear', iconActive: 'solar:microphone-3-bold' },
  { id: 'settings' as const, label: 'Sozlamalar', icon: 'solar:settings-linear', iconActive: 'solar:settings-bold' },
];

export function Sidebar({ currentView, onViewChange, isOpen, onClose }: SidebarProps) {
  const { user, isAuthenticated, logout } = useAuthStore();

  const handleNavClick = (view: View) => {
    onViewChange(view);
    onClose();
  };

  return (
    <>
      {isOpen && <div className={styles.backdrop} onClick={onClose} />}

      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <div className={styles.logoIcon}>
              <Icon icon="solar:magic-stick-3-bold" width={24} height={24} />
            </div>
            <span className={styles.logoText}>Majlees AI</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <Icon icon="solar:close-circle-linear" width={24} height={24} />
          </button>
        </div>

        <nav className={styles.nav}>
          {NAV_ITEMS.map((item) => {
            const isActive = currentView === item.id;

            return (
              <button
                key={item.id}
                className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                onClick={() => handleNavClick(item.id)}
              >
                <Icon icon={isActive ? item.iconActive : item.icon} width={22} height={22} />
                <span>{item.label}</span>
                {isActive && <div className={styles.activeIndicator} />}
              </button>
            );
          })}
        </nav>

        {isAuthenticated && user && (
          <div className={styles.userSection}>
            <div className={styles.userAvatar}>
              {(user.name || user.email || 'U').charAt(0).toUpperCase()}
            </div>
            <div className={styles.userInfo}>
              <span className={styles.userEmail}>{user.name || user.email || 'User'}</span>
              <span className={styles.userPlan}>Bepul Plan</span>
            </div>
            <button className={styles.logoutBtn} onClick={logout}>
              <Icon icon="solar:logout-2-linear" width={20} height={20} />
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
