import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, Plane, RefreshCw, AlertTriangle, ArrowRight,
  Clock, CheckCircle2, XCircle, ClipboardList, MessageCircle,
  User, Weight, DollarSign, ShieldAlert, ThumbsUp,
} from 'lucide-react';
import { useAvia } from './AviaContext';
import { getAviaFlight } from '../../api/aviaApi';
import type { AviaFlight } from '../../api/aviaApi';
import { getAviaDeals } from '../../api/aviaDealApi';
import type { AviaDeal, AviaDealStatus } from '../../api/aviaDealApi';
import { makeAviaChatId } from '../../api/aviaChatApi';
import { getAviaDealReviewStatus } from '../../api/aviaReviewApi';
import { AviaReviewModal } from './AviaReviewModal';

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch { return iso; }
}

function maskPhone(phone: string): string {
  const d = (phone || '').replace(/\D/g, '');
  if (d.length < 7) return `+${d}`;
  return `+${d.slice(0, 3)} *** ${d.slice(-4)}`;
}

const STATUS_META: Record<AviaDealStatus, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  pending:   { label: 'Ожидание',  color: '#f59e0b', bg: '#f59e0b14', icon: Clock        },
  accepted:  { label: 'Принята',   color: '#34d399', bg: '#34d39914', icon: CheckCircle2 },
  rejected:  { label: 'Отклонена', color: '#ef4444', bg: '#ef444414', icon: XCircle      },
  cancelled: { label: 'Отменена',  color: '#6b7280', bg: '#6b728014', icon: XCircle      },
  completed: { label: 'Завершена', color: '#a78bfa', bg: '#a78bfa14', icon: CheckCircle2 },
};

function ManifestRow({
  deal, onOpenChat, reviewed, onReview,
}: {
  deal: AviaDeal;
  onOpenChat: (phone: string) => void;
  reviewed: boolean;
  onReview: (deal: AviaDeal) => void;
}) {
  const statusMeta = STATUS_META[deal.status];
  const StatusIcon = statusMeta.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      style={{
        padding: '13px 14px', borderRadius: 16, marginBottom: 8,
        background: '#ffffff06', border: '1px solid #ffffff0a',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 10, flexShrink: 0,
          background: '#0ea5e914', border: '1px solid #0ea5e922',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <User style={{ width: 14, height: 14, color: '#38bdf8' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#e2eaf3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {deal.senderName || 'Отправитель'}
          </div>
          <div style={{ fontSize: 10, color: '#3d5268', fontWeight: 600 }}>
            {maskPhone(deal.senderId)}
          </div>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '3px 9px', borderRadius: 8,
          background: statusMeta.bg, border: `1px solid ${statusMeta.color}22`,
        }}>
          <StatusIcon style={{ width: 10, height: 10, color: statusMeta.color }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: statusMeta.color }}>{statusMeta.label}</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#6b8299', fontWeight: 600 }}>
          <Weight style={{ width: 11, height: 11 }} />
          {deal.weightKg} кг
        </div>
        {!!deal.price && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#6b8299', fontWeight: 600 }}>
            <DollarSign style={{ width: 11, height: 11 }} />
            {deal.currency || 'USD'} {deal.price}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button
          onClick={() => onOpenChat(deal.senderId)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '8px 12px', borderRadius: 10,
            border: '1px solid rgba(14,165,233,0.18)', background: 'rgba(14,165,233,0.08)',
            color: '#38bdf8', fontSize: 11, fontWeight: 600, cursor: 'pointer',
          }}
        >
          <MessageCircle style={{ width: 12, height: 12 }} />
          Написать
        </button>

        {deal.status === 'completed' && (
          reviewed ? (
            <span style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 12px', borderRadius: 10,
              border: '1px solid rgba(52,211,153,0.18)', background: 'rgba(52,211,153,0.08)',
              color: '#34d399', fontSize: 11, fontWeight: 600,
            }}>
              <CheckCircle2 style={{ width: 12, height: 12 }} />
              Отзыв оставлен
            </span>
          ) : (
            <button
              onClick={() => onReview(deal)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '8px 12px', borderRadius: 10,
                border: '1px solid rgba(167,139,250,0.22)', background: 'rgba(167,139,250,0.08)',
                color: '#a78bfa', fontSize: 11, fontWeight: 600, cursor: 'pointer',
              }}
            >
              <ThumbsUp style={{ width: 12, height: 12 }} />
              Оценить отправителя
            </button>
          )
        )}
      </div>
    </motion.div>
  );
}

