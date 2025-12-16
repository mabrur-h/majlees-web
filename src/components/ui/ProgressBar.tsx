import styles from './ProgressBar.module.css';

interface ProgressBarProps {
  percentage: number;
}

export function ProgressBar({ percentage }: ProgressBarProps) {
  return (
    <div className={styles.progressBar}>
      <div className={styles.fill} style={{ width: `${percentage}%` }} />
    </div>
  );
}
