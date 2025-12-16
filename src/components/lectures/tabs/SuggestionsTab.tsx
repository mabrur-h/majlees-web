import { Icon } from '@iconify/react';
import type { PositiveFeedback, ProductSuggestion } from '../../../types';
import styles from './Tabs.module.css';

interface SuggestionsTabProps {
  positiveFeedback?: PositiveFeedback[];
  productSuggestions?: ProductSuggestion[];
}

export function SuggestionsTab({ positiveFeedback, productSuggestions }: SuggestionsTabProps) {
  const hasFeedback = positiveFeedback && positiveFeedback.length > 0;
  const hasSuggestions = productSuggestions && productSuggestions.length > 0;

  if (!hasFeedback && !hasSuggestions) {
    return (
      <div className={styles.empty}>
        <Icon icon="solar:lightbulb-linear" width={48} height={48} />
        <p>No insights available</p>
      </div>
    );
  }

  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case 'High':
        return styles.high;
      case 'Medium':
        return styles.medium;
      default:
        return styles.low;
    }
  };

  return (
    <div className={styles.suggestionsContainer}>
      {/* Positive Feedback Section */}
      {hasFeedback && (
        <div className={styles.suggestionSection}>
          <div className={styles.sectionTitle}>
            <Icon icon="solar:like-bold" width={18} height={18} />
            <span>Positive Feedback</span>
          </div>
          {positiveFeedback!.map((pf, index) => (
            <div key={index} className={styles.feedbackCard}>
              <div className={styles.feedbackHeader}>
                <div className={styles.feedbackIcon}>
                  <Icon icon="solar:star-bold" width={16} height={16} />
                </div>
                <span className={styles.feedbackFeature}>{pf.feature}</span>
              </div>
              <p className={styles.feedbackBenefit}>{pf.benefit}</p>
              {/* {pf.timestampMs && (
                <div className={styles.keyPointFooter}>
                  <span className={styles.time}>
                    <Icon icon="solar:clock-circle-linear" width={12} height={12} />
                    {formatTimestamp(pf.timestampMs)}
                  </span>
                </div>
              )} */}
            </div>
          ))}
        </div>
      )}

      {/* Product Suggestions Section */}
      {hasSuggestions && (
        <div className={styles.suggestionSection}>
          <div className={styles.sectionTitle}>
            <Icon icon="solar:lightbulb-bolt-bold" width={18} height={18} />
            <span>Product Suggestions</span>
          </div>
          {productSuggestions!.map((ps, index) => (
            <div key={index} className={styles.suggestionCard}>
              <div className={styles.suggestionHeader}>
                <div className={styles.suggestionType}>
                  <Icon icon="solar:widget-add-linear" width={18} height={18} />
                  <span>{ps.type}</span>
                </div>
                <span className={`${styles.priorityBadge} ${getPriorityClass(ps.priority)}`}>
                  {ps.priority}
                </span>
              </div>
              <p className={styles.suggestionDescription}>{ps.description}</p>
              {ps.relatedPainPoint && (
                <div className={styles.relatedPain}>
                  <Icon icon="solar:link-round-linear" width={14} height={14} />
                  <span>Related: {ps.relatedPainPoint}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
