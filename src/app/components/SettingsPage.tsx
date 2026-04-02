import { useState } from 'react';
import {
  Globe, Bell, Shield, LogOut, ChevronRight, ArrowLeft, Check,
  Smartphone, Info, Trash2, RefreshCw, Truck, Package,
  BellRing, MessageSquare, Navigation, KeyRound, Star, User,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router';
import { useLanguage } from '../context/LanguageContext';
import { useUser } from '../contexts/UserContext';
import { toast } from 'sonner';
import type { LangCode } from '../i18n/translations';
import {
  isPushSupported,
  subscribeToPush,
  unsubscribeFromPush,
} from '../utils/pushService';

const LANG_OPTIONS: { code: LangCode; label: string; flag: string; native: string }[] = [
  { code: 'ru', label: 'Русский', flag: '🇷🇺', native: 'ru' },
  { code: 'tj', label: 'Тоҷикӣ', flag: '🇹🇯', native: 'tj' },
  { code: 'en', label: 'English', flag: '🇺🇸', native: 'en' },
];

interface RowItem {
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  label: string;
  sublabel?: string;
  right?: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
}

export function SettingsPage() {
  const navigate = useNavigate();
  const { lang: language, setLang } = useLanguage();
  const { user, logout: contextLogout } = useUser();

  const [notifs, setNotifs] = useState({
    push:     localStorage.getItem('ovora_notif_push')     !== 'false',
    offers:   localStorage.getItem('ovora_notif_offers')   !== 'false',
    messages: localStorage.getItem('ovora_notif_messages') !== 'false',
    trips:    localStorage.getItem('ovora_notif_trips')    !== 'false',
  });
  const [showLang,    setShowLang]    = useState(false);
  const [showLogout,  setShowLogout]  = useState(false);
  const [pushLoading, setPushLoading] = useState(false);

  const toggleNotif = async (key: keyof typeof notifs) => {
    if (key === 'push') {
      if (!isPushSupported()) { toast.error('Ваш браузер не поддерживает push-уведомления'); return; }
      setPushLoading(true);
      try {
        const email = user?.email || sessionStorage.getItem('ovora_user_email') || '';
        if (notifs.push) {
          await unsubscribeFromPush(email);
          setNotifs(p => ({ ...p, push: false }));
          localStorage.setItem('ovora_notif_push', 'false');
          toast.success('Push-уведомления отключены');
        } else {
          const result = await subscribeToPush(email);
          if (result === 'granted') {
            setNotifs(p => ({ ...p, push: true }));
            localStorage.setItem('ovora_notif_push', 'true');
            toast.success('🔔 Push-уведомления включены!', { description: 'Вы получите уведомление сразу при новом сообщении', duration: 4000 });
          } else if (result === 'denied') {
            toast.error('Разрешение отклонено', { description: 'Включите уведомления в настройках браузера', duration: 5000 });
          }
        }
      } finally { setPushLoading(false); }
      return;
    }
    const next = { ...notifs, [key]: !notifs[key] };
    setNotifs(next);
    localStorage.setItem(`ovora_notif_${key}`, String(next[key]));
    toast.success(next[key] ? 'Уведомления включены' : 'Уведомления отключены');
  };

  const handleLogout = () => {
    contextLogout();
    toast.success('Вы вышли из аккаунта');
    navigate('/');
  };

  const currentLang = LANG_OPTIONS.find(l => l.code === language);
  const isDriver    = user?.role === 'driver';
  const roleColor   = isDriver ? '#5ba3f5' : '#10b981';
  const initials    = [user?.firstName?.[0], user?.lastName?.[0]].filter(Boolean).join('').toUpperCase() || '?';
  const displayName = user ? (user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim()) : 'Пользователь';

  // ── Toggle (motion animates only x — safe) ─────────────────────────────────
  const Toggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
    <div
      role="switch" aria-checked={value}
      onClick={e => { e.stopPropagation(); onChange(); }}
      className="relative flex-shrink-0 cursor-pointer transition-colors duration-300"
      style={{ width: 44, height: 26, borderRadius: 13, background: value ? '#5ba3f5' : 'rgba(255,255,255,0.10)' }}
    >
      <motion.span
        className="absolute top-[3px] left-[3px] w-5 h-5 rounded-full bg-white shadow-md"
        animate={{ x: value ? 18 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 28 }}
      />
    </div>
  );

  // ── Sections data ───────────────────────────────────────────────────────────
  const notifRows: RowItem[] = [
    { icon: BellRing,     iconColor: '#5ba3f5', iconBg: '#5ba3f514', label: 'Push-уведомления', sublabel: 'Все уведомления приложения', onClick: () => toggleNotif('push'),     right: <Toggle value={notifs.push}     onChange={() => toggleNotif('push')} /> },
    { icon: Star,         iconColor: '#f59e0b', iconBg: '#f59e0b14', label: 'Новые заявки',     sublabel: 'Уведомления об офферах',    onClick: () => toggleNotif('offers'),   right: <Toggle value={notifs.offers}   onChange={() => toggleNotif('offers')} /> },
    { icon: MessageSquare,iconColor: '#10b981', iconBg: '#10b98114', label: 'Сообщения',        sublabel: 'Новые сообщения в чате',    onClick: () => toggleNotif('messages'), right: <Toggle value={notifs.messages} onChange={() => toggleNotif('messages')} /> },
    { icon: Navigation,   iconColor: '#a855f7', iconBg: '#a855f714', label: 'Поездки',          sublabel: 'Обновления статуса поездок',onClick: () => toggleNotif('trips'),    right: <Toggle value={notifs.trips}    onChange={() => toggleNotif('trips')} /> },
  ];

  const securityRows: RowItem[] = [
    { icon: KeyRound,   iconColor: '#5ba3f5', iconBg: '#5ba3f514', label: 'Изменить PIN',                 sublabel: 'Обновите свой 6-значный код',    onClick: () => toast('Скоро будет доступно') },
    { icon: Shield,     iconColor: '#10b981', iconBg: '#10b98114', label: 'Двухфакторная аутентификация', sublabel: 'Дополнительная защита',          onClick: () => toast('Скоро будет доступно') },
    { icon: Smartphone, iconColor: '#f59e0b', iconBg: '#f59e0b14', label: 'Активные сессии',              sublabel: 'Управление устройствами',        onClick: () => toast('Скоро будет доступно') },
  ];

  const appRows: RowItem[] = [
    { icon: Globe,     iconColor: '#5ba3f5', iconBg: '#5ba3f514',         label: 'Язык интерфейса', sublabel: `${currentLang?.flag} ${currentLang?.label}`, onClick: () => setShowLang(true) },
    { icon: Info,      iconColor: '#607080', iconBg: 'rgba(255,255,255,0.07)', label: 'О приложении',    sublabel: 'Ovora Cargo v1.0.0',                    onClick: () => navigate('/about') },
    { icon: RefreshCw, iconColor: '#a855f7', iconBg: '#a855f714',         label: 'Очистить кэш',   sublabel: 'Обновить данные поездок',
      onClick: () => {
        ['ovora_published_trips','ovora_all_trips','ovora_offers','ovora_reviews'].forEach(k => localStorage.removeItem(k));
        window.dispatchEvent(new Event('ovora_trip_update'));
        toast.success('Кэш очищен! Данные обновлены.');
      }
    },
  ];

  const dangerRows: RowItem[] = [
    { icon: Trash2, iconColor: '#f87171', iconBg: 'rgba(239,68,68,0.12)', label: 'Удалить аккаунт',   sublabel: 'Безвозвратное удаление данных', danger: true, onClick: () => toast('Для удаления обратитесь в поддержку') },
    { icon: LogOut, iconColor: '#f87171', iconBg: 'rgba(239,68,68,0.12)', label: 'Выйти из аккаунта', danger: true, right: null,                               onClick: () => setShowLogout(true) },
  ];

  // ── Shared modals (used in both layouts) ───────────────────────────────────
  const LangSheet = () => (
    <AnimatePresence>
      {showLang && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowLang(false)} />
          <motion.div
            className="relative w-full max-w-md rounded-t-3xl md:rounded-3xl overflow-hidden border border-white/[0.08]"
            style={{ background: '#131e2b' }}
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="flex justify-center pt-3 pb-2 md:hidden">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>
            <div className="px-5 py-4 border-b border-white/[0.07] flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-[#5ba3f514] flex items-center justify-center">
                <Globe className="w-4 h-4 text-[#5ba3f5]" />
              </div>
              <div>
                <p className="text-[15px] font-black text-white">Язык интерфейса</p>
                <p className="text-[11px] text-[#607080]">Выберите предпочтительный язык</p>
              </div>
            </div>
            <div className="p-3 flex flex-col gap-2">
              {LANG_OPTIONS.map(lang => {
                const active = language === lang.code;
                return (
                  <button
                    key={lang.code}
                    onClick={() => { setLang(lang.code as LangCode); setShowLang(false); toast.success(`Язык: ${lang.label}`); }}
                    className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-left transition-all hover:opacity-90 active:scale-[0.98]"
                    style={{ background: active ? '#5ba3f514' : 'rgba(255,255,255,0.03)', border: `1.5px solid ${active ? '#5ba3f540' : 'rgba(255,255,255,0.06)'}` }}
                  >
                    <span className="text-2xl">{lang.flag}</span>
                    <div className="flex-1">
                      <p className={`text-[15px] font-bold ${active ? 'text-[#5ba3f5]' : 'text-white'}`}>{lang.label}</p>
                      <p className="text-[11px] text-[#607080] uppercase font-semibold tracking-wider">{lang.native}</p>
                    </div>
                    {active && (
                      <div className="w-6 h-6 rounded-full bg-[#5ba3f5] flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            <div style={{ height: 'env(safe-area-inset-bottom, 12px)', minHeight: 12 }} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const LogoutModal = () => (
    <AnimatePresence>
      {showLogout && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center px-5"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <motion.div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setShowLogout(false)} />
          <motion.div
            className="relative w-full max-w-sm rounded-3xl border border-white/[0.10] overflow-hidden"
            style={{ background: '#131e2b' }}
            initial={{ scale: 0.85, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
          >
            <div className="h-[2px] bg-gradient-to-r from-red-500 to-rose-400" />
            <div className="p-6">
              <div className="w-14 h-14 rounded-3xl bg-red-500/[0.12] flex items-center justify-center mb-4">
                <LogOut className="w-7 h-7 text-red-400" />
              </div>
              <h3 className="text-[20px] font-black text-white mb-1.5">Выйти из аккаунта?</h3>
              <p className="text-[13px] text-[#607080] leading-snug mb-6">
                Вам нужно будет снова войти через email и PIN для продолжения работы
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowLogout(false)}
                  className="flex-1 h-12 rounded-2xl text-[14px] font-bold text-[#607080] border border-white/[0.08] hover:border-white/[0.15] hover:text-white transition-all">
                  Отмена
                </button>
                <button onClick={handleLogout}
                  className="flex-1 h-12 rounded-2xl text-[14px] font-black text-white transition-all active:scale-[0.97]"
                  style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)', boxShadow: '0 4px 16px rgba(239,68,68,0.30)' }}>
                  Выйти
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // ── Mobile Row ──────────────────────────────────────────────────────────────
  const MobileRow = ({ item }: { item: RowItem }) => {
    const { icon: Icon, iconColor, iconBg, label, sublabel, right, onClick, danger } = item;
    return (
      <button onClick={onClick} className="w-full flex items-center gap-3.5 px-4 py-3.5 transition-all active:scale-[0.98] active:bg-white/[0.03] text-left">
        <div className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: danger ? 'rgba(239,68,68,0.12)' : iconBg }}>
          <Icon className="w-[18px] h-[18px]" style={{ color: danger ? '#f87171' : iconColor }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-[14px] font-semibold ${danger ? 'text-red-400' : 'text-white'}`}>{label}</p>
          {sublabel && <p className="text-[11px] text-[#607080] mt-0.5">{sublabel}</p>}
        </div>
        {right !== undefined ? right : <ChevronRight className="w-4 h-4 text-[#607080] shrink-0" />}
      </button>
    );
  };

  const MobileCard = ({ children }: { children: React.ReactNode }) => (
    <div className="rounded-3xl border border-white/[0.07] overflow-hidden divide-y divide-white/[0.06]" style={{ background: 'rgba(255,255,255,0.04)' }}>
      {children}
    </div>
  );

  const MobileSection = ({ title, icon: SIcon, color, children, delay = 0 }: {
    title: string; icon?: React.ElementType; color?: string; children: React.ReactNode; delay?: number;
  }) => (
    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.35, ease: [0.4, 0, 0.2, 1] }}>
      <div className="flex items-center gap-2 px-1 mb-2.5">
        {SIcon && <SIcon className="w-3.5 h-3.5" style={{ color: color ?? '#607080' }} />}
        <p className="text-[10px] font-black uppercase tracking-widest text-[#607080]">{title}</p>
      </div>
      <MobileCard>{children}</MobileCard>
    </motion.div>
  );

  // ── Desktop Row ─────────────────────────────────────────────────────────────
  const DRow = ({ item, isLast = false }: { item: RowItem; isLast?: boolean }) => {
    const { icon: Icon, iconColor, iconBg, label, sublabel, right, onClick, danger } = item;
    return (
      <button onClick={onClick}
        className={`w-full flex items-center gap-4 px-5 py-4 text-left transition-all duration-150 group hover:bg-white/[0.04] active:bg-white/[0.07] ${!isLast ? 'border-b border-white/[0.05]' : ''}`}>
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-all group-hover:scale-105"
          style={{ background: danger ? 'rgba(239,68,68,0.12)' : iconBg, borderWidth: 1, borderStyle: 'solid', borderColor: danger ? 'rgba(239,68,68,0.20)' : iconBg.replace('14', '25') }}>
          <Icon className="w-5 h-5" style={{ color: danger ? '#f87171' : iconColor }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-[14px] font-bold ${danger ? 'text-red-400' : 'text-white'}`}>{label}</p>
          {sublabel && <p className="text-[12px] text-[#607080] mt-0.5">{sublabel}</p>}
        </div>
        {right !== undefined
          ? right
          : <ChevronRight className="w-4 h-4 text-[#607080]/40 group-hover:text-[#607080] group-hover:translate-x-0.5 transition-all shrink-0" />}
      </button>
    );
  };

  const DCard = ({ children }: { children: React.ReactNode }) => (
    <div className="rounded-3xl overflow-hidden"
      style={{ background: 'linear-gradient(145deg,#0d1929,#111827)', borderWidth: 1, borderStyle: 'solid', borderColor: '#ffffff0a' }}>
      {children}
    </div>
  );

  const DSection = ({ title, icon: SIcon, color, rows }: { title: string; icon?: React.ElementType; color?: string; rows: RowItem[] }) => (
    <section>
      <div className="flex items-center gap-2 mb-3 px-1">
        {SIcon && <SIcon className="w-3.5 h-3.5" style={{ color: color ?? '#607080' }} />}
        <p className="text-[10px] font-black uppercase tracking-widest text-[#4a6278]">{title}</p>
      </div>
      <DCard>
        {rows.map((item, idx) => <DRow key={item.label} item={item} isLast={idx === rows.length - 1} />)}
      </DCard>
    </section>
  );

  return (
    <div className="font-['Sora'] bg-[#0e1621] text-white">

      {/* ══════════════════════ MOBILE (unchanged) ══════════════════════════ */}
      <div className="md:hidden min-h-screen flex flex-col md:max-w-2xl md:mx-auto">
        {/* Header */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0" style={{ background: 'linear-gradient(145deg,#0f2744 0%,#0e1621 60%)' }} />
            <div className="absolute -top-12 sm:-top-16 -right-12 sm:-right-16 w-40 sm:w-52 h-40 sm:h-52 rounded-full"
              style={{ background: 'radial-gradient(circle,#1d4ed8 0%,transparent 70%)', opacity: 0.18 }} />
          </div>
          <div className="relative flex items-center gap-2 sm:gap-3 px-3 sm:px-4"
            style={{ paddingTop: 'max(52px, env(safe-area-inset-top, 52px))', paddingBottom: 12 }}>
            <button onClick={() => navigate(-1)}
              className="w-9 sm:w-10 h-9 sm:h-10 rounded-2xl flex items-center justify-center bg-white/[0.07] border border-white/10 text-white active:scale-90 transition-all">
              <ArrowLeft className="w-4.5 sm:w-5 h-4.5 sm:h-5" />
            </button>
            <div className="flex-1 text-center">
              <h1 className="text-[20px] sm:text-[22px] font-black text-white leading-tight">Настройки</h1>
            </div>
            <div className="w-9 sm:w-10" />
          </div>
        </div>

        <main className="flex-1 px-3 sm:px-4 pt-4 pb-28 sm:pb-32 flex flex-col gap-4 sm:gap-5">
          <div className="flex-1 overflow-y-auto">
            <div className="px-4 flex flex-col gap-5 pt-2">
              <MobileSection title="Уведомления" icon={Bell}   color="#5ba3f5" delay={0.08}>{notifRows.map((item, i) => <MobileRow key={i} item={item} />)}</MobileSection>
              <MobileSection title="Безопасность" icon={Shield} color="#10b981" delay={0.14}>{securityRows.map((item, i) => <MobileRow key={i} item={item} />)}</MobileSection>
              <MobileSection title="Приложение"   icon={Info}   color="#a855f7" delay={0.20}>{appRows.map((item, i) => <MobileRow key={i} item={item} />)}</MobileSection>
              <MobileSection title="Аккаунт"      icon={LogOut} color="#f87171" delay={0.26}>{dangerRows.map((item, i) => <MobileRow key={i} item={item} />)}</MobileSection>
              <motion.p className="text-center text-[11px] text-[#607080]/50 pb-2"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                Ovora Cargo · v1.0.0 · Made with ❤️
              </motion.p>
            </div>
          </div>
        </main>
      </div>

      {/* ══════════════════════ DESKTOP ═════════════════════════════════════ */}
      <div className="hidden md:block min-h-screen" style={{ background: '#0e1621' }}>

        {/* Top bar */}
        <div className="border-b border-white/[0.06]" style={{ background: '#0e1621' }}>
          <div className="max-w-6xl mx-auto px-8 py-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#4a6278]">Конфигурация</p>
              <h1 className="text-[22px] font-black text-white leading-tight">Настройки</h1>
            </div>
            <button onClick={() => navigate('/profile')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-[#607080] hover:text-white transition-all text-[13px] font-semibold"
              style={{ background: '#ffffff08', borderWidth: 1, borderStyle: 'solid', borderColor: '#ffffff10' }}>
              <ArrowLeft className="w-4 h-4" /> Профиль
            </button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-8 py-8 flex gap-8 items-start">

          {/* ── LEFT: user card + quick actions ─────────────────────────── */}
          <div className="w-72 flex-shrink-0 flex flex-col gap-4 sticky top-8">

            {/* User card */}
            <div className="rounded-3xl overflow-hidden"
              style={{ background: 'linear-gradient(145deg,#0d1f3a,#111827)', borderWidth: 1, borderStyle: 'solid', borderColor: '#ffffff0d' }}>
              <div className="h-1" style={{ background: `linear-gradient(90deg,${roleColor},${roleColor}80,transparent)` }} />
              <div className="p-5">
                <div className="flex items-center gap-3.5 mb-4">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-lg flex-shrink-0"
                    style={{ background: user?.avatarUrl ? undefined : `linear-gradient(135deg,${roleColor},#7c3aed)`, boxShadow: `0 6px 20px ${roleColor}30` }}>
                    {user?.avatarUrl
                      ? <img src={user.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center">
                          <span className="text-white font-black text-xl">{initials}</span>
                        </div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[16px] font-black text-white truncate">{displayName}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className={`w-4 h-4 rounded-md flex items-center justify-center`} style={{ background: roleColor + '20' }}>
                        {isDriver ? <Truck className="w-2.5 h-2.5" style={{ color: roleColor }} /> : <Package className="w-2.5 h-2.5" style={{ color: roleColor }} />}
                      </div>
                      <span className="text-[12px] font-bold" style={{ color: roleColor }}>{isDriver ? 'Водитель' : 'Отправитель'}</span>
                    </div>
                  </div>
                </div>

                {/* Quick links */}
                <div className="space-y-1.5">
                  {[
                    { label: 'Редактировать профиль', onClick: () => navigate('/profile/edit'), color: '#5ba3f5' },
                    { label: 'Мои поездки',           onClick: () => navigate('/trips'),         color: '#10b981' },
                    { label: 'Уведомления',            onClick: () => navigate('/notifications'), color: '#a855f7' },
                  ].map(q => (
                    <button key={q.label} onClick={q.onClick}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[12px] font-semibold transition-all hover:opacity-80"
                      style={{ background: q.color + '0e', color: q.color, borderWidth: 1, borderStyle: 'solid', borderColor: q.color + '20' }}>
                      {q.label}
                      <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Logout */}
            <button onClick={() => setShowLogout(true)}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border border-rose-500/20 bg-rose-500/[0.07] hover:bg-rose-500/[0.12] transition-all text-left group">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-rose-500/20 shrink-0 group-hover:bg-rose-500/30 transition-all">
                <LogOut className="w-4 h-4 text-rose-400" />
              </div>
              <div className="flex-1">
                <p className="text-[14px] font-bold text-rose-400">Выйти из аккаунта</p>
                <p className="text-[11px] text-rose-400/50">Завершить сессию</p>
              </div>
            </button>

            <p className="text-center text-[11px] text-[#607080]/40 font-medium">Ovora Cargo · v1.0.0</p>
          </div>

          {/* ── RIGHT: settings sections ─────────────────────────────────── */}
          <div className="flex-1 flex flex-col gap-6 min-w-0">

            {/* Notifications grid */}
            <section>
              <div className="flex items-center gap-2 mb-3 px-1">
                <Bell className="w-3.5 h-3.5 text-[#5ba3f5]" />
                <p className="text-[10px] font-black uppercase tracking-widest text-[#4a6278]">Уведомления</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {notifRows.map(item => {
                  const Icon = item.icon;
                  const right = item.right as React.ReactElement | null | undefined;
                  const toggleEl = right;
                  return (
                    <div key={item.label}
                      className="rounded-2xl p-4 flex flex-col gap-3 cursor-pointer transition-all hover:bg-white/[0.03]"
                      style={{ background: 'linear-gradient(145deg,#0d1929,#111827)', borderWidth: 1, borderStyle: 'solid', borderColor: '#ffffff0a' }}
                      onClick={item.onClick}>
                      <div className="flex items-center justify-between">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                          style={{ background: item.iconBg, borderWidth: 1, borderStyle: 'solid', borderColor: item.iconBg.replace('14', '25') }}>
                          <Icon className="w-4.5 h-4.5" style={{ color: item.iconColor }} />
                        </div>
                        {toggleEl}
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-white">{item.label}</p>
                        {item.sublabel && <p className="text-[11px] text-[#607080] mt-0.5">{item.sublabel}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Security */}
            <DSection title="Безопасность" icon={Shield} color="#10b981" rows={securityRows} />

            {/* App */}
            <DSection title="Приложение" icon={Info} color="#a855f7" rows={appRows} />

            {/* Danger */}
            <DSection title="Аккаунт" icon={LogOut} color="#f87171" rows={dangerRows} />

          </div>
        </div>
      </div>

      {/* Shared modals */}
      <LangSheet />
      <LogoutModal />
    </div>
  );
}