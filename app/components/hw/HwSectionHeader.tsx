import styles from './HwSectionHeader.module.css';
import HwSectionTag from './HwSectionTag';

interface HwSectionHeaderProps {
  tag: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export default function HwSectionHeader({
  tag,
  title,
  description,
  actions,
  className,
}: HwSectionHeaderProps) {
  return (
    <div className={[styles.wrapper, className ?? ''].filter(Boolean).join(' ')}>
      <HwSectionTag>{tag}</HwSectionTag>
      <div className={styles.row}>
        <div>
          <h2 className={styles.title}>{title}</h2>
          {description && <p className={styles.description}>{description}</p>}
        </div>
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
    </div>
  );
}
