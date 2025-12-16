import { Icon } from '@iconify/react';
import type { MindMap } from '../../../types';
import styles from './Tabs.module.css';

interface MindMapTabProps {
  mindMap?: MindMap;
}

const BRANCH_COLORS: Record<string, string> = {
  customerProfile: '#3b82f6',
  needsAndGoals: '#22c55e',
  painPoints: '#ef4444',
  journeyStage: '#f59e0b',
  opportunities: '#8b5cf6',
  keyInsights: '#06b6d4',
  actionItems: '#ec4899',
};

const BRANCH_ICONS: Record<string, string> = {
  customerProfile: 'solar:user-rounded-bold',
  needsAndGoals: 'solar:target-bold',
  painPoints: 'solar:danger-triangle-bold',
  journeyStage: 'solar:route-bold',
  opportunities: 'solar:lightbulb-bolt-bold',
  keyInsights: 'solar:eye-bold',
  actionItems: 'solar:checklist-minimalistic-bold',
};

export function MindMapTab({ mindMap }: MindMapTabProps) {
  if (!mindMap) {
    return (
      <div className={styles.empty}>
        <Icon icon="solar:atom-linear" width={48} height={48} />
        <p>Mind map not available yet</p>
      </div>
    );
  }

  return (
    <div className={styles.mindMapContainer}>
      {/* Central Node */}
      <div className={styles.centralNode}>
        <div className={styles.centralNodeContent}>
          <h3 className={styles.centralNodeTitle}>{mindMap.centralNode.label}</h3>
          <p className={styles.centralNodeDesc}>{mindMap.centralNode.description}</p>
        </div>
      </div>

      {/* Branches Grid */}
      <div className={styles.branchesGrid}>
        {/* Customer Profile */}
        {mindMap.branches.customerProfile && (
          <BranchCard
            branchKey="customerProfile"
            label={mindMap.branches.customerProfile.label}
          >
            {mindMap.branches.customerProfile.items.map((item, idx) => (
              <div key={idx} className={styles.branchItem}>
                <strong>{item.key}</strong>
                <span>{item.value}</span>
              </div>
            ))}
          </BranchCard>
        )}

        {/* Needs and Goals */}
        {mindMap.branches.needsAndGoals && (
          <BranchCard
            branchKey="needsAndGoals"
            label={mindMap.branches.needsAndGoals.label}
          >
            {mindMap.branches.needsAndGoals.items.map((item, idx) => (
              <div key={idx} className={styles.branchItem}>
                <span
                  className={styles.priorityTag}
                  style={{
                    color:
                      item.priority === 'High'
                        ? '#ef4444'
                        : item.priority === 'Medium'
                          ? '#f59e0b'
                          : '#22c55e',
                  }}
                >
                  [{item.priority}]
                </span>{' '}
                {item.goal}
              </div>
            ))}
          </BranchCard>
        )}

        {/* Pain Points */}
        {mindMap.branches.painPoints && (
          <BranchCard branchKey="painPoints" label={mindMap.branches.painPoints.label}>
            {mindMap.branches.painPoints.items.map((item, idx) => (
              <div key={idx} className={styles.branchItem}>
                <span className={styles.severityIcon}>
                  {item.severity === 'Critical'
                    ? '🔴'
                    : item.severity === 'Major'
                      ? '🟠'
                      : '🟡'}
                </span>
                <strong>{item.pain}</strong>
                <small>Emotion: {item.emotion}</small>
              </div>
            ))}
          </BranchCard>
        )}

        {/* Journey Stage */}
        {mindMap.branches.journeyStage && (
          <BranchCard
            branchKey="journeyStage"
            label={mindMap.branches.journeyStage.label}
          >
            <div className={styles.branchItem}>
              <strong>Current Stage</strong>
              <span>{mindMap.branches.journeyStage.currentStage}</span>
            </div>
            <div className={styles.branchItem}>
              <strong>Touchpoints</strong>
              <ul>
                {mindMap.branches.journeyStage.touchpoints.map((t, idx) => (
                  <li key={idx}>{t}</li>
                ))}
              </ul>
            </div>
          </BranchCard>
        )}

        {/* Opportunities */}
        {mindMap.branches.opportunities && (
          <BranchCard
            branchKey="opportunities"
            label={mindMap.branches.opportunities.label}
          >
            {mindMap.branches.opportunities.items.map((item, idx) => (
              <div key={idx} className={styles.branchItem}>
                <strong>{item.opportunity}</strong>
                <small>
                  Effort:{' '}
                  <span
                    style={{
                      color:
                        item.effort === 'Low'
                          ? '#22c55e'
                          : item.effort === 'Medium'
                            ? '#f59e0b'
                            : '#ef4444',
                    }}
                  >
                    {item.effort}
                  </span>{' '}
                  | Impact:{' '}
                  <span
                    style={{
                      color:
                        item.impact === 'High'
                          ? '#22c55e'
                          : item.impact === 'Medium'
                            ? '#f59e0b'
                            : '#ef4444',
                    }}
                  >
                    {item.impact}
                  </span>
                </small>
              </div>
            ))}
          </BranchCard>
        )}

        {/* Key Insights */}
        {mindMap.branches.keyInsights && (
          <BranchCard branchKey="keyInsights" label={mindMap.branches.keyInsights.label}>
            {mindMap.branches.keyInsights.patterns &&
              mindMap.branches.keyInsights.patterns.length > 0 && (
                <>
                  <div className={styles.branchItem}>
                    <strong>Patterns</strong>
                  </div>
                  {mindMap.branches.keyInsights.patterns.map((p, idx) => (
                    <div key={idx} className={styles.branchItem}>
                      🔄 {p}
                    </div>
                  ))}
                </>
              )}
            {mindMap.branches.keyInsights.quotes &&
              mindMap.branches.keyInsights.quotes.length > 0 && (
                <>
                  <div className={styles.branchItem}>
                    <strong>Key Quotes</strong>
                  </div>
                  {mindMap.branches.keyInsights.quotes.map((q, idx) => (
                    <div key={idx} className={styles.quoteBlock}>
                      <em>"{q.text}"</em>
                      <small>{q.context}</small>
                    </div>
                  ))}
                </>
              )}
          </BranchCard>
        )}

        {/* Action Items */}
        {mindMap.branches.actionItems && (
          <BranchCard branchKey="actionItems" label={mindMap.branches.actionItems.label}>
            {mindMap.branches.actionItems.items.map((item, idx) => (
              <div key={idx} className={styles.branchItem}>
                <span className={styles.badge} style={{ background: '#3b82f6' }}>
                  {item.owner}
                </span>
                <span
                  className={styles.badge}
                  style={{
                    background:
                      item.priority === 'High'
                        ? '#ef4444'
                        : item.priority === 'Medium'
                          ? '#f59e0b'
                          : '#22c55e',
                  }}
                >
                  {item.priority}
                </span>
                <p>{idx + 1}. {item.action}</p>
              </div>
            ))}
          </BranchCard>
        )}
      </div>

      {/* Connections */}
      {mindMap.connections && mindMap.connections.length > 0 && (
        <div className={styles.connectionsSection}>
          <div className={styles.connectionsTitle}>
            <Icon icon="solar:link-round-bold" width={18} height={18} />
            <span>Connections & Insights</span>
          </div>
          {mindMap.connections.map((conn, idx) => (
            <div key={idx} className={styles.connectionItem}>
              <span
                className={styles.connectionBadge}
                style={{ background: BRANCH_COLORS[conn.from] || '#64748b' }}
              >
                {conn.from}
              </span>
              <span className={styles.connectionArrow}>→</span>
              <span
                className={styles.connectionBadge}
                style={{ background: BRANCH_COLORS[conn.to] || '#64748b' }}
              >
                {conn.to}
              </span>
              <span className={styles.connectionReason}>{conn.reason}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface BranchCardProps {
  branchKey: string;
  label: string;
  children: React.ReactNode;
}

function BranchCard({ branchKey, label, children }: BranchCardProps) {
  const color = BRANCH_COLORS[branchKey] || '#64748b';
  const iconName = BRANCH_ICONS[branchKey] || 'solar:pin-bold';

  return (
    <div className={styles.branchCard}>
      <div className={styles.branchHeader} style={{ background: color }}>
        <Icon icon={iconName} width={18} height={18} className={styles.branchIcon} />
        <strong>{label}</strong>
      </div>
      <div className={styles.branchContent}>{children}</div>
    </div>
  );
}
