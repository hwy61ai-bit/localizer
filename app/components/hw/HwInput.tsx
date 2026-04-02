import styles from './HwInput.module.css';

interface HwInputProps {
  label?: string;
  error?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: 'text' | 'email' | 'number' | 'password' | 'tel' | 'url' | 'date';
  disabled?: boolean;
  required?: boolean;
  name?: string;
  className?: string;
  id?: string;
}

export default function HwInput({
  label,
  error,
  placeholder,
  value,
  onChange,
  type = 'text',
  disabled = false,
  required = false,
  name,
  className,
  id,
}: HwInputProps) {
  const wrapperClasses = [
    styles.wrapper,
    disabled ? styles.disabled : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  const inputClasses = [
    styles.input,
    error ? styles.inputError : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={wrapperClasses}>
      {label && (
        <label className={styles.label} htmlFor={id}>
          {label}
        </label>
      )}
      <input
        id={id}
        name={name}
        type={type}
        className={inputClasses}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
      />
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
}
