import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, Handshake, Plane, Package, ArrowRight,
  CheckCircle2, XCircle, Clock, ThumbsUp, RefreshCw,
  Loader2, MessageCircle, Scale, DollarSign,
  ChevronRight, Bell,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAvia } from './AviaContext';
import {
  getAviaDeals,
  acceptAviaDeal,
  rejectAviaDeal,
  cancelAviaDeal,
  completeAviaDeal,
} from '../../api/aviaDealApi';
import type { AviaDeal, AviaDealStatus } from '../../api/aviaDealApi';
import { makeAviaChatId } from '../../api/aviaChatApi';
import { AviaReviewModal } from './AviaReviewModal';
import { getAviaDealReviewStatus } from '../../api/aviaReviewApi';

// ── Статус ────────────────────────────────────────────────────────────────────

const STATUS_META: Record<AviaDealStatus, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  pending:   { label: 'Ожидание',  color: '#f59e0b', bg: '#f59e0b14', icon: Clock        },
  accepted:  { label: 'Активна',   color: '#34d399', bg: '#34d39914', icon: CheckCircle2 },
  rejected:  { label: 'Отклонена', color: '#ef4444', bg: '#ef444414', icon: XCircle      },
  cancelled: { label: 'Отменена',  color: '#6b7280', bg: '#6b728014', icon: XCircle      },
  completed: { label: 'Завершена', color: '#a78bfa', bg: '#a78bfa14', icon: CheckCircle2 },
};

type TabId = 'incoming' | 'outgoing' | 'active' | 'all';

const TABS: { id: TabId; label: string; color: string }[] = [
  { id: 'incoming', label: 'Входящие',  color: '#34d399' },
  { id: 'outgoing', label: 'Исходящие', color: '#0ea5e9' },
  { id: 'active',   label: 'Активные',  color: '#a78bfa' },
  { id: 'all',      label: 'Все',       color: '#6b8299' },
];

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  } catch { return iso; }
}

function maskPhone(phone: string) {
  const d = phone.replace(/\D/g, '');
  if (d.length < 7) return `+${d}`;
  return `+${d.slice(0, 3)} *** ${d.slice(-4)}`;
}

// ── Карточка сделки ──────────────────────────────────────────────────────────

