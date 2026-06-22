import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import {
  ArrowLeft, Plane, RefreshCw, AlertTriangle, ArrowRight,
  Clock, CheckCircle2, XCircle, ClipboardList, MessageCircle,
  User, Weight, DollarSign, ShieldAlert, ThumbsUp, Camera,
  PlayCircle, Flag, Loader2,
} from 'lucide-react';
import { useAvia } from './AviaContext';
import { usePolling } from '../../hooks/usePolling';
import { getAviaFlight, startAviaFlight, completeAviaFlight } from '../../api/aviaApi';
import type { AviaFlight } from '../../api/aviaApi';
import { getAviaDeals, uploadAviaDealPOD, completeAviaDeal } from '../../api/aviaDealApi';
import type { AviaDeal, AviaDealStatus, AviaPODPhoto, AviaPODPhotoType } from '../../api/aviaDealApi';
import { makeAviaChatId } from '../../api/aviaChatApi';
import { getAviaDealReviewStatusBatch } from '../../api/aviaReviewApi';
import { AviaReviewModal } from './AviaReviewModal';
import { AviaConfirmSheet } from './AviaConfirmSheet';

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch { return iso; }
}

function fmtDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
}

const POD_META: Record<AviaPODPhotoType, { shortLabel: string }> = {
  pickup:   { shortLabel: 'Получение' },
  delivery: { shortLabel: 'Передача'  },
};

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
  deal, isCourierView, myPhone, tripStarted, onOpenChat, reviewed, onReview, onPODUploaded, onCompleteDeal,
}: {
  deal: AviaDeal;
  isCourierView: boolean;
  myPhone: string;
  tripStarted: boolean;
  onOpenChat: (phone: string) => void;
  reviewed: boolean;
  onReview: (deal: AviaDeal) => void;
  onPODUploaded: (dealId: string, photo: AviaPODPhoto) => void;
  onCompleteDeal: (dealId: string) => Promise<void>;
}) {
  const statusMeta = STATUS_META[deal.status];
  const StatusIcon = statusMeta.icon;
  const chatPhone = isCourierView ? deal.senderId : deal.courierId;
  const podPhotos = deal.podPhotos || [];
  const pickupPhotos = podPhotos.filter(p => p.type === 'pickup');
  const deliveryPhotos = podPhotos.filter(p => p.type === 'delivery');
  const hasPickup = pickupPhotos.length > 0;
  const hasDelivery = deliveryPhotos.length > 0;
  const canComplete = hasPickup && hasDelivery && tripStarted;

  const [uploadingPOD, setUploadingPOD] = useState<AviaPODPhotoType | null>(null);
  const [completing, setCompleting] = useState(false);
  const pickupInputRef = useRef<HTMLInputElement>(null);
  const deliveryInputRef = useRef<HTMLInputElement>(null);

  const handlePODFile = (type: AviaPODPhotoType) => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadingPOD(type);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await uploadAviaDealPOD(deal.id, type, base64, myPhone);
      if (!res.success || !res.photo) { toast.error(res.error || 'Не удалось загрузить фото'); return; }
      onPODUploaded(deal.id, res.photo);
      toast.success(type === 'pickup' ? 'Фото получения добавлено' : 'Фото передачи добавлено');
    } catch {
      toast.error('Не удалось загрузить фото');
    } finally {
      setUploadingPOD(null);
    }
  };

  const handleComplete = async () => {
    setCompleting(true);
    try { await onCompleteDeal(deal.id); } finally { setCompleting(false); }
  };

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
            {isCourierView
              ? (deal.senderName || 'Отправитель')
              : (deal.courierName || 'Курьер')}
          </div>
          <div style={{ fontSize: 10, color: '#8aa3ba', fontWeight: 600 }}>
            {maskPhone(chatPhone)}
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

      {(deal.status === 'accepted' || deal.status === 'completed') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {(['pickup', 'delivery'] as AviaPODPhotoType[]).map(type => {
            const photos = type === 'pickup' ? pickupPhotos : deliveryPhotos;
            const inputRef = type === 'pickup' ? pickupInputRef : deliveryInputRef;
            const meta = POD_META[type];
            const done = photos.length > 0;
            const canUpload = isCourierView && deal.status === 'accepted';
            return (
              <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{
                  width: 18, height: 18, borderRadius: 6, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: done ? '#34d39918' : '#ffffff08',
                  border: `1px solid ${done ? '#34d39930' : '#ffffff10'}`,
                }}>
                  {done
                    ? <CheckCircle2 style={{ width: 10, height: 10, color: '#34d399' }} />
                    : <Clock style={{ width: 10, height: 10, color: '#4a6080' }} />}
                </div>
                <span style={{ fontSize: 11, color: done ? '#cfe6da' : '#6b8299', fontWeight: 600, flex: 1, minWidth: 0 }}>
                  {meta.shortLabel}{done && ` · ${fmtDateTime(photos[0].timestamp)}`}
                </span>
                {photos.map((p, i) => (
                  <a key={p.path || i} href={p.url} target="_blank" rel="noopener noreferrer">
                    <img src={p.url} alt={meta.shortLabel} style={{
                      width: 26, height: 26, borderRadius: 6, objectFit: 'cover',
                      border: '1px solid #ffffff14', flexShrink: 0,
                    }} />
                  </a>
                ))}
                {canUpload && (
                  <>
                    <input ref={inputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handlePODFile(type)} />
                    <button
                      onClick={() => inputRef.current?.click()}
                      disabled={!!uploadingPOD}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
                        padding: '4px 9px', borderRadius: 7, cursor: 'pointer',
                        border: '1px solid #34d39928', background: '#34d39910',
                        color: '#34d399', fontSize: 10, fontWeight: 700,
                        opacity: uploadingPOD ? 0.6 : 1,
                      }}
                    >
                      {uploadingPOD === type
                        ? <Loader2 style={{ width: 10, height: 10, animation: 'spin 1s linear infinite' }} />
                        : <Camera style={{ width: 10, height: 10 }} />}
                      {done ? 'Ещё' : 'Фото'}
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button
          onClick={() => onOpenChat(chatPhone)}
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

        {isCourierView && deal.status === 'accepted' && (
          <button
            onClick={handleComplete}
            disabled={completing || !canComplete}
            title={
              canComplete
                ? undefined
                : !tripStarted
                  ? 'Сначала начните поездку'
                  : 'Сначала добавьте фото получения и передачи товара'
            }
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '8px 12px', borderRadius: 10, cursor: canComplete ? 'pointer' : 'not-allowed',
              border: '1px solid #a78bfa28', background: '#a78bfa10',
              color: '#a78bfa', fontSize: 11, fontWeight: 600,
              opacity: completing ? 0.6 : (canComplete ? 1 : 0.4),
            }}
          >
            {completing
              ? <Loader2 style={{ width: 12, height: 12, animation: 'spin 1s linear infinite' }} />
              : <CheckCircle2 style={{ width: 12, height: 12 }} />}
            Завершить сделку
          </button>
        )}

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
              {isCourierView ? 'Оценить отправителя' : 'Оценить курьера'}
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
  const [starting, setStarting] = useState(false);
  const [completing, setCompleting] = useState(false);
  type ConfirmCfg = { title: string; description: string; variant: 'complete'; label: string; action: () => Promise<void> };
  const [confirmCfg, setConfirmCfg] = useState<ConfirmCfg | null>(null);

  const isCourierView = !!(flight && user && flight.courierId === user.phone);

  const load = useCallback((opts?: { silent?: boolean }) => {
    if (!id || !user?.phone) return;
    const silent = !!opts?.silent;
    if (!silent) {
      setLoading(true);
      setError('');
      // Сбрасываем данные предыдущего рейса — иначе при смене :id на рейс без
      // доступа в шапке/манифесте мелькают данные ПРЕЖНЕГО успешно загруженного рейса.
      setFlight(null);
      setDeals([]);
    }
    Promise.all([
      getAviaFlight(id, user.phone),
      getAviaDeals(user.phone),
    ])
      .then(async ([f, allDeals]) => {
        if (!f) { if (!silent) setError('Рейс не найден'); return; }
        const flightDeals = allDeals.filter(d => d.adType === 'flight' && d.adId === id);
        // Доступ: владелец рейса (курьер) или отправитель, у которого есть сделка на этот рейс
        if (f.courierId !== user.phone && flightDeals.length === 0) {
          if (!silent) setError('Доступ запрещён: у вас нет сделки на этот рейс');
          return;
        }
        setFlight(f);
        setDeals(flightDeals);

        const completed = flightDeals.filter(d => d.status === 'completed');
        const statusMap = await getAviaDealReviewStatusBatch(completed.map(d => d.id));
        const statuses: Record<string, boolean> = {};
        for (const d of completed) {
          const s = statusMap[d.id] || {};
          const isInit = d.initiatorPhone === user.phone;
          statuses[d.id] = isInit ? !!s.byInitiator : !!s.byRecipient;
        }
        setReviewedDeals(statuses);
      })
      .catch(() => { if (!silent) setError('Ошибка загрузки'); })
      .finally(() => { if (!silent) setLoading(false); });
  }, [id, user?.phone]);

  useEffect(() => { load(); }, [load]);

  // Статусы сделок (accept/reject/cancel/undo) меняются в чате на другом экране —
  // тихий polling без спиннера, чтобы манифест не "застывал" со старыми данными,
  // плюс мгновенный рефреш при возврате на вкладку (см. usePolling).
  usePolling(async () => { load({ silent: true }); }, 20_000);

  const handlePODUploaded = (dealId: string, photo: AviaPODPhoto) => {
    setDeals(prev => prev.map(d => d.id === dealId ? { ...d, podPhotos: [...(d.podPhotos || []), photo] } : d));
  };

  const handleCompleteDeal = async (dealId: string) => {
    if (!user?.phone) return;
    const res = await completeAviaDeal(dealId, user.phone);
    if (!res.success) { toast.error(res.error || 'Ошибка завершения сделки'); return; }
    toast.success('Сделка завершена!');
    setDeals(prev => prev.map(d => d.id === dealId ? { ...d, status: 'completed', completedAt: new Date().toISOString() } : d));
  };

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

  const execStart = async () => {
    if (!user?.phone || !flight) return;
    setStarting(true);
    try {
      const result = await startAviaFlight(flight.id, user.phone);
      if (result.error) throw new Error(result.error);
      setFlight(prev => prev ? { ...prev, status: 'in_progress' } : prev);
      toast.success('Поездка начата! Рейс скрыт из поиска у других пользователей', { duration: 3000 });
    } catch {
      toast.error('Не удалось начать поездку');
    } finally { setStarting(false); }
  };

  const execComplete = async () => {
    if (!user?.phone || !flight) return;
    setCompleting(true);
    try {
      const result = await completeAviaFlight(flight.id, user.phone);
      if (result.error) throw new Error(result.error);
      setFlight(prev => prev ? { ...prev, status: 'completed' } : prev);
      toast.success(`Поездка завершена! Завершено сделок: ${result.completedDeals ?? 0}`, { duration: 3000 });
      load();
    } catch {
      toast.error('Не удалось завершить поездку');
    } finally { setCompleting(false); }
  };

  const handleStart = () => setConfirmCfg({
    title: 'Начать поездку?',
    description: 'Рейс исчезнет из публичного поиска — новые заявки больше не будут приходить.',
    variant: 'complete', label: 'Начать', action: execStart,
  });
  const handleComplete = () => setConfirmCfg({
    title: 'Завершить поездку?',
    description: 'Все принятые сделки будут отмечены как завершённые.',
    variant: 'complete', label: 'Завершить', action: execComplete,
  });

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
        <button onClick={() => load()} style={{
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

            {isCourierView && flight.status !== 'closed' && flight.status !== 'completed' && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                {flight.status !== 'in_progress' ? (
                  <button
                    onClick={handleStart}
                    disabled={starting}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      padding: '11px 14px', borderRadius: 12, cursor: 'pointer',
                      border: '1px solid #38bdf824', background: '#38bdf80c',
                      color: '#38bdf8', fontSize: 13, fontWeight: 700,
                      opacity: starting ? 0.5 : 1,
                    }}
                  >
                    <PlayCircle style={{ width: 15, height: 15 }} />
                    {starting ? 'Запуск...' : 'Начать поездку'}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (counts.accepted > 0) {
                        toast.error(`Сначала завершите все сделки с отправителями (осталось: ${counts.accepted})`);
                        return;
                      }
                      handleComplete();
                    }}
                    disabled={completing || counts.accepted > 0}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      padding: '11px 14px', borderRadius: 12, cursor: counts.accepted > 0 ? 'not-allowed' : 'pointer',
                      border: '1px solid #34d39924', background: '#34d3990c',
                      color: '#34d399', fontSize: 13, fontWeight: 700,
                      opacity: completing || counts.accepted > 0 ? 0.5 : 1,
                    }}
                  >
                    <Flag style={{ width: 15, height: 15 }} />
                    {completing ? 'Завершение...' : 'Завершить поездку'}
                  </button>
                )}
              </div>
            )}
            {isCourierView && flight.status === 'in_progress' && counts.accepted > 0 && (
              <p style={{ fontSize: 11, color: '#f59e0b', margin: '-8px 0 14px', lineHeight: 1.5 }}>
                Завершите сделки со всеми отправителями (фото получения и передачи), чтобы закрыть поездку — осталось: {counts.accepted}
              </p>
            )}

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
                      isCourierView={isCourierView}
                      myPhone={user?.phone || ''}
                      tripStarted={flight?.status === 'in_progress'}
                      onOpenChat={handleOpenChat}
                      reviewed={!!reviewedDeals[d.id]}
                      onReview={setReviewDeal}
                      onPODUploaded={handlePODUploaded}
                      onCompleteDeal={handleCompleteDeal}
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

      {confirmCfg && (
        <AviaConfirmSheet
          isOpen={true}
          onClose={() => setConfirmCfg(null)}
          onConfirm={() => { confirmCfg.action(); setConfirmCfg(null); }}
          title={confirmCfg.title}
          description={confirmCfg.description}
          variant={confirmCfg.variant}
          confirmLabel={confirmCfg.label}
        />
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
