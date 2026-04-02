/**
 * AviaDesktopSidebar — постоянный сайдбар для AVIA-модуля (MD+).
 * Показывается только на десктопе, изолирован от CARGO-сайдбара.
 */
import { Link, useLocation } from 'react-router';
import {
  Plane, Package, Send, Repeat,
  Handshake, MessagesSquare, User,
  Bell, Settings, LogOut, ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { useAvia } from './AviaContext';

// ── Навигация AVIA ────────────────────────────────────────────────────────────

interface NavItem {
  name: string;
  href: string;
  icon: typeof Plane;
  badge?: 'deals' | 'chats' | 'notif' | null;
}

const ROLE_NAV: Record<string, NavItem[]> = {
  courier: [
    { name: 'Главная',    href: '/avia/dashboard', icon: Plane,          badge: null    },
    { name: 'Сделки',     href: '/avia/deals',     icon: Handshake,      badge: 'deals' },
    { name: 'Сообщения',  href: '/avia/messages',  icon: MessagesSquare, badge: 'chats' },
    { name: 'Профиль',    href: '/avia/profile',   icon: User,           badge: null    },
  ],
  sender: [
    { name: 'Главная',    href: '/avia/dashboard', icon: Plane,          badge: null    },
    { name: 'Сделки',     href: '/avia/deals',     icon: Handshake,      badge: 'deals' },
    { name: 'Сообщения',  href: '/avia/messages',  icon: MessagesSquare, badge: 'chats' },
    { name: 'Профиль',    href: '/avia/profile',   icon: User,           badge: null    },
  ],
  both: [
    { name: 'Главная',    href: '/avia/dashboard', icon: Plane,          badge: null    },
    { name: 'Сделки',     href: '/avia/deals',     icon: Handshake,      badge: 'deals' },
    { name: 'Сообщения',  href: '/avia/messages',  icon: MessagesSquare, badge: 'chats' },
    { name: 'Профиль',    href: '/avia/profile',   icon: User,           badge: null    },
  ],
};

const ROLE_META: Record<string, { label: string; color: string; grad: string; icon: typeof Plane }> = {
  courier: { label: 'Курьер',               color: '#0ea5e9', grad: 'linear-gradient(135deg,#1245b0,#2f8fe0)', icon: Package },
  sender:  { label: 'Отправитель',          color: '#a78bfa', grad: 'linear-gradient(135deg,#6d28d9,#a78bfa)', icon: Send    },
  both:    { label: 'Курьер + Отправитель', color: '#34d399', grad: 'linear-gradient(135deg,#047857,#34d399)', icon: Repeat  },
};

// ── Sidebar ───────────────────────────────────────────────────────────────────

export function AviaDesktopSidebar() {
  const location = useLocation();
  const { user, logout, unreadCount, chatUnreadCount } = useAvia();

  const role     = user?.role ?? 'courier';
  const nav      = ROLE_NAV[role] ?? ROLE_NAV.courier;
  const meta     = ROLE_META[role] ?? ROLE_META.courier;
  const RoleIcon = meta.icon;

  const isActive = (item: NavItem) =>
    item.href === '/avia/dashboard'
      ? location.pathname === '/avia/dashboard'
      : location.pathname.startsWith(item.href);

  const getBadge = (item: NavItem): number => {
    if (item.badge === 'notif') return unreadCount;
    if (item.badge === 'chats') return chatUnreadCount;
    return 0;
  };

  return (
    <aside
      className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 z-50"
      style={{
        width: 'var(--avia-sidebar-w)',
        background: 'var(--avia-sidebar-bg)',
        borderRight: '1px solid var(--avia-sidebar-border)',
        boxShadow: '4px 0 40px rgba(0,0,0,0.5), 1px 0 0 rgba(14,165,233,0.04)',
      }}
    >
      {/* Top ambient glow */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 180, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 50% 0%, rgba(14,165,233,0.08) 0%, transparent 70%)',
      }} />

      {/* ══ Logo ══ */}
      <div style={{ padding: '26px 18px 18px', display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
        <div style={{
          width: 42, height: 42, borderRadius: 14, flexShrink: 0,
          background: 'linear-gradient(135deg, #1245b0 0%, #1a6fd4 60%, #2f8fe0 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 0 1px rgba(47,143,224,0.25), 0 4px 20px rgba(26,71,200,0.45)',
        }}>
          <Plane size={19} style={{ color: '#fff' }} />
        </div>
        <div>
          <div style={{
            fontSize: 19, fontWeight: 900, color: '#e8f4ff',
            letterSpacing: '-0.6px', lineHeight: 1,
          }}>
            Ovora
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4, marginTop: 5,
          }}>
            <span style={{
              fontSize: 8, fontWeight: 700, color: '#2f8fe0',
              letterSpacing: '0.22em', textTransform: 'uppercase',
            }}>
              AVIA
            </span>
            <span style={{
              fontSize: 8, color: 'rgba(14,165,233,0.3)',
              letterSpacing: '0.1em', textTransform: 'uppercase',
            }}>
              MODULE
            </span>
          </div>
        </div>

        {/* AVIA badge */}
        <div style={{
          marginLeft: 'auto',
          padding: '3px 7px', borderRadius: 6,
          background: 'rgba(14,165,233,0.10)',
          border: '1px solid rgba(14,165,233,0.18)',
          fontSize: 9, fontWeight: 800, color: '#38bdf8',
          letterSpacing: '0.08em',
        }}>
          BETA
        </div>
      </div>

      {/* ── Divider ── */}
      <div style={{
        height: 1, margin: '0 18px 6px',
        background: 'linear-gradient(90deg, transparent, rgba(14,165,233,0.15), transparent)',
      }} />

      {/* ── Section label ── */}
      <div style={{
        fontSize: 9.5, fontWeight: 700, color: 'rgba(14,165,233,0.3)',
        letterSpacing: '0.14em', textTransform: 'uppercase',
        padding: '14px 22px 8px',
      }}>
        Навигация
      </div>

      {/* ══ Nav ══ */}
      <nav style={{ flex: 1, padding: '0 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {nav.map(item => {
          const active = isActive(item);
          const badge  = getBadge(item);
          return (
            <Link
              key={item.href}
              to={item.href}
              className={`avia-sb-link ${active ? 'avia-sb-active' : ''}`}
            >
              {/* Active left bar */}
              {active && (
                <span style={{
                  position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                  width: 3, height: 22, borderRadius: '0 4px 4px 0',
                  background: 'linear-gradient(180deg, #38bdf8, #0ea5e9)',
                  boxShadow: '2px 0 10px rgba(56,189,248,0.5)',
                }} />
              )}

              {/* Active bg radial glow */}
              {active && (
                <div style={{
                  position: 'absolute', inset: 0, pointerEvents: 'none',
                  background: 'radial-gradient(ellipse at 20% 50%, rgba(14,165,233,0.07) 0%, transparent 60%)',
                }} />
              )}

              {/* Icon box */}
              <span
                className={`avia-icon-box ${active ? 'avia-icon-box-active' : ''}`}
                style={{ position: 'relative' }}
              >
                <item.icon
                  size={15}
                  strokeWidth={active ? 2.3 : 1.8}
                  style={{ color: active ? '#38bdf8' : 'var(--avia-text-faint)', transition: 'all 0.17s ease' }}
                />
                {badge > 0 && (
                  <span style={{
                    position: 'absolute', top: -5, right: -5,
                    minWidth: 17, height: 17, borderRadius: 9,
                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                    border: '2px solid #05101e',
                    fontSize: 8.5, fontWeight: 900, color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '0 3px',
                    boxShadow: '0 2px 8px rgba(239,68,68,0.5)',
                  }}>
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </span>

              <span style={{ flex: 1, letterSpacing: active ? '-0.1px' : 0 }}>{item.name}</span>

              {active && (
                <ChevronRight size={13} style={{ opacity: 0.35, color: '#38bdf8' }} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Divider ── */}
      <div style={{
        height: 1, margin: '8px 18px',
        background: 'linear-gradient(90deg, transparent, rgba(14,165,233,0.10), transparent)',
      }} />

      {/* ── Utilities ── */}
      <div style={{ padding: '2px 10px 10px', display: 'flex', flexDirection: 'column', gap: 1 }}>
        {[
          { icon: Bell,     label: 'Уведомления', href: '/avia/dashboard', badge: unreadCount },
          { icon: Settings, label: 'Настройки',   href: '/avia/profile',   badge: 0 },
        ].map(({ icon: Icon, label, href, badge }) => (
          <Link
            key={href}
            to={href}
            className="avia-sb-link"
            style={{ fontSize: 13, color: 'var(--avia-text-faint)' }}
          >
            <span className="avia-icon-box" style={{ width: 30, height: 30, borderRadius: 9, position: 'relative' }}>
              <Icon size={13} />
              {badge > 0 && (
                <span style={{
                  position: 'absolute', top: -4, right: -4,
                  width: 14, height: 14, borderRadius: 7,
                  background: '#ef4444',
                  border: '1.5px solid #05101e',
                  fontSize: 8, fontWeight: 900, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </span>
            {label}
          </Link>
        ))}
      </div>

      {/* ── Divider ── */}
      <div style={{
        height: 1, margin: '0 18px',
        background: 'linear-gradient(90deg, transparent, rgba(14,165,233,0.08), transparent)',
      }} />

      {/* ══ Role Card ══ */}
      <div style={{ padding: '12px 14px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '11px 13px', borderRadius: 14,
          background: `linear-gradient(135deg, ${meta.color}12 0%, ${meta.color}06 100%)`,
          border: `1px solid ${meta.color}1a`,
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: 11, flexShrink: 0,
            background: meta.grad,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 4px 16px ${meta.color}40`,
          }}>
            <RoleIcon size={14} style={{ color: '#fff' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 9.5, color: `${meta.color}60`,
              fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
            }}>
              Роль
            </div>
            <div style={{
              fontSize: 12.5, fontWeight: 800, color: '#b8d8f5',
              lineHeight: 1.2, marginTop: 2,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {meta.label}
            </div>
          </div>
          {/* Online dot */}
          <span
            className="avia-pulse-online"
            style={{
              width: 8, height: 8, borderRadius: '50%', background: '#22c55e', flexShrink: 0,
            }}
          />
        </div>
      </div>

      {/* ── Passport status ── */}
      {user?.passportVerified && (
        <div style={{ padding: '0 14px 8px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '7px 11px', borderRadius: 10,
            background: 'rgba(52,211,153,0.06)',
            border: '1px solid rgba(52,211,153,0.12)',
          }}>
            <ShieldCheck size={12} style={{ color: '#34d399', flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: '#34d399', fontWeight: 600 }}>
              Паспорт верифицирован
            </span>
          </div>
        </div>
      )}

      {/* ── Logout ── */}
      <div style={{ padding: '4px 14px 24px' }}>
        <button
          onClick={logout}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 9,
            padding: '9px 12px', borderRadius: 11, border: 'none', cursor: 'pointer',
            background: 'rgba(248,113,113,0.05)',
            color: 'rgba(248,113,113,0.5)',
            fontSize: 12.5, fontWeight: 600,
            transition: 'background 0.15s ease, color 0.15s ease',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(248,113,113,0.10)';
            (e.currentTarget as HTMLButtonElement).style.color = '#f87171';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(248,113,113,0.05)';
            (e.currentTarget as HTMLButtonElement).style.color = 'rgba(248,113,113,0.5)';
          }}
        >
          <LogOut size={13} />
          Выйти из AVIA
        </button>
      </div>
    </aside>
  );
}