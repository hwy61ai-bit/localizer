import styles from './HwRadio.module.css';

interface HwRadioProps {
  label?: string;
  checked?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  name?: string;
  value?: string;
  className?: string;
}

export default function HwRadio({
  label,
  checked,
  onChange,
  disabled = false,
  name,
  value,
  className,
}: HwRadioProps) {
  const wrapperClasses = [
    styles.wrapper,
    disabled ? styles.disabled : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <label className={wrapperClasses}>
      <input
        type="radio"
        className={styles.hidden}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        name={name}
        value={value}
      />
      <span className={styles.circle}>
        <span className={styles.dot} />
      </span>
      {label && <span className={styles.label}>{label}</span>}
    </label>
  );
}
