import { useState } from 'react';
import {
  ArrowLeft, Calendar, Navigation, Package, DollarSign,
  FileText, Zap, CheckCircle2, Truck, ChevronRight,
  ArrowRight, MapPin, Weight
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { useUser } from '../contexts/UserContext';
import { toast } from 'sonner';
import { createCargo } from '../api/dataApi';
import { AddressPicker } from './AddressPicker';
import { RouteMap } from './RouteMap';

const STEPS = ['Маршрут', 'Детали', 'Бюджет'];

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

export function SenderCargoForm() {
  const { user: currentUser } = useUser();
  const navigate = useNavigate();

  const [fromAddress, setFromAddress] = useState<{ address: string; lat: number; lng: number } | null>(null);
  const [toAddress,   setToAddress]   = useState<{ address: string; lat: number; lng: number } | null>(null);
  const [cargoDate,   setCargoDate]   = useState('');
  const [weight,      setWeight]      = useState('');
  const [budget,      setBudget]      = useState('');
  const [notes,       setNotes]       = useState('');
  const [currency,    setCurrency]    = useState<'TJS' | 'USD' | 'RUB'>('TJS');
  const [publishing,  setPublishing]  = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  const step = (() => {
    if (!fromAddress || !toAddress) return 0;
    if (!cargoDate || !weight) return 1;
    return 2;
  })();

  const isReady = !!(
    fromAddress && toAddress &&
    cargoDate &&
    weight && parseFloat(weight) > 0 &&
    budget && parseFloat(budget) > 0
  );

  const handlePublish = async () => {
    if (!fromAddress?.lat) { toast.error('Укажите точку отправления'); return; }
    if (!toAddress?.lat)   { toast.error('Укажите точку назначения');  return; }
    if (!cargoDate)        { toast.error('Укажите дату');              return; }
    if (!weight || parseFloat(weight) <= 0) { toast.error('Укажите вес груза'); return; }
    if (!budget || parseFloat(budget) <= 0) { toast.error('Укажите ваш бюджет'); return; }

    setPublishing(true);
    try {
      await createCargo({
        from: fromAddress.address, to: toAddress.address,
        date: cargoDate,
        fromLat: fromAddress.lat, fromLng: fromAddress.lng,
        toLat:   toAddress.lat,   toLng:   toAddress.lng,
        cargoWeight:    parseFloat(weight),
        budget:         parseFloat(budget),
        currency,
        senderEmail:    currentUser?.email || '',
        senderName:     currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Отправитель',
        senderPhone:    currentUser?.phone || '',
        senderAvatar:   currentUser?.avatarUrl || null,
        notes:   notes.trim(),
        status:  'active',
        tripType: 'cargo',
        mapImage: 'https://images.unsplash.com/photo-1586528116311-ad8ed7c83a7f?w=400&h=400&fit=crop',
      });
      toast.success(
        `${fromAddress.address.split(',')[0]} → ${toAddress.address.split(',')[0]} опубликовано!`,
        { description: `Груз ${weight} кг · Бюджет ${budget} ${currency}`, duration: 4000 },
      );
      navigate('/trips');
    } catch (err) {
      toast.error(`Ошибка публикации: ${err}`);
    } finally {
      setPublishing(false);
    }
  };

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
          Опубликовать груз
          <ChevronRight className="w-4 h-4 opacity-50" />
        </>
      )}
    </button>
  );

  return (
    <div className="font-['Sora'] bg-[#0E1621] min-h-screen">
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
            <h1 className="text-[15px] font-black text-white leading-none">Новый груз</h1>
            <p className="text-[9px] text-[#4a6278] mt-0.5">Шаг {step + 1} из {STEPS.length}</p>
          </div>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#1d4ed8,#5ba3f5)' }}>
            <Package className="w-4 h-4 text-white" />
          </div>
        </div>
        <Stepper current={step} />
      </div>

      <div className="hidden md:block border-b border-white/[0.06] bg-[#0E1621]">
        <div className="max-w-5xl mx-auto px-8 py-5 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl bg-white/[0.06] flex items-center justify-center text-[#607080] hover:text-white hover:bg-white/[0.10] transition-all flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-[20px] font-black text-white leading-none">Новый груз</h1>
            <p className="text-[11px] text-[#4a6278] mt-1">Опубликуйте груз, чтобы водители могли предложить вам свои услуги</p>
          </div>
        </div>
      </div>

      <div className="pb-[160px] pt-4 md:max-w-5xl md:mx-auto md:px-8">
        <div className="grid md:grid-cols-[1fr_340px] gap-6">
          <div className="space-y-5 px-4 md:px-0">
            {/* Маршрут */}
            <div>
              <SectionLabel title="Маршрут" icon={<Navigation className="w-3 h-3 text-[#5ba3f5]" />} />
              <div className="rounded-3xl border border-white/[0.07] bg-[#111c28] overflow-hidden">
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
            </div>

            {/* Детали */}
            <div>
              <SectionLabel title="Детали груза" icon={<Package className="w-3 h-3 text-[#5ba3f5]" />} />
              <div className="rounded-3xl border border-white/[0.07] bg-[#111c28] overflow-hidden px-5 py-4 space-y-4">
                <label className="flex flex-col gap-2 cursor-pointer">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-[#5ba3f5]" />
                    <p className="text-[9px] font-black uppercase tracking-widest text-[#4a6278]">Дата отправки</p>
                  </div>
                  <input type="date" value={cargoDate} min={todayStr} onChange={e => setCargoDate(e.target.value)}
                    className="text-[14px] font-bold bg-transparent outline-none text-white [color-scheme:dark] border-b border-white/[0.08] pb-1" />
                </label>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-1.5">
                    <Weight className="w-3 h-3 text-[#5ba3f5]" />
                    <p className="text-[9px] font-black uppercase tracking-widest text-[#4a6278]">Примерный вес (кг)</p>
                  </div>
                  <input type="number" placeholder="Например, 50" value={weight} onChange={e => setWeight(e.target.value)}
                    className="w-full text-[14px] font-bold bg-transparent outline-none tabular-nums border-b border-white/[0.08] pb-1 text-white placeholder-[#253545]" />
                </div>
              </div>
            </div>

            {/* Бюджет */}
            <div>
              <SectionLabel title="Бюджет" icon={<DollarSign className="w-3 h-3 text-[#5ba3f5]" />} />
              <div className="rounded-3xl border border-white/[0.07] bg-[#111c28] overflow-hidden px-5 py-4 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[11px] font-bold text-[#4a6278] flex-shrink-0">Валюта</span>
                  <div className="flex-1 flex gap-1.5 justify-end">
                    {(['TJS', 'USD', 'RUB'] as const).map(cur => (
                      <button key={cur} onClick={() => setCurrency(cur)}
                        className={`px-3 py-1 rounded-lg text-[11px] font-black transition-all active:scale-95 ${currency === cur ? 'bg-[#5ba3f5] text-white' : 'bg-[#1a2a3a] text-[#4a6278]'}`}>{cur}</button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <p className="text-[9px] font-black uppercase tracking-widest text-[#4a6278]">Ваша цена за перевозку</p>
                  <div className="flex items-center gap-2 border-b border-white/[0.08] pb-1">
                    <input type="number" placeholder="Например, 100" value={budget} onChange={e => setBudget(e.target.value)}
                      className="flex-1 text-[14px] font-bold bg-transparent outline-none tabular-nums text-[#5ba3f5] placeholder-[#253545]" />
                    <span className="text-[12px] font-bold text-[#5ba3f5]">{currency}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Примечание */}
            <div>
              <SectionLabel title="Описание груза" icon={<FileText className="w-3 h-3 text-[#5ba3f5]" />} />
              <div className="rounded-3xl border border-white/[0.07] bg-[#111c28] overflow-hidden px-5 py-4">
                <textarea rows={3} placeholder="Что везете? Хрупкое, габариты и т.д." value={notes} onChange={e => setNotes(e.target.value)}
                  maxLength={500}
                  className="w-full text-[14px] leading-relaxed bg-transparent outline-none resize-none text-white placeholder-[#253545]" />
              </div>
            </div>
          </div>
          
          <div className="hidden md:block">
            <div className="sticky top-6">
               {PublishBtn}
            </div>
          </div>
        </div>
      </div>

      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-[#0E1621]/95 backdrop-blur-xl border-t border-white/[0.06] z-40 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
        {PublishBtn}
      </div>
    </div>
  );
}
