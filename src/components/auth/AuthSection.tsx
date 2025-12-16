import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, LogOut, AlertCircle, Sparkles } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import styles from './AuthSection.module.css';

export function AuthSection() {
  const { isAuthenticated, isLoading, error, login, register, clearError } =
    useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoginMode) {
      await login(email, password);
    } else {
      await register(email, password);
    }
  };

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
          <p className={styles.subtitle}>
            {isLoginMode ? 'Davom etish uchun kiring' : 'Hisob yarating'}
          </p>
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

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Email</label>
            <div className={styles.inputWrapper}>
              <Mail size={18} className={styles.inputIcon} />
              <input
                type="email"
                placeholder="Email manzilingizni kiriting"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
                required
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Parol</label>
            <div className={styles.inputWrapper}>
              <Lock size={18} className={styles.inputIcon} />
              <input
                type="password"
                placeholder="Parolingizni kiriting"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.input}
                required
              />
            </div>
          </div>

          <button type="submit" className={styles.submitBtn} disabled={isLoading}>
            {isLoading ? (
              <span className={styles.loader} />
            ) : isLoginMode ? (
              'Kirish'
            ) : (
              'Hisob yaratish'
            )}
          </button>
        </form>

        <div className={styles.divider}>
          <span>yoki</span>
        </div>

        <button
          type="button"
          className={styles.switchBtn}
          onClick={() => setIsLoginMode(!isLoginMode)}
        >
          {isLoginMode ? "Hisobingiz yo'qmi? Ro'yxatdan o'ting" : "Hisobingiz bormi? Kiring"}
        </button>
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