export function AviaFlightManifestPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAvia();
  const [flight, setFlight] = useState<AviaFlight | null>(null);
  const [deals, setDeals]   = useState<AviaDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [reviewedDeals, setReviewedDeals] = useState<Record<string, boolean>>({});
  const [reviewDeal, setReviewDeal] = useState<AviaDeal | null>(null);

  const load = useCallback(() => {
    if (!id || !user?.phone) return;
    setLoading(true);
    setError('');
    Promise.all([
      getAviaFlight(id, user.phone),
      getAviaDeals(user.phone),
    ])
      .then(async ([f, allDeals]) => {
        if (!f) { setError('Рейс не найден'); return; }
        if (f.courierId !== user.phone) { setError('Доступ запрещён: вы не владелец этого рейса'); return; }
        setFlight(f);
        const flightDeals = allDeals.filter(d => d.adType === 'flight' && d.adId === id);
        setDeals(flightDeals);

        const completed = flightDeals.filter(d => d.status === 'completed');
        const statuses: Record<string, boolean> = {};
        await Promise.all(completed.map(async d => {
          try {
            const s = await getAviaDealReviewStatus(d.id);
            const isInit = d.initiatorPhone === user.phone;
            statuses[d.id] = isInit ? !!s.byInitiator : !!s.byRecipient;
          } catch {
            statuses[d.id] = false;
          }
        }));
        setReviewedDeals(statuses);
      })
      .catch(() => setError('Ошибка загрузки'))
      .finally(() => setLoading(false));
  }, [id, user?.phone]);

  useEffect(() => { load(); }, [load]);

  const handleOpenChat = (otherPhone: string) => {
    if (!user || !flight) return;
    const params = new URLSearchParams({
      chatId: makeAviaChatId(user.phone, otherPhone),
      otherPhone,
      adType: 'flight', adId: flight.id,
      adFrom: flight.from, adTo: flight.to,
    });
    navigate(`/avia/messages?${params.toString()}`);
  };

  const counts = {
    pending:   deals.filter(d => d.status === 'pending').length,
    accepted:  deals.filter(d => d.status === 'accepted').length,
    completed: deals.filter(d => d.status === 'completed').length,
  };

  return (
    <div style={{ minHeight: '100dvh', background: '#060d18', fontFamily: "'Sora','Inter',sans-serif" }}>
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: 'clamp(14px,4vw,20px) clamp(16px,5vw,24px)',
          borderBottom: '1px solid #ffffff08',
        }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{
            width: 36, height: 36, borderRadius: 11,
            border: '1px solid #ffffff12', background: '#ffffff08',
            color: '#6b8299', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <ArrowLeft style={{ width: 16, height: 16 }} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#e2eaf3' }}>Манифест рейса</div>
          {flight && (
            <div style={{ fontSize: 10, color: '#3d5268', fontWeight: 600 }}>
              {flight.from} → {flight.to} · {fmtDate(flight.date)}
            </div>
          )}
        </div>
        <button onClick={load} style={{
          width: 34, height: 34, borderRadius: 10,
          border: '1px solid #ffffff10', background: '#ffffff06',
          color: '#4a6080', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <RefreshCw style={{ width: 13, height: 13 }} />
        </button>
      </motion.div>

      <div style={{ padding: 'clamp(14px,4vw,20px)', maxWidth: 520, margin: '0 auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#4a6080' }}>Загрузка...</div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <ShieldAlert style={{ width: 32, height: 32, color: '#ef4444', margin: '0 auto 12px' }} />
            <div style={{ color: '#f87171', fontWeight: 700 }}>{error}</div>
          </div>
        ) : flight && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                padding: '16px', borderRadius: 18, marginBottom: 14,
                background: 'linear-gradient(145deg, #0a1628, #0d1f3a)',
                border: '1px solid rgba(14,165,233,0.15)',
                display: 'flex', alignItems: 'center', gap: 12,
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 13, flexShrink: 0,
                background: 'rgba(14,165,233,0.12)', border: '1px solid rgba(14,165,233,0.22)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Plane style={{ width: 18, height: 18, color: '#0ea5e9' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#e2eaf3' }}>{flight.from}</span>
                  <ArrowRight style={{ width: 12, height: 12, color: '#0ea5e9' }} />
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#e2eaf3' }}>{flight.to}</span>
                </div>
                <div style={{ fontSize: 10, color: '#3d5268', marginTop: 2 }}>
                  Заявок на рейс: {deals.length}
                </div>
              </div>
            </motion.div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              {[
                { label: 'Ожидают', value: counts.pending, color: '#f59e0b' },
                { label: 'Принято', value: counts.accepted, color: '#34d399' },
                { label: 'Завершено', value: counts.completed, color: '#a78bfa' },
              ].map(s => (
                <div key={s.label} style={{
                  flex: 1, padding: '8px', borderRadius: 10,
                  background: `${s.color}08`, border: `1px solid ${s.color}18`,
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 9, color: '#3d5268', fontWeight: 600, textTransform: 'uppercase' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {deals.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <ClipboardList style={{ width: 28, height: 28, color: '#3d5268', margin: '0 auto 10px' }} />
                <div style={{ color: '#6b8299', fontSize: 13, fontWeight: 600 }}>
                  На этот рейс пока нет заявок
                </div>
              </div>
            ) : (
              <AnimatePresence>
                {deals
                  .slice()
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map(d => (
                    <ManifestRow
                      key={d.id}
                      deal={d}
                      onOpenChat={handleOpenChat}
                      reviewed={!!reviewedDeals[d.id]}
                      onReview={setReviewDeal}
                    />
                  ))}
              </AnimatePresence>
            )}
          </>
        )}
      </div>

      {reviewDeal && user && (
        <AviaReviewModal
          deal={reviewDeal}
          myPhone={user.phone}
          onClose={() => setReviewDeal(null)}
          onReviewed={(dealId) => setReviewedDeals(prev => ({ ...prev, [dealId]: true }))}
        />
      )}
    </div>
  );
}
