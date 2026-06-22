import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import {
  LayoutDashboard, Users, Car, Package, FileCheck, BarChart3,
  MessageSquare, Bell, Search, ClipboardList as RequestIcon, Star,
  Menu, X, ChevronRight, Truck, ClipboardList, Megaphone,
  LogOut, Clock, TrendingUp, Database, Crown, Globe, Boxes, Plane, History, ShieldOff,
  KeyRound, SlidersHorizontal,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { YandexMetrikaTracker } from '../YandexMetrika';
import { getAdminStats, searchAdmin, revokeAllAdminSessions } from '../../api/dataApi';
import { usePolling } from '../../hooks/usePolling';
import { AdminAuthGate } from './AdminAuthGate';
import { PLATFORM_THEME, GROUP_PLATFORM } from './platformTheme';

const PIN_SESSION_KEY = 'ovora_admin_auth';

const navGroups = [
  {
    label: 'Главная',
    items: [
      { name: 'Обзор', href: '/admin', icon: LayoutDashboard, exact: true },
    ],
  },
  {
    label: 'CARGO',
    items: [
      { name: 'Водители', href: '/admin/cargo/drivers', icon: Car },
      { name: 'Пользователи', href: '/admin/cargo/users', icon: Users },
      { name: 'Поездки', href: '/admin/cargo/trips', icon: Package },
      { name: 'Грузы', href: '/admin/cargo/cargos', icon: Boxes },
      { name: 'Оферты', href: '/admin/cargo/offers', icon: ClipboardList },
      { name: 'Верификация', href: '/admin/cargo/verification', icon: FileCheck },
      { name: 'Отзывы', href: '/admin/cargo/reviews', icon: MessageSquare },
      { name: 'Аналитика', href: '/admin/cargo/analytics', icon: BarChart3 },
      { name: 'Подписки', href: '/admin/cargo/subscriptions', icon: Crown },
      { name: 'Настройки CARGO', href: '/admin/cargo/settings', icon: SlidersHorizontal },
      { name: 'Аудит CARGO', href: '/admin/cargo/audit', icon: History },
    ],
  },
  {
    label: 'AVIA',
    items: [
      { name: 'AVIA Пользователи', href: '/admin/avia/users', icon: Plane },
      { name: 'AVIA Карточки', href: '/admin/avia/cards', icon: Boxes },
      { name: 'AVIA Аудит', href: '/admin/avia/audit', icon: History },
    ],
  },
  {
    label: 'Общее',
    items: [
      { name: 'Реклама', href: '/admin/ads', icon: Megaphone },
      { name: 'Чёрный список', href: '/admin/blacklist', icon: ShieldOff },
      { name: 'Коды доступа', href: '/admin/codes', icon: KeyRound },
      { name: 'Настройки сайта', href: '/admin/site', icon: Globe },
    ],
  },
];

// Flatten for breadcrumb lookups
const allNavItems = navGroups.flatMap(g => g.items);

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="font-mono text-xs tabular-nums" style={{ color: '#64748b' }}>
      {time.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </span>
  );
}

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const [authed, setAuthed] = useState(() =>
    sessionStorage.getItem(PIN_SESSION_KEY) === 'true' &&
    (!!sessionStorage.getItem('ovora_admin_token') || !!sessionStorage.getItem('ovora_admin_jwt'))
  );
  const adminRole = (sessionStorage.getItem('ovora_admin_role') || 'super-admin') as 'super-admin' | 'cargo-admin' | 'avia-admin';
  const visibleNavGroups = navGroups.filter(group => {
    if (adminRole === 'super-admin') return true;
    if (adminRole === 'cargo-admin') return group.label !== 'AVIA';
    if (adminRole === 'avia-admin') return group.label === 'Главная' || group.label === 'AVIA';
    return true;
  });

  usePolling(async () => {
    const s = await getAdminStats();
    setStats(s);
  }, 30_000, authed);

  // Закрытие панели уведомлений по клику снаружи
  useEffect(() => {
    if (!notifOpen) return;
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [notifOpen]);

  // Поиск по сущностям (находит конкретного пользователя/поездку/оферту/груз/отзыв
  // по email/телефону/имени/ID), а не просто роутинг по ключевым словам раздела.
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchResults(null);
      setSearchOpen(false);
      return;
    }
    const id = setTimeout(async () => {
      try {
        const res = await searchAdmin(q);
        setSearchResults(res);
        setSearchOpen(true);
      } catch {
        setSearchResults(null);
      }
    }, 300);
    return () => clearTimeout(id);
  }, [searchQuery]);

  // Закрытие выпадающего списка результатов поиска по клику снаружи
  useEffect(() => {
    if (!searchOpen) return;
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [searchOpen]);

  if (!authed) {
    return <AdminAuthGate onSuccess={() => setAuthed(true)} />;
  }

  // Каждый пункт несёт href целевого раздела + q/expand для него: q подставляется
  // в его собственный локальный фильтр (гарантированно совпадающее поле), expand —
  // в его expandedId, чтобы сразу раскрыть найденную карточку.
  const searchHits = searchResults ? [
    ...(searchResults.users || []).map((u: any) => ({
      key: `user-${u.email}`,
      icon: u.role === 'driver' ? Car : Users,
      label: u.name || u.email,
      sublabel: u.role === 'driver' ? (u.phone || u.email) : u.email,
      href: u.role === 'driver' ? '/admin/cargo/drivers' : '/admin/cargo/users',
      q: u.email,
      expand: u.email,
    })),
    ...(searchResults.trips || []).map((t: any) => ({
      key: `trip-${t.id}`,
      icon: Truck,
      label: `${t.from} → ${t.to}`,
      sublabel: t.driverName,
      href: '/admin/cargo/trips',
      q: t.driverName,
      expand: t.id,
    })),
    ...(searchResults.offers || []).map((o: any) => ({
      key: `offer-${o.offerId}`,
      icon: RequestIcon,
      label: `${o.senderName} ↔ ${o.driverName}`,
      sublabel: o.tripId,
      href: '/admin/cargo/offers',
      q: o.tripId,
      expand: o.offerId,
    })),
    ...(searchResults.cargos || []).map((cg: any) => ({
      key: `cargo-${cg.id}`,
      icon: Boxes,
      label: `${cg.from} → ${cg.to}`,
      sublabel: cg.senderName,
      href: '/admin/cargo/cargos',
      q: cg.senderName,
      expand: cg.id,
    })),
    ...(searchResults.reviews || []).map((r: any) => ({
      key: `review-${r.reviewId}`,
      icon: Star,
      label: r.authorName,
      sublabel: r.targetName,
      href: '/admin/cargo/reviews',
      q: r.authorName,
      expand: r.reviewId,
    })),
  ] : [];

  const goToHit = (hit: { href: string; q: string; expand: string }) => {
    setSearchOpen(false);
    setSearchQuery('');
    navigate(`${hit.href}?q=${encodeURIComponent(hit.q)}&expand=${encodeURIComponent(hit.expand)}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchHits[0]) goToHit(searchHits[0]);
  };

  const isActive = (item: { href: string; exact?: boolean }) => {
    if (item.exact) return location.pathname === item.href;
    return location.pathname.startsWith(item.href);
  };

  const currentPage = allNavItems.find(n => isActive(n));
  const currentGroup = navGroups.find(g => g.items.some(n => isActive(n)));
  const currentPlatform = currentGroup ? GROUP_PLATFORM[currentGroup.label] : undefined;
  const today = new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });

  const notifItems = [
    ...(stats?.pendingOffers > 0 ? [{
      href: '/admin/cargo/offers',
      label: `${stats.pendingOffers} новых заявок`,
      icon: RequestIcon,
      bg: '#eff6ff',
      color: '#2563eb',
    }] : []),
    ...(stats?.recentReviews > 0 ? [{
      href: '/admin/cargo/reviews',
      label: `${stats.recentReviews} новых отзывов`,
      icon: Star,
      bg: '#fffbeb',
      color: '#d97706',
    }] : []),
  ];
  const notifTotal = (stats?.pendingOffers || 0) + (stats?.recentReviews || 0);

  return (
    <div className="min-h-screen bg-[#f1f5f9]">
      <YandexMetrikaTracker />

      {/* Mobile backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar ── */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 z-50
          flex flex-col transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
        style={{
          background: '#ffffff',
          borderRight: '1px solid #e2e8f0',
          boxShadow: '4px 0 24px #00000010',
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid #f0f4f8' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg,#1565d8,#2385f4)',
                boxShadow: '0 4px 14px #1565d840',
              }}
            >
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm leading-tight">Ovora Cargo</p>
              <p className="text-[11px] font-semibold" style={{ color: '#2385f4' }}>Админ-панель</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-4">
          {visibleNavGroups.map(group => {
            const groupAccent = PLATFORM_THEME[GROUP_PLATFORM[group.label]]?.accent || '#1565d8';
            return (
              <div key={group.label}>
                <p className="text-[10px] font-bold uppercase tracking-widest px-3 mb-1.5" style={{ color: '#94a3b8' }}>
                  {group.label}
                </p>
                <ul className="space-y-0.5">
                  {group.items.map(item => {
                    const active = isActive(item);
                    return (
                      <li key={item.href}>
                        <Link
                          to={item.href}
                          onClick={() => setSidebarOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative outline-none"
                        >
                          <div
                            className="relative z-10 w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all"
                            style={{
                              background: active ? groupAccent : '#f1f5f9',
                            }}
                          >
                            <item.icon
                              style={{
                                width: 15,
                                height: 15,
                                color: active ? '#ffffff' : '#64748b',
                                strokeWidth: 2,
                              }}
                            />
                          </div>

                          <span
                            className="font-medium text-sm flex-1 relative z-10 transition-colors duration-150"
                            style={{ color: active ? groupAccent : '#475569' }}
                          >
                            {item.name}
                          </span>

                          {active && (
                            <ChevronRight className="w-3.5 h-3.5 relative z-10 flex-shrink-0" style={{ color: groupAccent }} />
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>

        {/* User & logout */}
        <div className="flex-shrink-0 p-3" style={{ borderTop: '1px solid #f0f4f8' }}>
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl mb-1">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#1565d8,#7c3aed)' }}
            >
              АД
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate leading-tight">Администратор</p>
              <p className="text-xs text-gray-400 truncate">
                {adminRole === 'super-admin' ? 'Полный доступ' : adminRole === 'cargo-admin' ? 'CARGO' : 'AVIA'}
              </p>
            </div>
          </div>
          {adminRole === 'super-admin' && (
            <button
              onClick={async () => {
                if (!window.confirm('Отозвать все выданные admin-токены? Все админы (включая вас) будут разлогинены немедленно.')) return;
                try {
                  await revokeAllAdminSessions();
                } catch (err) {
                  console.error('[AdminLayout] revoke-all failed:', err);
                }
                sessionStorage.removeItem(PIN_SESSION_KEY);
                sessionStorage.removeItem('ovora_admin_token');
                sessionStorage.removeItem('ovora_admin_jwt');
                sessionStorage.removeItem('ovora_admin_role');
                window.location.reload();
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium rounded-xl transition-colors text-gray-400 hover:text-orange-500 hover:bg-orange-50"
            >
              <ShieldOff className="w-3.5 h-3.5" />
              Завершить все сессии
            </button>
          )}
          <button
            onClick={() => {
              sessionStorage.removeItem(PIN_SESSION_KEY);
              sessionStorage.removeItem('ovora_admin_token');
              sessionStorage.removeItem('ovora_admin_jwt');
              sessionStorage.removeItem('ovora_admin_role');
              window.location.reload();
            }}
            className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium rounded-xl transition-colors text-gray-400 hover:text-red-500 hover:bg-red-50"
          >
            <LogOut className="w-3.5 h-3.5" />
            Выйти из панели
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="lg:pl-64 flex flex-col min-h-screen">

        {/* Header */}
        <header
          className="sticky top-0 z-30 flex-shrink-0"
          style={{
            background: '#ffffffee',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid #e2e8f0',
            boxShadow: '0 1px 8px #00000008',
          }}
        >
          <div className="flex items-center gap-3 px-4 py-3">
            {/* Mobile hamburger */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb */}
            <div className="hidden lg:flex items-center gap-2 text-sm">
              <span className="text-gray-400 font-medium">Ovora Admin</span>
              <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
              <span className="font-semibold" style={{ color: currentPlatform ? PLATFORM_THEME[currentPlatform].accent : '#1565d8' }}>
                {currentPage?.name || 'Обзор'}
              </span>
              {currentPlatform && (
                <span
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold"
                  style={{ background: PLATFORM_THEME[currentPlatform].bg, color: PLATFORM_THEME[currentPlatform].accent }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: PLATFORM_THEME[currentPlatform].accent }} />
                  {PLATFORM_THEME[currentPlatform].label}
                </span>
              )}
            </div>

            {/* Search */}
            <div ref={searchRef} className="relative flex-1 max-w-sm mx-auto lg:mx-4">
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Поиск по email, телефону, имени, ID..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onFocus={e => {
                      e.currentTarget.style.borderColor = '#1565d866';
                      e.currentTarget.style.boxShadow = '0 0 0 3px #1565d815';
                      if (searchResults) setSearchOpen(true);
                    }}
                    onBlur={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}
                    className="w-full pl-9 pr-4 py-2 text-sm text-gray-700 placeholder-gray-400 rounded-xl outline-none transition-all"
                    style={{ background: '#f1f5f9', border: '1px solid #e2e8f0' }}
                  />
                </div>
              </form>

              <AnimatePresence>
                {searchOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 top-full mt-2 w-full rounded-2xl shadow-lg overflow-hidden z-50"
                    style={{ background: '#fff', border: '1px solid #e2e8f0' }}
                  >
                    <div className="max-h-80 overflow-y-auto">
                      {searchHits.length === 0 ? (
                        <p className="px-4 py-6 text-sm text-gray-400 text-center">Ничего не найдено</p>
                      ) : (
                        searchHits.map(hit => (
                          <button
                            key={hit.key}
                            onClick={() => goToHit(hit)}
                            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                            style={{ borderBottom: '1px solid #f8fafc' }}
                          >
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#eff6ff' }}>
                              <hit.icon className="w-4 h-4" style={{ color: '#2563eb' }} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm text-gray-700 font-medium truncate">{hit.label}</p>
                              {hit.sublabel && <p className="text-xs text-gray-400 truncate">{hit.sublabel}</p>}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2 ml-auto">
              {/* Date + Clock */}
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs text-gray-500 capitalize hidden lg:inline">{today}</span>
                <span className="text-gray-300 hidden lg:inline">•</span>
                <LiveClock />
              </div>

              {/* DB indicator */}
              <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <Database className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-xs font-medium text-emerald-700">Supabase KV</span>
              </div>

              {/* Notifications */}
              <div ref={notifRef} className="relative">
                <button
                  onClick={() => setNotifOpen(v => !v)}
                  aria-label="Уведомления"
                  aria-expanded={notifOpen}
                  className="relative p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {notifTotal > 0 && (
                    <span
                      className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold"
                      style={{ boxShadow: '0 0 6px #ef444480' }}
                    >
                      {notifTotal > 9 ? '9+' : notifTotal}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {notifOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-72 rounded-2xl shadow-lg overflow-hidden z-50"
                      style={{ background: '#fff', border: '1px solid #e2e8f0' }}
                    >
                      <div className="px-4 py-3" style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <p className="text-sm font-bold text-gray-700">Уведомления</p>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifItems.length === 0 ? (
                          <p className="px-4 py-6 text-sm text-gray-400 text-center">Нет новых уведомлений</p>
                        ) : (
                          notifItems.map(item => (
                            <button
                              key={item.href}
                              onClick={() => { setNotifOpen(false); navigate(item.href); }}
                              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                              style={{ borderBottom: '1px solid #f8fafc' }}
                            >
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: item.bg }}>
                                <item.icon className="w-4 h-4" style={{ color: item.color }} />
                              </div>
                              <span className="text-sm text-gray-600">{item.label}</span>
                            </button>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Quick stats */}
              {stats && (
                <div className="hidden xl:flex items-center gap-1 px-3 py-1.5 rounded-xl" style={{ background: '#f1f5f9', border: '1px solid #e2e8f0' }}>
                  <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
                  <span className="text-xs text-gray-500">Польз.:</span>
                  <span className="text-xs font-bold text-blue-600">{stats.users}</span>
                  <span className="mx-1 text-gray-300">•</span>
                  <span className="text-xs text-gray-500">Поездок:</span>
                  <span className="text-xs font-bold text-blue-600">{stats.trips}</span>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6" style={{ background: '#f1f5f9' }}>
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="px-6 py-3 flex-shrink-0" style={{ borderTop: '1px solid #e2e8f0', background: '#ffffff' }}>
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400">Ovora Cargo Admin • v2.0</p>
            <p className="text-xs text-gray-400">Все данные из Supabase KV Store</p>
          </div>
        </footer>
      </div>
    </div>
  );
}