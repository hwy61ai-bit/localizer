import styles from './HwEmptyState.module.css';
import HwButton from './HwButton';

interface HwEmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export default function HwEmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: HwEmptyStateProps) {
  return (
    <div className={[styles.container, className ?? ''].filter(Boolean).join(' ')}>
      {icon && <div className={styles.icon}>{icon}</div>}
      <h3 className={styles.title}>{title}</h3>
      {description && <p className={styles.description}>{description}</p>}
      {actionLabel && onAction && (
        <HwButton onClick={onAction}>{actionLabel}</HwButton>
      )}
    </div>
  );
}
