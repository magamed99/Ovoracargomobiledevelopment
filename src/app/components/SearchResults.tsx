/**
 * SearchResults — результаты поиска поездок И грузов.
 * ✅ FIX П-1/П-3: Всегда использует getTrips() напрямую — НЕ через TripsContext.
 * ✅ FIX П-5: tripCardProps теперь включает tripType.
 * ✅ FIX П-4: Применяет фильтры из URL (date, type, filter).
 * ✅ FIX П-SEARCH: type=cargo → показывает грузы отправителей (для водителей).
 */
import { useState, useMemo, useEffect } from 'react';
import { TripCardSkeleton } from './SkeletonCard';
import {
  ArrowLeft, Search, AlertCircle, SlidersHorizontal,
  Check, Users, Package, TrendingUp, Calendar,
  Truck, X, MapPin, ArrowRight, Zap, Weight, DollarSign,
} from 'lucide-react';
import { useNavigate, useSearchParams, Link } from 'react-router';
import { useTheme } from '../context/ThemeContext';
import { getTrips, getCargos } from '../api/dataApi';
import { TripCard } from './TripCard';
import { cleanAddress } from '../utils/addressUtils';

type SortKey = 'all' | 'price' | 'date' | 'seats' | 'cargo';
type TypeFilter = 'all' | 'trip' | 'cargo';

// ─── Desktop Top Bar ──────────────────────────────────────────────────────────
const NAV_LINKS = [
  { label: 'Главная',  href: '/home' },
  { label: 'Поиск',   href: '/search' },
  { label: 'Поездки', href: '/trips' },
  { label: 'Чат',     href: '/messages' },
  { label: 'Профиль', href: '/profile' },
];

