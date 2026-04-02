import Link from 'next/link';
import styles from './HwSidebar.module.css';

interface SidebarItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  active?: boolean;
}

interface SidebarSection {
  label: string;
  items: SidebarItem[];
}

interface HwSidebarProps {
  brand?: string;
  sections: SidebarSection[];
  className?: string;
}

export default function HwSidebar({
  brand = 'HWY61',
  sections,
  className,
}: HwSidebarProps) {
  return (
    <aside className={[styles.sidebar, className ?? ''].filter(Boolean).join(' ')}>
      <div className={styles.brand}>{brand}</div>
      {sections.map((section) => (
        <div key={section.label}>
          <div className={styles.sectionLabel}>{section.label}</div>
          {section.items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={[styles.item, item.active ? styles.itemActive : '']
                .filter(Boolean)
                .join(' ')}
            >
              {item.icon && <span className={styles.icon}>{item.icon}</span>}
              {item.label}
            </Link>
          ))}
        </div>
      ))}
    </aside>
  );
}
