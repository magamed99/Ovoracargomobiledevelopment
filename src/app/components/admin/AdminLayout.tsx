import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import {
  LayoutDashboard, Users, Car, Package, FileCheck, BarChart3,
  MessageSquare, Bell, Search,
  Menu, X, ChevronRight, Truck, ClipboardList, Megaphone,
  LogOut, Clock, TrendingUp, Database,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { YandexMetrikaTracker } from '../YandexMetrika';
import { getAdminStats } from '../../api/dataApi';
import { AdminAuthGate } from './AdminAuthGate';

const PIN_SESSION_KEY = 'ovora_admin_auth';

const navGroups = [
  {
    label: 'Главная',
    items: [
      { name: 'Обзор', href: '/admin', icon: LayoutDashboard, exact: true },
    ],
  },
  {
    label: 'Управление',
    items: [
      { name: 'Водители', href: '/admin/drivers', icon: Car },
      { name: 'Пользователи', href: '/admin/users', icon: Users },
      { name: 'Поездки', href: '/admin/trips', icon: Package },
      { name: 'Оферты', href: '/admin/offers', icon: ClipboardList },
      { name: 'Реклама', href: '/admin/ads', icon: Megaphone },
      { name: 'Верификация', href: '/admin/verification', icon: FileCheck },
    ],
  },
  {
    label: 'Отчёты',
    items: [
      { name: 'Аналитика', href: '/admin/analytics', icon: BarChart3 },
      { name: 'Отзывы', href: '/admin/reviews', icon: MessageSquare },
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
  const [searchQuery, setSearchQuery] = useState('');
  const [authed, setAuthed] = useState(() =>
    sessionStorage.getItem(PIN_SESSION_KEY) === 'true' && !!sessionStorage.getItem('ovora_admin_token')
  );

  useEffect(() => {
    if (authed) {
      getAdminStats().then(s => setStats(s)).catch(() => {});
    }
  }, [authed]);

  if (!authed) {
    return <AdminAuthGate onSuccess={() => setAuthed(true)} />;
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const q = searchQuery.toLowerCase();
    if (q.includes('водитель') || q.includes('driver')) navigate('/admin/drivers');
    else if (q.includes('пользователь') || q.includes('user')) navigate('/admin/users');
    else if (q.includes('поездк') || q.includes('trip')) navigate('/admin/trips');
    else if (q.includes('аналитик') || q.includes('analytic')) navigate('/admin/analytics');
    else if (q.includes('отзыв') || q.includes('review')) navigate('/admin/reviews');
    setSearchQuery('');
  };

  const isActive = (item: { href: string; exact?: boolean }) => {
    if (item.exact) return location.pathname === item.href;
    return location.pathname.startsWith(item.href);
  };

  const currentPage = allNavItems.find(n => isActive(n));
  const today = new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });

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
          {navGroups.map(group => (
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
                            background: active ? '#1565d8' : '#f1f5f9',
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
                          style={{ color: active ? '#1565d8' : '#475569' }}
                        >
                          {item.name}
                        </span>

                        {active && (
                          <ChevronRight className="w-3.5 h-3.5 relative z-10 flex-shrink-0" style={{ color: '#1565d8' }} />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Stats pill */}
        {stats && (
          <div className="mx-3 mb-3 px-3 py-2.5 rounded-xl" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: 'Польз.', val: stats.users, color: '#3b82f6' },
                { label: 'Поездок', val: stats.trips, color: '#10b981' },
                { label: 'Оферт', val: stats.offers, color: '#f59e0b' },
              ].map(s => (
                <div key={s.label}>
                  <p className="text-sm font-bold" style={{ color: s.color }}>{s.val}</p>
                  <p className="text-[10px] text-gray-500 leading-tight">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

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
              <p className="text-xs text-gray-400 truncate">admin@ovora.tj</p>
            </div>
          </div>
          <button
            onClick={() => { sessionStorage.removeItem(PIN_SESSION_KEY); sessionStorage.removeItem('ovora_admin_token'); window.location.reload(); }}
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
              <span className="font-semibold" style={{ color: '#1565d8' }}>
                {currentPage?.name || 'Обзор'}
              </span>
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 max-w-sm mx-auto lg:mx-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Поиск разделов..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm text-gray-700 placeholder-gray-400 rounded-xl outline-none transition-all"
                  style={{ background: '#f1f5f9', border: '1px solid #e2e8f0' }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#1565d866'; e.currentTarget.style.boxShadow = '0 0 0 3px #1565d815'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>
            </form>

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
              <button className="relative p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors">
                <Bell className="w-5 h-5" />
                {stats?.offers > 0 && (
                  <span
                    className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"
                    style={{ boxShadow: '0 0 6px #ef444480' }}
                  />
                )}
              </button>

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