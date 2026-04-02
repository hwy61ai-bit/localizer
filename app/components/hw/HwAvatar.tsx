import styles from './HwAvatar.module.css';

interface HwAvatarProps {
  initials: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function HwAvatar({
  initials,
  size = 'md',
  className,
}: HwAvatarProps) {
  const classes = [
    styles.avatar,
    styles[size],
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return <div className={classes}>{initials}</div>;
}
