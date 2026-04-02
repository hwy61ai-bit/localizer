'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './HwTopNav.module.css';
import HwButton from './HwButton';

interface NavLink {
  label: string;
  href: string;
  active?: boolean;
}

interface HwTopNavProps {
  brandText?: string;
  links?: NavLink[];
  ctaLabel?: string;
  ctaHref?: string;
  bellCount?: number;
  onBellClick?: () => void;
  children?: React.ReactNode;
}

export default function HwTopNav({
  brandText = 'HWY61',
  links,
  ctaLabel,
  ctaHref,
  bellCount,
  onBellClick,
  children,
}: HwTopNavProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 0);
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={[styles.nav, scrolled ? styles.scrolled : '']
        .filter(Boolean)
        .join(' ')}
    >
      <Link href="/" className={styles.brand}>
        {brandText}
      </Link>

      {links && links.length > 0 && (
        <div className={styles.links}>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={[styles.link, link.active ? styles.linkActive : '']
                .filter(Boolean)
                .join(' ')}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}

      <div className={styles.right}>
        {children}

        {onBellClick && (
          <button type="button" className={styles.bell} onClick={onBellClick}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M10 2a5 5 0 0 0-5 5v3l-2 3h14l-2-3V7a5 5 0 0 0-5-5ZM8 16a2 2 0 1 0 4 0"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="square"
              />
            </svg>
            {bellCount !== undefined && bellCount > 0 && (
              <span className={styles.bellBadge}>{bellCount}</span>
            )}
          </button>
        )}

        {ctaLabel && ctaHref && (
          <Link href={ctaHref}>
            <HwButton size="small">{ctaLabel}</HwButton>
          </Link>
        )}
      </div>
    </nav>
  );
}
