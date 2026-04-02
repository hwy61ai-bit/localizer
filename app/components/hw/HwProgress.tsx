import styles from './HwProgress.module.css';

interface HwProgressProps {
  value: number;
  variant?: 'crimson' | 'green';
  className?: string;
}

export default function HwProgress({
  value,
  variant = 'crimson',
  className,
}: HwProgressProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={[styles.track, className ?? ''].filter(Boolean).join(' ')}>
      <div
        className={[styles.bar, styles[variant]].join(' ')}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
