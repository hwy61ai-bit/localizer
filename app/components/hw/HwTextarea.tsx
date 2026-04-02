import styles from './HwTextarea.module.css';

interface HwTextareaProps {
  label?: string;
  error?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  rows?: number;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  className?: string;
}

export default function HwTextarea({
  label,
  error,
  placeholder,
  value,
  onChange,
  rows = 4,
  disabled = false,
  required = false,
  name,
  className,
}: HwTextareaProps) {
  const wrapperClasses = [
    styles.wrapper,
    disabled ? styles.disabled : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  const textareaClasses = [
    styles.textarea,
    error ? styles.textareaError : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={wrapperClasses}>
      {label && <label className={styles.label}>{label}</label>}
      <textarea
        name={name}
        className={textareaClasses}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        rows={rows}
        disabled={disabled}
        required={required}
      />
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
}
