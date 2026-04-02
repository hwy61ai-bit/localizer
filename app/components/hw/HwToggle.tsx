import styles from './HwToggle.module.css';

interface HwToggleProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export default function HwToggle({
  checked = false,
  onChange,
  label,
  disabled = false,
  className,
}: HwToggleProps) {
  const wrapperClasses = [
    styles.wrapper,
    checked ? styles.checked : '',
    disabled ? styles.disabled : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <label className={wrapperClasses}>
      <div className={styles.track}>
        <div className={styles.knob} />
      </div>
      {label && <span className={styles.label}>{label}</span>}
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange?.(e.target.checked)}
        disabled={disabled}
        style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }}
      />
    </label>
  );
}
