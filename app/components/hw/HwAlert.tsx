import styles from './HwAlert.module.css';

interface HwAlertProps {
  variant: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  children: React.ReactNode;
  className?: string;
  onDismiss?: () => void;
}

export default function HwAlert({
  variant,
  title,
  children,
  className,
  onDismiss,
}: HwAlertProps) {
  const classes = [
    styles.alert,
    styles[variant],
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes}>
      <div className={styles.content}>
        {title && <p className={styles.title}>{title}</p>}
        <div className={styles.body}>{children}</div>
      </div>
      {onDismiss && (
        <button type="button" className={styles.dismiss} onClick={onDismiss}>
          ×
        </button>
      )}
    </div>
  );
}
