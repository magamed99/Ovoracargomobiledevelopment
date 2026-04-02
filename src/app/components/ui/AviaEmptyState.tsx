/**
 * AviaEmptyState — единый компонент пустого состояния для AVIA-модуля.
 */
import { type ReactNode } from 'react';

interface AviaEmptyStateProps {
  /** Эмодзи или иконка */
  icon?: ReactNode;
  /** Заголовок */
  title: string;
  /** Описание */
  description?: string;
  /** Кнопка действия */
  action?: ReactNode;
  /** Размер (compact — меньше отступов) */
  size?: 'default' | 'compact';
}

export function AviaEmptyState({
  icon = '✈️',
  title,
  description,
  action,
  size = 'default',
}: AviaEmptyStateProps) {
  const py = size === 'compact' ? 32 : 56;

  return (
    <div
      className="avia-fade-up"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: `${py}px 24px`,
        gap: 12,
      }}
    >
      {/* Icon / Emoji */}
      <div style={{
        width: 64,
        height: 64,
        borderRadius: 22,
        background: 'rgba(14,165,233,0.06)',
        border: '1px solid rgba(14,165,233,0.10)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 28,
        marginBottom: 4,
      }}>
        {icon}
      </div>

      {/* Title */}
      <p style={{
        fontSize: 15,
        fontWeight: 700,
        color: 'var(--avia-text)',
        margin: 0,
        lineHeight: 1.3,
      }}>
        {title}
      </p>

      {/* Description */}
      {description && (
        <p style={{
          fontSize: 13,
          color: 'var(--avia-text-muted)',
          margin: 0,
          lineHeight: 1.5,
          maxWidth: 280,
        }}>
          {description}
        </p>
      )}

      {/* Action */}
      {action && (
        <div style={{ marginTop: 8 }}>
          {action}
        </div>
      )}
    </div>
  );
}
