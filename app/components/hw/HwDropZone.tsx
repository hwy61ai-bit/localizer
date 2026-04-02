'use client';

import { useState, useRef } from 'react';
import styles from './HwDropZone.module.css';

interface HwDropZoneProps {
  onDrop?: (files: FileList) => void;
  accept?: string;
  hint?: string;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export default function HwDropZone({
  onDrop,
  accept,
  hint,
  label = 'Drop a file here',
  disabled = false,
  className,
}: HwDropZoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files.length > 0) {
      onDrop?.(e.dataTransfer.files);
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onDrop?.(e.target.files);
    }
  };

  const zoneClasses = [
    styles.zone,
    dragActive ? styles.active : '',
    disabled ? styles.disabled : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={zoneClasses}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <svg
        className={styles.icon}
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
      >
        <path
          d="M16 4v18M8 12l8-8 8 8"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="square"
        />
        <path
          d="M4 22v6h24v-6"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="square"
        />
      </svg>
      <p className={styles.label}>{label}</p>
      {hint && <p className={styles.hint}>{hint}</p>}
      <input
        ref={inputRef}
        type="file"
        className={styles.hidden}
        accept={accept}
        onChange={handleFileChange}
      />
    </div>
  );
}
