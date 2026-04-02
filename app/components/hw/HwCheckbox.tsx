import styles from './HwCheckbox.module.css';

interface HwCheckboxProps {
  label?: string;
  checked?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  name?: string;
  className?: string;
}

export default function HwCheckbox({
  label,
  checked,
  onChange,
  disabled = false,
  name,
  className,
}: HwCheckboxProps) {
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
        type="checkbox"
        className={styles.hidden}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        name={name}
      />
      <span className={styles.box}>
        <svg
          className={styles.checkmark}
          width="12"
          height="10"
          viewBox="0 0 12 10"
          fill="none"
        >
          <path
            d="M1 5l3.5 3.5L11 1"
            stroke="#fff"
            strokeWidth="2.5"
            strokeLinecap="square"
          />
        </svg>
      </span>
      {label && <span className={styles.label}>{label}</span>}
    </label>
  );
}
