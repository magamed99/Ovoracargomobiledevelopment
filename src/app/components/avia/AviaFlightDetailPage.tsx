import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, Plane, Package, MapPin, Calendar, Weight,
  DollarSign, Hash, User, Star, MessageCircle, Handshake,
  ShieldCheck, Clock, ArrowRight, RefreshCw, AlertTriangle,
  Copy, Check, ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { getAviaFlight, getAviaRequest } from '../../api/aviaApi';
import type { AviaFlight, AviaRequest } from '../../api/aviaApi';
import { useAvia } from './AviaContext';
import { AviaDealOfferModal } from './AviaDealOfferModal';
import { makeAviaChatId } from '../../api/aviaChatApi';
import { deleteAviaFlight, deleteAviaRequest, closeAviaFlight, closeAviaRequest } from '../../api/aviaApi';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string, long = false): string {
  try {
    return new Date(iso).toLocaleDateString('ru-RU', long
      ? { day: 'numeric', month: 'long', year: 'numeric' }
      : { day: 'numeric', month: 'short' });
  } catch { return iso; }
}

function fmtDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('ru-RU', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return iso; }
}

function timeSince(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m} мин назад`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ч назад`;
  const d = Math.floor(h / 24);
  return `${d} дн. назад`;
}

function Stars({ rating, size = 13 }: { rating: number; size?: number }) {
  return (
    <div style={{ display: 'flex', gap: 1 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          style={{
            width: size, height: size,
            color: i <= Math.round(rating) ? '#fbbf24' : '#1e3050',
            fill: i <= Math.round(rating) ? '#fbbf24' : '#1e3050',
          }}
        />
      ))}
    </div>
  );
}

// ── Info Row ──────────────────────────────────────────────────────────────────

