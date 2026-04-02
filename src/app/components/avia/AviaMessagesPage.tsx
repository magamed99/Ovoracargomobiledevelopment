/**
 * AviaMessagesPage — полноценная страница чатов AVIA.
 *
 * Desktop (md+): 2-колонка — список чатов слева (320px) + активный чат справа.
 * Mobile (<md):  переключение list ↔ chat как в Telegram (полноэкранный режим).
 *
 * URL-параметры для deep-link к конкретному чату:
 *   ?chatId=XXX&otherPhone=YYY&adType=flight|request&adId=ZZZ&adFrom=AAA&adTo=BBB&adDate=YYYY-MM-DD
 */
import {
  useState, useEffect, useRef, useCallback, useMemo,
} from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, MessageCircle, Send, User,
  Plane, Package, MessagesSquare, Clock,
  CheckCircle2, XCircle, AlertCircle,
  ArrowRight, Scale, DollarSign, Loader2, Ban, Star, Trash2, ThumbsUp,
} from 'lucide-react';
import { toast } from 'sonner';
import type { AviaChatMessage, AviaChat, AviaChatAdRef } from '../../api/aviaChatApi';
import {
  initAviaChat, getAviaChatMessages, sendAviaChatMessage,
  markAviaChatSeen, getAviaUserChats, makeAviaChatId, deleteAviaChat,
} from '../../api/aviaChatApi';
import { getAviaDeal, acceptAviaDeal, rejectAviaDeal, cancelAviaDeal } from '../../api/aviaDealApi';
import type { AviaDeal } from '../../api/aviaDealApi';
import { getAviaDealReviewStatus } from '../../api/aviaReviewApi';
import { AviaReviewModal } from './AviaReviewModal';
import { useAvia } from './AviaContext';

// ── Хелперы ──────────────────────────────────────────────────────────────────

function maskPhone(phone: string): string {
  const d = phone.replace(/\D/g, '');
  if (d.length < 7) return `+${d}`;
  return `+${d.slice(0, 3)} *** ${d.slice(-4)}`;
}

function relTime(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const s = Math.floor(diff / 1000);
    if (s < 60)  return 'только что';
    const m = Math.floor(s / 60);
    if (m < 60)  return `${m} мин`;
    const h = Math.floor(m / 60);
    if (h < 24)  return `${h} ч`;
    const dd = Math.floor(h / 24);
    if (dd < 7)  return `${dd} дн`;
    return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  } catch { return ''; }
}

function fmtTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
}

function fmtDate(iso: string): string {
  try {
    const d   = new Date(iso);
    const now = new Date();
    const isToday     = d.toDateString() === now.toDateString();
    const yesterday   = new Date(now); yesterday.setDate(now.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();
    if (isToday)     return 'Сегодня';
    if (isYesterday) return 'Вчера';
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  } catch { return ''; }
}

// ── Bubble: системный статус сделки ──────────────────────────────────────────

const DEAL_STATUS_MAP: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  accepted:  { label: 'Принято',   color: '#34d399', icon: CheckCircle2 },
  rejected:  { label: 'Отклонено', color: '#f87171', icon: XCircle     },
  cancelled: { label: 'Отменено',  color: '#f87171', icon: Ban         },
  completed: { label: 'Завершено', color: '#fbbf24', icon: Star        },
};

function DealUpdateBubble({ msg }: { msg: AviaChatMessage }) {
  const status = msg.meta?.status || 'unknown';
  const info   = DEAL_STATUS_MAP[status];
  const Icon   = info?.icon || AlertCircle;
  const color  = info?.color || '#6b8299';
  const label  = info?.label || status;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, margin: '10px 0', padding: '8px 14px' }}>
      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, background: `${color}10`, border: `1px solid ${color}25` }}>
        <Icon style={{ width: 12, height: 12, color }} />
        <span style={{ fontSize: 11, fontWeight: 700, color }}>{`Сделка: ${label}`}</span>
      </div>
      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
    </div>
  );
}

// ── Bubble: предложение о сделке ─────────────────────────────────────────────

