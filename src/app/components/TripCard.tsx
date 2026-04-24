/**
 * TripCard -- unified trip/cargo card.
 * Used everywhere: DriverTripsPage, SenderTripsPage, SearchResults.
 * mode='driver'  -> full control (status, offers, action buttons)
 * mode='sender'  -> booking view (driver info, chat, tracking)
 * mode='search'  -> listing (driver info, "Details" button)
 *
 * v3 improvements (10 items):
 *  1. ConfirmDialog for destructive actions
 *  2. aria-label on every icon-only button
 *  3. Relative date display ("Сегодня", "Завтра", "2 дня назад")
 *  4. Offer timestamp ("получена 2ч назад")
 *  5. "Новая" badge on unseen offers
 *  6. Route distance via Haversine
 *  7. Clickable phone in ROW 4
 *  8. Share/copy button in search mode
 *  9. Shimmer skeleton for offer action loading
 * 10. Fallback for cargo trips without weight
 */
import { useNavigate } from 'react-router';
import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play, Navigation, Snowflake, CheckCircle2, Trash2,
  MessageSquare, Star, Users, Package, Weight, Truck,
  FileText, Calendar, ArrowRight, Map as MapIcon,
  CheckCircle, Clock, Phone, Shield, Baby, XCircle, Info,
  ChevronDown, PhoneCall, Share2, Copy, Route,
} from 'lucide-react';
import { WeatherAnimation } from './WeatherAnimation';
import type { WeatherData } from '../api/weatherApi';
import { cleanAddress } from '../utils/addressUtils';
import { playAcceptSound, playDeclineSound, playDeleteSound, playSwipeSound } from '../utils/soundFeedback';

// ─── Types ────────────────────────────────────────────────────────────────────

export type TripCardMode = 'driver' | 'sender' | 'search';

export interface TripCardData {
  // Core
  id: string | number;
  tripId?: string | number;
  from: string;
  to: string;
  date?: string;
  time?: string;
  status?: string;
  prevStatus?: string | null;
  // Capacity (Driver Trip)
  availableSeats?: number;
  childSeats?: number;
  cargoCapacity?: number;
  // Prices (Driver Trip)
  pricePerSeat?: number;
  pricePerChild?: number;
  pricePerKg?: number;
  // Cargo Fields (Sender Cargo)
  cargoWeight?: number;
  budget?: number;
  currency?: string;
  senderName?: string;
  senderPhone?: string;
  senderAvatar?: string;
  // Trip type
  tripType?: 'trip' | 'cargo';
  vehicle?: string;
  notes?: string;
  // Driver info
  driverName?: string;
  driverAvatar?: string;
  driverRating?: number;
  driverEmail?: string;
  driverPhone?: string;
  // Offers (driver mode)
  pendingOffersCount?: number;
  incomingOffers?: any[];
  // Sender booking
  pricePaid?: number;
  offerStatus?: string;
  // Coords
  fromLat?: number;
  fromLng?: number;
  toLat?: number;
  toLng?: number;
  // For driver review: sender email from accepted offer
  senderEmail?: string;
  // When the booking offer was submitted (sender mode)
  offerCreatedAt?: string | number | null;
}

interface TripCardProps {
  trip: TripCardData;
  mode: TripCardMode;
  // Weather (driver mode)
  weather?: WeatherData;
  // Review state (driver/sender completed)
  alreadyReviewed?: boolean;
  // Callbacks — driver
  onStart?: (e: React.MouseEvent) => void;
  onFreeze?: (e: React.MouseEvent) => void;
  onComplete?: (e: React.MouseEvent) => void;
  onCancel?: (e: React.MouseEvent) => void;
  onDelete?: (e: React.MouseEvent) => void;
  onMessages?: (e: React.MouseEvent) => void;
  onReview?: (e: React.MouseEvent) => void;
  onAcceptOffer?: (offer: any) => void;
  onDeclineOffer?: (offer: any) => void;
  // Callbacks — sender
  onChat?: (e: React.MouseEvent) => void;
  onTrack?: (e: React.MouseEvent) => void;
  onCancelBooking?: (e: React.MouseEvent) => void;
  // Unread messages badge
  unreadMessages?: number;
  // Loading state for offer actions
  offerActionId?: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** #3 — Relative date: "Сегодня", "Завтра", "Вчера", "Через N дней", "N дней назад" */
function relativeDate(d?: string): string {
  if (!d) return '';
  try {
    const [y, m, day] = d.split('-').map(Number);
    const target = new Date(y, m - 1, day);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffMs = target.getTime() - today.getTime();
    const diffDays = Math.round(diffMs / 86400000);

    if (diffDays === 0) return 'Сегодня';
    if (diffDays === 1) return 'Завтра';
    if (diffDays === -1) return 'Вчера';
    if (diffDays > 1 && diffDays <= 7) return `Через ${diffDays} ${pluralDays(diffDays)}`;
    if (diffDays < -1 && diffDays >= -7) return `${Math.abs(diffDays)} ${pluralDays(Math.abs(diffDays))} назад`;
    // Fallback to formatted date
    return target.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  } catch { return d; }
}

function pluralDays(n: number): string {
  if (n % 10 === 1 && n % 100 !== 11) return 'день';
  if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return 'дня';
  return 'дней';
}

/** #4 — Relative time for offers: "5 мин назад", "2ч назад", "вчера" */
function relativeTime(ts?: string | number): string {
  if (!ts) return '';
  const date = typeof ts === 'number' ? new Date(ts) : new Date(ts);
  if (isNaN(date.getTime())) return '';
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffSec < 60) return 'только что';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} мин назад`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}ч назад`;
  if (diffSec < 172800) return 'вчера';
  return `${Math.floor(diffSec / 86400)} дн. назад`;
}

