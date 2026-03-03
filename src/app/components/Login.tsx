import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Phone, Lock, Sun, Moon } from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from '../context/ThemeContext';

export function Login() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendCode = async () => {
    if (phone.length < 9) {
      toast.error('Введите корректный номер телефона');
      return;
    }

    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setStep('code');
      toast.success('Код отправлен на ваш номер');
    }, 1500);
  };

  const handleVerifyCode = async () => {
    if (code.length !== 6) {
      toast.error('Введите 6-значный код');
      return;
    }

    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      localStorage.setItem('isAuthenticated', 'true');
      toast.success('Успешная авторизация!');
      navigate('/dashboard');
    }, 1500);
  };

  return (
    <div className={`relative min-h-screen max-w-md mx-auto font-['Sora'] antialiased flex flex-col items-center justify-center px-6 py-12 ${
      theme === 'dark' ? 'bg-[#111821] text-[#e7f0f3]' : 'bg-[#f6f7f8] text-[#0d181c]'
    }`}>
      {/* Theme toggle */}
      <div className="absolute top-6 right-6 z-50">
        <button
          onClick={toggleTheme}
          className={`flex items-center justify-center w-12 h-12 rounded-full backdrop-blur-md shadow-sm border transition-all hover:scale-105 active:scale-95 ${
            theme === 'dark'
              ? 'bg-[#1a2c33]/80 border-white/20 text-white'
              : 'bg-white/80 border-white/20 text-[#0d181c]'
          }`}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-6 h-6" />
          ) : (
            <Moon className="w-6 h-6" />
          )}
        </button>
      </div>

      <div className="w-full max-w-md">
        {/* Back button */}
        <button
          onClick={() => navigate('/role-select')}
          className={`mb-8 transition-colors ${
            theme === 'dark' ? 'text-[#8eaeb8] hover:text-white' : 'text-[#4b879b] hover:text-[#0d181c]'
          }`}
        >
          ← Назад
        </button>

        {/* Title */}
        <h1 className={`text-3xl md:text-4xl font-bold text-center mb-3 ${
          theme === 'dark' ? 'text-white' : 'text-[#0d181c]'
        }`}>
          Вход в аккаунт
        </h1>
        <p className={`text-center mb-12 ${
          theme === 'dark' ? 'text-[#8eaeb8]' : 'text-[#4b879b]'
        }`}>
          {step === 'phone'
            ? 'Введите номер телефона для входа'
            : 'Введите код из SMS'}
        </p>

        {/* Form */}
        <div className={`backdrop-blur-sm rounded-2xl p-6 mb-6 ${
          theme === 'dark' ? 'bg-[#1a2c33]/50' : 'bg-white/50'
        }`}>
          {step === 'phone' ? (
            <>
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-[#e7f0f3]' : 'text-[#0d181c]'
              }`}>
                Номер телефона
              </label>
              <div className="relative">
                <Phone className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                  theme === 'dark' ? 'text-[#647c85]' : 'text-[#8eaeb8]'
                }`} />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="+992 900 00 00 00"
                  className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 border-transparent focus:border-[#1978e5] outline-none transition-colors ${
                    theme === 'dark'
                      ? 'bg-[#253840] text-white placeholder-[#647c85]'
                      : 'bg-[#e7f0f3] text-[#0d181c] placeholder-[#8eaeb8]'
                  }`}
                  maxLength={12}
                />
              </div>
            </>
          ) : (
            <>
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-[#e7f0f3]' : 'text-[#0d181c]'
              }`}>
                Код подтверждения
              </label>
              <div className="relative">
                <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                  theme === 'dark' ? 'text-[#647c85]' : 'text-[#8eaeb8]'
                }`} />
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 border-transparent focus:border-[#1978e5] outline-none transition-colors text-center text-2xl tracking-widest ${
                    theme === 'dark'
                      ? 'bg-[#253840] text-white placeholder-[#647c85]'
                      : 'bg-[#e7f0f3] text-[#0d181c] placeholder-[#8eaeb8]'
                  }`}
                  maxLength={6}
                />
              </div>
              <button
                onClick={() => setStep('phone')}
                className="text-[#1978e5] hover:text-[#1565c0] text-sm mt-4"
              >
                Отправить код повторно
              </button>
            </>
          )}
        </div>

        {/* Submit button */}
        <button
          onClick={step === 'phone' ? handleSendCode : handleVerifyCode}
          disabled={loading}
          className={`w-full font-semibold py-4 px-8 rounded-xl transition-all shadow-lg ${
            loading
              ? theme === 'dark'
                ? 'bg-[#1a2c33]/30 text-[#647c85] cursor-not-allowed'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-black hover:bg-gray-900 text-white'
          }`}
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Загрузка...</span>
            </div>
          ) : step === 'phone' ? (
            'Отправить код'
          ) : (
            'Войти'
          )}
        </button>
      </div>
    </div>
  );
}