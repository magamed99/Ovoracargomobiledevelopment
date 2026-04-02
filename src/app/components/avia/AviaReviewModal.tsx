import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ThumbsUp, ThumbsDown, Loader2, CheckCircle2, Plane, Package, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { createAviaReview } from '../../api/aviaReviewApi';
import type { AviaReviewType } from '../../api/aviaReviewApi';
import type { AviaDeal } from '../../api/aviaDealApi';

interface AviaReviewModalProps {
  deal: AviaDeal;
  myPhone: string;
  onClose: () => void;
  onReviewed: (dealId: string) => void;
}

export function AviaReviewModal({ deal, myPhone, onClose, onReviewed }: AviaReviewModalProps) {
  const [type, setType] = useState<AviaReviewType | null>(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const isInitiator = deal.initiatorPhone === myPhone;
  const otherName = isInitiator
    ? (deal.recipientName || deal.recipientPhone)
    : (deal.initiatorName || deal.initiatorPhone);
  const adIsFlightType = deal.adType === 'flight';
  const AdIcon = adIsFlightType ? Plane : Package;
  const adColor = adIsFlightType ? '#0ea5e9' : '#a78bfa';

  const commentTrimmed = comment.trim();
  const isValid = type !== null && commentTrimmed.length >= 10;

  const handleSubmit = async () => {
    if (!type) {
      toast.error('Выберите 👍 или 👎');
      return;
    }
    if (commentTrimmed.length < 10) {
      toast.error('Напишите минимум 10 символов');
      return;
    }
    setLoading(true);
    try {
      const res = await createAviaReview({
        dealId: deal.id,
        authorPhone: myPhone,
        type,
        comment: commentTrimmed,
      });
      if (!res.success) {
        toast.error(res.error || 'Ошибка отправки отзыва');
        return;
      }
      setDone(true);
      setTimeout(() => {
        onReviewed(deal.id);
        onClose();
      }, 1600);
    } finally {
      setLoading(false);
    }
  };

  const likeActive = type === 'like';
  const dislikeActive = type === 'dislike';

  return (
    <AnimatePresence>
      <motion.div
        key="review-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 300,
          background: 'rgba(6,13,24,0.85)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        }}
      >
        <motion.div
          key="review-sheet"
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 80 }}
          transition={{ type: 'spring', damping: 22, stiffness: 240 }}
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%', maxWidth: 520,
            background: '#0c1624',
            borderRadius: '22px 22px 0 0',
            border: '1px solid #ffffff10',
            borderBottom: 'none',
            padding: '20px 20px 32px',
            fontFamily: "'Sora', 'Inter', sans-serif",
          }}
        >
          {/* Drag handle */}
          <div style={{ width: 36, height: 4, borderRadius: 2, background: '#ffffff15', margin: '0 auto 18px' }} />

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 12,
                background: '#34d39914',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <ThumbsUp style={{ width: 17, height: 17, color: '#34d399' }} />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>Оцените взаимодействие</div>
                <div style={{ fontSize: 10, color: '#3d5268' }}>с {otherName}</div>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                width: 32, height: 32, borderRadius: 9,
                border: '1px solid #ffffff12', background: '#ffffff08',
                color: '#6b8299', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <X style={{ width: 14, height: 14 }} />
            </button>
          </div>

          {done ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ textAlign: 'center', padding: '30px 0' }}
            >
              <CheckCircle2 style={{ width: 52, height: 52, color: '#34d399', margin: '0 auto 12px' }} />
              <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 6 }}>
                Отзыв отправлен!
              </div>
              <div style={{ fontSize: 12, color: '#4a6080' }}>
                Спасибо за вашу оценку
              </div>
            </motion.div>
          ) : (
            <>
              {/* Deal reference */}
              <div style={{
                padding: '10px 14px', borderRadius: 14,
                background: `${adColor}08`, border: `1px solid ${adColor}18`,
                marginBottom: 20,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <AdIcon style={{ width: 14, height: 14, color: adColor, flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{deal.adFrom}</span>
                <ArrowRight style={{ width: 11, height: 11, color: '#4a6080', flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{deal.adTo}</span>
              </div>

              {/* Like / Dislike buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setType('like')}
                  style={{
                    padding: '18px 0',
                    borderRadius: 16,
                    border: likeActive ? '2px solid #34d399' : '1.5px solid #ffffff12',
                    background: likeActive ? '#34d39918' : '#ffffff06',
                    cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                    transition: 'all 0.2s',
                  }}
                >
                  <ThumbsUp style={{
                    width: 32, height: 32,
                    color: likeActive ? '#34d399' : '#3d5268',
                    fill: likeActive ? '#34d399' : 'transparent',
                    transition: 'all 0.2s',
                  }} />
                  <span style={{
                    fontSize: 14, fontWeight: 800,
                    color: likeActive ? '#34d399' : '#4a6080',
                    transition: 'color 0.2s',
                  }}>
                    Лайк 👍
                  </span>
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setType('dislike')}
                  style={{
                    padding: '18px 0',
                    borderRadius: 16,
                    border: dislikeActive ? '2px solid #ef4444' : '1.5px solid #ffffff12',
                    background: dislikeActive ? '#ef444418' : '#ffffff06',
                    cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                    transition: 'all 0.2s',
                  }}
                >
                  <ThumbsDown style={{
                    width: 32, height: 32,
                    color: dislikeActive ? '#ef4444' : '#3d5268',
                    fill: dislikeActive ? '#ef4444' : 'transparent',
                    transition: 'all 0.2s',
                  }} />
                  <span style={{
                    fontSize: 14, fontWeight: 800,
                    color: dislikeActive ? '#ef4444' : '#4a6080',
                    transition: 'color 0.2s',
                  }}>
                    Дизлайк 👎
                  </span>
                </motion.button>
              </div>

              {/* Comment — REQUIRED */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#4a6080', marginBottom: 6 }}>
                  {type === 'like' ? 'Почему понравилось?' : type === 'dislike' ? 'Что пошло не так?' : 'Расскажите подробнее'}
                  <span style={{ color: '#ef4444', marginLeft: 3 }}>*</span>
                  <span style={{ color: '#2a3d50', marginLeft: 4 }}>мин. 10 символов</span>
                </label>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value.slice(0, 300))}
                  placeholder={
                    type === 'like'
                      ? 'Быстро доставил, аккуратно упаковал...'
                      : type === 'dislike'
                        ? 'Опоздал, не выходил на связь...'
                        : 'Выберите 👍 или 👎, затем напишите...'
                  }
                  rows={3}
                  style={{
                    width: '100%', padding: '12px 14px',
                    borderRadius: 14,
                    border: `1.5px solid ${commentTrimmed.length >= 10 ? '#34d39930' : '#ffffff12'}`,
                    background: '#ffffff08', color: '#fff',
                    fontSize: 14, resize: 'none', outline: 'none',
                    fontFamily: "'Sora', 'Inter', sans-serif",
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
                />
                <div style={{
                  display: 'flex', justifyContent: 'space-between', marginTop: 3,
                }}>
                  <span style={{
                    fontSize: 10,
                    color: commentTrimmed.length > 0 && commentTrimmed.length < 10 ? '#ef4444' : '#2a3d50',
                    fontWeight: 600,
                  }}>
                    {commentTrimmed.length > 0 && commentTrimmed.length < 10
                      ? `Ещё ${10 - commentTrimmed.length} символов`
                      : ''}
                  </span>
                  <span style={{ fontSize: 10, color: '#2a3d50' }}>
                    {comment.length}/300
                  </span>
                </div>
              </div>

              {/* Submit */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                disabled={loading || !isValid}
                onClick={handleSubmit}
                style={{
                  width: '100%', padding: '14px',
                  borderRadius: 14, border: 'none',
                  cursor: !isValid || loading ? 'not-allowed' : 'pointer',
                  background: !isValid
                    ? '#ffffff0a'
                    : type === 'like'
                      ? 'linear-gradient(135deg, #34d399, #059669)'
                      : 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: !isValid ? '#3d5268' : '#fff',
                  fontSize: 14, fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'background 0.2s, color 0.2s',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading
                  ? <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />
                  : type === 'like'
                    ? <ThumbsUp style={{ width: 15, height: 15, fill: isValid ? '#fff' : 'none' }} />
                    : type === 'dislike'
                      ? <ThumbsDown style={{ width: 15, height: 15, fill: isValid ? '#fff' : 'none' }} />
                      : <ThumbsUp style={{ width: 15, height: 15 }} />}
                {loading ? 'Отправка...' : 'Отправить отзыв'}
              </motion.button>
            </>
          )}

          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
