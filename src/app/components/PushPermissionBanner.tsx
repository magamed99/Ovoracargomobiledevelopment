/**
 * PushPermissionBanner.tsx
 * A bottom-sheet style banner asking the user to enable push notifications.
 * Shows once per device. Disappears after granting or dismissing.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  isPushSupported,
  getPushPermission,
  isPushSubscribed,
  subscribeToPush,
  ensurePushSubscription,
} from '../utils/pushService';

const BANNER_DISMISSED_KEY = 'ovora_push_banner_dismissed';

interface Props {
  userEmail: string;
}

export function PushPermissionBanner({ userEmail }: Props) {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userEmail) return;
    if (!isPushSupported()) return;

    const permission = getPushPermission();

    if (permission === 'granted') {
      // Already granted — just ensure subscription is alive, no banner
      ensurePushSubscription(userEmail);
      return;
    }

    if (permission === 'denied') return; // User already denied at OS level

    // Not yet asked — check if we already showed the banner and user dismissed it
    const dismissed = localStorage.getItem(BANNER_DISMISSED_KEY);
    if (dismissed) return;

    // Show banner after a short delay (let the page load first)
    const t = setTimeout(() => setVisible(true), 2500);
    return () => clearTimeout(t);
  }, [userEmail]);

  const handleEnable = async () => {
    setLoading(true);
    try {
      const result = await subscribeToPush(userEmail);
      if (result === 'granted') {
        toast.success('🔔 Уведомления включены!', {
          description: 'Теперь вы будете получать уведомления о сообщениях и офертах',
          duration: 4000,
        });
      } else if (result === 'denied') {
        toast.error('Разрешение отклонено', {
          description: 'Включите уведомления в настройках браузера',
          duration: 5000,
        });
      }
    } finally {
      setLoading(false);
      setVisible(false);
      localStorage.setItem(BANNER_DISMISSED_KEY, 'yes');
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem(BANNER_DISMISSED_KEY, 'yes');
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed bottom-[90px] left-4 right-4 z-50 rounded-2xl overflow-hidden"
          style={{
            background: '#1a2b3c',
            border: '1px solid #2a3f52',
            boxShadow: '0 8px 32px #00000066',
          }}
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 340, damping: 28 }}
        >
          {/* Top accent line */}
          <div style={{ height: 2, background: 'linear-gradient(90deg, #1978e5, #5ba3f5)' }} />

          <div className="flex items-start gap-3 p-4">
            {/* Icon */}
            <div
              className="flex items-center justify-center rounded-xl shrink-0"
              style={{ width: 40, height: 40, background: '#1978e514', border: '1px solid #1978e530' }}
            >
              <Bell style={{ width: 20, height: 20, color: '#5ba3f5' }} />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[14px] text-white leading-snug">
                Включить уведомления
              </p>
              <p className="text-[12px] mt-0.5 leading-snug" style={{ color: '#7a9ab5' }}>
                Получайте сообщения, оферты и статусы поездок мгновенно
              </p>

              {/* Buttons */}
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={handleEnable}
                  disabled={loading}
                  className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-[13px] font-bold text-white transition-all active:scale-95 disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #1978e5, #5ba3f5)', minWidth: 110 }}
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Bell style={{ width: 14, height: 14 }} />
                  )}
                  {loading ? 'Включаем...' : 'Включить'}
                </button>

                <button
                  onClick={handleDismiss}
                  className="rounded-xl px-3 py-2 text-[13px] font-semibold transition-all active:scale-95"
                  style={{ color: '#607080', background: '#ffffff0a' }}
                >
                  Позже
                </button>
              </div>
            </div>

            {/* Close */}
            <button
              onClick={handleDismiss}
              className="rounded-lg p-1 transition-all active:scale-90 shrink-0"
              style={{ color: '#607080' }}
            >
              <X style={{ width: 16, height: 16 }} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
