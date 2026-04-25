import { useState, useRef, useEffect, useCallback } from 'react';
import { usePolling } from '../hooks/usePolling';
import {
  Calendar, Users, Plus, Minus, Package,
  Search, Star, ArrowRight, X, Weight, Clock,
  ArrowUpDown, MapPin, Flame, TrendingUp, Car,
  Sparkles, ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router';
import { searchCities, City, addCustomCity } from '../data/cities';
import { getTrips } from '../api/dataApi';
import { toast } from 'sonner';
import { countryFlag, getCityCountry } from '../utils/addressUtils';

const HISTORY_KEY = 'ovora_search_history';

// ── City Dropdown ─────────────────────────────────────────────────────────────
function CityDropdown({ suggestions, onSelect, addLabel, onAdd }: {
  suggestions: City[];
  onSelect: (c: City) => void;
  addLabel?: string;
  onAdd?: () => void;
}) {
  if (!suggestions.length && !addLabel) return null;
  return (
    <motion.div
      className="absolute left-0 right-0 top-full z-50 overflow-hidden"
      style={{ background: '#0d1a28', border: '1px solid #1a2e42', borderTop: 'none', borderRadius: '0 0 16px 16px', boxShadow: '0 16px 40px #000000a0' }}
      initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}
    >
      {suggestions.map((city, i) => (
        <button
          key={`${city.name}-${i}`}
          onMouseDown={e => e.preventDefault()}
          onClick={() => onSelect(city)}
          className="w-full px-4 py-3 flex items-center gap-3 text-left border-b last:border-b-0"
          style={{ borderColor: '#ffffff08', transition: 'background .12s' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#ffffff08')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <span className="text-lg leading-none">{countryFlag(city.country)}</span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[14px] text-white truncate">{city.name}</p>
            <p className="text-[11px] text-[#4a6880] truncate">{city.country}{city.region ? ` · ${city.region}` : ''}</p>
          </div>
        </button>
      ))}
      {addLabel && onAdd && (
        <button
          onMouseDown={e => e.preventDefault()}
          onClick={onAdd}
          className="w-full px-4 py-3 flex items-center gap-3 text-left"
          style={{ transition: 'background .12s' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#ffffff08')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <Plus className="w-3.5 h-3.5 text-[#5ba3f5]" />
          <p className="text-[13px] font-semibold text-[#5ba3f5]">{addLabel}</p>
        </button>
      )}
    </motion.div>
  );
}

// ── Trip Card (right panel) ───────────────────────────────────────────────────
function PopularTripCard({ trip, onClick, index }: { trip: any; onClick: () => void; index: number }) {
  return (
    <motion.button
      onClick={onClick}
      className="w-full text-left rounded-2xl overflow-hidden"
      style={{ background: '#0a1826', border: '1px solid #0f2035' }}
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.07, duration: 0.3 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="h-[3px]" style={{ background: 'linear-gradient(90deg, #1d4ed8, #10b981)' }} />
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[12px] font-black shrink-0 uppercase"
            style={{ background: 'linear-gradient(135deg, #5b21b6, #1d4ed8)' }}>
            {trip.driverAvatar
              ? <img src={trip.driverAvatar} alt="" className="w-full h-full rounded-full object-cover" />
              : (trip.driverName ?? 'ВД').split(' ').filter(Boolean).map((w: string) => w[0]).join('').slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-white truncate">{trip.driverName || 'Водитель'}</p>
            <p className="text-[10px] text-[#3d5a72]">Водитель</p>
          </div>
          {trip.pricePerSeat > 0 && (
            <span style={{ fontSize: 13, fontWeight: 800, color: '#5ba3f5' }}>{trip.pricePerSeat} TJS</span>
          )}
        </div>

        <div className="flex gap-3">
          <div className="flex flex-col items-center shrink-0 pt-1">
            <div className="w-2 h-2 rounded-full bg-[#5ba3f5]" />
            <div className="w-px flex-1 my-1" style={{ background: '#1a2e42', minHeight: 18 }} />
            <div className="w-2 h-2 rounded-full bg-[#10b981]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-2">
              <div className="min-w-0">
                <p className="text-[13px] font-bold text-white truncate">{trip.from}</p>
                <p className="text-[10px] text-[#3d5a72]">{trip.fromCountry}</p>
              </div>
              {trip.time && <span style={{ fontSize: 12, color: '#5ba3f5', fontWeight: 700 }}>{trip.time}</span>}
            </div>
            <div>
              <p className="text-[13px] font-bold text-white truncate">{trip.to}</p>
              <p className="text-[10px] text-[#3d5a72]">{trip.toCountry}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: '1px solid #0f2035' }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#5ba3f5', background: '#1d4ed815', border: '1px solid #1d4ed830', padding: '3px 8px', borderRadius: 8 }}>
            {trip.availableSeats || 3} мест
          </span>
          {trip.date && (
            <span style={{ fontSize: 10, fontWeight: 600, color: '#3d5a72' }}>
              {new Date(trip.date + 'T00:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
            </span>
          )}
          <ChevronRight className="ml-auto w-3.5 h-3.5 text-[#1e3a55]" />
        </div>
      </div>
    </motion.button>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
export function SearchPage() {
  const navigate = useNavigate();

  const [fromCity,       setFromCity]       = useState('');
  const [toCity,         setToCity]         = useState('');
  const [fromCityData,   setFromCityData]   = useState<City | null>(null);
  const [toCityData,     setToCityData]     = useState<City | null>(null);
  const [fromSuggestions, setFromSugg]      = useState<City[]>([]);
  const [toSuggestions,  setToSugg]         = useState<City[]>([]);
  const [showFromDrop,   setShowFromDrop]   = useState(false);
  const [showToDrop,     setShowToDrop]     = useState(false);
  const [showAddFrom,    setShowAddFrom]    = useState(false);
  const [showAddTo,      setShowAddTo]      = useState(false);
  const [searchType,     setSearchType]     = useState<'trip' | 'cargo'>('trip');
  const [date,           setDate]           = useState('');
  const [passengers,     setPassengers]     = useState(1);
  const [cargoWeight,    setCargoWeight]    = useState(10);
  const [activeFilter,   setActiveFilter]   = useState<string | null>(null);
  const [fromFocused,    setFromFocused]    = useState(false);
  const [toFocused,      setToFocused]      = useState(false);
  const [swapping,       setSwapping]       = useState(false);

  const [popularTrips, setPopularTrips] = useState<any[]>([]);
  const [searchHistory, setSearchHistory] = useState<Array<{ from: string; to: string }>>(() => {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; }
  });

  const fromRef = useRef<HTMLDivElement>(null);
  const toRef   = useRef<HTMLDivElement>(null);

  const saveToHistory = (from: string, to: string) => {
    if (!from.trim() || !to.trim()) return;
    const entry = { from: from.trim(), to: to.trim() };
    const prev: Array<{ from: string; to: string }> = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    const next = [entry, ...prev.filter(h => !(h.from === entry.from && h.to === entry.to))].slice(0, 5);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    setSearchHistory(next);
  };

  const removeFromHistory = (idx: number) => {
    const next = searchHistory.filter((_, i) => i !== idx);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    setSearchHistory(next);
  };

  const handleFromChange = (val: string) => {
    setFromCity(val);
    if (val.length > 0) {
      const s = searchCities(val);
      setFromSugg(s); setShowFromDrop(s.length > 0);
      setShowAddFrom(s.length === 0 && val.length > 2);
    } else { setFromSugg([]); setShowFromDrop(false); setShowAddFrom(false); }
  };

  const handleToChange = (val: string) => {
    setToCity(val);
    if (val.length > 0) {
      const s = searchCities(val);
      setToSugg(s); setShowToDrop(s.length > 0);
      setShowAddTo(s.length === 0 && val.length > 2);
    } else { setToSugg([]); setShowToDrop(false); setShowAddTo(false); }
  };

  const selectFrom = (city: City) => { setFromCity(city.name); setFromCityData(city); setShowFromDrop(false); setFromSugg([]); setShowAddFrom(false); };
  const selectTo   = (city: City) => { setToCity(city.name);   setToCityData(city);   setShowToDrop(false);   setToSugg([]);   setShowAddTo(false); };

  const swapCities = () => {
    setSwapping(true);
    setTimeout(() => {
      const tmpName = fromCity, tmpData = fromCityData;
      setFromCity(toCity); setFromCityData(toCityData);
      setToCity(tmpName);  setToCityData(tmpData);
      setSwapping(false);
    }, 180);
  };

  const handleAddFrom = () => {
    const country = prompt(`Страна для «${fromCity}»:`, 'Таджикистан');
    if (country) { addCustomCity({ name: fromCity, country: country.trim(), region: '' }, 'sender'); toast.success(`Город «${fromCity}» добавлен`); setShowAddFrom(false); }
  };
  const handleAddTo = () => {
    const country = prompt(`Страна для «${toCity}»:`, 'Россия');
    if (country) { addCustomCity({ name: toCity, country: country.trim(), region: '' }, 'sender'); toast.success(`Город «${toCity}» добавлен`); setShowAddTo(false); }
  };

  const doSearch = () => {
    saveToHistory(fromCity, toCity);
    const params = new URLSearchParams();
    if (fromCity.trim()) params.set('from', fromCity.trim());
    if (toCity.trim())   params.set('to', toCity.trim());
    if (date)            params.set('date', date);
    if (searchType !== 'trip') params.set('type', searchType);
    if (activeFilter)    params.set('filter', activeFilter);
    params.set('passengers', String(passengers));
    params.set('cargoWeight', String(cargoWeight));
    navigate(`/search-results?${params.toString()}`);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (fromRef.current && !fromRef.current.contains(e.target as Node)) setShowFromDrop(false);
      if (toRef.current   && !toRef.current.contains(e.target as Node))   setShowToDrop(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const buildPopularTrips = useCallback((trips: any[]) => {
    return trips
      .filter((t: any) => t.from && t.to && !t.deletedAt && t.status !== 'cancelled' && t.status !== 'completed')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6)
      .map(t => ({
        id: t.id, from: t.from, to: t.to,
        fromCountry: getCityCountry(t.from), toCountry: getCityCountry(t.to),
        driverName: t.driverName, driverAvatar: t.driverAvatar, driverEmail: t.driverEmail,
        vehicle: t.vehicle, pricePerSeat: t.pricePerSeat,
        availableSeats: t.availableSeats, date: t.date, time: t.time,
      }));
  }, []);

  useEffect(() => {
    localStorage.removeItem('ovora_published_trips');
    setPopularTrips([]);
    getTrips()
      .then(trips => { if (trips?.length) setPopularTrips(buildPopularTrips(trips)); })
      .catch(() => setPopularTrips([]));
  }, [buildPopularTrips]);

  usePolling(async () => {
    try {
      const trips = await getTrips();
      if (trips?.length) setPopularTrips(buildPopularTrips(trips));
    } catch {}
  }, 15_000);

  const filters = searchType === 'trip'
    ? ['Сегодня', 'Завтра', 'Эконом', 'Комфорт', 'С местами']
    : ['Сегодня', 'Завтра', 'До 50 кг', 'До 200 кг', 'Хрупкий груз'];

  const canSearch = fromCity.trim().length > 0 && toCity.trim().length > 0;

  // ─── Shared search form JSX ───────────────────────────────────────────────
  const SearchForm = (
    <div className="flex flex-col gap-4">
      {/* Type tabs */}
      <div className="flex gap-2">
        {(['trip', 'cargo'] as const).map(type => {
          const active = searchType === type;
          return (
            <button
              key={type}
              onClick={() => { setSearchType(type); setActiveFilter(null); }}
              className="flex-1 h-11 rounded-2xl flex items-center justify-center gap-2 text-[13px] font-black"
              style={{
                background: active ? (type === 'trip' ? '#1d4ed815' : '#10b98115') : '#0a1826',
                border: `1.5px solid ${active ? (type === 'trip' ? '#1d4ed840' : '#10b98140') : '#0f2035'}`,
                color: active ? (type === 'trip' ? '#5ba3f5' : '#10b981') : '#2e4a62',
                transition: 'all .15s',
              }}
            >
              {type === 'trip' ? <Users className="w-4 h-4" /> : <Package className="w-4 h-4" />}
              {type === 'trip' ? 'Поездка' : 'Груз'}
            </button>
          );
        })}
      </div>

      {/* Route card */}
      <div className="rounded-2xl overflow-visible" style={{ background: '#0a1826', border: '1px solid #0f2035' }}>
        {/* FROM */}
        <div className="relative" ref={fromRef}>
          <div
            className="flex items-center gap-3.5 px-4 py-4 border-b rounded-t-2xl"
            style={{ borderColor: '#0f2035', background: fromFocused ? '#1d4ed808' : 'transparent', transition: 'background .15s' }}
          >
            <div className="w-3 h-3 rounded-full border-2 shrink-0" style={{ borderColor: '#1d4ed8', background: '#1d4ed8' }} />
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: '#2e4a62' }}>Откуда</p>
              <input
                type="text" placeholder="Город отправления" value={fromCity}
                onChange={e => handleFromChange(e.target.value)}
                onFocus={() => setFromFocused(true)} onBlur={() => setFromFocused(false)}
                className="w-full text-[15px] font-bold bg-transparent outline-none text-white placeholder-[#2e4a62]"
              />
              {fromCity && (
                <p className="text-[10px] mt-0.5" style={{ color: '#1d4ed8' }}>
                  {countryFlag(getCityCountry(fromCity))} {getCityCountry(fromCity)}
                </p>
              )}
            </div>
            {fromCity && (
              <button onClick={() => { setFromCity(''); setFromCityData(null); }}
                className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: '#ffffff09', color: '#2e4a62', transition: 'color .12s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={e => (e.currentTarget.style.color = '#2e4a62')}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <AnimatePresence>
            {(showFromDrop && fromSuggestions.length > 0) || showAddFrom ? (
              <CityDropdown suggestions={fromSuggestions} onSelect={selectFrom}
                addLabel={showAddFrom ? `Добавить «${fromCity}»` : undefined} onAdd={handleAddFrom} />
            ) : null}
          </AnimatePresence>
        </div>

        {/* SWAP */}
        <div className="flex items-center px-4 relative border-b" style={{ borderColor: '#0f2035' }}>
          <div className="flex-1 h-px" style={{ background: '#0f2035' }} />
          <motion.button
            onClick={swapCities}
            className="w-8 h-8 rounded-xl flex items-center justify-center z-10 -my-4"
            style={{ background: '#060d18', border: '1px solid #0f2035', boxShadow: '0 2px 12px #00000060' }}
            animate={{ rotate: swapping ? 180 : 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            whileTap={{ scale: 0.88 }}
          >
            <ArrowUpDown className="w-3.5 h-3.5" style={{ color: '#2e4a62' }} />
          </motion.button>
          <div className="flex-1 h-px" style={{ background: '#0f2035' }} />
        </div>

        {/* TO */}
        <div className="relative" ref={toRef}>
          <div
            className="flex items-center gap-3.5 px-4 py-4 rounded-b-2xl"
            style={{ background: toFocused ? '#10b98108' : 'transparent', transition: 'background .15s' }}
          >
            <div className="w-3 h-3 rounded-full border-2 shrink-0" style={{ borderColor: '#10b981', background: '#10b981' }} />
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: '#2e4a62' }}>Куда</p>
              <input
                type="text" placeholder="Город назначения" value={toCity}
                onChange={e => handleToChange(e.target.value)}
                onFocus={() => setToFocused(true)} onBlur={() => setToFocused(false)}
                className="w-full text-[15px] font-bold bg-transparent outline-none text-white placeholder-[#2e4a62]"
              />
              {toCity && (
                <p className="text-[10px] mt-0.5" style={{ color: '#10b981' }}>
                  {countryFlag(getCityCountry(toCity))} {getCityCountry(toCity)}
                </p>
              )}
            </div>
            {toCity && (
              <button onClick={() => { setToCity(''); setToCityData(null); }}
                className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: '#ffffff09', color: '#2e4a62', transition: 'color .12s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={e => (e.currentTarget.style.color = '#2e4a62')}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <AnimatePresence>
            {(showToDrop && toSuggestions.length > 0) || showAddTo ? (
              <CityDropdown suggestions={toSuggestions} onSelect={selectTo}
                addLabel={showAddTo ? `Добавить «${toCity}»` : undefined} onAdd={handleAddTo} />
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      {/* Date + Count */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl px-4 py-3.5" style={{ background: '#0a1826', border: '1px solid #0f2035' }}>
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-3.5 h-3.5" style={{ color: '#a855f7' }} />
            <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: '#2e4a62' }}>Дата</p>
          </div>
          <input
            type="date" value={date} onChange={e => setDate(e.target.value)}
            className="w-full text-[13px] font-bold bg-transparent outline-none text-white"
          />
        </div>
        <div className="rounded-2xl px-4 py-3.5" style={{ background: '#0a1826', border: '1px solid #0f2035' }}>
          <div className="flex items-center gap-2 mb-2">
            {searchType === 'trip' ? <Users className="w-3.5 h-3.5 text-[#5ba3f5]" /> : <Weight className="w-3.5 h-3.5 text-[#f59e0b]" />}
            <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: '#2e4a62' }}>
              {searchType === 'trip' ? 'Мест' : 'Вес (кг)'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => searchType === 'trip' ? setPassengers(Math.max(1, passengers - 1)) : setCargoWeight(Math.max(1, cargoWeight - 1))}
              className="w-7 h-7 rounded-xl flex items-center justify-center"
              style={{ background: '#ffffff08', color: '#2e4a62', transition: 'color .12s' }}
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="text-[17px] font-black text-white flex-1 text-center">
              {searchType === 'trip' ? passengers : cargoWeight}
            </span>
            <button
              onClick={() => searchType === 'trip' ? setPassengers(Math.min(8, passengers + 1)) : setCargoWeight(Math.min(9999, cargoWeight + 1))}
              className="w-7 h-7 rounded-xl flex items-center justify-center"
              style={{
                background: searchType === 'trip' ? '#1d4ed815' : '#f59e0b15',
                border: `1.5px solid ${searchType === 'trip' ? '#1d4ed835' : '#f59e0b35'}`,
              }}
            >
              <Plus className="w-3 h-3" style={{ color: searchType === 'trip' ? '#5ba3f5' : '#f59e0b' }} />
            </button>
          </div>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {filters.map(f => {
          const active = activeFilter === f;
          return (
            <button
              key={f}
              onClick={() => setActiveFilter(active ? null : f)}
              className="flex-shrink-0 px-4 h-8 rounded-full text-[12px] font-bold"
              style={{
                background: active ? '#1d4ed818' : '#0a1826',
                border: `1.5px solid ${active ? '#1d4ed840' : '#0f2035'}`,
                color: active ? '#5ba3f5' : '#2e4a62',
                transition: 'all .15s',
              }}
            >
              {f}
            </button>
          );
        })}
      </div>

      {/* Search button */}
      <button
        onClick={doSearch}
        disabled={!canSearch}
        className="w-full h-14 rounded-2xl flex items-center justify-center gap-2.5 text-[15px] font-black text-white disabled:opacity-40"
        style={{
          background: canSearch ? 'linear-gradient(135deg, #1a47c8, #2f8fe0)' : '#0a1826',
          boxShadow: canSearch ? '0 6px 28px #1a47c840' : 'none',
          transition: 'all .2s',
          border: canSearch ? 'none' : '1px solid #0f2035',
        }}
      >
        <Search className="w-5 h-5" />
        Найти {searchType === 'trip' ? 'поездку' : 'перевозку'}
      </button>
    </div>
  );

  // ─── Right panel content ──────────────────────────────────────────────────
  const RightPanel = (
    <div className="flex flex-col gap-6">
      {/* History */}
      <AnimatePresence>
        {searchHistory.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" style={{ color: '#2e4a62' }} />
                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#2e4a62' }}>История поисков</span>
              </div>
              <button
                onClick={() => { localStorage.removeItem(HISTORY_KEY); setSearchHistory([]); }}
                className="text-[11px] font-bold"
                style={{ color: '#1e3a55', transition: 'color .12s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                onMouseLeave={e => (e.currentTarget.style.color = '#1e3a55')}
              >
                Очистить
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden" style={{ background: '#0a1826', border: '1px solid #0f2035' }}>
              {searchHistory.map((h, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 border-b last:border-b-0"
                  style={{ borderColor: '#0f2035' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#0f2035')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <button
                    onClick={() => {
                      setFromCity(h.from); setToCity(h.to);
                      saveToHistory(h.from, h.to);
                      navigate(`/search-results?from=${encodeURIComponent(h.from)}&to=${encodeURIComponent(h.to)}`);
                    }}
                    className="flex-1 flex items-center gap-3 min-w-0 text-left"
                  >
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#060d18' }}>
                      <Clock className="w-3 h-3" style={{ color: '#2e4a62' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-white truncate">{h.from}</p>
                      <div className="flex items-center gap-1.5">
                        <ArrowRight className="w-3 h-3" style={{ color: '#2e4a62' }} />
                        <p className="text-[11px] truncate" style={{ color: '#2e4a62' }}>{h.to}</p>
                      </div>
                    </div>
                  </button>
                  <button onClick={() => removeFromHistory(i)}
                    className="w-6 h-6 rounded-lg flex items-center justify-center"
                    style={{ color: '#1e3a55', transition: 'color .12s, background .12s' }}
                    onMouseEnter={e => { (e.currentTarget.style.color = '#ef4444'); (e.currentTarget.style.background = '#ef444415'); }}
                    onMouseLeave={e => { (e.currentTarget.style.color = '#1e3a55'); (e.currentTarget.style.background = 'transparent'); }}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Popular trips */}
      {popularTrips.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-[#f59e0b]" />
              <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#2e4a62' }}>Популярные маршруты</span>
            </div>
            <div className="flex items-center gap-1">
              <Flame className="w-3 h-3 text-orange-400" />
              <span className="text-[10px] font-bold" style={{ color: '#2e4a62' }}>Топ {popularTrips.length}</span>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            {popularTrips.map((trip, i) => (
              <PopularTripCard
                key={trip.id || i}
                trip={trip}
                index={i}
                onClick={() => navigate(`/trip/${trip.id}`)}
              />
            ))}
          </div>
        </div>
      )}

      {popularTrips.length === 0 && searchHistory.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: '#0a1826', border: '1px solid #0f2035' }}>
            <Sparkles className="w-7 h-7" style={{ color: '#1e3a55' }} />
          </div>
          <div className="text-center">
            <p className="text-[14px] font-bold text-white mb-1">Пока пусто</p>
            <p className="text-[12px]" style={{ color: '#2e4a62' }}>Активные маршруты появятся здесь</p>
          </div>
        </div>
      )}
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen text-white" style={{ background: '#0e1621', fontFamily: "'Sora', sans-serif" }}>

      {/* ── DESKTOP LAYOUT ─────────────────────────────────────────── */}
      <div className="hidden md:flex min-h-screen">

        {/* Left: Hero + Form */}
        <div className="flex flex-col w-[480px] xl:w-[520px] shrink-0 border-r" style={{ borderColor: '#0d1a28' }}>
          {/* Hero */}
          <div className="relative overflow-hidden px-8 xl:px-10 pt-14 pb-8">
            <div className="absolute inset-0 pointer-events-none">
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, #0a1f3d 0%, #0e1621 70%)' }} />
              <div style={{ position: 'absolute', top: -40, left: '30%', width: 260, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, #1a47c8 0%, transparent 70%)', opacity: 0.12 }} />
            </div>
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#1a47c8,#2f8fe0)' }}>
                  <Search className="w-3 h-3 text-white" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#2e4a62' }}>Ovora Cargo · Поиск</span>
              </div>
              <h1 className="text-[32px] xl:text-[36px] font-black leading-[1.1] mb-2">
                Найдите<br />
                <span style={{ background: 'linear-gradient(90deg, #5ba3f5, #10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  поездку или груз
                </span>
              </h1>
              <p className="text-[13px]" style={{ color: '#2e4a62' }}>Средняя Азия и за её пределами</p>
            </div>
          </div>

          {/* Form */}
          <div className="flex-1 overflow-y-auto px-8 xl:px-10 pb-10" style={{ scrollbarWidth: 'none' }}>
            {SearchForm}
          </div>
        </div>

        {/* Right: Popular + History */}
        <div className="flex-1 flex flex-col">
          {/* Right header */}
          <div className="px-8 xl:px-10 pt-14 pb-6 border-b" style={{ borderColor: '#0d1a28' }}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[20px] font-black text-white leading-tight">Маршруты</h2>
                <p className="text-[12px] mt-1" style={{ color: '#2e4a62' }}>Актуальные и популярные рейсы</p>
              </div>
              {popularTrips.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ background: '#0a1826', border: '1px solid #0f2035' }}>
                  <div className="w-2 h-2 rounded-full bg-[#22c55e]" style={{ boxShadow: '0 0 6px #22c55e' }} />
                  <span className="text-[11px] font-bold" style={{ color: '#22c55e' }}>{popularTrips.length} активных</span>
                </div>
              )}
            </div>
          </div>

          {/* Right content */}
          <div className="flex-1 overflow-y-auto px-8 xl:px-10 py-6" style={{ scrollbarWidth: 'none' }}>
            {/* Desktop grid for trips */}
            {popularTrips.length > 0 ? (
              <div>
                {searchHistory.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" style={{ color: '#2e4a62' }} />
                        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#2e4a62' }}>История</span>
                      </div>
                      <button
                        onClick={() => { localStorage.removeItem(HISTORY_KEY); setSearchHistory([]); }}
                        className="text-[11px] font-bold"
                        style={{ color: '#1e3a55', transition: 'color .12s' }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#1e3a55')}
                      >
                        Очистить
                      </button>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                      {searchHistory.map((h, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setFromCity(h.from); setToCity(h.to);
                            saveToHistory(h.from, h.to);
                            navigate(`/search-results?from=${encodeURIComponent(h.from)}&to=${encodeURIComponent(h.to)}`);
                          }}
                          className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl"
                          style={{ background: '#0a1826', border: '1px solid #0f2035', transition: 'border-color .15s' }}
                          onMouseEnter={e => (e.currentTarget.style.borderColor = '#1d4ed830')}
                          onMouseLeave={e => (e.currentTarget.style.borderColor = '#0f2035')}
                        >
                          <Clock className="w-3 h-3" style={{ color: '#2e4a62' }} />
                          <span className="text-[12px] font-bold text-white">{h.from}</span>
                          <ArrowRight className="w-3 h-3" style={{ color: '#2e4a62' }} />
                          <span className="text-[12px] font-bold text-white">{h.to}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-3.5 h-3.5 text-[#f59e0b]" />
                    <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#2e4a62' }}>Популярные маршруты</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Flame className="w-3 h-3 text-orange-400" />
                    <span className="text-[10px] font-bold" style={{ color: '#2e4a62' }}>Топ {popularTrips.length}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                  {popularTrips.map((trip, i) => (
                    <PopularTripCard key={trip.id || i} trip={trip} index={i} onClick={() => navigate(`/trip/${trip.id}`)} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-20 gap-5">
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center" style={{ background: '#0a1826', border: '1px solid #0f2035' }}>
                  <Sparkles className="w-9 h-9" style={{ color: '#1e3a55' }} />
                </div>
                <div className="text-center">
                  <p className="text-[16px] font-black text-white mb-2">Маршруты загружаются</p>
                  <p className="text-[13px]" style={{ color: '#2e4a62' }}>Активные рейсы появятся здесь автоматически</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── MOBILE LAYOUT ──────────────────────────────────────────── */}
      <div className="md:hidden pb-28">
        {/* Hero */}
        <div className="relative overflow-hidden px-4 pt-12 pb-5">
          <div className="absolute inset-0 pointer-events-none">
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, #0a1f3d 0%, #0e1621 65%)' }} />
            <div style={{ position: 'absolute', top: -40, left: '50%', transform: 'translateX(-50%)', width: 240, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, #1d4ed8 0%, transparent 70%)', opacity: 0.13 }} />
          </div>
          <motion.div className="relative" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: '#2e4a62' }}>Ovora Cargo</p>
            <h1 className="text-[26px] font-black text-white leading-tight">
              Найдите<br />
              <span style={{ background: 'linear-gradient(90deg, #5ba3f5, #10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                поездку или груз
              </span>
            </h1>
            <p className="text-[12px] mt-1.5" style={{ color: '#2e4a62' }}>Средняя Азия и за её пределами</p>
          </motion.div>
        </div>

        {/* Form + right panel stacked */}
        <div className="px-4 flex flex-col gap-4">
          {SearchForm}
          {RightPanel}
        </div>
        <div style={{ height: 8 }} />
      </div>
    </div>
  );
}