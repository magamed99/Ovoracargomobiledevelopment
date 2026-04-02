import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { motion, AnimatePresence } from 'motion/react';
import { WifiOff, Wifi } from 'lucide-react';
import { useState, useEffect } from 'react';

/**
 * Slim banner that slides in from top when the user loses internet connection.
 * Also shows a brief "reconnected" flash when coming back online.
 */
export function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const [showReconnected, setShowReconnected] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
      setShowReconnected(false);
    } else if (wasOffline) {
      setShowReconnected(true);
      const t = setTimeout(() => {
        setShowReconnected(false);
        setWasOffline(false);
      }, 2500);
      return () => clearTimeout(t);
    }
  }, [isOnline, wasOffline]);

  const show = !isOnline || showReconnected;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key={isOnline ? 'online' : 'offline'}
          initial={{ y: -44, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -44, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 340, damping: 30 }}
          className={`fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-2 py-2.5 text-[13px] font-semibold shadow-lg ${
            isOnline
              ? 'bg-emerald-500 text-white'
              : 'bg-[#0f172a] text-white border-b border-white/10'
          }`}
          style={{ paddingTop: 'max(10px, env(safe-area-inset-top))' }}
        >
          {isOnline ? (
            <>
              <Wifi className="w-3.5 h-3.5" />
              Соединение восстановлено
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5 text-red-400" />
              Нет соединения — показаны кэшированные данные
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
