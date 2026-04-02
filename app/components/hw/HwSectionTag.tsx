import styles from './HwSectionTag.module.css';

interface HwSectionTagProps {
  children: React.ReactNode;
  className?: string;
}

export default function HwSectionTag({ children, className }: HwSectionTagProps) {
  return (
    <div className={[styles.tag, className ?? ''].filter(Boolean).join(' ')}>
      {children}
    </div>
  );
}
