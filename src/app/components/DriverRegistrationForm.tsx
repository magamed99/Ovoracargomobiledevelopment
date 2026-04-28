import { useState, useRef } from 'react';
import { ArrowLeft, Truck, FileText, ImagePlus, X, CheckCircle2, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../contexts/UserContext';
import { toast } from 'sonner';
import { updateUser as updateUserApi, registerUser } from '../api/authApi';

const CAR_BRANDS = ['КАМАЗ', 'МАЗ', 'ГАЗ', 'Volvo', 'Scania', 'MAN', 'Mercedes', 'DAF', 'Iveco', 'Другое'];
const DOC_SLOTS = ['Паспорт', 'Техпаспорт (СТС)'];

export function DriverRegistrationForm() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { user: cachedUser, setUserDirectly } = useUser();

  const [form, setForm] = useState({ carBrand: '', carModel: '', carYear: '', plateNumber: '' });
  const [submitting, setSubmitting] = useState(false);
  const [docPhotos, setDocPhotos] = useState<(string | null)[]>([null, null]);
  const [carPhotos, setCarPhotos] = useState<string[]>([]);
  const docInputRef = useRef<HTMLInputElement>(null);
  const carInputRef = useRef<HTMLInputElement>(null);
  const activeDocSlot = useRef<number>(0);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const complete = !!(form.carBrand && form.carModel && form.carYear && form.plateNumber);

  function openDocPicker(slot: number) {
    activeDocSlot.current = slot;
    if (docInputRef.current) { docInputRef.current.value = ''; docInputRef.current.click(); }
  }

  function onDocChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    const url = URL.createObjectURL(file);
    setDocPhotos(p => {
      const n = [...p];
      if (n[activeDocSlot.current]) URL.revokeObjectURL(n[activeDocSlot.current]!);
      n[activeDocSlot.current] = url;
      return n;
    });
  }

  function onCarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    const urls = files.slice(0, 5 - carPhotos.length).map(f => URL.createObjectURL(f));
    setCarPhotos(p => [...p, ...urls].slice(0, 5));
  }

  const handleSubmit = async () => {
    if (!complete) { toast.error('Заполните все поля'); return; }
    setSubmitting(true);
    try {
      const vehicle = { brand: form.carBrand, model: form.carModel, year: form.carYear, plate: form.plateNumber.toUpperCase() };
      if (cachedUser?.email) {
        const updated = await updateUserApi({ email: cachedUser.email, firstName: cachedUser.firstName, lastName: cachedUser.lastName, phone: cachedUser.phone, vehicle });
        setUserDirectly({ ...cachedUser, ...updated });
      } else {
        const saved = await registerUser({ email: `driver_${Date.now()}@ovora.local`, role: 'driver', firstName: '', lastName: '', phone: '', vehicle });
        setUserDirectly(saved);
      }
      sessionStorage.setItem('isAuthenticated', 'true');
      sessionStorage.setItem('userRole', 'driver');
      toast.success('Регистрация завершена!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(`Ошибка: ${err}`);
    } finally {
      setSubmitting(false);
    }
  };

  const dark = isDark;

  return (
    <div className={`min-h-screen overflow-y-auto font-['Sora'] ${dark ? 'bg-[#0e1621] text-white' : 'bg-[#f5f7fa] text-[#0f172a]'}`}>

      {/* Header */}
      <header className={`sticky top-0 z-20 flex items-center gap-3 px-4 py-3 border-b backdrop-blur-md ${dark ? 'bg-[#0e1621]/95 border-[#1e2d3d]' : 'bg-white/95 border-[#e8edf2]'}`}>
        <button onClick={() => navigate(-1)} className={`w-9 h-9 rounded-xl border flex items-center justify-center cursor-pointer transition-colors ${dark ? 'border-[#1e2d3d] bg-[#0a1828] text-[#6b7f94] hover:text-white' : 'border-[#e2e8f0] bg-white text-[#8a97a8] hover:text-[#0f172a]'}`}>
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <div className="font-bold text-[15px]">Данные автомобиля</div>
          <div className={`text-[11px] ${dark ? 'text-[#4a6a8a]' : 'text-[#94a3b8]'}`}>Последний шаг регистрации</div>
        </div>
        <span className={`text-[11px] font-semibold px-3 py-1 rounded-full border ${complete ? 'text-green-400 border-green-500/30 bg-green-500/10' : dark ? 'text-[#4a6a8a] border-[#1e2d3d]' : 'text-[#94a3b8] border-[#e2e8f0]'}`}>
          {complete ? '✓ Готово' : '4 поля'}
        </span>
      </header>

      {/* Progress */}
      <div className={`h-[3px] ${dark ? 'bg-[#1e2d3d]' : 'bg-[#e8edf2]'}`}>
        <div className="h-full bg-[#1978e5] transition-all duration-500" style={{ width: complete ? '100%' : '50%' }} />
      </div>

      <div className="max-w-lg mx-auto px-4 pb-8">

        {/* User info banner */}
        {cachedUser && (
          <div className={`mt-4 flex items-center gap-3 px-4 py-3 rounded-2xl border ${dark ? 'bg-[#0a1e36] border-[#1a3560]' : 'bg-blue-50 border-blue-100'}`}>
            <CheckCircle2 className="w-5 h-5 text-[#1978e5] flex-shrink-0" />
            <div className="min-w-0">
              <div className="font-bold text-[13px]">{cachedUser.firstName} {cachedUser.lastName}</div>
              <div className={`text-[11px] truncate ${dark ? 'text-[#4a6a8a]' : 'text-[#94a3b8]'}`}>{cachedUser.email} · данные сохранены</div>
            </div>
          </div>
        )}

        {/* Hero */}
        <div className="mt-4 flex items-center gap-3 px-4 py-3.5 rounded-2xl border bg-gradient-to-br from-[#1978e5]/10 to-[#1978e5]/5 border-[#1978e5]/20">
          <div className="w-10 h-10 rounded-xl bg-[#1978e5]/20 flex items-center justify-center shrink-0">
            <Truck className="w-5 h-5 text-[#1978e5]" />
          </div>
          <div>
            <div className="font-extrabold text-[15px]">Транспортное средство</div>
            <div className={`text-[12px] ${dark ? 'text-[#4a6a8a]' : 'text-[#94a3b8]'}`}>Укажите данные вашего авто</div>
          </div>
        </div>

        {/* Car fields */}
        <div className={`mt-4 rounded-2xl border overflow-hidden ${dark ? 'bg-[#131f2e] border-[#1e2d3d]' : 'bg-white border-[#e8edf2]'}`}>
          <div className={`px-4 py-3 font-bold text-[13px] border-b ${dark ? 'border-[#1e2d3d]' : 'border-[#e8edf2]'}`}>
            Основные данные
          </div>
          {([
            { key: 'carBrand',    label: 'Марка',        placeholder: 'КАМАЗ, Volvo, MAN…', type: 'text' },
            { key: 'carModel',    label: 'Модель',       placeholder: 'Например: 65115, FH16', type: 'text' },
            { key: 'carYear',     label: 'Год выпуска',  placeholder: '2018', type: 'number' },
            { key: 'plateNumber', label: 'Госномер',     placeholder: '01 TJ 1234 AA', type: 'text' },
          ] as const).map((field, i, arr) => (
            <label key={field.key} className={`flex flex-col px-4 pt-3 pb-3 cursor-text ${i < arr.length - 1 ? `border-b ${dark ? 'border-[#1e2d3d]' : 'border-[#e8edf2]'}` : ''}`}>
              <span className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${dark ? 'text-[#3a5070]' : 'text-[#94a3b8]'}`}>{field.label}</span>
              <input
                type={field.type}
                value={form[field.key]}
                onChange={set(field.key)}
                placeholder={field.placeholder}
                className={`w-full bg-transparent border-none outline-none text-[15px] font-semibold placeholder-[#2a4060] ${dark ? 'text-white' : 'text-[#0f172a]'} ${field.key === 'plateNumber' ? 'uppercase' : ''}`}
              />
            </label>
          ))}
        </div>

        {/* Brand quick-pick */}
        <div className="mt-3">
          <div className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${dark ? 'text-[#3a5070]' : 'text-[#94a3b8]'}`}>Быстрый выбор марки</div>
          <div className="flex flex-wrap gap-2">
            {CAR_BRANDS.map(b => (
              <button key={b} type="button" onClick={() => setForm(f => ({ ...f, carBrand: b }))}
                className={`px-3 py-1.5 rounded-full text-[12px] font-semibold border transition-all cursor-pointer ${
                  form.carBrand === b
                    ? 'bg-[#1978e5]/20 border-[#1978e5] text-[#1978e5]'
                    : dark ? 'bg-transparent border-[#1e2d3d] text-[#4a6a8a] hover:border-[#1978e5]/50' : 'bg-white border-[#e2e8f0] text-[#94a3b8] hover:border-[#1978e5]/50'
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        {/* Document photos */}
        <div className={`mt-4 rounded-2xl border overflow-hidden ${dark ? 'bg-[#131f2e] border-[#1e2d3d]' : 'bg-white border-[#e8edf2]'}`}>
          <div className={`px-4 py-3 flex items-center gap-2 border-b ${dark ? 'border-[#1e2d3d]' : 'border-[#e8edf2]'}`}>
            <FileText className="w-4 h-4 text-[#4a6a8a]" />
            <span className="font-bold text-[13px]">Документы</span>
            <span className={`ml-auto text-[11px] ${dark ? 'text-[#3a5070]' : 'text-[#94a3b8]'}`}>Необязательно</span>
          </div>
          <div className="grid grid-cols-2 gap-3 p-4">
            {DOC_SLOTS.map((label, i) => (
              <button key={label} type="button" onClick={() => openDocPicker(i)}
                className={`relative h-28 rounded-xl border-2 border-dashed flex flex-col items-center justify-center overflow-hidden transition-all cursor-pointer ${
                  docPhotos[i]
                    ? 'border-[#1978e5]/40 bg-[#1978e5]/05'
                    : dark ? 'border-[#1e2d3d] hover:border-[#1978e5]/40' : 'border-[#e2e8f0] hover:border-[#1978e5]/40'
                }`}
              >
                {docPhotos[i] ? (
                  <>
                    <img src={docPhotos[i]!} alt={label} className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 bg-black/50 py-1 text-center text-[9px] text-white font-semibold">{label}</div>
                    <button type="button" onClick={e => { e.stopPropagation(); setDocPhotos(p => { const n = [...p]; if (n[i]) URL.revokeObjectURL(n[i]!); n[i] = null; return n; }); }}
                      className="absolute top-2 right-2 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </>
                ) : (
                  <>
                    <ImagePlus className={`w-5 h-5 mb-2 ${dark ? 'text-[#2a4060]' : 'text-[#94a3b8]'}`} />
                    <span className={`text-[11px] font-semibold text-center px-2 leading-tight ${dark ? 'text-[#3a5070]' : 'text-[#94a3b8]'}`}>{label}</span>
                    <span className={`text-[10px] mt-1 ${dark ? 'text-[#1e3050]' : 'text-[#b0bec5]'}`}>Нажмите</span>
                  </>
                )}
              </button>
            ))}
          </div>
          <input ref={docInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onDocChange} />
        </div>

        {/* Car photos */}
        <div className={`mt-4 rounded-2xl border overflow-hidden ${dark ? 'bg-[#131f2e] border-[#1e2d3d]' : 'bg-white border-[#e8edf2]'}`}>
          <div className={`px-4 py-3 flex items-center gap-2 border-b ${dark ? 'border-[#1e2d3d]' : 'border-[#e8edf2]'}`}>
            <ImagePlus className="w-4 h-4 text-[#4a6a8a]" />
            <span className="font-bold text-[13px]">Фото автомобиля</span>
            <span className={`ml-auto text-[11px] ${dark ? 'text-[#3a5070]' : 'text-[#94a3b8]'}`}>{carPhotos.length}/5</span>
          </div>
          {/* touch-action: pan-y ensures vertical page scroll works while horizontal scroll is active */}
          <div className="flex gap-3 p-4 overflow-x-auto" style={{ touchAction: 'pan-y' }}>
            {carPhotos.map((url, i) => (
              <div key={i} className="relative flex-shrink-0 w-[88px] h-[88px] rounded-xl overflow-hidden">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button type="button" onClick={() => { URL.revokeObjectURL(carPhotos[i]); setCarPhotos(p => p.filter((_, j) => j !== i)); }}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
            {carPhotos.length < 5 && (
              <button type="button" onClick={() => { if (carInputRef.current) { carInputRef.current.value = ''; carInputRef.current.click(); } }}
                className="flex-shrink-0 w-[88px] h-[88px] rounded-xl border-2 border-dashed border-[#1978e5]/40 bg-[#1978e5]/05 flex flex-col items-center justify-center gap-1 text-[#1978e5] cursor-pointer hover:border-[#1978e5]/70 transition-colors">
                <ImagePlus className="w-5 h-5" />
                <span className="text-[9px] font-bold uppercase tracking-wide">Добавить</span>
              </button>
            )}
          </div>
          <input ref={carInputRef} type="file" accept="image/*" multiple className="hidden" onChange={onCarChange} />
        </div>

        {/* Submit */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || !complete}
          className={`mt-6 w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-extrabold text-[15px] transition-all ${
            complete
              ? 'bg-[#1978e5] hover:bg-[#1565c0] text-white shadow-lg shadow-[#1978e5]/30 cursor-pointer'
              : dark ? 'bg-[#1e2d3d] text-[#3a5070] cursor-not-allowed' : 'bg-[#f0f4f8] text-[#94a3b8] cursor-not-allowed'
          }`}
        >
          {submitting ? 'Сохранение...' : <><span>Завершить регистрацию</span><ChevronRight className="w-5 h-5" /></>}
        </button>
        <p className={`mt-3 text-center text-[11px] ${dark ? 'text-[#2a4060]' : 'text-[#b0bec5]'}`}>
          Данные сохраняются на сервере — можно изменить в профиле
        </p>
      </div>
    </div>
  );
}
