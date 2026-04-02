import styles from './HwTag.module.css';

interface HwTagProps {
  children: React.ReactNode;
  className?: string;
  onRemove?: () => void;
}

export default function HwTag({ children, className, onRemove }: HwTagProps) {
  return (
    <span className={[styles.tag, className ?? ''].filter(Boolean).join(' ')}>
      {children}
      {onRemove && (
        <button type="button" className={styles.remove} onClick={onRemove}>
          ×
        </button>
      )}
    </span>
  );
}
