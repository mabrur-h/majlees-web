import { useConfigStore } from '../../stores/configStore';
import { Card, CardTitle, Button, Input, Log } from '../ui';
import styles from './ApiConfig.module.css';

export function ApiConfig() {
  const { apiUrl, isTesting, logs, setApiUrl, testConnection } = useConfigStore();

  return (
    <Card>
      <CardTitle>API Configuration</CardTitle>

      <div className={styles.row}>
        <Input
          type="text"
          placeholder="API Base URL"
          value={apiUrl}
          onChange={(e) => setApiUrl(e.target.value)}
        />
        <Button onClick={testConnection} fullWidth={false} disabled={isTesting}>
          {isTesting ? 'Testing...' : 'Test Connection'}
        </Button>
      </div>

      <Log entries={logs} />
    </Card>
  );
}
