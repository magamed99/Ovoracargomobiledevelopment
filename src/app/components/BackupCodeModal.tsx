import { useState, useCallback } from 'react';
import {
  ShieldCheck, Copy, Download, KeyRound, AlertTriangle,
  CheckCircle2, Eye, EyeOff, X
} from 'lucide-react';

interface BackupCodeModalProps {
  code: string;           // 64 hex chars
  email: string;
  isDark: boolean;
  onAcknowledged: () => void;  // called when user confirms they saved the code
}

/**
 * Formats 64 hex chars into 4 groups of 16, separated by dashes.
 * e.g. a1b2c3d4e5f6a7b8-c9d0e1f2a3b4c5d6-e7f8a9b0c1d2e3f4-a5b6c7d8e9f0a1b2
 */
function formatCode(raw: string): string {
  return [
    raw.slice(0, 16),
    raw.slice(16, 32),
    raw.slice(32, 48),
    raw.slice(48, 64),
  ].join('-');
}

export function BackupCodeModal({ code, email, isDark, onAcknowledged }: BackupCodeModalProps) {
  const [copied, setCopied] = useState(false);
  const [revealed, setRevealed] = useState(true);
  const [acknowledged, setAcknowledged] = useState(false);

  const formatted = formatCode(code);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(formatted);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      const el = document.createElement('textarea');
      el.value = formatted;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }, [formatted]);

  const handleDownload = useCallback(() => {
    const content = [
      '═══════════════════════════════════════════════',
      '        OVORA CARGO — РЕЗЕРВНЫЙ КОД ДОСТУПА',
      '═══════════════════════════════════════════════',
      '',
      `Email аккаунта : ${email}`,
      `Дата создания  : ${new Date().toLocaleString('ru-RU')}`,
      `Алгоритм хеша  : SHA-256 (хранится в базе данных)`,
      `Энтропия       : 256 бит (32 байта crypto.getRandomValues)`,
      '',
      '── РЕЗЕРВНЫЙ КОД ────────────────────────────────',
      '',
      `  ${formatted}`,
      '',
      '─────────────────────────────────────────────────',
      '',
      '⚠️  ВАЖНЫЕ ПРАВИЛА БЕЗОПАСНОСТИ:',
      '',
      '  1. Храните этот файл в НАДЁЖНОМ и ЗАЩИЩЁННОМ месте',
      '  2. НЕ передавайте код третьим лицам',
      '  3. Этот код позволяет войти в аккаунт без OTP',
      '  4. Код ОДНОРАЗОВЫЙ — после использования создайте новый',
      '  5. Удалите этот файл после сохранения кода в менеджере паролей',
      '',
      '═══════════════════════════════════════════════',
      '  Ovora Cargo Security · ovora.cargo',
      '═══════════════════════════════════════════════',
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ovora-backup-${email.split('@')[0]}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [formatted, email]);

  const dark = isDark;

  return (
    /* Backdrop */
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      {/* Modal */}
      <div
        className={`relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden ${
          dark ? 'bg-[#0E1621] border border-[#253840]' : 'bg-[#0E1621] border border-[#253840]'
        }`}
      >
        {/* Top danger stripe */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 via-orange-400 to-red-400" />

        <div className="p-6 flex flex-col gap-5">

          {/* Header */}
          <div className="flex items-start gap-4">
            <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
              dark ? 'bg-amber-500/15' : 'bg-amber-50'
            }`}>
              <KeyRound className="w-6 h-6 text-amber-500" />
            </div>
            <div className="flex-1">
              <h2 className={`text-lg font-extrabold leading-tight ${dark ? 'text-white' : 'text-[#0f172a]'}`}>
                Резервный код восстановления
              </h2>
              <p className={`text-xs mt-1 ${dark ? 'text-[#64748b]' : 'text-[#94a3b8]'}`}>
                256-бит · SHA-256 защита · Одноразовый
              </p>
            </div>
            {/* Security badge */}
            <div className={`shrink-0 flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold ${
              dark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
            }`}>
              <ShieldCheck className="w-3 h-3" />
              ЗАШИФРОВАН
            </div>
          </div>

          {/* Warning banner */}
          <div className={`rounded-xl p-3.5 border flex gap-3 items-start ${
            dark
              ? 'bg-red-900/20 border-red-500/30'
              : 'bg-red-50 border-red-200'
          }`}>
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className={`text-xs font-bold mb-0.5 ${dark ? 'text-red-400' : 'text-red-700'}`}>
                Сохраните прямо сейчас!
              </p>
              <p className={`text-[11px] leading-relaxed ${dark ? 'text-red-600' : 'text-red-500'}`}>
                Этот код отображается <strong>только один раз</strong> и нигде не хранится в базе данных в открытом виде. После закрытия окна восстановить его невозможно.
              </p>
            </div>
          </div>

          {/* Code block */}
          <div className={`rounded-xl border-2 overflow-hidden ${
            dark ? 'border-[#253840] bg-[#0d1117]' : 'border-[#e2e8f0] bg-[#f8fafc]'
          }`}>
            {/* Code toolbar */}
            <div className={`flex items-center justify-between px-4 py-2 border-b ${
              dark ? 'border-[#253840] bg-[#151f2a]' : 'border-[#e2e8f0] bg-[#f1f5f9]'
            }`}>
              <span className={`text-[10px] font-mono font-bold tracking-wider ${
                dark ? 'text-[#475569]' : 'text-[#94a3b8]'
              }`}>
                RECOVERY KEY · 64 HEX CHARS · 256 BIT
              </span>
              <button
                onClick={() => setRevealed(r => !r)}
                className={`flex items-center gap-1 text-[10px] font-semibold transition-colors ${
                  dark ? 'text-[#475569] hover:text-[#94a3b8]' : 'text-[#94a3b8] hover:text-[#64748b]'
                }`}
              >
                {revealed
                  ? <><EyeOff className="w-3 h-3" /> Скрыть</>
                  : <><Eye className="w-3 h-3" /> Показать</>
                }
              </button>
            </div>

            {/* Code display */}
            <div className="px-4 py-5">
              {revealed ? (
                <p className={`font-mono text-sm font-bold tracking-wider break-all leading-relaxed select-all ${
                  dark ? 'text-amber-400' : 'text-amber-600'
                }`}>
                  {/* Show in 4 groups of 16, each on its own line for readability */}
                  {[0, 1, 2, 3].map(i => (
                    <span key={i} className="block">
                      <span className={`text-[10px] mr-2 ${dark ? 'text-[#334155]' : 'text-[#cbd5e1]'}`}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      {formatted.split('-')[i]}
                    </span>
                  ))}
                </p>
              ) : (
                <p className={`font-mono text-sm tracking-[0.4em] ${
                  dark ? 'text-[#334155]' : 'text-[#cbd5e1]'
                }`}>
                  {'●●●●●●●● ●●●●●●●● ●●●●●●●● ●●●●●●●●'}
                </p>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleCopy}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 font-semibold text-sm transition-all active:scale-95 ${
                copied
                  ? dark
                    ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                    : 'border-emerald-400 bg-emerald-50 text-emerald-600'
                  : dark
                    ? 'border-[#253840] bg-[#1a2c32] text-[#cbd5e1] hover:border-[#1978e5]/50 hover:text-white'
                    : 'border-[#e2e8f0] bg-white text-[#475569] hover:border-[#1978e5]/40 hover:text-[#0f172a]'
              }`}
            >
              {copied
                ? <><CheckCircle2 className="w-4 h-4" /> Скопировано!</>
                : <><Copy className="w-4 h-4" /> Копировать</>
              }
            </button>

            <button
              onClick={handleDownload}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 font-semibold text-sm transition-all active:scale-95 ${
                dark
                  ? 'border-[#253840] bg-[#1a2c32] text-[#cbd5e1] hover:border-[#1978e5]/50 hover:text-white'
                  : 'border-[#e2e8f0] bg-white text-[#475569] hover:border-[#1978e5]/40 hover:text-[#0f172a]'
              }`}
            >
              <Download className="w-4 h-4" />
              Скачать .txt
            </button>
          </div>

          {/* Info cards */}
          <div className={`rounded-xl p-3.5 border text-[11px] leading-relaxed ${
            dark ? 'bg-[#1a2c32] border-[#253840] text-[#64748b]' : 'bg-[#f8fafc] border-[#e2e8f0] text-[#94a3b8]'
          }`}>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              <div>🔐 <strong className={dark ? 'text-[#94a3b8]' : 'text-[#64748b]'}>В базе:</strong> только SHA-256 хеш</div>
              <div>🎲 <strong className={dark ? 'text-[#94a3b8]' : 'text-[#64748b]'}>Энтропия:</strong> 256 бит</div>
              <div>🔑 <strong className={dark ? 'text-[#94a3b8]' : 'text-[#64748b]'}>Формат:</strong> 64 hex символа</div>
              <div>☝️ <strong className={dark ? 'text-[#94a3b8]' : 'text-[#64748b]'}>Применение:</strong> одноразовый</div>
            </div>
          </div>

          {/* Acknowledgment */}
          <label className={`flex items-start gap-3 cursor-pointer p-3.5 rounded-xl border transition-all ${
            acknowledged
              ? dark
                ? 'border-emerald-500/40 bg-emerald-500/10'
                : 'border-emerald-400 bg-emerald-50'
              : dark
                ? 'border-[#253840] bg-[#1a2c32] hover:border-[#334155]'
                : 'border-[#e2e8f0] bg-white hover:border-[#cbd5e1]'
          }`}>
            <div className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
              acknowledged
                ? 'bg-emerald-500 border-emerald-500'
                : dark ? 'border-[#334155]' : 'border-[#cbd5e1]'
            }`}>
              {acknowledged && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
            </div>
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={e => setAcknowledged(e.target.checked)}
              className="sr-only"
            />
            <p className={`text-xs leading-relaxed ${
              acknowledged
                ? dark ? 'text-emerald-400' : 'text-emerald-700'
                : dark ? 'text-[#64748b]' : 'text-[#94a3b8]'
            }`}>
              <strong>Я сохранил резервный код</strong> в надёжном месте (менеджер паролей, защищённый файл или распечатка). Понимаю, что после закрытия этого окна код нельзя будет просмотреть снова.
            </p>
          </label>

          {/* Continue button */}
          <button
            onClick={onAcknowledged}
            disabled={!acknowledged}
            className={`w-full h-14 font-bold text-sm rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
              acknowledged
                ? 'bg-[#1978e5] hover:bg-[#1565c0] text-white shadow-lg shadow-[#1978e5]/30'
                : dark
                  ? 'bg-[#1a2c32] text-[#334155] cursor-not-allowed'
                  : 'bg-[#f1f5f9] text-[#cbd5e1] cursor-not-allowed'
            }`}
          >
            {acknowledged
              ? <><ShieldCheck className="w-5 h-5" /> Продолжить</>
              : 'Подтвердите, что сохранили код'
            }
          </button>

        </div>
      </div>
    </div>
  );
}