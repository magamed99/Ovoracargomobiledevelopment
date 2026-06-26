import React, { useState, useEffect, RefObject } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, Search, ChevronRight, Clock, Database, Bell, TrendingUp } from 'lucide-react';
import { PLATFORM_THEME, Platform } from './platformTheme';

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

interface SearchHit { key: string; icon: any; label: string; sublabel?: string }
interface NotifItem { href: string; label: string; icon: any; bg: string; color: string }

export function AdminHeader({
  onMenuClick,
  currentPageName,
  currentPlatform,
  searchRef,
  searchQuery,
  setSearchQuery,
  searchOpen,
  setSearchOpen,
  searchResults,
  searchHits,
  onSearchSubmit,
  onGoToHit,
  today,
  stats,
  notifRef,
  notifOpen,
  setNotifOpen,
  notifItems,
  notifTotal,
  onNotifNavigate,
}: {
  onMenuClick: () => void;
  currentPageName: string;
  currentPlatform: Platform | undefined;
  searchRef: RefObject<HTMLDivElement | null>;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  searchResults: any;
  searchHits: SearchHit[];
  onSearchSubmit: (e: React.FormEvent) => void;
  onGoToHit: (hit: any) => void;
  today: string;
  stats: any;
  notifRef: RefObject<HTMLDivElement | null>;
  notifOpen: boolean;
  setNotifOpen: (v: boolean | ((prev: boolean) => boolean)) => void;
  notifItems: NotifItem[];
  notifTotal: number;
  onNotifNavigate: (href: string) => void;
}) {
  return (
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
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Breadcrumb */}
        <div className="hidden lg:flex items-center gap-2 text-sm">
          <span className="text-gray-400 font-medium">Ovora Admin</span>
          <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
          <span className="font-semibold" style={{ color: currentPlatform ? PLATFORM_THEME[currentPlatform].accent : '#1565d8' }}>
            {currentPageName}
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
          <form onSubmit={onSearchSubmit}>
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
                        onClick={() => onGoToHit(hit)}
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
                          onClick={() => { setNotifOpen(false); onNotifNavigate(item.href); }}
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
                  <button
                    onClick={() => { setNotifOpen(false); onNotifNavigate('/admin/notifications'); }}
                    className="w-full px-4 py-2.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors text-center"
                    style={{ borderTop: '1px solid #f1f5f9' }}
                  >
                    Все уведомления →
                  </button>
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
  );
}
