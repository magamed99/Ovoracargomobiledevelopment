import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router';
import {
  Plane, User, LogOut, Package, Send, Repeat,
  ShieldAlert, ShieldX, ShieldCheck,
  Calendar, Trash2, Plus, RefreshCw,
  ArrowRight, AlertTriangle, Phone, Copy, Check,
  XCircle, Bookmark, SlidersHorizontal, X, Search,
  ArrowDown, Bell, MessageCircle, Handshake, FileText, Flag,
} from 'lucide-react';
import { NotificationCenter } from './NotificationCenter';
import { AviaConfirmSheet } from './AviaConfirmSheet';
import { fmtDate, maskPhone } from '../../utils/aviaUtils';

import { makeAviaChatId, getAviaUserChats } from '../../api/aviaChatApi';
import type { AviaChatAdRef } from '../../api/aviaChatApi';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useAvia } from './AviaContext';
import {
  canCreateAd,
  canCreateRequest,
  getAviaFlights, getAviaRequests,
  deleteAviaFlight, deleteAviaRequest,
  closeAviaFlight, closeAviaRequest,
  completeAviaFlight,
  getMyAviaAds,
} from '../../api/aviaApi';
import type { AviaFlight, AviaRequest } from '../../api/aviaApi';
import {
  applyFlightFilters, applyRequestFilters,
  countActiveFilters, getFilterChips, removeFilterChip,
  EMPTY_FILTER_STATE,
} from '../../api/aviaFilterApi';
import type { AviaFilterState } from '../../api/aviaFilterApi';
import { AviaSearchBar } from './AviaSearchBar';
import { AviaFilterSheet } from './AviaFilterSheet';
import { CreateFlightModal } from './CreateFlightModal';
import { CreateRequestModal } from './CreateRequestModal';
import { FlightDetailModal, RequestDetailModal } from './DetailModal';
import { AviaDealOfferModal } from './AviaDealOfferModal';
import { getAviaDeals } from '../../api/aviaDealApi';
import type { AviaDeal } from '../../api/aviaDealApi';

type AvSortKey = 'date-desc' | 'date-asc' | 'weight-desc' | 'weight-asc' | 'price-asc' | 'price-desc';

// ── Вспомогательные ───────────────────────────────────────────────────────────

const ROLE_META: Record<string, { label: string; color: string; icon: typeof Package }> = {
  courier: { label: 'Курьер',               color: '#0ea5e9', icon: Package },
  sender:  { label: 'Отправитель',           color: '#a78bfa', icon: Send    },
  both:    { label: 'Курьер + Отправитель',  color: '#34d399', icon: Repeat  },
};

