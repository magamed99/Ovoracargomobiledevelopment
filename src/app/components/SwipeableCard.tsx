/**
 * SwipeableCard — touch swipe-to-dismiss wrapper for mobile.
 * Swipe left to reveal delete action. Works only on touch devices.
 * Threshold: 30% of card width triggers action.
 */
import { useState, useRef, useCallback } from 'react';
import { Trash2 } from 'lucide-react';
import { playSwipeSound } from '../utils/soundFeedback';

interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeDismiss?: () => void;
  enabled?: boolean;
  actionLabel?: string;
  actionColor?: string;
}

const THRESHOLD_RATIO = 0.3; // 30% of width to trigger
const MAX_TRANSLATE = 120;   // px max visible swipe

export function SwipeableCard({
  children,
  onSwipeDismiss,
  enabled = true,
  actionLabel = 'Удалить',
  actionColor = 'bg-rose-500',
}: SwipeableCardProps) {
  const [translateX, setTranslateX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const cardWidth = useRef(0);
  const isHorizontal = useRef<boolean | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (!enabled) return;
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    isHorizontal.current = null;
    cardWidth.current = containerRef.current?.offsetWidth ?? 300;
    setSwiping(true);
  }, [enabled]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!swiping) return;
    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;

    // Determine swipe direction on first significant movement
    if (isHorizontal.current === null) {
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
        isHorizontal.current = Math.abs(dx) > Math.abs(dy);
      }
      return;
    }
    if (!isHorizontal.current) return;

    // Only allow swipe left (negative dx)
    const clamped = Math.max(-MAX_TRANSLATE, Math.min(0, dx));
    setTranslateX(clamped);
  }, [swiping]);

  const onTouchEnd = useCallback(() => {
    if (!swiping) return;
    setSwiping(false);

    const threshold = cardWidth.current * THRESHOLD_RATIO;
    if (Math.abs(translateX) > threshold && onSwipeDismiss) {
      // Trigger dismiss animation
      playSwipeSound();
      setTranslateX(-cardWidth.current);
      setTimeout(() => {
        setDismissed(true);
        onSwipeDismiss();
      }, 250);
    } else {
      // Spring back
      setTranslateX(0);
    }
    isHorizontal.current = null;
  }, [swiping, translateX, onSwipeDismiss]);

  if (!enabled) return <>{children}</>;
  if (dismissed) return null;

  const progress = Math.min(1, Math.abs(translateX) / MAX_TRANSLATE);

  return (
    <div ref={containerRef} className="relative overflow-hidden rounded-2xl">
      {/* Background action layer */}
      <div
        className={`absolute inset-0 flex items-center justify-end pr-5 ${actionColor}`}
        style={{ opacity: progress }}
      >
        <div className="flex items-center gap-2 text-white">
          <Trash2 className="w-5 h-5" style={{ transform: `scale(${0.6 + progress * 0.4})` }} />
          <span className="text-[13px] font-bold" style={{ opacity: progress > 0.4 ? 1 : 0 }}>
            {actionLabel}
          </span>
        </div>
      </div>

      {/* Card layer */}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          transform: `translateX(${translateX}px)`,
          transition: swiping ? 'none' : 'transform 0.25s cubic-bezier(0.2,0.9,0.3,1)',
        }}
      >
        {children}
      </div>
    </div>
  );
}
