import { Home, Upload, FileText, Settings } from 'lucide-react';
import type { View } from '../../stores/viewStore';
import styles from './MobileNav.module.css';

interface MobileNavProps {
  currentView: View;
  onViewChange: (view: View) => void;
}

const NAV_ITEMS = [
  { id: 'home' as const, label: 'Home', icon: Home },
  { id: 'upload' as const, label: 'Upload', icon: Upload },
  { id: 'lectures' as const, label: 'Lectures', icon: FileText },
  { id: 'settings' as const, label: 'Settings', icon: Settings },
];

export function MobileNav({ currentView, onViewChange }: MobileNavProps) {
  return (
    <nav className={styles.nav}>
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = currentView === item.id;

        return (
          <button
            key={item.id}
            className={`${styles.navItem} ${isActive ? styles.active : ''}`}
            onClick={() => onViewChange(item.id)}
          >
            <Icon size={22} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
