/**
 * SenderTripsPage — страница поездок ОТПРАВИТЕЛЯ.
 * ✅ FIX П-8: Исправлен статус inProgress (camelCase).
 * ✅ FIX П-6: Грузы отправителя вынесены в отдельную вкладку «Мои грузы»
 *    с корректным отображением без смешивания с booking-логикой.
 * ✅ FIX П-CG: SenderCargoCard показывает кол-во откликов водителей.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Package, X, MessageSquare, Shield, Zap, Award,
  ArrowLeft, RefreshCw, Plus, AlertTriangle,
  Weight, Calendar, Trash2, Truck, CheckCircle, Phone,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../contexts/UserContext';
import { useIsMounted } from '../hooks/useIsMounted';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { toast } from 'sonner';
import { getTripsByIds, getOffersForUser, getMyCargos, submitReview as submitReviewApi, updateOffer, deleteCargo, getCargoOffersForCargo } from '../api/dataApi';
import { initChatRoom, getChats } from '../api/chatStore';
import { generatePairChatId } from '../api/chatUtils';
import { TripCardSkeleton } from './SkeletonCard';
import { PullIndicator } from './PullIndicator';
import { TripCard } from './TripCard';
import { SwipeableCard } from './SwipeableCard';
import { StarRow } from './ui/StarRow';
import { cleanAddress } from '../utils/addressUtils';

const REVIEWED_TRIPS_KEY = 'ovora_reviewed_trips';

const CATEGORY_LABELS: Record<string, string> = {
  punctuality: 'Пунктуальность',
  reliability: 'Надёжность',
  communication: 'Коммуникация',
  packaging: 'Упаковка',
};
const CATEGORY_ICONS: Record<string, any> = {
  punctuality: Zap,
  reliability: Shield,
  communication: MessageSquare,
  packaging: Award,
};

// ── Карточка груза отправителя (П-6: не использует TripCard с mode='sender') ─
function SenderCargoCard({
  cargo, onDelete, pendingCount = 0, acceptedCount = 0,
}: {
  cargo: any;
  onDelete: (id: string) => void;
  pendingCount?: number;
  acceptedCount?: number;
}) {
  const navigate = useNavigate();
  const statusColors: Record<string, string> = {
    active:    'bg-emerald-500/15 text-emerald-400',
    cancelled: 'bg-rose-500/15 text-rose-400',
    completed: 'bg-white/[0.07] text-[#64748b]',
  };
  const statusLabels: Record<string, string> = {
    active:    'Активно',
    cancelled: 'Отменено',
    completed: 'Завершено',
  };
  const st = cargo.status || 'active';
  const totalOffers = pendingCount + acceptedCount;

  return (
    <div
      className="rounded-2xl border border-white/[0.08] bg-[#0d1929] p-4 space-y-3 cursor-pointer hover:border-white/[0.14] transition-all active:scale-[0.99]"
      onClick={() => navigate(`/trip/${cargo.id}`)}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${statusColors[st] || statusColors.active}`}>
            {statusLabels[st] || 'Активно'}
          </span>
          {/* Offer count badges */}
          {acceptedCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <CheckCircle className="w-2.5 h-2.5" /> Водитель выбран
            </span>
          )}
          {acceptedCount === 0 && pendingCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Truck className="w-2.5 h-2.5" />
              {pendingCount} {pendingCount === 1 ? 'отклик' : pendingCount < 5 ? 'отклика' : 'откликов'}
            </span>
          )}
        </div>
        {cargo.date && (
          <div className="flex items-center gap-1 text-[11px] text-[#607080] shrink-0">
            <Calendar className="w-3 h-3" />
            <span>{cargo.date}</span>
          </div>
        )}
      </div>
      <div className="flex items-stretch gap-3 px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.05]">
        <div className="flex flex-col items-center shrink-0 pt-0.5 gap-0">
          <div className="w-2.5 h-2.5 rounded-full bg-[#5ba3f5] ring-2 ring-[#5ba3f5]/25" />
          <div className="w-0.5 flex-1 my-1 rounded-full bg-gradient-to-b from-[#5ba3f5]/60 to-amber-400/60" style={{ minHeight: 16 }} />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-amber-400/25" />
        </div>
        <div className="flex-1 flex flex-col justify-between gap-1.5 min-w-0">
          <p className="font-bold text-[14px] text-white leading-tight truncate">{cleanAddress(cargo.from)}</p>
          <p className="font-bold text-[14px] text-white leading-tight truncate">{cleanAddress(cargo.to)}</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        {(cargo.cargoWeight ?? 0) > 0 && (
          <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <Weight className="w-3 h-3 text-amber-400" />
            <span className="text-[11px] font-bold text-white">{cargo.cargoWeight} кг</span>
          </div>
        )}
        {(cargo.budget ?? 0) > 0 && (
          <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-[11px] font-bold text-emerald-400">Бюджет: {cargo.budget} {cargo.currency || 'TJS'}</span>
          </div>
        )}
        {cargo.cargoType && (
          <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/[0.05] border border-white/[0.08]">
            <Package className="w-3 h-3 text-[#607080]" />
            <span className="text-[11px] text-[#8a9baa]">{cargo.cargoType}</span>
          </div>
        )}
      </div>
      {/* Show offers summary when there are any */}
      {totalOffers > 0 && st === 'active' && (
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#1a2d45]/60 border border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Truck className="w-3.5 h-3.5 text-[#5ba3f5] shrink-0" />
            <span className="text-[11px] font-semibold text-[#8a9baa]">
              {acceptedCount > 0 ? 'Водитель принят — свяжитесь с ним' : `${pendingCount} водител${pendingCount === 1 ? 'ь' : 'я'} откликнулись`}
            </span>
          </div>
          <span className="text-[10px] font-bold text-[#5ba3f5]">Смотреть →</span>
        </div>
      )}
      {st === 'active' && (
        <button
          onClick={e => { e.stopPropagation(); onDelete(cargo.id); }}
          className="w-full h-9 flex items-center justify-center gap-2 rounded-xl bg-rose-500/08 border border-rose-500/15 text-rose-400/70 hover:bg-rose-500/15 hover:text-rose-400 transition-all text-[11px] font-semibold"
        >
          <Trash2 className="w-3.5 h-3.5" /> Удалить объявление
        </button>
      )}
    </div>
  );
}

