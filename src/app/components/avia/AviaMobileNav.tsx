/**
 * AviaMobileNav — нижняя навигация для AVIA-модуля (только mobile).
 * Anchored bottom bar, safe-area aware, glassmorphism.
 */
import { Link, useLocation } from 'react-router';
import { Plane, Handshake, MessagesSquare, User } from 'lucide-react';
import { useAvia } from './AviaContext';

interface NavTab {
  name: string;
  href: string;
  icon: typeof Plane;
  badge?: 'deals' | 'chats' | 'notif' | null;
}

const ROLE_TABS: Record<string, NavTab[]> = {
  courier: [
    { name: 'Главная',  href: '/avia/dashboard', icon: Plane,          badge: null    },
    { name: 'Сделки',   href: '/avia/deals',     icon: Handshake,      badge: 'deals' },
    { name: 'Чаты',     href: '/avia/messages',  icon: MessagesSquare, badge: 'chats' },
    { name: 'Профиль',  href: '/avia/profile',   icon: User,           badge: null    },
  ],
  sender: [
    { name: 'Главная',  href: '/avia/dashboard', icon: Plane,          badge: null    },
    { name: 'Сделки',   href: '/avia/deals',     icon: Handshake,      badge: 'deals' },
    { name: 'Чаты',     href: '/avia/messages',  icon: MessagesSquare, badge: 'chats' },
    { name: 'Профиль',  href: '/avia/profile',   icon: User,           badge: null    },
  ],
  both: [
    { name: 'Главная',  href: '/avia/dashboard', icon: Plane,          badge: null    },
    { name: 'Сделки',   href: '/avia/deals',     icon: Handshake,      badge: 'deals' },
    { name: 'Чаты',     href: '/avia/messages',  icon: MessagesSquare, badge: 'chats' },
    { name: 'Профиль',  href: '/avia/profile',   icon: User,           badge: null    },
  ],
};

export function AviaMobileNav() {
  const location = useLocation();
  const { user, unreadCount, chatUnreadCount } = useAvia();

  const role = user?.role ?? 'courier';
  const tabs = ROLE_TABS[role] ?? ROLE_TABS.courier;

  const isActive = (tab: NavTab) =>
    tab.href === '/avia/dashboard'
      ? location.pathname === '/avia/dashboard'
      : location.pathname.startsWith(tab.href);

  const getBadge = (tab: NavTab): number => {
    if (tab.badge === 'notif') return unreadCount;
    if (tab.badge === 'chats') return chatUnreadCount;
    return 0;
  };

  return (
    <nav
      className="md:hidden avia-mobile-nav"
      style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}
    >
      {tabs.map(tab => {
        const active = isActive(tab);
        const badge  = getBadge(tab);
        return (
          <Link
            key={tab.href}
            to={tab.href}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              textDecoration: 'none',
              paddingTop: 8,
              position: 'relative',
            }}
          >
            {/* Active top indicator */}
            {active && (
              <span
                className="avia-dot-in"
                style={{
                  position: 'absolute', top: 0, left: '50%',
                  transform: 'translateX(-50%)',
                  width: 24, height: 2.5, borderRadius: '0 0 4px 4px',
                  background: 'linear-gradient(90deg, #38bdf8, #0ea5e9)',
                  boxShadow: '0 2px 8px rgba(56,189,248,0.5)',
                }}
              />
            )}
            {/* Icon container */}
            <div style={{ position: 'relative' }}>
              <div style={{
                width: 38, height: 38, borderRadius: 13,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: active ? 'rgba(14,165,233,0.14)' : 'transparent',
                border: active ? '1px solid rgba(14,165,233,0.20)' : '1px solid transparent',
                transition: 'background 0.2s ease, border-color 0.2s ease',
              }}>
                <tab.icon
                  size={18}
                  strokeWidth={active ? 2.3 : 1.7}
                  style={{ color: active ? '#38bdf8' : 'var(--avia-text-faint)', transition: 'color 0.2s ease' }}
                />
              </div>
              {/* Badge */}
              {badge > 0 && (
                <span style={{
                  position: 'absolute', top: -3, right: -3,
                  minWidth: 16, height: 16, borderRadius: 8,
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  border: '1.5px solid #060e1a',
                  fontSize: 8.5, fontWeight: 900, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 3px',
                  boxShadow: '0 2px 6px rgba(239,68,68,0.5)',
                }}>
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </div>
            {/* Label */}
            <span style={{
              fontSize: 10,
              fontWeight: active ? 700 : 500,
              color: active ? '#38bdf8' : 'var(--avia-text-faint)',
              letterSpacing: active ? '-0.1px' : 0,
              transition: 'color 0.2s ease',
            }}>
              {tab.name}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
