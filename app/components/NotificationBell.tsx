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
        }}
        aria-label="Notifications"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: 2, right: 2,
            background: '#e53e3e', color: '#fff',
            fontSize: 9, fontWeight: 700, lineHeight: 1,
            minWidth: 16, height: 16, borderRadius: 8,
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
          width: 340, maxHeight: 420, overflowY: 'auto',
          background: '#fff', border: '1px solid #DDD', borderRadius: 14,
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          zIndex: 999,
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 16px', borderBottom: '1px solid #DDD',
          }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 11, fontWeight: 600, color: '#3b82f6',
                  padding: 0,
                }}
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* List */}
          {notifications.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', fontSize: 13, color: '#999' }}>
              No notifications yet
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleClick(n)}
                style={{
                  padding: '10px 16px',
                  borderBottom: '1px solid #f0f0ec',
                  cursor: n.link ? 'pointer' : 'default',
                  background: n.read ? '#fff' : '#f8f9fa',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
                  <span style={{ fontSize: 13, fontWeight: n.read ? 400 : 600, color: '#111' }}>
                    {n.title}
                  </span>
                  <span style={{ fontSize: 10, color: '#999', flexShrink: 0, marginLeft: 8 }}>
                    {timeAgo(n.created_at)}
                  </span>
                </div>
                {n.body && (
                  <div style={{ fontSize: 12, color: '#666', lineHeight: 1.4 }}>
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
