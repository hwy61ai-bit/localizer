import styles from './HwTabs.module.css';

interface HwTabsProps {
  children: React.ReactNode;
  className?: string;
}

export function HwTabs({ children, className }: HwTabsProps) {
  return (
    <div className={[styles.tabs, className ?? ''].filter(Boolean).join(' ')}>
      {children}
    </div>
  );
}

interface HwTabProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export function HwTab({ label, active = false, onClick, className }: HwTabProps) {
  const classes = [
    styles.tab,
    active ? styles.active : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button type="button" className={classes} onClick={onClick}>
      {label}
    </button>
  );
}
