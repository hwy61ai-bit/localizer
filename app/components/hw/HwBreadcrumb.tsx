import Link from 'next/link';
import styles from './HwBreadcrumb.module.css';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface HwBreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function HwBreadcrumb({ items, className }: HwBreadcrumbProps) {
  return (
    <nav className={[styles.nav, className ?? ''].filter(Boolean).join(' ')}>
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i}>
            {i > 0 && <span className={styles.separator}>›</span>}
            {' '}
            {item.href && !isLast ? (
              <Link href={item.href} className={styles.link}>
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? styles.current : styles.link}>
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