function DealOfferBubble({ msg, myPhone }: { msg: AviaChatMessage; myPhone: string }) {
  const [deal, setDeal]               = useState<AviaDeal | null>(null);
  const [loading, setLoading]         = useState(true);
  const [acting, setActing]           = useState<'accept' | 'reject' | 'cancel' | null>(null);
  const [showReject, setShowReject]   = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [reviewChecked, setReviewChecked]     = useState(false);

  const isMine      = msg.senderPhone === myPhone;
  const meta        = msg.meta;
  const accentColor = meta?.adType === 'request' ? '#a78bfa' : '#0ea5e9';
  const AdIcon      = meta?.adType === 'request' ? Package : Plane;

  useEffect(() => {
    if (!meta?.dealId) { setLoading(false); return; }
    getAviaDeal(meta.dealId).then(d => { setDeal(d); setLoading(false); });
  }, [meta?.dealId]);

  useEffect(() => {
    if (!meta?.dealId || !deal) return;
    if (!['accepted', 'completed', 'cancelled', 'rejected'].includes(deal.status ?? '')) return;
    if (reviewChecked) return;
    getAviaDealReviewStatus(meta.dealId).then(st => {
      const cleanMy = myPhone.replace(/\D/g, '');
      const isInit  = deal.initiatorPhone === cleanMy;
      setAlreadyReviewed(isInit ? !!st.byInitiator : !!st.byRecipient);
      setReviewChecked(true);
    });
  }, [meta?.dealId, deal?.status, reviewChecked]);

  useEffect(() => {
    if (!meta?.dealId || !deal || deal.status !== 'pending') return;
    const timer = setInterval(async () => {
      const fresh = await getAviaDeal(meta.dealId!);
      if (fresh && fresh.status !== deal.status) setDeal(fresh);
    }, 4_000);
    return () => clearInterval(timer);
  }, [meta?.dealId, deal?.status]);

  const handleAccept = async () => {
    if (!deal || acting) return;
    setActing('accept');
    const result = await acceptAviaDeal(deal.id, myPhone);
    if (result.success) {
      setDeal(result.deal || { ...deal, status: 'accepted' });
      toast.success('Предложение принято!');
    } else toast.error(result.error || 'Ошибка');
    setActing(null);
  };

  const handleReject = async () => {
    if (!deal || acting) return;
    setActing('reject');
    const result = await rejectAviaDeal(deal.id, myPhone, rejectReason.trim());
    if (result.success) {
      setDeal(result.deal || { ...deal, status: 'rejected' });
      toast.success('Предложение отклонено');
      setShowReject(false);
    } else toast.error(result.error || 'Ошибка');
    setActing(null);
  };

  const handleCancel = async () => {
    if (!deal || acting) return;
    if (!confirm('Отменить предложение о сделке?')) return;
    setActing('cancel');
    const result = await cancelAviaDeal(deal.id, myPhone);
    if (result.success) {
      setDeal(result.deal || { ...deal, status: 'cancelled' });
      toast('Предложение отменено');
    } else toast.error(result.error || 'Ошибка отмены');
    setActing(null);
  };

  const status      = deal?.status;
  const isPending   = status === 'pending';
  const amRecipient = deal?.recipientPhone === myPhone.replace(/\D/g, '');
  const amInitiator = deal?.initiatorPhone === myPhone.replace(/\D/g, '');

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', marginBottom: 10 }}
      >
        <div style={{ maxWidth: '88%', borderRadius: 16, background: isMine ? 'rgba(3,105,161,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${isMine ? 'rgba(14,165,233,0.25)' : 'rgba(255,255,255,0.09)'}`, overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 13px 8px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: `${accentColor}08` }}>
            <div style={{ width: 26, height: 26, borderRadius: 8, flexShrink: 0, background: `${accentColor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AdIcon style={{ width: 12, height: 12, color: accentColor }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#e2eaf3' }}>Предложение о сделке</div>
              <div style={{ fontSize: 9, color: '#4a6080', fontWeight: 600 }}>{meta?.adType === 'request' ? '📦 Заявка' : '✈ Рейс'}</div>
            </div>
            {!loading && status && status !== 'pending' && (() => {
              const s = DEAL_STATUS_MAP[status];
              const SIcon = s?.icon || AlertCircle;
              return s ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 10, background: `${s.color}15`, border: `1px solid ${s.color}30` }}>
                  <SIcon style={{ width: 10, height: 10, color: s.color }} />
                  <span style={{ fontSize: 9, fontWeight: 800, color: s.color }}>{s.label}</span>
                </div>
              ) : null;
            })()}
          </div>
          {/* Body */}
          <div style={{ padding: '10px 13px' }}>
            {meta?.adFrom && meta?.adTo && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#e2eaf3' }}>{meta.adFrom}</span>
                <ArrowRight style={{ width: 11, height: 11, color: accentColor, flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 800, color: '#e2eaf3' }}>{meta.adTo}</span>
                {meta.adDate && (
                  <span style={{ fontSize: 10, color: '#4a6080', marginLeft: 'auto', fontWeight: 600, flexShrink: 0 }}>
                    {new Date(meta.adDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                  </span>
                )}
              </div>
            )}
            <div style={{ display: 'flex', gap: 6, marginBottom: meta?.message ? 8 : 0 }}>
              {meta?.weightKg != null && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 9px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <Scale style={{ width: 10, height: 10, color: '#6b8299' }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#c8daea' }}>{meta.weightKg} кг</span>
                </div>
              )}
              {meta?.price != null && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 9px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <DollarSign style={{ width: 10, height: 10, color: '#6b8299' }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#c8daea' }}>{meta.price} {meta.currency || 'USD'}</span>
                </div>
              )}
            </div>
            {meta?.message && (
              <div style={{ fontSize: 12, color: '#8aa3ba', lineHeight: 1.45, fontStyle: 'italic', marginTop: 6 }}>«{meta.message}»</div>
            )}
            {!loading && isPending && amRecipient && !isMine && (
              <AnimatePresence>
                {!showReject ? (
                  <motion.div key="actions" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                    <button onClick={handleAccept} disabled={!!acting} style={{ flex: 1, padding: '8px', borderRadius: 10, background: acting === 'accept' ? '#ffffff10' : 'linear-gradient(135deg, #059669, #34d399)', border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: acting ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, boxShadow: acting ? 'none' : '0 4px 14px rgba(52,211,153,0.3)' }}>
                      {acting === 'accept' ? <Loader2 style={{ width: 12, height: 12, animation: 'spin 1s linear infinite' }} /> : <CheckCircle2 style={{ width: 12, height: 12 }} />}
                      Принять
                    </button>
                    <button onClick={() => setShowReject(true)} disabled={!!acting} style={{ flex: 1, padding: '8px', borderRadius: 10, background: '#ef444410', border: '1px solid #ef444430', color: '#f87171', fontSize: 12, fontWeight: 700, cursor: acting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                      <XCircle style={{ width: 12, height: 12 }} />
                      Отклонить
                    </button>
                  </motion.div>
                ) : (
                  <motion.div key="reject-form" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} style={{ marginTop: 10 }}>
                    <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Причина (необязательно)..." rows={2} style={{ width: '100%', padding: '8px 10px', borderRadius: 9, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#e2eaf3', fontSize: 12, fontWeight: 500, outline: 'none', resize: 'none', boxSizing: 'border-box' }} />
                    <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                      <button onClick={() => setShowReject(false)} style={{ flex: 1, padding: '7px', borderRadius: 9, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#6b8299', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Отмена</button>
                      <button onClick={handleReject} disabled={!!acting} style={{ flex: 1, padding: '7px', borderRadius: 9, background: '#ef444414', border: '1px solid #ef444430', color: '#f87171', fontSize: 11, fontWeight: 700, cursor: acting ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                        {acting === 'reject' ? <Loader2 style={{ width: 11, height: 11, animation: 'spin 1s linear infinite' }} /> : null}
                        Подтвердить
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
            {!loading && isPending && (isMine || amInitiator) && !amRecipient && (
              <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 10 }}>
                <div style={{ fontSize: 10, color: '#4a6080', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
                  <Clock style={{ width: 10, height: 10 }} />
                  Ожидает ответа
                </div>
                <button onClick={handleCancel} disabled={!!acting} style={{ width: '100%', padding: '7px', borderRadius: 9, cursor: acting ? 'wait' : 'pointer', background: '#ffffff06', border: '1px solid #ffffff10', color: '#6b8299', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, opacity: acting ? 0.5 : 1 }}>
                  {acting === 'cancel' ? <Loader2 style={{ width: 11, height: 11, animation: 'spin 1s linear infinite' }} /> : <XCircle style={{ width: 11, height: 11 }} />}
                  Отменить предложение
                </button>
              </motion.div>
            )}
          </div>
          {!loading && deal && ['accepted', 'completed', 'cancelled', 'rejected'].includes(deal.status ?? '') && reviewChecked && (
            <div style={{ padding: '0 13px 10px' }}>
              {alreadyReviewed ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 10, background: '#34d39910', border: '1px solid #34d39925' }}>
                  <CheckCircle2 style={{ width: 11, height: 11, color: '#34d399' }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#34d399' }}>Отзыв оставлен</span>
                </div>
              ) : (
                <motion.button whileTap={{ scale: 0.96 }} onClick={e => { e.stopPropagation(); setShowReviewModal(true); }} style={{ width: '100%', padding: '8px 12px', borderRadius: 10, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)', color: '#fbbf24', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxSizing: 'border-box' }}>
                  <ThumbsUp style={{ width: 13, height: 13 }} />
                  Оставить отзыв
                </motion.button>
              )}
            </div>
          )}
          <div style={{ padding: '0 13px 8px', fontSize: 9, color: '#2a3d50', fontWeight: 500, textAlign: 'right' }}>{fmtTime(msg.createdAt)}</div>
        </div>
      </motion.div>
      {showReviewModal && deal && (
        <AviaReviewModal deal={deal} myPhone={myPhone} onClose={() => setShowReviewModal(false)} onReviewed={() => { setAlreadyReviewed(true); setShowReviewModal(false); }} />
      )}
    </>
  );
}

// ── Пузырь одного сообщения ───────────────────────────────────────────────────

function MessageBubble({ msg, isMine }: { msg: AviaChatMessage; isMine: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', marginBottom: 6 }}
    >
      <div style={{ maxWidth: '78%', padding: '9px 13px', borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px', background: isMine ? 'linear-gradient(135deg, #0369a1, #0ea5e9)' : 'rgba(255,255,255,0.07)', border: isMine ? 'none' : '1px solid rgba(255,255,255,0.09)', boxShadow: isMine ? '0 2px 10px rgba(14,165,233,0.25)' : 'none' }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: isMine ? '#fff' : '#c8dde8', lineHeight: 1.45, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
          {msg.text}
        </p>
        <div style={{ fontSize: 10, color: isMine ? 'rgba(255,255,255,0.6)' : '#3a5268', marginTop: 4, textAlign: 'right', fontWeight: 500 }}>{fmtTime(msg.createdAt)}</div>
      </div>
    </motion.div>
  );
}

// ── Разделитель дат ───────────────────────────────────────────────────────────

function DateDivider({ date }: { date: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '14px 0 10px' }}>
      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
      <span style={{ fontSize: 10, color: '#3a5268', fontWeight: 600 }}>{date}</span>
      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
    </div>
  );
}

// ── Элемент списка чатов ──────────────────────────────────────────────────────

function ChatListItem({
  chat, myPhone, isActive, onClick,
}: {
  chat: AviaChat; myPhone: string; isActive: boolean; onClick: () => void;
}) {
  const otherPhone = chat.participants.find(p => p !== myPhone) || '';
  const hasUnread  = (chat.unread || 0) > 0;
  const adRef      = chat.adRef;

  return (
    <motion.button
      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 14px', borderRadius: 14,
        background: isActive
          ? 'rgba(14,165,233,0.10)'
          : hasUnread
            ? 'rgba(14,165,233,0.05)'
            : 'rgba(255,255,255,0.02)',
        border: `1px solid ${isActive ? 'rgba(14,165,233,0.25)' : hasUnread ? 'rgba(14,165,233,0.14)' : 'rgba(255,255,255,0.06)'}`,
        marginBottom: 6, cursor: 'pointer', textAlign: 'left',
        transition: 'background 0.2s, border-color 0.2s',
      }}
    >
      {/* Avatar */}
      <div style={{
        width: 42, height: 42, borderRadius: 13, flexShrink: 0,
        background: adRef?.type === 'flight' ? 'rgba(14,165,233,0.12)' : 'rgba(167,139,250,0.12)',
        border: `1px solid ${adRef?.type === 'flight' ? 'rgba(14,165,233,0.2)' : 'rgba(167,139,250,0.2)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {adRef?.type === 'flight'
          ? <Plane   style={{ width: 18, height: 18, color: '#0ea5e9' }} />
          : adRef?.type === 'request'
            ? <Package style={{ width: 18, height: 18, color: '#a78bfa' }} />
            : <User    style={{ width: 18, height: 18, color: '#6b8299' }} />}
      </div>
      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
          <span style={{ fontSize: 13, fontWeight: hasUnread ? 800 : 600, color: hasUnread ? '#e2eaf3' : '#8aa3ba', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {maskPhone(otherPhone)}
          </span>
          {chat.lastMessageAt && (
            <span style={{ fontSize: 10, color: '#2a3d50', fontWeight: 500, flexShrink: 0, marginLeft: 6 }}>
              {relTime(chat.lastMessageAt)}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {adRef && (
            <span style={{ fontSize: 10, color: adRef.type === 'flight' ? '#0ea5e9' : '#a78bfa', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 100, flexShrink: 0 }}>
              {adRef.from} → {adRef.to}
            </span>
          )}
          {chat.lastMessage && (
            <span style={{ fontSize: 11, color: '#3a5268', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
              {adRef ? ' · ' : ''}{chat.lastMessage}
            </span>
          )}
        </div>
      </div>
      {/* Unread badge */}
      {hasUnread && (
        <div style={{ minWidth: 18, height: 18, borderRadius: 9, background: '#0ea5e9', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: '#fff', padding: '0 4px', boxShadow: '0 0 8px rgba(14,165,233,0.5)' }}>
          {(chat.unread || 0) > 99 ? '99+' : chat.unread}
        </div>
      )}
    </motion.button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  Панель чата (правая колонка или мобильный полный экран)
// ═══════════════════════════════════════════════════════════════════════════════

interface ChatPanelProps {
  myPhone:   string;
  chatId:    string;
  otherPhone: string;
  adRef:     AviaChatAdRef | null;
  onBack:    () => void;
  onDeleted: (cancelledDealIds: string[]) => void;
  onChatsUpdate: () => void;
}

function ChatPanel({ myPhone, chatId, otherPhone, adRef, onBack, onDeleted, onChatsUpdate }: ChatPanelProps) {
  const [messages,    setMessages]    = useState<AviaChatMessage[]>([]);
  const [chatMeta,    setChatMeta]    = useState<any>(null);
  const [chatLoading, setChatLoading] = useState(true);
  const [inputText,   setInputText]   = useState('');
  const [sending,     setSending]     = useState(false);
  const [deleting,    setDeleting]    = useState(false);
  const [resolvedAdRef, setResolvedAdRef] = useState<AviaChatAdRef | null>(adRef);
  const [resolvedOtherPhone, setResolvedOtherPhone] = useState(otherPhone);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLTextAreaElement>(null);
  const pollTimer      = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadMessages = useCallback(async () => {
    if (!chatId) return;
    try {
      const { messages: msgs, meta } = await getAviaChatMessages(chatId);
      setMessages(msgs);
      setChatMeta(meta);
      if (meta?.adRef) setResolvedAdRef(meta.adRef);
      const other = (meta?.participants || []).find((p: string) => p !== myPhone) || '';
      if (other) setResolvedOtherPhone(other);
    } catch (err) {
      console.warn('[ChatPanel] loadMessages error:', err);
    }
  }, [chatId, myPhone]);

  useEffect(() => {
    if (!chatId) return;
    setChatLoading(true);
    loadMessages().finally(() => setChatLoading(false));

    const seenAbort = new AbortController();
    markAviaChatSeen(chatId, myPhone, seenAbort.signal);
    onChatsUpdate();

    pollTimer.current = setInterval(loadMessages, 10_000);
    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
      seenAbort.abort();
    };
  }, [chatId]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 60);
    }
  }, [messages.length]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || sending || !chatId) return;
    const optimistic: AviaChatMessage = {
      id: `opt_${Date.now()}`, chatId, senderPhone: myPhone,
      text, createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);
    setInputText('');
    setSending(true);
    try {
      const msg = await sendAviaChatMessage(chatId, myPhone, text);
      setMessages(prev => prev.map(m => m.id === optimistic.id ? msg : m));
      onChatsUpdate();
    } catch (err: any) {
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
      toast.error('Не удалось отправить сообщение');
      console.error('[ChatPanel] send error:', err);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleDeleteChat = async () => {
    if (!chatId || deleting) return;
    if (!confirm('Удалить чат? Все связанные незавершённые сделки будут отменены.')) return;
    setDeleting(true);
    try {
      const result = await deleteAviaChat(chatId, myPhone);
      if (result.success) {
        toast.success(result.cancelledDealIds.length > 0 ? `Чат удалён. Отменено сделок: ${result.cancelledDealIds.length}` : 'Чат удалён');
        onDeleted(result.cancelledDealIds);
        onBack();
      } else {
        toast.error(result.error || 'Ошибка удаления');
      }
    } catch (err) {
      toast.error('Ошибка удаления чата');
      console.error('[ChatPanel] deleteChat error:', err);
    } finally {
      setDeleting(false);
    }
  };

  const groupedMessages = useMemo(() => {
    const groups: Array<{ date: string; msgs: AviaChatMessage[] }> = [];
    for (const msg of messages) {
      const dateLabel = fmtDate(msg.createdAt);
      const last = groups[groups.length - 1];
      if (last && last.date === dateLabel) last.msgs.push(msg);
      else groups.push({ date: dateLabel, msgs: [msg] });
    }
    return groups;
  }, [messages]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, height: '100%' }}>
      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '14px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
        background: 'rgba(8,15,31,0.8)',
        backdropFilter: 'blur(12px)',
      }}>
        <button
          onClick={onBack}
          style={{ width: 34, height: 34, borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: '#4a6080', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          aria-label="Назад"
        >
          <ArrowLeft style={{ width: 15, height: 15 }} />
        </button>
        <div style={{ width: 34, height: 34, borderRadius: 11, flexShrink: 0, background: resolvedAdRef?.type === 'request' ? 'rgba(167,139,250,0.10)' : 'rgba(14,165,233,0.10)', border: `1px solid ${resolvedAdRef?.type === 'request' ? 'rgba(167,139,250,0.18)' : 'rgba(14,165,233,0.18)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {resolvedAdRef?.type === 'request'
            ? <Package style={{ width: 15, height: 15, color: '#a78bfa' }} />
            : <MessageCircle style={{ width: 15, height: 15, color: '#0ea5e9' }} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#e2eaf3', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {resolvedOtherPhone ? maskPhone(resolvedOtherPhone) : 'Загрузка...'}
          </div>
          {resolvedAdRef && (
            <div style={{ fontSize: 10, color: '#4a6080', fontWeight: 600, marginTop: 1 }}>
              {resolvedAdRef.type === 'flight' ? '✈ Рейс' : '📦 Заявка'}: {resolvedAdRef.from} → {resolvedAdRef.to}
            </div>
          )}
        </div>
        <button
          onClick={handleDeleteChat}
          disabled={deleting}
          style={{ width: 32, height: 32, borderRadius: 9, border: '1px solid rgba(239,68,68,0.18)', background: deleting ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.06)', color: '#f87171', cursor: deleting ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: deleting ? 0.6 : 1, transition: 'background 0.2s, opacity 0.2s' }}
          aria-label="Удалить чат"
        >
          {deleting ? <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /> : <Trash2 style={{ width: 14, height: 14 }} />}
        </button>
      </div>

      {/* ── Messages ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 6px', scrollbarWidth: 'none' }}>
        {chatLoading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Loader2 style={{ width: 24, height: 24, color: '#2a3d50', animation: 'spin 1.2s linear infinite', margin: '0 auto' }} />
          </div>
        ) : messages.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '48px 20px' }}>
            <div style={{ width: 52, height: 52, borderRadius: 18, background: 'rgba(14,165,233,0.07)', border: '1px solid rgba(14,165,233,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <MessageCircle style={{ width: 22, height: 22, color: '#0ea5e9' }} />
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#3d5268', marginBottom: 6 }}>Начните общение</div>
            <div style={{ fontSize: 12, color: '#2a3d50', lineHeight: 1.6 }}>Напишите первым — ваше сообщение<br />дойдёт мгновенно</div>
          </motion.div>
        ) : (
          groupedMessages.map(group => (
            <div key={group.date}>
              <DateDivider date={group.date} />
              {group.msgs.map(msg => (
                msg.type === 'deal_update' ? (
                  <DealUpdateBubble key={msg.id} msg={msg} />
                ) : msg.type === 'deal_offer' ? (
                  <DealOfferBubble key={msg.id} msg={msg} myPhone={myPhone} />
                ) : (
                  <MessageBubble key={msg.id} msg={msg} isMine={msg.senderPhone === myPhone} />
                )
              ))}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Input ── */}
      <div style={{
        padding: '10px 14px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', gap: 8, alignItems: 'flex-end',
        flexShrink: 0,
        paddingBottom: 'calc(10px + env(safe-area-inset-bottom, 0px))',
        background: 'rgba(8,15,31,0.8)',
        backdropFilter: 'blur(12px)',
      }}>
        <textarea
          ref={inputRef}
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Напишите сообщение..."
          rows={1}
          style={{
            flex: 1, padding: '10px 13px', borderRadius: 14,
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.05)', color: '#e2eaf3',
            fontSize: 14, fontWeight: 500, outline: 'none', resize: 'none',
            lineHeight: 1.45, maxHeight: 100, scrollbarWidth: 'none',
            fontFamily: "'Sora', 'Inter', sans-serif",
          }}
          onInput={e => {
            const el = e.currentTarget;
            el.style.height = 'auto';
            el.style.height = Math.min(el.scrollHeight, 100) + 'px';
          }}
        />
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleSend}
          disabled={!inputText.trim() || sending}
          style={{
            width: 44, height: 44, borderRadius: 14, flexShrink: 0, border: 'none',
            background: inputText.trim() && !sending ? 'linear-gradient(135deg, #0369a1, #0ea5e9)' : 'rgba(255,255,255,0.06)',
            color: inputText.trim() && !sending ? '#fff' : '#3a5268',
            cursor: inputText.trim() && !sending ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.2s, color 0.2s',
            boxShadow: inputText.trim() && !sending ? '0 3px 12px rgba(14,165,233,0.3)' : 'none',
          }}
        >
          <Send style={{ width: 17, height: 17 }} />
        </motion.button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  Главная страница
// ═══════════════════════════════════════════════════════════════════════════════

export function AviaMessagesPage() {
  const { user, refreshChatUnread } = useAvia();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const myPhone = user?.phone || '';

  // URL-параметры для deep-link
  const paramOtherPhone = searchParams.get('otherPhone') || '';
  const paramAdType     = searchParams.get('adType') as 'flight' | 'request' | null;
  const paramAdId       = searchParams.get('adId')    || '';
  const paramAdFrom     = searchParams.get('adFrom')  || '';
  const paramAdTo       = searchParams.get('adTo')    || '';
  const paramAdDate     = searchParams.get('adDate')  || '';

  const initialAdRef: AviaChatAdRef | null = paramAdType ? {
    type: paramAdType, id: paramAdId, from: paramAdFrom, to: paramAdTo,
    ...(paramAdDate ? { date: paramAdDate } : {}),
  } : null;

  // State
  const [chats,        setChats]        = useState<AviaChat[]>([]);
  const [chatsLoading, setChatsLoading] = useState(true);

  // Активный чат
  const [activeChatId,   setActiveChatId]   = useState<string>('');
  const [activeOtherPhone, setActiveOtherPhone] = useState<string>(paramOtherPhone);
  const [activeAdRef,    setActiveAdRef]    = useState<AviaChatAdRef | null>(initialAdRef);

  // Мобильное представление ('list' | 'chat')
  const [mobileView, setMobileView] = useState<'list' | 'chat'>(paramOtherPhone ? 'chat' : 'list');

  // Инициализация чата через URL-параметры (deep-link)
  const initRef = useRef(false);
  useEffect(() => {
    if (!paramOtherPhone || !myPhone || initRef.current) return;
    initRef.current = true;
    initAviaChat(myPhone, paramOtherPhone, initialAdRef)
      .then(({ chatId: cid }) => {
        setActiveChatId(cid);
      })
      .catch(() => {
        setActiveChatId(makeAviaChatId(myPhone, paramOtherPhone));
      });
  }, [paramOtherPhone, myPhone]);

  // Загрузка списка чатов
  const loadChats = useCallback(async () => {
    if (!myPhone) return;
    try {
      const list = await getAviaUserChats(myPhone);
      setChats(list);
      refreshChatUnread();
    } catch (err) {
      console.warn('[AviaMessagesPage] loadChats error:', err);
    } finally {
      setChatsLoading(false);
    }
  }, [myPhone]);

  useEffect(() => {
    loadChats();
    const t = setInterval(loadChats, 30_000);
    return () => clearInterval(t);
  }, [loadChats]);

  const openChat = (chat: AviaChat) => {
    const other = chat.participants.find(p => p !== myPhone) || '';
    setActiveChatId(chat.chatId);
    setActiveOtherPhone(other);
    setActiveAdRef(chat.adRef || null);
    setMobileView('chat');
  };

  const handleBack = () => {
    setMobileView('list');
    setActiveChatId('');
    setActiveOtherPhone('');
    setActiveAdRef(null);
    loadChats();
    // Убираем URL params при возврате к списку
    navigate('/avia/messages', { replace: true });
  };

  const handleChatDeleted = (cancelledDealIds: string[]) => {
    setChats(prev => prev.filter(c => c.chatId !== activeChatId));
    loadChats();
  };

  // Пустой правый столбец (десктоп)
  const emptyChatState = (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: 40 }}
    >
      <div style={{ width: 72, height: 72, borderRadius: 22, background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
        <MessagesSquare style={{ width: 32, height: 32, color: 'rgba(14,165,233,0.3)' }} />
      </div>
      <div style={{ fontSize: 16, fontWeight: 800, color: '#2a3d50', marginBottom: 8, textAlign: 'center' }}>Выберите диалог</div>
      <div style={{ fontSize: 13, color: '#1e2d40', textAlign: 'center', lineHeight: 1.6, maxWidth: 220 }}>
        Нажмите на чат слева, чтобы открыть переписку
      </div>
    </motion.div>
  );

  // ── Список чатов (левая колонка) ──────────────────────────────────────────
  const chatListContent = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Заголовок */}
      <div style={{ padding: '20px 16px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 12, background: 'rgba(14,165,233,0.10)', border: '1px solid rgba(14,165,233,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MessagesSquare style={{ width: 16, height: 16, color: '#0ea5e9' }} />
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 900, color: '#e8f4ff', letterSpacing: '-0.4px' }}>Сообщения</div>
            <div style={{ fontSize: 10, color: '#2a3d50', fontWeight: 500, marginTop: 1 }}>
              {chats.length > 0
                ? `${chats.length} диалог${chats.length === 1 ? '' : chats.length < 5 ? 'а' : 'ов'}`
                : 'AVIA чаты'}
            </div>
          </div>
          {/* Unread badge */}
          {chats.reduce((s, c) => s + (c.unread || 0), 0) > 0 && (
            <div style={{ marginLeft: 'auto', minWidth: 22, height: 22, borderRadius: 11, background: 'linear-gradient(135deg, #0369a1, #0ea5e9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#fff', padding: '0 5px', boxShadow: '0 2px 8px rgba(14,165,233,0.4)' }}>
              {chats.reduce((s, c) => s + (c.unread || 0), 0) > 99 ? '99+' : chats.reduce((s, c) => s + (c.unread || 0), 0)}
            </div>
          )}
        </div>
      </div>

      {/* Список */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px', scrollbarWidth: 'none' }}>
        {chatsLoading ? (
          [0, 1, 2].map(i => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', marginBottom: 6 }}>
              <div style={{ width: 42, height: 42, borderRadius: 13, background: 'rgba(255,255,255,0.05)' }} />
              <div style={{ flex: 1 }}>
                <div style={{ width: 130, height: 12, borderRadius: 6, background: 'rgba(255,255,255,0.06)', marginBottom: 6 }} />
                <div style={{ width: 200, height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.04)' }} />
              </div>
            </div>
          ))
        ) : chats.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', padding: '52px 20px' }}>
            <div style={{ width: 58, height: 58, borderRadius: 18, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <MessagesSquare style={{ width: 26, height: 26, color: '#2a3d50' }} />
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#3d5268', marginBottom: 6 }}>Нет диалогов</div>
            <div style={{ fontSize: 12, color: '#2a3d50', lineHeight: 1.6 }}>
              Нажмите 💬 на карточке рейса<br />или заявки, чтобы начать переписку
            </div>
          </motion.div>
        ) : (
          <AnimatePresence initial={false}>
            {chats.map(chat => (
              <ChatListItem
                key={chat.chatId}
                chat={chat}
                myPhone={myPhone}
                isActive={chat.chatId === activeChatId}
                onClick={() => openChat(chat)}
              />
            ))}
          </AnimatePresence>
        )}
        <div style={{ height: 'env(safe-area-inset-bottom, 12px)' }} />
      </div>
    </div>
  );

  if (!user) return null;

  return (
    <>
      {/* ── DESKTOP: 2-колонка ── */}
      <div
        className="hidden md:flex"
        style={{
          height: 'calc(100vh - 0px)',
          background: 'var(--avia-bg)',
          fontFamily: "'Sora', 'Inter', sans-serif",
        }}
      >
        {/* Левый столбец: список */}
        <div style={{
          width: 320, flexShrink: 0,
          borderRight: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', flexDirection: 'column',
          height: '100%', overflow: 'hidden',
        }}>
          {chatListContent}
        </div>

        {/* Правый столбец: чат или пустое состояние */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', minWidth: 0 }}>
          <AnimatePresence mode="wait">
            {activeChatId ? (
              <motion.div
                key={activeChatId}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.2 }}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}
              >
                <ChatPanel
                  myPhone={myPhone}
                  chatId={activeChatId}
                  otherPhone={activeOtherPhone}
                  adRef={activeAdRef}
                  onBack={() => { setActiveChatId(''); setActiveOtherPhone(''); setActiveAdRef(null); navigate('/avia/messages', { replace: true }); }}
                  onDeleted={handleChatDeleted}
                  onChatsUpdate={loadChats}
                />
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ flex: 1, display: 'flex' }}>
                {emptyChatState}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── MOBILE: единственная колонка с переходами ── */}
      <div
        className="md:hidden"
        style={{
          background: 'var(--avia-bg)',
          fontFamily: "'Sora', 'Inter', sans-serif",
          minHeight: '100vh',
          position: 'relative',
        }}
      >
        {/* Список — всегда рендерится, скрывается в chat-view */}
        <div style={{ display: mobileView === 'list' ? 'flex' : 'none', flexDirection: 'column', minHeight: '100vh' }}>
          {chatListContent}
          {/* Дополнительный отступ для mobile nav */}
          <div style={{ height: 'max(64px, env(safe-area-inset-bottom, 64px))' }} />
        </div>

        {/* Чат — полноэкранный оверлей поверх всего включая mobile nav */}
        <AnimatePresence>
          {mobileView === 'chat' && activeChatId && (
            <motion.div
              key="mobile-chat"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              style={{
                position: 'fixed', inset: 0, zIndex: 200,
                background: 'var(--avia-bg)',
                display: 'flex', flexDirection: 'column',
                paddingTop: 'env(safe-area-inset-top, 0px)',
              }}
            >
              <ChatPanel
                myPhone={myPhone}
                chatId={activeChatId}
                otherPhone={activeOtherPhone}
                adRef={activeAdRef}
                onBack={handleBack}
                onDeleted={handleChatDeleted}
                onChatsUpdate={loadChats}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}