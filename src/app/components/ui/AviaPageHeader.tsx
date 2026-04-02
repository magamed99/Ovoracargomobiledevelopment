/**
 * AviaPageHeader — стандартный заголовок страницы для AVIA-модуля.
 * Используется на всех AVIA-страницах для единообразия.
 */
import { type ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router';

interface AviaPageHeaderProps {
  /** Заголовок страницы */
  title: string;
  /** Подзаголовок (опционально) */
  subtitle?: string;
  /** Показывать кнопку «Назад» */
  back?: boolean;
  /** URL для кнопки «Назад» (если не указан — history.back()) */
  backTo?: string;
  /** Правый слот (кнопки действий) */
  actions?: ReactNode;
  /** Нижний слот (табы, поиск) */
  bottom?: ReactNode;
  /** Дополнительные CSS-классы обёртки */
  className?: string;
}

export function AviaPageHeader({
  title,
  subtitle,
  back,
  backTo,
  actions,
  bottom,
  className = '',
}: AviaPageHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backTo) navigate(backTo);
    else navigate(-1);
  };

  return (
    <header
      className={className}
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 30,
        background: 'linear-gradient(180deg, rgba(6,14,26,0.98) 80%, transparent 100%)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: bottom ? 'none' : '1px solid rgba(14,165,233,0.07)',
        paddingTop: 'max(12px, env(safe-area-inset-top))',
      }}
    >
      {/* ── Main row ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '0 16px 12px',
        minHeight: 52,
      }}>
        {/* Back button */}
        {back && (
          <button
            onClick={handleBack}
            style={{
              width: 36, height: 36, borderRadius: 11, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
              color: 'var(--avia-accent-dim)',
              cursor: 'pointer',
              transition: 'background 0.15s ease',
            }}
          >
            <ChevronLeft size={18} strokeWidth={2.2} />
          </button>
        )}

        {/* Title + Subtitle */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{
            fontSize: 17,
            fontWeight: 800,
            color: 'var(--avia-text)',
            letterSpacing: '-0.4px',
            lineHeight: 1.2,
            margin: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{
              fontSize: 11.5,
              color: 'var(--avia-text-muted)',
              marginTop: 2,
              lineHeight: 1,
            }}>
              {subtitle}
            </p>
          )}
        </div>

        {/* Right actions */}
        {actions && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {actions}
          </div>
        )}
      </div>

      {/* ── Bottom slot (tabs / search) ── */}
      {bottom && (
        <div style={{ borderBottom: '1px solid rgba(14,165,233,0.07)' }}>
          {bottom}
        </div>
      )}
    </header>
  );
}