export function SearchResults() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Detect if we're in "cargo mode" (driver browsing cargo listings)
  const urlType = (searchParams.get('type') || 'all') as TypeFilter;
  const isCargoMode = urlType === 'cargo';

  // ✅ FIX П-1: Локальный стейт вместо useTrips() — всегда смотрим в нужный источник
  const [allTrips, setAllTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    // In cargo mode: load cargos (sender listings for drivers)
    // In trip/all mode: load trips (driver listings for senders)
    const fetcher = isCargoMode ? getCargos : getTrips;
    fetcher()
      .then(items => { setAllTrips(items || []); setLoading(false); })
      .catch(() => { setLoading(false); });
  }, [isCargoMode]);

  const fromParam   = searchParams.get('from')   || '';
  const toParam     = searchParams.get('to')     || '';
  // ✅ FIX П-4: Читаем фильтры из URL params
  const dateParam   = searchParams.get('date')   || '';
  const typeParam   = (searchParams.get('type')  || 'all') as TypeFilter;
  const filterParam = searchParams.get('filter') || '';

  const [sort, setSort]             = useState<SortKey>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>(typeParam);

  // Sync type filter from URL
  useEffect(() => { setTypeFilter(typeParam); }, [typeParam]);

  // ── Filter + sort ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let trips = [...allTrips];

    // только доступные рейсы/грузы
    trips = trips.filter(t => {
      const s = (t.status || '').toLowerCase();
      if (!s) return true;
      // Cargos use 'active', trips use 'planned'/'frozen'
      return s === 'active' || s === 'planned' || s === 'frozen';
    });

    // Маршрут
    if (fromParam) trips = trips.filter(t =>
      t.from?.toLowerCase().includes(fromParam.toLowerCase()) ||
      fromParam.toLowerCase().includes(t.from?.toLowerCase() || '')
    );
    if (toParam) trips = trips.filter(t =>
      t.to?.toLowerCase().includes(toParam.toLowerCase()) ||
      toParam.toLowerCase().includes(t.to?.toLowerCase() || '')
    );

    // ✅ FIX П-4: Дата из URL
    if (dateParam) trips = trips.filter(t => t.date === dateParam);

    // ✅ FIX П-4: Быстрые фильтры из URL
    if (filterParam === 'Сегодня') {
      const today = new Date().toISOString().slice(0, 10);
      trips = trips.filter(t => t.date === today);
    } else if (filterParam === 'Завтра') {
      const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
      trips = trips.filter(t => t.date === tomorrow);
    } else if (filterParam === 'С местами') {
      trips = trips.filter(t => (t.availableSeats ?? 0) > 0);
    } else if (filterParam === 'До 50 кг') {
      trips = trips.filter(t => (t.cargoCapacity ?? 0) <= 50 && (t.cargoCapacity ?? 0) > 0);
    } else if (filterParam === 'До 200 кг') {
      trips = trips.filter(t => (t.cargoCapacity ?? 0) <= 200 && (t.cargoCapacity ?? 0) > 0);
    }

    // Тип перевозки (в cargo-mode данные уже отфильтрованы по типу через getCargos)
    if (!isCargoMode) {
      if (typeFilter === 'trip')  trips = trips.filter(t => t.tripType !== 'cargo' && (t.availableSeats ?? 0) > 0);
      if (typeFilter === 'cargo') trips = trips.filter(t => t.tripType === 'cargo' || (t.cargoCapacity ?? 0) > 0);
    }

    if (sort === 'price') {
      trips.sort((a, b) => {
        const pa = Math.min(...[a.pricePerSeat, a.pricePerKg].filter(v => v > 0), Infinity);
        const pb = Math.min(...[b.pricePerSeat, b.pricePerKg].filter(v => v > 0), Infinity);
        return (pa === Infinity ? 999999 : pa) - (pb === Infinity ? 999999 : pb);
      });
    } else if (sort === 'date') {
      trips.sort((a, b) => (a.date ? new Date(a.date).getTime() : 0) - (b.date ? new Date(b.date).getTime() : 0));
    } else if (sort === 'seats') {
      trips.sort((a, b) => (b.availableSeats ?? 0) - (a.availableSeats ?? 0));
    } else if (sort === 'cargo') {
      trips.sort((a, b) => (b.cargoCapacity ?? 0) - (a.cargoCapacity ?? 0));
    }

    return trips;
  }, [allTrips, fromParam, toParam, dateParam, filterParam, sort, typeFilter, isCargoMode]);

  const sortOptions: { key: SortKey; label: string; icon: React.ReactNode }[] = [
    { key: 'all',   label: 'Все',           icon: <Zap className="w-3 h-3" /> },
    { key: 'price', label: 'Дешевле',       icon: <TrendingUp className="w-3 h-3" /> },
    { key: 'date',  label: 'По дате',       icon: <Calendar className="w-3 h-3" /> },
    { key: 'seats', label: 'Больше мест',   icon: <Users className="w-3 h-3" /> },
    { key: 'cargo', label: 'Больше груза',  icon: <Package className="w-3 h-3" /> },
  ];

  // ── Stats for desktop ──────────────────────────────────────────────────────
  const totalSeats  = filtered.reduce((s, t) => s + (t.availableSeats || 0), 0);
  const totalCargo  = filtered.reduce((s, t) => s + (t.cargoCapacity  || 0), 0);
  const minPrice    = filtered.reduce((min, t) => {
    const p = Math.min(...[t.pricePerSeat, t.pricePerKg].filter(v => v > 0), Infinity);
    return p < min ? p : min;
  }, Infinity);

  // ✅ FIX П-5: tripType добавлен; cargo fields included
  const tripCardProps = (trip: any) => ({
    id:             trip.id,
    tripId:         trip.id,
    from:           trip.from,
    to:             trip.to,
    date:           trip.date,
    time:           trip.time,
    availableSeats: trip.availableSeats,
    childSeats:     trip.childSeats,
    cargoCapacity:  trip.cargoCapacity,
    pricePerSeat:   trip.pricePerSeat,
    pricePerChild:  trip.pricePerChild,
    pricePerKg:     trip.pricePerKg,
    vehicle:        trip.vehicle,
    notes:          trip.notes,
    // ✅ Cargo fields for sender listings
    tripType:       trip.tripType || (trip.cargoWeight > 0 ? 'cargo' : undefined),
    cargoWeight:    trip.cargoWeight,
    budget:         trip.budget,
    currency:       trip.currency,
    senderName:     trip.senderName,
    senderAvatar:   trip.senderAvatar,
    // Driver fields
    driverName:     trip.driverName,
    driverAvatar:   trip.driverAvatar,
    driverRating:   trip.driverRating,
    driverPhone:    trip.driverPhone,
    driverEmail:    trip.driverEmail,
  });

  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen flex flex-col font-['Sora'] bg-[#0E1621]">

      {/* ══════════════════ MOBILE LAYOUT ══════════════════ */}
      <div className="md:hidden flex flex-col min-h-screen">

        {/* Header */}
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#0E1621]/95 border-b border-white/[0.06]">
          <div className="flex items-center gap-2 px-3"
            style={{ paddingTop: 'max(52px, env(safe-area-inset-top, 52px))', paddingBottom: 12 }}>
            <button onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/[0.07] border border-white/10 text-white active:scale-90 transition-all shrink-0">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex-1 text-center px-2">
              {isCargoMode && !fromParam && !toParam ? (
                <div className="flex items-center justify-center gap-2">
                  <Package className="w-4 h-4 text-amber-400" />
                  <h2 className="text-base font-extrabold text-white">Грузы отправителей</h2>
                </div>
              ) : (fromParam || toParam) ? (
                <div className="flex items-center justify-center gap-2">
                  <span className="text-sm font-extrabold text-white truncate max-w-[90px]">{fromParam || '—'}</span>
                  <span className="text-[#475569] text-xs">→</span>
                  <span className="text-sm font-extrabold text-white truncate max-w-[90px]">{toParam || '—'}</span>
                </div>
              ) : (
                <h2 className="text-base font-extrabold text-white">Все объявления</h2>
              )}
            </div>
            <button
              onClick={() => setShowFilters(v => !v)}
              className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all shrink-0 ${
                showFilters || typeFilter !== 'all'
                  ? 'bg-[#1978e5]/20 border-[#1978e5]/40 text-[#5ba3f5]'
                  : 'bg-white/[0.07] border-white/10 text-[#64748b]'
              }`}>
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
          {/* Sort chips */}
          <div className="px-3 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
            {sortOptions.map(opt => (
              <button key={opt.key} onClick={() => setSort(opt.key)}
                className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all ${
                  sort === opt.key
                    ? 'bg-[#1978e5] text-white shadow-lg shadow-[#1978e5]/25'
                    : 'bg-white/[0.06] border border-white/[0.08] text-[#607080]'
                }`}>
                {sort === opt.key && <Check className="w-3 h-3 inline mr-1" />}{opt.label}
              </button>
            ))}
          </div>
          {showFilters && (
            <div className="px-3 pb-3 flex gap-2 border-t border-white/[0.05] pt-3">
              <span className="text-[11px] font-semibold text-[#475569] self-center mr-1">Тип:</span>
              {([
                { key: 'all' as TypeFilter,   label: 'Все' },
                { key: 'trip' as TypeFilter,  label: '🚗 Пассажиры' },
                { key: 'cargo' as TypeFilter, label: '📦 Груз' },
              ] as const).map(opt => (
                <button key={opt.key} onClick={() => setTypeFilter(opt.key)}
                  className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-bold transition-all ${
                    typeFilter === opt.key
                      ? 'bg-amber-500/20 border border-amber-500/40 text-amber-400'
                      : 'bg-white/[0.06] border border-white/[0.08] text-[#607080]'
                  }`}>
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </header>

        {/* Results count */}
        <div className="px-4 py-3 flex items-center justify-between">
          <p className="text-sm font-medium text-[#607080]">
            Найдено{' '}
            <span className="font-extrabold text-white">{filtered.length}</span>{' '}
            {filtered.length === 1 ? 'объявление' : filtered.length < 5 ? 'объявления' : 'объявлений'}
          </p>
          {(fromParam || toParam) && (
            <button onClick={() => navigate('/search-results')} className="text-xs font-semibold text-[#1978e5] hover:underline">
              Все маршруты
            </button>
          )}
        </div>

        {/* Skeleton */}
        {loading && (
          <div className="px-4 flex flex-col gap-3 pb-4">
            {[1, 2, 3].map(i => <TripCardSkeleton key={i} isDark={isDark} />)}
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center px-8 py-16 text-center">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5 bg-white/[0.04]">
              <Search className="w-9 h-9 text-[#475569]" />
            </div>
            <p className="text-lg font-extrabold text-white mb-2">Объявлений не найдено</p>
            <p className="text-sm leading-relaxed mb-6 text-[#475569]">
              {fromParam || toParam
                ? `По маршруту ${fromParam}${fromParam && toParam ? ' → ' : ''}${toParam} пока нет объявлений`
                : 'Водители ещё не разместили ни одного объявления'}
            </p>
            <div className="w-full max-w-sm p-4 rounded-2xl border border-[#1978e5]/20 bg-[#1978e5]/08">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-[#1978e5] shrink-0 mt-0.5" />
                <p className="text-xs text-[#1978e5] font-medium leading-relaxed text-left">
                  Попробуйте изменить маршрут или вернитесь позже — водители регулярно добавляют новые поездки
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Cards */}
        {!loading && filtered.length > 0 && (
          <main className="px-4 pb-8">
            <div className="flex flex-col gap-3">
              {filtered.map(trip => (
                <TripCard key={trip.id} trip={tripCardProps(trip)} mode="search" />
              ))}
            </div>
          </main>
        )}
      </div>

      {/* ══════════════════ DESKTOP LAYOUT ══════════════════ */}
      <div className="hidden md:flex flex-col min-h-screen" style={{ background: '#080f1a' }}>

        {/* ── TOP BAR ── */}
        <header className="sticky top-0 z-50 border-b"
          style={{ background: '#0a1220cc', backdropFilter: 'blur(20px)', borderColor: '#ffffff0a' }}>
          <div className="max-w-[1400px] mx-auto px-8 h-16 flex items-center gap-6">

            {/* Logo + back */}
            <div className="flex items-center gap-4 shrink-0">
              <button onClick={() => navigate(-1)}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                style={{ background: '#ffffff0a', border: '1px solid #ffffff0f', color: '#8a9bb0' }}>
                <ArrowLeft style={{ width: 16, height: 16 }} />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'linear-gradient(135deg,#1d4ed8,#5ba3f5)' }}>
                  <Truck style={{ width: 14, height: 14, color: '#fff' }} />
                </div>
                <span className="text-[15px] font-black text-white tracking-tight">Ovora</span>
                <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: '#5ba3f5' }}>Cargo</span>
              </div>
            </div>

            {/* Route pill */}
            <div className="flex-1 flex justify-center">
              {(fromParam || toParam) ? (
                <div className="flex items-center gap-3 px-5 py-2.5 rounded-2xl"
                  style={{ background: '#ffffff08', border: '1px solid #ffffff10' }}>
                  <MapPin style={{ width: 14, height: 14, color: '#5ba3f5', flexShrink: 0 }} />
                  <span className="text-[14px] font-bold text-white">{cleanAddress(fromParam) || '—'}</span>
                  <ArrowRight style={{ width: 14, height: 14, color: '#3a5570', flexShrink: 0 }} />
                  <span className="text-[14px] font-bold text-white">{cleanAddress(toParam) || '—'}</span>
                  {(fromParam || toParam) && (
                    <button onClick={() => navigate('/search-results')}
                      className="ml-1 p-0.5 rounded-full hover:bg-white/10 transition-colors"
                      title="Сбросить маршрут" style={{ color: '#3a5570' }}>
                      <X style={{ width: 12, height: 12 }} />
                    </button>
                  )}
                </div>
              ) : (
                <span className="text-[15px] font-bold" style={{ color: '#4a6278' }}>Все объявления</span>
              )}
            </div>

            {/* Nav links */}
            <nav className="flex items-center gap-1 shrink-0">
              {NAV_LINKS.map(link => (
                <Link key={link.href} to={link.href}
                  className="px-3.5 py-2 rounded-xl text-[13px] font-semibold transition-all hover:bg-white/[0.06] hover:text-white"
                  style={{ color: '#607080' }}>
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        {/* ── BODY ── */}
        <div className="flex-1 max-w-[1400px] w-full mx-auto px-8 py-8 flex gap-8 items-start">

          {/* ── LEFT: Filter sidebar ── */}
          <aside className="w-64 shrink-0 sticky top-24 flex flex-col gap-4">

            {/* Search button */}
            <button onClick={() => navigate('/search')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg,#1d4ed8,#5ba3f5)', boxShadow: '0 8px 24px #1d4ed840' }}>
              <Search style={{ width: 16, height: 16, color: '#fff', flexShrink: 0 }} />
              <span className="text-[13px] font-bold text-white">Новый поиск</span>
            </button>

            {/* Sort */}
            <div className="rounded-2xl overflow-hidden" style={{ background: '#0d1929', border: '1px solid #1a2d45' }}>
              <div className="px-4 py-3 border-b" style={{ borderColor: '#1a2d3d' }}>
                <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#3a5570' }}>Сортировка</p>
              </div>
              <div className="p-2 flex flex-col gap-0.5">
                {sortOptions.map(opt => (
                  <button key={opt.key} onClick={() => setSort(opt.key)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all text-left"
                    style={{
                      background: sort === opt.key ? '#1d4ed815' : 'transparent',
                      color: sort === opt.key ? '#5ba3f5' : '#607080',
                      border: sort === opt.key ? '1px solid #1d4ed830' : '1px solid transparent',
                    }}>
                    <span className="flex items-center justify-center w-6 h-6 rounded-lg shrink-0"
                      style={{ background: sort === opt.key ? '#5ba3f520' : '#ffffff08' }}>
                      {opt.icon}
                    </span>
                    {opt.label}
                    {sort === opt.key && (
                      <Check style={{ width: 13, height: 13, marginLeft: 'auto', flexShrink: 0 }} />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Type filter */}
            <div className="rounded-2xl overflow-hidden" style={{ background: '#0d1929', border: '1px solid #1a2d45' }}>
              <div className="px-4 py-3 border-b" style={{ borderColor: '#1a2d3d' }}>
                <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#3a5570' }}>Тип перевозки</p>
              </div>
              <div className="p-2 flex flex-col gap-0.5">
                {([
                  { key: 'all' as TypeFilter,   label: 'Все типы',     emoji: '🔍', color: '#5ba3f5' },
                  { key: 'trip' as TypeFilter,  label: 'Пассажиры',   emoji: '🚗', color: '#10b981' },
                  { key: 'cargo' as TypeFilter, label: 'Груз',        emoji: '📦', color: '#f59e0b' },
                ] as const).map(opt => (
                  <button key={opt.key} onClick={() => setTypeFilter(opt.key)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all text-left"
                    style={{
                      background: typeFilter === opt.key ? opt.color + '15' : 'transparent',
                      color: typeFilter === opt.key ? opt.color : '#607080',
                      border: typeFilter === opt.key ? `1px solid ${opt.color}30` : '1px solid transparent',
                    }}>
                    <span className="text-[16px] leading-none">{opt.emoji}</span>
                    {opt.label}
                    {typeFilter === opt.key && (
                      <Check style={{ width: 13, height: 13, marginLeft: 'auto', color: opt.color, flexShrink: 0 }} />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Stats card */}
            {!loading && filtered.length > 0 && (
              <div className="rounded-2xl overflow-hidden" style={{ background: '#0d1929', border: '1px solid #1a2d45' }}>
                <div className="px-4 py-3 border-b" style={{ borderColor: '#1a2d3d' }}>
                  <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#3a5570' }}>Сводка</p>
                </div>
                <div className="p-4 flex flex-col gap-3">
                  {[
                    { label: 'Объявлений', value: filtered.length, color: '#5ba3f5', suffix: '' },
                    ...(totalSeats > 0   ? [{ label: 'Свободных мест', value: totalSeats, color: '#10b981', suffix: '' }] : []),
                    ...(totalCargo > 0   ? [{ label: 'Грузовместимость', value: totalCargo, color: '#f59e0b', suffix: ' кг' }] : []),
                    ...(minPrice < Infinity ? [{ label: 'Цена от', value: minPrice, color: '#a78bfa', suffix: ' TJS' }] : []),
                  ].map(s => (
                    <div key={s.label} className="flex items-center justify-between">
                      <span className="text-[12px]" style={{ color: '#4a6278' }}>{s.label}</span>
                      <span className="text-[14px] font-black" style={{ color: s.color }}>
                        {s.value}{s.suffix}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>

          {/* ── RIGHT: Results ── */}
          <main className="flex-1 min-w-0">

            {/* Results header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-[22px] font-black text-white mb-1">
                  {loading ? 'Поиск...' : (
                    filtered.length > 0
                      ? `${filtered.length} ${filtered.length === 1 ? 'объявление' : filtered.length < 5 ? 'объявления' : 'объявлений'}`
                      : 'Не найдено'
                  )}
                </h1>
                <p className="text-[13px]" style={{ color: '#4a6278' }}>
                  {(fromParam || toParam)
                    ? `Маршрут: ${cleanAddress(fromParam) || 'любой'} → ${cleanAddress(toParam) || 'любой'}`
                    : 'Все доступные поездки и перевозки'}
                </p>
              </div>

              {/* Active filters badge */}
              {(typeFilter !== 'all' || sort !== 'all') && (
                <button onClick={() => { setTypeFilter('all'); setSort('all'); }}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-[12px] font-bold transition-all hover:opacity-80"
                  style={{ background: '#ef444415', border: '1px solid #ef444430', color: '#f87171' }}>
                  <X style={{ width: 12, height: 12 }} />
                  Сбросить фильтры
                </button>
              )}
            </div>

            {/* ── Skeleton ── */}
            {loading && (
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-5">
                {[1, 2, 3, 4, 5, 6].map(i => <TripCardSkeleton key={i} isDark={true} />)}
              </div>
            )}

            {/* ── Empty state ── */}
            {!loading && filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 gap-6">
                <div className="relative">
                  <div className="w-28 h-28 rounded-3xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg,#1d4ed810,#5ba3f510)', border: '1px solid #5ba3f520' }}>
                    <Search style={{ width: 40, height: 40, color: '#3a5570' }} />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl flex items-center justify-center"
                    style={{ background: '#0d1929', border: '1px solid #1a2d45' }}>
                    <span className="text-[18px]">🤔</span>
                  </div>
                </div>
                <div className="text-center max-w-md">
                  <p className="text-[24px] font-black text-white mb-3">Объявлений не найдено</p>
                  <p className="text-[14px] leading-relaxed" style={{ color: '#4a6278' }}>
                    {fromParam || toParam
                      ? `По маршруту ${cleanAddress(fromParam)}${fromParam && toParam ? ' → ' + cleanAddress(toParam) : ''} пока нет объявлений водителей`
                      : 'Водители ещё не разместили объявлений'}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => navigate('/search')}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl text-[14px] font-bold text-white transition-all hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg,#1d4ed8,#5ba3f5)', boxShadow: '0 8px 24px #1d4ed840' }}>
                    <Search style={{ width: 16, height: 16 }} /> Изменить маршрут
                  </button>
                  <button onClick={() => { setTypeFilter('all'); setSort('all'); navigate('/search-results'); }}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl text-[14px] font-semibold transition-all hover:bg-white/[0.06]"
                    style={{ background: '#ffffff08', border: '1px solid #ffffff10', color: '#8a9bb0' }}>
                    Все маршруты
                  </button>
                </div>
                <div className="w-full max-w-sm p-4 rounded-2xl flex items-start gap-3"
                  style={{ background: '#1d4ed810', border: '1px solid #1d4ed830' }}>
                  <AlertCircle style={{ width: 16, height: 16, color: '#5ba3f5', flexShrink: 0, marginTop: 1 }} />
                  <p className="text-[12px] leading-relaxed" style={{ color: '#5ba3f5' }}>
                    Попробуйте изменить маршрут или вернитесь позже — водители регулярно добавляют новые поездки
                  </p>
                </div>
              </div>
            )}

            {/* ── Cards grid ── */}
            {!loading && filtered.length > 0 && (
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-5">
                {filtered.map(trip => (
                  <TripCard key={trip.id} trip={tripCardProps(trip)} mode="search" />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}