import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Bell, BellOff, CheckCheck, Trash2,
  Plane, Package, ShieldCheck, ShieldAlert,
  Info, AlertTriangle, CheckCircle, XCircle,
  Star, Zap, MessageCircle,
} from 'lucide-react';
import type { AviaNotification } from '../../api/aviaApi';
import { markAviaNotificationsRead, deleteAviaNotification } from '../../api/aviaApi';

// ── Маппинг иконок ────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ComponentType<{ style?: React.CSSProperties }>> = {
  Bell, BellOff, Plane, Package, ShieldCheck, ShieldAlert,
  Info, AlertTriangle, CheckCircle, XCircle, Star, Zap, MessageCircle,
};

function NotifIcon({ name }: { name: string }) {
  const Icon = ICON_MAP[name] || Bell;
  return <Icon style={{ width: 16, height: 16 }} />;
}

function parseIconBg(iconBg: string): { bg: string; fg: string } {
  const presets: Record<string, { bg: string; fg: string }> = {
    'bg-sky-500/10 text-sky-400':         { bg: 'rgba(14,165,233,0.10)',  fg: '#38bdf8' },
    'bg-blue-500/10 text-blue-500':       { bg: 'rgba(59,130,246,0.10)',  fg: '#3b82f6' },
    'bg-emerald-500/10 text-emerald-500': { bg: 'rgba(16,185,129,0.10)',  fg: '#10b981' },
    'bg-rose-500/10 text-rose-500':       { bg: 'rgba(239,68,68,0.10)',   fg: '#f87171' },
    'bg-red-500/10 text-red-500':         { bg: 'rgba(239,68,68,0.10)',   fg: '#f87171' },
    'bg-amber-400/10 text-amber-400':     { bg: 'rgba(251,191,36,0.10)',  fg: '#fbbf24' },
    'bg-purple-500/10 text-purple-500':   { bg: 'rgba(168,85,247,0.10)',  fg: '#c084fc' },
    'bg-green-500/10 text-green-500':     { bg: 'rgba(34,197,94,0.10)',   fg: '#4ade80' },
    'bg-yellow-500/10 text-yellow-500':   { bg: 'rgba(234,179,8,0.10)',   fg: '#facc15' },
  };
  return presets[iconBg] || { bg: 'rgba(14,165,233,0.10)', fg: '#38bdf8' };
}

function relativeTime(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const s = Math.floor(diff / 1000);
    if (s < 60) return 'только что';
    const m = Math.floor(s / 60);
    if (m < 60) return `${m} мин`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} ч`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d} дн`;
    return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  } catch {
    return '';
  }
}

// ── Одно уведомление ──────────────────────────────────────────────────────────

