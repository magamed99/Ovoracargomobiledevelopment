import { useState } from 'react';
import {
  ArrowLeft, Calendar, Clock, Plus, Minus,
  MapPin, Navigation, Users, Baby, Package, DollarSign,
  FileText, Zap, Truck,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { useUser } from '../contexts/UserContext';
import { toast } from 'sonner';
import { createTrip } from '../api/dataApi';
import { AddressPicker } from './AddressPicker';
import { RouteMap } from './RouteMap';

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
      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: color + '1a' }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-white leading-none">{label}</p>
        <p className="text-[10px] text-[#4a6278] mt-0.5">{sub}</p>
      </div>
      <div className="flex items-center gap-1.5">
        <button onClick={() => onChange(Math.max(min, value - 1))}
          className="w-7 h-7 rounded-lg bg-[#1a2a3a] flex items-center justify-center active:scale-90 transition-transform">
          <Minus className="w-3 h-3 text-[#4a6278]" />
        </button>
        <input
          type="text" inputMode="numeric" pattern="[0-9]*"
          value={value || ''}
          onChange={e => {
            const raw = e.target.value.replace(/[^0-9]/g, '');
            onChange(raw === '' ? 0 : Math.min(max, Number(raw)));
          }}
          className="w-10 text-center text-[16px] font-black tabular-nums bg-transparent outline-none text-white"
        />
        <button onClick={() => onChange(Math.min(max, value + 1))}
          className="w-7 h-7 rounded-lg flex items-center justify-center active:scale-90 transition-transform"
          style={{ background: color + '20' }}>
          <Plus className="w-3 h-3" style={{ color }} />
        </button>
      </div>
    </div>
  );
}

