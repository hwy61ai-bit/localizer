import styles from './HwTooltip.module.css';

interface HwTooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export default function HwTooltip({
  content,
  children,
  position = 'top',
  className,
}: HwTooltipProps) {
  return (
    <span className={[styles.wrapper, className ?? ''].filter(Boolean).join(' ')}>
      {children}
      <span className={[styles.tooltip, styles[position]].join(' ')}>
        {content}
      </span>
    </span>
  );
}