function DealCard({
  deal,
  myPhone,
  onAccept, onReject, onCancel, onComplete, onOpenChat, onReview,
  alreadyReviewed,
}: {
  deal: AviaDeal;
  myPhone: string;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onCancel: (id: string) => void;
  onComplete: (id: string) => void;
  onOpenChat: (otherPhone: string) => void;
  onReview: (deal: AviaDeal) => void;
  alreadyReviewed: boolean;
}) {
  // Suppress unused var warnings — actions now happen in chat for pending deals
  void onAccept; void onReject; void onCancel;
  const [acting, setActing] = useState<string | null>(null);
  const statusMeta = STATUS_META[deal.status];
  const StatusIcon = statusMeta.icon;

  const cleanMyPhone   = myPhone.replace(/\D/g, '');
  const isInitiator    = deal.initiatorPhone === cleanMyPhone;
  const isRecipient    = deal.recipientPhone === cleanMyPhone;
  const adIsFlightType = deal.adType === 'flight';
  const AdIcon         = adIsFlightType ? Plane : Package;
  const adColor        = adIsFlightType ? '#0ea5e9' : '#a78bfa';

  const otherPhone = isInitiator ? deal.recipientPhone : deal.initiatorPhone;

  const act = async (action: string, fn: () => Promise<any>) => {
    setActing(action);
    try {
      await fn();
    } finally {
      setActing(null);
    }
  };

  const isFinal = ['rejected', 'cancelled', 'completed'].includes(deal.status);
  const dimmed = isFinal;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: dimmed ? 0.6 : 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.25 }}
      style={{
        padding: '14px 16px', borderRadius: 18, marginBottom: 10,
        background: dimmed ? '#ffffff04' : '#ffffff07',
        border: `1px solid ${dimmed ? '#ffffff08' : `${adColor}18`}`,
        position: 'relative',
      }}
    >
      {/* Status badge */}
      <div style={{
        position: 'absolute', top: 12, right: 12,
        display: 'flex', alignItems: 'center', gap: 4,
        padding: '3px 9px', borderRadius: 8,
        background: statusMeta.bg, border: `1px solid ${statusMeta.color}22`,
      }}>
        <StatusIcon style={{ width: 10, height: 10, color: statusMeta.color }} />
        <span style={{ fontSize: 9, fontWeight: 800, color: statusMeta.color, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          {statusMeta.label}
        </span>
      </div>

      {/* Route */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, paddingRight: 80 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 10,
          background: `${adColor}12`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <AdIcon style={{ width: 14, height: 14, color: adColor }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{deal.adFrom}</span>
          <ArrowRight style={{ width: 12, height: 12, color: '#4a6080', flexShrink: 0 }} />
          <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{deal.adTo}</span>
        </div>
      </div>

      {/* Meta row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Scale style={{ width: 11, height: 11, color: '#4a6080' }} />
          <span style={{ fontSize: 12, color: '#6b8299', fontWeight: 600 }}>{deal.weightKg} кг</span>
        </div>
        {deal.price && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <DollarSign style={{ width: 11, height: 11, color: '#4a6080' }} />
            <span style={{ fontSize: 12, color: '#34d399', fontWeight: 700 }}>
              {deal.price} {deal.currency || 'USD'}
            </span>
          </div>
        )}
        {deal.adDate && (
          <span style={{ fontSize: 11, color: '#4a6080', fontWeight: 600 }}>
            {adIsFlightType ? 'Рейс: ' : 'До: '}{fmtDate(deal.adDate)}
          </span>
        )}
        <span style={{ fontSize: 10, color: '#2a3d50', marginLeft: 'auto' }}>
          {fmtDate(deal.createdAt)}
        </span>
      </div>

      {/* Message */}
      {deal.message && (
        <p style={{
          fontSize: 12, color: '#4a6080', lineHeight: 1.45,
          margin: '0 0 10px', padding: '6px 10px', borderRadius: 8,
          background: '#ffffff06', borderLeft: `3px solid ${adColor}30`,
        }}>
          {deal.message}
        </p>
      )}

      {/* Parties */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 10, borderTop: '1px solid #ffffff08',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 22, height: 22, borderRadius: 7,
            background: '#ffffff0a',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ChevronRight style={{ width: 10, height: 10, color: '#4a6080' }} />
          </div>
          <span style={{ fontSize: 11, color: '#4a6080', fontWeight: 600 }}>
            {isInitiator ? 'Вы' : (deal.initiatorName || maskPhone(deal.initiatorPhone))}
            {' → '}
            {isRecipient ? 'Вам' : (deal.recipientName || maskPhone(deal.recipientPhone))}
          </span>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 6 }}>
          {/* Pending deals: go to chat where Accept/Reject/Cancel buttons live */}
          {deal.status === 'pending' && (
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={() => onOpenChat(otherPhone)}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '5px 11px', borderRadius: 8, cursor: 'pointer',
                border: `1px solid ${isRecipient ? 'rgba(52,211,153,0.28)' : 'rgba(14,165,233,0.22)'}`,
                background: isRecipient ? 'rgba(52,211,153,0.08)' : 'rgba(14,165,233,0.08)',
                color: isRecipient ? '#34d399' : '#38bdf8',
                fontSize: 11, fontWeight: 700,
              }}
            >
              <MessageCircle style={{ width: 11, height: 11 }} />
              {isRecipient ? 'Ответить в чате' : 'Открыть чат'}
            </motion.button>
          )}

          {/* Chat button — for accepted */}
          {deal.status === 'accepted' && (
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={() => onOpenChat(otherPhone)}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '5px 10px', borderRadius: 8, cursor: 'pointer',
                border: '1px solid rgba(14,165,233,0.22)',
                background: 'rgba(14,165,233,0.08)',
                color: '#38bdf8', fontSize: 11, fontWeight: 700,
              }}
            >
              <MessageCircle style={{ width: 11, height: 11 }} />
              Чат
            </motion.button>
          )}

          {/* Any participant: complete (if accepted) */}
          {(isInitiator || isRecipient) && deal.status === 'accepted' && (
            <motion.button
              whileTap={{ scale: 0.93 }}
              disabled={!!acting}
              onClick={() => act('complete', () => onComplete(deal.id))}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '5px 11px', borderRadius: 8, cursor: 'pointer',
                border: '1px solid #a78bfa28',
                background: '#a78bfa10',
                color: '#a78bfa', fontSize: 11, fontWeight: 700,
                opacity: acting ? 0.6 : 1,
              }}
            >
              {acting === 'complete'
                ? <Loader2 style={{ width: 11, height: 11, animation: 'spin 1s linear infinite' }} />
                : <CheckCircle2 style={{ width: 11, height: 11 }} />}
              Завершить
            </motion.button>
          )}

          {/* Completed/Accepted/Cancelled/Rejected — leave review button */}
          {(['completed', 'accepted', 'cancelled', 'rejected'].includes(deal.status)) && !alreadyReviewed && (
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={() => onReview(deal)}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '5px 11px', borderRadius: 8, cursor: 'pointer',
                border: '1px solid #f59e0b28',
                background: '#f59e0b10',
                color: '#f59e0b', fontSize: 11, fontWeight: 700,
              }}
            >
              <ThumbsUp style={{ width: 11, height: 11, fill: '#f59e0b' }} />
              Отзыв
            </motion.button>
          )}

          {/* Already reviewed badge */}
          {(['completed', 'accepted', 'cancelled', 'rejected'].includes(deal.status)) && alreadyReviewed && (
            <span style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '5px 10px', borderRadius: 8,
              background: '#34d39908', border: '1px solid #34d39920',
              color: '#34d39980', fontSize: 10, fontWeight: 600,
            }}>
              <CheckCircle2 style={{ width: 10, height: 10 }} />
              Отзыв оставлен
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── Главный компонент ─────────────────────────────────────────────────────────

