/**
 * AviaStatusBadge — бейдж статуса для AVIA-карточек.
 * Поддерживает: active, closed, completed, pending, my
 */

type StatusType = 'active' | 'closed' | 'completed' | 'pending' | 'my';

const STATUS_CONFIG: Record<StatusType, { label: string; chipClass: string; dot: string }> = {
  active:    { label: 'Активный',   chipClass: 'avia-chip avia-chip-green',  dot: '#34d399' },
  closed:    { label: 'Закрыт',     chipClass: 'avia-chip avia-chip-red',    dot: '#f87171' },
  completed: { label: 'Завершён',   chipClass: 'avia-chip avia-chip-blue',   dot: '#38bdf8' },
  pending:   { label: 'Ожидание',   chipClass: 'avia-chip avia-chip-amber',  dot: '#fbbf24' },
  my:        { label: 'Мой',        chipClass: 'avia-chip avia-chip-purple', dot: '#a78bfa' },
};

interface AviaStatusBadgeProps {
  status: StatusType | string;
  /** Показывать точку-индикатор */
  dot?: boolean;
  /** Свой текст вместо стандартного */
  label?: string;
}

export function AviaStatusBadge({ status, dot = true, label }: AviaStatusBadgeProps) {
  const cfg = STATUS_CONFIG[status as StatusType] ?? STATUS_CONFIG.active;
  const text = label ?? cfg.label;

  return (
    <span className={cfg.chipClass}>
      {dot && (
        <span style={{
          width: 5,
          height: 5,
          borderRadius: '50%',
          background: cfg.dot,
          display: 'inline-block',
          flexShrink: 0,
        }} />
      )}
      {text}
    </span>
  );
}
