import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Route, Package as PackageIcon, ArrowRight, Sun, Moon } from 'lucide-react';
import logoImage from "figma:asset/b2c6e72cebde8e16ca8aebf9d855bf6d49ca07a7.png";
import { useTheme } from '../context/ThemeContext';

export function Welcome() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [selectedLanguage, setSelectedLanguage] = useState('ru');

  const languages = [
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'tj', name: 'Тоҷикӣ', flag: '🇹🇯' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
  ];

  const handleStart = () => {
    localStorage.setItem('language', selectedLanguage);
    navigate('/role-select');
  };

  return (
    <div
      className={`relative flex min-h-screen w-full flex-col overflow-hidden max-w-md mx-auto font-['Sora'] antialiased ${
        theme === 'dark' ? 'bg-[#111821] text-[#e7f0f3]' : 'bg-[#f6f7f8] text-[#0d181c]'
      }`}
      style={{ minHeight: 'max(884px, 100dvh)' }}
    >
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

      {/* Background image */}
      <div className="absolute top-0 left-0 w-full h-[55%] z-0">
        <div
          className={`w-full h-full bg-cover bg-center ${""}
            theme === 'dark' ? 'opacity-60' : 'opacity-40'
          }`}
          style={{
            backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuCtSPpCZ_Mkdzz18u6Ueb-P_I8WcLy266CCBEjJz8Q_Myks5VbJCOoP6YAWEVvl2piQyvtltIpgra2oc7SypF5tNWX9Lhf4NDcJ4npH_oij2xcNEtHfCncDeuDmZYg-zkvULiYaDGQZz5rkwIIHG1tGpB2uvyF6BznEtfrzcv8lP7utUhnOhI_ZMG38cGcVsETS26T8HrGlW1YQiwEHkU5eI2Ln0EgwCgqK3vpj7cxY-rGIzHl6nDxyWjui36a5rtnIY6ljtmd1vIdI')`,
            maskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
          }}
        />
        <div className={`absolute inset-0 bg-gradient-to-b ${ 
          theme === 'dark' 
            ? 'from-[#1978e5]/10 to-[#111821]' 
            : 'from-[#0d181c]/40 via-[#f6f7f8]/60 to-[#f6f7f8]'
        }`} />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col h-full grow">
        {/* Hero section */}
        <div className="flex-1 flex flex-col items-center justify-end px-6 pb-6 pt-20">
          <h1 className={`tracking-tight text-[32px] font-bold leading-tight text-center ${
            theme === 'dark' ? 'text-white' : 'text-[#0d181c] [text-shadow:0_1px_3px_rgba(255,255,255,0.8)]'
          }`}>
            Добро пожаловать в <span className="text-[#1978e5]">Ovora Cargo</span>
          </h1>

          <p className={`text-base font-medium leading-relaxed mt-3 text-center max-w-[280px] ${
            theme === 'dark' ? 'text-[#8eaeb8]' : 'text-[#0d181c] [text-shadow:0_1px_2px_rgba(255,255,255,0.7)]'
          }`}>
            Ваш надежный партнер в поездках и доставке грузов
          </p>
        </div>

        {/* Bottom panel */}
        <div className={`w-full backdrop-blur-sm rounded-t-[32px] p-6 pb-10 border-t shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] ${
          theme === 'dark'
            ? 'bg-[#1a2c33]/50 border-white/5'
            : 'bg-white/50 border-white/20'
        }`}>
          {/* Language selector */}
          <div className="mb-8">
            <p className={`text-center text-sm font-semibold mb-3 uppercase tracking-wider ${
              theme === 'dark' ? 'text-[#8eaeb8]' : 'text-[#4b879b]'
            }`}>
              Выберите язык
            </p>
            <div className={`flex p-1.5 rounded-xl gap-1 ${
              theme === 'dark' ? 'bg-[#0f191d]' : 'bg-[#e7f0f3]'
            }`}>
              {languages.map((lang) => (
                <label key={lang.code} className="flex-1 cursor-pointer group">
                  <input
                    type="radio"
                    name="language"
                    value={lang.code}
                    checked={selectedLanguage === lang.code}
                    onChange={() => setSelectedLanguage(lang.code)}
                    className="peer sr-only"
                  />
                  <div className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg transition-all duration-200 font-semibold ${
                    selectedLanguage === lang.code
                      ? theme === 'dark'
                        ? 'bg-[#253840] shadow-sm text-white'
                        : 'bg-white shadow-sm text-[#0d181c]'
                      : theme === 'dark'
                      ? 'text-[#647c85]'
                      : 'text-[#4b879b]'
                  }`}>
                    <span className="text-lg">{lang.flag}</span>
                    <span className="text-sm">{lang.name}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Features */}
          <div className="mb-8 px-2">
            <div className="flex gap-4 items-start mb-4">
              <div className="w-10 h-10 rounded-full bg-[#1978e5]/10 flex items-center justify-center shrink-0">
                <Route className="w-5 h-5 text-[#1978e5]" />
              </div>
              <div>
                <h3 className={`font-bold text-lg ${
                  theme === 'dark' ? 'text-white' : 'text-[#0d181c]'
                }`}>
                  Международные рейсы
                </h3>
                <p className={`text-sm leading-relaxed ${
                  theme === 'dark' ? 'text-[#8eaeb8]' : 'text-[#4b879b]'
                }`}>
                  Регулярные поездки между Таджикистаном и Россией.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-[#1978e5]/10 flex items-center justify-center shrink-0">
                <PackageIcon className="w-5 h-5 text-[#1978e5]" />
              </div>
              <div>
                <h3 className={`font-bold text-lg ${
                  theme === 'dark' ? 'text-white' : 'text-[#0d181c]'
                }`}>
                  Надежная доставка
                </h3>
                <p className={`text-sm leading-relaxed ${
                  theme === 'dark' ? 'text-[#8eaeb8]' : 'text-[#4b879b]'
                }`}>
                  Быстрая и безопасная перевозка ваших грузов и посылок.
                </p>
              </div>
            </div>
          </div>

          {/* Start button */}
          <button
            onClick={handleStart}
            className={`w-full relative overflow-hidden group font-bold text-lg py-4 px-6 rounded-xl shadow-lg transition-all duration-200 transform active:scale-[0.98] ${
              theme === 'dark'
                ? 'bg-black border border-white/20 hover:bg-gray-900'
                : 'bg-black hover:bg-gray-900'
            } text-white`}
          >
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" 
                 style={{
                   animation: 'shimmer 1.5s infinite',
                 }}
            />
            <span className="relative flex items-center justify-center gap-2">
              Начать
              <ArrowRight className="w-5 h-5" />
            </span>
          </button>

          <p className={`text-center text-xs mt-4 ${
            theme === 'dark' ? 'text-[#8eaeb8]' : 'text-[#8eaeb8]'
          }`}>
            Нажимая "Начать", вы принимаете условия использования
          </p>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}