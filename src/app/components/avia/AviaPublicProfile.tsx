import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, User, ThumbsUp, ThumbsDown, Handshake, Package,
  Send, Repeat, Loader2, MessageCircle, Calendar,
} from 'lucide-react';
import { getAviaPublicProfile } from '../../api/aviaReviewApi';
import type { AviaPublicProfile as ProfileType, AviaReview } from '../../api/aviaReviewApi';
import { AviaRatingBadge } from './AviaRatingBadge';

function maskPhone(phone: string) {
  const d = phone.replace(/\D/g, '');
  if (d.length < 7) return `+${d}`;
  return `+${d.slice(0, 3)} *** ${d.slice(-4)}`;
}

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch { return iso; }
}

const ROLE_MAP: Record<string, { label: string; icon: typeof Package; color: string }> = {
  courier: { label: 'Курьер',      icon: Package, color: '#0ea5e9' },
  sender:  { label: 'Отправитель', icon: Send,    color: '#a78bfa' },
  both:    { label: 'Курьер + Отправитель', icon: Repeat, color: '#34d399' },
};

type ReviewTab = 'likes' | 'dislikes';

function ReviewCard({ review }: { review: AviaReview }) {
  const isLike = review.type === 'like';
  const color = isLike ? '#34d399' : '#ef4444';
  const Icon = isLike ? ThumbsUp : ThumbsDown;
  const roleLabel = review.authorRole === 'courier' ? 'Курьер' : 'Отправитель';

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        padding: '12px 14px', borderRadius: 16, marginBottom: 8,
        background: `${color}06`, border: `1px solid ${color}12`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon style={{ width: 14, height: 14, color, fill: color }} />
          <span style={{ fontSize: 11, fontWeight: 700, color }}>
            {isLike ? 'Лайк' : 'Дизлайк'}
          </span>
          <span style={{
            fontSize: 9, fontWeight: 600, color: '#3d5268',
            padding: '1px 6px', borderRadius: 5,
            background: '#ffffff08', border: '1px solid #ffffff0a',
          }}>
            {roleLabel}
          </span>
        </div>
        <span style={{ fontSize: 10, color: '#2a3d50' }}>{fmtDate(review.createdAt)}</span>
      </div>
      <p style={{ fontSize: 12, color: '#8ba3bb', margin: 0, lineHeight: 1.5 }}>
        {review.comment}
      </p>
    </motion.div>
  );
}

