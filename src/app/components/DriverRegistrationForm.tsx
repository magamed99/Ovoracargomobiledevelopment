import { useState } from 'react';
import { ArrowLeft, Camera, Plus } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../contexts/UserContext';
import { toast } from 'sonner';
import { updateUser as updateUserApi } from '../api/authApi';

export function DriverRegistrationForm() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { user: cachedUser, setUserDirectly } = useUser();

  const [formData, setFormData] = useState({
    carBrand: '',
    carModel: '',
    carYear: '',
    plateNumber: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const bg  = isDark ? 'bg-[#0e1621]' : 'bg-white';
  const txt = isDark ? 'text-white'   : 'text-[#0f172a]';
  const sub = isDark ? 'text-[#6b7f94]' : 'text-[#94a3b8]';
  const div = isDark ? 'border-[#1e2d3d]' : 'border-[#f0f2f5]';
  const hdr = isDark ? 'bg-[#0e1621]/95 border-[#1e2d3d]' : 'bg-white/95 border-[#e8eaed]';

  const inputCls = `w-full bg-transparent outline-none text-[15px] font-medium py-3 border-b transition-colors focus:border-b-[#1978e5] ${
    isDark ? `text-white placeholder-[#3d5263] border-b-[#1e2d3d]` : `text-[#0f172a] placeholder-[#94a3b8] border-b-[#f0f2f5]`
  }`;

  const handleSubmit = async () => {
    if (!formData.carBrand || !formData.carModel || !formData.carYear || !formData.plateNumber) {
      toast.error('Заполните все поля');
      return;
    }
    setSubmitting(true);
    try {
      const vehicle = {
        brand: formData.carBrand,
        model: formData.carModel,
        year: formData.carYear,
        plate: formData.plateNumber,
      };

      if (cachedUser?.email) {
        const updatedUser = await updateUserApi({
          email: cachedUser.email,
          firstName: cachedUser.firstName,
          lastName: cachedUser.lastName,
          phone: cachedUser.phone,
          vehicle,
        });
        setUserDirectly({ ...cachedUser, ...updatedUser });
      }

      sessionStorage.setItem('isAuthenticated', 'true');
      sessionStorage.setItem('userRole', 'driver');
      setSubmitting(false);
      toast.success('Регистрация успешно завершена!');
      navigate('/dashboard');
    } catch (err) {
      setSubmitting(false);
      console.error('Driver registration error:', err);
      toast.error(`Ошибка: ${err}`);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col font-['Sora'] ${bg} ${txt}`}>

      {/* Header */}
      <header className={`sticky top-0 z-10 backdrop-blur-md px-4 py-3 flex items-center gap-3 border-b ${hdr}`}>
        <button
          onClick={() => navigate(-1)}
          className={`w-8 h-8 flex items-center justify-center transition-colors ${
            isDark ? 'text-[#8a9bb0] hover:text-white' : 'text-[#6b7280] hover:text-[#0f172a]'
          }`}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-[16px] font-bold flex-1">Регистрация водителя</h2>
      </header>

      {/* Progress bar (full) */}
      <div className="h-[2px] bg-[#1978e5]" />

      <main className="flex-1 w-full max-w-md mx-auto pb-32">

        {/* User banner */}
        {cachedUser && (
          <div className={`px-4 py-3 border-b border-l-2 border-l-blue-400 ${div} flex items-center gap-3`}>
            <div className="flex-1 min-w-0">
              <p className={`text-[12px] font-semibold ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>Личные данные сохранены</p>
              <p className={`text-[11px] truncate ${sub}`}>{cachedUser.firstName} {cachedUser.lastName} · {cachedUser.email}</p>
            </div>
          </div>
        )}

        <div className={`px-4 py-4 border-b ${div}`}>
          <h1 className={`text-[20px] font-bold mb-1 ${txt}`}>Данные автомобиля</h1>
          <p className={`text-[13px] ${sub}`}>Информация о транспортном средстве для грузоперевозок.</p>
        </div>

        {/* Car Brand */}
        <div className={`px-4 py-2 border-b ${div}`}>
          <label className={`text-[10px] font-semibold uppercase tracking-wider ${sub}`}>Марка автомобиля</label>
          <input
            type="text"
            value={formData.carBrand}
            onChange={(e) => setFormData({ ...formData, carBrand: e.target.value })}
            className={inputCls}
            placeholder="Toyota"
          />
        </div>

        {/* Model */}
        <div className={`px-4 py-2 border-b ${div}`}>
          <label className={`text-[10px] font-semibold uppercase tracking-wider ${sub}`}>Модель</label>
          <input
            type="text"
            value={formData.carModel}
            onChange={(e) => setFormData({ ...formData, carModel: e.target.value })}
            className={inputCls}
            placeholder="Camry"
          />
        </div>

        {/* Year */}
        <div className={`px-4 py-2 border-b ${div}`}>
          <label className={`text-[10px] font-semibold uppercase tracking-wider ${sub}`}>Год выпуска</label>
          <input
            type="number"
            value={formData.carYear}
            onChange={(e) => setFormData({ ...formData, carYear: e.target.value })}
            className={inputCls}
            placeholder="2020"
          />
        </div>

        {/* Plate */}
        <div className={`px-4 py-2 border-b ${div}`}>
          <label className={`text-[10px] font-semibold uppercase tracking-wider ${sub}`}>Госномер</label>
          <input
            type="text"
            value={formData.plateNumber}
            onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value.toUpperCase() })}
            className={`${inputCls} uppercase`}
            placeholder="01 TJ 1234"
          />
        </div>

        {/* Document Photos */}
        <div className={`px-4 py-4 border-b ${div}`}>
          <p className={`text-[10px] font-semibold uppercase tracking-wider mb-3 ${sub}`}>Фотографии документов</p>
          <div className="grid grid-cols-2 gap-3">
            {['Паспорт\n(Лицевая сторона)', 'СТС\n(Техпаспорт)'].map(label => (
              <button
                key={label}
                type="button"
                className={`flex flex-col items-center justify-center h-28 border-2 border-dashed transition-all ${
                  isDark
                    ? 'border-[#1e2d3d] hover:border-[#1978e5]/50'
                    : 'border-[#e2e8f0] hover:border-[#1978e5]/50'
                }`}
              >
                <Camera className={`w-5 h-5 mb-2 ${isDark ? 'text-[#3d5263]' : 'text-[#94a3b8]'}`} />
                <span className={`text-[11px] font-medium text-center leading-tight whitespace-pre-line ${sub}`}>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Car Photos */}
        <div className={`px-4 py-4 border-b ${div}`}>
          <div className="flex justify-between items-center mb-3">
            <p className={`text-[10px] font-semibold uppercase tracking-wider ${sub}`}>Фото автомобиля</p>
            <span className={`text-[10px] ${sub}`}>Макс. 5 фото</span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            <button
              type="button"
              className={`flex-shrink-0 border-2 border-dashed flex flex-col items-center justify-center transition-colors ${
                isDark ? 'border-[#1978e5]/30 text-[#1978e5]' : 'border-[#1978e5]/30 text-[#1978e5]'
              }`}
              style={{ width: 88, height: 88 }}
            >
              <Plus className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-bold uppercase tracking-wide">Добавить</span>
            </button>
          </div>
        </div>

        <div className="px-4 pt-6">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-[#1978e5] hover:bg-[#1565c0] disabled:opacity-70 text-white font-bold py-3.5 text-[15px] transition-colors"
          >
            {submitting ? 'Загрузка...' : 'Завершить регистрацию'}
          </button>
        </div>
      </main>
    </div>
  );
}
