import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useAuthStore } from '../stores/authStore';
import { useLecturesStore } from '../stores/lecturesStore';
import { useViewStore } from '../stores/viewStore';
import type { View } from '../components/layout';
import styles from './HomeView.module.css';

interface HomeViewProps {
  onNavigate: (view: View) => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export function HomeView({ onNavigate }: HomeViewProps) {
  const { user, isAuthenticated } = useAuthStore();
  const { lectures, loadLectures } = useLecturesStore();
  const { openLectureDetail } = useViewStore();

  // Always load lectures on mount when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadLectures();
    }
  }, [isAuthenticated, loadLectures]);

  const completedCount = lectures.filter((l) => l.status === 'completed').length;
  const processingCount = lectures.filter((l) =>
    ['extracting', 'transcribing', 'summarizing'].includes(l.status)
  ).length;

  const recentLectures = lectures.slice(0, 3);

  return (
    <motion.div
      className={styles.container}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Hero Section */}
      <motion.div className={styles.hero} variants={itemVariants}>
        <div className={styles.heroGlow} />
        <div className={styles.heroContent}>
          <div className={styles.greeting}>
            <span className={styles.wave}>👋</span>
            <span className={styles.greetingText}>
              Salom{user?.name ? `, ${user.name}` : user?.email ? `, ${user.email.split('@')[0]}` : ''}
            </span>
          </div>
          <h1 className={styles.heroTitle}>
            Majlislaringizni
            <span className={styles.gradientText}> tahlil qiling</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Suhbatlaringiz uchun AI asosida transkripsiya va tahlil
          </p>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div className={styles.quickActions} variants={itemVariants}>
        <motion.button
          className={styles.primaryAction}
          onClick={() => onNavigate('upload')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className={styles.actionGlow} />
          <div className={styles.actionIcon}>
            <Icon icon="solar:microphone-3-bold" width={28} height={28} />
          </div>
          <div className={styles.actionContent}>
            <span className={styles.actionTitle}>Yangi yozuv</span>
            <span className={styles.actionSubtitle}>Audio yuklang yoki yozing</span>
          </div>
          <Icon icon="solar:arrow-right-linear" width={20} height={20} className={styles.actionArrow} />
        </motion.button>

        <div className={styles.secondaryActions}>
          <motion.button
            className={styles.secondaryAction}
            onClick={() => onNavigate('lectures')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className={styles.secondaryIcon}>
              <Icon icon="solar:documents-bold" width={22} height={22} />
            </div>
            <span>Majlislarim</span>
          </motion.button>

          <motion.button
            className={styles.secondaryAction}
            onClick={() => onNavigate('settings')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className={styles.secondaryIcon}>
              <Icon icon="solar:settings-bold" width={22} height={22} />
            </div>
            <span>Sozlamalar</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div className={styles.statsSection} variants={itemVariants}>
        <h2 className={styles.sectionTitle}>Umumiy ko'rinish</h2>
        <div className={styles.statsGrid}>
          <div className={`${styles.statCard} ${styles.green}`}>
            <div className={styles.statBgIcon}>
              <Icon icon="solar:check-circle-bold" width={80} height={80} />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statValue}>{completedCount}</span>
              <span className={styles.statLabel}>Tayyor</span>
            </div>
          </div>

          <div className={`${styles.statCard} ${styles.yellow}`}>
            <div className={styles.statBgIcon}>
              <Icon icon="solar:hourglass-bold" width={80} height={80} />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statValue}>{processingCount}</span>
              <span className={styles.statLabel}>Jarayonda</span>
            </div>
          </div>

          <div className={`${styles.statCard} ${styles.purple}`}>
            <div className={styles.statBgIcon}>
              <Icon icon="solar:chart-bold" width={80} height={80} />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statValue}>{lectures.length}</span>
              <span className={styles.statLabel}>Jami</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Recent Meetings */}
      {recentLectures.length > 0 && (
        <motion.div
          className={styles.recentSection}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>So'nggi</h2>
            <button className={styles.seeAllBtn} onClick={() => onNavigate('lectures')}>
              Barchasini ko'rish
              <Icon icon="solar:arrow-right-linear" width={16} height={16} />
            </button>
          </div>
          <div className={styles.recentList}>
            {recentLectures.map((lecture, index) => (
              <motion.div
                key={lecture.id}
                className={styles.recentItem}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => openLectureDetail(lecture.id)}
              >
                <div className={styles.recentIcon}>
                  <Icon
                    icon={lecture.summarizationType === 'custdev' ? 'solar:users-group-rounded-bold' : 'solar:document-text-bold'}
                    width={20}
                    height={20}
                  />
                </div>
                <div className={styles.recentContent}>
                  <span className={styles.recentTitle}>
                    {lecture.title || lecture.originalFilename}
                  </span>
                  <span className={styles.recentMeta}>
                    {lecture.durationFormatted || 'Jarayonda...'} • {lecture.language?.toUpperCase()}
                  </span>
                </div>
                <div className={`${styles.recentStatus} ${styles[lecture.status]}`}>
                  {lecture.status === 'completed' && <Icon icon="solar:check-circle-bold" width={16} height={16} />}
                  {['extracting', 'transcribing', 'summarizing'].includes(lecture.status) && (
                    <div className={styles.processingDot} />
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Features */}
      <motion.div className={styles.featuresSection} variants={itemVariants}>
        <h2 className={styles.sectionTitle}>Majlees nima qila oladi</h2>
        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <Icon icon="solar:microphone-2-bold-duotone" width={28} height={28} />
            </div>
            <h3 className={styles.featureTitle}>Transkripsiya</h3>
            <p className={styles.featureDesc}>O'zbek, rus, ingliz tillarida nutqni matnga aylantirish</p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <Icon icon="solar:magic-stick-3-bold-duotone" width={28} height={28} />
            </div>
            <h3 className={styles.featureTitle}>Aqlli xulosa</h3>
            <p className={styles.featureDesc}>Asosiy fikrlar va boblar avtomatik ravishda</p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <Icon icon="solar:lightbulb-bolt-bold-duotone" width={28} height={28} />
            </div>
            <h3 className={styles.featureTitle}>CustDev tahlili</h3>
            <p className={styles.featureDesc}>Muammolar, tushunchalar, harakatlar</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
