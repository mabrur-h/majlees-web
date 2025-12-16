import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, AlertCircle, Sparkles } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import styles from './AuthSection.module.css';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
          }) => void;
          renderButton: (
            element: HTMLElement,
            config: {
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              type?: 'standard' | 'icon';
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
              logo_alignment?: 'left' | 'center';
              width?: number;
              locale?: string;
            }
          ) => void;
          prompt: () => void;
        };
      };
    };
  }
}

export function AuthSection() {
  const { isAuthenticated, isLoading, error, loginWithGoogle, clearError } = useAuthStore();

  const handleGoogleCallback = useCallback(
    async (response: { credential: string }) => {
      await loginWithGoogle(response.credential);
    },
    [loginWithGoogle]
  );

  useEffect(() => {
    if (isAuthenticated) return;

    // Load Google Identity Services script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCallback,
        });

        const buttonContainer = document.getElementById('google-signin-button');
        if (buttonContainer) {
          window.google.accounts.id.renderButton(buttonContainer, {
            theme: 'outline',
            size: 'large',
            type: 'standard',
            text: 'continue_with',
            shape: 'pill',
            width: 300,
            logo_alignment: 'left',
            locale: 'en',
          });
        }
      }
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup script on unmount
      const existingScript = document.querySelector(
        'script[src="https://accounts.google.com/gsi/client"]'
      );
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [isAuthenticated, handleGoogleCallback]);

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className={styles.container}>
      <motion.div
        className={styles.card}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className={styles.header}>
          <div className={styles.iconWrapper}>
            <Sparkles size={28} />
          </div>
          <h1 className={styles.title}>Majlees ga xush kelibsiz</h1>
          <p className={styles.subtitle}>Davom etish uchun kiring</p>
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              className={styles.error}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onClick={clearError}
            >
              <AlertCircle size={18} />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={styles.authContent}>
          {isLoading ? (
            <div className={styles.loadingContainer}>
              <span className={styles.loader} />
              <p className={styles.loadingText}>Kirish...</p>
            </div>
          ) : (
            <>
              <div id="google-signin-button" className={styles.googleButton} />
              <p className={styles.hint}>
                Google orqali tizimga xavfsiz kiring
              </p>
            </>
          )}
        </div>

        <div className={styles.footer}>
          <p className={styles.terms}>
            Davom etish orqali siz{' '}
            <a href="/terms" className={styles.link}>
              Foydalanish shartlari
            </a>{' '}
            va{' '}
            <a href="/privacy" className={styles.link}>
              Maxfiylik siyosati
            </a>
            ga rozilik bildirasiz.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export function LogoutButton() {
  const { logout } = useAuthStore();

  return (
    <button className={styles.logoutBtn} onClick={logout}>
      <LogOut size={18} />
      <span>Chiqish</span>
    </button>
  );
}