// ── Основной компонент ────────────────────────────────────────────────────────
export function SenderTripsPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { user: currentUser } = useUser();
  const isMountedRef = useIsMounted();
  const [activeTab, setActiveTab] = useState<'active' | 'cargos' | 'completed' | 'cancelled'>('active');

  const [reviewModal, setReviewModal] = useState<{
    tripId: string; route: string; counterpart: string;
    counterpartAvatar?: string; driverEmail?: string;
  } | null>(null);
  const [reviewedTrips, setReviewedTrips] = useState<string[]>([]);
  const [formRating, setFormRating] = useState(0);
  const [formComment, setFormComment] = useState('');
  const [formCats, setFormCats] = useState({ punctuality: 0, reliability: 0, communication: 0, packaging: 0 });
  const [confirmModal, setConfirmModal] = useState<{
    title: string; msg: string; confirmLabel: string;
    danger?: boolean; onConfirm: () => void;
  } | null>(null);
  const showConfirm = (
    title: string, msg: string, confirmLabel: string,
    onConfirm: () => void, danger = false
  ) => setConfirmModal({ title, msg, confirmLabel, danger, onConfirm });

  const [publishedTrips, setPublishedTrips] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const loadDataRef = useRef<(silent?: boolean) => Promise<void>>(async () => {});

  const { containerRef: pullRef, pullY, isRefreshing: isPulling,
    onTouchStart: pullTouchStart, onTouchMove: pullTouchMove, onTouchEnd: pullTouchEnd,
  } = usePullToRefresh({ onRefresh: () => loadDataRef.current(true) });

  const [publishedCargos, setPublishedCargos] = useState<any[]>([]);
  // ✅ FIX П-CG: Map of cargoId → incoming cargo offers from drivers
  const [cargoOffersMap, setCargoOffersMap] = useState<Record<string, any[]>>({});

  // ── Load data ─────────────────────────────────────────────────────────────
  const loadData = useCallback(async (silent = false) => {
    if (!isMountedRef.current) return;
    if (!silent) setLoading(true); else setIsRefreshing(true);
    try {
      const email = currentUser?.email;
      const [offersData, cargosData] = await Promise.all([
        email ? getOffersForUser(email) : Promise.resolve([]),
        email ? getMyCargos(email) : Promise.resolve([])
      ]);
      if (!isMountedRef.current) return;
      const tripIds = [...new Set(offersData.map((o: any) => String(o.tripId)).filter(Boolean))];
      const tripsData = await getTripsByIds(tripIds);
      if (!isMountedRef.current) return;
      setPublishedTrips(tripsData);
      setOffers(offersData);
      setPublishedCargos(cargosData);

      // Load cargo offers for all non-deleted cargos (including completed/cancelled)
      // so every card shows its real accept/pending counts
      const cargosToLoad = cargosData.filter((c: any) => !c.deletedAt);
      if (cargosToLoad.length > 0) {
        const offersResults = await Promise.allSettled(
          cargosToLoad.map((c: any) => getCargoOffersForCargo(c.id))
        );
        const newMap: Record<string, any[]> = {};
        cargosToLoad.forEach((c: any, i: number) => {
          const res = offersResults[i];
          if (res.status === 'fulfilled') newMap[c.id] = res.value;
        });
        if (isMountedRef.current) setCargoOffersMap(newMap);
      }
    } catch {
      if (!isMountedRef.current) return;
      setPublishedTrips(JSON.parse(localStorage.getItem('ovora_published_trips') || '[]'));
      setOffers(JSON.parse(localStorage.getItem('ovora_cached_offers') || '[]'));
      setPublishedCargos(JSON.parse(localStorage.getItem('ovora_all_cargos') || '[]'));
      if (!silent) toast.error('Нет соединения — показаны кэшированные данные');
    } finally {
      if (isMountedRef.current) { if (!silent) setLoading(false); else setIsRefreshing(false); }
    }
  }, [currentUser?.email, isMountedRef]);

  useEffect(() => { loadDataRef.current = loadData; }, [loadData]);
  useEffect(() => { loadData(false); }, [loadData]);
  useEffect(() => {
    const interval = setInterval(() => { if (document.visibilityState !== 'hidden') loadData(true); }, 8000);
    return () => clearInterval(interval);
  }, [loadData]);
  useEffect(() => { setReviewedTrips(JSON.parse(localStorage.getItem(REVIEWED_TRIPS_KEY) || '[]').map(String)); }, []);

  // ── Build sender booking items (trips через offers) ───────────────────────
  const senderTrips: any[] = offers.map((offer: any) => {
    const tripData = publishedTrips.find(t => String(t.id) === String(offer.tripId));
    const tripFrom = offer.from || tripData?.from || '';
    const tripTo   = offer.to   || tripData?.to   || '';
    if (!tripFrom && !tripTo) return null;

    const offerStatus = offer.status || 'pending';
    const tripStatus = (tripData?.status || '').toLowerCase();

    // ✅ FIX П-8: Корректная проверка статуса inProgress (camelCase в БД)
    const status =
      offerStatus === 'completed' || tripStatus === 'completed'                                          ? 'completed'
      : (offerStatus === 'cancelled' || offerStatus === 'rejected' || offerStatus === 'declined'
         || tripStatus === 'cancelled')                                                                   ? 'cancelled'
      : tripStatus === 'frozen'                                                                           ? 'frozen'
      : offerStatus === 'accepted' && ['inprogress', 'inProgress', 'started', 'in_progress'].includes(tripData?.status || '') ? 'inProgress'
      : offerStatus === 'accepted'                                                                        ? 'accepted'
      : 'planned';

    return {
      id: offer.offerId || offer.id,
      tripId: offer.tripId,
      from: tripFrom,
      to: tripTo,
      date: offer.date || tripData?.date || '',
      time: tripData?.time || '',
      status,
      offerStatus,
      // Driver contact & profile (needed by TripCard sender mode)
      driverName:   tripData?.driverName   || '',
      driverAvatar: tripData?.driverAvatar || '',
      driverEmail:  tripData?.driverEmail  || tripData?.email || '',
      driverPhone:  tripData?.driverPhone  || '',
      driverRating: tripData?.driverRating ?? null,
      // Trip details (capacity, vehicle, notes)
      vehicle:        tripData?.vehicle        || '',
      notes:          tripData?.notes          || '',
      availableSeats: tripData?.availableSeats ?? 0,
      cargoCapacity:  tripData?.cargoCapacity  ?? 0,
      pricePerSeat:   tripData?.pricePerSeat   ?? 0,
      pricePerKg:     tripData?.pricePerKg     ?? 0,
      pricePerChild:  tripData?.pricePerChild  ?? 0,
      // Coords for tracking page
      fromLat: tripData?.fromLat ?? null,
      fromLng: tripData?.fromLng ?? null,
      toLat:   tripData?.toLat   ?? null,
      toLng:   tripData?.toLng   ?? null,
      // What sender paid / offered
      pricePaid: offer.price ?? offer.totalPrice ?? 0,
      // When the offer was submitted (shown as "заявка X ч назад" in TripCard)
      offerCreatedAt: offer.createdAt || offer.timestamp || null,
    };
  }).filter(Boolean);

  // Грузы — сортируем: active первыми, затем cancelled/completed
  const senderAllCargos = [...publishedCargos].sort((a, b) => {
    const order: Record<string, number> = { active: 0, cancelled: 1, completed: 2 };
    return (order[a.status] ?? 1) - (order[b.status] ?? 1);
  });

  const filteredTrips = senderTrips.filter(trip =>
    activeTab === 'active'    ? ['planned', 'accepted', 'inProgress', 'frozen'].includes(trip.status)
    : activeTab === 'cancelled' ? trip.status === 'cancelled'
    : trip.status === 'completed'
  );

  const activeCount  = senderTrips.filter(t => ['planned', 'accepted', 'inProgress', 'frozen'].includes(t.status)).length;
  const cargosCount  = senderAllCargos.filter(c => !c.deletedAt && c.status !== 'cancelled' && c.status !== 'completed').length;

  // ── Unread messages ───────────────────────────────────────────────────────
  const getUnread = (trip: any) => {
    const tripChatId = String(trip.tripId ?? trip.id);
    return getChats()
      .filter((c: any) => c.tripId === tripChatId || c.id.includes(tripChatId))
      .reduce((acc: number, c: any) => acc + (c.unread || 0), 0);
  };

  // ── Actions ───────────────────────────────────────────────────────────────
  const openReview = (e: React.MouseEvent, trip: any) => {
    e.stopPropagation();
    setReviewModal({
      tripId: trip.id,
      route: `${trip.from} → ${trip.to}`,
      counterpart: trip.driverName || 'Водитель',
      counterpartAvatar: trip.driverAvatar,
      driverEmail: trip.driverEmail,
    });
    setFormRating(0); setFormComment('');
    setFormCats({ punctuality: 0, reliability: 0, communication: 0, packaging: 0 });
  };

  const submitReview = async () => {
    if (!formRating) { toast.error('Укажите оценку'); return; }
    if (!formComment.trim()) { toast.error('Напишите комментарий'); return; }
    const authorName = currentUser?.fullName || currentUser?.firstName || 'Отправитель';
    try {
      await submitReviewApi({
        authorEmail: currentUser?.email || '',
        authorName,
        targetEmail: reviewModal?.driverEmail || currentUser?.email || '',
        tripId: reviewModal!.tripId,
        rating: formRating,
        comment: formComment.trim(),
        tripRoute: reviewModal!.route,
        categories: {
          punctuality: formCats.punctuality || formRating,
          reliability: formCats.reliability || formRating,
          communication: formCats.communication || formRating,
          packaging: formCats.packaging || formRating,
        },
        type: 'given', verified: true,
      });
      const reviewed = [...reviewedTrips, reviewModal!.tripId];
      setReviewedTrips(reviewed);
      localStorage.setItem(REVIEWED_TRIPS_KEY, JSON.stringify(reviewed));
      setReviewModal(null);
      toast.success('Отзыв опубликован! Спасибо 🙏');
    } catch (err: any) {
      if (err?.message === 'DUPLICATE_REVIEW') {
        toast.error('Вы уже оставляли отзыв на эту поездку');
        const reviewed = [...reviewedTrips, reviewModal!.tripId];
        setReviewedTrips(reviewed);
        localStorage.setItem(REVIEWED_TRIPS_KEY, JSON.stringify(reviewed));
        setReviewModal(null);
      } else {
        toast.error('Не удалось отправить отзыв');
      }
    }
  };

  const openDriverChat = (e: React.MouseEvent, trip: any) => {
    e.stopPropagation();
    const driverEmail = trip.driverEmail || `driver_${trip.tripId ?? trip.id}`;
    const chatId = generatePairChatId(driverEmail, currentUser?.email || 'guest');
    initChatRoom(chatId, {
      id: driverEmail, name: trip.driverName || 'Водитель', avatar: trip.driverAvatar || '',
      role: 'driver', sub: 'Водитель', rating: trip.driverRating, online: true, verified: true,
    }, String(trip.tripId ?? trip.id), `${trip.from} → ${trip.to}`, trip);
    navigate(`/chat/${chatId}`);
  };

  const handleCancelBooking = (e: React.MouseEvent, trip: any) => {
    e.stopPropagation();
    showConfirm(
      'Отменить бронирование?',
      `${trip.from} → ${trip.to}`,
      'Отменить',
      async () => {
        try {
          await updateOffer(String(trip.tripId), String(trip.id), { status: 'declined' });
          setOffers(prev => prev.map((o: any) =>
            String(o.offerId || o.id) === String(trip.id) ? { ...o, status: 'declined' } : o
          ));
          toast.success('Бронирование отменено');
        } catch { toast.error('Ошибка при отмене бронирования'); }
      },
      true
    );
  };

  const handleDeleteCargo = (cargoId: string) => {
    showConfirm(
      'Удалить объявление?',
      'Это действие необратимо.',
      'Удалить',
      async () => {
        try {
          await deleteCargo(cargoId);
          setPublishedCargos(prev => prev.filter(c => c.id !== cargoId));
          toast.success('Объявление удалено');
        } catch { toast.error('Ошибка при удалении'); }
      },
      true
    );
  };

  // ── Tabs ──────────────────────────────────────────────────────────────────
  const tabs = [
    { key: 'active' as const,    label: 'Бронирования', count: activeCount },
    { key: 'cargos' as const,    label: 'Мои грузы',    count: cargosCount },
    { key: 'completed' as const, label: 'Завершённые',  count: senderTrips.filter(t => t.status === 'completed').length },
    { key: 'cancelled' as const, label: 'Отменённые',   count: senderTrips.filter(t => t.status === 'cancelled').length },
  ];

  // ── Cargo list (переиспользуемый блок) ────────────────────────────────────
  const renderCargoList = (grid = false) => {
    if (loading) {
      return (
        <div className={grid ? 'grid grid-cols-2 xl:grid-cols-3 gap-4' : 'px-4 pt-3 space-y-3'}>
          {[1,2,3].map(i => <TripCardSkeleton key={i} isDark={isDark} />)}
        </div>
      );
    }
    if (senderAllCargos.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-24 gap-3 px-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center bg-amber-500/10">
            <Package className="w-7 h-7 text-amber-400" />
          </div>
          <p className="text-sm font-medium text-[#475569] text-center">Объявлений о грузах нет</p>
          <button onClick={() => navigate('/create-trip')}
            className="flex items-center gap-2 bg-amber-500 text-white font-semibold px-5 py-2.5 rounded-full text-sm">
            <Plus className="w-4 h-4" /> Разместить груз
          </button>
        </div>
      );
    }
    if (grid) {
      return (
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
          {senderAllCargos.map(cargo => {
            const offers = cargoOffersMap[cargo.id] || [];
            const pendingCount = offers.filter((o: any) => o.status === 'pending').length;
            const acceptedCount = offers.filter((o: any) => o.status === 'accepted').length;
            return (
              <SenderCargoCard key={cargo.id} cargo={cargo} onDelete={handleDeleteCargo}
                pendingCount={pendingCount} acceptedCount={acceptedCount} />
            );
          })}
        </div>
      );
    }
    return (
      <div className="px-4 pt-3 space-y-3 pb-24">
        {senderAllCargos.map(cargo => {
          const offers = cargoOffersMap[cargo.id] || [];
          const pendingCount = offers.filter((o: any) => o.status === 'pending').length;
          const acceptedCount = offers.filter((o: any) => o.status === 'accepted').length;
          return (
            <SenderCargoCard key={cargo.id} cargo={cargo} onDelete={handleDeleteCargo}
              pendingCount={pendingCount} acceptedCount={acceptedCount} />
          );
        })}
      </div>
    );
  };

  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="fixed inset-0 z-30 md:relative md:inset-auto md:z-auto md:min-h-screen flex flex-col font-['Sora'] bg-[#0E1621]">

      {/* ══════════ MOBILE LAYOUT ══════════ */}
      <div className="md:hidden flex flex-col h-full overflow-hidden">
        <header className="shrink-0 flex items-center gap-3 px-4 border-b backdrop-blur-xl bg-[#0E1621]/95 border-white/[0.06]"
          style={{ paddingTop: 'max(48px, env(safe-area-inset-top, 48px))', paddingBottom: 14 }}>
          <button onClick={() => navigate('/dashboard')} className="w-9 h-9 rounded-full flex items-center justify-center text-white hover:bg-white/10 active:scale-90 transition-all">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-[18px] font-bold tracking-tight truncate text-white">Мои поездки</h1>
              {activeCount > 0 && (
                <div className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-[#1978e5] shrink-0">
                  <span className="text-[10px] font-bold text-white leading-none">{activeCount > 99 ? '99+' : activeCount}</span>
                </div>
              )}
            </div>
            <p className="text-[11px] mt-0.5 text-[#64748b]">Бронирования и грузы</p>
          </div>
          <button onClick={() => loadData(true)} className="w-9 h-9 rounded-full flex items-center justify-center text-[#1978e5] hover:bg-[#1978e5]/15 active:scale-90 transition-all">
            <RefreshCw style={{ width: 18, height: 18 }} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
        </header>

        {/* Mobile Tabs */}
        <div className="shrink-0 border-b border-white/[0.06]">
          <div className="flex h-11 items-stretch overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {tabs.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex-shrink-0 flex-1 flex items-center justify-center gap-1 text-[11px] font-semibold transition-all border-b-2 px-1 ${
                  activeTab === tab.key ? 'border-[#1978e5] text-white' : 'border-transparent text-[#475569]'
                }`}>
                {tab.label}
                {tab.count > 0 && <span className={`text-[10px] font-bold ${activeTab === tab.key ? 'text-[#1978e5]' : 'text-[#475569]'}`}>{tab.count}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile List */}
        <div ref={pullRef} className="flex-1 overflow-y-auto"
          onTouchStart={pullTouchStart} onTouchMove={pullTouchMove} onTouchEnd={pullTouchEnd}>
          <PullIndicator pullY={pullY} isRefreshing={isPulling} />

          {/* ✅ FIX П-6: Вкладка «Мои грузы» — отдельный компонент */}
          {activeTab === 'cargos' ? renderCargoList(false) : (
            <>
              {loading && filteredTrips.length === 0 && (
                <div className="px-4 pt-3 space-y-3">{[1,2,3].map(i => <TripCardSkeleton key={i} isDark={isDark} />)}</div>
              )}
              {!loading && filteredTrips.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 gap-3 px-6">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center bg-white/[0.05]">
                    <Package className="w-7 h-7 text-[#475569]" />
                  </div>
                  <p className="text-sm font-medium text-[#475569] text-center">
                    {activeTab === 'active' ? 'Активных поездок нет' : activeTab === 'completed' ? 'Завершённых нет' : 'Отменённых нет'}
                  </p>
                  {activeTab === 'active' && (
                    <p className="text-xs text-center text-[#3d5a6a]">Найдите поездку и отправьте заявку водителю</p>
                  )}
                </div>
              )}
              {!loading && filteredTrips.map(trip => (
                <div key={trip.id} className="px-4 py-2">
                  <SwipeableCard
                    enabled={trip.status === 'cancelled'}
                    onSwipeDismiss={() => handleCancelBooking({ stopPropagation: () => {} } as any, trip)}
                    actionLabel="Удалить"
                  >
                    <TripCard
                      trip={trip}
                      mode="sender"
                      alreadyReviewed={reviewedTrips.includes(String(trip.id))}
                      unreadMessages={getUnread(trip)}
                      onChat={e => openDriverChat(e, trip)}
                      onTrack={e => {
                        e.stopPropagation();
                        localStorage.setItem('ovora_sender_tracking_trip', JSON.stringify({
                          tripId: trip.tripId, from: trip.from, to: trip.to,
                          driverName: trip.driverName, driverAvatar: trip.driverAvatar,
                          driverPhone: trip.driverPhone, driverEmail: trip.driverEmail,
                          vehicle: trip.vehicle, date: trip.date, time: trip.time,
                        }));
                        navigate('/tracking');
                      }}
                      onReview={e => openReview(e, trip)}
                      onCancelBooking={e => handleCancelBooking(e, trip)}
                    />
                  </SwipeableCard>
                </div>
              ))}
            </>
          )}
          <div style={{ height: 'env(safe-area-inset-bottom, 16px)', minHeight: 80 }} />
        </div>
      </div>

      {/* ══════════ DESKTOP LAYOUT ══════════ */}
      <div className="hidden md:flex flex-col min-h-screen">
        <div className="border-b border-white/[0.06] shrink-0" style={{ background: '#0E1621' }}>
          <div className="max-w-6xl mx-auto px-8 py-5 flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')}
              className="w-9 h-9 rounded-xl bg-white/[0.06] flex items-center justify-center text-[#607080] hover:text-white hover:bg-white/[0.10] transition-all shrink-0">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5">
                <h1 className="text-[20px] font-black text-white">Мои поездки</h1>
                {activeCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-white text-[11px] font-black">{activeCount} активных</span>
                )}
              </div>
              <p className="text-[11px] text-[#4a6278] mt-0.5">Бронирования и объявления о грузах</p>
            </div>
            <div className="flex items-center gap-3">
              {[
                { label: 'Бронирования', value: activeCount, color: '#10b981' },
                { label: 'Мои грузы',   value: cargosCount, color: '#f59e0b' },
                { label: 'Завершённые', value: senderTrips.filter(t => t.status === 'completed').length, color: '#5ba3f5' },
              ].map(s => (
                <div key={s.label} className="flex flex-col items-center px-4 py-2 rounded-2xl"
                  style={{ background: s.color + '10', border: `1px solid ${s.color}20` }}>
                  <span className="text-[18px] font-black" style={{ color: s.color }}>{s.value}</span>
                  <span className="text-[9px] font-bold text-[#4a6278] uppercase tracking-wide">{s.label}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => loadData(true)}
                className="w-9 h-9 rounded-xl bg-white/[0.06] flex items-center justify-center text-[#607080] hover:text-white transition-all">
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
              <button onClick={() => navigate('/search')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-[13px] font-bold"
                style={{ background: 'linear-gradient(135deg,#059669,#10b981)', boxShadow: '0 4px 16px #10b98130' }}>
                <Plus className="w-4 h-4" /> Найти поездку
              </button>
            </div>
          </div>
        </div>

        <div className="border-b border-white/[0.06] shrink-0" style={{ background: '#0E1621' }}>
          <div className="max-w-6xl mx-auto px-8 flex gap-1 pt-1">
            {tabs.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-3 text-[13px] font-bold transition-all border-b-2 ${
                  activeTab === tab.key ? 'text-white border-[#10b981]' : 'text-[#475569] border-transparent hover:text-[#8a9baa]'
                }`}>
                {tab.label}
                {tab.count > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    activeTab === tab.key ? 'bg-[#10b981] text-white' : 'bg-white/[0.06] text-[#475569]'
                  }`}>{tab.count}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto" style={{ background: '#0E1621' }}>
          <div className="max-w-6xl mx-auto px-8 py-6">
            {activeTab === 'cargos' ? renderCargoList(true) : (
              <>
                {loading && filteredTrips.length === 0 && (
                  <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="rounded-2xl border border-white/[0.06] p-4 animate-pulse space-y-3" style={{ background: '#0d1929' }}>
                        <div className="flex justify-between"><div className="h-6 w-24 rounded-full bg-white/[0.08]" /><div className="h-4 w-20 rounded-full bg-white/[0.06]" /></div>
                        <div className="h-16 rounded-xl bg-white/[0.05]" /><div className="h-10 rounded-xl bg-white/[0.04]" />
                      </div>
                    ))}
                  </div>
                )}
                {!loading && filteredTrips.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-32 gap-4">
                    <div className="w-20 h-20 rounded-3xl flex items-center justify-center" style={{ background: '#10b98110' }}>
                      <Package className="w-9 h-9 text-[#10b981]" />
                    </div>
                    <div className="text-center">
                      <p className="text-[20px] font-black text-white mb-2">
                        {activeTab === 'active' ? 'Нет активных бронирований' : activeTab === 'completed' ? 'Завершённых нет' : 'Отменённых нет'}
                      </p>
                      <p className="text-[14px] text-[#4a6278]">
                        {activeTab === 'active' ? 'Найдите поездку и отправьте заявку водителю' : 'Здесь будут отображаться поездки'}
                      </p>
                    </div>
                    {activeTab === 'active' && (
                      <button onClick={() => navigate('/search')}
                        className="flex items-center gap-2 px-6 py-3 rounded-2xl text-white text-[14px] font-bold"
                        style={{ background: 'linear-gradient(135deg,#059669,#10b981)', boxShadow: '0 8px 24px #10b98130' }}>
                        <Plus className="w-4 h-4" /> Найти поездку
                      </button>
                    )}
                  </div>
                )}
                {!loading && filteredTrips.length > 0 && (
                  <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredTrips.map(trip => (
                      <TripCard
                        key={trip.id}
                        trip={trip}
                        mode="sender"
                        alreadyReviewed={reviewedTrips.includes(String(trip.id))}
                        unreadMessages={getUnread(trip)}
                        onChat={e => openDriverChat(e, trip)}
                        onTrack={e => {
                          e.stopPropagation();
                          localStorage.setItem('ovora_sender_tracking_trip', JSON.stringify({
                            tripId: trip.tripId, from: trip.from, to: trip.to,
                            driverName: trip.driverName, driverAvatar: trip.driverAvatar,
                            driverPhone: trip.driverPhone, driverEmail: trip.driverEmail,
                            vehicle: trip.vehicle, date: trip.date, time: trip.time,
                          }));
                          navigate('/tracking');
                        }}
                        onReview={e => openReview(e, trip)}
                        onCancelBooking={e => handleCancelBooking(e, trip)}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Review Modal ─────────────────────────────────────────────────────── */}
      {reviewModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center" onClick={() => setReviewModal(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-md rounded-t-3xl md:rounded-3xl shadow-2xl overflow-y-auto max-h-[92vh] bg-[#162030]"
            onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full mx-auto mt-4 mb-2 bg-white/10 md:hidden" />
            <div className="px-6 pb-10 pt-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-white">Оставить отзыв</h2>
                  <p className="text-xs mt-0.5 text-[#475569]">{reviewModal.route}</p>
                </div>
                <button onClick={() => setReviewModal(null)} className="w-8 h-8 flex items-center justify-center text-[#475569] hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              {reviewModal.counterpartAvatar && (
                <img src={reviewModal.counterpartAvatar} alt="" className="w-12 h-12 rounded-full object-cover mx-auto my-3" />
              )}
              <p className="text-[10px] uppercase tracking-wider font-medium mb-1 text-[#475569]">Оцените водителя</p>
              <p className="text-sm font-bold mb-4 text-white">{reviewModal.counterpart}</p>
              <div className="flex justify-center mb-4"><StarRow value={formRating} onChange={setFormRating} size="lg" /></div>
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
                const Icon = CATEGORY_ICONS[key];
                return (
                  <div key={key} className="flex items-center justify-between py-2.5 border-b border-white/[0.06]">
                    <div className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5 text-[#475569]" />
                      <span className="text-sm text-[#94a3b8]">{label}</span>
                    </div>
                    <StarRow value={formCats[key as keyof typeof formCats]} onChange={v => setFormCats(p => ({ ...p, [key]: v }))} size="sm" />
                  </div>
                );
              })}
              <textarea placeholder="Комментарий..." value={formComment} onChange={e => setFormComment(e.target.value)}
                className="w-full mt-4 p-3 text-sm rounded-xl border resize-none outline-none bg-[#1a2736] border-white/[0.08] text-white placeholder-[#475569]"
                rows={3} />
              <button onClick={submitReview}
                className="mt-4 w-full py-3.5 bg-[#1978e5] hover:bg-[#1565cc] text-white font-bold rounded-2xl text-sm active:scale-[0.98] transition-all">
                Опубликовать отзыв
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Modal ──────────────────────────────────────────────────── */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={() => setConfirmModal(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-sm rounded-3xl p-6 shadow-2xl bg-[#162030]" onClick={e => e.stopPropagation()}>
            {confirmModal.danger && <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto mb-3" />}
            <h3 className="text-lg font-bold text-white text-center mb-1">{confirmModal.title}</h3>
            <p className="text-sm text-[#475569] text-center mb-6">{confirmModal.msg}</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmModal(null)}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold bg-white/[0.06] text-[#94a3b8]">
                Отмена
              </button>
              <button
                onClick={() => { setConfirmModal(null); confirmModal.onConfirm(); }}
                className={`flex-1 py-3 rounded-2xl text-sm font-bold text-white ${confirmModal.danger ? 'bg-rose-500' : 'bg-[#1978e5]'}`}>
                {confirmModal.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}