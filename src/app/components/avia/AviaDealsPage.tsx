import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, Handshake, Plane, Package, ArrowRight,
  CheckCircle2, XCircle, Clock, ThumbsUp, RefreshCw,
  Loader2, MessageCircle, Scale, DollarSign,
  ChevronRight, ChevronDown, Bell, Camera, Info, ClipboardList, Users, Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAvia } from './AviaContext';
import {
  getAviaDeals,
  acceptAviaDeal,
  rejectAviaDeal,
  cancelAviaDeal,
  completeAviaDeal,
  uploadAviaDealPOD,
  deleteAviaDealsByIds,
} from '../../api/aviaDealApi';
import type { AviaDeal, AviaDealStatus, AviaPODPhoto, AviaPODPhotoType } from '../../api/aviaDealApi';
import { makeAviaChatId } from '../../api/aviaChatApi';
import { AviaReviewModal } from './AviaReviewModal';
import { getAviaDealReviewStatusBatch } from '../../api/aviaReviewApi';

// ── Статус ────────────────────────────────────────────────────────────────────

const STATUS_META: Record<AviaDealStatus, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  pending:   { label: 'Ожидание',  color: '#f59e0b', bg: '#f59e0b14', icon: Clock        },
  accepted:  { label: 'Активна',   color: '#34d399', bg: '#34d39914', icon: CheckCircle2 },
  rejected:  { label: 'Отклонена', color: '#ef4444', bg: '#ef444414', icon: XCircle      },
  cancelled: { label: 'Отменена',  color: '#6b7280', bg: '#6b728014', icon: XCircle      },
  completed: { label: 'Завершена', color: '#a78bfa', bg: '#a78bfa14', icon: CheckCircle2 },
};

type TabId = 'active' | 'completed' | 'cancelled';

const TABS: { id: TabId; label: string; color: string }[] = [
  { id: 'active',    label: 'Активные',    color: '#34d399' },
  { id: 'completed', label: 'Завершённые', color: '#a78bfa' },
  { id: 'cancelled', label: 'Отменённые',  color: '#6b8299' },
];

// Для рейсовых сделок отдельная сделка считается «по-настоящему» завершённой
// только когда курьер закрыл весь рейс кнопкой «Завершить поездку» — до этого
// момента сделка показывается активной, даже если получение/передача уже отмечены.
// flightStatus подмешивается бэкендом в /avia/deals/user/:phone (см. aviaRoutes.tsx) —
// прямой запрос статуса рейса с клиента не работает для не-владельца (IDOR-защита).
function effectiveDealStatus(d: AviaDeal): AviaDealStatus {
  if (d.status === 'completed' && d.adType === 'flight' && d.flightStatus && d.flightStatus !== 'completed') {
    return 'accepted';
  }
  return d.status;
}

function dealBucket(d: AviaDeal): TabId {
  const status = effectiveDealStatus(d);
  if (status === 'cancelled' || status === 'rejected') return 'cancelled';
  if (status === 'completed') return 'completed';
  return 'active';
}

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  } catch { return iso; }
}