const TAB_LABELS: Record<string, { flights: string; requests: string }> = {
  courier: { flights: 'Мои рейсы', requests: 'Заявки'      },
  sender:  { flights: 'Рейсы',     requests: 'Мои заявки'  },
  both:    { flights: 'Рейсы',     requests: 'Заявки'       },
};

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="avia-card-item" style={{
      padding: '15px 16px', borderRadius: 20,
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
      overflow: 'hidden', position: 'relative',
    }}>
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .avia-shimmer::after {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(90deg, transparent 0%, #ffffff07 50%, transparent 100%);
          animation: shimmer 1.4s infinite;
        }
      `}</style>
      <div className="avia-shimmer" style={{ position: 'absolute', inset: 0 }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: '#ffffff0a' }} />
        <div style={{ width: 140, height: 16, borderRadius: 6, background: '#ffffff0a' }} />
        <div style={{ width: 40, height: 16, borderRadius: 6, background: '#ffffff06', marginLeft: 'auto' }} />
      </div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
        <div style={{ width: 70, height: 12, borderRadius: 5, background: '#ffffff08' }} />
        <div style={{ width: 50, height: 12, borderRadius: 5, background: '#ffffff08' }} />
        <div style={{ width: 55, height: 12, borderRadius: 5, background: '#ffffff08' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ width: 90, height: 12, borderRadius: 5, background: '#ffffff06' }} />
        <div style={{ width: 60, height: 26, borderRadius: 8, background: '#ffffff06' }} />
      </div>
    </div>
  );
}

// ── Кнопка контакта ───────────────────────────────────────────────────────────

function ContactButton({ phone, accentColor }: { phone: string; accentColor: string }) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`+${phone.replace(/\D/g, '')}`);
      setCopied(true);
      toast.success('Номер скопирован в буфер обмена', { duration: 2000 });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Не удалось скопировать номер');
    }
  };

  if (!revealed) {
    return (
      <motion.button
        whileTap={{ scale: 0.94 }}
        onClick={() => setRevealed(true)}
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '5px 11px', borderRadius: 9, cursor: 'pointer',
          border: `1px solid ${accentColor}28`,
          background: `${accentColor}0c`,
          color: accentColor, fontSize: 11, fontWeight: 700,
        }}
      >
        <Phone style={{ width: 11, height: 11 }} />
        Связаться
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{ display: 'flex', alignItems: 'center', gap: 6 }}
    >
      <span style={{
        fontSize: 12, fontWeight: 700, color: accentColor,
        padding: '4px 10px', borderRadius: 8,
        background: `${accentColor}12`, border: `1px solid ${accentColor}20`,
        letterSpacing: '0.03em',
      }}>
        {maskPhone(phone)}
      </span>
      <button
        onClick={handleCopy}
        style={{
          width: 28, height: 28, borderRadius: 8,
          border: `1px solid ${accentColor}20`,
          background: copied ? `${accentColor}18` : '#ffffff08',
          color: copied ? accentColor : '#4a6080',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 0.2s, color 0.2s',
        }}
      >
        {copied
          ? <Check style={{ width: 12, height: 12 }} />
          : <Copy style={{ width: 12, height: 12 }} />}
      </button>
    </motion.div>
  );
}

// ── Карточка рейса ────────────────────────────────────────────────────────────

function FlightCard({
  flight, isMine, onDelete, onClose, onComplete, onDetail, onChat, onOffer, chatUnread,
}: {
  flight: AviaFlight;
  isMine: boolean;
  onDelete: (id: string) => void;
  onClose?: (id: string) => void;
  onComplete?: (id: string) => void;
  onDetail?: (f: AviaFlight) => void;
  onChat?: (otherPhone: string, adRef: AviaChatAdRef) => void;
  onOffer?: (flight: AviaFlight) => void;
  chatUnread?: number;
}) {
  const [deleting, setDeleting] = useState(false);
  const [closing, setClosing] = useState(false);
  const [completing, setCompleting] = useState(false);
  const isClosed = flight.status === 'closed';
  const isCompleted = flight.status === 'completed';

  // ── AviaConfirmSheet state ──────────────────────────────────────────────────
  type ConfirmCfg = { title: string; description: string; variant: 'danger' | 'warning' | 'complete'; label: string; action: () => Promise<void> };
  const [confirmCfg, setConfirmCfg] = useState<ConfirmCfg | null>(null);

  const execDelete = async () => {
    setDeleting(true);
    try {
      await deleteAviaFlight(flight.id);
      onDelete(flight.id);
      toast.success('Рейс удалён', { duration: 2500 });
    } catch (e: any) {
      console.error('[FlightCard] delete error:', e);
      toast.error('Не удалось удалить рейс');
    } finally { setDeleting(false); }
  };

  const execClose = async () => {
    setClosing(true);
    try {
      await closeAviaFlight(flight.id);
      if (onClose) onClose(flight.id);
      toast.success('Рейс закрыт', { duration: 2500 });
    } catch (e: any) {
      console.error('[FlightCard] close error:', e);
      toast.error('Не удалось закрыть рейс');
    } finally { setClosing(false); }
  };

  const execComplete = async () => {
    setCompleting(true);
    try {
      const result = await completeAviaFlight(flight.id);
      if (result.error) throw new Error(result.error);
      if (onComplete) onComplete(flight.id);
      toast.success(`Поездка завершена! Завершено сделок: ${result.completedDeals ?? 0}`, { duration: 3000 });
    } catch (e: any) {
      console.error('[FlightCard] complete error:', e);
      toast.error('Не удалось завершить поездку');
    } finally { setCompleting(false); }
  };

  const handleDelete   = () => setConfirmCfg({ title: 'Удалить рейс?', description: 'Рейс будет удалён навсегда. Это действие нельзя отменить.', variant: 'danger', label: 'Удалить', action: execDelete });
  const handleClose    = () => setConfirmCfg({ title: 'Закрыть рейс?', description: 'Рейс исчезнет из общего списка. Вы сможете его удалить позже.', variant: 'warning', label: 'Закрыть', action: execClose });
  const handleComplete = () => setConfirmCfg({ title: 'Завершить поездку?', description: 'Все принятые сделки будут отмечены как завершённые.', variant: 'complete', label: 'Завершить', action: execComplete });

  // Вычисляем отображаемую ёмкость
  const displayFreeKg = (flight.freeKg || 0) - (flight.reservedKg || 0);
  const hasReserved = (flight.reservedKg || 0) > 0;
  const isCargoOn = flight.cargoEnabled ?? ((flight.freeKg || 0) > 0);
  const isDocsOn = flight.docsEnabled ?? false;

  const isDone = isClosed || isCompleted;

  return (
    <>
    <motion.div
      className="avia-card-item"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: isDone ? 0.55 : 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25 }}
      style={{
        padding: '15px 16px', borderRadius: 20,
        background: isDone
          ? 'rgba(255,255,255,0.02)'
          : isMine
            ? 'linear-gradient(145deg, rgba(14,165,233,0.08) 0%, rgba(3,105,161,0.04) 50%, rgba(6,14,26,0.7) 100%)'
            : 'rgba(255,255,255,0.04)',
        border: `1px solid ${isDone ? 'rgba(255,255,255,0.05)' : isMine ? 'rgba(14,165,233,0.18)' : 'rgba(255,255,255,0.07)'}`,
        position: 'relative',
        cursor: onDetail ? 'pointer' : undefined,
        boxShadow: isDone ? 'none' : isMine
          ? '0 4px 20px rgba(14,165,233,0.06), inset 0 1px 0 rgba(14,165,233,0.08)'
          : '0 2px 12px rgba(0,0,0,0.2)',
        overflow: 'hidden',
      }}
      onClick={() => onDetail?.(flight)}
    >
      {/* Top shine line for own cards */}
      {isMine && !isDone && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 1, pointerEvents: 'none',
          background: 'linear-gradient(90deg, transparent, rgba(14,165,233,0.35), transparent)',
        }} />
      )}

      {/* Status badge overlay */}
      {isDone && (
        <div style={{
          position: 'absolute', top: 10, right: 12,
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '3px 8px', borderRadius: 6,
          background: isCompleted ? '#34d39914' : '#f59e0b14',
          border: `1px solid ${isCompleted ? '#34d39920' : '#f59e0b20'}`,
        }}>
          <XCircle style={{ width: 10, height: 10, color: isCompleted ? '#34d399' : '#f59e0b' }} />
          <span style={{ fontSize: 9, fontWeight: 700, color: isCompleted ? '#34d399' : '#f59e0b', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {isCompleted ? 'Завершён' : 'Закрыт'}
          </span>
        </div>
      )}

      {/* Route row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 11,
            background: isClosed ? 'rgba(255,255,255,0.04)' : 'rgba(14,165,233,0.1)',
            border: `1px solid ${isClosed ? 'rgba(255,255,255,0.06)' : 'rgba(14,165,233,0.18)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: isClosed ? 'none' : '0 0 10px rgba(14,165,233,0.1)',
          }}>
            <Plane style={{ width: 15, height: 15, color: isClosed ? '#2a3d50' : '#38bdf8' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: isClosed ? '#3a5268' : '#e2eaf3', letterSpacing: '-0.2px' }}>{flight.from}</span>
            <ArrowRight style={{ width: 12, height: 12, color: isClosed ? '#1a2d40' : '#1e4a6a' }} />
            <span style={{ fontSize: 15, fontWeight: 800, color: isClosed ? '#3a5268' : '#e2eaf3', letterSpacing: '-0.2px' }}>{flight.to}</span>
          </div>
        </div>
        {isMine && !isClosed && (
          <span style={{
            fontSize: 9, fontWeight: 700, color: '#0ea5e9',
            padding: '3px 8px', borderRadius: 6,
            background: '#0ea5e912', border: '1px solid #0ea5e920',
            letterSpacing: '0.06em', textTransform: 'uppercase',
          }}>
            Мой
          </span>
        )}
      </div>

      {/* Meta */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Calendar style={{ width: 12, height: 12, color: '#4a6080' }} />
            <span style={{ fontSize: 12, color: '#6b8299', fontWeight: 600 }}>
              {fmtDate(flight.date, 'short')}
            </span>
          </div>
          {flight.flightNo && (
            <span style={{ fontSize: 11, color: '#4a6080', fontWeight: 600 }}>· {flight.flightNo}</span>
          )}
        </div>

        {/* Cargo row */}
        {isCargoOn && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Package style={{ width: 11, height: 11, color: isDone ? '#4a6080' : '#0ea5e9', flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: isDone ? '#4a6080' : '#c8dae8', fontWeight: 600 }}>
              {isDone ? `${flight.freeKg} кг` : `${Math.max(0, displayFreeKg)} кг свободн��`}
            </span>
            {!isDone && hasReserved && (
              <span style={{
                fontSize: 10, color: '#f59e0b', fontWeight: 600,
                padding: '1px 6px', borderRadius: 5,
                background: '#f59e0b12', border: '1px solid #f59e0b20',
              }}>
                {flight.reservedKg} кг ожидает
              </span>
            )}
            {!!flight.pricePerKg && (
              <span style={{ fontSize: 12, color: isDone ? '#6b8299' : '#34d399', fontWeight: 700, marginLeft: 'auto' }}>
                {flight.currency ? flight.currency + ' ' : '$'}{flight.pricePerKg}/кг
              </span>
            )}
          </div>
        )}

        {/* Docs row */}
        {isDocsOn && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText style={{ width: 11, height: 11, color: isDone ? '#4a6080' : '#a78bfa', flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: isDone ? '#4a6080' : '#c8dae8', fontWeight: 600 }}>
              Документы принимаю
            </span>
            {!!flight.docsPrice && (
              <span style={{ fontSize: 12, color: isDone ? '#6b8299' : '#a78bfa', fontWeight: 700, marginLeft: 'auto' }}>
                {flight.currency ? flight.currency + ' ' : '$'}{flight.docsPrice}/пакет
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer: author + action */}
      <div onClick={e => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <div style={{
            width: 20, height: 20, borderRadius: 6, flexShrink: 0,
            background: isDone ? '#ffffff08' : '#0ea5e918',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <User style={{ width: 10, height: 10, color: isDone ? '#4a6080' : '#0ea5e9' }} />
          </div>
          <span style={{ fontSize: 11, color: '#4a6080', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {flight.courierName || maskPhone(flight.courierId)}
          </span>
        </div>

        {isMine ? (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {!isDone && (
              <>
                <button
                  onClick={handleComplete}
                  disabled={completing}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '5px 10px', borderRadius: 8, cursor: 'pointer',
                    border: '1px solid #34d39920', background: '#34d39908',
                    color: '#34d399', fontSize: 11, fontWeight: 600,
                    opacity: completing ? 0.5 : 1, transition: 'opacity 0.2s',
                  }}
                >
                  <Flag style={{ width: 12, height: 12 }} />
                  {completing ? '...' : 'Завершить'}
                </button>
                <button
                  onClick={handleClose}
                  disabled={closing}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '5px 10px', borderRadius: 8, cursor: 'pointer',
                    border: '1px solid #f59e0b20', background: '#f59e0b08',
                    color: '#fbbf24', fontSize: 11, fontWeight: 600,
                    opacity: closing ? 0.5 : 1, transition: 'opacity 0.2s',
                  }}
                >
                  <XCircle style={{ width: 12, height: 12 }} />
                  {closing ? '...' : 'Закрыть'}
                </button>
              </>
            )}
            <button
              onClick={handleDelete}
              disabled={deleting}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 10px', borderRadius: 8, cursor: 'pointer',
                border: '1px solid #ef444420', background: '#ef444408',
                color: '#f87171', fontSize: 11, fontWeight: 600,
                opacity: deleting ? 0.5 : 1, transition: 'opacity 0.2s',
              }}
            >
              <Trash2 style={{ width: 12, height: 12 }} />
              {deleting ? '...' : 'Удалить'}
            </button>
          </div>
        ) : (
          !isDone && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {onChat && (
                <motion.button
                  whileTap={{ scale: 0.94 }}
                  onClick={() => onChat(flight.courierId, { type: 'flight', id: flight.id, from: flight.from, to: flight.to })}
                  style={{
                    position: 'relative',
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '5px 10px', borderRadius: 9, cursor: 'pointer',
                    border: '1px solid rgba(14,165,233,0.22)',
                    background: 'rgba(14,165,233,0.08)',
                    color: '#0ea5e9', fontSize: 11, fontWeight: 700,
                  }}
                >
                  <MessageCircle style={{ width: 11, height: 11 }} />
                  Написать
                  {(chatUnread || 0) > 0 && (
                    <span style={{
                      position: 'absolute', top: -4, right: -4,
                      minWidth: 14, height: 14, borderRadius: 7,
                      background: '#0ea5e9', color: '#fff',
                      fontSize: 8, fontWeight: 800,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: '0 3px',
                      border: '2px solid #060d18',
                      boxShadow: '0 0 6px rgba(14,165,233,0.5)',
                    }}>
                      {chatUnread}
                    </span>
                  )}
                </motion.button>
              )}
              {onOffer && (
                <motion.button
                  whileTap={{ scale: 0.94 }}
                  onClick={() => onOffer(flight)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '5px 10px', borderRadius: 9, cursor: 'pointer',
                    border: '1px solid rgba(52,211,153,0.22)',
                    background: 'rgba(52,211,153,0.08)',
                    color: '#34d399', fontSize: 11, fontWeight: 700,
                  }}
                >
                  <Handshake style={{ width: 11, height: 11 }} />
                  Предложить
                </motion.button>
              )}
              <ContactButton phone={flight.courierId} accentColor="#0ea5e9" />
            </div>
          )
        )}
      </div>
    </motion.div>

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
    </>
  );
}

// ── Карточка заявки ───────────────────────────────────────────────────────────

