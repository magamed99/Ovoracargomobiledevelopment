import { useState } from 'react';
import { ArrowLeft, User, Badge, Phone, Camera, Edit } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'sonner';

export function SenderRegistrationForm() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName || !formData.lastName || !formData.phone) {
      toast.error('Заполните все поля');
      return;
    }

    // Save registration
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('userRole', 'sender');
    toast.success('Регистрация успешно завершена!');
    navigate('/dashboard');
  };

  return (
    <div className={`relative flex min-h-screen w-full flex-col overflow-hidden max-w-md mx-auto shadow-2xl font-['Sora'] ${
      theme === 'dark' ? 'bg-[#111821] text-white' : 'bg-[#f6f7f8] text-[#0d181c]'
    }`}>
      {/* Header */}
      <div className={`flex items-center px-4 py-4 justify-between sticky top-0 z-10 ${
        theme === 'dark' ? 'bg-[#111821]' : 'bg-[#f6f7f8]'
      }`}>
        <button
          onClick={() => navigate(-1)}
          className={`flex size-10 items-center justify-center rounded-full transition-colors ${
            theme === 'dark'
              ? 'text-white hover:bg-white/10'
              : 'text-[#0d181c] hover:bg-black/5'
          }`}
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-lg font-bold leading-tight tracking-tight flex-1 text-center pr-10">
          Регистрация отправителя
        </h2>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col px-6 pb-36 overflow-y-auto">
        {/* Title */}
        <div className="mt-2 mb-6">
          <h1 className={`text-2xl font-bold leading-tight mb-2 ${
            theme === 'dark' ? 'text-white' : 'text-[#0d181c]'
          }`}>
            Завершите регистрацию
          </h1>
          <p className={`text-sm leading-normal ${
            theme === 'dark' ? 'text-[#94a3b8]' : 'text-[#4b879b]'
          }`}>
            Укажите информацию о себе для использования сервиса Ovora Cargo.
          </p>
        </div>

        {/* Profile Photo Upload */}
        <div className="flex justify-center mb-8">
          <div className="relative group cursor-pointer">
            <div className={`size-24 rounded-full border-2 border-dashed flex items-center justify-center overflow-hidden shadow-sm ${
              theme === 'dark'
                ? 'bg-[#1a2c33] border-[#2a4049]'
                : 'bg-white border-[#cfe2e8]'
            }`}>
              <Camera className={`w-10 h-10 transition-colors ${
                theme === 'dark'
                  ? 'text-[#1978e5]/40 group-hover:text-[#1978e5]'
                  : 'text-[#1978e5]/40 group-hover:text-[#1978e5]'
              }`} />
            </div>
            <div className={`absolute bottom-0 right-0 bg-[#1978e5] text-white rounded-full p-1.5 shadow-lg border-2 flex items-center justify-center ${
              theme === 'dark' ? 'border-[#111821]' : 'border-[#f6f7f8]'
            }`}>
              <Edit className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* First Name */}
          <div className="flex flex-col gap-1.5">
            <label className={`text-sm font-medium ml-1 ${
              theme === 'dark' ? 'text-gray-200' : 'text-[#0d181c]'
            }`}>
              Имя
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className={`w-full rounded-xl border py-3.5 pl-11 pr-4 text-base outline-none transition-all focus:border-[#1978e5] focus:ring-1 focus:ring-[#1978e5] ${
                  theme === 'dark'
                    ? 'bg-[#1a2c33] border-[#2a4049] text-white placeholder:text-[#4b879b]/60'
                    : 'bg-white border-[#cfe2e8] text-[#0d181c] placeholder:text-[#4b879b]/60'
                }`}
                placeholder="Ваше имя"
                required
              />
              <User className={`absolute left-3.5 w-5 h-5 ${
                theme === 'dark' ? 'text-[#4b879b]' : 'text-[#4b879b]'
              }`} />
            </div>
          </div>

          {/* Last Name */}
          <div className="flex flex-col gap-1.5">
            <label className={`text-sm font-medium ml-1 ${
              theme === 'dark' ? 'text-gray-200' : 'text-[#0d181c]'
            }`}>
              Фамилия
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className={`w-full rounded-xl border py-3.5 pl-11 pr-4 text-base outline-none transition-all focus:border-[#1978e5] focus:ring-1 focus:ring-[#1978e5] ${
                  theme === 'dark'
                    ? 'bg-[#1a2c33] border-[#2a4049] text-white placeholder:text-[#4b879b]/60'
                    : 'bg-white border-[#cfe2e8] text-[#0d181c] placeholder:text-[#4b879b]/60'
                }`}
                placeholder="Ваша фамилия"
                required
              />
              <Badge className={`absolute left-3.5 w-5 h-5 ${
                theme === 'dark' ? 'text-[#4b879b]' : 'text-[#4b879b]'
              }`} />
            </div>
          </div>

          {/* Phone */}
          <div className="flex flex-col gap-1.5">
            <label className={`text-sm font-medium ml-1 ${
              theme === 'dark' ? 'text-gray-200' : 'text-[#0d181c]'
            }`}>
              Телефон
            </label>
            <div className="flex gap-3">
              <div className={`flex items-center gap-2 px-4 rounded-xl border ${
                theme === 'dark'
                  ? 'bg-[#1a2c33] border-[#2a4049]'
                  : 'bg-white border-[#cfe2e8]'
              }`}>
                <span className={`font-medium ${
                  theme === 'dark' ? 'text-[#4b879b]' : 'text-[#4b879b]'
                }`}>
                  +992
                </span>
              </div>
              <div className="relative flex-1 flex items-center">
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={`w-full rounded-xl border py-3.5 pl-11 pr-4 text-base outline-none transition-all focus:border-[#1978e5] focus:ring-1 focus:ring-[#1978e5] ${
                    theme === 'dark'
                      ? 'bg-[#1a2c33] border-[#2a4049] text-white placeholder:text-[#4b879b]/60'
                      : 'bg-white border-[#cfe2e8] text-[#0d181c] placeholder:text-[#4b879b]/60'
                  }`}
                  placeholder="(900) 123-456"
                  required
                />
                <Phone className={`absolute left-3.5 w-5 h-5 ${
                  theme === 'dark' ? 'text-[#4b879b]' : 'text-[#4b879b]'
                }`} />
              </div>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className="flex items-start gap-3 pt-2">
            <input
              type="checkbox"
              id="terms"
              className="mt-1 w-4 h-4 rounded border-[#1978e5] text-[#1978e5] focus:ring-[#1978e5]"
              required
            />
            <label
              htmlFor="terms"
              className={`text-sm leading-relaxed ${
                theme === 'dark' ? 'text-[#94a3b8]' : 'text-[#4b879b]'
              }`}
            >
              Я согласен с{' '}
              <a href="#" className="text-[#1978e5] hover:underline">
                условиями использования
              </a>{' '}
              и{' '}
              <a href="#" className="text-[#1978e5] hover:underline">
                политикой конфиденциальности
              </a>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-[#1978e5] hover:bg-[#1565c0] text-white font-bold py-4 rounded-xl transition-colors shadow-lg shadow-[#1978e5]/20 mt-2"
          >
            Завершить регистрацию
          </button>
        </form>
      </div>
    </div>
  );
}
