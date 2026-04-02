// ── AviaConfirmSheet — тёмный bottom-sheet вместо window.confirm() ────────────
// Использует motion/react для анимации slide-up. Изолирован в AVIA-модуле.

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Trash2, X, XCircle, Flag, CheckCircle2 } from 'lucide-react';

// ── Типы ─────────────────────────────────────────────────────────────────────

type ConfirmVariant = 'danger' | 'warning' | 'complete' | 'neutral';

export interface AviaConfirmSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
}

// ── Palette ───────────────────────────────────────────────────────────────────

const VARIANT: Record<ConfirmVariant, {
  icon: typeof Trash2;
  iconBg: string;
  iconColor: string;
  btnBg: string;
  btnColor: string;
  btnBorder: string;
}> = {
  danger: {
    icon: Trash2,
    iconBg: 'rgba(239,68,68,0.12)',
    iconColor: '#f87171',
    btnBg: 'linear-gradient(135deg, #b91c1c, #ef4444)',
    btnColor: '#fff',
    btnBorder: 'none',
  },
  warning: {
    icon: XCircle,
    iconBg: 'rgba(245,158,11,0.12)',
    iconColor: '#fbbf24',
    btnBg: 'linear-gradient(135deg, #b45309, #f59e0b)',
    btnColor: '#fff',
    btnBorder: 'none',
  },
  complete: {
    icon: Flag,
    iconBg: 'rgba(52,211,153,0.12)',
    iconColor: '#34d399',
    btnBg: 'linear-gradient(135deg, #065f46, #34d399)',
    btnColor: '#fff',
    btnBorder: 'none',
  },
  neutral: {
    icon: AlertTriangle,
    iconBg: 'rgba(14,165,233,0.12)',
    iconColor: '#38bdf8',
    btnBg: 'linear-gradient(135deg, #0369a1, #0ea5e9)',
    btnColor: '#fff',
    btnBorder: 'none',
  },
};

// ── Компонент ─────────────────────────────────────────────────────────────────

export function AviaConfirmSheet({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Подтвердить',
  cancelLabel  = 'Отмена',
  variant      = 'neutral',
}: AviaConfirmSheetProps) {
  const V = VARIANT[variant];
  const Icon = V.icon;

  // Закрытие по Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Блокируем скролл
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* ── Backdrop ─────────────────────────────────────────── */}
          <motion.div
            key="confirm-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0, zIndex: 9000,
              background: 'rgba(0,0,0,0.65)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
            }}
          />

          {/* ── Sheet ────────────────────────────────────────────── */}
          <motion.div
            key="confirm-sheet"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0,      opacity: 1 }}
            exit={{ y: '100%',    opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 340 }}
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0,
              zIndex: 9001,
              background: 'linear-gradient(170deg, #0a1828, #071220)',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '20px 20px 0 0',
              padding: '8px 0 0',
              boxShadow: '0 -16px 48px rgba(0,0,0,0.6)',
            }}
          >
            {/* Handle */}
            <div style={{
              width: 36, height: 4, borderRadius: 2,
              background: 'rgba(255,255,255,0.12)',
              margin: '0 auto 20px',
            }} />

            {/* Close button */}
            <button
              onClick={onClose}
              style={{
                position: 'absolute', top: 16, right: 16,
                width: 28, height: 28, borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.04)',
                color: '#4a6080', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <X style={{ width: 13, height: 13 }} />
            </button>

            {/* Body */}
            <div style={{ padding: '0 24px 16px' }}>
              {/* Icon */}
              <div style={{
                width: 52, height: 52, borderRadius: 16,
                background: V.iconBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 16,
              }}>
                <Icon style={{ width: 24, height: 24, color: V.iconColor }} />
              </div>

              {/* Title */}
              <p style={{
                fontSize: 17, fontWeight: 800, color: '#e2eaf3',
                margin: '0 0 8px', lineHeight: 1.3,
              }}>
                {title}
              </p>

              {/* Description */}
              {description && (
                <p style={{
                  fontSize: 13, color: '#4a6080', fontWeight: 500,
                  margin: '0 0 24px', lineHeight: 1.55,
                }}>
                  {description}
                </p>
              )}

              {!description && <div style={{ height: 16 }} />}

              {/* Buttons */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                {/* Cancel */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={onClose}
                  style={{
                    flex: 1, padding: '13px', borderRadius: 14,
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.04)',
                    color: '#6b8299', fontSize: 14, fontWeight: 700,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  {cancelLabel}
                </motion.button>

                {/* Confirm */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { onConfirm(); onClose(); }}
                  style={{
                    flex: 1.4, padding: '13px', borderRadius: 14,
                    border: V.btnBorder || 'none',
                    background: V.btnBg,
                    color: V.btnColor, fontSize: 14, fontWeight: 800,
                    cursor: 'pointer', fontFamily: 'inherit',
                    boxShadow: variant === 'danger'
                      ? '0 4px 18px rgba(239,68,68,0.3)'
                      : variant === 'complete'
                        ? '0 4px 18px rgba(52,211,153,0.25)'
                        : '0 4px 18px rgba(14,165,233,0.25)',
                  }}
                >
                  {confirmLabel}
                </motion.button>
              </div>

              {/* Safe area для телефонов с home indicator */}
              <div style={{ height: 'env(safe-area-inset-bottom, 12px)' }} />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
