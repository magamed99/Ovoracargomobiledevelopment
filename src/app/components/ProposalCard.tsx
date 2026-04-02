import { ClipboardCheck, X, FileText, Navigation, Users, Baby, Package } from 'lucide-react';

export type ProposalStatus = 'pending' | 'accepted' | 'rejected' | 'declined' | 'countered';

export interface Proposal {
  id: string;
  cargoType: string;
  weight: string;
  volume?: string;
  price: string;
  currency: string;
  from: string;
  to: string;
  date?: string;
  notes?: string;
  status: ProposalStatus;
  vehicleType?: string;
  /** tripId of the trip this proposal belongs to — used for seat reduction on accept */
  tripId?: string;
  /** email of the sender who submitted this proposal */
  senderEmail?: string;
}

interface ProposalCardProps {
  proposal: Proposal;
  isDriver?: boolean;
  isDark: boolean;
  onAccept?: () => void;
  onReject?: () => void;
  onCancel?: () => void;
  onCounter?: () => void;
  compact?: boolean;
}

export function ProposalCard({
  proposal,
  isDriver = false,
  isDark,
  onAccept,
  onReject,
  onCancel,
  onCounter,
  compact = false,
}: ProposalCardProps) {
  const isAccepted = proposal.status === 'accepted';
  const isDeclined = proposal.status === 'declined';
  const isRejected = proposal.status === 'rejected';
  const isCountered = proposal.status === 'countered';
  const isCancelled = isRejected || isDeclined || isCountered;
  const isPending = proposal.status === 'pending';

  // Parse weight string to extract adults, children, and cargo details
  const parseWeight = (weight: string) => {
    const adults = weight.match(/(\d+)\s*взр/)?.[1] || null;
    const children = weight.match(/(\d+)\s*дет/)?.[1] || null;
    const cargo = weight.match(/(\d+)\s*кг/)?.[1] || null;
    return { adults, children, cargo };
  };

  const { adults, children, cargo } = parseWeight(proposal.weight);
  const isPassengers = !!adults;
  const isCargo = !!cargo;

  const accentColor = isAccepted
    ? '#22c55e'
    : isRejected
    ? '#ef4444'
    : isDeclined
    ? '#f59e0b'
    : isCountered
    ? '#8b5cf6'
    : '#1978e5';

  const divider = isDark ? 'border-[#1e2d3a]' : 'border-[#e2e8f0]';
  const labelCls = isDark ? 'text-[#64748b]' : 'text-[#94a3b8]';
  const valueCls = isDark ? 'text-white' : 'text-[#0f172a]';
  const rowPy = compact ? 'py-1.5' : 'py-2';

  return (
    <div
      className={`w-full border-l-2 ${isDark ? 'bg-[#0d1822]' : 'bg-[#eef5ff]'}`}
      style={{ borderLeftColor: accentColor }}
    >
      {/* Header */}
      <div className={`flex items-center gap-2 px-3 ${rowPy} border-b ${divider}`}>
        {isAccepted ? (
          <ClipboardCheck className="w-3.5 h-3.5 shrink-0" style={{ color: accentColor }} />
        ) : isCancelled ? (
          <X className="w-3.5 h-3.5 shrink-0" style={{ color: accentColor }} />
        ) : (
          <FileText className="w-3.5 h-3.5 shrink-0" style={{ color: accentColor }} />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold" style={{ color: accentColor }}>
            {isAccepted
              ? '✅ Оферта принята'
              : isDeclined
              ? '🔄 Оферта отменена'
              : isRejected
              ? '❌ Оферта отклонена'
              : isCountered
              ? '⚡ Встречное предложение'
              : '📋 Оферта на перевозку'}
          </p>
          <p className={`text-[10px] ${labelCls}`}>
            {isAccepted
              ? 'Договор подтверждён'
              : isDeclined
              ? 'Вы отменили эту оферту'
              : isRejected
              ? 'Водитель отклонил оферту'
              : isCountered
              ? 'Предложены новые условия'
              : 'Ожидает подтверждения водителя'}
          </p>
        </div>
        {isPending && (
          <span className={`text-[10px] font-semibold shrink-0 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
            На рассмотрении
          </span>
        )}
      </div>

      {/* Route */}
      <div className={`flex items-center gap-2 px-3 ${rowPy} border-b ${divider}`}>
        <Navigation className="w-3 h-3 text-[#1978e5] shrink-0" />
        <p className={`text-xs font-bold ${valueCls}`}>
          {proposal.from}{' '}
          <span className="font-normal opacity-60">→</span>{' '}
          {proposal.to}
        </p>
      </div>

      {/* Capacity */}
      {(isPassengers || isCargo) && (
        <div className={`flex items-center gap-3 px-3 ${rowPy} border-b ${divider}`}>
          {isPassengers && adults && (
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#1978e5]" />
              <span className={`text-xs font-bold ${valueCls}`}>{adults}</span>
              <span className={`text-[10px] ${labelCls}`}>взр.</span>
            </div>
          )}
          {isPassengers && children && (
            <>
              <div className={`w-px h-3 ${divider} border-l`} />
              <div className="flex items-center gap-1.5">
                <Baby className="w-3.5 h-3.5 text-[#1978e5]" />
                <span className={`text-xs font-bold ${valueCls}`}>{children}</span>
                <span className={`text-[10px] ${labelCls}`}>дет.</span>
              </div>
            </>
          )}
          {isPassengers && isCargo && (
            <div className={`w-px h-3 ${divider} border-l`} />
          )}
          {isCargo && (
            <div className="flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-amber-500" />
              <span className={`text-xs font-bold ${valueCls}`}>{cargo} кг</span>
              <span className={`text-[10px] ${labelCls}`}>груз</span>
            </div>
          )}
        </div>
      )}

      {/* Detail rows */}
      {[
        { label: 'Тип груза', value: proposal.cargoType },
        { label: 'Транспорт', value: proposal.vehicleType || '—' },
        {
          label: 'Дата отправки',
          value: proposal.date
            ? new Date(proposal.date).toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
              })
            : '—',
        },
      ].map((f) => (
        <div
          key={f.label}
          className={`flex items-center justify-between px-3 ${rowPy} border-b ${divider}`}
        >
          <span className={`text-[10px] ${labelCls}`}>{f.label}</span>
          <span className={`text-xs font-bold ${valueCls}`}>{f.value}</span>
        </div>
      ))}

      {/* Price */}
      <div
        className={`flex items-center justify-between px-3 ${rowPy} ${
          proposal.notes ? `border-b ${divider}` : ''
        }`}
      >
        <span className={`text-[10px] ${labelCls}`}>Стоимость</span>
        <span className="text-sm font-extrabold" style={{ color: accentColor }}>
          {proposal.price} {proposal.currency}
        </span>
      </div>

      {/* Notes */}
      {proposal.notes && (
        <div className={`px-3 ${rowPy}`}>
          <span className={`text-[10px] ${labelCls}`}>Примечания · </span>
          <span className={`text-xs ${isDark ? 'text-[#cbd5e1]' : 'text-[#475569]'}`}>
            {proposal.notes}
          </span>
        </div>
      )}

      {/* Actions — driver only, pending */}
      {isDriver && isPending && onAccept && onReject && (
        <div className={`flex flex-col border-t ${divider}`}>
          <div className="flex w-full">
            <button
              onClick={onReject}
              className={`flex-1 py-2.5 text-sm font-bold border-r ${divider} transition-colors ${
                isDark
                  ? 'text-red-400 active:bg-red-500/10'
                  : 'text-red-500 active:bg-red-50'
              }`}
            >
              Отклонить
            </button>
            <button
              onClick={onAccept}
              className={`flex-1 py-2.5 text-sm font-bold transition-colors ${
                isDark
                  ? 'text-emerald-400 active:bg-emerald-500/10'
                  : 'text-emerald-600 active:bg-emerald-50'
              }`}
            >
              ✓ Принять
            </button>
          </div>
          {onCounter && (
            <button
              onClick={onCounter}
              className={`w-full py-2 border-t ${divider} text-xs font-bold transition-colors ${
                isDark
                  ? 'text-purple-400 active:bg-purple-500/10'
                  : 'text-purple-600 active:bg-purple-50'
              }`}
            >
              ⚡ Встречное предложение
            </button>
          )}
        </div>
      )}

      {/* Actions — sender only, pending */}
      {!isDriver && isPending && onCancel && (
        <div className={`border-t ${divider}`}>
          <button
            onClick={onCancel}
            className={`w-full py-2.5 text-sm font-bold transition-colors ${
              isDark
                ? 'text-amber-400 active:bg-amber-500/10'
                : 'text-amber-600 active:bg-amber-50'
            }`}
          >
            🔄 Отменить оферту
          </button>
        </div>
      )}
    </div>
  );
}