/** #6 — Haversine distance between two coordinates in km */
function haversineKm(lat1?: number, lng1?: number, lat2?: number, lng2?: number): number | null {
  if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return null;
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function initials(name?: string) {
  if (!name) return 'В';
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function statusCfg(status?: string, mode?: TripCardMode, offerStatus?: string) {
  if (mode === 'sender') {
    if (offerStatus === 'accepted' || status === 'accepted') {
      return { label: 'Оферта принята', cls: 'bg-emerald-500/15 text-emerald-400', dot: <CheckCircle className="w-3 h-3" /> };
    }
    if (offerStatus === 'pending' && status === 'planned') {
      return { label: 'Ожидает ответа', cls: 'bg-amber-500/15 text-amber-400', dot: <Clock className="w-3 h-3" /> };
    }
  }
  switch (status) {
    case 'planned':    return { label: 'Запланирована', cls: 'bg-amber-500/15 text-amber-400',  dot: <Calendar className="w-3 h-3" /> };
    case 'accepted':   return { label: 'Принята',       cls: 'bg-emerald-500/15 text-emerald-400', dot: <CheckCircle className="w-3 h-3" /> };
    case 'frozen':     return { label: 'Заморожена',    cls: 'bg-cyan-500/15 text-cyan-400',    dot: <Snowflake className="w-3 h-3" /> };
    case 'inProgress': return { label: 'В пути',        cls: 'bg-emerald-500/15 text-emerald-400',
      dot: <span className="relative flex h-2 w-2"><span className="animate-ping absolute inset-0 rounded-full bg-emerald-400 opacity-75"/><span className="relative rounded-full h-2 w-2 bg-emerald-500 block"/></span> };
    case 'cancelled':  return { label: 'Отменена',      cls: 'bg-rose-500/15 text-rose-400',    dot: null };
    case 'completed':  return { label: 'Завершена',     cls: 'bg-white/[0.07] text-[#64748b]',  dot: <CheckCircle2 className="w-3 h-3" /> };
    default:           return { label: status ?? '',    cls: 'bg-white/[0.07] text-[#64748b]',  dot: null };
  }
}

function offerDesc(offer: any): string {
  const parts: string[] = [];
  if (offer.type === 'cargo') {
    parts.push(`Груз: ${offer.weight || '—'}`);
  } else {
    const seatsStr = (offer.requestedSeats || 0) > 0 ? `${offer.requestedSeats} взр.` : '';
    const childStr = (offer.requestedChildren || 0) > 0 ? `${offer.requestedChildren} дет.` : '';
    const cargoStr = (offer.requestedCargo || 0) > 0 ? `${offer.requestedCargo} кг` : '';
    if (offer.type === 'seats') {
      const combined = [seatsStr, childStr].filter(Boolean).join(' + ') || '—';
      parts.push(`Места: ${combined}`);
    } else {
      const combined = [seatsStr, childStr, cargoStr].filter(Boolean).join(' + ') || '—';
      parts.push(combined);
    }
  }
  if ((offer.price ?? 0) > 0) parts.push(`${offer.price} TJS`);
  return parts.join(' · ');
}

// ─── localStorage helpers for "NEW" offer badge tracking ─────────────────────
const SEEN_OFFERS_KEY = 'ovora_seen_offer_ids';
function markOfferSeen(id: string) {
  try {
    const arr = JSON.parse(localStorage.getItem(SEEN_OFFERS_KEY) || '[]') as string[];
    if (!arr.includes(id)) {
      arr.push(id);
      if (arr.length > 300) arr.splice(0, arr.length - 300);
      localStorage.setItem(SEEN_OFFERS_KEY, JSON.stringify(arr));
    }
  } catch {}
}
function isOfferNew(id: string, seenFlag: boolean): boolean {
  if (!seenFlag) return false; // server already marked seen
  try {
    return !(JSON.parse(localStorage.getItem(SEEN_OFFERS_KEY) || '[]') as string[]).includes(id);
  } catch { return false; }
}

/** #8 — Share/copy route to clipboard */
async function shareRoute(from: string, to: string, url: string) {
  const text = `${cleanAddress(from)} → ${cleanAddress(to)}\n${url}`;
  if (navigator.share) {
    try { await navigator.share({ text, url }); return; } catch {}
  }
  try { await navigator.clipboard.writeText(text); } catch {}
}

// ─── #1: ConfirmDialog sub-component ──────────────────────────────────────────

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  confirmColor?: 'rose' | 'amber';
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDialog({ open, title, message, confirmLabel, confirmColor = 'rose', onConfirm, onCancel }: ConfirmDialogProps) {
  if (!open) return null;
  const btnCls = confirmColor === 'rose'
    ? 'bg-rose-500 hover:bg-rose-600 text-white'
    : 'bg-amber-500 hover:bg-amber-600 text-white';
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onCancel}>
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.92 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-[320px] rounded-2xl bg-[#0f1f35] border border-white/[0.1] p-5 space-y-4 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-[15px] font-bold text-white">{title}</h3>
        <p className="text-[13px] text-[#8a9baa] leading-relaxed">{message}</p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 h-10 rounded-xl bg-white/[0.06] border border-white/[0.08] text-[#8a9baa] text-[13px] font-semibold hover:bg-white/[0.1] transition-all active:scale-95"
          >
            Отмена
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 h-10 rounded-xl text-[13px] font-bold transition-all active:scale-95 ${btnCls}`}
          >
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function TripCard({
  trip, mode, weather,
  alreadyReviewed = false,
  onStart, onFreeze, onComplete, onCancel, onDelete, onMessages, onReview,
  onAcceptOffer, onDeclineOffer,
  onChat, onTrack, onCancelBooking,
  unreadMessages = 0,
  offerActionId = null,
}: TripCardProps) {
  const navigate = useNavigate();
  const tid = trip.tripId ?? trip.id;
  const sc = statusCfg(trip.status, mode, trip.offerStatus);

  const isCompleted = trip.status === 'completed';
  const isCancelled = trip.status === 'cancelled';
  const isInactive  = isCompleted || isCancelled;

  const isCargoTrip = trip.tripType === 'cargo';

  const seats   = trip.availableSeats   ?? 0;
  const child   = trip.childSeats       ?? 0;
  const cargo   = trip.cargoCapacity    ?? 0;
  const pSeat   = trip.pricePerSeat     ?? 0;
  const pChild  = trip.pricePerChild    ?? 0;
  const pKg     = trip.pricePerKg       ?? 0;
  const hasCapacity = seats > 0 || child > 0 || cargo > 0;

  const cargoWeight = trip.cargoWeight ?? 0;
  const budget = trip.budget ?? 0;
  const currency = trip.currency ?? 'TJS';

  const creatorName = isCargoTrip ? trip.senderName : trip.driverName;
  const creatorAvatar = isCargoTrip ? trip.senderAvatar : trip.driverAvatar;
  const creatorPhone = isCargoTrip ? trip.senderPhone : trip.driverPhone;

  // #6 — Route distance
  const distKm = haversineKm(trip.fromLat, trip.fromLng, trip.toLat, trip.toLng);

  // #1 — Confirm dialog state
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    confirmColor: 'rose' | 'amber';
    action: ((e: React.MouseEvent) => void) | null;
    event: React.MouseEvent | null;
  }>({ open: false, title: '', message: '', confirmLabel: '', confirmColor: 'rose', action: null, event: null });

  const showConfirm = useCallback((
    e: React.MouseEvent,
    title: string,
    message: string,
    confirmLabel: string,
    action: (e: React.MouseEvent) => void,
    color: 'rose' | 'amber' = 'rose'
  ) => {
    e.stopPropagation();
    setConfirmState({ open: true, title, message, confirmLabel, confirmColor: color, action, event: e });
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirmState(prev => ({ ...prev, open: false }));
  }, []);

  const executeConfirm = useCallback(() => {
    if (confirmState.action && confirmState.event) {
      playDeleteSound();
      confirmState.action(confirmState.event);
    }
    closeConfirm();
  }, [confirmState, closeConfirm]);

  // #8 — Share copied feedback
  const [copied, setCopied] = useState(false);
  const handleShare = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/trip/${tid}`;
    await shareRoute(trip.from, trip.to, url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [tid, trip.from, trip.to]);

  const handleCardClick = () => navigate(`/trip/${tid}`);

  return (
    <>
      {/* #1 — Confirmation dialog portal */}
      <AnimatePresence>
        {confirmState.open && (
          <ConfirmDialog
            open={confirmState.open}
            title={confirmState.title}
            message={confirmState.message}
            confirmLabel={confirmState.confirmLabel}
            confirmColor={confirmState.confirmColor}
            onConfirm={executeConfirm}
            onCancel={closeConfirm}
          />
        )}
      </AnimatePresence>

      <div
        className={`relative rounded-2xl border overflow-hidden cursor-pointer
          transition-all duration-200 active:scale-[0.99]
          ${isInactive ? 'opacity-60' : 'hover:border-white/[0.16] hover:bg-white/[0.03]'}
          border-white/[0.08] bg-[#0d1929]`}
        onClick={handleCardClick}
      >
        {/* Live bar (inProgress) */}
        {trip.status === 'inProgress' && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500 animate-pulse" />
        )}
        {/* Frozen bar */}
        {trip.status === 'frozen' && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 via-cyan-400 to-cyan-500" />
        )}

        <div className="p-4 space-y-3">

          {/* ROW 1: Status badge + Date/Time + Weather */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              {(mode === 'driver' || mode === 'sender') && trip.status && (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${sc.cls}`}>
                  {sc.dot} {sc.label}
                </span>
              )}
              {/* Offer submission timestamp — sender booking view */}
              {mode === 'sender' && trip.offerCreatedAt && (
                <span className="text-[10px] text-[#3d5263] font-medium">
                  заявка {relativeTime(trip.offerCreatedAt)}
                </span>
              )}
              {(mode === 'search' || mode === 'sender') && creatorName && (
                <div className="flex items-center gap-1.5">
                  {creatorAvatar
                    ? <img src={creatorAvatar} alt="" className="w-6 h-6 rounded-full object-cover" />
                    : <div className="w-6 h-6 rounded-full bg-[#1978e5]/30 flex items-center justify-center">
                        <span className="text-[9px] font-black text-[#5ba3f5]">{initials(creatorName)}</span>
                      </div>
                  }
                  <span className="text-[12px] font-bold text-white">{creatorName}</span>
                  {!isCargoTrip && <Shield className="w-3 h-3 text-[#5ba3f5] shrink-0" />}
                  {trip.driverRating && !isCargoTrip && (
                    <div className="flex items-center gap-0.5">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span className="text-[11px] font-semibold text-amber-400">{trip.driverRating}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {weather && !isInactive && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-white/[0.05]">
                  <WeatherAnimation condition={weather.condition} size={11} isDark={true} />
                  <span className="text-[10px] text-[#607080]">{weather.temp}°C</span>
                </div>
              )}
              {/* #3 — Relative date */}
              {(trip.date || trip.time) && (
                <div className="flex items-center gap-1 text-[11px] text-[#607080] font-medium">
                  <Clock className="w-3 h-3 shrink-0" />
                  {trip.date && <span>{relativeDate(trip.date)}</span>}
                  {trip.time && <span>{trip.time}</span>}
                </div>
              )}
            </div>
          </div>

          {/* ROW 2: Route + #6 distance */}
          <div className="flex items-stretch gap-3 px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.05]">
            <div className="flex flex-col items-center flex-shrink-0 pt-0.5 gap-0">
              <div className="w-2.5 h-2.5 rounded-full bg-[#5ba3f5] ring-2 ring-[#5ba3f5]/25" />
              <div className="w-0.5 flex-1 my-1 rounded-full bg-gradient-to-b from-[#5ba3f5]/60 to-emerald-400/60" style={{ minHeight: 16 }} />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-emerald-400/25" />
            </div>
            <div className="flex-1 flex flex-col justify-between gap-1.5 min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <p className="font-bold text-[14px] text-white leading-tight truncate">{cleanAddress(trip.from)}</p>
              </div>
              {/* #6 — Distance pill between from → to */}
              {distKm != null && distKm > 0 && (
                <div className="flex items-center gap-1 pl-0.5">
                  <Route className="w-3 h-3 text-[#475569]" />
                  <span className="text-[10px] text-[#607080] font-medium">~{distKm} км</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 min-w-0">
                <p className="font-bold text-[14px] text-white leading-tight truncate">{cleanAddress(trip.to)}</p>
              </div>
            </div>
            {/* Price paid badge — sender mode */}
            {mode === 'sender' && (trip.pricePaid ?? 0) > 0 && (
              <div className="flex-shrink-0 self-center px-2.5 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/25">
                <span className="text-[12px] font-black text-emerald-400">{trip.pricePaid} TJS</span>
              </div>
            )}
          </div>

          {/* ROW 3: Capacity chips */}
          {!isCargoTrip && hasCapacity && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {seats > 0 && (
                <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#5ba3f5]/10 border border-[#5ba3f5]/20">
                  <Users className="w-3 h-3 text-[#5ba3f5]" />
                  <span className="text-[11px] font-bold text-white">{seats} мест</span>
                  {pSeat > 0 && <span className="text-[11px] font-semibold text-[#5ba3f5]">· {pSeat} TJS</span>}
                </div>
              )}
              {child > 0 && (
                <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <Baby className="w-3 h-3 text-emerald-400" />
                  <span className="text-[11px] font-bold text-white">{child} дет.</span>
                  {pChild > 0 && <span className="text-[11px] font-semibold text-emerald-400">· {pChild} TJS</span>}
                </div>
              )}
              {cargo > 0 && (
                <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <Weight className="w-3 h-3 text-amber-400" />
                  <span className="text-[11px] font-bold text-white">{cargo} кг</span>
                  {pKg > 0 && <span className="text-[11px] font-semibold text-amber-400">· {pKg} TJS/кг</span>}
                </div>
              )}
            </div>
          )}
          {/* #10 — Cargo trips: show weight or fallback "Вес не указан" */}
          {isCargoTrip && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <Package className="w-3 h-3 text-amber-400" />
                <span className="text-[11px] font-bold text-white">
                  {cargoWeight > 0 ? `${cargoWeight} кг груза` : 'Вес не указан'}
                </span>
              </div>
              {budget > 0 && (
                <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <span className="text-[11px] font-bold text-emerald-400">Бюджет: {budget} {currency}</span>
                </div>
              )}
            </div>
          )}

          {/* ROW 4: Vehicle + #7 Clickable Phone */}
          {(trip.vehicle || creatorPhone) && (
            <div className="flex items-center gap-2 flex-wrap">
              {trip.vehicle && !isCargoTrip && (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                  <Truck className="w-3 h-3 text-[#607080] shrink-0" />
                  <span className="text-[11px] text-[#8a9baa]">{trip.vehicle}</span>
                </div>
              )}
              {/* #7 — Clickable phone as <a href="tel:"> */}
              {creatorPhone && mode !== 'search' && (
                <a
                  href={`tel:${creatorPhone}`}
                  onClick={e => e.stopPropagation()}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all active:scale-95"
                >
                  <PhoneCall className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span className="text-[11px] font-semibold text-emerald-400">{creatorPhone}</span>
                </a>
              )}
            </div>
          )}

          {/* ROW 5: Notes */}
          {trip.notes && (
            <div className="flex items-start gap-2 px-2.5 py-2 rounded-xl bg-white/[0.03] border-l-2 border-[#5ba3f5]/40">
              <FileText className="w-3 h-3 text-[#607080] shrink-0 mt-0.5" />
              <span className="text-[11px] text-[#8a9baa] leading-snug line-clamp-2">{trip.notes}</span>
            </div>
          )}

          {/* DRIVER MODE: Inline offers */}
          {mode === 'driver' && !isInactive && (() => {
            const allTripOffers = trip.incomingOffers ?? [];
            const pending  = allTripOffers.filter((o: any) => o.status === 'pending');
            const accepted = allTripOffers.filter((o: any) => o.status === 'accepted');
            const declined = allTripOffers.filter((o: any) => o.status === 'declined');
            if (pending.length === 0 && accepted.length === 0 && declined.length === 0) {
              return (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-dashed border-white/[0.06]">
                  <Clock className="w-3.5 h-3.5 text-[#2a4060] shrink-0" />
                  <span className="text-[11px] text-[#2a4060]">Ожидаем предложений от отправителей</span>
                </div>
              );
            }
            const allOffers = [...accepted, ...pending, ...declined];
            const COLLAPSE_THRESHOLD = 3;
            return <InlineOffers offers={allOffers} totalCount={accepted.length + pending.length} collapseThreshold={COLLAPSE_THRESHOLD} offerActionId={offerActionId} onAcceptOffer={onAcceptOffer} onDeclineOffer={onDeclineOffer} />;
          })()}

          {/* DRIVER/SENDER: Review for completed trips */}
          {isCompleted && !alreadyReviewed && onReview && (
            <button
              onClick={onReview}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400 text-[12px] font-bold active:scale-[0.98] transition-all"
            >
              <Star className="w-3.5 h-3.5" />
              {mode === 'driver' ? 'Оставить отзыв об отправителе' : 'Оценить водителя'}
            </button>
          )}
          {isCompleted && alreadyReviewed && (
            <div className="flex items-center justify-center gap-2 py-1.5 text-emerald-400 text-[12px] font-semibold">
              <CheckCircle className="w-3.5 h-3.5" /> Отзыв оставлен
            </div>
          )}
          {isCompleted && mode === 'sender' && onChat && (
            <div onClick={e => e.stopPropagation()}>
              <button onClick={onChat}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-[#5ba3f5]/10 border border-[#5ba3f5]/20 text-[#5ba3f5] text-[12px] font-semibold active:scale-[0.98] transition-all">
                <MessageSquare className="w-3.5 h-3.5" /> Написать водителю
              </button>
            </div>
          )}

          {/* #1 — DRIVER mode: Delete with confirmation */}
          {mode === 'driver' && isInactive && onDelete && (
            <div onClick={e => e.stopPropagation()}>
              <button
                onClick={e => showConfirm(e, 'Удалить поездку?', 'Это действие нельзя отменить. Поездка будет удалена навсегда.', 'Удалить', onDelete)}
                title="Удалить поездку"
                aria-label="Удалить поездку"
                className="w-full h-9 flex items-center justify-center gap-2 rounded-xl bg-rose-500/[0.08] border border-rose-500/15 text-rose-400/70 hover:bg-rose-500/15 hover:text-rose-400 transition-all active:scale-95 text-[11px] font-semibold"
              >
                <Trash2 className="w-3.5 h-3.5" /> Удалить
              </button>
            </div>
          )}

          {/* ═══════════ ACTION BUTTONS ═══════════ */}

          {/* DRIVER mode actions */}
          {mode === 'driver' && !isInactive && (
            <div className="flex items-center gap-2 pt-0.5" onClick={e => e.stopPropagation()}>
              {trip.status === 'planned' && (
                <button onClick={onStart} aria-label="Начать поездку"
                  className="flex-1 h-10 flex items-center justify-center gap-2 rounded-xl bg-[#5ba3f5] hover:bg-[#4a90e0] text-white text-[12px] font-bold transition-all active:scale-95">
                  <Play className="w-3.5 h-3.5" /> Начать поездку
                </button>
              )}
              {trip.status === 'frozen' && (
                <button onClick={onFreeze} aria-label="Возобновить поездку"
                  className="flex-1 h-10 flex items-center justify-center gap-2 rounded-xl bg-[#5ba3f5] hover:bg-[#4a90e0] text-white text-[12px] font-bold transition-all active:scale-95">
                  <Play className="w-3.5 h-3.5" /> Возобновить
                </button>
              )}
              {trip.status === 'inProgress' && (
                <button onClick={onTrack} aria-label="Управлять поездкой"
                  className="flex-1 h-10 flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-[12px] font-bold transition-all active:scale-95">
                  <Navigation className="w-3.5 h-3.5" /> Управлять
                </button>
              )}

              {/* Icon buttons */}
              <div className="flex items-center gap-1.5">
                {/* #2 — aria-label on every icon button */}
                {trip.status === 'planned' && (
                  <button onClick={onFreeze} title="Заморозить" aria-label="Заморозить поездку"
                    className="w-10 h-10 rounded-xl flex items-center justify-center border bg-white/[0.05] border-white/[0.08] text-[#607080] hover:text-cyan-400 hover:border-cyan-400/30 transition-all active:scale-90">
                    <Snowflake className="w-4 h-4" />
                  </button>
                )}
                {trip.status === 'inProgress' && (
                  <button onClick={onFreeze} title="Поставить на паузу" aria-label="Поставить на паузу"
                    className="w-10 h-10 rounded-xl flex items-center justify-center bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/25 transition-all active:scale-90">
                    <Snowflake className="w-4 h-4" />
                  </button>
                )}
                {trip.status === 'inProgress' && (
                  <button onClick={onComplete} title="Завершить поездку" aria-label="Завершить поездку"
                    className="w-10 h-10 rounded-xl flex items-center justify-center bg-violet-500/10 border border-violet-500/25 text-violet-400 hover:bg-violet-500/20 transition-all active:scale-90">
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                )}
                {/* #1 — Cancel with confirmation */}
                {(trip.status === 'planned' || trip.status === 'frozen') && (
                  <button
                    onClick={e => showConfirm(e, 'Отменить поездку?', 'Все оферты будут отклонены. Отправители получат уведомление.', 'Да, отменить', onCancel!, 'amber')}
                    title="Отменить поездку" aria-label="Отменить поездку"
                    className="w-10 h-10 rounded-xl flex items-center justify-center bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-all active:scale-90">
                    <XCircle className="w-4 h-4" />
                  </button>
                )}
                {/* Messages */}
                <button onClick={onMessages} title="Сообщения" aria-label="Сообщения"
                  className="relative w-10 h-10 rounded-xl flex items-center justify-center bg-[#5ba3f5]/10 border border-[#5ba3f5]/20 text-[#5ba3f5] hover:bg-[#5ba3f5]/20 transition-all active:scale-90">
                  <MessageSquare className="w-4 h-4" />
                  {unreadMessages > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center">
                      {unreadMessages}
                    </span>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* SENDER mode actions */}
          {mode === 'sender' && !isInactive && (
            <div className="flex items-center gap-2 pt-0.5" onClick={e => e.stopPropagation()}>
              {trip.status === 'inProgress' && (
                <>
                  <button onClick={onTrack} aria-label="Смотреть трекинг"
                    className="flex-1 h-10 flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-[12px] font-bold transition-all active:scale-95">
                    <MapIcon className="w-3.5 h-3.5" /> Смотреть трекинг
                  </button>
                  <div title="Отмена недоступна — рейс в пути" aria-label="Отмена недоступна"
                    className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/[0.03] border border-white/[0.06] text-[#475569] cursor-default">
                    <Info className="w-4 h-4" />
                  </div>
                </>
              )}
              {trip.status === 'frozen' && (
                <div className="flex items-center gap-2 w-full">
                  <div className="flex-1 h-10 flex items-center gap-2 px-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                    <Snowflake className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="text-[12px] font-semibold text-cyan-400">Водитель поставил паузу</span>
                  </div>
                  {/* #1 — Cancel booking with confirmation */}
                  <button
                    onClick={e => showConfirm(e, 'Отменить бронирование?', 'Вы уверены? Вам нужно будет забронировать заново.', 'Отменить бронь', onCancelBooking!)}
                    title="Отменить бронирование" aria-label="Отменить бронирование"
                    className="w-10 h-10 rounded-xl flex items-center justify-center bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-all active:scale-90">
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              )}
              {trip.status === 'accepted' && (
                <>
                  <div className="flex-1 h-10 flex items-center gap-2 px-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="text-[12px] font-semibold text-emerald-400">Принята · Ожидание отправления</span>
                  </div>
                  <button
                    onClick={e => showConfirm(e, 'Отменить бронирование?', 'Оферта уже принята. Отменить бронирование?', 'Отменить бронь', onCancelBooking!)}
                    title="Отменить бронирование" aria-label="Отменить бронирование"
                    className="w-10 h-10 rounded-xl flex items-center justify-center bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-all active:scale-90">
                    <XCircle className="w-4 h-4" />
                  </button>
                </>
              )}
              {trip.status === 'planned' && (
                <>
                  <div className="flex-1 h-10 flex items-center gap-2 px-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span className="animate-ping absolute inset-0 rounded-full bg-amber-400 opacity-75" />
                      <span className="relative rounded-full h-2 w-2 bg-amber-400 block" />
                    </span>
                    <span className="text-[12px] font-semibold text-amber-400">Ожидание подтверждения</span>
                  </div>
                  <button
                    onClick={e => showConfirm(e, 'Отменить бронирование?', 'Оферта ещё ожидает ответа. Отменить?', 'Отменить бронь', onCancelBooking!)}
                    title="Отменить бронирование" aria-label="Отменить бронирование"
                    className="w-10 h-10 rounded-xl flex items-center justify-center bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-all active:scale-90">
                    <XCircle className="w-4 h-4" />
                  </button>
                </>
              )}
              <button onClick={onChat} title="Написать водителю" aria-label="Написать водителю"
                className="relative w-10 h-10 rounded-xl flex items-center justify-center bg-[#5ba3f5]/10 border border-[#5ba3f5]/20 text-[#5ba3f5] hover:bg-[#5ba3f5]/20 transition-all active:scale-90">
                <MessageSquare className="w-4 h-4" />
                {unreadMessages > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center">
                    {unreadMessages}
                  </span>
                )}
              </button>
            </div>
          )}

          {/* #8 — SEARCH mode CTA + Share button */}
          {mode === 'search' && (
            <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
              <button
                onClick={() => navigate(`/trip/${tid}`)}
                className="flex-1 h-10 flex items-center justify-center gap-2 rounded-xl bg-[#1978e5] hover:bg-[#1565cc] text-white text-[13px] font-bold transition-all active:scale-95 shadow-lg shadow-[#1978e5]/20"
              >
                Подробнее <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={handleShare}
                aria-label="Поделиться маршрутом"
                className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/[0.06] border border-white/[0.08] text-[#607080] hover:text-white hover:bg-white/[0.1] transition-all active:scale-90"
              >
                {copied ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              </button>
            </div>
          )}

        </div>
      </div>
    </>
  );
}

// ─── Inline Offers Component ────────────────────────────────────────────────

interface InlineOffersProps {
  offers: any[];
  totalCount: number;
  collapseThreshold: number;
  offerActionId: string | null;
  onAcceptOffer?: (offer: any) => void;
  onDeclineOffer?: (offer: any) => void;
}

function InlineOffers({ offers, totalCount, collapseThreshold, offerActionId, onAcceptOffer, onDeclineOffer }: InlineOffersProps) {
  const [expanded, setExpanded] = useState(false);

  const accepted = offers.filter((o: any) => o.status === 'accepted');
  const pending  = offers.filter((o: any) => o.status === 'pending');
  const declined = offers.filter((o: any) => o.status === 'declined');

  const shouldCollapse = (accepted.length + pending.length) > collapseThreshold;

  const visibleAccepted = shouldCollapse && !expanded
    ? accepted.slice(0, Math.min(accepted.length, collapseThreshold))
    : accepted;
  const visiblePending = shouldCollapse && !expanded
    ? pending.slice(0, Math.max(0, collapseThreshold - visibleAccepted.length))
    : pending;
  const hiddenCount = (accepted.length - visibleAccepted.length) + (pending.length - visiblePending.length);

  // Mark visible pending offers as seen in localStorage (clears "NEW" badge on next visit)
  useEffect(() => {
    visiblePending.forEach(o => {
      const oid = String(o.offerId || o.id || '');
      if (oid) markOfferSeen(oid);
    });
  });

  return (
    <div className="space-y-2" onClick={e => e.stopPropagation()}>
      {/* Accepted offers */}
      <AnimatePresence mode="popLayout">
        {visibleAccepted.map((offer: any) => {
          const oid = offer.offerId || offer.id;
          const ts = relativeTime(offer.createdAt || offer.timestamp);
          return (
            <motion.div
              key={`accepted-${oid}`}
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 8 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px] font-bold text-emerald-400">{offer.senderName || 'Отправитель'}</span>
                    {/* #4 — Timestamp */}
                    {ts && <span className="text-[9px] text-emerald-400/40">{ts}</span>}
                  </div>
                  <div className="text-[10px] text-emerald-400/50 mt-0.5">{offerDesc(offer)}</div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {offer.senderPhone && (
                    <a href={`tel:${offer.senderPhone}`} aria-label={`Позвонить ${offer.senderPhone}`}
                      className="h-8 w-8 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/35 flex items-center justify-center transition-all active:scale-90">
                      <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
                    </a>
                  )}
                  <span className="text-[10px] font-black text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/20">Принята</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Pending offers with #4 timestamp, #5 NEW badge, #9 shimmer */}
      <AnimatePresence mode="popLayout">
        {visiblePending.map((offer: any) => {
          const oid = offer.offerId || offer.id;
          const isActioning = offerActionId === oid;
          const ts = relativeTime(offer.createdAt || offer.timestamp);
          const isNew = isOfferNew(String(oid), offer.seen === false);
          return (
            <motion.div
              key={`pending-${oid}`}
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 8 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              {/* #9 — Shimmer overlay when actioning */}
              <div className={`relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 ${isActioning ? 'pointer-events-none' : ''}`}>
                {isActioning && (
                  <div className="absolute inset-0 rounded-xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent animate-shimmer" />
                  </div>
                )}
                <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                  <Package className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px] font-bold text-white">{offer.senderName || 'Отправитель'}</span>
                    {/* #5 — NEW badge */}
                    {isNew && (
                      <span className="text-[9px] font-black text-[#5ba3f5] px-1.5 py-0.5 rounded-full bg-[#5ba3f5]/15 uppercase tracking-wide">
                        new
                      </span>
                    )}
                    {/* #4 — Timestamp */}
                    {ts && <span className="text-[9px] text-[#475569]">{ts}</span>}
                  </div>
                  {offer.senderPhone && <span className="text-[10px] text-[#607080] block">{offer.senderPhone}</span>}
                  <div className="text-[10px] text-[#607080] mt-0.5">{offerDesc(offer)}</div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {offer.senderPhone && (
                    <a href={`tel:${offer.senderPhone}`} aria-label={`Позвонить ${offer.senderPhone}`}
                      className="h-8 w-8 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center transition-all active:scale-90">
                      <PhoneCall className="w-3.5 h-3.5 text-[#8a9baa]" />
                    </a>
                  )}
                  <button disabled={isActioning} onClick={() => onAcceptOffer?.(offer)} aria-label="Принять оферту"
                    className="h-8 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold transition-all active:scale-95 disabled:opacity-50"
                    onMouseDown={() => playAcceptSound()}
                  >
                    {isActioning ? <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : '✓'}
                  </button>
                  <button disabled={isActioning} onClick={() => onDeclineOffer?.(offer)} aria-label="Отклонить оферту"
                    className="h-8 px-3 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 text-[11px] font-bold transition-all active:scale-95 disabled:opacity-50"
                    onMouseDown={() => playDeclineSound()}
                  >
                    ✕
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Collapse/expand toggle */}
      {shouldCollapse && (
        <button
          onClick={() => setExpanded(!expanded)}
          aria-label={expanded ? 'Скрыть оферты' : 'Показать все оферты'}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-[#8a9baa] text-[11px] font-semibold hover:bg-white/[0.07] active:scale-[0.98] transition-all"
        >
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
          {expanded ? 'Скрыть' : `Ещё ${hiddenCount} ${hiddenCount === 1 ? 'оферта' : hiddenCount < 5 ? 'оферты' : 'оферт'}`}
        </button>
      )}

      {/* Declined offers — sender cancelled their booking */}
      {declined.length > 0 && (
        <div className="space-y-1.5 pt-0.5">
          {declined.map((offer: any) => {
            const oid = offer.offerId || offer.id;
            return (
              <div key={`declined-${oid}`}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-rose-500/[0.07] border border-rose-500/15 opacity-75">
                <XCircle className="w-3.5 h-3.5 text-rose-400/60 shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] font-semibold text-rose-400/70">
                    {offer.senderName || 'Отправитель'}
                  </span>
                  <span className="text-[10px] text-rose-400/40 block">Отменил бронирование</span>
                </div>
                <span className="text-[10px] text-rose-400/40 shrink-0">
                  {relativeTime(offer.updatedAt || offer.createdAt)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}