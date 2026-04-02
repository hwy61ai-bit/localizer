import styles from './HwCard.module.css';

/* ---- Main Card ---- */

interface HwCardProps {
  variant?: 'standard' | 'dark' | 'accent';
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export default function HwCard({
  variant = 'standard',
  children,
  className,
  onClick,
  hoverable = true,
}: HwCardProps) {
  const classes = [
    styles.card,
    styles[variant],
    hoverable ? styles.hoverable : '',
    onClick ? styles.clickable : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} onClick={onClick}>
      {children}
    </div>
  );
}

/* ---- Sub-components ---- */

interface HwCardChildProps {
  children: React.ReactNode;
  className?: string;
}

export function HwCardTitle({ children, className }: HwCardChildProps) {
  return (
    <h3 className={[styles.title, className ?? ''].filter(Boolean).join(' ')}>
      {children}
    </h3>
  );
}

export function HwCardDesc({ children, className }: HwCardChildProps) {
  return (
    <p className={[styles.desc, className ?? ''].filter(Boolean).join(' ')}>
      {children}
    </p>
  );
}

export function HwCardMeta({ children, className }: HwCardChildProps) {
  return (
    <span className={[styles.meta, className ?? ''].filter(Boolean).join(' ')}>
      {children}
    </span>
  );
}
