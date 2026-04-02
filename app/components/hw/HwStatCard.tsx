import styles from './HwStatCard.module.css';

interface HwStatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  delta?: number;
  className?: string;
}

export default function HwStatCard({
  label,
  value,
  sub,
  delta,
  className,
}: HwStatCardProps) {
  const hasDelta = delta !== undefined && delta !== 0;
  const deltaPositive = delta !== undefined && delta > 0;

  return (
    <div className={[styles.card, className ?? ''].filter(Boolean).join(' ')}>
      <p className={styles.label}>{label}</p>
      <p className={styles.value}>{value}</p>
      {(sub || hasDelta) && (
        <div className={styles.footer}>
          {hasDelta && (
            <span
              className={[
                styles.delta,
                deltaPositive ? styles.deltaPositive : styles.deltaNegative,
              ].join(' ')}
            >
              {deltaPositive ? '▲' : '▼'} {Math.abs(delta!)}%
            </span>
          )}
          {sub && <span className={styles.sub}>{sub}</span>}
        </div>
      )}
    </div>
  );
}
