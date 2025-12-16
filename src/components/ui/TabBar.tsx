import { motion } from 'framer-motion';
import styles from './TabBar.module.css';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabBarProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  variant?: 'default' | 'pills' | 'underline';
  fullWidth?: boolean;
}

export function TabBar({
  tabs,
  activeTab,
  onTabChange,
  variant = 'default',
  fullWidth = false,
}: TabBarProps) {
  return (
    <div className={`${styles.tabBar} ${styles[variant]} ${fullWidth ? styles.fullWidth : ''}`}>
      <div className={styles.tabList}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              className={`${styles.tab} ${isActive ? styles.active : ''}`}
              onClick={() => onTabChange(tab.id)}
            >
              {tab.icon && <span className={styles.tabIcon}>{tab.icon}</span>}
              <span className={styles.tabLabel}>{tab.label}</span>
              {isActive && variant === 'default' && (
                <motion.div
                  className={styles.indicator}
                  layoutId="tabIndicator"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface TabContentProps {
  children: React.ReactNode;
  isActive: boolean;
}

export function TabContent({ children, isActive }: TabContentProps) {
  if (!isActive) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className={styles.tabContent}
    >
      {children}
    </motion.div>
  );
}
