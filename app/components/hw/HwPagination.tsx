'use client';

import styles from './HwPagination.module.css';

interface HwPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export default function HwPagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: HwPaginationProps) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav className={[styles.nav, className ?? ''].filter(Boolean).join(' ')}>
      <button
        type="button"
        className={[styles.button, currentPage === 1 ? styles.disabled : ''].filter(Boolean).join(' ')}
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        ‹
      </button>
      {pages.map((page) => (
        <button
          key={page}
          type="button"
          className={[styles.button, page === currentPage ? styles.active : ''].filter(Boolean).join(' ')}
          onClick={() => onPageChange(page)}
        >
          {page}
        </button>
      ))}
      <button
        type="button"
        className={[styles.button, currentPage === totalPages ? styles.disabled : ''].filter(Boolean).join(' ')}
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        ›
      </button>
    </nav>
  );
}
