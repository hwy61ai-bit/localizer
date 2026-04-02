import styles from './HwPageHeader.module.css';
import HwBreadcrumb from './HwBreadcrumb';

interface HwPageHeaderProps {
  title: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  actions?: React.ReactNode;
  className?: string;
}

export default function HwPageHeader({
  title,
  breadcrumbs,
  actions,
  className,
}: HwPageHeaderProps) {
  return (
    <div className={[styles.header, className ?? ''].filter(Boolean).join(' ')}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <HwBreadcrumb items={breadcrumbs} />
      )}
      <div className={styles.row}>
        <h1 className={styles.title}>{title}</h1>
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
    </div>
  );
}
