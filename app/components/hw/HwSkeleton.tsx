import styles from './HwSkeleton.module.css';

const defaultHeights: Record<string, string> = {
  line: '14px',
  block: '120px',
  circle: '40px',
};

interface HwSkeletonProps {
  variant?: 'line' | 'block' | 'circle';
  width?: string;
  height?: string;
  className?: string;
}

export default function HwSkeleton({
  variant = 'line',
  width,
  height,
  className,
}: HwSkeletonProps) {
  const classes = [
    styles.skeleton,
    styles[variant],
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={classes}
      style={{
        width: width ?? (variant === 'circle' ? '40px' : '100%'),
        height: height ?? defaultHeights[variant],
      }}
    />
  );
}