function fmtDateTime(iso: string) {
  try {
    return new Date(iso).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
}

const POD_META: Record<AviaPODPhotoType, { label: string; shortLabel: string }> = {
  pickup:   { label: 'Фото получения товара от отправителя', shortLabel: 'Получение' },
  delivery: { label: 'Фото передачи товара получателю',      shortLabel: 'Передача'  },
};

function maskPhone(phone: string) {
  const d = phone.replace(/\D/g, '');
  if (d.length < 7) return `+${d}`;
  return `+${d.slice(0, 3)} *** ${d.slice(-4)}`;
}

// ── Карточка сделки ──────────────────────────────────────────────────────────

function DealCard({
  deal,
  myPhone,
  onAccept, onReject, onCancel, onComplete, onOpenChat, onReview, onPODUploaded, onDeleteStuck,
  alreadyReviewed,
}: {
  deal: AviaDeal;
  myPhone: string;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onCancel: (id: string) => void;
  onComplete: (id: string) => void;
  onDeleteStuck: (id: string) => void;
  onOpenChat: (otherPhone: string) => void;
  onReview: (deal: AviaDeal) => void;
  onPODUploaded: (dealId: string, photo: AviaPODPhoto) => void;
  alreadyReviewed: boolean;
}) {
  // Suppress unused var warnings — actions now happen in chat for pending deals
  void onAccept; void onReject; void onCancel;
  const navigate = useNavigate();
  const [acting, setActing] = useState<string | null>(null);
  const [uploadingPOD, setUploadingPOD] = useState<AviaPODPhotoType | null>(null);
  const [expanded, setExpanded] = useState(false);
  const pickupInputRef = useRef<HTMLInputElement>(null);
  const deliveryInputRef = useRef<HTMLInputElement>(null);
  const displayStatus = effectiveDealStatus(deal);
  const statusMeta = STATUS_META[displayStatus];
  const StatusIcon = statusMeta.icon;

  const cleanMyPhone   = myPhone.replace(/\D/g, '');
  const isInitiator    = deal.initiatorPhone === cleanMyPhone;
  const isRecipient    = deal.recipientPhone === cleanMyPhone;
  const isCourier       = deal.courierId === cleanMyPhone;
  const adIsFlightType = deal.adType === 'flight';
  const AdIcon         = adIsFlightType ? Plane : Package;
  const adColor        = adIsFlightType ? '#0ea5e9' : '#a78bfa';

  const otherPhone = isInitiator ? deal.recipientPhone : deal.initiatorPhone;

  const podPhotos      = deal.podPhotos || [];
  const pickupPhotos   = podPhotos.filter(p => p.type === 'pickup');
  const deliveryPhotos = podPhotos.filter(p => p.type === 'delivery');
  const hasPickup       = pickupPhotos.length > 0;
  const hasDelivery     = deliveryPhotos.length > 0;
  const canComplete     = hasPickup && hasDelivery;
  // Рейсовые сделки в работе/завершённые — вся детализация (фото, действия) переехала
  // на страницу манифеста рейса, на карточке остаётся только переход туда
  const useManifestButton = adIsFlightType && (deal.status === 'accepted' || deal.status === 'completed');
  // У манифеста рейса есть собственная IDOR-защита для не-владельца: если рейс уже
  // не активен (закрыт/завершён) — отправителю манифест недоступен («Рейс не найден»),
  // только курьеру. Даём отправителю возможность убрать такую зависшую карточку.
  const manifestStuckForMe = useManifestButton && !isCourier && !!deal.flightStatus && deal.flightStatus !== 'active';

  const handleDeleteStuck = async () => {
    if (!window.confirm('Удалить эту сделку из списка? Действие необратимо.')) return;
    setActing('deleteStuck');
    try { onDeleteStuck(deal.id); } finally { setActing(null); }
  };

  const act = async (action: string, fn: () => void | Promise<any>) => {
    setActing(action);
    try {
      await fn();
    } finally {
      setActing(null);
    }
  };

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

  const isFinal = ['rejected', 'cancelled', 'completed'].includes(displayStatus);
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', minWidth: 0 }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: '#fff', overflowWrap: 'anywhere' }}>{deal.adFrom}</span>
          <ArrowRight style={{ width: 12, height: 12, color: '#4a6080', flexShrink: 0 }} />
          <span style={{ fontSize: 14, fontWeight: 800, color: '#fff', overflowWrap: 'anywhere' }}>{deal.adTo}</span>
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

      {useManifestButton ? (
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => navigate(`/avia/flight/${deal.adId}/manifest`)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              flex: 1, padding: '10px 14px', borderRadius: 12,
              border: '1px solid rgba(167,139,250,0.22)', background: 'rgba(167,139,250,0.08)',
              color: '#a78bfa', fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
            }}
          >
            <ClipboardList style={{ width: 14, height: 14 }} />
            Манифест
          </button>
          {manifestStuckForMe && (
            <button
              onClick={handleDeleteStuck}
              disabled={acting === 'deleteStuck'}
              title="Манифест этого рейса вам недоступен — можно удалить сделку из списка"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '10px 14px', borderRadius: 12,
                border: '1px solid rgba(239,68,68,0.22)', background: 'rgba(239,68,68,0.08)',
                color: '#ef4444', cursor: 'pointer', opacity: acting === 'deleteStuck' ? 0.6 : 1,
              }}
            >
              {acting === 'deleteStuck'
                ? <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />
                : <Trash2 style={{ width: 14, height: 14 }} />}
            </button>
          )}
        </div>
      ) : (
        <>
      {/* Чекпоинты: получение от отправителя / передача получателю — видно обеим сторонам */}
      {(deal.status === 'accepted' || deal.status === 'completed') && (
        <div style={{ marginBottom: 8, display: 'flex', flexDirection: 'column', gap: 5 }}>
          {(['pickup', 'delivery'] as AviaPODPhotoType[]).map(type => {
            const photos = type === 'pickup' ? pickupPhotos : deliveryPhotos;
            const inputRef = type === 'pickup' ? pickupInputRef : deliveryInputRef;
            const meta = POD_META[type];
            const done = photos.length > 0;
            const canUpload = isCourier && deal.status === 'accepted';
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
                  <a key={p.path || i} href={p.url} target="_blank" rel="noreferrer">
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

      {/* Подробнее — полная информация о сделке, видно обеим сторонам */}
      <button
        onClick={() => setExpanded(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8,
          padding: '4px 9px', borderRadius: 7, cursor: 'pointer',
          border: '1px solid #ffffff0e', background: 'transparent',
          color: '#6b8299', fontSize: 10.5, fontWeight: 700,
        }}
      >
        <Info style={{ width: 10, height: 10 }} />
        Подробнее
        <ChevronDown style={{ width: 10, height: 10, transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {expanded && (
        <div style={{
          marginBottom: 10, padding: '10px 12px', borderRadius: 12,
          background: '#ffffff05', border: '1px solid #ffffff0a',
          display: 'flex', flexDirection: 'column', gap: 6,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5 }}>
            <span style={{ color: '#4a6080' }}>Отправитель</span>
            <span style={{ color: '#fff', fontWeight: 600 }}>
              {deal.senderId === cleanMyPhone ? 'Вы' : (deal.senderName || maskPhone(deal.senderId))}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5 }}>
            <span style={{ color: '#4a6080' }}>Курьер</span>
            <span style={{ color: '#fff', fontWeight: 600 }}>
              {isCourier ? 'Вы' : (deal.courierName || maskPhone(deal.courierId))}
            </span>
          </div>
          <div style={{ height: 1, background: '#ffffff08', margin: '2px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
            <span style={{ color: '#4a6080' }}>Создана</span>
            <span style={{ color: '#6b8299' }}>{fmtDateTime(deal.createdAt)}</span>
          </div>
          {deal.acceptedAt && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
              <span style={{ color: '#4a6080' }}>Принята</span>
              <span style={{ color: '#6b8299' }}>{fmtDateTime(deal.acceptedAt)}</span>
            </div>
          )}
          {hasPickup && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
              <span style={{ color: '#4a6080' }}>Получение товара</span>
              <span style={{ color: '#6b8299' }}>{fmtDateTime(pickupPhotos[0].timestamp)}</span>
            </div>
          )}
          {hasDelivery && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
              <span style={{ color: '#4a6080' }}>Передача получателю</span>
              <span style={{ color: '#6b8299' }}>{fmtDateTime(deliveryPhotos[0].timestamp)}</span>
            </div>
          )}
          {deal.completedAt && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
              <span style={{ color: '#4a6080' }}>Завершена</span>
              <span style={{ color: '#6b8299' }}>{fmtDateTime(deal.completedAt)}</span>
            </div>
          )}
        </div>
      )}

      {/* Parties */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 10, borderTop: '1px solid #ffffff08',
        gap: 8, flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <div style={{
            width: 22, height: 22, borderRadius: 7, flexShrink: 0,
            background: '#ffffff0a',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ChevronRight style={{ width: 10, height: 10, color: '#4a6080' }} />
          </div>
          <span style={{
            fontSize: 11, color: '#4a6080', fontWeight: 600,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {isInitiator ? 'Вы' : (deal.initiatorName || maskPhone(deal.initiatorPhone))}
            {' → '}
            {isRecipient ? 'Вам' : (deal.recipientName || maskPhone(deal.recipientPhone))}
          </span>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
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

          {/* Только курьер может завершить сделку, и только после фото получения + передачи */}
          {isCourier && deal.status === 'accepted' && (
            <motion.button
              whileTap={canComplete ? { scale: 0.93 } : undefined}
              disabled={!!acting || !canComplete}
              title={canComplete ? undefined : 'Сначала добавьте фото получения и передачи товара'}
              onClick={() => act('complete', () => onComplete(deal.id))}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '5px 11px', borderRadius: 8, cursor: canComplete ? 'pointer' : 'not-allowed',
                border: '1px solid #a78bfa28',
                background: '#a78bfa10',
                color: '#a78bfa', fontSize: 11, fontWeight: 700,
                opacity: acting ? 0.6 : (canComplete ? 1 : 0.4),
              }}
            >
              {acting === 'complete'
                ? <Loader2 style={{ width: 11, height: 11, animation: 'spin 1s linear infinite' }} />
                : <CheckCircle2 style={{ width: 11, height: 11 }} />}
              Завершить
            </motion.button>
          )}

          {/* Только для завершённых сделок — кнопка отзыва */}
          {deal.status === 'completed' && !alreadyReviewed && (
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
          {deal.status === 'completed' && alreadyReviewed && (
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
        </>
      )}
    </motion.div>
  );
}

// ── Карточка рейса с несколькими отправителями ────────────────────────────────
// Когда у одного рейса несколько принятых/завершённых сделок (разные отправители),
// показываем одну карточку рейса вместо дублей — детали каждого отправителя (фото
// получения/передачи) находятся на странице манифеста.
function FlightGroupCard({ deals }: { deals: AviaDeal[] }) {
  const navigate = useNavigate();
  const first = deals[0];
  const allCompleted = deals.every(d => effectiveDealStatus(d) === 'completed');
  const statusMeta = allCompleted ? STATUS_META.completed : STATUS_META.accepted;
  const StatusIcon = statusMeta.icon;
  const totalWeight = deals.reduce((sum, d) => sum + (d.weightKg || 0), 0);
  const totalPrice = deals.reduce((sum, d) => sum + (d.price || 0), 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.25 }}
      style={{
        padding: '14px 16px', borderRadius: 18, marginBottom: 10,
        background: '#ffffff07', border: '1px solid #0ea5e918',
        position: 'relative',
      }}
    >
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

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, paddingRight: 80 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 10,
          background: '#0ea5e912',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Plane style={{ width: 14, height: 14, color: '#0ea5e9' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', minWidth: 0 }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: '#fff', overflowWrap: 'anywhere' }}>{first.adFrom}</span>
          <ArrowRight style={{ width: 12, height: 12, color: '#4a6080', flexShrink: 0 }} />
          <span style={{ fontSize: 14, fontWeight: 800, color: '#fff', overflowWrap: 'anywhere' }}>{first.adTo}</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Users style={{ width: 11, height: 11, color: '#4a6080' }} />
          <span style={{ fontSize: 12, color: '#6b8299', fontWeight: 600 }}>{deals.length} отправителя</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Scale style={{ width: 11, height: 11, color: '#4a6080' }} />
          <span style={{ fontSize: 12, color: '#6b8299', fontWeight: 600 }}>{totalWeight} кг</span>
        </div>
        {totalPrice > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <DollarSign style={{ width: 11, height: 11, color: '#4a6080' }} />
            <span style={{ fontSize: 12, color: '#34d399', fontWeight: 700 }}>
              {totalPrice} {first.currency || 'USD'}
            </span>
          </div>
        )}
        {first.adDate && (
          <span style={{ fontSize: 11, color: '#4a6080', fontWeight: 600, marginLeft: 'auto' }}>
            Рейс: {fmtDate(first.adDate)}
          </span>
        )}
      </div>

      <button
        onClick={() => navigate(`/avia/flight/${first.adId}/manifest`)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          width: '100%', padding: '10px 14px', borderRadius: 12,
          border: '1px solid rgba(167,139,250,0.22)', background: 'rgba(167,139,250,0.08)',
          color: '#a78bfa', fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
        }}
      >
        <ClipboardList style={{ width: 14, height: 14 }} />
        Манифест
      </button>
    </motion.div>
  );
}

// ── Главный компонент ─────────────────────────────────────────────────────────

export function AviaDealsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dealIdParam = searchParams.get('dealId');
  const { user, isAuth, unreadCount } = useAvia();

  const [deals, setDeals] = useState<AviaDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('active');
  const [highlightDealId, setHighlightDealId] = useState<string | null>(null);
  const DEALS_PAGE_SIZE = 20;
  const [visibleCount, setVisibleCount] = useState(DEALS_PAGE_SIZE);

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

      // загружаем статусы отзывов только для завершённых сделок (1 batch-запрос вместо N)
      const completed = data.filter(d => d.status === 'completed');
      const statusMap = await getAviaDealReviewStatusBatch(completed.map(d => d.id));
      const statuses: Record<string, boolean> = {};
      for (const d of completed) {
        const s = statusMap[d.id] || {};
        const isInit = d.initiatorPhone === myPhone;
        statuses[d.id] = isInit ? !!s.byInitiator : !!s.byRecipient;
      }
      setReviewedDeals(statuses);
    } catch {
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

  // ── Открытие конкретной сделки по ?dealId= (например, после попытки создать
  // дубль предложения — backend вернул 409 и id уже существующей сделки) ──────
  useEffect(() => {
    if (!dealIdParam || loading || deals.length === 0) return;
    const target = deals.find(d => d.id === dealIdParam);
    if (!target) return;
    setActiveTab(dealBucket(target));
    setHighlightDealId(dealIdParam);
    // Сделка может быть за пределами текущей "страницы" — показываем весь список вкладки
    setVisibleCount(Number.MAX_SAFE_INTEGER);
    const scrollTimer = setTimeout(() => {
      document.getElementById(`deal-${dealIdParam}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
    const clearTimer = setTimeout(() => setHighlightDealId(null), 2500);
    return () => { clearTimeout(scrollTimer); clearTimeout(clearTimer); };
  }, [dealIdParam, loading, deals]);

  // ── Фильтрация ────────────────────────────────────────────────────────────
  const filtered = deals.filter(d => dealBucket(d) === activeTab);

  // ── Группировка по рейсу ─────────────────────────────────────────────────
  // У одного рейса может быть несколько принятых/завершённых сделок (разные
  // отправители) — показываем их одной карточкой рейса, а не дублями.
  type RenderItem = { kind: 'single'; deal: AviaDeal } | { kind: 'flightGroup'; deals: AviaDeal[] };
  const renderItems = useMemo<RenderItem[]>(() => {
    const items: RenderItem[] = [];
    const handledFlightIds = new Set<string>();
    for (const deal of filtered) {
      const manifestEligible = deal.adType === 'flight' && (deal.status === 'accepted' || deal.status === 'completed');
      if (!manifestEligible) {
        items.push({ kind: 'single', deal });
        continue;
      }
      if (handledFlightIds.has(deal.adId)) continue;
      handledFlightIds.add(deal.adId);
      const group = filtered.filter(d =>
        d.adType === 'flight' && d.adId === deal.adId &&
        (d.status === 'accepted' || d.status === 'completed')
      );
      items.push(group.length > 1 ? { kind: 'flightGroup', deals: group } : { kind: 'single', deal: group[0] });
    }
    return items;
  }, [filtered]);

  // ── Пагинация ("Показать ещё") — список может расти неограниченно ──────────
  useEffect(() => { setVisibleCount(DEALS_PAGE_SIZE); }, [activeTab]);
  const visibleItems = renderItems.slice(0, visibleCount);
  const hasMore = renderItems.length > visibleItems.length;

  // ── Badges ────────────────────────────────────────────────────────────────
  const activeCount    = deals.filter(d => dealBucket(d) === 'active').length;
  const completedCount = deals.filter(d => dealBucket(d) === 'completed').length;
  const cancelledCount = deals.filter(d => dealBucket(d) === 'cancelled').length;

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

  const handleDeleteStuck = async (id: string) => {
    const res = await deleteAviaDealsByIds([id], myPhone);
    if (!res.success) { toast.error(res.error || 'Ошибка удаления'); return; }
    toast('Сделка удалена');
    setDeals(prev => prev.filter(d => d.id !== id));
  };

  const handleOpenChat = (otherPhone: string) => {
    const chatId = makeAviaChatId(myPhone, otherPhone);
    const params = new URLSearchParams({ chatId, otherPhone });
    navigate(`/avia/messages?${params.toString()}`);
  };

  const handleReview = (deal: AviaDeal) => setReviewDeal(deal);

  const handlePODUploaded = (dealId: string, photo: AviaPODPhoto) => {
    setDeals(prev => prev.map(d => d.id === dealId ? { ...d, podPhotos: [...(d.podPhotos || []), photo] } : d));
  };

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
          <RefreshCw style={{ width: 14, height: 14 }} className={refreshing ? 'animate-spin' : ''} />
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
            const badge = tab.id === 'active' ? activeCount : tab.id === 'completed' ? completedCount : cancelledCount;
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
        ) : renderItems.length === 0 ? (
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
              {activeTab === 'active'
                ? 'Активных сделок нет.\nПредложите сделку на рейсе или заявке — она появится здесь.'
                : activeTab === 'completed'
                ? 'Завершённых сделок пока нет.'
                : 'Отменённых и отклонённых сделок нет.'}
            </p>
          </motion.div>
        ) : (
          <>
            <AnimatePresence>
              {visibleItems.map(item => item.kind === 'flightGroup' ? (
                <FlightGroupCard key={`flight-${item.deals[0].adId}`} deals={item.deals} />
              ) : (
                <div
                  key={item.deal.id}
                  id={`deal-${item.deal.id}`}
                  style={highlightDealId === item.deal.id ? {
                    borderRadius: 20, outline: '2px solid #34d399', outlineOffset: 2,
                    transition: 'outline-color 0.3s',
                  } : undefined}
                >
                  <DealCard
                    deal={item.deal}
                    myPhone={myPhone}
                    onAccept={handleAccept}
                    onReject={handleReject}
                    onCancel={handleCancel}
                    onComplete={handleComplete}
                    onOpenChat={handleOpenChat}
                    onReview={handleReview}
                    onPODUploaded={handlePODUploaded}
                    onDeleteStuck={handleDeleteStuck}
                    alreadyReviewed={!!reviewedDeals[item.deal.id]}
                  />
                </div>
              ))}
            </AnimatePresence>
            {hasMore && (
              <button
                onClick={() => setVisibleCount(c => c + DEALS_PAGE_SIZE)}
                style={{
                  display: 'block', width: '100%', marginTop: 4, padding: '12px',
                  borderRadius: 14, border: '1px solid #ffffff10', background: '#ffffff06',
                  color: '#8aa3ba', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                }}
              >
                Показать ещё ({renderItems.length - visibleItems.length})
              </button>
            )}
          </>
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