export function AviaPublicProfile() {
  const { phone } = useParams<{ phone: string }>();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [reviews, setReviews] = useState<AviaReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState<ReviewTab>('likes');

  useEffect(() => {
    if (!phone) return;
    setLoading(true);
    getAviaPublicProfile(phone)
      .then(data => {
        if (!data) { setNotFound(true); return; }
        setProfile(data.profile);
        setReviews(data.reviews);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [phone]);

  const displayName = profile
    ? [profile.firstName, profile.lastName].filter(Boolean).join(' ') || maskPhone(profile.phone)
    : maskPhone(phone || '');

  const roleInfo = profile?.role ? ROLE_MAP[profile.role] : null;
  const RoleIcon = roleInfo?.icon || User;

  const likeReviews = reviews.filter(r => r.type === 'like');
  const dislikeReviews = reviews.filter(r => r.type === 'dislike');
  const filteredReviews = tab === 'likes' ? likeReviews : dislikeReviews;

  return (
    <div style={{
      minHeight: '100dvh',
      background: '#060d18',
      fontFamily: "'Sora', 'Inter', sans-serif",
    }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: 'clamp(14px, 4vw, 20px) clamp(16px, 5vw, 24px)',
          borderBottom: '1px solid #ffffff08',
        }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 12px', borderRadius: 10,
            border: '1px solid #ffffff12', background: '#ffffff08',
            color: '#6b8299', fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}
        >
          <ArrowLeft style={{ width: 14, height: 14 }} />
          Назад
        </button>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>Профиль участника</div>
      </motion.div>

      {/* Content */}
      <div style={{ padding: 'clamp(16px, 4vw, 24px)', maxWidth: 520, margin: '0 auto' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
            <Loader2 style={{ width: 32, height: 32, color: '#0ea5e9', animation: 'spin 1s linear infinite' }} />
          </div>
        ) : notFound ? (
          <div style={{
            textAlign: 'center', padding: '60px 20px',
            background: '#ffffff04', borderRadius: 20,
            border: '1px dashed #ffffff0c',
          }}>
            <User style={{ width: 40, height: 40, color: '#2a3d50', margin: '0 auto 12px' }} />
            <p style={{ fontSize: 14, color: '#4a6080', margin: 0 }}>Профиль не найден</p>
          </div>
        ) : (
          <AnimatePresence>
            {/* Avatar + Name block */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              style={{
                textAlign: 'center',
                padding: '28px 20px 20px',
                background: '#ffffff05',
                borderRadius: 22,
                border: '1px solid #ffffff0a',
                marginBottom: 16,
              }}
            >
              {/* Avatar circle */}
              <div style={{
                width: 72, height: 72, borderRadius: 22,
                background: roleInfo ? `${roleInfo.color}14` : '#0ea5e914',
                border: `2px solid ${roleInfo ? `${roleInfo.color}30` : '#0ea5e930'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 14px',
              }}>
                <RoleIcon style={{ width: 30, height: 30, color: roleInfo?.color || '#0ea5e9' }} />
              </div>

              {/* Name */}
              <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 4 }}>
                {displayName}
              </div>

              {/* Role badge */}
              {roleInfo && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '4px 12px', borderRadius: 10,
                  background: `${roleInfo.color}12`, border: `1px solid ${roleInfo.color}25`,
                  fontSize: 11, fontWeight: 700, color: roleInfo.color,
                  marginBottom: 12,
                }}>
                  <RoleIcon style={{ width: 11, height: 11 }} />
                  {roleInfo.label}
                </div>
              )}

              {/* Like/Dislike badge */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
                <AviaRatingBadge
                  likes={profile?.likes ?? 0}
                  dislikes={profile?.dislikes ?? 0}
                  size="md"
                />
              </div>

              {/* Member since */}
              {profile?.createdAt && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 8 }}>
                  <Calendar style={{ width: 11, height: 11, color: '#2a3d50' }} />
                  <span style={{ fontSize: 10, color: '#2a3d50', fontWeight: 600 }}>
                    В системе с {new Date(profile.createdAt).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
                  </span>
                </div>
              )}
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.35 }}
              style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr',
                gap: 8, marginBottom: 20,
              }}
            >
              <div style={{
                padding: '14px 16px', borderRadius: 16,
                background: '#34d39908', border: '1px solid #34d39918',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: '#34d39914',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Handshake style={{ width: 14, height: 14, color: '#34d399' }} />
                </div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#34d399', lineHeight: 1 }}>
                    {profile?.dealsCompleted ?? 0}
                  </div>
                  <div style={{ fontSize: 10, color: '#3d5268', fontWeight: 600, marginTop: 2 }}>
                    Сделок
                  </div>
                </div>
              </div>

              <div style={{
                padding: '14px 16px', borderRadius: 16,
                background: '#0ea5e908', border: '1px solid #0ea5e918',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: '#0ea5e914',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <MessageCircle style={{ width: 14, height: 14, color: '#0ea5e9' }} />
                </div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#0ea5e9', lineHeight: 1 }}>
                    {reviews.length}
                  </div>
                  <div style={{ fontSize: 10, color: '#3d5268', fontWeight: 600, marginTop: 2 }}>
                    Отзывов
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Review Tabs */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.14, duration: 0.35 }}
            >
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr',
                gap: 6, marginBottom: 14,
                padding: 4, borderRadius: 14,
                background: '#ffffff06', border: '1px solid #ffffff0a',
              }}>
                {([
                  { id: 'likes' as ReviewTab, label: `👍 Лайки (${likeReviews.length})`, color: '#34d399' },
                  { id: 'dislikes' as ReviewTab, label: `👎 Дизлайки (${dislikeReviews.length})`, color: '#ef4444' },
                ] as const).map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    style={{
                      padding: '9px 10px',
                      borderRadius: 10,
                      border: tab === t.id ? `1px solid ${t.color}35` : '1px solid transparent',
                      background: tab === t.id ? `${t.color}14` : 'transparent',
                      color: tab === t.id ? t.color : '#4a6080',
                      fontSize: 12, fontWeight: 700, cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {filteredReviews.length === 0 ? (
                <div style={{
                  textAlign: 'center', padding: '30px 20px',
                  background: '#ffffff04', borderRadius: 16,
                  border: '1px dashed #ffffff0c',
                }}>
                  {tab === 'likes' ? (
                    <ThumbsUp style={{ width: 28, height: 28, color: '#1e3040', margin: '0 auto 10px' }} />
                  ) : (
                    <ThumbsDown style={{ width: 28, height: 28, color: '#1e3040', margin: '0 auto 10px' }} />
                  )}
                  <p style={{ fontSize: 12, color: '#3d5268', margin: 0 }}>
                    {tab === 'likes' ? 'Пока нет лайков' : 'Пока нет дизлайков'}
                  </p>
                </div>
              ) : (
                filteredReviews.map(r => <ReviewCard key={r.id} review={r} />)
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
