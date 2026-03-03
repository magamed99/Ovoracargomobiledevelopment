import { useState } from 'react';
import { ArrowLeft, Mail, RefreshCw } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'sonner';

export function EmailAuth() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role') as 'driver' | 'sender' || 'sender';
  
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(['', '', '', '']);
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [loading, setLoading] = useState(false);

  const handleCodeInput = (index: number, value: string) => {
    if (value.length <= 1) {
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);
      
      // Auto focus next input
      if (value && index < 3) {
        const nextInput = document.getElementById(`code-${index + 1}`);
        nextInput?.focus();
      }
    }
  };

  const handleSendCode = async () => {
    if (!email || !email.includes('@')) {
      toast.error('Введите корректный email адрес');
      return;
    }

    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setStep('code');
      toast.success('Код отправлен на ваш email');
    }, 1500);
  };

  const handleVerifyCode = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 4) {
      toast.error('Введите 4-значный код');
      return;
    }

    setLoading(true);
    // Simulate API call to check if email exists
    setTimeout(() => {
      setLoading(false);
      
      // Simulate checking if user exists
      const isExistingUser = Math.random() > 0.7; // 30% chance existing user
      
      if (isExistingUser) {
        // User exists - redirect to dashboard
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userRole', role);
        toast.success('Добро пожаловать!');
        navigate('/dashboard');
      } else {
        // New user - go to registration form
        toast.success('Email подтвержден! Завершите регистрацию');
        if (role === 'driver') {
          navigate('/driver-registration-form');
        } else {
          navigate('/sender-registration-form');
        }
      }
    }, 1500);
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
          onClick={() => navigate('/role-select')}
          className={`flex items-center justify-center p-2 rounded-full transition-colors ${
            theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-black/5'
          }`}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-bold leading-tight tracking-tight flex-1 text-center pr-10">
          {role === 'driver' ? 'Регистрация водителя' : 'Регистрация отправителя'}
        </h2>
      </header>

      <main className="flex-1 w-full max-w-md mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className={`text-2xl font-bold mb-2 ${
            theme === 'dark' ? 'text-white' : 'text-[#0d181c]'
          }`}>
            {step === 'email' ? 'Вход или регистрация' : 'Подтверждение email'}
          </h1>
          <p className={`text-sm ${
            theme === 'dark' ? 'text-[#8faab5]' : 'text-[#4b879b]'
          }`}>
            {step === 'email'
              ? 'Введите email для входа или регистрации'
              : 'Введите код подтверждения из письма'}
          </p>
        </div>

        {step === 'email' ? (
          <form onSubmit={(e) => { e.preventDefault(); handleSendCode(); }} className="space-y-6">
            {/* Email Field */}
            <div className="group">
              <label className={`block text-sm font-medium mb-1.5 ${
                theme === 'dark' ? 'text-white' : 'text-[#0d181c]'
              }`}>
                Email адрес
              </label>
              <div className="relative">
                <span className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${
                  theme === 'dark' ? 'text-[#8faab5]' : 'text-[#4b879b]'
                }`}>
                  <Mail className="w-5 h-5" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3.5 rounded-lg border focus:ring-2 focus:ring-[#1978e5]/20 focus:border-[#1978e5] outline-none transition-all ${
                    theme === 'dark'
                      ? 'bg-[#1a2c32] border-[#2a424a] text-white placeholder:text-[#8faab5]/50'
                      : 'bg-white border-[#cfe2e8] text-[#0d181c] placeholder:text-[#4b879b]/50'
                  }`}
                  placeholder={role === 'driver' ? 'driver@ovora.com' : 'sender@ovora.com'}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1978e5] hover:bg-[#1565c0] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-lg transition-colors shadow-lg shadow-[#1978e5]/20"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Отправка...</span>
                </div>
              ) : (
                'Отправить код'
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); handleVerifyCode(); }} className="space-y-6">
            {/* Code Verification */}
            <div>
              <label className={`block text-sm font-medium mb-3 ${
                theme === 'dark' ? 'text-white' : 'text-[#0d181c]'
              }`}>
                Код подтверждения
              </label>
              <div className="flex gap-3 justify-between">
                {[0, 1, 2, 3].map((index) => (
                  <input
                    key={index}
                    id={`code-${index}`}
                    type="text"
                    maxLength={1}
                    value={code[index]}
                    onChange={(e) => handleCodeInput(index, e.target.value)}
                    className={`w-16 h-16 text-center text-2xl font-bold rounded-lg border ${
                      theme === 'dark'
                        ? 'bg-[#1a2c32] border-[#2a424a] text-white'
                        : 'bg-white border-[#cfe2e8] text-[#0d181c]'
                    }`}
                    placeholder="•"
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => setStep('email')}
                className="mt-4 text-sm font-medium text-[#1978e5] hover:text-[#1978e5]/80 transition-colors flex items-center gap-1"
              >
                <RefreshCw className="w-4 h-4" />
                Отправить код повторно
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1978e5] hover:bg-[#1565c0] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-lg transition-colors shadow-lg shadow-[#1978e5]/20"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Проверка...</span>
                </div>
              ) : (
                'Подтвердить'
              )}
            </button>
          </form>
        )}

        {/* Info Box */}
        <div className={`mt-8 p-4 rounded-lg border ${
          theme === 'dark'
            ? 'bg-[#1a2c32]/50 border-[#2a424a]'
            : 'bg-white/50 border-[#cfe2e8]'
        }`}>
          <p className={`text-xs ${
            theme === 'dark' ? 'text-[#8faab5]' : 'text-[#4b879b]'
          }`}>
            {step === 'email' ? (
              <>
                Если у вас уже есть аккаунт, мы автоматически выполним вход.
                Для новых пользователей мы создадим аккаунт.
              </>
            ) : (
              <>
                Код отправлен на <strong className={theme === 'dark' ? 'text-white' : 'text-[#0d181c]'}>{email}</strong>. 
                Проверьте папку "Спам", если письмо не пришло.
              </>
            )}
          </p>
        </div>
      </main>
    </div>
  );
}