function NotifItem({
  notif,
  onRead,
  onDelete,
}: {
  notif: AviaNotification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const { bg, fg } = parseIconBg(notif.iconBg);
  const [deleting, setDeleting] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleting(true);
    setTimeout(() => onDelete(notif.id), 220);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: deleting ? 0 : 1, y: deleting ? -8 : 0, scale: deleting ? 0.95 : 1 }}
      exit={{ opacity: 0, x: 40, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.22 }}
      onClick={() => {
        if (notif.isUnread) onRead(notif.id);
        setShowDelete(v => !v);
      }}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '12px 14px',
        borderRadius: 14,
        background: notif.isUnread ? 'rgba(14,165,233,0.05)' : 'rgba(255,255,255,0.02)',
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: notif.isUnread ? 'rgba(14,165,233,0.14)' : 'rgba(255,255,255,0.06)',
        marginBottom: 8,
        cursor: 'pointer',
        position: 'relative',
        transition: 'background 0.2s',
        WebkitTapHighlightColor: 'transparent',
        userSelect: 'none',
      }}
    >
      {/* Unread dot */}
      {notif.isUnread && (
        <div style={{
          position: 'absolute', top: 10, left: 10,
          width: 7, height: 7, borderRadius: '50%',
          background: '#0ea5e9',
          boxShadow: '0 0 6px rgba(14,165,233,0.6)',
        }} />
      )}

      {/* Icon */}
      <div style={{
        width: 38, height: 38, borderRadius: 11,
        background: bg, color: fg, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `1px solid ${fg}22`,
        marginLeft: notif.isUnread ? 8 : 0,
      }}>
        <NotifIcon name={notif.iconName} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0, paddingRight: showDelete ? 36 : 8 }}>
        <div style={{
          fontSize: 13, fontWeight: notif.isUnread ? 700 : 600,
          color: notif.isUnread ? '#e2eaf3' : '#7a95aa',
          marginBottom: 2, lineHeight: 1.35,
        }}>
          {notif.title}
        </div>
        {notif.description && (
          <div style={{
            fontSize: 12, color: '#4a6080', lineHeight: 1.5,
            overflow: 'hidden', display: '-webkit-box',
            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          }}>
            {notif.description}
          </div>
        )}
        <div style={{ fontSize: 10, color: '#2a3d50', marginTop: 4, fontWeight: 500 }}>
          {relativeTime(notif.createdAt)}
        </div>
      </div>

      {/* Delete btn — всегда видима на мобайле при tap */}
      <AnimatePresence>
        {showDelete && (
          <motion.button
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.15 }}
            onClick={handleDelete}
            style={{
              position: 'absolute', top: '50%', right: 10,
              transform: 'translateY(-50%)',
              width: 30, height: 30, borderRadius: 9,
              borderWidth: 1,
              borderStyle: 'solid',
              borderColor: 'rgba(239,68,68,0.25)',
              background: 'rgba(239,68,68,0.10)',
              color: '#f87171', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
            aria-label="Удалить"
          >
            <Trash2 style={{ width: 13, height: 13 }} />
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Главный компонент ─────────────────────────────────────────────────────────

interface NotificationCenterProps {
  phone: string;
  notifications: AviaNotification[];
  onClose: () => void;
  onUpdate: (notifs: AviaNotification[]) => void;
}

export function NotificationCenter({
  phone,
  notifications,
  onClose,
  onUpdate,
}: NotificationCenterProps) {
  const unreadCount = notifications.filter(n => n.isUnread).length;
  const [markingAll, setMarkingAll] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler, { passive: true });
    return () => window.removeEventListener('resize', handler);
  }, []);

  const handleReadOne = useCallback(async (id: string) => {
    onUpdate(notifications.map(n => n.id === id ? { ...n, isUnread: false } : n));
    await markAviaNotificationsRead(phone, id);
  }, [phone, notifications, onUpdate]);

  const handleReadAll = useCallback(async () => {
    if (unreadCount === 0) return;
    setMarkingAll(true);
    onUpdate(notifications.map(n => ({ ...n, isUnread: false })));
    await markAviaNotificationsRead(phone, 'all');
    setMarkingAll(false);
  }, [phone, notifications, unreadCount, onUpdate]);

  const handleDeleteOne = useCallback(async (id: string) => {
    onUpdate(notifications.filter(n => n.id !== id));
    await deleteAviaNotification(phone, id);
  }, [phone, notifications, onUpdate]);

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 90,
          background: 'rgba(0,0,0,0.60)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
        }}
      />

      {/* Panel — bottom sheet. Не используем translateX чтобы не конфликтовать с Motion y-анимацией */}
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 60 }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'fixed',
          bottom: isMobile ? 64 : 0,          // над мобайл-навбаром (64px)
          left: 0,
          right: 0,
          margin: '0 auto',                   // центрирование без transform
          width: '100%',
          maxWidth: isMobile ? '100%' : 540,
          background: '#080f1f',
          borderRadius: isMobile ? '20px 20px 0 0' : '22px 22px 0 0',
          borderWidth: '1px 1px 0 1px',
          borderStyle: 'solid',
          borderColor: 'rgba(255,255,255,0.08)',
          zIndex: 100,
          maxHeight: isMobile ? 'calc(100dvh - 64px)' : '88dvh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 -12px 48px rgba(0,0,0,0.65)',
          overflow: 'hidden',
        }}
      >
        {/* Drag handle */}
        <div style={{
          width: 40, height: 4, borderRadius: 2,
          background: 'rgba(255,255,255,0.14)',
          margin: '12px auto 0',
          flexShrink: 0,
        }} />

        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: isMobile ? '10px 14px 10px' : '10px 16px 10px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          flexShrink: 0,
          gap: 8,
        }}>
          {/* Left: icon + title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10, flexShrink: 0,
              background: 'rgba(14,165,233,0.10)',
              border: '1px solid rgba(14,165,233,0.20)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Bell style={{ width: 15, height: 15, color: '#0ea5e9' }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: isMobile ? 14 : 15, fontWeight: 800, color: '#e2eaf3', letterSpacing: '-0.2px', lineHeight: 1.2 }}>
                Уведомления
              </div>
              {unreadCount > 0 && (
                <div style={{ fontSize: 11, color: '#4a6080', fontWeight: 500 }}>
                  {unreadCount} непрочит.
                </div>
              )}
            </div>
          </div>

          {/* Right: actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            {unreadCount > 0 && (
              <button
                onClick={handleReadAll}
                disabled={markingAll}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '6px 10px', borderRadius: 9,
                  border: '1px solid rgba(14,165,233,0.20)',
                  background: 'rgba(14,165,233,0.08)',
                  color: '#38bdf8', fontSize: 11, fontWeight: 600,
                  cursor: 'pointer', opacity: markingAll ? 0.6 : 1,
                  whiteSpace: 'nowrap',
                }}
              >
                <CheckCheck style={{ width: 12, height: 12 }} />
                <span>Все</span>
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                border: '1px solid rgba(255,255,255,0.09)',
                background: 'rgba(255,255,255,0.04)',
                color: '#4a6080', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <X style={{ width: 16, height: 16 }} />
            </button>
          </div>
        </div>

        {/* Hint — мобайл подсказка */}
        {notifications.length > 0 && (
          <div style={{
            fontSize: 10, color: '#2a3d50', textAlign: 'center',
            padding: '6px 16px 0', flexShrink: 0,
          }}>
            Нажмите на уведомление, чтобы удалить
          </div>
        )}

        {/* List */}
        <div style={{
          overflowY: 'auto', flex: 1,
          padding: isMobile ? '10px 10px 8px' : '10px 12px 8px',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
        }}>
          <AnimatePresence initial={false}>
            {notifications.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{ textAlign: 'center', padding: '48px 20px' }}
              >
                <div style={{
                  width: 60, height: 60, borderRadius: 20,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px',
                }}>
                  <BellOff style={{ width: 26, height: 26, color: '#2a3d50' }} />
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#3d5268', marginBottom: 8 }}>
                  Нет уведомлений
                </div>
                <div style={{ fontSize: 13, color: '#2a3d50', lineHeight: 1.6 }}>
                  Здесь появятся уведомления о рейсах,{'\n'}заявках и статусе паспорта
                </div>
              </motion.div>
            ) : (
              notifications.map(notif => (
                <NotifItem
                  key={notif.id}
                  notif={notif}
                  onRead={handleReadOne}
                  onDelete={handleDeleteOne}
                />
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Safe area для iPhone (только если нет мобайл-нава, т.е. десктоп) */}
        <div style={{
          height: isMobile ? 8 : 'max(env(safe-area-inset-bottom), 16px)',
          flexShrink: 0,
          background: '#080f1f',
        }} />
      </motion.div>
    </>
  );
}