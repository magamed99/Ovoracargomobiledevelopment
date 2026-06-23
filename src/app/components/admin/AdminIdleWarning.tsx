import { Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function AdminIdleWarning({ secs, onStay }: { secs: number | null; onStay: () => void }) {
  return (
    <AnimatePresence>
      {secs !== null && (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.96 }}
          className="fixed bottom-5 right-5 z-[100] w-[300px] rounded-2xl p-4"
          style={{ background: '#1e1b2e', border: '1px solid #3a3550', boxShadow: '0 16px 40px #00000050' }}
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#f59e0b22' }}>
              <Clock className="w-4.5 h-4.5" style={{ color: '#f59e0b' }} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-white">Сессия скоро завершится</p>
              <p className="text-xs mt-1" style={{ color: '#a3a0b8' }}>
                Из-за неактивности выход произойдёт через {Math.max(0, secs)} сек.
              </p>
              <button
                onClick={onStay}
                className="mt-3 w-full py-2 rounded-xl text-xs font-bold text-white transition-colors"
                style={{ background: 'linear-gradient(135deg,#1565d8,#2385f4)' }}
              >
                Остаться в системе
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
