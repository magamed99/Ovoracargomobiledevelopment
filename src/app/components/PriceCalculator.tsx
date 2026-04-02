import { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft, Calculator, Truck, Package, ChevronRight,
  MapPin, Weight, Ruler, Banknote, Info, RefreshCw,
  TrendingUp, TrendingDown, Minus, ArrowLeftRight,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { useTheme } from '../context/ThemeContext';
import { searchCities, City } from '../data/cities';
import { getTrips } from '../api/dataApi';
import { toast } from 'sonner';

// Base price matrix (TJS per km per ton) — fallback if no trips in DB
const BASE_RATE = 12; // TJS/km/ton
const CITY_COORDS: Record<string, { lat: number; lng: number; region: string }> = {
  'Душанбе':       { lat: 38.56, lng: 68.77, region: 'Центр' },
  'Худжанд':       { lat: 40.28, lng: 69.62, region: 'Север' },
  'Куляб':         { lat: 37.91, lng: 69.78, region: 'Юг' },
  'Хорог':         { lat: 37.49, lng: 71.55, region: 'ГБАО' },
  'Курган-Тюбе':   { lat: 37.84, lng: 68.78, region: 'Юг' },
  'Истаравшан':    { lat: 39.91, lng: 69.00, region: 'Центр' },
  'Пенджикент':    { lat: 39.49, lng: 67.61, region: 'Запад' },
  'Вахдат':        { lat: 38.56, lng: 69.01, region: 'Центр' },
  'Нурек':         { lat: 38.38, lng: 69.32, region: 'Центр' },
  'Турсунзаде':    { lat: 38.51, lng: 68.23, region: 'Запад' },
  'Москва':        { lat: 55.75, lng: 37.62, region: 'Россия' },
  'Санкт-Петербург': { lat: 59.93, lng: 30.32, region: 'Россия' },
  'Алматы':        { lat: 43.24, lng: 76.89, region: 'Казахстан' },
  'Ташкент':       { lat: 41.30, lng: 69.24, region: 'Узбекистан' },
};

function distKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLon = (b.lng - a.lng) * Math.PI / 180;
  const x = Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

const CARGO_TYPES = [
  { id: 'general',    label: 'Генеральный груз', emoji: '📦', coef: 1.0 },
  { id: 'food',       label: 'Продукты питания', emoji: '🥗', coef: 1.1 },
  { id: 'electronics',label: 'Электроника',      emoji: '💻', coef: 1.25 },
  { id: 'fragile',    label: 'Хрупкий груз',     emoji: '🏺', coef: 1.35 },
  { id: 'hazardous',  label: 'Опасный груз',     emoji: '⚠️', coef: 1.6 },
  { id: 'oversized',  label: 'Негабаритный',     emoji: '🏗️', coef: 1.5 },
];

const CURRENCIES = ['TJS', 'RUB', 'USD'] as const;
const FX: Record<string, number> = { TJS: 1, RUB: 10.5, USD: 0.092 };

export function PriceCalculator() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [fromCity, setFromCity] = useState('');
  const [toCity, setToCity] = useState('');
  const [weight, setWeight] = useState('');
  const [volume, setVolume] = useState('');
  const [cargoType, setCargoType] = useState('general');
  const [currency, setCurrency] = useState<'TJS' | 'RUB' | 'USD'>('TJS');
  const [showFromDrop, setShowFromDrop] = useState(false);
  const [showToDrop, setShowToDrop] = useState(false);
  const [fromSuggestions, setFromSuggestions] = useState<City[]>([]);
  const [toSuggestions, setToSuggestions] = useState<City[]>([]);
  const [dbTrips, setDbTrips] = useState<any[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(false);
  const [calculated, setCalculated] = useState(false);

  // Load DB trips for market price reference
  useEffect(() => {
    setLoadingTrips(true);
    getTrips().then(trips => setDbTrips(trips)).catch(() => {}).finally(() => setLoadingTrips(false));
  }, []);

  const handleFromInput = (val: string) => {
    setFromCity(val);
    setFromSuggestions(searchCities(val).slice(0, 5));
    setShowFromDrop(val.length > 0);
  };

  const handleToInput = (val: string) => {
    setToCity(val);
    setToSuggestions(searchCities(val).slice(0, 5));
    setShowToDrop(val.length > 0);
  };

  const swapCities = () => {
    setFromCity(toCity);
    setToCity(fromCity);
  };

  // ── Calculation ────────────────────────────────────────────────────────────
  const result = useMemo(() => {
    if (!fromCity || !toCity || !weight) return null;

    const from = CITY_COORDS[fromCity];
    const to = CITY_COORDS[toCity];
    const kg = parseFloat(weight) || 0;
    const m3 = parseFloat(volume) || 0;
    const selectedCargo = CARGO_TYPES.find(c => c.id === cargoType) || CARGO_TYPES[0];

    if (!from || !to || kg <= 0) return null;

    // Effective weight: max of actual weight and volumetric weight (1m³ = 333kg)
    const volumetricKg = m3 * 333;
    const effectiveKg = Math.max(kg, volumetricKg);
    const tons = effectiveKg / 1000;

    const distanceKm = distKm(from, to);

    // Base price
    let basePrice = distanceKm * tons * BASE_RATE * selectedCargo.coef;
    // Minimum 200 TJS
    basePrice = Math.max(basePrice, 200);

    // Market price from DB trips on this route
    const routeTrips = dbTrips.filter(t =>
      t.from?.toLowerCase().includes(fromCity.toLowerCase().slice(0, 4)) &&
      t.to?.toLowerCase().includes(toCity.toLowerCase().slice(0, 4)) &&
      t.pricePerKg
    );
    const marketPricePerKg = routeTrips.length > 0
      ? routeTrips.reduce((s, t) => s + t.pricePerKg, 0) / routeTrips.length
      : null;
    const marketTotal = marketPricePerKg ? marketPricePerKg * kg : null;

    // Convert
    const rate = FX[currency];
    const convert = (v: number) => (v / rate);

    return {
      distanceKm: Math.round(distanceKm),
      effectiveKg: Math.round(effectiveKg),
      tons: tons.toFixed(2),
      baseMin: convert(basePrice * 0.85),
      baseMax: convert(basePrice * 1.15),
      base: convert(basePrice),
      marketTotal: marketTotal ? convert(marketTotal) : null,
      marketTripsCount: routeTrips.length,
      pricePerKg: convert(basePrice / kg),
      coef: selectedCargo.coef,
    };
  }, [fromCity, toCity, weight, volume, cargoType, currency, dbTrips]);

  const bg = 'bg-[#0E1621]';
  const card = isDark ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-black/[0.02] border-black/[0.06]';
  const txt = isDark ? 'text-white' : 'text-[#0f172a]';
  const sub = isDark ? 'text-[#64748b]' : 'text-slate-500';
  const inputCls = `w-full px-4 py-3 border text-[14px] outline-none focus:border-[#1978e5] transition-colors font-medium ${
    isDark ? 'bg-transparent border-white/[0.1] text-white placeholder-[#475569]' : 'bg-transparent border-black/[0.1] text-[#0f172a] placeholder-slate-400'
  }`;

  const fmt = (n: number) => n.toLocaleString('ru-RU', { maximumFractionDigits: 0 });

  return (
    <div className={`min-h-screen flex flex-col font-['Sora'] ${bg} ${txt} md:max-w-2xl md:mx-auto`}>
      {/* Header */}
      <header className={`sticky top-0 z-20 flex items-center gap-3 px-4 py-3 border-b backdrop-blur-xl ${
        'bg-[#0E1621]/95 border-white/[0.06]'
      }`}>
        <button
          onClick={() => navigate(-1)}
          className={`w-9 h-9 flex items-center justify-center active:scale-90 ${isDark ? 'text-white' : 'text-[#0f172a]'}`}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-[#1978e5]" />
          <h1 className={`text-[18px] font-bold ${txt}`}>Калькулятор стоимости</h1>
        </div>
      </header>

      <div className="flex-1 pb-28">

        {/* Route */}
        <div className={`px-4 py-3 border-b ${isDark ? 'border-white/[0.06]' : 'border-black/[0.06]'}`}>
          <p className={`text-[11px] font-bold uppercase tracking-widest mb-3 ${sub}`}>Маршрут</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 flex flex-col gap-2">
              {/* From */}
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <div className="w-2 h-2 rounded-full bg-[#1978e5]" />
                </div>
                <input
                  className={`${inputCls} pl-8`}
                  placeholder="Откуда"
                  value={fromCity}
                  onChange={e => handleFromInput(e.target.value)}
                  onFocus={() => fromCity && setShowFromDrop(true)}
                  onBlur={() => setTimeout(() => setShowFromDrop(false), 150)}
                />
                {showFromDrop && fromSuggestions.length > 0 && (
                  <div className="absolute top-full mt-1 w-full border z-30 overflow-hidden shadow-xl bg-[#0E1621] border-white/[0.08]">
                    {fromSuggestions.map(c => (
                      <button key={c.name} onClick={() => { setFromCity(c.name); setShowFromDrop(false); }}
                        className={`w-full text-left px-4 py-2.5 text-[14px] border-b last:border-b-0 ${isDark ? 'border-white/[0.06] text-white hover:bg-white/[0.03]' : 'border-black/[0.06] text-[#0f172a] hover:bg-black/[0.02]'}`}>
                        <span className="font-semibold">{c.name}</span>
                        <span className={`text-[12px] ml-1 ${sub}`}>{c.country}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* To */}
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
                <input
                  className={`${inputCls} pl-8`}
                  placeholder="Куда"
                  value={toCity}
                  onChange={e => handleToInput(e.target.value)}
                  onFocus={() => toCity && setShowToDrop(true)}
                  onBlur={() => setTimeout(() => setShowToDrop(false), 150)}
                />
                {showToDrop && toSuggestions.length > 0 && (
                  <div className="absolute top-full mt-1 w-full border z-30 overflow-hidden shadow-xl bg-[#0E1621] border-white/[0.08]">
                    {toSuggestions.map(c => (
                      <button key={c.name} onClick={() => { setToCity(c.name); setShowToDrop(false); }}
                        className={`w-full text-left px-4 py-2.5 text-[14px] border-b last:border-b-0 ${isDark ? 'border-white/[0.06] text-white hover:bg-white/[0.03]' : 'border-black/[0.06] text-[#0f172a] hover:bg-black/[0.02]'}`}>
                        <span className="font-semibold">{c.name}</span>
                        <span className={`text-[12px] ml-1 ${sub}`}>{c.country}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Swap */}
            <button
              onClick={swapCities}
              className={`w-9 h-9 flex-shrink-0 flex items-center justify-center transition-all active:scale-90 ${
                isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ArrowLeftRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Cargo parameters */}
        <div className={`px-4 py-3 border-b ${isDark ? 'border-white/[0.06]' : 'border-black/[0.06]'}`}>
          <p className={`text-[11px] font-bold uppercase tracking-widest mb-3 ${sub}`}>Параметры груза</p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className={`text-[11px] font-bold mb-1.5 block ${sub}`}>Масса (кг) *</label>
              <div className="relative">
                <Weight className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${sub}`} />
                <input type="number" className={`${inputCls} pl-9`} placeholder="850" value={weight} onChange={e => setWeight(e.target.value)} />
              </div>
            </div>
            <div>
              <label className={`text-[11px] font-bold mb-1.5 block ${sub}`}>Объём (м³)</label>
              <div className="relative">
                <Ruler className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${sub}`} />
                <input type="number" className={`${inputCls} pl-9`} placeholder="необязательно" value={volume} onChange={e => setVolume(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Cargo type */}
          <label className={`text-[11px] font-bold mb-2 block ${sub}`}>Тип груза</label>
          <div className="grid grid-cols-2 gap-2">
            {CARGO_TYPES.map(ct => (
              <button
                key={ct.id}
                onClick={() => setCargoType(ct.id)}
                className={`flex items-center gap-2 px-3 py-2.5 border transition-all text-left ${
                  cargoType === ct.id
                    ? 'border-[#1978e5] bg-[#1978e5]/10'
                    : isDark ? 'border-white/[0.08] hover:border-white/[0.15]' : 'border-black/[0.08] hover:border-black/[0.15]'
                }`}
              >
                <span className="text-lg">{ct.emoji}</span>
                <div>
                  <p className={`text-[12px] font-semibold leading-tight ${cargoType === ct.id ? 'text-[#1978e5]' : txt}`}>{ct.label}</p>
                  <p className={`text-[10px] ${sub}`}>×{ct.coef}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Currency */}
        <div className={`px-4 py-3 border-b ${isDark ? 'border-white/[0.06]' : 'border-black/[0.06]'}`}>
          <p className={`text-[11px] font-bold uppercase tracking-widest mb-3 ${sub}`}>Валюта результата</p>
          <div className="flex gap-2">
            {CURRENCIES.map(c => (
              <button
                key={c}
                onClick={() => setCurrency(c)}
                className={`flex-1 h-10 font-bold text-[13px] border transition-all ${
                  currency === c
                    ? 'border-[#1978e5] bg-[#1978e5] text-white'
                    : isDark ? 'border-white/[0.1] text-slate-400' : 'border-black/[0.1] text-slate-500'
                }`}
              >
                {c === 'TJS' ? '🇹🇯 TJS' : c === 'RUB' ? '🇷🇺 RUB' : '🇺🇸 USD'}
              </button>
            ))}
          </div>
        </div>

        {/* Result */}
        <div className="px-4 py-4">
          {result ? (
            <div className="flex flex-col gap-3">
              {/* Route stats */}
              <div className="flex gap-3">
                <div className={`flex-1 border p-3 ${isDark ? 'border-white/[0.06]' : 'border-black/[0.06]'}`}>
                  <p className={`text-[11px] ${sub}`}>Расстояние</p>
                  <p className={`text-[18px] font-extrabold ${txt}`}>{result.distanceKm.toLocaleString()} <span className="text-[13px] font-normal">км</span></p>
                </div>
                <div className={`flex-1 border p-3 ${isDark ? 'border-white/[0.06]' : 'border-black/[0.06]'}`}>
                  <p className={`text-[11px] ${sub}`}>Расч. масса</p>
                  <p className={`text-[18px] font-extrabold ${txt}`}>{result.effectiveKg.toLocaleString()} <span className="text-[13px] font-normal">кг</span></p>
                </div>
              </div>

              {/* Main price */}
              <div className={`border p-4 ${isDark ? 'border-[#1978e5]/30 bg-[#1978e5]/5' : 'border-[#1978e5]/20 bg-[#1978e5]/5'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Calculator className="w-4 h-4 text-[#1978e5]" />
                  <p className="text-[13px] font-semibold text-[#1978e5]">Расчётная стоимость</p>
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className={`text-[28px] font-extrabold ${txt}`}>{fmt(result.baseMin)}</span>
                  <span className={`text-[18px] ${sub}`}>—</span>
                  <span className={`text-[28px] font-extrabold ${txt}`}>{fmt(result.baseMax)}</span>
                  <span className={`text-[14px] ${sub}`}>{currency}</span>
                </div>
                <p className={`text-[11px] ${sub}`}>≈ {result.pricePerKg.toFixed(2)} {currency}/кг · Тип: {CARGO_TYPES.find(c => c.id === cargoType)?.label} (×{result.coef})</p>
              </div>

              {/* Market price */}
              {result.marketTotal && result.marketTripsCount > 0 ? (
                <div className={`border p-3 ${isDark ? 'border-white/[0.06]' : 'border-black/[0.06]'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    <p className={`text-[13px] font-bold ${txt}`}>Рыночная цена</p>
                    <span className={`ml-auto text-[11px] font-semibold text-emerald-500`}>{result.marketTripsCount} рейса</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[22px] font-extrabold text-emerald-500">{fmt(result.marketTotal)}</span>
                    <span className={`text-[13px] ${sub}`}>{currency}</span>
                  </div>
                  <p className={`text-[11px] ${sub}`}>Средняя цена водителей на этом маршруте</p>
                </div>
              ) : (
                <div className={`flex items-start gap-2.5 border p-3 ${isDark ? 'border-white/[0.06]' : 'border-black/[0.06]'}`}>
                  <Info className={`w-4 h-4 mt-0.5 shrink-0 ${sub}`} />
                  <p className={`text-[12px] ${sub}`}>Нет данных о рыночных ценах на этом маршруте</p>
                </div>
              )}

              {/* CTA */}
              <button
                onClick={() => navigate(`/search-results?from=${encodeURIComponent(fromCity)}&to=${encodeURIComponent(toCity)}`)}
                className="w-full h-12 bg-[#1978e5] hover:bg-[#1565c0] text-white font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <Truck className="w-4 h-4" />
                Найти водителей на маршруте
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className={`border p-6 flex flex-col items-center gap-3 text-center ${isDark ? 'border-white/[0.06]' : 'border-black/[0.06]'}`}>
              <Calculator className={`w-10 h-10 ${sub}`} strokeWidth={1.5} />
              <div>
                <p className={`font-bold text-[14px] mb-1 ${txt}`}>Заполните форму выше</p>
                <p className={`text-[12px] ${sub}`}>Укажите маршрут и массу груза — получите расчёт стоимости и сравнение с рыночными ценами</p>
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div className={`flex items-start gap-2.5 mt-3 border p-3 ${isDark ? 'border-white/[0.06]' : 'border-black/[0.06]'}`}>
            <Info className={`w-4 h-4 mt-0.5 shrink-0 ${sub}`} />
            <p className={`text-[12px] leading-relaxed ${sub}`}>
              Расчёт является ориентировочным. Окончательная цена согласовывается с водителем.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}