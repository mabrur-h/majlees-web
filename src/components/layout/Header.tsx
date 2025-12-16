import { Icon } from '@iconify/react';
import { useAuthStore } from '../../stores/authStore';
import { useViewStore } from '../../stores/viewStore';
import styles from './Header.module.css';

interface HeaderProps {
  onMenuClick: () => void;
}

const VIEW_TITLES: Record<string, string> = {
  home: 'Majlees AI',
  upload: 'Yangi yozuv',
  lectures: 'Majlislarim',
  settings: 'Sozlamalar',
};

export function Header({ onMenuClick }: HeaderProps) {
  const { isAuthenticated, user } = useAuthStore();
  const { currentView } = useViewStore();

  const title = VIEW_TITLES[currentView] || 'Majless';

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <button className={styles.menuBtn} onClick={onMenuClick}>
          <Icon icon="solar:hamburger-menu-linear" width={24} height={24} />
        </button>

        <div className={styles.titleSection}>
          {currentView === 'home' && (
            <div className={styles.logo}>
              <Icon icon="solar:magic-stick-3-bold" width={20} height={20} />
            </div>
          )}
          <h1 className={styles.title}>{title}</h1>
        </div>
      </div>

      <div className={styles.right}>
        {isAuthenticated && (
          <>
            <button className={styles.iconBtn}>
              <Icon icon="solar:bell-linear" width={22} height={22} />
            </button>
            <div className={styles.avatar}>
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
          </>
        )}
      </div>
    </header>
  );
}
