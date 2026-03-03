import { useState } from 'react';
import { ArrowLeft, Phone, Camera, Plus } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'sonner';

type RegistrationStep = 1 | 2;

export function DriverRegistrationForm() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [step, setStep] = useState<RegistrationStep>(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    carBrand: 'Toyota',
    carModel: '',
    carYear: '',
    plateNumber: '',
  });

  const nextStep = () => {
    if (step === 1) {
      if (!formData.firstName || !formData.lastName || !formData.phone) {
        toast.error('Заполните все поля');
        return;
      }
      setStep(2);
    }
  };

  const handleSubmit = () => {
    if (!formData.carBrand || !formData.carModel || !formData.carYear || !formData.plateNumber) {
      toast.error('Заполните все поля');
      return;
    }
    
    // Save registration
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('userRole', 'driver');
    toast.success('Регистрация успешно завершена!');
    navigate('/dashboard');
  };

  return (
    <div className={`min-h-screen flex flex-col font-['Sora'] ${
      theme === 'dark' ? 'bg-[#111821] text-white' : 'bg-[#f6f7f8] text-[#0d181c]'
    }`}>
      {/* Header */}
      <header className={`sticky top-0 z-10 backdrop-blur-sm border-b px-4 py-3 flex items-center justify-between ${
        theme === 'dark'
          ? 'bg-[#111821]/95 border-[#2a424a]'
          : 'bg-[#f6f7f8]/95 border-transparent'
      }`}>
        <button
          onClick={() => step === 1 ? navigate(-1) : setStep(1)}
          className={`flex items-center justify-center p-2 rounded-full transition-colors ${
            theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-black/5'
          }`}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-bold leading-tight tracking-tight flex-1 text-center pr-10">
          Регистрация водителя
        </h2>
      </header>

      <main className="flex-1 w-full max-w-md mx-auto pb-32 px-4">
        {/* Step 1: Personal Information */}
        {step === 1 && (
          <section>
            {/* Progress Bar */}
            <div className="py-6 flex flex-col items-center">
              <div className="flex w-full items-center justify-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-[#1978e5]" />
                <div className={`flex-1 h-1.5 rounded-full ${
                  theme === 'dark' ? 'bg-[#2a424a]' : 'bg-[#cfe2e8]'
                }`} />
              </div>
              <p className={`text-xs font-medium mt-2 ${
                theme === 'dark' ? 'text-[#8faab5]' : 'text-[#4b879b]'
              }`}>
                Шаг 1 из 2
              </p>
            </div>

            <div className="mb-6">
              <h1 className={`text-2xl font-bold mb-2 ${
                theme === 'dark' ? 'text-white' : 'text-[#0d181c]'
              }`}>
                Личные данные
              </h1>
              <p className={`text-sm ${
                theme === 'dark' ? 'text-[#8faab5]' : 'text-[#4b879b]'
              }`}>
                Укажите информацию, которая будет отображаться в профиле.
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${
                    theme === 'dark' ? 'text-white' : 'text-[#0d181c]'
                  }`}>
                    Имя
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className={`w-full px-4 py-3.5 rounded-lg border ${
                      theme === 'dark'
                        ? 'bg-[#1a2c32] border-[#2a424a] text-white'
                        : 'bg-white border-[#cfe2e8] text-[#0d181c]'
                    }`}
                    placeholder="Иван"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${
                    theme === 'dark' ? 'text-white' : 'text-[#0d181c]'
                  }`}>
                    Фамилия
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className={`w-full px-4 py-3.5 rounded-lg border ${
                      theme === 'dark'
                        ? 'bg-[#1a2c32] border-[#2a424a] text-white'
                        : 'bg-white border-[#cfe2e8] text-[#0d181c]'
                    }`}
                    placeholder="Иванов"
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1.5 ${
                  theme === 'dark' ? 'text-white' : 'text-[#0d181c]'
                }`}>
                  Номер телефона
                </label>
                <div className="flex">
                  <div className={`flex items-center justify-center px-3 border border-r-0 rounded-l-lg ${
                    theme === 'dark'
                      ? 'bg-[#1a2c32] border-[#2a424a] text-[#8faab5]'
                      : 'bg-white border-[#cfe2e8] text-[#4b879b]'
                  }`}>
                    <span className="text-sm font-medium">+992</span>
                  </div>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={`w-full px-4 py-3.5 rounded-r-lg border ${
                      theme === 'dark'
                        ? 'bg-[#1a2c32] border-[#2a424a] text-white'
                        : 'bg-white border-[#cfe2e8] text-[#0d181c]'
                    }`}
                    placeholder="(900) 123-45-67"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={nextStep}
                className="w-full bg-[#1978e5] hover:bg-[#1565c0] text-white font-bold py-4 rounded-lg transition-colors shadow-lg shadow-[#1978e5]/20 mt-6"
              >
                Далее
              </button>
            </div>
          </section>
        )}

        {/* Step 2: Vehicle Information */}
        {step === 2 && (
          <section>
            {/* Progress Bar */}
            <div className="py-6 flex flex-col items-center">
              <div className="flex w-full items-center justify-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-[#1978e5]" />
                <div className="flex-1 h-1.5 rounded-full bg-[#1978e5]" />
              </div>
              <p className={`text-xs font-medium mt-2 ${
                theme === 'dark' ? 'text-[#8faab5]' : 'text-[#4b879b]'
              }`}>
                Шаг 2 из 2
              </p>
            </div>

            <div className="mb-6">
              <h1 className={`text-2xl font-bold mb-2 ${
                theme === 'dark' ? 'text-white' : 'text-[#0d181c]'
              }`}>
                Данные автомобиля
              </h1>
              <p className={`text-sm ${
                theme === 'dark' ? 'text-[#8faab5]' : 'text-[#4b879b]'
              }`}>
                Информация о транспортном средстве для грузоперевозок.
              </p>
            </div>

            <div className="space-y-5">
              {/* Car Brand */}
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${
                  theme === 'dark' ? 'text-white' : 'text-[#0d181c]'
                }`}>
                  Марка автомобиля
                </label>
                <input
                  type="text"
                  value={formData.carBrand}
                  onChange={(e) => setFormData({ ...formData, carBrand: e.target.value })}
                  className={`w-full px-4 py-3.5 rounded-lg border appearance-none outline-none focus:border-[#1978e5] focus:ring-1 focus:ring-[#1978e5] transition-all ${
                    theme === 'dark'
                      ? 'bg-[#1a2c32] border-[#2a424a] text-white'
                      : 'bg-white border-[#cfe2e8] text-[#0d181c]'
                  }`}
                  placeholder="Введите марку автомобиля"
                />
              </div>

              {/* Model & Year */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${
                    theme === 'dark' ? 'text-white' : 'text-[#0d181c]'
                  }`}>
                    Модель
                  </label>
                  <input
                    type="text"
                    value={formData.carModel}
                    onChange={(e) => setFormData({ ...formData, carModel: e.target.value })}
                    className={`w-full px-4 py-3.5 rounded-lg border outline-none focus:border-[#1978e5] focus:ring-1 focus:ring-[#1978e5] transition-all ${
                      theme === 'dark'
                        ? 'bg-[#1a2c32] border-[#2a424a] text-white'
                        : 'bg-white border-[#cfe2e8] text-[#0d181c]'
                    }`}
                    placeholder="Camry"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${
                    theme === 'dark' ? 'text-white' : 'text-[#0d181c]'
                  }`}>
                    Год выпуска
                  </label>
                  <input
                    type="number"
                    value={formData.carYear}
                    onChange={(e) => setFormData({ ...formData, carYear: e.target.value })}
                    className={`w-full px-4 py-3.5 rounded-lg border outline-none focus:border-[#1978e5] focus:ring-1 focus:ring-[#1978e5] transition-all ${
                      theme === 'dark'
                        ? 'bg-[#1a2c32] border-[#2a424a] text-white'
                        : 'bg-white border-[#cfe2e8] text-[#0d181c]'
                    }`}
                    placeholder="2020"
                  />
                </div>
              </div>

              {/* Plate Number */}
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${
                  theme === 'dark' ? 'text-white' : 'text-[#0d181c]'
                }`}>
                  Госномер
                </label>
                <input
                  type="text"
                  value={formData.plateNumber}
                  onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value.toUpperCase() })}
                  className={`w-full px-4 py-3.5 rounded-lg border uppercase outline-none focus:border-[#1978e5] focus:ring-1 focus:ring-[#1978e5] transition-all ${
                    theme === 'dark'
                      ? 'bg-[#1a2c32] border-[#2a424a] text-white'
                      : 'bg-white border-[#cfe2e8] text-[#0d181c]'
                  }`}
                  placeholder="01 TJ 1234"
                />
              </div>

              {/* Document Photos */}
              <div className="pt-2">
                <label className={`block text-sm font-medium mb-3 ${
                  theme === 'dark' ? 'text-white' : 'text-[#0d181c]'
                }`}>
                  Фотографии документов
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    className={`flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-xl transition-all group ${
                      theme === 'dark'
                        ? 'bg-[#1a2c32]/50 border-[#2a424a] hover:bg-[#1a2c32] hover:border-[#1978e5]/60'
                        : 'bg-white/50 border-[#cfe2e8] hover:bg-white hover:border-[#1978e5]/60'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full shadow-sm flex items-center justify-center mb-2 group-hover:scale-110 transition-transform ${
                      theme === 'dark' ? 'bg-[#1a2c32]' : 'bg-white'
                    }`}>
                      <Camera className="w-5 h-5 text-[#1978e5]" />
                    </div>
                    <span className={`text-xs font-medium text-center leading-tight ${
                      theme === 'dark' ? 'text-[#8faab5]' : 'text-[#4b879b]'
                    }`}>
                      Паспорт<br />(Лицевая сторона)
                    </span>
                  </button>
                  <button
                    type="button"
                    className={`flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-xl transition-all group ${
                      theme === 'dark'
                        ? 'bg-[#1a2c32]/50 border-[#2a424a] hover:bg-[#1a2c32] hover:border-[#1978e5]/60'
                        : 'bg-white/50 border-[#cfe2e8] hover:bg-white hover:border-[#1978e5]/60'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full shadow-sm flex items-center justify-center mb-2 group-hover:scale-110 transition-transform ${
                      theme === 'dark' ? 'bg-[#1a2c32]' : 'bg-white'
                    }`}>
                      <Camera className="w-5 h-5 text-[#1978e5]" />
                    </div>
                    <span className={`text-xs font-medium text-center leading-tight ${
                      theme === 'dark' ? 'text-[#8faab5]' : 'text-[#4b879b]'
                    }`}>
                      СТС<br />(Техпаспорт)
                    </span>
                  </button>
                </div>
              </div>

              {/* Car Photos */}
              <div className="pt-2">
                <div className="flex justify-between items-end mb-3">
                  <label className={`block text-sm font-medium ${
                    theme === 'dark' ? 'text-white' : 'text-[#0d181c]'
                  }`}>
                    Фото автомобиля
                  </label>
                  <span className={`text-xs ${
                    theme === 'dark' ? 'text-[#8faab5]' : 'text-[#4b879b]'
                  }`}>
                    Макс. 5 фото
                  </span>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4">
                  <button
                    type="button"
                    className="flex-shrink-0 w-24 h-24 border-2 border-dashed border-[#1978e5]/40 rounded-xl bg-[#1978e5]/5 flex flex-col items-center justify-center hover:bg-[#1978e5]/10 transition-colors group"
                  >
                    <Plus className="w-6 h-6 text-[#1978e5] mb-1 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-bold text-[#1978e5] uppercase tracking-wide">
                      Добавить
                    </span>
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                className="w-full bg-[#1978e5] hover:bg-[#1565c0] text-white font-bold py-4 rounded-lg transition-colors shadow-lg shadow-[#1978e5]/20 mt-6"
              >
                Завершить регистрацию
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}