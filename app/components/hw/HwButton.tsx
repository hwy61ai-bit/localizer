import styles from './HwButton.module.css';

interface HwButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'default' | 'small';
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  className?: string;
  fullWidth?: boolean;
}

export default function HwButton({
  variant = 'primary',
  size = 'default',
  disabled = false,
  children,
  onClick,
  type = 'button',
  className,
  fullWidth = false,
}: HwButtonProps) {
  const classes = [
    styles.button,
    styles[variant],
    size === 'small' ? styles.small : '',
    disabled ? styles.disabled : '',
    fullWidth ? styles.fullWidth : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
