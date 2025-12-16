import { useEffect, useRef } from 'react';
import styles from './Log.module.css';

interface LogEntry {
  time: string;
  message: string;
  type: 'info' | 'success' | 'error';
}

interface LogProps {
  entries: LogEntry[];
}

export function Log({ entries }: LogProps) {
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [entries]);

  return (
    <div className={styles.log} ref={logRef}>
      {entries.length === 0 ? (
        <span className={styles.empty}>No logs yet</span>
      ) : (
        entries.map((entry, index) => (
          <div key={index} className={styles[entry.type]}>
            [{entry.time}] {entry.message}
          </div>
        ))
      )}
    </div>
  );
}
