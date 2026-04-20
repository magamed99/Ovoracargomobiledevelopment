import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '../contexts/UserContext';
import {
  Trash2, Truck, Star, Wallet, Info, Car, Package,
  Bell, BellRing, UserCheck, ShieldCheck, Copy, CheckCheck,
  ArrowLeft, RefreshCw, BellOff, Zap, Clock, Calendar,
  CheckCircle2, Filter,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'sonner';
import * as notificationsApi from '../api/notificationsApi';

const ICON_MAP: Record<string, any> = {
  Truck, Star, Wallet, Info, Car, Package, Bell, BellRing, UserCheck, ShieldCheck,
};

function extractOtpCode(description: string): string | null {
  const match = description.match(/Ваш код:\s*([A-Z0-9]{4}-[A-Z0-9]{4})/);
  return match ? match[1] : null;
}

interface Notification {
  id: string;
  userEmail: string;
  type: 'trip' | 'system' | 'payment' | 'info' | 'auth' | 'offer' | 'message';
  iconName: string;
  iconBg: string;
  title: string;
  description: string;
  isUnread: boolean;
  createdAt: string;
  section?: 'today' | 'yesterday' | 'older';
}

function getSection(dateStr: string): 'today' | 'yesterday' | 'older' {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date >= today) return 'today';
  if (date >= yesterday) return 'yesterday';
  return 'older';
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return 'только что';
  if (minutes < 60) return `${minutes} мин назад`;
  if (hours < 24) return `${hours} ч назад`;
  if (days === 1) return 'вчера';
  if (days < 7) return `${days} дн назад`;
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

const TYPE_COLOR: Record<string, string> = {
  trip:    '#5ba3f5',
  system:  '#a855f7',
  payment: '#10b981',
  info:    '#f59e0b',
  auth:    '#06b6d4',
  offer:   '#f43f5e',
  message: '#10b981',
};

const TYPE_LABEL: Record<string, string> = {
  trip: 'Поездка',
  system: 'Система',
  payment: 'Платёж',
  info: 'Инфо',
  auth: 'Авторизация',
  offer: 'Предложение',
  message: 'Сообщение',
};

export function NotificationsPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { user: currentUser } = useUser();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread'>('all');

  const userEmail = currentUser?.email;

  const loadNotifications = useCallback(async () => {
    if (!userEmail) { setLoading(false); return; }
    try {
      const data = await notificationsApi.getNotifications(userEmail);
      setNotifications(data.map(n => ({ ...n, section: getSection(n.createdAt) })));
    } catch (err) {
      console.error('[NotificationsPage] Error:', err);
      toast.error('Ошибка загрузки уведомлений');
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  useEffect(() => {
    loadNotifications();
    const iv = setInterval(loadNotifications, 10000);
    return () => clearInterval(iv);
  }, [loadNotifications]);

  const filtered = activeFilter === 'unread'
    ? notifications.filter(n => n.isUnread)
    : notifications;

  const todayNotifs     = filtered.filter(n => n.section === 'today');
  const yesterdayNotifs = filtered.filter(n => n.section === 'yesterday');
  const olderNotifs     = filtered.filter(n => n.section === 'older');
  const unreadCount     = notifications.filter(n => n.isUnread).length;

  const handleDelete = async (id: string) => {
    if (!userEmail) return;
    try {
      setNotifications(prev => prev.filter(n => n.id !== id));
      await notificationsApi.deleteNotification(userEmail, id);
    } catch { toast.error('Ошибка удаления'); }
  };

  const handleMarkRead = async (id: string) => {
    if (!userEmail) return;
    const notif = notifications.find(n => n.id === id);
    if (!notif?.isUnread) return;
    try {
      await notificationsApi.markNotificationRead(userEmail, id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isUnread: false } : n));
    } catch {}
  };

  const handleMarkAllRead = async () => {
    if (!userEmail) return;
    try {
      await notificationsApi.markAllNotificationsRead(userEmail);
      setNotifications(prev => prev.map(n => ({ ...n, isUnread: false })));
      toast.success('Все уведомления прочитаны');
    } catch { toast.error('Ошибка'); }
  };

  const handleClearAll = async () => {
    if (!userEmail) return;
    try {
      await notificationsApi.deleteAllNotifications(userEmail);
      setNotifications([]);
      toast.success('Все уведомления удалены');
    } catch { toast.error('Ошибка'); }
  };

  // ── Shared notification card ──
  const renderNotifCard = (n: Notification) => {
    const Icon = ICON_MAP[n.iconName] || Bell;
    const otpCode = extractOtpCode(n.description);
    const accentColor = TYPE_COLOR[n.type] || '#5ba3f5';

    if (otpCode) {
      return (
        <div key={n.id}
          onClick={() => handleMarkRead(n.id)}
          className="rounded-2xl overflow-hidden cursor-pointer transition-all hover:scale-[1.01]"
          style={{ background: '#081e28', border: `1px solid ${n.isUnread ? '#06b6d430' : '#ffffff08'}` }}
        >
          <div style={{ height: 2, background: 'linear-gradient(90deg,#06b6d4,#06b6d440,transparent)' }} />
          <div className="p-4 sm:p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#06b6d420' }}>
                <ShieldCheck className="w-4 h-4" style={{ color: '#06b6d4' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold text-white">🔐 {n.title}</p>
                <p className="text-[11px] text-[#4a6278]">Действителен 10 мин · {formatTime(n.createdAt)}</p>
              </div>
              {n.isUnread && (
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#06b6d420', color: '#06b6d4', border: '1px solid #06b6d430' }}>НОВОЕ</span>
              )}
              <button onClick={e => { e.stopPropagation(); handleDelete(n.id); }}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[#2a4060] hover:text-rose-400 transition-colors shrink-0">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex items-center justify-between px-4 py-3 rounded-xl" style={{ background: '#060f1a', border: '1px solid #06b6d420' }}>
              <span className="font-mono text-xl font-black tracking-[0.3em] text-[#06b6d4] select-all">{otpCode}</span>
              <button onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(otpCode); toast.success('Код скопирован!'); }}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#06b6d4] hover:bg-[#06b6d420] transition-colors"
                style={{ border: '1px solid #06b6d430' }}>
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] mt-2 text-[#3a5570]">⚠️ Никому не сообщайте этот код</p>
          </div>
        </div>
      );
    }

    return (
      <div key={n.id}
        onClick={() => handleMarkRead(n.id)}
        className="rounded-2xl p-4 cursor-pointer transition-all hover:scale-[1.01]"
        style={{
          background: n.isUnread ? 'linear-gradient(145deg, #0e1e38, #0a152a)' : '#ffffff04',
          border: `1px solid ${n.isUnread ? '#1d4ed820' : '#ffffff08'}`,
        }}
      >
        <div className="flex items-start gap-3">
          {/* Accent bar for unread */}
          {n.isUnread && (
            <div className="w-[3px] self-stretch rounded-full shrink-0"
              style={{ background: `linear-gradient(180deg, ${accentColor}, ${accentColor}40)` }} />
          )}
          {/* Icon */}
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${accentColor}18`, border: `1px solid ${accentColor}30` }}>
            <Icon className="w-[18px] h-[18px]" style={{ color: accentColor }} />
          </div>
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <p className="text-[14px] font-bold text-white leading-snug">{n.title}</p>
              <div className="flex items-center gap-2 shrink-0">
                {n.isUnread && (
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: accentColor, boxShadow: `0 0 8px ${accentColor}` }} />
                )}
                <span className="text-[11px] text-[#3a5570] whitespace-nowrap">{formatTime(n.createdAt)}</span>
              </div>
            </div>
            <p className="text-[12px] text-[#5a7a95] leading-relaxed">{n.description}</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
                style={{ background: `${accentColor}12`, color: accentColor, border: `1px solid ${accentColor}25` }}>
                {TYPE_LABEL[n.type] || n.type}
              </span>
            </div>
          </div>
          {/* Delete */}
          <button onClick={e => { e.stopPropagation(); handleDelete(n.id); }}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#2a4060] hover:text-rose-400 hover:bg-[#3a0f0f] transition-colors shrink-0 mt-0.5">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  };

  // ── Section renderer ──
  const renderSection = (title: string, icon: React.ElementType, color: string, items: Notification[]) => {
    if (items.length === 0) return null;
    const SIcon = icon;
    return (
      <div className="mb-6">
        <div className="flex items-center gap-2.5 mb-3">
          <SIcon className="w-3.5 h-3.5" style={{ color }} />
          <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: '#3a5570' }}>{title}</span>
          <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, #1e2d3d, transparent)' }} />
          <span className="text-[11px] font-bold" style={{ color: '#2a4060' }}>{items.length}</span>
        </div>
        <div className="flex flex-col gap-2.5">
          {items.map(renderNotifCard)}
        </div>
      </div>
    );
  };

  // ── Empty state ──
  const renderEmpty = () => (
    <div className="flex flex-col items-center justify-center py-20 gap-4 px-6">
      <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
        style={{ background: '#0e1e32', border: '1px solid #1a2d42' }}>
        <BellOff className="w-9 h-9 text-[#2a4060]" />
      </div>
      <p className="text-[16px] font-black text-white">
        {activeFilter === 'unread' ? 'Нет непрочитанных' : 'Нет уведомлений'}
      </p>
      <p className="text-[13px] text-[#4a6278] text-center max-w-xs leading-relaxed">
        {activeFilter === 'unread'
          ? 'Все уведомления прочитаны — отлично!'
          : 'Здесь будут появляться уведомления о поездках, офертах и платежах'}
      </p>
    </div>
  );

  return (
    <div className="font-['Sora'] bg-[#0E1621] text-white min-h-screen">

      {/* ══════════ MOBILE ══════════ */}
      <div className="md:hidden flex flex-col min-h-screen">
        <header className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 border-b backdrop-blur-xl bg-[#0E1621]/95 border-white/[0.06]"
          style={{ paddingTop: 'max(12px, env(safe-area-inset-top, 12px))' }}>
          <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center transition-all active:scale-90 text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-[18px] font-bold text-white">Уведомления</h1>
              {unreadCount > 0 && (
                <div className="min-w-[20px] h-5 px-1.5 rounded-full bg-[#1978e5] flex items-center justify-center">
                  <span className="text-[10px] font-bold text-white">{unreadCount > 99 ? '99+' : unreadCount}</span>
                </div>
              )}
            </div>
          </div>
          {notifications.length > 0 && (
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button onClick={handleMarkAllRead} className="w-9 h-9 flex items-center justify-center text-[#1978e5] active:scale-90">
                  <CheckCheck className="w-4 h-4" />
                </button>
              )}
              <button onClick={handleClearAll} className="w-9 h-9 flex items-center justify-center text-rose-500 active:scale-90">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </header>

        <div className="flex-1 pb-28">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="animate-spin w-8 h-8 border-2 border-t-[#1978e5] rounded-full border-white/10" />
            </div>
          ) : notifications.length === 0 ? (
            renderEmpty()
          ) : (
            <div className="px-3 pt-3">
              {renderSection('Сегодня', Zap, '#5ba3f5', todayNotifs)}
              {renderSection('Вчера', Clock, '#a855f7', yesterdayNotifs)}
              {renderSection('Ранее', Calendar, '#f59e0b', olderNotifs)}
            </div>
          )}
        </div>
      </div>

      {/* ══════════ DESKTOP ══════════ */}
      <div className="hidden md:flex flex-col min-h-screen">

        {/* ── Compact header ── */}
        <div className="shrink-0 border-b border-white/[0.06] px-6 lg:px-10 py-4" style={{ background: '#0a1520' }}>
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #8b5cf6, #a855f7)', boxShadow: '0 4px 16px #8b5cf650' }}>
                <Bell className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-[20px] font-black text-white leading-tight">Уведомления</h1>
                  {unreadCount > 0 && (
                    <span className="min-w-[22px] h-[22px] px-1.5 rounded-full flex items-center justify-center text-[10px] font-black text-white"
                      style={{ background: 'linear-gradient(135deg,#1d4ed8,#5ba3f5)', boxShadow: '0 4px 12px #1d4ed850' }}>
                      {unreadCount}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#4a6278] font-semibold">Центр уведомлений</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={loadNotifications}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-bold transition-all hover:text-white"
                style={{ background: '#ffffff08', border: '1px solid #ffffff10', color: '#607080' }}>
                <RefreshCw className="w-3.5 h-3.5" /> Обновить
              </button>
              {unreadCount > 0 && (
                <button onClick={handleMarkAllRead}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-bold transition-all hover:opacity-80"
                  style={{ background: '#1d4ed815', border: '1px solid #1d4ed830', color: '#5ba3f5' }}>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Прочитано
                </button>
              )}
              {notifications.length > 0 && (
                <button onClick={handleClearAll}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-bold transition-all hover:opacity-80"
                  style={{ background: '#3a0f0f18', border: '1px solid #f43f5e20', color: '#f43f5e' }}>
                  <Trash2 className="w-3.5 h-3.5" /> Очистить
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Centered content ── */}
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e2d3d transparent' }}>
          <div className="max-w-2xl mx-auto px-6 lg:px-8 py-6">

            {/* Filter chips + stats */}
            <div className="flex items-center gap-3 mb-6">
              {[
                { key: 'all' as const, label: 'Все', count: notifications.length },
                { key: 'unread' as const, label: 'Непрочитанные', count: unreadCount },
              ].map(f => (
                <button key={f.key} onClick={() => setActiveFilter(f.key)}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-[12px] font-bold transition-all"
                  style={{
                    background: activeFilter === f.key ? '#1e3a55' : '#ffffff06',
                    border: `1px solid ${activeFilter === f.key ? '#5ba3f530' : '#ffffff08'}`,
                    color: activeFilter === f.key ? '#5ba3f5' : '#4a6580',
                  }}>
                  {f.label}
                  <span className="min-w-[20px] h-5 px-1 rounded-full text-[10px] font-black flex items-center justify-center"
                    style={{
                      background: activeFilter === f.key ? '#5ba3f530' : '#0a1520',
                      color: activeFilter === f.key ? '#5ba3f5' : '#2a4060',
                    }}>
                    {f.count}
                  </span>
                </button>
              ))}

              <div className="flex-1" />

              {/* Type legend chips */}
              <div className="hidden lg:flex items-center gap-1.5">
                {[
                  { type: 'trip', icon: Truck },
                  { type: 'payment', icon: Wallet },
                  { type: 'auth', icon: ShieldCheck },
                  { type: 'offer', icon: Zap },
                  { type: 'system', icon: Info },
                ].map(({ type, icon: TIcon }) => {
                  const color = TYPE_COLOR[type] || '#5ba3f5';
                  const count = notifications.filter(n => n.type === type).length;
                  if (count === 0) return null;
                  return (
                    <div key={type} className="flex items-center gap-1 px-2 py-1 rounded-lg"
                      style={{ background: `${color}08`, border: `1px solid ${color}15` }}>
                      <TIcon className="w-3 h-3" style={{ color }} />
                      <span className="text-[10px] font-bold" style={{ color }}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Content */}
            {loading ? (
              <div className="flex items-center justify-center py-24">
                <div className="animate-spin w-10 h-10 border-3 border-t-[#5ba3f5] rounded-full border-white/10" />
              </div>
            ) : filtered.length === 0 ? (
              renderEmpty()
            ) : (
              <>
                {renderSection('Сегодня', Zap, '#5ba3f5', todayNotifs)}
                {renderSection('Вчера', Clock, '#a855f7', yesterdayNotifs)}
                {renderSection('Ранее', Calendar, '#f59e0b', olderNotifs)}
              </>
            )}

            <div className="h-8" />
          </div>
        </div>
      </div>
    </div>
  );
}