function InfoRow({
  icon: Icon, label, value, accent, copyable,
}: {
  icon: typeof MapPin; label: string; value: string;
  accent?: string; copyable?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '11px 0',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 10, flexShrink: 0,
        background: accent ? `${accent}10` : '#ffffff08',
        border: `1px solid ${accent ? `${accent}20` : '#ffffff0a'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon style={{ width: 14, height: 14, color: accent || '#4a6080' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, color: '#3d5268', fontWeight: 600, marginBottom: 1 }}>{label}</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#c8daea', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {value}
        </div>
      </div>
      {copyable && (
        <button
          onClick={copy}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3d5268', padding: 4 }}
        >
          {copied ? <Check style={{ width: 13, height: 13, color: '#34d399' }} /> : <Copy style={{ width: 13, height: 13 }} />}
        </button>
      )}
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div style={{ padding: 'clamp(14px,4vw,20px)', maxWidth: 520, margin: '0 auto' }}>
      {[1, 2, 3, 4].map(i => (
        <div key={i} style={{
          height: i === 1 ? 120 : 56, borderRadius: 16,
          background: '#ffffff06', border: '1px solid #ffffff08',
          marginBottom: 12, overflow: 'hidden', position: 'relative',
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent)',
            animation: 'shimmer 1.5s infinite',
          }} />
        </div>
      ))}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  FLIGHT DETAIL
// ═════════════════════════════════════════════════════════════════════════════

export function AviaFlightDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAvia();
  const [flight, setFlight]   = useState<AviaFlight | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [showOffer, setShowOffer] = useState(false);
  const [deleting, setDeleting]   = useState(false);

  const load = useCallback(() => {
    if (!id) return;
    setLoading(true);
    getAviaFlight(id)
      .then(f => {
        if (!f) setError('Рейс не найден');
        else setFlight(f);
      })
      .catch(() => setError('Ошибка загрузки'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const isMine = flight?.courierId === user?.phone;
  const canOffer = !isMine && (user?.role === 'sender' || user?.role === 'both');
  const canChat  = !isMine && !!user;

  const handleDelete = async () => {
    if (!flight || !confirm('Удалить этот рейс?')) return;
    setDeleting(true);
    try {
      await deleteAviaFlight(flight.id);
      toast.success('Рейс удалён');
      navigate('/avia/dashboard');
    } catch { toast.error('Не удалось удалить'); }
    finally { setDeleting(false); }
  };

  const handleClose = async () => {
    if (!flight || !confirm('Закрыть рейс? Он исчезнет из публичного списка.')) return;
    try {
      await closeAviaFlight(flight.id);
      setFlight(prev => prev ? { ...prev, status: 'closed' } : prev);
      toast.success('Рейс закрыт');
    } catch { toast.error('Не удалось закрыть'); }
  };

  const STATUS_META: Record<string, { label: string; color: string }> = {
    active:  { label: 'Активен',  color: '#34d399' },
    closed:  { label: 'Закрыт',   color: '#6b8299' },
    deleted: { label: 'Удалён',   color: '#ef4444' },
  };
  const statusMeta = STATUS_META[flight?.status || 'active'] || STATUS_META.active;

  return (
    <div style={{ minHeight: '100dvh', background: '#060d18', fontFamily: "'Sora','Inter',sans-serif" }}>
      <style>{`@keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }`}</style>

      {/* Header */}
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
          <div style={{ fontSize: 15, fontWeight: 800, color: '#e2eaf3' }}>Рейс</div>
          {flight && (
            <div style={{ fontSize: 10, color: '#3d5268', fontWeight: 600 }}>
              {flight.from} → {flight.to}
            </div>
          )}
        </div>

        {flight && (
          <div style={{
            padding: '4px 10px', borderRadius: 8,
            background: `${statusMeta.color}12`,
            border: `1px solid ${statusMeta.color}22`,
          }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: statusMeta.color }}>
              {statusMeta.label}
            </span>
          </div>
        )}

        <button
          onClick={load}
          style={{
            width: 34, height: 34, borderRadius: 10,
            border: '1px solid #ffffff10', background: '#ffffff06',
            color: '#4a6080', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <RefreshCw style={{ width: 13, height: 13 }} />
        </button>
      </motion.div>

      {loading ? <DetailSkeleton /> : error ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <AlertTriangle style={{ width: 32, height: 32, color: '#ef4444', margin: '0 auto 12px' }} />
          <div style={{ color: '#f87171', fontWeight: 700 }}>{error}</div>
        </div>
      ) : flight && (
        <div style={{ padding: 'clamp(14px,4vw,20px)', maxWidth: 520, margin: '0 auto' }}>

          {/* ── Hero карточка ── */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            style={{
              padding: '20px 20px 16px', borderRadius: 20, marginBottom: 12,
              background: 'linear-gradient(145deg, #0a1628, #0d1f3a)',
              border: '1px solid rgba(14,165,233,0.15)',
              position: 'relative', overflow: 'hidden',
            }}
          >
            <div style={{
              position: 'absolute', top: -20, right: -20, width: 100, height: 100,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(14,165,233,0.1) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />

            {/* Route */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 13,
                background: 'rgba(14,165,233,0.12)',
                border: '1px solid rgba(14,165,233,0.22)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Plane style={{ width: 18, height: 18, color: '#0ea5e9' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16, fontWeight: 800, color: '#e2eaf3' }}>{flight.from}</span>
                  <ArrowRight style={{ width: 14, height: 14, color: '#0ea5e9' }} />
                  <span style={{ fontSize: 16, fontWeight: 800, color: '#e2eaf3' }}>{flight.to}</span>
                </div>
                <div style={{ fontSize: 10, color: '#3d5268', marginTop: 2 }}>
                  Опубликован: {timeSince(flight.createdAt)}
                </div>
              </div>
            </div>

            {/* Quick stats */}
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { label: 'Вылет', value: fmtDate(flight.date), color: '#0ea5e9' },
                { label: 'Место, кг', value: `${flight.freeKg} кг`, color: '#34d399' },
                ...(flight.pricePerKg ? [{ label: 'Цена/кг', value: `${flight.currency ?? 'USD'} ${flight.pricePerKg}`, color: '#f59e0b' }] : []),
              ].map(s => (
                <div key={s.label} style={{
                  flex: 1, padding: '8px', borderRadius: 10,
                  background: `${s.color}08`, border: `1px solid ${s.color}18`,
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#e2eaf3' }}>{s.value}</div>
                  <div style={{ fontSize: 9, color: '#3d5268', fontWeight: 600, textTransform: 'uppercase' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ── Детали ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.3 }}
            style={{
              padding: '4px 16px', borderRadius: 16, marginBottom: 12,
              background: '#ffffff04', border: '1px solid #ffffff08',
            }}
          >
            <InfoRow icon={MapPin}      label="Откуда"   value={flight.from} accent="#0ea5e9" />
            <InfoRow icon={MapPin}      label="Куда"     value={flight.to} accent="#0ea5e9" />
            <InfoRow icon={Calendar}    label="Дата вылета" value={fmtDate(flight.date, true)} accent="#34d399" />
            <InfoRow icon={Weight}      label="Свободный вес" value={`${flight.freeKg} кг`} accent="#a78bfa" />
            {flight.pricePerKg ? <InfoRow icon={DollarSign} label="Цена за кг" value={`${flight.currency ?? 'USD'} ${flight.pricePerKg}`} accent="#f59e0b" /> : null}
            {flight.flightNo ? <InfoRow icon={Hash} label="Номер рейса" value={flight.flightNo} copyable /> : null}
            <InfoRow icon={Clock} label="Создан" value={fmtDateTime(flight.createdAt)} />
          </motion.div>

          {/* ── Курьер ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            style={{
              padding: '14px 16px', borderRadius: 16, marginBottom: 12,
              background: '#ffffff04', border: '1px solid #ffffff08',
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 700, color: '#3d5268', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
              Курьер
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 14,
                background: 'rgba(14,165,233,0.1)',
                border: '1px solid rgba(14,165,233,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', flexShrink: 0,
              }}>
                {flight.courierAvatar
                  ? <img src={flight.courierAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <User style={{ width: 20, height: 20, color: '#0ea5e9' }} />
                }
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#e2eaf3', marginBottom: 3 }}>
                  {flight.courierName || 'Курьер'}
                </div>
                {flight.courierRating != null ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Stars rating={flight.courierRating} size={12} />
                    <span style={{ fontSize: 11, color: '#fbbf24', fontWeight: 700 }}>
                      {flight.courierRating}
                    </span>
                    {flight.courierReviewCount ? (
                      <span style={{ fontSize: 10, color: '#3d5268' }}>
                        ({flight.courierReviewCount} отзывов)
                      </span>
                    ) : null}
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <ShieldCheck style={{ width: 11, height: 11, color: '#34d399' }} />
                    <span style={{ fontSize: 10, color: '#34d399', fontWeight: 600 }}>Паспорт подтверждён</span>
                  </div>
                )}
              </div>
              <button
                onClick={() => navigate(`/avia/user/${flight.courierId}`)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '6px 11px', borderRadius: 9,
                  border: '1px solid rgba(14,165,233,0.18)',
                  background: 'rgba(14,165,233,0.08)',
                  color: '#38bdf8', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Профиль <ChevronRight style={{ width: 11, height: 11 }} />
              </button>
            </div>
          </motion.div>

          {/* ── Действия ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.3 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 32 }}
          >
            {/* Кнопки для других пользователей */}
            {canOffer && flight.status === 'active' && (
              <button
                onClick={() => setShowOffer(true)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '14px', borderRadius: 14,
                  background: 'linear-gradient(135deg, #0369a1, #0ea5e9)',
                  border: 'none', color: '#fff', fontSize: 14, fontWeight: 700,
                  cursor: 'pointer', boxShadow: '0 6px 20px rgba(14,165,233,0.25)',
                }}
              >
                <Handshake style={{ width: 16, height: 16 }} />
                Предложить сделку
              </button>
            )}
            {canChat && flight && user && (
              <button
                onClick={() => {
                  const params = new URLSearchParams({
                    chatId:    makeAviaChatId(user.phone, flight.courierId),
                    otherPhone: flight.courierId,
                    adType:    'flight',
                    adId:      flight.id,
                    adFrom:    flight.from,
                    adTo:      flight.to,
                  });
                  navigate(`/avia/messages?${params.toString()}`);
                }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '12px', borderRadius: 14,
                  background: 'rgba(14,165,233,0.08)',
                  border: '1px solid rgba(14,165,233,0.18)',
                  color: '#38bdf8', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                }}
              >
                <MessageCircle style={{ width: 15, height: 15 }} />
                Написать курьеру
              </button>
            )}

            {/* Кнопки владельца */}
            {isMine && (
              <div style={{ display: 'flex', gap: 8 }}>
                {flight.status === 'active' && (
                  <button
                    onClick={handleClose}
                    style={{
                      flex: 1, padding: '11px', borderRadius: 12,
                      background: '#ffffff06', border: '1px solid #ffffff12',
                      color: '#6b8299', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    Закрыть рейс
                  </button>
                )}
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  style={{
                    flex: 1, padding: '11px', borderRadius: 12,
                    background: '#ef444408', border: '1px solid #ef444418',
                    color: '#f87171', fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', opacity: deleting ? 0.6 : 1,
                  }}
                >
                  Удалить
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Модалки */}
      <AnimatePresence>
        {showOffer && flight && user && (
          <AviaDealOfferModal
            me={user}
            flight={flight}
            onClose={() => setShowOffer(false)}
            onSuccess={() => toast.success('Предложение отправлено!')}
            onOpenChat={(chatId, otherPhone, adRef) => {
              setShowOffer(false);
              if (flight && user) {
                const params = new URLSearchParams({
                  chatId: makeAviaChatId(user.phone, flight.courierId),
                  otherPhone: flight.courierId,
                  adType: 'flight', adId: flight.id,
                  adFrom: flight.from, adTo: flight.to,
                });
                navigate(`/avia/messages?${params.toString()}`);
              }
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  REQUEST DETAIL
// ═════════════════════════════════════════════════════════════════════════════

export function AviaRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAvia();
  const [request, setRequest] = useState<AviaRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [showOffer, setShowOffer] = useState(false);
  const [deleting, setDeleting]   = useState(false);

  const load = useCallback(() => {
    if (!id) return;
    setLoading(true);
    getAviaRequest(id)
      .then(r => {
        if (!r) setError('Заявка не найдена');
        else setRequest(r);
      })
      .catch(() => setError('Ошибка загрузки'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const isMine  = request?.senderId === user?.phone;
  const canOffer = !isMine && (user?.role === 'courier' || user?.role === 'both');
  const canChat  = !isMine && !!user;

  const handleDelete = async () => {
    if (!request || !confirm('Удалить эту заявку?')) return;
    setDeleting(true);
    try {
      await deleteAviaRequest(request.id);
      toast.success('Заявка удалена');
      navigate('/avia/dashboard');
    } catch { toast.error('Не удалось удалить'); }
    finally { setDeleting(false); }
  };

  const handleClose = async () => {
    if (!request || !confirm('Закрыть заявку?')) return;
    try {
      await closeAviaRequest(request.id);
      setRequest(prev => prev ? { ...prev, status: 'closed' } : prev);
      toast.success('Заявка закрыта');
    } catch { toast.error('Не удалось закрыть'); }
  };

  const STATUS_META: Record<string, { label: string; color: string }> = {
    active:  { label: 'Активна', color: '#a78bfa' },
    closed:  { label: 'Закрыта', color: '#6b8299' },
    deleted: { label: 'Удалена', color: '#ef4444' },
  };
  const statusMeta = STATUS_META[request?.status || 'active'] || STATUS_META.active;

  return (
    <div style={{ minHeight: '100dvh', background: '#060d18', fontFamily: "'Sora','Inter',sans-serif" }}>
      <style>{`@keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }`}</style>

      {/* Header */}
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
          <div style={{ fontSize: 15, fontWeight: 800, color: '#e2eaf3' }}>Заявка</div>
          {request && (
            <div style={{ fontSize: 10, color: '#3d5268', fontWeight: 600 }}>
              {request.from} → {request.to}
            </div>
          )}
        </div>
        {request && (
          <div style={{
            padding: '4px 10px', borderRadius: 8,
            background: `${statusMeta.color}12`,
            border: `1px solid ${statusMeta.color}22`,
          }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: statusMeta.color }}>
              {statusMeta.label}
            </span>
          </div>
        )}
        <button onClick={load} style={{
          width: 34, height: 34, borderRadius: 10,
          border: '1px solid #ffffff10', background: '#ffffff06',
          color: '#4a6080', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <RefreshCw style={{ width: 13, height: 13 }} />
        </button>
      </motion.div>

      {loading ? <DetailSkeleton /> : error ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <AlertTriangle style={{ width: 32, height: 32, color: '#ef4444', margin: '0 auto 12px' }} />
          <div style={{ color: '#f87171', fontWeight: 700 }}>{error}</div>
        </div>
      ) : request && (
        <div style={{ padding: 'clamp(14px,4vw,20px)', maxWidth: 520, margin: '0 auto' }}>

          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            style={{
              padding: '20px 20px 16px', borderRadius: 20, marginBottom: 12,
              background: 'linear-gradient(145deg, #140c2e, #0d0820)',
              border: '1px solid rgba(167,139,250,0.15)',
              position: 'relative', overflow: 'hidden',
            }}
          >
            <div style={{
              position: 'absolute', top: -20, right: -20, width: 100, height: 100,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(167,139,250,0.1) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 13,
                background: 'rgba(167,139,250,0.12)',
                border: '1px solid rgba(167,139,250,0.22)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Package style={{ width: 18, height: 18, color: '#a78bfa' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16, fontWeight: 800, color: '#e2eaf3' }}>{request.from}</span>
                  <ArrowRight style={{ width: 14, height: 14, color: '#a78bfa' }} />
                  <span style={{ fontSize: 16, fontWeight: 800, color: '#e2eaf3' }}>{request.to}</span>
                </div>
                <div style={{ fontSize: 10, color: '#3d5268', marginTop: 2 }}>
                  Опубликована: {timeSince(request.createdAt)}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { label: 'До даты', value: fmtDate(request.beforeDate), color: '#a78bfa' },
                { label: 'Вес', value: `${request.weightKg} кг`, color: '#34d399' },
              ].map(s => (
                <div key={s.label} style={{
                  flex: 1, padding: '8px', borderRadius: 10,
                  background: `${s.color}08`, border: `1px solid ${s.color}18`,
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#e2eaf3' }}>{s.value}</div>
                  <div style={{ fontSize: 9, color: '#3d5268', fontWeight: 600, textTransform: 'uppercase' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Детали */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.3 }}
            style={{
              padding: '4px 16px', borderRadius: 16, marginBottom: 12,
              background: '#ffffff04', border: '1px solid #ffffff08',
            }}
          >
            <InfoRow icon={MapPin}   label="Откуда"       value={request.from} accent="#a78bfa" />
            <InfoRow icon={MapPin}   label="Куда"         value={request.to} accent="#a78bfa" />
            <InfoRow icon={Calendar} label="Не позднее"   value={fmtDate(request.beforeDate, true)} accent="#34d399" />
            <InfoRow icon={Weight}   label="Вес"          value={`${request.weightKg} кг`} accent="#0ea5e9" />
            {request.description
              ? <InfoRow icon={DollarSign} label="Описание" value={request.description} />
              : null}
            <InfoRow icon={Clock}    label="Создана"      value={fmtDate(request.createdAt, true)} />
          </motion.div>

          {/* Отправитель */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            style={{
              padding: '14px 16px', borderRadius: 16, marginBottom: 12,
              background: '#ffffff04', border: '1px solid #ffffff08',
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 700, color: '#3d5268', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
              Отправитель
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 14,
                background: 'rgba(167,139,250,0.1)',
                border: '1px solid rgba(167,139,250,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', flexShrink: 0,
              }}>
                {request.senderAvatar
                  ? <img src={request.senderAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <User style={{ width: 20, height: 20, color: '#a78bfa' }} />
                }
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#e2eaf3', marginBottom: 3 }}>
                  {request.senderName || 'Отправитель'}
                </div>
                {request.senderRating != null ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Stars rating={request.senderRating} size={12} />
                    <span style={{ fontSize: 11, color: '#fbbf24', fontWeight: 700 }}>
                      {request.senderRating}
                    </span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <ShieldCheck style={{ width: 11, height: 11, color: '#34d399' }} />
                    <span style={{ fontSize: 10, color: '#34d399', fontWeight: 600 }}>Паспорт подтверждён</span>
                  </div>
                )}
              </div>
              <button
                onClick={() => navigate(`/avia/user/${request.senderId}`)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '6px 11px', borderRadius: 9,
                  border: '1px solid rgba(167,139,250,0.18)',
                  background: 'rgba(167,139,250,0.08)',
                  color: '#c4b5fd', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Профиль <ChevronRight style={{ width: 11, height: 11 }} />
              </button>
            </div>
          </motion.div>

          {/* Действия */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.3 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 32 }}
          >
            {canOffer && request.status === 'active' && (
              <button
                onClick={() => setShowOffer(true)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '14px', borderRadius: 14,
                  background: 'linear-gradient(135deg, #6d28d9, #a78bfa)',
                  border: 'none', color: '#fff', fontSize: 14, fontWeight: 700,
                  cursor: 'pointer', boxShadow: '0 6px 20px rgba(167,139,250,0.25)',
                }}
              >
                <Handshake style={{ width: 16, height: 16 }} />
                Предложить доставку
              </button>
            )}
            {canChat && (
              <button
                onClick={() => setShowChat(true)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '12px', borderRadius: 14,
                  background: 'rgba(167,139,250,0.08)',
                  border: '1px solid rgba(167,139,250,0.18)',
                  color: '#c4b5fd', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                }}
              >
                <MessageCircle style={{ width: 15, height: 15 }} />
                Написать отправителю
              </button>
            )}
            {isMine && (
              <div style={{ display: 'flex', gap: 8 }}>
                {request.status === 'active' && (
                  <button onClick={handleClose} style={{
                    flex: 1, padding: '11px', borderRadius: 12,
                    background: '#ffffff06', border: '1px solid #ffffff12',
                    color: '#6b8299', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  }}>
                    Закрыть
                  </button>
                )}
                <button onClick={handleDelete} disabled={deleting} style={{
                  flex: 1, padding: '11px', borderRadius: 12,
                  background: '#ef444408', border: '1px solid #ef444418',
                  color: '#f87171', fontSize: 12, fontWeight: 600,
                  cursor: 'pointer', opacity: deleting ? 0.6 : 1,
                }}>
                  Удалить
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}

      <AnimatePresence>
        {showOffer && request && user && (
          <AviaDealOfferModal
            me={user}
            request={request}
            onClose={() => setShowOffer(false)}
            onSuccess={() => toast.success('Предложение отправлено!')}
            onOpenChat={(_chatId, _otherPhone) => {
              setShowOffer(false);
              setShowChat(true);
            }}
          />
        )}
      </AnimatePresence>

      {showChat && request && user && (
        <AviaChatDrawer
          chatId={makeAviaChatId(user.phone, request.senderId)}
          myPhone={user.phone}
          otherPhone={request.senderId}
          adRef={{ type: 'request', id: request.id, from: request.from, to: request.to }}
          onClose={() => setShowChat(false)}
        />
      )}
    </div>
  );
}