function RequestCard({
  request, isMine, onDelete, onClose, onDetail, onChat, onOffer, chatUnread,
}: {
  request: AviaRequest;
  isMine: boolean;
  onDelete: (id: string) => void;
  onClose?: (id: string) => void;
  onDetail?: (r: AviaRequest) => void;
  onChat?: (otherPhone: string, adRef: AviaChatAdRef) => void;
  onOffer?: (request: AviaRequest) => void;
  chatUnread?: number;
}) {
  const [deleting, setDeleting] = useState(false);
  const [closing, setClosing] = useState(false);
  const isClosed = request.status === 'closed';

  // ── AviaConfirmSheet state ──────────────────────────────────────────────────
  type ReqConfirmCfg = { title: string; description: string; variant: 'danger' | 'warning'; label: string; action: () => Promise<void> };
  const [confirmCfg, setConfirmCfg] = useState<ReqConfirmCfg | null>(null);

  const execDelete = async () => {
    setDeleting(true);
    try {
      await deleteAviaRequest(request.id);
      onDelete(request.id);
      toast.success('Заявка удалена', { duration: 2500 });
    } catch (e: any) {
      console.error('[RequestCard] delete error:', e);
      toast.error('Не удалось удалить заявку');
    } finally { setDeleting(false); }
  };

  const execClose = async () => {
    setClosing(true);
    try {
      await closeAviaRequest(request.id);
      if (onClose) onClose(request.id);
      toast.success('Заявка закрыта', { duration: 2500 });
    } catch (e: any) {
      console.error('[RequestCard] close error:', e);
      toast.error('Не удалось закрыть заявку');
    } finally { setClosing(false); }
  };

  const handleDelete = () => setConfirmCfg({ title: 'Удалить заявку?', description: 'Заявка будет удалена навсегда. Это действие нельзя отменить.', variant: 'danger', label: 'Удалить', action: execDelete });
  const handleClose  = () => setConfirmCfg({ title: 'Закрыть заявку?', description: 'Заявка исчезнет из общего списка.', variant: 'warning', label: 'Закрыть', action: execClose });

  return (
    <>
    <motion.div
      className="avia-card-item"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: isClosed ? 0.55 : 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25 }}
      style={{
        padding: '15px 16px', borderRadius: 20,
        background: isClosed
          ? 'rgba(255,255,255,0.02)'
          : isMine
            ? 'linear-gradient(145deg, rgba(167,139,250,0.08) 0%, rgba(109,40,217,0.04) 50%, rgba(6,14,26,0.7) 100%)'
            : 'rgba(255,255,255,0.04)',
        border: `1px solid ${isClosed ? 'rgba(255,255,255,0.05)' : isMine ? 'rgba(167,139,250,0.18)' : 'rgba(255,255,255,0.07)'}`,
        position: 'relative',
        cursor: onDetail ? 'pointer' : undefined,
        boxShadow: isClosed ? 'none' : isMine
          ? '0 4px 20px rgba(167,139,250,0.06), inset 0 1px 0 rgba(167,139,250,0.08)'
          : '0 2px 12px rgba(0,0,0,0.2)',
        overflow: 'hidden',
      }}
      onClick={() => onDetail?.(request)}
    >
      {/* Top shine line for own cards */}
      {isMine && !isClosed && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 1, pointerEvents: 'none',
          background: 'linear-gradient(90deg, transparent, rgba(167,139,250,0.35), transparent)',
        }} />
      )}

      {/* Closed badge overlay */}
      {isClosed && (
        <div style={{
          position: 'absolute', top: 10, right: 12,
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '3px 8px', borderRadius: 6,
          background: '#f59e0b14', border: '1px solid #f59e0b20',
        }}>
          <XCircle style={{ width: 10, height: 10, color: '#f59e0b' }} />
          <span style={{ fontSize: 9, fontWeight: 700, color: '#f59e0b', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Закрыта
          </span>
        </div>
      )}

      {/* Route row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 11,
            background: isClosed ? 'rgba(255,255,255,0.04)' : 'rgba(167,139,250,0.1)',
            border: `1px solid ${isClosed ? 'rgba(255,255,255,0.06)' : 'rgba(167,139,250,0.18)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: isClosed ? 'none' : '0 0 10px rgba(167,139,250,0.1)',
          }}>
            <Package style={{ width: 15, height: 15, color: isClosed ? '#2a3d50' : '#c4b5fd' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: isClosed ? '#3a5268' : '#e2eaf3', letterSpacing: '-0.2px' }}>{request.from}</span>
            <ArrowRight style={{ width: 12, height: 12, color: isClosed ? '#1a2d40' : '#3a2060' }} />
            <span style={{ fontSize: 15, fontWeight: 800, color: isClosed ? '#3a5268' : '#e2eaf3', letterSpacing: '-0.2px' }}>{request.to}</span>
          </div>
        </div>
        {isMine && !isClosed && (
          <span style={{
            fontSize: 9, fontWeight: 700, color: '#a78bfa',
            padding: '3px 8px', borderRadius: 6,
            background: '#a78bfa12', border: '1px solid #a78bfa22',
            letterSpacing: '0.06em', textTransform: 'uppercase',
          }}>
            Моя
          </span>
        )}
      </div>

      {/* Meta */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: request.description ? 8 : 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Calendar style={{ width: 12, height: 12, color: '#4a6080' }} />
          <span style={{ fontSize: 12, color: '#6b8299', fontWeight: 600 }}>
            до {fmtDate(request.beforeDate, 'short')}
          </span>
        </div>
        <span style={{ fontSize: 12, color: '#6b8299', fontWeight: 600 }}>
          {request.weightKg} кг
        </span>
      </div>

      {/* Description */}
      {request.description && (
        <p style={{
          fontSize: 12, color: '#4a6080', lineHeight: 1.45,
          margin: '0 0 10px', padding: '6px 10px', borderRadius: 8,
          background: '#ffffff06',
        }}>
          {request.description}
        </p>
      )}

      {/* Footer */}
      <div onClick={e => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <div style={{
            width: 20, height: 20, borderRadius: 6, flexShrink: 0,
            background: isClosed ? '#ffffff08' : '#a78bfa18',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <User style={{ width: 10, height: 10, color: isClosed ? '#4a6080' : '#a78bfa' }} />
          </div>
          <span style={{ fontSize: 11, color: '#4a6080', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {request.senderName || maskPhone(request.senderId)}
          </span>
        </div>

        {isMine ? (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {!isClosed && (
              <button
                onClick={handleClose}
                disabled={closing}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '5px 10px', borderRadius: 8, cursor: 'pointer',
                  border: '1px solid #f59e0b20', background: '#f59e0b08',
                  color: '#fbbf24', fontSize: 11, fontWeight: 600,
                  opacity: closing ? 0.5 : 1, transition: 'opacity 0.2s',
                }}
              >
                <XCircle style={{ width: 12, height: 12 }} />
                {closing ? '...' : 'Закрыть'}
              </button>
            )}
            <button
              onClick={handleDelete}
              disabled={deleting}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 10px', borderRadius: 8, cursor: 'pointer',
                border: '1px solid #ef444420', background: '#ef444408',
                color: '#f87171', fontSize: 11, fontWeight: 600,
                opacity: deleting ? 0.5 : 1, transition: 'opacity 0.2s',
              }}
            >
              <Trash2 style={{ width: 12, height: 12 }} />
              {deleting ? '...' : 'Удалить'}
            </button>
          </div>
        ) : (
          !isClosed && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {onChat && (
                <motion.button
                  whileTap={{ scale: 0.94 }}
                  onClick={() => onChat(request.senderId, { type: 'request', id: request.id, from: request.from, to: request.to })}
                  style={{
                    position: 'relative',
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '5px 10px', borderRadius: 9, cursor: 'pointer',
                    border: '1px solid rgba(167,139,250,0.22)',
                    background: 'rgba(167,139,250,0.08)',
                    color: '#a78bfa', fontSize: 11, fontWeight: 700,
                  }}
                >
                  <MessageCircle style={{ width: 11, height: 11 }} />
                  Написать
                  {(chatUnread || 0) > 0 && (
                    <span style={{
                      position: 'absolute', top: -4, right: -4,
                      minWidth: 14, height: 14, borderRadius: 7,
                      background: '#a78bfa', color: '#fff',
                      fontSize: 8, fontWeight: 800,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: '0 3px',
                      border: '2px solid #060d18',
                      boxShadow: '0 0 6px rgba(167,139,250,0.5)',
                    }}>
                      {chatUnread}
                    </span>
                  )}
                </motion.button>
              )}
              {onOffer && (
                <motion.button
                  whileTap={{ scale: 0.94 }}
                  onClick={() => onOffer(request)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '5px 10px', borderRadius: 9, cursor: 'pointer',
                    border: '1px solid rgba(52,211,153,0.22)',
                    background: 'rgba(52,211,153,0.08)',
                    color: '#34d399', fontSize: 11, fontWeight: 700,
                  }}
                >
                  <Handshake style={{ width: 11, height: 11 }} />
                  Предложить
                </motion.button>
              )}
              <ContactButton phone={request.senderId} accentColor="#a78bfa" />
            </div>
          )
        )}
      </div>
    </motion.div>

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
    </>
  );
}

// ── Пустой стейт ──────────────────────────────────────────────────────────────