function SectionLabel({ title, icon }: { title: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-5 h-5 rounded-lg bg-[#5ba3f5]/10 flex items-center justify-center">{icon}</div>
      <p className="text-[10px] font-black uppercase tracking-widest text-[#5ba3f5]">{title}</p>
    </div>
  );
}

export function CreateAnnouncementPage() {
  const navigate = useNavigate();
  const { user } = useUser();

  const [fromAddress, setFromAddress] = useState<{ address: string; lat: number; lng: number } | null>(null);
  const [toAddress, setToAddress] = useState<{ address: string; lat: number; lng: number } | null>(null);

  const [departureDate, setDepartureDate] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [arrivalDate, setArrivalDate] = useState('');
  const [arrivalTime, setArrivalTime] = useState('');

  const [maxPassengers, setMaxPassengers] = useState(3);
  const [maxChildren, setMaxChildren] = useState(0);
  const [maxBaggage, setMaxBaggage] = useState(2);
  const [maxCargo, setMaxCargo] = useState(0);

  const [pricePerPerson, setPricePerPerson] = useState(0);
  const [pricePerKg, setPricePerKg] = useState(0);
  const [currency, setCurrency] = useState<'TJS' | 'USD' | 'RUB'>('TJS');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  const canPublish = fromAddress && toAddress && departureDate && departureTime &&
    (maxPassengers > 0 || maxCargo > 0);

  const handlePublish = async () => {
    if (!user?.email) { toast.error('Необходимо авторизоваться'); return; }
    if (!fromAddress || !toAddress) { toast.error('Укажите маршрут'); return; }
    if (!departureDate || !departureTime) { toast.error('Укажите дату и время отправления'); return; }
    if (maxPassengers === 0 && maxCargo === 0) { toast.error('Укажите хотя бы 1 пассажира или груз'); return; }

    setLoading(true);
    try {
      await createTrip({
        driverEmail: user.email,
        fromCity: fromAddress.address,
        toCity: toAddress.address,
        fromLat: fromAddress.lat,
        fromLng: fromAddress.lng,
        toLat: toAddress.lat,
        toLng: toAddress.lng,
        departureDate,
        departureTime,
        arrivalDate: arrivalDate || undefined,
        arrivalTime: arrivalTime || undefined,
        maxPassengers,
        maxChildren,
        maxBaggage,
        maxCargo,
        pricePerPerson,
        pricePerKg,
        currency,
        notes: notes.trim() || undefined,
      });
      toast.success('Объявление опубликовано!');
      navigate('/driver-trips');
    } catch (err) {
      toast.error(`Ошибка: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const formContent = (
    <>
      {/* Route */}
      <div className="mb-5">
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
            <AddressPicker value={toAddress} onChange={setToAddress} placeholder="Выберите город назначения" label="" showCurrentLocation={false} />
          </div>
        </div>
        {fromAddress && toAddress && fromAddress.lat && toAddress.lat && (
          <div className="rounded-2xl overflow-hidden border border-white/[0.07] mt-2">
            <RouteMap from={fromAddress} to={toAddress} height="160px" />
          </div>
        )}
      </div>

      {/* Date & Time */}
      <div className="mb-5">
        <SectionLabel title="Дата и Время" icon={<Calendar className="w-3 h-3 text-[#5ba3f5]" />} />
        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-2 px-4 py-3 rounded-2xl bg-[#111c28] border border-white/[0.07] cursor-pointer">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3 h-3 text-[#5ba3f5]" />
              <p className="text-[9px] font-black uppercase tracking-widest text-[#4a6278]">Дата отправления *</p>
            </div>
            <input type="date" value={departureDate} min={todayStr} onChange={e => setDepartureDate(e.target.value)}
              className="bg-transparent text-white text-[13px] font-bold outline-none w-full [color-scheme:dark]" />
          </label>
          <label className="flex flex-col gap-2 px-4 py-3 rounded-2xl bg-[#111c28] border border-white/[0.07] cursor-pointer">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-[#5ba3f5]" />
              <p className="text-[9px] font-black uppercase tracking-widest text-[#4a6278]">Время отправления *</p>
            </div>
            <input type="time" value={departureTime} onChange={e => setDepartureTime(e.target.value)}
              className="bg-transparent text-white text-[13px] font-bold outline-none w-full [color-scheme:dark]" />
          </label>
          <label className="flex flex-col gap-2 px-4 py-3 rounded-2xl bg-[#111c28] border border-white/[0.07] cursor-pointer">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3 h-3 text-emerald-400" />
              <p className="text-[9px] font-black uppercase tracking-widest text-[#4a6278]">Дата прибытия</p>
            </div>
            <input type="date" value={arrivalDate} min={todayStr} onChange={e => setArrivalDate(e.target.value)}
              className="bg-transparent text-white text-[13px] font-bold outline-none w-full [color-scheme:dark]" />
          </label>
          <label className="flex flex-col gap-2 px-4 py-3 rounded-2xl bg-[#111c28] border border-white/[0.07] cursor-pointer">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-emerald-400" />
              <p className="text-[9px] font-black uppercase tracking-widest text-[#4a6278]">Время прибытия</p>
            </div>
            <input type="time" value={arrivalTime} onChange={e => setArrivalTime(e.target.value)}
              className="bg-transparent text-white text-[13px] font-bold outline-none w-full [color-scheme:dark]" />
          </label>
        </div>
      </div>

      {/* Capacity */}
      <div className="mb-5">
        <SectionLabel title="Вместимость" icon={<Users className="w-3 h-3 text-[#5ba3f5]" />} />
        <div className="flex flex-col gap-2">
          <Counter value={maxPassengers} onChange={setMaxPassengers} min={0} max={20}
            label="Пассажиры" sub="Взрослые" icon={<Users className="w-4 h-4" />} color="#5ba3f5" />
          <Counter value={maxChildren} onChange={setMaxChildren} min={0} max={10}
            label="Дети" sub="До 12 лет" icon={<Baby className="w-4 h-4" />} color="#f59e0b" />
          <Counter value={maxBaggage} onChange={setMaxBaggage} min={0} max={50}
            label="Багаж" sub="Мест для чемоданов" icon={<Package className="w-4 h-4" />} color="#8b5cf6" />
          <Counter value={maxCargo} onChange={setMaxCargo} min={0} max={9999}
            label="Груз (кг)" sub="Макс. вес груза" icon={<Truck className="w-4 h-4" />} color="#10b981" />
        </div>
      </div>

      {/* Prices */}
      <div className="mb-5">
        <SectionLabel title="Цены" icon={<DollarSign className="w-3 h-3 text-[#5ba3f5]" />} />
        <div className="flex gap-2 mb-3">
          {(['TJS', 'USD', 'RUB'] as const).map(c => (
            <button key={c} onClick={() => setCurrency(c)}
              className={`flex-1 py-2 rounded-xl text-[12px] font-black transition-all ${
                currency === c ? 'bg-[#5ba3f5] text-white shadow-lg' : 'bg-[#111c28] text-[#4a6278] border border-white/[0.07]'
              }`}>
              {c}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-1.5 px-4 py-3 rounded-2xl bg-[#111c28] border border-white/[0.07]">
            <div className="flex items-center gap-1.5">
              <Users className="w-3 h-3 text-[#5ba3f5]" />
              <p className="text-[9px] font-black uppercase tracking-widest text-[#4a6278]">Цена за человека</p>
            </div>
            <div className="flex items-baseline gap-2">
              <input type="number" inputMode="numeric" value={pricePerPerson || ''}
                onChange={e => setPricePerPerson(Number(e.target.value))} placeholder="0"
                className="bg-transparent text-white text-[20px] font-black outline-none flex-1 placeholder-[#2a3f52]" />
              <span className="text-[13px] font-bold text-[#4a6278]">{currency}</span>
            </div>
          </div>
          <div className="flex flex-col gap-1.5 px-4 py-3 rounded-2xl bg-[#111c28] border border-white/[0.07]">
            <div className="flex items-center gap-1.5">
              <Package className="w-3 h-3 text-emerald-400" />
              <p className="text-[9px] font-black uppercase tracking-widest text-[#4a6278]">Цена за 1 кг груза</p>
            </div>
            <div className="flex items-baseline gap-2">
              <input type="number" inputMode="numeric" value={pricePerKg || ''}
                onChange={e => setPricePerKg(Number(e.target.value))} placeholder="0"
                className="bg-transparent text-white text-[20px] font-black outline-none flex-1 placeholder-[#2a3f52]" />
              <span className="text-[13px] font-bold text-[#4a6278]">{currency}</span>
            </div>
          </div>
          <div className="flex flex-col gap-1.5 px-4 py-3 rounded-2xl bg-[#111c28] border border-white/[0.07]">
            <div className="flex items-center gap-1.5">
              <FileText className="w-3 h-3 text-[#4a6278]" />
              <p className="text-[9px] font-black uppercase tracking-widest text-[#4a6278]">Примечания (необязательно)</p>
            </div>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Дополнительная информация..." rows={3}
              className="bg-transparent text-white text-[13px] font-medium outline-none w-full resize-none placeholder-[#2a3f52]" />
          </div>
        </div>
      </div>

      {/* Selected addresses summary */}
      {(fromAddress || toAddress) && (
        <div className="mb-5 px-4 py-3 rounded-2xl bg-[#111c28] border border-white/[0.07]">
          {fromAddress && (
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-[#5ba3f5] flex-shrink-0" />
              <p className="text-[11px] text-white truncate">{fromAddress.address}</p>
            </div>
          )}
          {toAddress && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
              <p className="text-[11px] text-white truncate">{toAddress.address}</p>
            </div>
          )}
        </div>
      )}
    </>
  );

  // ── Mobile ─────────────────────────────────────────────────────────────────
  const renderMobile = () => (
    <div className="flex flex-col min-h-screen bg-[#0c1520] text-white font-['Sora']">
      <div className="flex items-center justify-between px-4 py-3" style={{ paddingTop: 'max(16px, env(safe-area-inset-top))' }}>
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl bg-[#111c28] flex items-center justify-center active:scale-90"
        >
          <ArrowLeft className="w-4 h-4 text-white" />
        </button>
        <p className="text-[13px] font-black text-white">Новое объявление</p>
        <div className="w-9 h-9 rounded-xl bg-[#5ba3f5]/10 flex items-center justify-center">
          <Truck className="w-4 h-4 text-[#5ba3f5]" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-36">
        {formContent}
      </div>

      <div className="fixed bottom-0 left-0 right-0 px-4" style={{ paddingBottom: 'max(20px, env(safe-area-inset-bottom))' }}>
        <div className="bg-[#0c1520]/90 backdrop-blur-xl pt-3">
          <button
            onClick={handlePublish}
            disabled={!canPublish || loading}
            className="w-full h-14 rounded-2xl font-black text-[15px] text-white flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] disabled:opacity-40"
            style={{
              background: canPublish ? 'linear-gradient(135deg, #1d4ed8, #5ba3f5)' : '#1a2a3a',
              boxShadow: canPublish ? '0 4px 20px #1d4ed840' : 'none',
            }}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Публикуем...</span>
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                <span>Опубликовать объявление</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  // ── Desktop ────────────────────────────────────────────────────────────────
  const renderDesktop = () => (
    <div className="min-h-screen bg-[#0c1520] text-white font-['Sora'] flex flex-col">
      <div className="flex items-center justify-between px-8 py-4 border-b border-white/[0.06]">
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[#4a6278] hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-[13px] font-semibold">Назад</span>
        </button>
        <p className="text-[15px] font-black">Новое объявление</p>
        <div className="w-9 h-9 rounded-xl bg-[#5ba3f5]/10 flex items-center justify-center">
          <Truck className="w-4 h-4 text-[#5ba3f5]" />
        </div>
      </div>

      <div className="flex-1 flex gap-6 px-8 py-6 max-w-5xl mx-auto w-full">
        <div className="flex-1">
          {formContent}
          <button
            onClick={handlePublish}
            disabled={!canPublish || loading}
            className="w-full h-14 rounded-2xl font-black text-[15px] text-white flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] disabled:opacity-40 mb-8"
            style={{
              background: canPublish ? 'linear-gradient(135deg, #1d4ed8, #5ba3f5)' : '#1a2a3a',
              boxShadow: canPublish ? '0 4px 20px #1d4ed840' : 'none',
            }}
          >
            {loading ? (
              <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Публикуем...</span></>
            ) : (
              <><Zap className="w-5 h-5" /><span>Опубликовать объявление</span></>
            )}
          </button>
        </div>

        {fromAddress && toAddress && fromAddress.lat && toAddress.lat && (
          <div className="w-80 shrink-0">
            <div className="rounded-3xl overflow-hidden border border-white/[0.07] sticky top-6">
              <RouteMap from={fromAddress} to={toAddress} height="300px" />
              <div className="px-4 py-3 bg-[#111c28] border-t border-white/[0.07]">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="w-3 h-3 text-[#5ba3f5]" />
                  <p className="text-[11px] font-bold text-white truncate">{fromAddress.address}</p>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3 h-3 text-emerald-400" />
                  <p className="text-[11px] font-bold text-white truncate">{toAddress.address}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <div className="sm:hidden">{renderMobile()}</div>
      <div className="hidden sm:block">{renderDesktop()}</div>
    </>
  );
}
