import styles from './HwBadge.module.css';

interface HwBadgeProps {
  variant: 'confirmed' | 'pending' | 'error' | 'info' | 'neutral' | 'accent';
  children: React.ReactNode;
  className?: string;
}

export default function HwBadge({
  variant,
  children,
  className,
}: HwBadgeProps) {
  const classes = [
    styles.badge,
    styles[variant],
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return <span className={classes}>{children}</span>;
}