function EmptyState({ icon: Icon, text, color }: { icon: typeof Plane; text: string; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        textAlign: 'center', padding: '44px 24px',
        background: 'rgba(255,255,255,0.02)', borderRadius: 20,
        border: '1px dashed rgba(255,255,255,0.07)',
      }}
    >
      <div style={{
        width: 56, height: 56, borderRadius: 18, margin: '0 auto 14px',
        background: `${color}0a`, border: `1px solid ${color}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon style={{ width: 24, height: 24, color, opacity: 0.5 }} />
      </div>
      <p style={{ fontSize: 13, color: '#2a4060', margin: 0, lineHeight: 1.7, whiteSpace: 'pre-line', fontWeight: 500 }}>
        {text}
      </p>
    </motion.div>
  );
}

// ── Главный компонент ─────────────────────────────────────────────────────────

export function AviaDashboard() {
  const navigate = useNavigate();
  const { user, logout, isAuth } = useAvia();

  const [flights, setFlights] = useState<AviaFlight[]>([]);
  const [requests, setRequests] = useState<AviaRequest[]>([]);
  const [myFlights, setMyFlights] = useState<AviaFlight[]>([]);
  const [myRequests, setMyRequests] = useState<AviaRequest[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingMy, setLoadingMy] = useState(false);
  const [activeTab, setActiveTab] = useState<'flights' | 'requests' | 'my'>('flights');
  const [showFlightModal, setShowFlightModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [detailFlight, setDetailFlight] = useState<AviaFlight | null>(null);
  const [detailRequest, setDetailRequest] = useState<AviaRequest | null>(null);

  // ── Пакет I: Сделки ────────────────────────────────────────────────────────
  const [dealOfferFlight, setDealOfferFlight] = useState<AviaFlight | null>(null);
  const [dealOfferRequest, setDealOfferRequest] = useState<AviaRequest | null>(null);
  const [pendingDealsCount, setPendingDealsCount] = useState(0);

  const fetchDealsCount = useCallback(() => {
    if (!user?.phone) return;
    getAviaDeals(user.phone)
      .then(deals => {
        const incoming = deals.filter(d => d.recipientPhone === user.phone && d.status === 'pending').length;
        setPendingDealsCount(incoming);
      })
      .catch((e) => console.warn('[AviaDashboard] fetchDealsCount error:', e));
  }, [user?.phone]);

  useEffect(() => {
    fetchDealsCount();
    const t = setInterval(fetchDealsCount, 30_000);
    return () => clearInterval(t);
  }, [fetchDealsCount]);

  // ── Пакет G: Центр уведомлений — берём из контекста ───────────────────────
  const [showNotifications, setShowNotifications] = useState(false);
  const { notifications, unreadCount, refreshNotifications, updateNotifications, passportDaysLeft } = useAvia();
  const prevUnreadRef = useRef<number>(0);

  // Toast при появлении новых уведомлений во время polling
  useEffect(() => {
    const prev = prevUnreadRef.current;
    if (unreadCount > prev && prev >= 0) {
      const newOnes = notifications.filter(n => n.isUnread).slice(0, 1);
      if (newOnes.length > 0) {
        toast(newOnes[0].title, {
          description: newOnes[0].description?.slice(0, 80),
          duration: 4000,
          action: { label: 'Открыть', onClick: () => setShowNotifications(true) },
        });
      }
    }
    prevUnreadRef.current = unreadCount;
  }, [unreadCount]);

  // ── Пакет H: Чат → навигация на /avia/messages ────────────────────────────
  const { chatUnreadCount } = useAvia();

  const handleOpenChat = (otherPhone: string, adRef: AviaChatAdRef) => {
    const chatId = makeAviaChatId(user!.phone, otherPhone);
    const params = new URLSearchParams({
      chatId, otherPhone,
      adType: adRef.type, adId: adRef.id,
      adFrom: adRef.from, adTo: adRef.to,
      ...(adRef.date ? { adDate: adRef.date } : {}),
    });
    navigate(`/avia/messages?${params.toString()}`);
  };

  // ── Пакет E+F: Поиск + Сортировка ──
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<AvSortKey>('date-desc');

  // ── Пакет M: Фильтры v2 (client-side) ──
  const [flightFS, setFlightFS] = useState<AviaFilterState>(EMPTY_FILTER_STATE);
  const [requestFS, setRequestFS] = useState<AviaFilterState>(EMPTY_FILTER_STATE);
  const [showFlightFilter, setShowFlightFilter] = useState(false);
  const [showRequestFilter, setShowRequestFilter] = useState(false);

  // Загружаем все данные без серверных фильтров — фильтрация выполняется на клиенте (Пакет M)
  const fetchMainData = () => {
    return Promise.all([
      getAviaFlights(),
      getAviaRequests(),
    ]).then(([f, r]) => {
      setFlights(f);
      setRequests(r);
      prevFlightIdsRef.current = new Set(f.map(x => x.id));
      prevRequestIdsRef.current = new Set(r.map(x => x.id));
    });
  };

  const fetchMyData = () => {
    if (!user?.phone) return Promise.resolve();
    setLoadingMy(true);
    return getMyAviaAds(user.phone)
      .then(({ flights: mf, requests: mr }) => { setMyFlights(mf); setMyRequests(mr); })
      .catch((e) => console.error('[AviaDashboard] fetch my error:', e))
      .finally(() => setLoadingMy(false));
  };

  useEffect(() => {
    if (!user) return;
    setLoadingData(true);
    fetchMainData()
      .catch((e) => console.error('[AviaDashboard] fetch error:', e))
      .finally(() => setLoadingData(false));
  }, [user?.id]);

  // ── Загрузка уведомлений (polling теперь в AviaContext) ───────────────────
  // Контекст сам делает polling каждые 20с; при монтировании просто рефрешим
  useEffect(() => {
    if (user?.phone) refreshNotifications();
  }, [user?.phone]);

  // Загружаем «Мои» при первом переключении на вкладку
  useEffect(() => {
    if (activeTab === 'my' && myFlights.length === 0 && myRequests.length === 0 && !loadingMy) {
      fetchMyData();
    }
  }, [activeTab]);

  // ── Карта chatId → unread для per-card бейджей (ДО условного return!) ────
  const chatUnreadByPhone = useRef<Record<string, number>>({});
  useEffect(() => {
    if (!user?.phone) return;
    getAviaUserChats(user.phone).then(chats => {
      const map: Record<string, number> = {};
      for (const chat of chats) {
        const other = chat.participants.find(p => p !== user.phone) || '';
        if (other) map[other] = (map[other] || 0) + (chat.unread || 0);
      }
      chatUnreadByPhone.current = map;
    }).catch((e) => console.warn('[AviaDashboard] chatUnreadByPhone error:', e));
  }, [user?.phone, chatUnreadCount]);

  // ── Пакет D: Auto-polling + New items counter + Pull-to-refresh ─────────────
  const POLL_INTERVAL = 30_000; // 30 секунд
  // Используем refs вместо state для отслеживания ID — предотвращает
  // пересоздание silentPoll на каждом обновлении данных (бесконечный цикл).
  const prevFlightIdsRef = useRef<Set<string>>(new Set());
  const prevRequestIdsRef = useRef<Set<string>>(new Set());
  const [newFlightsCount, setNewFlightsCount] = useState(0);
  const [newRequestsCount, setNewRequestsCount] = useState(0);
  const [lastPollAt, setLastPollAt] = useState<string>('');
  const isInitialLoad = useRef(true);

  // Тихий polling без setLoadingData.
  // Зависит только от user — refs читаются напрямую без подписки на изменения.
  const silentPoll = useCallback(() => {
    if (!user) return;
    Promise.all([
      getAviaFlights(),
      getAviaRequests(),
    ]).then(([newF, newR]) => {
      if (!isInitialLoad.current) {
        const newFIds = new Set(newF.map(f => f.id));
        const newRIds = new Set(newR.map(r => r.id));
        let addedFlights = 0;
        let addedRequests = 0;
        newFIds.forEach(id => { if (!prevFlightIdsRef.current.has(id)) addedFlights++; });
        newRIds.forEach(id => { if (!prevRequestIdsRef.current.has(id)) addedRequests++; });
        if (addedFlights > 0) setNewFlightsCount(prev => prev + addedFlights);
        if (addedRequests > 0) setNewRequestsCount(prev => prev + addedRequests);
      }
      // Refs обновляются без setState — нет лишних ре-рендеров
      prevFlightIdsRef.current = new Set(newF.map(f => f.id));
      prevRequestIdsRef.current = new Set(newR.map(r => r.id));
      setFlights(newF);
      setRequests(newR);
      setLastPollAt(new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }));
      isInitialLoad.current = false;
    }).catch(e => console.warn('[AviaDashboard] poll error:', e));
  }, [user]); // только user; refs читаются без подписки на их изменения

  // Авто-polling по интервалу
  useEffect(() => {
    if (!user) return;
    const timer = setInterval(silentPoll, POLL_INTERVAL);
    return () => clearInterval(timer);
  }, [silentPoll, user]);

  // ── Pull-to-refresh ─────────────────────────────────────────────────────
  const contentRef = useRef<HTMLDivElement>(null);
  const [pullY, setPullY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const touchActive = useRef(false);
  const PULL_THRESHOLD = 70;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const el = contentRef.current;
    if (!el || el.scrollTop > 5) return;
    touchStartY.current = e.touches[0].clientY;
    touchActive.current = true;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchActive.current || isRefreshing) return;
    const delta = e.touches[0].clientY - touchStartY.current;
    if (delta < 0) { setPullY(0); return; }
    const dampened = Math.min(delta * 0.45, 120);
    setPullY(dampened);
    setIsPulling(dampened >= PULL_THRESHOLD);
  }, [isRefreshing]);

  const handleTouchEnd = useCallback(() => {
    touchActive.current = false;
    if (isPulling && !isRefreshing) {
      setIsRefreshing(true);
      setPullY(50);
      const promises: Promise<any>[] = [fetchMainData()];
      if (activeTab === 'my') promises.push(fetchMyData());
      Promise.all(promises)
        .then(() => {
          setNewFlightsCount(0);
          setNewRequestsCount(0);
          toast('Обновлено', { duration: 1200 });
        })
        .catch(() => toast.error('Ошибка обновления'))
        .finally(() => {
          setIsRefreshing(false);
          setPullY(0);
          setIsPulling(false);
        });
    } else {
      setPullY(0);
      setIsPulling(false);
    }
  }, [isPulling, isRefreshing, activeTab, fetchMainData, fetchMyData]);

  if (!isAuth || !user) return null;

  // ── Производные значения ──────────────────────────────────────────────────
  const role      = ROLE_META[user.role] || ROLE_META.both;
  const tabLabels = TAB_LABELS[user.role] || TAB_LABELS.both;
  const RoleIcon  = role.icon;
  const hasPassport = !!(user.passportPhoto || user.passportPhotoPath);
  const adCheck   = canCreateAd(user);
  const requestCheck = canCreateRequest(user);
  const myPhone   = user.phone;

  const isExpired = (() => {
    if (!user.passportExpiryDate) return false;
    return new Date(user.passportExpiryDate).getTime() < Date.now();
  })();

  // ── Пакет E: Локальный текстовый поиск ─────────────────────────────────────
  const searchLower = searchQuery.toLowerCase().trim();

  const matchesFlight = (f: AviaFlight) => {
    if (!searchLower) return true;
    return [f.from, f.to, f.flightNo, f.courierName, f.id]
      .filter(Boolean)
      .some(v => v!.toLowerCase().includes(searchLower));
  };

  const matchesRequest = (r: AviaRequest) => {
    if (!searchLower) return true;
    return [r.from, r.to, r.description, r.senderName, r.id]
      .filter(Boolean)
      .some(v => v!.toLowerCase().includes(searchLower));
  };

  // ── Пакет F: Сортировка ──────────────────────────────────────────────────
  const sortFlights = (arr: AviaFlight[]) => {
    const sorted = [...arr];
    switch (sortKey) {
      case 'date-desc': sorted.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); break;
      case 'date-asc':  sorted.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); break;
      case 'weight-desc': sorted.sort((a, b) => (b.freeKg || 0) - (a.freeKg || 0)); break;
      case 'weight-asc':  sorted.sort((a, b) => (a.freeKg || 0) - (b.freeKg || 0)); break;
      case 'price-asc':  sorted.sort((a, b) => (a.pricePerKg || 0) - (b.pricePerKg || 0)); break;
      case 'price-desc': sorted.sort((a, b) => (b.pricePerKg || 0) - (a.pricePerKg || 0)); break;
    }
    return sorted;
  };

  const sortRequests = (arr: AviaRequest[]) => {
    const sorted = [...arr];
    switch (sortKey) {
      case 'date-desc': sorted.sort((a, b) => new Date(b.beforeDate).getTime() - new Date(a.beforeDate).getTime()); break;
      case 'date-asc':  sorted.sort((a, b) => new Date(a.beforeDate).getTime() - new Date(b.beforeDate).getTime()); break;
      case 'weight-desc': sorted.sort((a, b) => (b.weightKg || 0) - (a.weightKg || 0)); break;
      case 'weight-asc':  sorted.sort((a, b) => (a.weightKg || 0) - (b.weightKg || 0)); break;
      default: break; // price не применимо к заявкам
    }
    return sorted;
  };

  const preFilteredFlights = user.role === 'courier'
    ? flights.filter(f => f.courierId === myPhone)
    : flights;
  const preFilteredRequests = user.role === 'sender'
    ? requests.filter(r => r.senderId === myPhone)
    : requests;

  // Пакет M: клиентская фильтрация поверх role-prefilter
  const displayFlights = sortFlights(
    applyFlightFilters(preFilteredFlights, flightFS, myPhone).filter(matchesFlight)
  );
  const displayRequests = sortRequests(
    applyRequestFilters(preFilteredRequests, requestFS, myPhone).filter(matchesRequest)
  );

  // Пакет M: производные для chips + filter badge
  const activeFS      = activeTab === 'flights' ? flightFS : requestFS;
  const activeAccent  = activeTab === 'flights' ? '#0ea5e9' : '#a78bfa';
  const activeFilterCount = activeTab !== 'my' ? countActiveFilters(activeFS) : 0;
  const activeChips   = activeTab !== 'my' ? getFilterChips(activeFS) : [];

  const myTotalCount = myFlights.length + myRequests.length;
  const myActiveCount = myFlights.filter(f => f.status !== 'closed').length + myRequests.filter(r => r.status !== 'closed').length;
  const myClosedCount = myTotalCount - myActiveCount;

  const showCreateFlight  = activeTab === 'flights'  && (user.role === 'courier' || user.role === 'both');
  const showCreateRequest = activeTab === 'requests' && (user.role === 'sender'  || user.role === 'both');
  const showCreateBtn     = (showCreateFlight || showCreateRequest) && activeTab !== 'my';
  const createBtnDisabled = showCreateFlight ? !adCheck.allowed : !requestCheck.allowed;

  const handleRefresh = () => {
    setLoadingData(true);
    const promises: Promise<any>[] = [fetchMainData()];
    if (activeTab === 'my') promises.push(fetchMyData());
    Promise.all(promises)
      .then(() => {
        setNewFlightsCount(0);
        setNewRequestsCount(0);
        setLastPollAt(new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }));
        toast('Обновлено', { duration: 1500 });
      })
      .catch(() => toast.error('Ошибка обновления'))
      .finally(() => setLoadingData(false));
  };

  // Сброс счётчика при переключении на вкладку
  const handleTabChange = (tab: 'flights' | 'requests' | 'my') => {
    if (tab === 'flights') setNewFlightsCount(0);
    if (tab === 'requests') setNewRequestsCount(0);
    setSearchQuery('');
    setSortKey('date-desc');
    setShowFlightFilter(false);
    setShowRequestFilter(false);
    setActiveTab(tab);
  };

  // При закрытии из основного списка — убираем из flights/requests и обновляем «Мои»
  const handleCloseFlight = (id: string) => {
    setFlights(prev => prev.filter(f => f.id !== id));
    setMyFlights(prev => prev.map(f => f.id === id ? { ...f, status: 'closed' } : f));
  };

  const handleCloseRequest = (id: string) => {
    setRequests(prev => prev.filter(r => r.id !== id));
    setMyRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'closed' } : r));
  };

  const handleLogout = () => {
    logout();
    navigate('/avia', { replace: true });
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="avia-dashboard-root" style={{
      minHeight: '100vh',
      background: 'var(--avia-bg)',
      fontFamily: "'Sora', 'Inter', sans-serif",
    }}>

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <motion.div
        className="avia-dash-header"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid rgba(14,165,233,0.07)',
          background: 'rgba(6,14,26,0.8)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          position: 'sticky', top: 0, zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          {/* Лого — скрыто на десктопе (есть в сайдбаре) */}
          <div className="md:hidden flex items-center justify-center" style={{
            width: 38, height: 38, borderRadius: 13,
            background: 'linear-gradient(135deg, #1245b0 0%, #1a6fd4 60%, #2f8fe0 100%)',
            boxShadow: '0 0 0 1px rgba(47,143,224,0.2), 0 4px 16px rgba(26,71,200,0.4)',
          }}>
            <Plane style={{ width: 18, height: 18, color: '#fff' }} />
          </div>
          <div>
            {/* На мобиле — «Ovora AVIA», на десктопе — «Главная» */}
            <div className="md:hidden" style={{ fontSize: 15, fontWeight: 900, color: '#e2eaf3', letterSpacing: '-0.4px', lineHeight: 1 }}>
              Ovora AVIA
            </div>
            <div className="hidden md:block" style={{ fontSize: 18, fontWeight: 800, color: '#e2eaf3', letterSpacing: '-0.3px', lineHeight: 1 }}>
              Главная
            </div>
            <div style={{ fontSize: 10, color: '#1e3a55', fontWeight: 600, marginTop: 3 }}>
              {user.firstName
                ? `${user.firstName} ${user.lastName || ''}`.trim()
                : maskPhone(myPhone)}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'center' }}>
          {/* ── Bell (Пакет G + K) — скрыт на десктопе (есть в сайдбаре) ── */}
          <button
            onClick={() => setShowNotifications(true)}
            className="md:hidden flex items-center justify-center"
            style={{
              width: 34, height: 34, borderRadius: 10,
              border: `1px solid ${unreadCount > 0 ? 'rgba(14,165,233,0.28)' : '#ffffff12'}`,
              background: unreadCount > 0 ? 'rgba(14,165,233,0.10)' : '#ffffff08',
              color: unreadCount > 0 ? '#38bdf8' : '#6b8299',
              cursor: 'pointer',
              position: 'relative',
            }}
            aria-label="Уведомления"
          >
            <motion.div
              animate={unreadCount > 0 ? { rotate: [0, -12, 12, -8, 8, 0] } : {}}
              transition={unreadCount > 0 ? { duration: 0.5, repeat: Infinity, repeatDelay: 4 } : {}}
            >
              <Bell style={{ width: 16, height: 16 }} />
            </motion.div>
            {unreadCount > 0 && (
              <>
                {/* Pulse ring */}
                <motion.span
                  animate={{ scale: [1, 1.7, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{
                    position: 'absolute', top: -3, right: -3,
                    width: 16, height: 16, borderRadius: '50%',
                    background: 'rgba(14,165,233,0.35)',
                    pointerEvents: 'none',
                  }}
                />
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  style={{
                    position: 'absolute', top: -3, right: -3,
                    minWidth: 16, height: 16,
                    background: '#0ea5e9',
                    borderRadius: '50%',
                    fontSize: 9, fontWeight: 800, color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '0 3px',
                    border: '2px solid #060d18',
                    lineHeight: 1,
                  }}
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </motion.span>
              </>
            )}
          </button>


        </div>
      </motion.div>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <div
        ref={contentRef}
        className="avia-dash-content"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          maxWidth: 1400, margin: '0 auto',
          overflowY: 'auto', position: 'relative',
        }}
      >
        {/* Pull-to-refresh indicator */}
        <AnimatePresence>
          {pullY > 10 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: Math.min(pullY / PULL_THRESHOLD, 1), y: pullY - 40 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.15 }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '8px 0', marginBottom: 4,
              }}
            >
              <motion.div
                animate={{ rotate: isRefreshing ? 360 : isPulling ? 180 : 0 }}
                transition={isRefreshing ? { repeat: Infinity, duration: 0.8, ease: 'linear' } : { duration: 0.2 }}
              >
                {isRefreshing
                  ? <RefreshCw style={{ width: 16, height: 16, color: '#0ea5e9' }} />
                  : <ArrowDown style={{ width: 16, height: 16, color: isPulling ? '#0ea5e9' : '#4a6080' }} />}
              </motion.div>
              <span style={{
                fontSize: 11, fontWeight: 600,
                color: isPulling || isRefreshing ? '#0ea5e9' : '#4a6080',
              }}>
                {isRefreshing ? 'Обновление...' : isPulling ? 'Отпустите' : 'Потяните для обновления'}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Last poll timestamp */}
        {lastPollAt && !loadingData && (
          <div style={{
            textAlign: 'center', fontSize: 9, color: '#2a3d50',
            marginBottom: 6, fontWeight: 600,
          }}>
            Обновлено в {lastPollAt}
          </div>
        )}

        {/* ── Статус паспорта ── */}
        <AnimatePresence>
          {!hasPassport && (
            <motion.button
              key="passport-missing"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ delay: 0.05, duration: 0.3 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/avia/profile')}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 16px', borderRadius: 16, cursor: 'pointer',
                background: '#f59e0b0c', border: '1.5px solid #f59e0b28',
                textAlign: 'left', marginBottom: 10,
              }}
            >
              <ShieldAlert style={{ width: 20, height: 20, color: '#f59e0b', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fbbf24' }}>Загрузите паспорт</div>
                <div style={{ fontSize: 11, color: '#92743a', marginTop: 1 }}>
                  Необходимо для публикации объявлений
                </div>
              </div>
              <ArrowRight style={{ width: 13, height: 13, color: '#f59e0b40', flexShrink: 0 }} />
            </motion.button>
          )}

          {hasPassport && isExpired && (
            <motion.div
              key="passport-expired"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px', borderRadius: 14,
                background: '#ef44440c', border: '1.5px solid #ef444425',
                marginBottom: 10,
              }}
            >
              <ShieldX style={{ width: 18, height: 18, color: '#ef4444', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#f87171' }}>Паспорт просрочен</div>
                <div style={{ fontSize: 11, color: '#b45454', marginTop: 1 }}>Создание объявлений заблокировано</div>
              </div>
            </motion.div>
          )}

          {hasPassport && !isExpired && (
            <motion.div
              key="passport-ok"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 14px', borderRadius: 12,
                background: '#34d39908', border: '1px solid #34d39918',
                marginBottom: 10,
              }}
            >
              <ShieldCheck style={{ width: 14, height: 14, color: '#34d399' }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#34d399' }}>Паспорт загружен</span>
              {user.passportExpiryDate && (
                <span style={{ fontSize: 10, color: '#3d5268', marginLeft: 'auto' }}>
                  до {fmtDate(user.passportExpiryDate, 'short')}
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Role badge ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 14px', borderRadius: 12,
            background: `${role.color}0a`, border: `1px solid ${role.color}1a`,
            marginBottom: 16,
          }}
        >
          <RoleIcon style={{ width: 14, height: 14, color: role.color }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: role.color }}>{role.label}</span>
          {!adCheck.allowed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
              <AlertTriangle style={{ width: 11, height: 11, color: '#f59e0b' }} />
              <span style={{ fontSize: 10, color: '#c9922a' }}>Создание недоступно</span>
            </div>
          )}
        </motion.div>

        {/* ── Баннер истечения паспорта ── */}
        {passportDaysLeft !== null && passportDaysLeft >= 0 && passportDaysLeft <= 30 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => navigate('/avia/profile')}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px', borderRadius: 12, cursor: 'pointer',
              background: passportDaysLeft <= 7 ? '#ef444410' : '#f59e0b0a',
              border: `1px solid ${passportDaysLeft <= 7 ? '#ef444428' : '#f59e0b22'}`,
              marginBottom: 12,
            }}
          >
            <AlertTriangle style={{
              width: 14, height: 14, flexShrink: 0,
              color: passportDaysLeft <= 7 ? '#ef4444' : '#f59e0b',
            }} />
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: passportDaysLeft <= 7 ? '#f87171' : '#fbbf24' }}>
                Паспорт истекает через {passportDaysLeft} дн.
              </span>
              <span style={{ fontSize: 10, color: '#4a6080', marginLeft: 6 }}>
                Обновите в профиле →
              </span>
            </div>
          </motion.div>
        )}

        {/* ── Tabs + кнопки ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.3 }}
          className="avia-dash-tabs-row"
          style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}
        >
          {/* Tab switcher */}
          <div style={{
            display: 'flex', flex: 1,
            background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 4,
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)',
          }}>
            {(['flights', 'requests', 'my'] as const).map((tab) => {
              const isActive = activeTab === tab;
              const count = tab === 'flights'
                ? displayFlights.length
                : tab === 'requests'
                  ? displayRequests.length
                  : myTotalCount;
              const tabColor = tab === 'flights' ? '#0ea5e9' : tab === 'requests' ? '#a78bfa' : '#34d399';
              const tabLabel = tab === 'my' ? 'Мои' : tabLabels[tab];
              const TabIcon = tab === 'flights' ? Plane : tab === 'requests' ? Package : Bookmark;
              const newCount = tab === 'flights' ? newFlightsCount : tab === 'requests' ? newRequestsCount : 0;
              return (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  style={{
                    flex: 1, padding: '8px 4px',
                    borderRadius: 10, border: `1px solid ${isActive ? tabColor + '18' : 'transparent'}`,
                    background: isActive ? `${tabColor}10` : 'transparent',
                    color: isActive ? tabColor : '#2a4060',
                    fontSize: 11, fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'background 0.2s, color 0.2s, border-color 0.2s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                    position: 'relative',
                    boxShadow: isActive ? `0 0 14px ${tabColor}12` : 'none',
                  }}
                >
                  <TabIcon style={{ width: 12, height: 12 }} />
                  {tabLabel}
                  <span style={{
                    fontSize: 9, fontWeight: 700,
                    background: isActive ? `${tabColor}20` : '#ffffff10',
                    color: isActive ? tabColor : '#3d5268',
                    padding: '1px 5px', borderRadius: 5,
                    minWidth: 16, textAlign: 'center',
                  }}>
                    {(tab === 'my' ? loadingMy : loadingData) ? '·' : count}
                  </span>
                  {/* New items badge */}
                  {newCount > 0 && !isActive && (
                    <span style={{
                      position: 'absolute', top: 1, right: 6,
                      fontSize: 8, fontWeight: 800,
                      background: '#ef4444', color: '#fff',
                      padding: '1px 4px', borderRadius: 6,
                      minWidth: 14, textAlign: 'center',
                      lineHeight: '13px',
                      boxShadow: '0 2px 6px #ef444444',
                      animation: 'pulse-badge 2s infinite',
                    }}>
                      +{newCount > 9 ? '9+' : newCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Refresh */}
          <button
            onClick={handleRefresh}
            disabled={loadingData}
            style={{
              width: 34, height: 34, borderRadius: 10,
              border: '1px solid #ffffff10', background: '#ffffff06',
              color: '#4a6080', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: loadingData ? 0.5 : 1, transition: 'opacity 0.2s',
            }}
          >
            <RefreshCw style={{
              width: 13, height: 13,
              animation: loadingData ? 'spin 1s linear infinite' : 'none',
            }} />
          </button>

          {/* Create */}
          <AnimatePresence mode="wait">
            {showCreateBtn && (
              <motion.button
                key={activeTab + '-create'}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.2 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => {
                  if (createBtnDisabled) {
                    navigate('/avia/profile');
                    const reason = showCreateFlight ? adCheck.reason : requestCheck.reason;
                    toast(reason || 'Необходимо заполнить профиль', { icon: '🛂' });
                    return;
                  }
                  if (showCreateFlight) setShowFlightModal(true);
                  else setShowRequestModal(true);
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '8px 14px', borderRadius: 10, border: 'none',
                  background: createBtnDisabled
                    ? '#ffffff08'
                    : activeTab === 'flights'
                      ? 'linear-gradient(135deg, #0369a1, #0ea5e9)'
                      : 'linear-gradient(135deg, #6d28d9, #a78bfa)',
                  color: createBtnDisabled ? '#3d5268' : '#fff',
                  fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  boxShadow: createBtnDisabled ? 'none'
                    : activeTab === 'flights'
                      ? '0 4px 14px #0ea5e928'
                      : '0 4px 14px #a78bfa28',
                  whiteSpace: 'nowrap',
                  transition: 'background 0.2s',
                }}
              >
                <Plus style={{ width: 13, height: 13 }} />
                Создать
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── Пакет M: Поиск v2 + Кнопка фильтров ── */}
        {activeTab !== 'my' && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="avia-dash-search-row"
            style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center', flexWrap: 'wrap' }}
          >
            {/* AviaSearchBar с дебаунсом и историей */}
            <AviaSearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder={activeTab === 'flights' ? 'Рейс, город, курьер...' : 'Город, товар, описание...'}
              accentColor={activeAccent}
            />

            {/* Кнопка фильтров */}
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => activeTab === 'flights' ? setShowFlightFilter(true) : setShowRequestFilter(true)}
              style={{
                width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                border: `1px solid ${activeFilterCount > 0 ? activeAccent + '35' : '#ffffff10'}`,
                background: activeFilterCount > 0 ? activeAccent + '0e' : '#ffffff06',
                color: activeFilterCount > 0 ? activeAccent : '#6b8299',
                cursor: 'pointer', position: 'relative',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.2s, border-color 0.2s, color 0.2s',
              }}
              aria-label="Фильтры"
            >
              <SlidersHorizontal style={{ width: 14, height: 14 }} />
              <AnimatePresence>
                {activeFilterCount > 0 && (
                  <motion.span
                    key="filter-badge"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    style={{
                      position: 'absolute', top: -4, right: -4,
                      minWidth: 16, height: 16, borderRadius: '50%',
                      background: activeAccent, color: '#fff',
                      fontSize: 8, fontWeight: 800,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: '0 3px', border: '2px solid #060d18',
                    }}
                  >
                    {activeFilterCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Сортировка */}
            <select
              value={sortKey}
              onChange={e => setSortKey(e.target.value as AvSortKey)}
              style={{
                padding: '8px 22px 8px 8px',
                borderRadius: 10, border: '1px solid #ffffff10',
                background: '#0a1628', color: '#8ea8b8',
                fontSize: 11, fontWeight: 600, cursor: 'pointer',
                outline: 'none', minWidth: 96, flexShrink: 0,
                appearance: 'none',
                backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'10\' height=\'6\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0l5 6 5-6z\' fill=\'%234a6080\'/%3E%3C/svg%3E")',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 7px center',
              }}
            >
              <option value="date-desc">Дата ↓</option>
              <option value="date-asc">Дата ↑</option>
              <option value="weight-desc">Вес ↓</option>
              <option value="weight-asc">Вес ↑</option>
              {activeTab === 'flights' && <option value="price-asc">Цена ↑</option>}
              {activeTab === 'flights' && <option value="price-desc">Цена ↓</option>}
            </select>
          </motion.div>
        )}

        {/* ── Пакет M: Chip-теги активных фильтров ── */}
        <AnimatePresence>
          {activeTab !== 'my' && activeChips.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
              style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}
            >
              {activeChips.map(chip => (
                <motion.button
                  key={chip.key}
                  initial={{ opacity: 0, scale: 0.82 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.82 }}
                  transition={{ duration: 0.15 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => {
                    const next = removeFilterChip(activeFS, chip.field);
                    if (activeTab === 'flights') setFlightFS(next);
                    else setRequestFS(next);
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '4px 10px', borderRadius: 20,
                    background: activeAccent + '14',
                    border: `1px solid ${activeAccent}28`,
                    color: activeAccent, fontSize: 11, fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {chip.label}
                  <X style={{ width: 9, height: 9, opacity: 0.7 }} />
                </motion.button>
              ))}
              {activeChips.length > 1 && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.82 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.82 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => {
                    if (activeTab === 'flights') setFlightFS(EMPTY_FILTER_STATE);
                    else setRequestFS(EMPTY_FILTER_STATE);
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    padding: '4px 10px', borderRadius: 20,
                    background: '#ffffff06', border: '1px solid #ffffff10',
                    color: '#4a6080', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  <X style={{ width: 9, height: 9 }} />
                  Сбросить все
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Счётчик результатов поиска */}
        {(searchQuery || activeFilterCount > 0) && activeTab !== 'my' && (
          <div style={{
            fontSize: 11, color: '#4a6080', fontWeight: 600,
            marginBottom: 8, textAlign: 'center',
          }}>
            {activeTab === 'flights'
              ? `Найдено рейсов: ${displayFlights.length}`
              : `Найдено заявок: ${displayRequests.length}`}
          </div>
        )}

        {/* ── Списки ── */}
        <AnimatePresence mode="wait">
          {activeTab === 'flights' && (
            <motion.div
              key="flights-list"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.22 }}
            >
              {loadingData ? (
                <div className="avia-cards-grid">{[0, 1, 2, 3].map(i => <SkeletonCard key={i} />)}</div>
              ) : displayFlights.length === 0 ? (
                <EmptyState
                  icon={searchQuery ? Search : Plane}
                  color="#0ea5e9"
                  text={
                    searchQuery
                      ? `Ничего не найдено по «${searchQuery}».\nПопробуйте другой запрос.`
                      : user.role === 'courier'
                        ? 'У вас пока нет опубликованных рейсов.\nНажмите «Создать», чтобы добавить первый.'
                        : 'Активных рейсов пока нет. Попробуйте обновить позже.'
                  }
                />
              ) : (
                <>
                  <div className="avia-cards-grid">
                    <AnimatePresence>
                      {displayFlights.map((f) => (
                        <FlightCard
                          key={f.id}
                          flight={f}
                          isMine={f.courierId === myPhone}
                          onDelete={(id) => setFlights(prev => prev.filter(x => x.id !== id))}
                          onClose={handleCloseFlight}
                          onComplete={(id) => {
                            setFlights(prev => prev.map(x => x.id === id ? { ...x, status: 'completed' } : x));
                            setMyFlights(prev => prev.map(x => x.id === id ? { ...x, status: 'completed' } : x));
                          }}
                          onDetail={setDetailFlight}
                          onChat={f.courierId !== myPhone ? handleOpenChat : undefined}
                          onOffer={f.courierId !== myPhone && (user.role === 'sender' || user.role === 'both')
                            ? (fl) => setDealOfferFlight(fl) : undefined}
                          chatUnread={f.courierId !== myPhone ? (chatUnreadByPhone.current[f.courierId] || 0) : undefined}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {activeTab === 'requests' && (
            <motion.div
              key="requests-list"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.22 }}
            >
              {loadingData ? (
                <div className="avia-cards-grid">{[0, 1, 2, 3].map(i => <SkeletonCard key={i} />)}</div>
              ) : displayRequests.length === 0 ? (
                <EmptyState
                  icon={searchQuery ? Search : Package}
                  color="#a78bfa"
                  text={
                    searchQuery
                      ? `Ничего не найдено по «${searchQuery}».\nПопробуйте другой запрос.`
                      : user.role === 'sender'
                        ? 'У вас пока нет заявок.\nНажмите «Создать», чтобы найти курьера.'
                        : 'Заявок от отправителей пока нет. Попробуйте позже.'
                  }
                />
              ) : (
                <div className="avia-cards-grid">
                  <AnimatePresence>
                    {displayRequests.map((r) => (
                      <RequestCard
                        key={r.id}
                        request={r}
                        isMine={r.senderId === myPhone}
                        onDelete={(id) => setRequests(prev => prev.filter(x => x.id !== id))}
                        onClose={handleCloseRequest}
                        onDetail={setDetailRequest}
                        onChat={r.senderId !== myPhone ? handleOpenChat : undefined}
                        onOffer={r.senderId !== myPhone && (user.role === 'courier' || user.role === 'both')
                          ? (req) => setDealOfferRequest(req) : undefined}
                        chatUnread={r.senderId !== myPhone ? (chatUnreadByPhone.current[r.senderId] || 0) : undefined}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'my' && (
            <motion.div
              key="my-list"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.22 }}
            >
              {loadingMy ? (
                <div className="avia-cards-grid">{[0, 1, 2, 3].map(i => <SkeletonCard key={i} />)}</div>
              ) : myTotalCount === 0 ? (
                <EmptyState
                  icon={Bookmark}
                  color="#34d399"
                  text={'У вас пока нет объявлений.\nСоздайте рейс или заявку на вкладках выше.'}
                />
              ) : (
                <>
                  {/* Статистика */}
                  <div style={{
                    display: 'flex', gap: 8, marginBottom: 14,
                  }}>
                    <div style={{
                      flex: 1, padding: '10px 12px', borderRadius: 12,
                      background: '#34d39908', border: '1px solid #34d39918',
                      textAlign: 'center',
                    }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#34d399' }}>{myActiveCount}</div>
                      <div style={{ fontSize: 10, color: '#3d5268', fontWeight: 600, marginTop: 2 }}>Активных</div>
                    </div>
                    <div style={{
                      flex: 1, padding: '10px 12px', borderRadius: 12,
                      background: '#f59e0b08', border: '1px solid #f59e0b18',
                      textAlign: 'center',
                    }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#f59e0b' }}>{myClosedCount}</div>
                      <div style={{ fontSize: 10, color: '#3d5268', fontWeight: 600, marginTop: 2 }}>Закрытых</div>
                    </div>
                    <div style={{
                      flex: 1, padding: '10px 12px', borderRadius: 12,
                      background: '#ffffff06', border: '1px solid #ffffff10',
                      textAlign: 'center',
                    }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#6b8299' }}>{myTotalCount}</div>
                      <div style={{ fontSize: 10, color: '#3d5268', fontWeight: 600, marginTop: 2 }}>Всего</div>
                    </div>
                  </div>

                  {/* Мои рейсы */}
                  {myFlights.length > 0 && (
                    <>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        marginBottom: 8, padding: '0 4px',
                      }}>
                        <Plane style={{ width: 12, height: 12, color: '#0ea5e9' }} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#0ea5e9', letterSpacing: '0.04em' }}>
                          Мои рейсы ({myFlights.length})
                        </span>
                      </div>
                      <div className="avia-cards-grid">
                        <AnimatePresence>
                          {myFlights.map((f) => (
                            <FlightCard
                              key={f.id}
                              flight={f}
                              isMine={true}
                              onDelete={(id) => {
                                setMyFlights(prev => prev.filter(x => x.id !== id));
                                setFlights(prev => prev.filter(x => x.id !== id));
                              }}
                              onClose={(id) => {
                                setMyFlights(prev => prev.map(x => x.id === id ? { ...x, status: 'closed' } : x));
                                setFlights(prev => prev.filter(x => x.id !== id));
                              }}
                              onComplete={(id) => {
                                setMyFlights(prev => prev.map(x => x.id === id ? { ...x, status: 'completed' } : x));
                                setFlights(prev => prev.map(x => x.id === id ? { ...x, status: 'completed' } : x));
                              }}
                              onDetail={setDetailFlight}
                            />
                          ))}
                        </AnimatePresence>
                      </div>
                    </>
                  )}

                  {/* Мои заявки */}
                  {myRequests.length > 0 && (
                    <>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        marginBottom: 8, marginTop: myFlights.length > 0 ? 16 : 0,
                        padding: '0 4px',
                      }}>
                        <Package style={{ width: 12, height: 12, color: '#a78bfa' }} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', letterSpacing: '0.04em' }}>
                          Мои заявки ({myRequests.length})
                        </span>
                      </div>
                      <div className="avia-cards-grid">
                        <AnimatePresence>
                          {myRequests.map((r) => (
                            <RequestCard
                              key={r.id}
                              request={r}
                              isMine={true}
                              onDelete={(id) => {
                                setMyRequests(prev => prev.filter(x => x.id !== id));
                                setRequests(prev => prev.filter(x => x.id !== id));
                              }}
                              onClose={(id) => {
                                setMyRequests(prev => prev.map(x => x.id === id ? { ...x, status: 'closed' } : x));
                                setRequests(prev => prev.filter(x => x.id !== id));
                              }}
                              onDetail={setDetailRequest}
                            />
                          ))}
                        </AnimatePresence>
                      </div>
                    </>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ height: 60 }} />
      </div>

      {/* ── Модалки ── */}
      <AnimatePresence>
        {showFlightModal && (
          <CreateFlightModal
            key="flight-modal"
            user={user}
            onClose={() => setShowFlightModal(false)}
            onSuccess={(flight) => {
              setFlights(prev => [flight, ...prev]);
              setMyFlights(prev => [flight, ...prev]);
              setShowFlightModal(false);
              toast.success('Рейс опубликован!', {
                description: `${flight.from} → ${flight.to}, ${fmtDate(flight.date, 'short')}`,
                duration: 3500,
              });
            }}
          />
        )}
        {showRequestModal && (
          <CreateRequestModal
            key="request-modal"
            user={user}
            onClose={() => setShowRequestModal(false)}
            onSuccess={(req) => {
              setRequests(prev => [req, ...prev]);
              setMyRequests(prev => [req, ...prev]);
              setShowRequestModal(false);
              toast.success('Заявка опубликована!', {
                description: `${req.from} → ${req.to}, ${req.weightKg} кг`,
                duration: 3500,
              });
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Detail Modals ── */}
      <AnimatePresence>
        {detailFlight && (
          <FlightDetailModal
            key={`detail-flight-${detailFlight.id}`}
            flight={detailFlight}
            isMine={detailFlight.courierId === myPhone}
            onClose={() => setDetailFlight(null)}
            onDeleted={(id) => {
              setFlights(prev => prev.filter(x => x.id !== id));
              setMyFlights(prev => prev.filter(x => x.id !== id));
            }}
            onClosed={(id) => {
              setFlights(prev => prev.filter(x => x.id !== id));
              setMyFlights(prev => prev.map(x => x.id === id ? { ...x, status: 'closed' } : x));
            }}
          />
        )}
        {detailRequest && (
          <RequestDetailModal
            key={`detail-request-${detailRequest.id}`}
            request={detailRequest}
            isMine={detailRequest.senderId === myPhone}
            onClose={() => setDetailRequest(null)}
            onDeleted={(id) => {
              setRequests(prev => prev.filter(x => x.id !== id));
              setMyRequests(prev => prev.filter(x => x.id !== id));
            }}
            onClosed={(id) => {
              setRequests(prev => prev.filter(x => x.id !== id));
              setMyRequests(prev => prev.map(x => x.id === id ? { ...x, status: 'closed' } : x));
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Пакет I: Deal Offer Modal ── */}
      <AnimatePresence>
        {dealOfferFlight && (
          <AviaDealOfferModal
            key={`deal-flight-${dealOfferFlight.id}`}
            me={user}
            flight={dealOfferFlight}
            onClose={() => setDealOfferFlight(null)}
            onSuccess={() => { fetchDealsCount(); }}
            onOpenChat={(chatId, otherPhone, adRef) => {
              setDealOfferFlight(null);
              const params = new URLSearchParams({
                chatId, otherPhone,
                adType: adRef.type, adId: adRef.id,
                adFrom: adRef.from, adTo: adRef.to,
                ...(adRef.date ? { adDate: adRef.date } : {}),
              });
              navigate(`/avia/messages?${params.toString()}`);
            }}
          />
        )}
        {dealOfferRequest && (
          <AviaDealOfferModal
            key={`deal-request-${dealOfferRequest.id}`}
            me={user}
            request={dealOfferRequest}
            onClose={() => setDealOfferRequest(null)}
            onSuccess={() => { fetchDealsCount(); }}
            onOpenChat={(chatId, otherPhone, adRef) => {
              setDealOfferRequest(null);
              const params = new URLSearchParams({
                chatId, otherPhone,
                adType: adRef.type, adId: adRef.id,
                adFrom: adRef.from, adTo: adRef.to,
                ...(adRef.date ? { adDate: adRef.date } : {}),
              });
              navigate(`/avia/messages?${params.toString()}`);
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Пакет M: Filter Sheets ── */}
      <AviaFilterSheet
        open={showFlightFilter}
        onClose={() => setShowFlightFilter(false)}
        filters={flightFS}
        onChange={setFlightFS}
        onReset={() => setFlightFS(EMPTY_FILTER_STATE)}
        accentColor="#0ea5e9"
        isFlights={true}
      />
      <AviaFilterSheet
        open={showRequestFilter}
        onClose={() => setShowRequestFilter(false)}
        filters={requestFS}
        onChange={setRequestFS}
        onReset={() => setRequestFS(EMPTY_FILTER_STATE)}
        accentColor="#a78bfa"
        isFlights={false}
      />

      {/* ── Пакет G: Notification Center ── */}
      <AnimatePresence>
        {showNotifications && (
          <NotificationCenter
            key="notif-center"
            phone={user.phone}
            notifications={notifications}
            onClose={() => setShowNotifications(false)}
            onUpdate={updateNotifications}
          />
        )}
      </AnimatePresence>

      {/* Чат перенесён на страницу /avia/messages */}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse-badge {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.15); }
        }

        /* ── Responsive: Header ── */
        .avia-dash-header {
          padding: 14px 16px;
        }
        @media (min-width: 640px) {
          .avia-dash-header { padding: 16px 24px; }
        }
        @media (min-width: 1024px) {
          .avia-dash-header { padding: 18px 32px; }
        }

        /* ── Responsive: Content area ── */
        .avia-dash-content {
          padding: 14px 12px;
        }
        @media (min-width: 480px) {
          .avia-dash-content { padding: 16px 16px; }
        }
        @media (min-width: 640px) {
          .avia-dash-content { padding: 18px 24px; }
        }
        @media (min-width: 1024px) {
          .avia-dash-content { padding: 24px 32px; }
        }
        @media (min-width: 1280px) {
          .avia-dash-content { padding: 28px 40px; }
        }

        /* ── Responsive: Cards grid ── */
        .avia-cards-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
        }
        @media (min-width: 640px) {
          .avia-cards-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }
        }
        @media (min-width: 1024px) {
          .avia-cards-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 14px;
          }
        }
        @media (min-width: 1280px) {
          .avia-cards-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
          }
        }

        /* ── Card items: scale up on desktop ── */
        .avia-card-item {
          transition: box-shadow 0.2s, border-color 0.2s;
        }
        @media (min-width: 640px) {
          .avia-card-item {
            padding: 18px 20px !important;
            border-radius: 22px !important;
          }
        }
        @media (min-width: 1024px) {
          .avia-card-item {
            padding: 20px 22px !important;
          }
          .avia-card-item:hover {
            border-color: rgba(14,165,233,0.25) !important;
            box-shadow: 0 6px 24px rgba(0,0,0,0.3) !important;
          }
        }

        /* ── Responsive: Search row ── */
        .avia-dash-search-row {
          flex-wrap: nowrap;
        }
        @media (max-width: 479px) {
          .avia-dash-search-row {
            flex-wrap: wrap;
          }
          .avia-dash-search-row > * {
            flex-shrink: 1;
          }
        }

        /* ── Responsive: Tabs row ── */
        .avia-dash-tabs-row {
          flex-wrap: nowrap;
        }
        @media (max-width: 380px) {
          .avia-dash-tabs-row {
            flex-wrap: wrap;
            gap: 6px;
          }
        }

        /* ── Footer bottom spacing for mobile nav ── */
        @media (max-width: 767px) {
          .avia-dashboard-root {
            padding-bottom: 72px;
          }
        }
      `}</style>
    </div>
  );
}
