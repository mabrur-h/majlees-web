import { Sidebar } from './Sidebar';
import { BottomNavBar } from './BottomNavBar';
import { useViewStore, type View } from '../../stores/viewStore';
import styles from './Layout.module.css';

interface LayoutProps {
  children: React.ReactNode;
}

export type { View };

export function Layout({ children }: LayoutProps) {
  const { currentView, sidebarOpen, setView, closeSidebar } = useViewStore();

  return (
    <div className={styles.layout}>
      <Sidebar
        currentView={currentView}
        onViewChange={setView}
        isOpen={sidebarOpen}
        onClose={closeSidebar}
      />

      <div className={styles.main}>
        <main className={styles.content}>{children}</main>
      </div>

      <BottomNavBar currentView={currentView} onViewChange={setView} />
    </div>
  );
}
