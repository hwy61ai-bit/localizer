import styles from './HwSelect.module.css';

interface HwSelectOption {
  value: string;
  label: string;
}

interface HwSelectProps {
  label?: string;
  error?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: HwSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  className?: string;
}

export default function HwSelect({
  label,
  error,
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  required = false,
  name,
  className,
}: HwSelectProps) {
  const wrapperClasses = [
    styles.wrapper,
    disabled ? styles.disabled : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  const selectClasses = [
    styles.select,
    error ? styles.selectError : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={wrapperClasses}>
      {label && <label className={styles.label}>{label}</label>}
      <select
        name={name}
        className={selectClasses}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
      >
        {placeholder && (
          <option value="" disabled hidden>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
}
