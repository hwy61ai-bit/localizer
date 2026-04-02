'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NotificationBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unread_count ?? 0);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Click outside to close
  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [open]);

  const markAllRead = async () => {
    try {
      await fetch('/api/notifications/read', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // silent
    }
  };

  const handleClick = (n: Notification) => {
    if (n.link) {
      setOpen(false);
      router.push(n.link);
    }
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          padding: 6, position: 'relative', display: 'flex', alignItems: 'center',
          color: 'var(--hw-text-secondary)', transition: 'var(--hw-ease)',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--hw-text)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--hw-text-secondary)')}
        aria-label="Notifications"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: -6, right: -8,
            background: 'var(--hw-crimson)', color: '#fff',
            fontFamily: 'var(--hw-font-mono)', fontSize: 9, fontWeight: 700, lineHeight: 1,
            minWidth: 18, height: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 4px',
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, marginTop: 8,
          width: 360, maxWidth: 360, maxHeight: 420, overflowY: 'auto',
          background: 'var(--hw-bg-surface)', border: '3px solid var(--hw-border-strong)',
          boxShadow: 'var(--hw-shadow-xl)',
          zIndex: 999,
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '14px 16px', borderBottom: '3px solid var(--hw-border-strong)',
          }}>
            <span style={{ fontFamily: 'var(--hw-font-display)', fontSize: 18, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--hw-text)' }}>NOTIFICATIONS</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontFamily: 'var(--hw-font-mono)', fontSize: 11, fontWeight: 400,
                  letterSpacing: '1.5px', textTransform: 'uppercase',
                  color: 'var(--hw-crimson)', padding: 0,
                }}
              >
                MARK ALL READ
              </button>
            )}
          </div>

          {/* List */}
          {notifications.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', fontFamily: 'var(--hw-font-body)', fontSize: 14, color: 'var(--hw-text-muted)' }}>
              No notifications
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleClick(n)}
                style={{
                  padding: '12px 16px',
                  borderBottom: '2px solid var(--hw-border)',
                  cursor: n.link ? 'pointer' : 'default',
                  background: n.read ? 'var(--hw-bg-surface)' : 'var(--hw-crimson-ghost)',
                  borderLeft: n.read ? '3px solid transparent' : '3px solid var(--hw-crimson)',
                  transition: 'var(--hw-ease)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
                  <span style={{ fontFamily: 'var(--hw-font-body)', fontSize: 14, fontWeight: n.read ? 300 : 500, color: 'var(--hw-text)' }}>
                    {n.title}
                  </span>
                  <span style={{ fontFamily: 'var(--hw-font-mono)', fontSize: 10, color: 'var(--hw-text-muted)', flexShrink: 0, marginLeft: 8 }}>
                    {timeAgo(n.created_at)}
                  </span>
                </div>
                {n.body && (
                  <div style={{ fontFamily: 'var(--hw-font-body)', fontSize: 14, fontWeight: 300, color: 'var(--hw-text-secondary)', lineHeight: 1.4 }}>
                    {n.body}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
