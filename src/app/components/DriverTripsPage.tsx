/**
 * DriverTripsPage — страница поездок ВОДИТЕЛЯ.
 * Карточки рейсов — единый компонент TripCard (mode='driver').
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Plus, Truck, X, MessageSquare, Shield, Zap, Award,
  ArrowLeft, RefreshCw, Star, AlertTriangle, CheckCircle2,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../contexts/UserContext';
import { useIsMounted } from '../hooks/useIsMounted';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { toast } from 'sonner';
import { getMyTrips, getOffersForDriver, deleteTrip, updateTrip, submitReview as submitReviewApi, cleanupOrphanedOffers, updateOffer } from '../api/dataApi';
import { getChats } from '../api/chatStore';
import { saveActiveShipment } from '../api/trackingApi';
import { getWeatherByCoords, getCurrentLocation, getApproximateLocation, type WeatherData } from '../api/weatherApi';
import { cleanAddress } from '../utils/addressUtils';
import { TripCardSkeleton } from './SkeletonCard';
import { PullIndicator } from './PullIndicator';
import { TripCard } from './TripCard';
import { SwipeableCard } from './SwipeableCard';
import { StarRow } from './ui/StarRow';

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

// ── Основной компонент ───────────────────────────────────────────────────────
export function DriverTripsPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { user: currentUser } = useUser();
  const isMountedRef = useIsMounted();
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'cancelled'>('active');

  const [reviewModal, setReviewModal] = useState<{ tripId: string; route: string; counterpart: string; senderEmail: string } | null>(null);
  const [reviewedTrips, setReviewedTrips] = useState<string[]>([]);
  const [formRating, setFormRating] = useState(0);
  const [formComment, setFormComment] = useState('');
  const [formCats, setFormCats] = useState({ punctuality: 0, reliability: 0, communication: 0, packaging: 0 });
  const [publishedTrips, setPublishedTrips] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const loadDataRef = useRef<(silent?: boolean) => Promise<void>>(async () => {});
  const [weatherData, setWeatherData] = useState<Record<number, WeatherData>>({});

  // ── Confirm modal (вместо window.confirm) ────────────────────────────────────
  const [confirmModal, setConfirmModal] = useState<{
    title: string; msg: string; confirmLabel: string;
    danger?: boolean; onConfirm: () => void;
  } | null>(null);

  const showConfirm = (
    title: string, msg: string, confirmLabel: string,
    onConfirm: () => void, danger = false
  ) => setConfirmModal({ title, msg, confirmLabel, danger, onConfirm });

  const { containerRef: pullRef, pullY, isRefreshing: isPulling,
    onTouchStart: pullTouchStart, onTouchMove: pullTouchMove, onTouchEnd: pullTouchEnd,
  } = usePullToRefresh({ onRefresh: () => loadDataRef.current(true) });

  // ── Load data ────────────────────────────────────────────────────────────────
  const loadData = useCallback(async (silent = false) => {
    if (!isMountedRef.current) return;
    // User context may still be loading from localStorage on first render.
    // Return early (keep loading=true) rather than replacing state with empty arrays.
    if (!currentUser?.email) return;
    if (!silent) setLoading(true); else setIsRefreshing(true);
    try {
      const [tripsData, offersData] = await Promise.all([
        getMyTrips(currentUser.email),
        getOffersForDriver(currentUser.email),
      ]);
      if (!isMountedRef.current) return;
      const activeOffers = offersData.filter((o: any) =>
        o.status !== 'cancelled' && o.status !== 'declined' && o.status !== 'deleted'
      );
      setPublishedTrips(tripsData);
      setOffers(activeOffers);
      const pending = activeOffers.filter((o: any) => o.status === 'pending').length;
      window.dispatchEvent(new CustomEvent('ovora_pending_offers', { detail: pending }));
    } catch {
      const cachedTrips = JSON.parse(localStorage.getItem('ovora_all_trips') || '[]');
      if (!isMountedRef.current) return;
      setPublishedTrips(cachedTrips);
      setOffers(JSON.parse(localStorage.getItem('ovora_cached_offers') || '[]'));
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

  // ✅ FIX #4: Периодический cleanup осиротевших offers (раз в 2 мин, fire-and-forget)
  useEffect(() => {
    if (!currentUser?.email) return;
    const doCleanup = () => {
      cleanupOrphanedOffers(currentUser.email).then(n => {
        if (n > 0) { console.log(`[cleanup] Cancelled ${n} orphaned offers`); loadData(true); }
      });
    };
    const timer = setTimeout(doCleanup, 5000); // первый раз через 5с
    const interval = setInterval(doCleanup, 120_000); // потом каждые 2 мин
    return () => { clearTimeout(timer); clearInterval(interval); };
  }, [currentUser?.email, loadData]);

  // ── Weather ──────────────────────────────────────────────────────────────────
  const updateWeatherForTrips = useCallback(async () => {
    if (publishedTrips.length === 0) return;
    const newWeatherData: Record<number, WeatherData> = {};
    const location = await getCurrentLocation();

    // Group trips by city to avoid duplicate API calls
    const cityMap = new Map<string, number[]>(); // city -> trip ids
    for (const trip of publishedTrips) {
      const city = (trip.from || '').toLowerCase().trim();
      if (!cityMap.has(city)) cityMap.set(city, []);
      cityMap.get(city)!.push(trip.id);
    }

    const weatherCache = new Map<string, WeatherData>();

    for (const [city, tripIds] of cityMap) {
      try {
        let weatherInfo: WeatherData;
        if (location) {
          // GPS location — same for all trips, fetch once
          if (!weatherCache.has('__gps__')) {
            weatherCache.set('__gps__', await getWeatherByCoords(location.lat, location.lon, 'gps'));
          }
          weatherInfo = weatherCache.get('__gps__')!;
        } else if (weatherCache.has(city)) {
          weatherInfo = weatherCache.get(city)!;
        } else {
          const originalCity = publishedTrips.find(t => (t.from || '').toLowerCase().trim() === city)?.from || '';
          const approxLocation = getApproximateLocation(originalCity);
          weatherInfo = approxLocation
            ? await getWeatherByCoords(approxLocation.lat, approxLocation.lon, 'city', originalCity)
            : { condition: 'clear', temp: 20, description: 'Ясно', source: 'mock', city: originalCity };
          weatherCache.set(city, weatherInfo);
        }
        for (const id of tripIds) newWeatherData[id] = weatherInfo;
      } catch {
        const originalCity = publishedTrips.find(t => (t.from || '').toLowerCase().trim() === city)?.from || '';
        const fallback: WeatherData = { condition: 'clear', temp: 20, description: 'Ясно', source: 'mock', city: originalCity };
        for (const id of tripIds) newWeatherData[id] = fallback;
      }
    }

    if (isMountedRef.current) setWeatherData(newWeatherData);
  }, [publishedTrips, isMountedRef]);

  useEffect(() => {
    if (publishedTrips.length > 0) {
      updateWeatherForTrips();
      const id = setInterval(updateWeatherForTrips, 15 * 60 * 1000);
      return () => clearInterval(id);
    }
  }, [publishedTrips.length, updateWeatherForTrips]);

  useEffect(() => { setReviewedTrips(JSON.parse(localStorage.getItem(REVIEWED_TRIPS_KEY) || '[]').map(String)); }, []);

  // ── Build trip cards data ────────────────────────────────────────────────────
  const driverTrips = publishedTrips.map(t => {
    const tripOffers = offers.filter((o: any) => String(o.tripId) === String(t.id));
    const pendingOffers = tripOffers.filter((o: any) => o.status === 'pending');
    return {
      id: t.id, tripId: t.id, role: 'driver',
      status: t.status || 'planned',
      prevStatus: t.prevStatus || null,
      from: t.from, to: t.to, date: t.date, time: t.time,
      availableSeats: t.availableSeats ?? 0,
      childSeats: t.childSeats ?? 0,
      cargoCapacity: t.cargoCapacity ?? 0,
      pricePerSeat: t.pricePerSeat ?? 0,
      pricePerChild: t.pricePerChild ?? 0,
      pricePerKg: t.pricePerKg ?? 0,
      vehicle: t.vehicle || '',
      notes: t.notes || '',
      fromLat: t.fromLat ?? null,
      fromLng: t.fromLng ?? null,
      toLat: t.toLat ?? null,
      toLng: t.toLng ?? null,
      incomingOffers: tripOffers,
      pendingOffersCount: pendingOffers.length,
    };
  });

  const filteredTrips = driverTrips.filter(trip =>
    activeTab === 'active' ? ['planned', 'inProgress', 'frozen'].includes(trip.status)
    : activeTab === 'cancelled' ? trip.status === 'cancelled'
    : trip.status === 'completed'
  );

  const activeCount = driverTrips.filter(t => ['planned', 'inProgress', 'frozen'].includes(t.status)).length;

  // ── Actions ──────────────────────────────────────────────────────────────────
  const openReview = (e: React.MouseEvent, trip: any) => {
    e.stopPropagation();
    // Находим принятую/завершённую оферту чтобы получить email отправителя
    const acceptedOffer = trip.incomingOffers?.find(
      (o: any) => o.status === 'accepted' || o.status === 'completed'
    ) || trip.incomingOffers?.[0];
    const senderEmail = acceptedOffer?.senderEmail || acceptedOffer?.userEmail || '';
    setReviewModal({
      tripId: String(trip.id),
      route: `${trip.from} → ${trip.to}`,
      counterpart: 'Отправитель',
      senderEmail,
    });
    setFormRating(0); setFormComment('');
    setFormCats({ punctuality: 0, reliability: 0, communication: 0, packaging: 0 });
  };

  const submitReview = async () => {
    if (!formRating) { toast.error('Укажите оценку'); return; }
    if (!formComment.trim()) { toast.error('Напишите комментарий'); return; }
    const authorName = currentUser?.fullName || currentUser?.firstName || 'Водитель';
    try {
      await submitReviewApi({
        authorEmail: currentUser?.email || '',
        authorName,
        targetEmail: (reviewModal as any)?.senderEmail || currentUser?.email || '',
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
      const reviewed = [...reviewedTrips, String(reviewModal!.tripId)];
      setReviewedTrips(reviewed);
      localStorage.setItem(REVIEWED_TRIPS_KEY, JSON.stringify(reviewed));
      setReviewModal(null);
      toast.success('Отзыв опубликован! Спасибо');
    } catch (err: any) {
      if (err?.message === 'DUPLICATE_REVIEW') {
        toast.error('Вы уже оставляли отзыв на эту поездку');
        // Помечаем как reviewed чтобы скрыть кнопку
        const reviewed = [...reviewedTrips, String(reviewModal!.tripId)];
        setReviewedTrips(reviewed);
        localStorage.setItem(REVIEWED_TRIPS_KEY, JSON.stringify(reviewed));
        setReviewModal(null);
      } else {
        toast.error('Не удалось отправить отзыв');
      }
    }
  };

  const startTrip = async (e: React.MouseEvent, trip: any) => {
    e.stopPropagation();
    showConfirm(
      'Начать поездку?',
      `${cleanAddress(trip.from)} → ${cleanAddress(trip.to)}`,
      'Начать',
      async () => {
        try {
          const now = new Date();
          // ✅ Feature 1: Find accepted offer → auto-fill senderEmail for shipment
          const acceptedOffer = trip.incomingOffers?.find(
            (o: any) => o.status === 'accepted'
          );
          const senderEmail = acceptedOffer?.senderEmail || '';
          const senderName = acceptedOffer?.senderName || '';
          const senderPhone = acceptedOffer?.senderPhone || '';
          const shipmentData = {
            tripId: trip.tripId || trip.id,
            from: trip.from, to: trip.to,
            fromLat: trip.fromLat || 38.5598, fromLng: trip.fromLng || 68.7738,
            toLat: trip.toLat || 55.7558, toLng: trip.toLng || 37.6173,
            date: trip.date, time: trip.time,
            departureTime: trip.time || now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
            startedAt: now.toISOString(),
            vehicleType: trip.vehicle || 'Грузовик',
            cargoType: 'Груз', weight: trip.cargoCapacity || '—',
            price: trip.pricePerKg || trip.pricePerSeat || '—', currency: 'TJS', notes: trip.notes || '',
            contactName: currentUser?.firstName ? `${currentUser.firstName} ${currentUser.lastName || ''}`.trim() : 'Водитель',
            contactAvatar: currentUser?.avatarUrl || '',
            contactPhone: currentUser?.phone || '',
            driverEmail: currentUser?.email || '',
            driverName: currentUser?.firstName ? `${currentUser.firstName} ${currentUser.lastName || ''}`.trim() : 'Водитель',
            senderEmail,
            senderName,
            senderPhone,
            status: 'inProgress',
          };
          localStorage.setItem('ovora_active_shipment', JSON.stringify(shipmentData));
          try { await saveActiveShipment(shipmentData); } catch {}
          await updateTrip(String(trip.id), { status: 'inProgress' });
          setPublishedTrips(prev => prev.map(t => t.id === trip.id ? { ...t, status: 'inProgress' } : t));
          toast.success('Поездка начата!', {
            action: { label: 'Перейти к трекингу', onClick: () => navigate('/tracking') },
            duration: 7000,
          });
        } catch { toast.error('Ошибка при запуске поездки'); }
      }
    );
  };

  const completeTrip = async (e: React.MouseEvent, trip: any) => {
    e.stopPropagation();
    showConfirm(
      'Завершить поездку?',
      `${cleanAddress(trip.from)} → ${cleanAddress(trip.to)}`,
      'Завершить',
      async () => {
        try {
          await updateTrip(String(trip.id), { status: 'completed', completedAt: new Date().toISOString() });
          setPublishedTrips(prev => prev.map(t => t.id === trip.id ? { ...t, status: 'completed' } : t));
          toast.success('Поездка завершена!', {
            action: { label: 'Оценить отправителя', onClick: () => openReview({ stopPropagation: () => {} } as any, trip) },
            duration: 8000,
          });
        } catch { toast.error('Ошибка при завершении'); }
      }
    );
  };

  const handleDeleteTrip = async (e: React.MouseEvent, trip: any) => {
    e.stopPropagation();
    showConfirm(
      'Удалить поездку?',
      `${cleanAddress(trip.from)} → ${cleanAddress(trip.to)} · Это действие необратимо.`,
      'Удалить',
      async () => {
        try {
          await deleteTrip(String(trip.id));
          setPublishedTrips(prev => prev.filter(t => t.id !== trip.id));
          toast.success('Поездка удалена');
        } catch { toast.error('Ошибка удаления'); }
      },
      true // danger
    );
  };

  const handleFreezeTrip = async (e: React.MouseEvent, trip: any) => {
    e.stopPropagation();
    const isFrozen = trip.status === 'frozen';
    const resumeStatus = trip.prevStatus === 'inProgress' ? 'inProgress' : 'planned';
    try {
      if (isFrozen) {
        await updateTrip(String(trip.id), { status: resumeStatus, prevStatus: null });
        setPublishedTrips(prev => prev.map(t => t.id === trip.id ? { ...t, status: resumeStatus, prevStatus: null } : t));
        toast.success(resumeStatus === 'inProgress' ? 'Поездка продолжена' : 'Поездка возобновлена');
      } else {
        await updateTrip(String(trip.id), { status: 'frozen', prevStatus: trip.status });
        setPublishedTrips(prev => prev.map(t => t.id === trip.id ? { ...t, status: 'frozen', prevStatus: trip.status } : t));
        toast.success('Поездка заморожена — отдыхайте!');
      }
    } catch { toast.error('Ошибка'); }
  };

  const handleCancelTrip = async (e: React.MouseEvent, trip: any) => {
    e.stopPropagation();
    showConfirm(
      'Отменить поездку?',
      `${cleanAddress(trip.from)} → ${cleanAddress(trip.to)}`,
      'Отменить поездку',
      async () => {
        try {
          await updateTrip(String(trip.id), { status: 'cancelled' });
          setPublishedTrips(prev => prev.map(t => t.id === trip.id ? { ...t, status: 'cancelled' } : t));
          toast.success('Поездка отменена');
        } catch { toast.error('Ошибка при отмене'); }
      },
      true
    );
  };

  // ── Unread messages per trip ─────────────────────────────────────────────────
  const getUnread = (trip: any) => {
    const tripChatId = String(trip.tripId ?? trip.id);
    return getChats()
      .filter((c: any) => c.tripId === tripChatId || c.id.includes(tripChatId))
      .reduce((acc: number, c: any) => acc + (c.unread || 0), 0);
  };

  // ── Inline offer accept/decline from TripCard ─────────────────────────────
  const [offerActionId, setOfferActionId] = useState<string | null>(null);

  const handleAcceptOffer = async (offer: any) => {
    const oid = offer.offerId || offer.id;
    setOfferActionId(oid);
    try {
      await updateOffer(String(offer.tripId), oid, { status: 'accepted' });
      setOffers(prev => prev.map(o => (o.offerId || o.id) === oid ? { ...o, status: 'accepted' } : o));
      toast.success(`Оферта от ${offer.senderName || 'отправителя'} принята!`);
    } catch {
      toast.error('Ошибка при принятии оферты');
    } finally {
      setOfferActionId(null);
    }
  };

  const handleDeclineOffer = async (offer: any) => {
    const oid = offer.offerId || offer.id;
    setOfferActionId(oid);
    try {
      await updateOffer(String(offer.tripId), oid, { status: 'declined' });
      setOffers(prev => prev.filter(o => (o.offerId || o.id) !== oid));
      toast.success('Оферта отклонена');
    } catch {
      toast.error('Ошибка при отклонении оферты');
    } finally {
      setOfferActionId(null);
    }
  };

  const navigateToTracking = (e: React.MouseEvent, trip: any) => {
    e.stopPropagation();
    const sd = {
      tripId: trip.tripId || trip.id, from: trip.from, to: trip.to,
      fromLat: trip.fromLat || 38.5598, fromLng: trip.fromLng || 68.7738,
      toLat: trip.toLat || 55.7558, toLng: trip.toLng || 37.6173,
      date: trip.date, time: trip.time, departureTime: trip.time,
      vehicleType: trip.vehicle || 'Грузовик', status: 'inProgress',
    };
    localStorage.setItem('ovora_active_shipment', JSON.stringify(sd));
    navigate('/tracking');
  };

  // ── Tabs config ──────────────────────────────────────────────────────────────
  const tabs = [
    { key: 'active' as const,    label: 'Активные',    count: driverTrips.filter(t => ['planned','inProgress','frozen'].includes(t.status)).length },
    { key: 'completed' as const, label: 'Завершённые', count: driverTrips.filter(t => t.status === 'completed').length },
    { key: 'cancelled' as const, label: 'Отменённые',  count: driverTrips.filter(t => t.status === 'cancelled').length },
  ];

  const skeletons = [1, 2, 3];

  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="fixed inset-0 z-30 md:relative md:inset-auto md:z-auto md:min-h-screen flex flex-col font-['Sora'] bg-[#0E1621]">

      {/* ══════════ MOBILE LAYOUT ══════════ */}
      <div className="md:hidden flex flex-col h-full overflow-hidden">
        <header className="shrink-0 flex items-center gap-3 px-4 border-b backdrop-blur-xl bg-[#0E1621]/95 border-white/[0.06]"
          style={{ paddingTop: 'max(48px, env(safe-area-inset-top, 48px))', paddingBottom: 14 }}>
          <button onClick={() => navigate('/dashboard')} className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-white hover:bg-white/10 active:scale-90 transition-all">
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
            <p className="text-[11px] mt-0.5 text-[#64748b]">Мои рейсы</p>
          </div>
          <button onClick={() => loadData(true)} className="w-9 h-9 rounded-full flex items-center justify-center text-[#1978e5] hover:bg-[#1978e5]/15 active:scale-90 transition-all">
            <RefreshCw style={{ width: 18, height: 18 }} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
        </header>

        {/* Mobile Tabs */}
        <div className="shrink-0 border-b border-white/[0.06]">
          <div className="flex h-11 items-stretch">
            {tabs.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 text-[13px] font-semibold transition-all border-b-2 ${
                  activeTab === tab.key ? 'border-[#1978e5] text-white' : 'border-transparent text-[#475569]'
                }`}>
                {tab.label}
                {tab.count > 0 && (
                  <span className={`text-[10px] font-bold ${activeTab === tab.key ? 'text-[#1978e5]' : 'text-[#475569]'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile List */}
        <div ref={pullRef} className="flex-1 overflow-y-auto"
          onTouchStart={pullTouchStart} onTouchMove={pullTouchMove} onTouchEnd={pullTouchEnd}>
          <PullIndicator pullY={pullY} isRefreshing={isPulling} />
          {loading && filteredTrips.length === 0 && (
            <div className="px-4 pt-3 space-y-3">
              {skeletons.map(i => <TripCardSkeleton key={i} isDark={isDark} />)}
            </div>
          )}
          {!loading && filteredTrips.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 gap-3 px-6">
              <div className="w-16 h-16 rounded-full flex items-center justify-center bg-white/[0.05]">
                <Truck className="w-7 h-7 text-[#475569]" />
              </div>
              <p className="text-sm font-medium text-[#475569] text-center">
                {activeTab === 'active' ? 'Активных рейсов нет' : activeTab === 'completed' ? 'Завершённых нет' : 'Отменённых нет'}
              </p>
              {activeTab === 'active' && (
                <button onClick={() => navigate('/create-trip')}
                  className="flex items-center gap-2 bg-[#1978e5] text-white font-semibold px-5 py-2.5 rounded-full text-sm mt-1">
                  <Plus className="w-4 h-4" /> Создать рейс
                </button>
              )}
            </div>
          )}
          {!loading && filteredTrips.map(trip => (
            <div key={trip.id} className="px-4 py-2">
              <SwipeableCard
                enabled={(trip.status === 'completed' || trip.status === 'cancelled')}
                onSwipeDismiss={() => handleDeleteTrip({ stopPropagation: () => {} } as any, trip)}
              >
                <TripCard
                  trip={trip}
                  mode="driver"
                  weather={weatherData[trip.id]}
                  alreadyReviewed={reviewedTrips.includes(String(trip.id))}
                  unreadMessages={getUnread(trip)}
                  onStart={e => startTrip(e, trip)}
                  onFreeze={e => handleFreezeTrip(e, trip)}
                  onComplete={e => completeTrip(e, trip)}
                  onCancel={e => handleCancelTrip(e, trip)}
                  onDelete={e => handleDeleteTrip(e, trip)}
                  onMessages={e => { e.stopPropagation(); navigate(`/trip/${trip.id}`); }}
                  onTrack={e => navigateToTracking(e, trip)}
                  onReview={e => openReview(e, trip)}
                  onAcceptOffer={handleAcceptOffer}
                  onDeclineOffer={handleDeclineOffer}
                  offerActionId={offerActionId}
                />
              </SwipeableCard>
            </div>
          ))}
          <div style={{ height: 'env(safe-area-inset-bottom, 16px)', minHeight: 80 }} />
        </div>
      </div>

      {/* ══════════ DESKTOP LAYOUT ══════════ */}
      <div className="hidden md:flex flex-col min-h-screen">
        {/* Desktop Header */}
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
                  <span className="px-2.5 py-0.5 rounded-full bg-[#5ba3f5] text-white text-[11px] font-black">{activeCount} активных</span>
                )}
              </div>
              <p className="text-[11px] text-[#4a6278] mt-0.5">Управляйте вашими рейсами</p>
            </div>
            <div className="flex items-center gap-3">
              {[
                { label: 'Активные',    value: driverTrips.filter(t => ['planned','inProgress','frozen'].includes(t.status)).length, color: '#5ba3f5' },
                { label: 'Завершённые', value: driverTrips.filter(t => t.status === 'completed').length,  color: '#10b981' },
                { label: 'Отменённые',  value: driverTrips.filter(t => t.status === 'cancelled').length,  color: '#ef4444' },
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
              <button onClick={() => navigate('/create-trip')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-[13px] font-bold transition-all hover:opacity-90 active:scale-95"
                style={{ background: 'linear-gradient(135deg,#1d4ed8,#5ba3f5)', boxShadow: '0 4px 16px #3b82f630' }}>
                <Plus className="w-4 h-4" /> Создать рейс
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Tabs */}
        <div className="border-b border-white/[0.06] shrink-0" style={{ background: '#0E1621' }}>
          <div className="max-w-6xl mx-auto px-8 flex gap-1 pt-1">
            {tabs.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-3 text-[13px] font-bold transition-all border-b-2 ${
                  activeTab === tab.key ? 'text-white border-[#5ba3f5]' : 'text-[#475569] border-transparent hover:text-[#8a9baa]'
                }`}>
                {tab.label}
                {tab.count > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    activeTab === tab.key ? 'bg-[#5ba3f5] text-white' : 'bg-white/[0.06] text-[#475569]'
                  }`}>{tab.count}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Desktop Grid */}
        <div className="flex-1 overflow-y-auto" style={{ background: '#0E1621' }}>
          <div className="max-w-6xl mx-auto px-8 py-6">
            {loading && filteredTrips.length === 0 && (
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="rounded-2xl border border-white/[0.06] p-4 animate-pulse space-y-3" style={{ background: '#0d1929' }}>
                    <div className="flex justify-between"><div className="h-6 w-24 rounded-full bg-white/[0.08]" /><div className="h-4 w-20 rounded-full bg-white/[0.06]" /></div>
                    <div className="h-16 rounded-xl bg-white/[0.05]" />
                    <div className="flex gap-2"><div className="h-7 w-20 rounded-xl bg-white/[0.06]" /><div className="h-7 w-16 rounded-xl bg-white/[0.04]" /></div>
                    <div className="h-10 rounded-xl bg-white/[0.04]" />
                  </div>
                ))}
              </div>
            )}
            {!loading && filteredTrips.length === 0 && (
              <div className="flex flex-col items-center justify-center py-32 gap-4">
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center" style={{ background: '#5ba3f510' }}>
                  <Truck className="w-9 h-9 text-[#5ba3f5]" />
                </div>
                <div className="text-center">
                  <p className="text-[20px] font-black text-white mb-2">
                    {activeTab === 'active' ? 'Нет активных рейсов' : activeTab === 'completed' ? 'Завершённых нет' : 'Отменённых нет'}
                  </p>
                  <p className="text-[14px] text-[#4a6278]">
                    {activeTab === 'active' ? 'Создайте первый рейс и начните зарабатывать' : 'Здесь будут отображаться рейсы'}
                  </p>
                </div>
                {activeTab === 'active' && (
                  <button onClick={() => navigate('/create-trip')}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl text-white text-[14px] font-bold mt-2"
                    style={{ background: 'linear-gradient(135deg,#1d4ed8,#5ba3f5)', boxShadow: '0 8px 24px #3b82f640' }}>
                    <Plus className="w-4 h-4" /> Создать рейс
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
                    mode="driver"
                    weather={weatherData[trip.id]}
                    alreadyReviewed={reviewedTrips.includes(String(trip.id))}
                    unreadMessages={getUnread(trip)}
                    onStart={e => startTrip(e, trip)}
                    onFreeze={e => handleFreezeTrip(e, trip)}
                    onComplete={e => completeTrip(e, trip)}
                    onCancel={e => handleCancelTrip(e, trip)}
                    onDelete={e => handleDeleteTrip(e, trip)}
                    onMessages={e => { e.stopPropagation(); navigate('/messages'); }}
                    onTrack={e => navigateToTracking(e, trip)}
                    onReview={e => openReview(e, trip)}
                    onAcceptOffer={handleAcceptOffer}
                    onDeclineOffer={handleDeclineOffer}
                    offerActionId={offerActionId}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Review Modal ────────────────────────────────────────────────────── */}
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
              <p className="text-[10px] uppercase tracking-wider font-medium mb-1 text-[#475569]">Оцените отправителя</p>
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

      {/* ── Confirm Modal ────────────────────────────────────────────────────── */}
      {confirmModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-5"
          onClick={() => setConfirmModal(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
            style={{ background: '#162030', border: '1px solid #1e2d3d' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Icon */}
            <div className="flex flex-col items-center pt-8 pb-4 px-6">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: confirmModal.danger ? '#ef444415' : '#5ba3f515',
                  border: `1px solid ${confirmModal.danger ? '#ef444430' : '#5ba3f530'}` }}>
                {confirmModal.danger
                  ? <AlertTriangle style={{ width: 24, height: 24, color: '#f87171' }} />
                  : <CheckCircle2 style={{ width: 24, height: 24, color: '#5ba3f5' }} />}
              </div>
              <h3 className="text-[17px] font-black text-white text-center mb-2">
                {confirmModal.title}
              </h3>
              <p className="text-[13px] text-center leading-relaxed" style={{ color: '#607080' }}>
                {confirmModal.msg}
              </p>
            </div>
            {/* Buttons */}
            <div className="flex gap-2 px-5 pb-7">
              <button
                onClick={() => setConfirmModal(null)}
                className="flex-1 h-12 rounded-2xl text-[14px] font-semibold transition-all hover:bg-white/[0.08]"
                style={{ background: '#ffffff0a', border: '1px solid #ffffff10', color: '#8a9bb0' }}>
                Отмена
              </button>
              <button
                onClick={() => { confirmModal.onConfirm(); setConfirmModal(null); }}
                className="flex-1 h-12 rounded-2xl text-[14px] font-bold text-white transition-all hover:opacity-90 active:scale-95"
                style={{
                  background: confirmModal.danger
                    ? 'linear-gradient(135deg,#dc2626,#ef4444)'
                    : 'linear-gradient(135deg,#1d4ed8,#5ba3f5)',
                  boxShadow: confirmModal.danger ? '0 4px 16px #ef444440' : '0 4px 16px #3b82f640',
                }}>
                {confirmModal.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}