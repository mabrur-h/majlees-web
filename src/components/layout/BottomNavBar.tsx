import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import type { View } from '../../stores/viewStore';
import styles from './BottomNavBar.module.css';

interface BottomNavBarProps {
  currentView: View;
  onViewChange: (view: View) => void;
}

interface NavItem {
  id: View;
  label: string;
  icon: string;
  iconActive: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'home',
    label: 'Bosh sahifa',
    icon: 'solar:home-2-linear',
    iconActive: 'solar:home-2-bold',
  },
  {
    id: 'lectures',
    label: 'Majlislar',
    icon: 'solar:document-text-linear',
    iconActive: 'solar:document-text-bold',
  },
  {
    id: 'folders',
    label: 'Papkalar',
    icon: 'solar:folder-with-files-linear',
    iconActive: 'solar:folder-with-files-bold',
  },
  {
    id: 'settings',
    label: 'Sozlamalar',
    icon: 'solar:settings-linear',
    iconActive: 'solar:settings-bold',
  },
];

export function BottomNavBar({ currentView, onViewChange }: BottomNavBarProps) {
  return (
    <nav className={styles.nav}>
      <div className={styles.navInner}>
        {NAV_ITEMS.map((item) => {
          const isActive = currentView === item.id;

          return (
            <motion.button
              key={item.id}
              className={`${styles.navItem} ${isActive ? styles.active : ''}`}
              onClick={() => onViewChange(item.id)}
              whileTap={{ scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              <div className={styles.iconWrapper}>
                <Icon
                  icon={isActive ? item.iconActive : item.icon}
                  width={24}
                  height={24}
                />
                {isActive && (
                  <motion.div
                    className={styles.activeIndicator}
                    layoutId="navIndicator"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </div>
              <span className={styles.label}>{item.label}</span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}
