/**
 * AdminPageHeader — единый заголовок для всех страниц админки.
 * Использование:
 *   <AdminPageHeader
 *     title="Пользователи"
 *     subtitle="Управление аккаунтами"
 *     icon={Users}
 *     gradient="linear-gradient(135deg,#7c3aed,#8b5cf6)"
 *     actions={<button>...</button>}
 *     stats={[{ label: 'Всего', value: 42, color: '#3b82f6' }]}
 *   />
 */

import type { LucideIcon } from 'lucide-react';

interface Stat {
  label: string;
  value: number | string;
  color?: string;
  sub?: string;
}

interface Props {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  gradient?: string;
  actions?: React.ReactNode;
  stats?: Stat[];
  /** Цвет фона иконки в pill-формате (hex без прозрачности) */
  accent?: string;
}

export function AdminPageHeader({
  title, subtitle, icon: Icon, gradient, actions, stats, accent = '#1565d8',
}: Props) {
  return (
    <div
      className="rounded-2xl px-6 py-5 mb-6"
      style={{
        background: gradient || `linear-gradient(135deg, ${accent} 0%, ${accent}cc 100%)`,
        boxShadow: `0 8px 32px ${accent}40`,
      }}
    >
      <div className="flex items-start justify-between gap-4 flex-wrap">
        {/* Left: icon + title */}
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: '#ffffff25' }}
          >
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white leading-tight">{title}</h1>
            {subtitle && (
              <p className="text-sm mt-0.5" style={{ color: '#ffffff99' }}>{subtitle}</p>
            )}
          </div>
        </div>

        {/* Right: actions */}
        {actions && (
          <div className="flex items-center gap-2 flex-wrap">{actions}</div>
        )}
      </div>

      {/* Stats row */}
      {stats && stats.length > 0 && (
        <div className="flex items-center gap-3 mt-4 flex-wrap">
          {stats.map((s, i) => (
            <div
              key={i}
              className="px-4 py-2 rounded-xl flex items-center gap-2"
              style={{ background: '#ffffff18' }}
            >
              <span className="text-lg font-bold text-white">{s.value}</span>
              <span className="text-sm" style={{ color: '#ffffffcc' }}>{s.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Белая кнопка действия для заголовка */
export function HeaderBtn({
  onClick, icon: Icon, children, variant = 'white',
}: {
  onClick?: () => void;
  icon?: LucideIcon;
  children: React.ReactNode;
  variant?: 'white' | 'ghost';
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all"
      style={
        variant === 'white'
          ? { background: '#ffffff', color: '#1e40af' }
          : { background: '#ffffff25', color: '#ffffff' }
      }
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  );
}

/** Chip-фильтры вместо select */
export function FilterChips<T extends string>({
  value, onChange, options, className = '',
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; count?: number }[];
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-1.5 flex-wrap ${className}`}>
      {options.map(opt => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all"
            style={
              active
                ? { background: '#1565d8', color: '#ffffff' }
                : { background: '#f1f5f9', color: '#64748b' }
            }
          >
            {opt.label}
            {opt.count != null && (
              <span
                className="text-xs font-bold px-1.5 py-0.5 rounded-lg min-w-[20px] text-center"
                style={{
                  background: active ? '#ffffff30' : '#e2e8f0',
                  color: active ? '#ffffff' : '#475569',
                }}
              >
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Skeleton loader для списков */
export function SkeletonList({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-xl animate-pulse" style={{ background: '#f8fafc' }}>
          <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 bg-gray-200 rounded-lg w-1/3" />
            <div className="h-3 bg-gray-100 rounded-lg w-1/2" />
          </div>
          <div className="h-6 w-20 bg-gray-200 rounded-lg" />
        </div>
      ))}
    </div>
  );
}
