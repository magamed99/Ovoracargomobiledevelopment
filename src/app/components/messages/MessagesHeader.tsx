import { ArrowLeft, MessageSquare, RefreshCw } from 'lucide-react';

interface MobileHeaderProps {
  variant: 'mobile';
  totalUnread: number;
  subtitle: string;
  syncing: boolean;
  onBack: () => void;
  onSync: () => void;
}

interface DesktopHeaderProps {
  variant: 'desktop';
  totalUnread: number;
  subtitle: string;
  syncing: boolean;
  onSync: () => void;
  onBack?: never;
}

type MessagesHeaderProps = MobileHeaderProps | DesktopHeaderProps;

export function MessagesHeader(props: MessagesHeaderProps) {
  const { variant, totalUnread, subtitle, syncing, onSync } = props;

  if (variant === 'mobile') {
    return (
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0" style={{ background: 'linear-gradient(145deg, #0f2744 0%, #0e1621 60%)' }} />
          <div
            className="absolute -top-12 sm:-top-16 -right-12 sm:-right-16 w-40 sm:w-52 h-40 sm:h-52 rounded-full"
            style={{ background: 'radial-gradient(circle, #1d4ed8 0%, transparent 70%)', opacity: 0.20 }}
          />
        </div>
        <div
          className="relative flex items-center gap-2 sm:gap-3 px-3 sm:px-4"
          style={{ paddingTop: 'max(52px, env(safe-area-inset-top, 52px))', paddingBottom: 12 }}
        >
          <button
            onClick={props.onBack}
            className="w-9 sm:w-10 h-9 sm:h-10 rounded-2xl flex items-center justify-center bg-white/[0.07] border border-white/10 text-white active:scale-90 transition-all shrink-0"
          >
            <ArrowLeft className="w-4.5 sm:w-5 h-4.5 sm:h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="text-[20px] sm:text-[22px] font-black text-white leading-tight">Сообщения</h1>
              {totalUnread > 0 && (
                <div className="min-w-[20px] sm:min-w-[22px] h-[20px] sm:h-[22px] px-1.5 rounded-full bg-[#5ba3f5] flex items-center justify-center shrink-0">
                  <span className="text-[10px] sm:text-[11px] font-black text-white leading-none">
                    {totalUnread > 99 ? '99+' : totalUnread}
                  </span>
                </div>
              )}
            </div>
            <p className="text-[10px] sm:text-[11px] text-[#607080] mt-0.5 font-semibold">{subtitle}</p>
          </div>
          <button
            onClick={onSync}
            className="w-9 sm:w-10 h-9 sm:h-10 rounded-2xl flex items-center justify-center bg-white/[0.07] border border-white/10 text-[#5ba3f5] active:scale-90 transition-all shrink-0"
          >
            <RefreshCw className={`w-4 sm:w-4.5 h-4 sm:h-4.5 ${syncing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
    );
  }

  // Desktop
  return (
    <div className="shrink-0 border-b border-white/[0.06] px-6 lg:px-10 py-4" style={{ background: '#0a1520' }}>
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #1d4ed8, #5ba3f5)', boxShadow: '0 4px 16px #1d4ed850' }}
          >
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[20px] font-black text-white leading-tight">Сообщения</h1>
              {totalUnread > 0 && (
                <span
                  className="min-w-[22px] h-[22px] px-1.5 rounded-full flex items-center justify-center text-[10px] font-black text-white"
                  style={{ background: '#5ba3f5', boxShadow: '0 0 10px #5ba3f540' }}
                >
                  {totalUnread > 99 ? '99+' : totalUnread}
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#4a6278] font-semibold">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {syncing && (
            <span className="text-[11px] text-[#4a6278] font-semibold flex items-center gap-1.5">
              <RefreshCw className="w-3 h-3 animate-spin" /> Обновление…
            </span>
          )}
          <button
            onClick={onSync}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-semibold transition-all hover:text-white disabled:opacity-50"
            style={{ background: '#ffffff08', border: '1px solid #ffffff10', color: '#607080' }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            Обновить
          </button>
        </div>
      </div>
    </div>
  );
}