export function AviaDealsPage() {
  const navigate = useNavigate();
  const { user, isAuth, unreadCount } = useAvia();

  const [deals, setDeals] = useState<AviaDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('incoming');

  // Чат перенесён на /avia/messages

  // Review modal
  const [reviewDeal, setReviewDeal] = useState<AviaDeal | null>(null);
  // dealId → already reviewed by me
  const [reviewedDeals, setReviewedDeals] = useState<Record<string, boolean>>({});

  const myPhone = user?.phone || '';

  const fetchDeals = useCallback(async (silent = false) => {
    if (!myPhone) return;
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const data = await getAviaDeals(myPhone);
      setDeals(data);
      // загружаем статусы отзывов для принятых, завершённых, отменённых и отклонённых сделок
      const completed = data.filter(d => ['completed', 'accepted', 'cancelled', 'rejected'].includes(d.status));
      const statuses: Record<string, boolean> = {};
      await Promise.all(completed.map(async d => {
        const s = await getAviaDealReviewStatus(d.id);
        const isInit = d.initiatorPhone === myPhone;
        statuses[d.id] = isInit ? !!s.byInitiator : !!s.byRecipient;
      }));
      setReviewedDeals(statuses);
    } catch (e) {
      console.error('[AviaDealsPage] fetchDeals error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [myPhone]);

  // Logout-редирект обрабатывается в AviaLayout.
  // Здесь только запускаем загрузку данных.
  useEffect(() => {
    if (isAuth) fetchDeals();
  }, [isAuth, myPhone]);

  // ── Фильтрация ────────────────────────────────────────────────────────────
  const filtered = deals.filter(d => {
    switch (activeTab) {
      case 'incoming': return d.recipientPhone === myPhone && d.status === 'pending';
      case 'outgoing': return d.initiatorPhone === myPhone;
      case 'active':   return d.status === 'accepted';
      case 'all':      return true;
    }
  });

  // ── Badges ────────────────────────────────────────────────────────────────
  const incomingCount = deals.filter(d => d.recipientPhone === myPhone && d.status === 'pending').length;
  const activeCount   = deals.filter(d => d.status === 'accepted').length;

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleAccept = async (id: string) => {
    const res = await acceptAviaDeal(id, myPhone);
    if (!res.success) { toast.error(res.error || 'Ошибка принятия'); return; }
    toast.success('Предложение принято! Свяжитесь через чат.');
    setDeals(prev => prev.map(d => d.id === id ? { ...d, status: 'accepted', acceptedAt: new Date().toISOString() } : d));
  };

  const handleReject = async (id: string) => {
    const res = await rejectAviaDeal(id, myPhone);
    if (!res.success) { toast.error(res.error || 'Ошибка отклонения'); return; }
    toast('Предложение отклонено');
    setDeals(prev => prev.map(d => d.id === id ? { ...d, status: 'rejected', rejectedAt: new Date().toISOString() } : d));
  };

  const handleCancel = async (id: string) => {
    const res = await cancelAviaDeal(id, myPhone);
    if (!res.success) { toast.error(res.error || 'Ошибка отмены'); return; }
    toast('Предложение отменено');
    setDeals(prev => prev.map(d => d.id === id ? { ...d, status: 'cancelled', cancelledAt: new Date().toISOString() } : d));
  };

  const handleComplete = async (id: string) => {
    const res = await completeAviaDeal(id, myPhone);
    if (!res.success) { toast.error(res.error || 'Ошибка завершения'); return; }
    toast.success('Сделка завершена!');
    setDeals(prev => prev.map(d => d.id === id ? { ...d, status: 'completed', completedAt: new Date().toISOString() } : d));
  };

  const handleOpenChat = (otherPhone: string) => {
    const chatId = makeAviaChatId(myPhone, otherPhone);
    const params = new URLSearchParams({ chatId, otherPhone });
    navigate(`/avia/messages?${params.toString()}`);
  };

  const handleReview = (deal: AviaDeal) => setReviewDeal(deal);

  const handleReviewed = (dealId: string) => {
    setReviewedDeals(prev => ({ ...prev, [dealId]: true }));
  };

  if (!user) return null;

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--avia-bg)',
      fontFamily: "'Sora', 'Inter', sans-serif",
    }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: 'clamp(14px, 4vw, 20px) clamp(16px, 5vw, 24px)',
          borderBottom: '1px solid #ffffff08',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => navigate('/avia/dashboard')}
            className="md:hidden"
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

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: '#34d39914',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Handshake style={{ width: 16, height: 16, color: '#34d399' }} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>Мои сделки</div>
              <div style={{ fontSize: 10, color: '#3d5268' }}>
                {deals.length} всего · {activeCount} активных
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => fetchDeals(true)}
          disabled={refreshing}
          style={{
            width: 32, height: 32, borderRadius: 9,
            border: '1px solid #ffffff12', background: '#ffffff08',
            color: refreshing ? '#0ea5e9' : '#6b8299', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <motion.div animate={{ rotate: refreshing ? 360 : 0 }} transition={refreshing ? { repeat: Infinity, duration: 0.8, ease: 'linear' } : {}}>
            <RefreshCw style={{ width: 14, height: 14 }} />
          </motion.div>
        </button>

        {/* Bell — возврат на dashboard с бейджем */}
        <button
          onClick={() => navigate('/avia/dashboard')}
          style={{
            width: 32, height: 32, borderRadius: 9,
            border: `1px solid ${unreadCount > 0 ? 'rgba(14,165,233,0.25)' : '#ffffff12'}`,
            background: unreadCount > 0 ? 'rgba(14,165,233,0.08)' : '#ffffff08',
            color: unreadCount > 0 ? '#38bdf8' : '#6b8299', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative',
          }}
          aria-label="Уведомления"
        >
          <Bell style={{ width: 14, height: 14 }} />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute', top: -3, right: -3,
              minWidth: 14, height: 14, borderRadius: '50%',
              background: '#0ea5e9', fontSize: 8, fontWeight: 800, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '0 2px', border: '2px solid #060d18',
            }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </motion.div>

      {/* Tabs */}
      <div style={{ padding: '12px clamp(16px, 5vw, 24px) 0', overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: 6, minWidth: 'max-content' }}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            const badge = tab.id === 'incoming' ? incomingCount : tab.id === 'active' ? activeCount : 0;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '7px 14px', borderRadius: 10,
                  border: `1px solid ${isActive ? `${tab.color}30` : '#ffffff10'}`,
                  background: isActive ? `${tab.color}12` : '#ffffff06',
                  color: isActive ? tab.color : '#6b8299',
                  fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  transition: 'background 0.2s, border-color 0.2s',
                  whiteSpace: 'nowrap',
                }}
              >
                {tab.label}
                {badge > 0 && (
                  <span style={{
                    minWidth: 16, height: 16, borderRadius: 8,
                    background: isActive ? tab.color : `${tab.color}80`,
                    color: '#fff', fontSize: 8, fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '0 4px',
                  }}>
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: 'clamp(14px, 4vw, 20px)', maxWidth: 520, margin: '0 auto' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
            <Loader2 style={{ width: 28, height: 28, color: '#34d399', animation: 'spin 1s linear infinite' }} />
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              textAlign: 'center', padding: '50px 20px',
              background: '#ffffff04', borderRadius: 20,
              border: '1px dashed #ffffff0c', marginTop: 16,
            }}
          >
            <Handshake style={{ width: 36, height: 36, color: '#34d399', margin: '0 auto 12px', opacity: 0.3 }} />
            <p style={{ fontSize: 13, color: '#4a6080', margin: 0, lineHeight: 1.6 }}>
              {activeTab === 'incoming'
                ? 'Входящих предложений нет.\nКогда кто-то отправит вам предложение, оно появится здесь.'
                : activeTab === 'outgoing'
                ? 'Вы ещё не отправляли предложений.\nНажмите «Предложить» на рейсе или заявке.'
                : activeTab === 'active'
                ? 'Активных сделок нет.\nПринимайте входящие предложения или ждите принятия исходящих.'
                : 'Сделок пока нет.'}
            </p>
          </motion.div>
        ) : (
          <AnimatePresence>
            {filtered.map(deal => (
              <DealCard
                key={deal.id}
                deal={deal}
                myPhone={myPhone}
                onAccept={handleAccept}
                onReject={handleReject}
                onCancel={handleCancel}
                onComplete={handleComplete}
                onOpenChat={handleOpenChat}
                onReview={handleReview}
                alreadyReviewed={!!reviewedDeals[deal.id]}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Чат перенесён на /avia/messages */}

      {/* Review modal */}
      <AnimatePresence>
        {reviewDeal && (
          <AviaReviewModal
            key="review-modal"
            deal={reviewDeal}
            myPhone={myPhone}
            onClose={() => setReviewDeal(null)}
            onReviewed={handleReviewed}
          />
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}