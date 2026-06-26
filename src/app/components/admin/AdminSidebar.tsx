import { Link } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Truck, X, ChevronRight, ShieldOff, LogOut } from 'lucide-react';
import { PLATFORM_THEME, GROUP_PLATFORM } from './platformTheme';

type AdminRole = 'super-admin' | 'cargo-admin' | 'avia-admin';

interface NavItem { name: string; href: string; icon: any; exact?: boolean }
interface NavGroup { label: string; items: NavItem[] }

export function AdminSidebar({
  navGroups,
  isActive,
  sidebarOpen,
  setSidebarOpen,
  adminRole,
  onRevokeAll,
  onLogout,
}: {
  navGroups: NavGroup[];
  isActive: (item: NavItem) => boolean;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  adminRole: AdminRole;
  onRevokeAll: () => void;
  onLogout: () => void;
}) {
  return (
    <>
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
          {navGroups.map(group => {
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
              onClick={onRevokeAll}
              className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium rounded-xl transition-colors text-gray-400 hover:text-orange-500 hover:bg-orange-50"
            >
              <ShieldOff className="w-3.5 h-3.5" />
              Завершить все сессии
            </button>
          )}
          <button
            onClick={onLogout}
            className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium rounded-xl transition-colors text-gray-400 hover:text-red-500 hover:bg-red-50"
          >
            <LogOut className="w-3.5 h-3.5" />
            Выйти из панели
          </button>
        </div>
      </aside>
    </>
  );
}
