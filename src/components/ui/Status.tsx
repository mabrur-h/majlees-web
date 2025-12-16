import type { LectureStatus } from '../../types';
import styles from './Status.module.css';

interface StatusProps {
  status: LectureStatus;
}

export function Status({ status }: StatusProps) {
  return <span className={`${styles.status} ${styles[status]}`}>{status}</span>;
}
