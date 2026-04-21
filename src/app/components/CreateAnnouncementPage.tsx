import { useState } from 'react';
import {
  ArrowLeft, Calendar, Clock, Plus, Minus,
  MapPin, Navigation, Users, Baby, Package, DollarSign,
  FileText, Zap, CheckCircle2, Truck, ChevronRight,
  ArrowRight,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { useUser } from '../contexts/UserContext';
import { toast } from 'sonner';
import { createTrip, createCargo } from '../api/dataApi';
import { AddressPicker } from './AddressPicker';
import { RouteMap } from './RouteMap';
import { SenderCargoForm } from './SenderCargoForm';

// ─── Stepper ────────────────────────────────────────────────────
const STEPS = ['Маршрут', 'Дата', 'Вместимость', 'Цены'];

function Stepper({ current }: { current: number }) {
  return (
    <div className="flex items-center px-5 py-3">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center flex-1">
          <div className="flex flex-col items-center">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all duration-300 ${
                i < current
                  ? 'bg-[#5ba3f5] text-white'
                  : i === current
                  ? 'bg-[#5ba3f5] text-white ring-[3px] ring-[#5ba3f5]/25 scale-110'
                  : 'bg-[#1a2a3a] text-[#4a6278]'
              }`}
            >
              {i < current ? <CheckCircle2 className="w-3 h-3" /> : i + 1}
            </div>
            <span
              className={`text-[8px] font-bold mt-1 tracking-wide whitespace-nowrap ${
                i === current ? 'text-[#5ba3f5]' : i < current ? 'text-[#5ba3f5]/60' : 'text-[#4a6278]'
              }`}
            >
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className="flex-1 h-[2px] mx-1 mb-3.5 rounded-full overflow-hidden bg-[#1a2a3a]">
              <div
                className="h-full bg-[#5ba3f5] rounded-full transition-all duration-500"
                style={{ width: i < current ? '100%' : '0%' }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Counter ────────────────────────────────────────────────────
function Counter({
  value, onChange, min = 0, max = 9999, label, sub, icon, color,
}: {
  value: number; onChange: (v: number) => void;
  min?: number; max?: number;
  label: string; sub: string;
  icon: React.ReactNode; color: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#111c28] border border-white/[0.07] hover:border-white/[0.11] transition-colors">
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: color + '1a' }}
      >
        <span style={{ color }}>{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-white leading-none">{label}</p>
        <p className="text-[10px] text-[#4a6278] mt-0.5">{sub}</p>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          className="w-7 h-7 rounded-lg bg-[#1a2a3a] flex items-center justify-center active:scale-90 transition-transform"
        >
          <Minus className="w-3 h-3 text-[#4a6278]" />
        </button>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={value || ''}
          onChange={e => {
            const raw = e.target.value.replace(/[^0-9]/g, '');
            onChange(raw === '' ? 0 : Math.min(max, Number(raw)));
          }}
          className="w-10 text-center text-[16px] font-black tabular-nums bg-transparent outline-none text-white"
        />
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          className="w-7 h-7 rounded-lg flex items-center justify-center active:scale-90 transition-transform"
          style={{ background: color + '20' }}
        >
          <Plus className="w-3 h-3" style={{ color }} />
        </button>
      </div>
    </div>
  );
}

// ─── Price Input ─────────────────────────────────────────────────
function PriceInput({
  label, emoji, placeholder, value, onChange, accent, required, currency,
}: {
  label: string; emoji: string; placeholder: string;
  value: string; onChange: (v: string) => void;
  accent: string; required?: boolean; currency?: string;
}) {
  const filled = !!(value && parseFloat(value) > 0);
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all duration-200 ${
        filled ? 'bg-[#111c28] border-white/[0.13]' : 'bg-[#111c28] border-white/[0.07]'
      }`}
    >
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-base"
        style={{ background: accent + '1a' }}
      >
        {emoji}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-[#4a6278] mb-0.5">
          {label}
          {required && <span className="text-red-400 ml-0.5">*</span>}
        </p>
        <input
          type="number"
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full text-[14px] font-bold bg-transparent outline-none tabular-nums
            [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none
            [&::-webkit-outer-spin-button]:appearance-none placeholder-[#253545]"
          style={{ color: filled ? accent : '#4a6278' }}
        />
      </div>
      <span className="text-[11px] font-bold flex-shrink-0" style={{ color: filled ? accent : '#4a6278' }}>
        {currency || 'TJS'}
      </span>
    </div>
  );
}

// ─── Section label ───────────────────────────────────────────────
function SectionLabel({ title, icon }: { title: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-5 h-5 rounded-lg bg-[#5ba3f5]/15 flex items-center justify-center">
        {icon}
      </div>
      <p className="text-[9px] font-black uppercase tracking-widest text-[#5ba3f5]">{title}</p>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────
export function CreateAnnouncementPage() {
  const { user: currentUser } = useUser();
  const navigate = useNavigate();

  if (currentUser?.role === 'sender') {
    return <SenderCargoForm />;
  }

  const [fromAddress, setFromAddress] = useState<{ address: string; lat: number; lng: number } | null>(null);
  const [toAddress,   setToAddress]   = useState<{ address: string; lat: number; lng: number } | null>(null);
  const [driverDate,  setDriverDate]  = useState('');
  const [driverTime,  setDriverTime]  = useState('');
  const [seats,       setSeats]       = useState(3);
  const [children,    setChildren]    = useState(0);
  const [cargo,       setCargo]       = useState(100);
  const [pricePerSeat,  setPricePerSeat]  = useState('');
  const [pricePerChild, setPricePerChild] = useState('');
  const [pricePerKg,    setPricePerKg]    = useState('');
  const [notes,         setNotes]         = useState('');
  const [currency,      setCurrency]      = useState<'TJS' | 'USD' | 'RUB'>('TJS');
  const [publishing,    setPublishing]    = useState(false);

  // ✅ FIX S-5: минимальная дата — сегодня
  const todayStr = new Date().toISOString().split('T')[0];

  const step = (() => {
    if (!fromAddress || !toAddress) return 0;
    if (!driverDate || !driverTime) return 1;
    if (seats === 0 && cargo === 0) return 2;
    return 3;
  })();

  const isReady = !!(
    fromAddress && toAddress &&
    driverDate && driverTime &&
    pricePerSeat && parseFloat(pricePerSeat) > 0 &&
    pricePerKg   && parseFloat(pricePerKg) > 0
  );

  const handlePublish = async () => {
    if (publishing) return;
    if (!fromAddress?.lat) { toast.error('Укажите точку отправления'); return; }
    if (!toAddress?.lat)   { toast.error('Укажите точку назначения');  return; }
    if (!driverDate)       { toast.error('Укажите дату');              return; }
    if (!driverTime)       { toast.error('Укажите время');             return; }
    if (!pricePerSeat || parseFloat(pricePerSeat) <= 0) { toast.error('Укажите цену за место'); return; }
    if (!pricePerKg   || parseFloat(pricePerKg)   <= 0) { toast.error('Укажите цену за кг');    return; }

    setPublishing(true);
    try {
      await createTrip({
        from: fromAddress.address, to: toAddress.address,
        date: driverDate, time: driverTime,
        fromLat: fromAddress.lat, fromLng: fromAddress.lng,
        toLat:   toAddress.lat,   toLng:   toAddress.lng,
        availableSeats: seats, cargoCapacity: cargo,
        childSeats:     children > 0 ? children : 0,
        pricePerSeat:   parseFloat(pricePerSeat),
        pricePerKg:     parseFloat(pricePerKg),
        pricePerChild:  pricePerChild && parseFloat(pricePerChild) > 0 ? parseFloat(pricePerChild) : 0,
        fromCountry: 'Таджикистан', toCountry: 'Таджикистан',
        duration: null,
        driverEmail:    currentUser?.email || '',
        driverName:     currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Водитель',
        driverPhone:    currentUser?.phone || '',
        driverAvatar:   currentUser?.avatarUrl || null,
        driverRating:   currentUser?.rating || null,
        driverTrips:    currentUser?.totalTrips || null,
        driverVerified: currentUser?.verificationStatus === 'verified',
        notes:   notes.trim(),
        status:  'planned',
        role:    'driver',
        tripType: 'trip' as const,
        mapImage: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=400&h=400&fit=crop',
        currency,
      });
      toast.success(
        `${fromAddress.address.split(',')[0]} → ${toAddress.address.split(',')[0]} опубликовано!`,
        { description: `${driverDate} в ${driverTime} · ${seats} мест · ${pricePerSeat} ${currency}`, duration: 4000 },
      );
      setFromAddress(null); setToAddress(null);
      setDriverDate(''); setDriverTime('');
      setSeats(3); setChildren(0); setCargo(100);
      setPricePerSeat(''); setPricePerKg(''); setPricePerChild('');
      setNotes('');
      window.dispatchEvent(new Event('ovora_trip_update'));
      navigate('/trips');
    } catch (err) {
      toast.error(`Ошибка публикации: ${err}`);
    } finally {
      setPublishing(false);
    }
  };

  // ── Publish button (shared between mobile fixed & desktop sticky) ──
  const PublishBtn = (
    <button
      onClick={handlePublish}
      disabled={publishing}
      className={`w-full h-13 rounded-2xl text-white text-[14px] font-black flex items-center justify-center gap-2
        transition-all duration-200 shadow-lg ${isReady ? 'active:scale-[0.97]' : 'opacity-40 cursor-not-allowed'}`}
      style={{
        background: publishing
          ? 'linear-gradient(135deg,#1d3a60,#2a5080)'
          : isReady
          ? 'linear-gradient(135deg,#1d4ed8 0%,#5ba3f5 100%)'
          : 'linear-gradient(135deg,#1a2a3a,#213045)',
        boxShadow: isReady ? '0 8px 24px #3b82f640' : 'none',
      }}
    >
      {publishing ? (
        <>
          <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          Публикуем…
        </>
      ) : (
        <>
          <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5" strokeWidth={2.5} />
          </div>
          Опубликовать объявление
          <ChevronRight className="w-4 h-4 opacity-50" />
        </>
      )}
    </button>
  );

  return (
    <div className="font-['Sora'] bg-[#0E1621]">

      {/* ══════════════════════════════════════════════════════
          MOBILE HEADER  (hidden on md+)
      ══════════════════════════════════════════════════════ */}
      <div className="md:hidden sticky top-0 z-30 bg-[#0E1621]/95 backdrop-blur-xl border-b border-white/[0.06]">
        <div style={{ height: 'env(safe-area-inset-top, 0px)' }} />
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl bg-white/[0.06] flex items-center justify-center text-[#607080] active:scale-90 transition-all flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-[15px] font-black text-white leading-none">Новое объявление</h1>
            <p className="text-[9px] text-[#4a6278] mt-0.5">Шаг {step + 1} из {STEPS.length}</p>
          </div>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#1d4ed8,#5ba3f5)' }}>
            <Truck className="w-4 h-4 text-white" />
          </div>
        </div>
        <Stepper current={step} />
      </div>

      {/* ══════════════════════════════════════════════════════
          DESKTOP HEADER  (hidden on mobile)
      ══════════════════════════════════════════════════════ */}
      <div className="hidden md:block border-b border-white/[0.06] bg-[#0E1621]">
        <div className="max-w-5xl mx-auto px-8 py-5 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl bg-white/[0.06] flex items-center justify-center text-[#607080] hover:text-white hover:bg-white/[0.10] transition-all flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-[20px] font-black text-white leading-none">Новое объявление</h1>
            <p className="text-[11px] text-[#4a6278] mt-1">Заполните маршрут, время и цены — объявление появится сразу</p>
          </div>
          {/* Desktop step progress */}
          <div className="flex items-center gap-2">
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${
                  i === step ? 'bg-[#5ba3f5] text-white' : i < step ? 'bg-[#5ba3f5]/20 text-[#5ba3f5]' : 'bg-[#1a2a3a] text-[#4a6278]'
                }`}>
                  {i < step ? <CheckCircle2 className="w-3 h-3" /> : <span>{i + 1}</span>}
                  <span>{label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-4 h-[2px] rounded-full ${i < step ? 'bg-[#5ba3f5]/60' : 'bg-[#1a2a3a]'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          MOBILE CONTENT (single column, fixed bottom btn)
      ══════════════════════════════════════════════════════ */}
      <div className="md:hidden pb-[160px] pt-4">

        {/* Маршрут */}
        <div className="px-4 mb-5">
          <SectionLabel title="Маршрут" icon={<Navigation className="w-3 h-3 text-[#5ba3f5]" />} />
          <div className="rounded-2xl overflow-hidden border border-white/[0.07] bg-[#111c28]">
            <div className="px-4 pt-4 pb-3 border-b border-white/[0.07]">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-[#5ba3f5] ring-2 ring-[#5ba3f5]/30" />
                <p className="text-[9px] font-black uppercase tracking-widest text-[#4a6278]">Откуда</p>
              </div>
              <AddressPicker value={fromAddress} onChange={setFromAddress} placeholder="Выберите город отправления" label="" />
            </div>
            <div className="px-4 pt-3 pb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-emerald-400/30" />
                <p className="text-[9px] font-black uppercase tracking-widest text-[#4a6278]">Куда</p>
              </div>
              <AddressPicker value={toAddress} onChange={setToAddress} placeholder="Выберите город назначения" label="" />
            </div>
          </div>
          {fromAddress && toAddress && fromAddress.lat && toAddress.lat && (
            <div className="rounded-2xl overflow-hidden border border-white/[0.07] mt-2">
              <RouteMap from={fromAddress} to={toAddress} height="160px" />
            </div>
          )}
        </div>

        {/* Дата и Время */}
        <div className="px-4 mb-5">
          <SectionLabel title="Дата и Время" icon={<Calendar className="w-3 h-3 text-[#5ba3f5]" />} />
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-2 px-4 py-3 rounded-2xl bg-[#111c28] border border-white/[0.07] cursor-pointer">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-[#5ba3f5]" />
                <p className="text-[9px] font-black uppercase tracking-widest text-[#4a6278]">Дата</p>
              </div>
              {/* ✅ FIX S-5: min запрещает прошлые даты */}
              <input type="date" value={driverDate} min={todayStr} onChange={e => setDriverDate(e.target.value)}
                className="w-full text-[12px] font-bold bg-transparent outline-none text-white [color-scheme:dark]" />
            </label>
            <label className="flex flex-col gap-2 px-4 py-3 rounded-2xl bg-[#111c28] border border-white/[0.07] cursor-pointer">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-[#5ba3f5]" />
                <p className="text-[9px] font-black uppercase tracking-widest text-[#4a6278]">Время</p>
              </div>
              <input type="time" value={driverTime} onChange={e => setDriverTime(e.target.value)}
                className="w-full text-[12px] font-bold bg-transparent outline-none text-white [color-scheme:dark]" />
            </label>
          </div>
        </div>

        {/* Вместимость */}
        <div className="px-4 mb-5">
          <SectionLabel title="Вместимость" icon={<Users className="w-3 h-3 text-[#5ba3f5]" />} />
          <div className="space-y-2">
            <Counter label="Пассажиры" sub="взрослые места" icon={<Users className="w-3.5 h-3.5" />} color="#5ba3f5" value={seats} onChange={setSeats} min={1} max={20} />
            <Counter label="Дети" sub="детские места" icon={<Baby className="w-3.5 h-3.5" />} color="#34d399" value={children} onChange={setChildren} min={0} max={10} />
            <Counter label="Грузоподъём" sub="максимум кг" icon={<Package className="w-3.5 h-3.5" />} color="#f59e0b" value={cargo} onChange={setCargo} min={0} max={5000} />
          </div>
        </div>

        {/* Цены */}
        <div className="px-4 mb-5">
          <SectionLabel title="Цены и Валюта" icon={<DollarSign className="w-3 h-3 text-[#5ba3f5]" />} />
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-[#111c28] border border-white/[0.07]">
              <span className="text-[11px] font-bold text-[#4a6278] flex-shrink-0">Валюта</span>
              <div className="flex-1 flex gap-1.5 justify-end">
                {(['TJS', 'USD', 'RUB'] as const).map(cur => (
                  <button key={cur} onClick={() => setCurrency(cur)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition-all active:scale-95 ${currency === cur ? 'bg-[#5ba3f5] text-white' : 'bg-[#1a2a3a] text-[#4a6278]'}`}>{cur}</button>
                ))}
              </div>
            </div>
            <PriceInput label="Взрослое место" emoji="💺" placeholder="5 000" value={pricePerSeat} onChange={setPricePerSeat} accent="#5ba3f5" required currency={currency} />
            <PriceInput label="Детское место"  emoji="👶" placeholder="2 500" value={pricePerChild} onChange={setPricePerChild} accent="#34d399" currency={currency} />
            <PriceInput label="1 кг груза"     emoji="📦" placeholder="50"    value={pricePerKg}    onChange={setPricePerKg}    accent="#f59e0b" required currency={currency} />
          </div>
        </div>

        {/* Примечание */}
        <div className="px-4 mb-5">
          <SectionLabel title="Примечание" icon={<FileText className="w-3 h-3 text-[#5ba3f5]" />} />
          <div className="rounded-2xl bg-[#111c28] border border-white/[0.07] overflow-hidden focus-within:border-white/[0.13] transition-all">
            {/* ✅ FIX S-6: ограничение длины примечания */}
            <textarea rows={3} placeholder="Остановки, условия, требования к грузу…" value={notes} onChange={e => setNotes(e.target.value)}
              maxLength={500}
              className="w-full px-4 py-3 text-[13px] leading-relaxed bg-transparent outline-none resize-none text-white placeholder-[#253545]" />
            <p className="px-4 pb-2 text-[10px] text-[#4a6278] text-right">{notes.length}/500</p>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          DESKTOP CONTENT (two-column grid)
      ══════════════════════════════════════════════════════ */}
      <div className="hidden md:block">
        <div className="max-w-5xl mx-auto px-8 py-8">
          <div className="grid grid-cols-[1fr_340px] gap-6 items-start">

            {/* ── LEFT COLUMN: form fields ── */}
            <div className="space-y-5">

              {/* Маршрут */}
              <div className="rounded-3xl border border-white/[0.07] bg-[#111c28] overflow-hidden">
                <div className="px-5 py-3 border-b border-white/[0.06] flex items-center gap-2">
                  <Navigation className="w-3.5 h-3.5 text-[#5ba3f5]" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#5ba3f5]">Маршрут</p>
                </div>
                <div className="px-5 py-4 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-[#5ba3f5] ring-2 ring-[#5ba3f5]/30" />
                    <p className="text-[9px] font-black uppercase tracking-widest text-[#4a6278]">Откуда</p>
                  </div>
                  <AddressPicker value={fromAddress} onChange={setFromAddress} placeholder="Выберите город отправления" label="" />
                </div>
                <div className="px-5 py-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-emerald-400/30" />
                    <p className="text-[9px] font-black uppercase tracking-widest text-[#4a6278]">Куда</p>
                  </div>
                  <AddressPicker value={toAddress} onChange={setToAddress} placeholder="Выберите город назначения" label="" />
                </div>
              </div>

              {/* Дата и Время */}
              <div className="rounded-3xl border border-white/[0.07] bg-[#111c28] overflow-hidden">
                <div className="px-5 py-3 border-b border-white/[0.06] flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-[#5ba3f5]" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#5ba3f5]">Дата и Время</p>
                </div>
                <div className="px-5 py-4 grid grid-cols-2 gap-4">
                  <label className="flex flex-col gap-2 cursor-pointer">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-[#5ba3f5]" />
                      <p className="text-[9px] font-black uppercase tracking-widest text-[#4a6278]">Дата отправления</p>
                    </div>
                    {/* ✅ FIX S-5: min запрещает прошлые даты (desktop) */}
                    <input type="date" value={driverDate} min={todayStr} onChange={e => setDriverDate(e.target.value)}
                      className="text-[14px] font-bold bg-transparent outline-none text-white [color-scheme:dark] border-b border-white/[0.08] pb-1" />
                  </label>
                  <label className="flex flex-col gap-2 cursor-pointer">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-[#5ba3f5]" />
                      <p className="text-[9px] font-black uppercase tracking-widest text-[#4a6278]">Время отправления</p>
                    </div>
                    <input type="time" value={driverTime} onChange={e => setDriverTime(e.target.value)}
                      className="text-[14px] font-bold bg-transparent outline-none text-white [color-scheme:dark] border-b border-white/[0.08] pb-1" />
                  </label>
                </div>
              </div>

              {/* Вместимость */}
              <div className="rounded-3xl border border-white/[0.07] bg-[#111c28] overflow-hidden">
                <div className="px-5 py-3 border-b border-white/[0.06] flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-[#5ba3f5]" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#5ba3f5]">Вместимость</p>
                </div>
                <div className="px-5 py-4 space-y-3">
                  <Counter label="Пассажиры" sub="взрослые места" icon={<Users className="w-3.5 h-3.5" />} color="#5ba3f5" value={seats} onChange={setSeats} min={1} max={20} />
                  <Counter label="Дети" sub="детские места" icon={<Baby className="w-3.5 h-3.5" />} color="#34d399" value={children} onChange={setChildren} min={0} max={10} />
                  <Counter label="Грузоподъём" sub="максимум кг" icon={<Package className="w-3.5 h-3.5" />} color="#f59e0b" value={cargo} onChange={setCargo} min={0} max={5000} />
                </div>
              </div>

              {/* Цены */}
              <div className="rounded-3xl border border-white/[0.07] bg-[#111c28] overflow-hidden">
                <div className="px-5 py-3 border-b border-white/[0.06] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-3.5 h-3.5 text-[#5ba3f5]" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#5ba3f5]">Цены</p>
                  </div>
                  {/* Currency inline */}
                  <div className="flex gap-1.5">
                    {(['TJS', 'USD', 'RUB'] as const).map(cur => (
                      <button key={cur} onClick={() => setCurrency(cur)}
                        className={`px-3 py-1 rounded-lg text-[11px] font-black transition-all active:scale-95 ${currency === cur ? 'bg-[#5ba3f5] text-white' : 'bg-[#1a2a3a] text-[#4a6278] hover:text-white'}`}>{cur}</button>
                    ))}
                  </div>
                </div>
                <div className="px-5 py-4 grid grid-cols-3 gap-3">
                  <PriceInput label="Взрослое место" emoji="💺" placeholder="5 000" value={pricePerSeat} onChange={setPricePerSeat} accent="#5ba3f5" required currency={currency} />
                  <PriceInput label="Детское место"  emoji="👶" placeholder="2 500" value={pricePerChild} onChange={setPricePerChild} accent="#34d399" currency={currency} />
                  <PriceInput label="1 кг груза"     emoji="📦" placeholder="50"    value={pricePerKg}    onChange={setPricePerKg}    accent="#f59e0b" required currency={currency} />
                </div>
              </div>

              {/* Примечание */}
              <div className="rounded-3xl border border-white/[0.07] bg-[#111c28] overflow-hidden">
                <div className="px-5 py-3 border-b border-white/[0.06] flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-[#5ba3f5]" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#5ba3f5]">Примечание</p>
                </div>
                <div className="px-5 py-4">
                  {/* ✅ FIX S-6: ограничение длины примечания (desktop) */}
                  <textarea rows={3} placeholder="Остановки, условия, требования к грузу…" value={notes} onChange={e => setNotes(e.target.value)}
                    maxLength={500}
                    className="w-full text-[14px] leading-relaxed bg-transparent outline-none resize-none text-white placeholder-[#253545]" />
                  <p className="text-[10px] text-[#4a6278] text-right mt-1">{notes.length}/500</p>
                </div>
              </div>
            </div>

            {/* ── RIGHT COLUMN: map + preview + publish (sticky) ── */}
            <div className="sticky top-6 space-y-4">

              {/* Map preview */}
              <div className="rounded-3xl overflow-hidden border border-white/[0.07] bg-[#111c28]">
                {fromAddress && toAddress && fromAddress.lat && toAddress.lat ? (
                  <RouteMap from={fromAddress} to={toAddress} height="220px" />
                ) : (
                  <div className="h-[220px] flex flex-col items-center justify-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#1a2a3a] flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-[#4a6278]" />
                    </div>
                    <p className="text-[12px] text-[#4a6278] text-center px-6">Укажите маршрут,<br />чтобы увидеть карту</p>
                  </div>
                )}
              </div>

              {/* Route summary card */}
              {(fromAddress || toAddress || driverDate) && (
                <div className="rounded-3xl border border-[#5ba3f5]/20 overflow-hidden"
                  style={{ background: 'linear-gradient(135deg,#0d1e35 0%,#0f2548 100%)' }}>
                  <div className="px-4 py-2.5 border-b border-[#5ba3f5]/15 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#5ba3f5] animate-pulse" />
                    <p className="text-[9px] font-black uppercase tracking-widest text-[#5ba3f5]/70">Предпросмотр</p>
                  </div>
                  <div className="px-4 py-3 space-y-2.5">
                    {/* From → To */}
                    {(fromAddress || toAddress) && (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-[9px] text-[#4a6278]">Откуда</p>
                          <p className="text-[13px] font-bold text-white truncate">
                            {fromAddress ? fromAddress.address.split(',')[0] : '—'}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-[#5ba3f5] flex-shrink-0" />
                        <div className="flex-1 min-w-0 text-right">
                          <p className="text-[9px] text-[#4a6278]">Куда</p>
                          <p className="text-[13px] font-bold text-white truncate">
                            {toAddress ? toAddress.address.split(',')[0] : '—'}
                          </p>
                        </div>
                      </div>
                    )}
                    {/* Date / time */}
                    {(driverDate || driverTime) && (
                      <div className="flex gap-2">
                        {driverDate && (
                          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/[0.05] flex-1">
                            <Calendar className="w-3 h-3 text-[#5ba3f5] flex-shrink-0" />
                            <span className="text-[11px] font-semibold text-white truncate">{driverDate}</span>
                          </div>
                        )}
                        {driverTime && (
                          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/[0.05] flex-1">
                            <Clock className="w-3 h-3 text-[#5ba3f5] flex-shrink-0" />
                            <span className="text-[11px] font-semibold text-white">{driverTime}</span>
                          </div>
                        )}
                      </div>
                    )}
                    {/* Capacity chips */}
                    <div className="flex flex-wrap gap-1.5">
                      {seats > 0 && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#5ba3f5]/10 border border-[#5ba3f5]/20">
                          <Users className="w-3 h-3 text-[#5ba3f5]" />
                          <span className="text-[11px] font-bold text-white">{seats} мест</span>
                          {pricePerSeat && <span className="text-[11px] text-[#5ba3f5]">· {pricePerSeat} {currency}</span>}
                        </div>
                      )}
                      {children > 0 && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                          <Baby className="w-3 h-3 text-emerald-400" />
                          <span className="text-[11px] font-bold text-white">{children} дет.</span>
                        </div>
                      )}
                      {cargo > 0 && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                          <Package className="w-3 h-3 text-amber-400" />
                          <span className="text-[11px] font-bold text-white">{cargo} кг</span>
                          {pricePerKg && <span className="text-[11px] text-amber-400">· {pricePerKg}/кг</span>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Checklist */}
              <div className="rounded-3xl border border-white/[0.07] bg-[#111c28] px-4 py-4 space-y-2">
                <p className="text-[9px] font-black uppercase tracking-widest text-[#4a6278] mb-3">Готовность</p>
                {[
                  { label: 'Маршрут указан',    done: !!(fromAddress && toAddress) },
                  { label: 'Дата и время',       done: !!(driverDate && driverTime) },
                  { label: 'Цена за место',      done: !!(pricePerSeat && parseFloat(pricePerSeat) > 0) },
                  { label: 'Цена за кг',         done: !!(pricePerKg   && parseFloat(pricePerKg)   > 0) },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2.5">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${item.done ? 'bg-[#5ba3f5]' : 'bg-[#1a2a3a] border border-white/[0.08]'}`}>
                      {item.done && <CheckCircle2 className="w-2.5 h-2.5 text-white" />}
                    </div>
                    <span className={`text-[12px] font-semibold ${item.done ? 'text-white' : 'text-[#4a6278]'}`}>{item.label}</span>
                  </div>
                ))}
              </div>

              {/* Publish button */}
              {PublishBtn}
              {!isReady && (
                <p className="text-center text-[11px] text-[#4a6278]">Заполните все обязательные поля</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          MOBILE FIXED BOTTOM BUTTON
      ══════════════════════════════════════════════════════ */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 z-40"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div
          className="absolute inset-x-0 bottom-0 pointer-events-none"
          style={{ top: '-32px', background: 'linear-gradient(to top,#0E1621 55%,transparent)' }}
        />
        <div className="relative px-4 pb-[80px] pt-3">
          {PublishBtn}
          {!isReady && (
            <p className="text-center text-[11px] text-[#4a6278] mt-2">Заполните все обязательные поля</p>
          )}
        </div>
      </div>
    </div>
  );
}