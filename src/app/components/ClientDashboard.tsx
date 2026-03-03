import { Search, Plus, UserSearch, MapPin, Star, Users as UsersIcon, Bell, Calendar, Truck } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useTheme } from '../context/ThemeContext';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { BottomNav } from './BottomNav';
import { useState, useEffect, useRef } from 'react';
import { searchCities, City } from '../data/cities';

export function Home() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const userRole = localStorage.getItem('userRole') || 'sender';
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  
  // Search form state
  const [fromCity, setFromCity] = useState('');
  const [toCity, setToCity] = useState('');
  const [date, setDate] = useState('');

  // Autocomplete state
  const [fromSuggestions, setFromSuggestions] = useState<City[]>([]);
  const [toSuggestions, setToSuggestions] = useState<City[]>([]);
  const [showFromDropdown, setShowFromDropdown] = useState(false);
  const [showToDropdown, setShowToDropdown] = useState(false);
  
  const fromInputRef = useRef<HTMLDivElement>(null);
  const toInputRef = useRef<HTMLDivElement>(null);

  // Swap cities function
  const swapCities = () => {
    const temp = fromCity;
    setFromCity(toCity);
    setToCity(temp);
  };

  // Handle city input change
  const handleFromCityChange = (value: string) => {
    setFromCity(value);
    if (value.length > 0) {
      const suggestions = searchCities(value);
      setFromSuggestions(suggestions);
      setShowFromDropdown(suggestions.length > 0);
    } else {
      setFromSuggestions([]);
      setShowFromDropdown(false);
    }
  };

  const handleToCityChange = (value: string) => {
    setToCity(value);
    if (value.length > 0) {
      const suggestions = searchCities(value);
      setToSuggestions(suggestions);
      setShowToDropdown(suggestions.length > 0);
    } else {
      setToSuggestions([]);
      setShowToDropdown(false);
    }
  };

  // Select city from dropdown
  const selectFromCity = (city: City) => {
    setFromCity(city.name);
    setShowFromDropdown(false);
    setFromSuggestions([]);
  };

  const selectToCity = (city: City) => {
    setToCity(city.name);
    setShowToDropdown(false);
    setToSuggestions([]);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fromInputRef.current && !fromInputRef.current.contains(event.target as Node)) {
        setShowFromDropdown(false);
      }
      if (toInputRef.current && !toInputRef.current.contains(event.target as Node)) {
        setShowToDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Advertisement data (managed by admin in the future)
  const advertisements = [
    {
      id: 1,
      image: 'https://images.unsplash.com/photo-1760035434884-f77dc4ce45af?w=600&h=200&fit=crop',
      emoji: '🚚',
      badge: 'Специальное предложение',
      title: 'Грузоперевозки\nот 500₽/км',
      description: 'Надежно • Быстро • Выгодно',
      url: 'https://example.com/cargo',
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1628695333027-df075f487dff?w=600&h=200&fit=crop',
      emoji: '✈️',
      badge: 'Новое направление',
      title: 'Авиабилеты\nсо скидкой 25%',
      description: 'Лучшие цены • Без комиссий',
      url: 'https://example.com/flights',
    },
    {
      id: 3,
      image: 'https://images.unsplash.com/photo-1637052885415-ccda7cbaf7d9?w=600&h=200&fit=crop',
      emoji: '🛡️',
      badge: 'Безопасность',
      title: 'Страхование грузов\nот 99₽',
      description: 'Полная защита • 24/7',
      url: 'https://example.com/insurance',
    },
    {
      id: 4,
      image: 'https://images.unsplash.com/photo-1745847768380-2caeadbb3b71?w=600&h=200&fit=crop',
      emoji: '🤝',
      badge: 'Партнерство',
      title: 'Станьте водителем\nOvora Cargo',
      description: 'Высокие доходы • Свободный график',
      url: 'https://example.com/driver',
    },
    {
      id: 5,
      image: 'https://images.unsplash.com/photo-1614020661483-d2bb855eee1d?w=600&h=200&fit=crop',
      emoji: '📱',
      badge: 'Технология',
      title: 'Скачайте приложение\nи получите бонус',
      description: '500₽ на первую поездку',
      url: 'https://example.com/app',
    },
  ];

  // Auto-rotate ads every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentAdIndex((prev) => (prev + 1) % advertisements.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [advertisements.length]);

  // Handle touch swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 75) {
      // Swipe left - next ad
      setCurrentAdIndex((prev) => (prev + 1) % advertisements.length);
    }

    if (touchStart - touchEnd < -75) {
      // Swipe right - previous ad
      setCurrentAdIndex((prev) => (prev - 1 + advertisements.length) % advertisements.length);
    }
  };

  const currentAd = advertisements[currentAdIndex];

  const popularTrips = [
    {
      id: 1,
      driver: {
        name: 'Фарход М.',
        rating: 4.9,
        trips: 124,
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
        verified: true,
      },
      from: 'Душанбе',
      fromCountry: 'Таджикистан',
      to: 'Москва',
      toCountry: 'Россия',
      time: '14:00',
      date: '15 Окт',
      duration: '~3 дн.',
      seats: 3,
      price: '5 000 ₽',
    },
    {
      id: 2,
      driver: {
        name: 'Рустам С.',
        rating: 4.7,
        trips: 42,
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
        verified: false,
      },
      from: 'Худжанд',
      fromCountry: 'Таджикистан',
      to: 'Санкт-Петербург',
      toCountry: 'Россия',
      time: '09:30',
      date: '16 Окт',
      duration: '~4 дн.',
      cargo: 'Груз до 5т',
      price: '8 500 ₽',
    },
  ];

  return (
    <div className={`min-h-screen flex flex-col overflow-x-hidden antialiased font-['Sora'] ${
      theme === 'dark' ? 'bg-[#111821] text-white' : 'bg-[#f6f7f8] text-[#0f172a]'
    }`}>
      {/* Header */}
      <header className={`sticky top-0 z-20 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b transition-colors ${
        theme === 'dark' 
          ? 'bg-[#111821]/90 border-transparent' 
          : 'bg-[#f6f7f8]/90 border-transparent'
      }`}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="size-10 rounded-full bg-cover bg-center border-2 shadow-sm" 
              style={{
                backgroundImage: "url('https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop')",
                borderColor: theme === 'dark' ? '#334155' : '#ffffff'
              }}
            />
            <div className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full border-2"
              style={{ borderColor: theme === 'dark' ? '#111821' : '#ffffff' }}
            />
          </div>
          <div className="flex flex-col">
            <span className={`text-xs font-medium ${
              theme === 'dark' ? 'text-[#64748b]' : 'text-[#64748b]'
            }`}>
              Добрый день,
            </span>
            <h1 className={`text-lg font-bold leading-tight ${
              theme === 'dark' ? 'text-white' : 'text-[#0f172a]'
            }`}>
              Александр!
            </h1>
          </div>
        </div>
        <button 
          onClick={() => navigate('/notifications')}
          className={`relative size-10 flex items-center justify-center rounded-full shadow-sm transition-colors ${
            theme === 'dark' 
              ? 'bg-[#1a2c32] text-[#cbd5e1] hover:bg-[#253840]' 
              : 'bg-white text-[#475569] hover:bg-[#f1f5f9]'
          }`}
        >
          <Bell className="w-6 h-6" />
          <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full" />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col gap-6 px-4 pt-4 pb-24">
        {/* Search Card */}
        <section className={`rounded-2xl p-6 shadow-lg border ${
          theme === 'dark'
            ? 'bg-gradient-to-br from-[#1a2c32] to-[#152228] border-[#253840]'
            : 'bg-gradient-to-br from-white to-[#f8fafc] border-[#e2e8f0]'
        }`}>
          <div className="flex flex-col gap-4">
            {/* From */}
            <div className="relative" ref={fromInputRef}>
              <div className={`group flex items-center rounded-xl px-4 py-4 transition-all duration-300 hover:shadow-md ${
                theme === 'dark' 
                  ? 'bg-[#253840] hover:bg-[#2d4450]' 
                  : 'bg-[#f1f5f9] hover:bg-white'
              }`}>
                <div className="p-2 rounded-lg bg-[#1978e5]/10 mr-3">
                  <MapPin className="text-[#1978e5] w-5 h-5" />
                </div>
                <div className="flex-1 flex flex-col">
                  <label className="text-[10px] uppercase font-bold text-[#64748b] tracking-wider mb-1">
                    Откуда
                  </label>
                  <input 
                    className={`bg-transparent border-none p-0 placeholder:text-[#94a3b8] font-semibold focus:ring-0 text-base focus:outline-none ${
                      theme === 'dark' ? 'text-white' : 'text-[#0f172a]'
                    }`}
                    placeholder="Душанбе"
                    type="text"
                    value={fromCity}
                    onChange={(e) => handleFromCityChange(e.target.value)}
                  />
                </div>
              </div>
              {showFromDropdown && fromSuggestions.length > 0 && (
                <div className={`absolute top-full left-0 right-0 mt-1 max-h-60 overflow-y-auto shadow-xl rounded-xl border z-20 ${
                  theme === 'dark' ? 'bg-[#1a2c32] border-[#253840]' : 'bg-white border-[#e2e8f0]'
                }`}>
                  {fromSuggestions.map((city, index) => (
                    <div
                      key={`${city.name}-${index}`}
                      className={`px-4 py-3 cursor-pointer flex items-center justify-between transition-colors ${
                        theme === 'dark' 
                          ? 'hover:bg-[#253840] text-white' 
                          : 'hover:bg-[#f1f5f9] text-[#0f172a]'
                      } ${index !== fromSuggestions.length - 1 ? (theme === 'dark' ? 'border-b border-[#253840]' : 'border-b border-[#e2e8f0]') : ''}`}
                      onClick={() => selectFromCity(city)}
                    >
                      <span className="font-semibold">{city.name}</span>
                      <span className={`text-xs ${
                        theme === 'dark' ? 'text-[#64748b]' : 'text-[#64748b]'
                      }`}>{city.country}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Swap button */}
            <div className="relative h-0">
              <div className="absolute inset-0 flex items-center justify-center -top-4 z-10">
                <button className={`size-10 rounded-full border-2 shadow-lg flex items-center justify-center text-[#1978e5] hover:scale-110 hover:rotate-180 transition-all duration-300 ${
                  theme === 'dark' 
                    ? 'bg-[#1a2c32] border-[#1978e5]/30 hover:border-[#1978e5]' 
                    : 'bg-white border-[#1978e5]/20 hover:border-[#1978e5]'
                }`} onClick={swapCities}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </button>
              </div>
            </div>

            {/* To */}
            <div className="relative" ref={toInputRef}>
              <div className={`group flex items-center rounded-xl px-4 py-4 transition-all duration-300 hover:shadow-md ${
                theme === 'dark' 
                  ? 'bg-[#253840] hover:bg-[#2d4450]' 
                  : 'bg-[#f1f5f9] hover:bg-white'
              }`}>
                <div className="p-2 rounded-lg bg-red-500/10 mr-3">
                  <MapPin className="text-red-500 w-5 h-5" />
                </div>
                <div className="flex-1 flex flex-col">
                  <label className="text-[10px] uppercase font-bold text-[#64748b] tracking-wider mb-1">
                    Куда
                  </label>
                  <input 
                    className={`bg-transparent border-none p-0 placeholder:text-[#94a3b8] font-semibold focus:ring-0 text-base focus:outline-none ${
                      theme === 'dark' ? 'text-white' : 'text-[#0f172a]'
                    }`}
                    placeholder="Москва"
                    type="text"
                    value={toCity}
                    onChange={(e) => handleToCityChange(e.target.value)}
                  />
                </div>
              </div>
              {showToDropdown && toSuggestions.length > 0 && (
                <div className={`absolute top-full left-0 right-0 mt-1 max-h-60 overflow-y-auto shadow-xl rounded-xl border z-20 ${
                  theme === 'dark' ? 'bg-[#1a2c32] border-[#253840]' : 'bg-white border-[#e2e8f0]'
                }`}>
                  {toSuggestions.map((city, index) => (
                    <div
                      key={`${city.name}-${index}`}
                      className={`px-4 py-3 cursor-pointer flex items-center justify-between transition-colors ${
                        theme === 'dark' 
                          ? 'hover:bg-[#253840] text-white' 
                          : 'hover:bg-[#f1f5f9] text-[#0f172a]'
                      } ${index !== toSuggestions.length - 1 ? (theme === 'dark' ? 'border-b border-[#253840]' : 'border-b border-[#e2e8f0]') : ''}`}
                      onClick={() => selectToCity(city)}
                    >
                      <span className="font-semibold">{city.name}</span>
                      <span className={`text-xs ${
                        theme === 'dark' ? 'text-[#64748b]' : 'text-[#64748b]'
                      }`}>{city.country}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Date */}
            <div className={`group flex items-center rounded-xl px-4 py-4 transition-all duration-300 hover:shadow-md ${
              theme === 'dark' 
                ? 'bg-[#253840] hover:bg-[#2d4450]' 
                : 'bg-[#f1f5f9] hover:bg-white'
            }`}>
              <div className={`p-2 rounded-lg mr-3 ${
                theme === 'dark' ? 'bg-[#334155]/50' : 'bg-[#cbd5e1]/30'
              }`}>
                <Calendar className="w-5 h-5 text-[#64748b]" />
              </div>
              <div className="flex-1 flex flex-col">
                <label className="text-[10px] uppercase font-bold text-[#64748b] tracking-wider mb-1">
                  Дата
                </label>
                <input 
                  className={`bg-transparent border-none p-0 placeholder:text-[#94a3b8] font-semibold focus:ring-0 text-base focus:outline-none ${
                    theme === 'dark' ? 'text-white' : 'text-[#0f172a]'
                  }`}
                  placeholder="Сегодня"
                  type="text"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>

            {/* Search Button */}
            <button 
              onClick={() => navigate('/search')}
              className="mt-3 w-full bg-gradient-to-r from-[#1978e5] to-[#1565c0] hover:from-[#1565c0] hover:to-[#0d47a1] text-white font-bold h-14 rounded-xl shadow-xl shadow-[#1978e5]/25 hover:shadow-2xl hover:shadow-[#1978e5]/40 flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.98]"
            >
              <Search className="w-5 h-5" />
              <span>Найти поездку</span>
            </button>
          </div>
        </section>

        {/* Quick Actions / Advertisement */}
        {userRole === 'driver' ? (
          <section className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => navigate('/search')}
              className={`group flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border transition-all active:scale-[0.98] ${
                theme === 'dark'
                  ? 'bg-[#1978e5]/20 border-[#1978e5]/10 hover:bg-[#1978e5]/30'
                  : 'bg-[#1978e5]/10 border-[#1978e5]/10 hover:bg-[#1978e5]/15'
              }`}
            >
              <div className={`size-12 rounded-full flex items-center justify-center text-[#1978e5] group-hover:scale-110 transition-transform ${
                theme === 'dark' ? 'bg-[#1978e5]/30' : 'bg-[#1978e5]/20'
              }`}>
                <Plus className="w-7 h-7" />
              </div>
              <span className={`font-bold text-sm text-center ${
                theme === 'dark' ? 'text-white' : 'text-[#0f172a]'
              }`}>
                Создать<br />объявление
              </span>
            </button>

            <button 
              onClick={() => navigate('/search')}
              className={`group flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border shadow-sm transition-all active:scale-[0.98] ${
                theme === 'dark'
                  ? 'bg-[#1a2c32] border-[#253840] hover:bg-[#253840]'
                  : 'bg-white border-[#e2e8f0] hover:bg-[#f8fafc]'
              }`}
            >
              <div className={`size-12 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform ${
                theme === 'dark' 
                  ? 'bg-[#253840] text-[#cbd5e1]' 
                  : 'bg-[#e2e8f0] text-[#475569]'
              }`}>
                <UserSearch className="w-7 h-7" />
              </div>
              <span className={`font-bold text-sm text-center ${
                theme === 'dark' ? 'text-white' : 'text-[#0f172a]'
              }`}>
                Найти<br />пассажира
              </span>
            </button>
          </section>
        ) : (
          /* Advertisement Block - Managed by Admin */
          <a
            href={currentAd.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`block rounded-2xl overflow-hidden shadow-sm border transition-all active:scale-[0.98] ${
              theme === 'dark'
                ? 'bg-[#1a2c32] border-[#253840]'
                : 'bg-white border-[#e2e8f0]'
            }`}
          >
            <div 
              className="relative h-32 overflow-hidden"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* Background gradient overlay */}
              <div className={`absolute inset-0 bg-gradient-to-r z-10 ${
                theme === 'dark'
                  ? 'from-[#1978e5]/80 via-[#1978e5]/60 to-transparent'
                  : 'from-[#1978e5]/90 via-[#1978e5]/70 to-transparent'
              }`} />
              
              {/* Background image (admin controlled) */}
              <ImageWithFallback
                src={currentAd.image}
                alt="Advertisement"
                className="absolute inset-0 w-full h-full object-cover"
              />
              
              {/* Content (admin controlled) */}
              <div className="relative z-20 h-full flex flex-col justify-center px-5">
                <div className="text-white">
                  <div className="text-xs uppercase tracking-wider font-bold mb-1 opacity-90">
                    {currentAd.emoji} {currentAd.badge}
                  </div>
                  <h3 className="text-lg font-bold leading-tight mb-1">
                    {currentAd.title.split('\n').map((line, i) => (
                      <span key={i}>
                        {line}
                        {i < currentAd.title.split('\n').length - 1 && <br />}
                      </span>
                    ))}
                  </h3>
                  <p className="text-xs opacity-90">
                    {currentAd.description}
                  </p>
                </div>
              </div>

              {/* Admin badge */}
              <div className={`absolute top-2 right-2 z-30 px-2 py-0.5 rounded text-[10px] font-bold ${
                theme === 'dark'
                  ? 'bg-white/20 text-white'
                  : 'bg-black/20 text-white'
              }`}>
                Реклама
              </div>
            </div>
          </a>
        )}

        {/* Popular Trips */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-xl font-bold ${
              theme === 'dark' ? 'text-white' : 'text-[#0f172a]'
            }`}>
              Популярные поездки
            </h2>
            <a 
              onClick={() => navigate('/trips')}
              className="text-sm font-semibold text-[#1978e5] hover:text-[#1565c0] cursor-pointer"
            >
              Все
            </a>
          </div>

          <div className="flex flex-col gap-4">
            {popularTrips.map((trip) => (
              <div 
                key={trip.id}
                onClick={() => navigate(`/trip/${trip.id}`)}
                className={`rounded-2xl p-4 shadow-sm border active:scale-[0.99] transition-transform cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-[#1a2c32] border-[#253840]'
                    : 'bg-white border-[#e2e8f0]'
                }`}
              >
                {/* Driver Info */}
                <div className={`flex items-center justify-between mb-4 pb-4 border-b ${
                  theme === 'dark' ? 'border-[#253840]' : 'border-[#e2e8f0]'
                }`}>
                  <div className="flex items-center gap-3">
                    <div 
                      className="size-10 rounded-full bg-cover bg-center"
                      style={{ backgroundImage: `url('${trip.driver.avatar}')` }}
                    />
                    <div>
                      <h3 className={`font-bold leading-none mb-1 ${
                        theme === 'dark' ? 'text-white' : 'text-[#0f172a]'
                      }`}>
                        {trip.driver.name}
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-[#64748b]">
                        <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                        <span className={`font-bold ${
                          theme === 'dark' ? 'text-[#e2e8f0]' : 'text-[#1e293b]'
                        }`}>
                          {trip.driver.rating}
                        </span>
                        <span>({trip.driver.trips} поездки)</span>
                      </div>
                    </div>
                  </div>
                  {trip.driver.verified && (
                    <div className={`px-2 py-1 rounded-md text-xs font-bold ${
                      theme === 'dark'
                        ? 'bg-green-900/30 text-green-400'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      Проверен
                    </div>
                  )}
                </div>

                {/* Route */}
                <div className={`relative flex flex-col gap-6 pl-4 border-l-2 border-dashed ml-2 ${
                  theme === 'dark' ? 'border-[#334155]' : 'border-[#cbd5e1]'
                }`}>
                  {/* From */}
                  <div className="relative">
                    <div 
                      className={`absolute -left-[23px] top-1 size-3 border-2 border-[#1978e5] rounded-full ${
                        theme === 'dark' ? 'bg-[#1a2c32]' : 'bg-white'
                      }`}
                    />
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-lg leading-none mb-1">
                          {trip.from}
                        </p>
                        <p className="text-xs text-[#64748b]">
                          {trip.fromCountry}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${
                          theme === 'dark' ? 'text-white' : 'text-[#0f172a]'
                        }`}>
                          {trip.time}
                        </p>
                        <p className="text-xs text-[#64748b]">{trip.date}</p>
                      </div>
                    </div>
                  </div>

                  {/* To */}
                  <div className="relative">
                    <div className="absolute -left-[23px] top-1 size-3 bg-[#1978e5] rounded-full" />
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-lg leading-none mb-1">
                          {trip.to}
                        </p>
                        <p className="text-xs text-[#64748b]">
                          {trip.toCountry}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${
                          theme === 'dark' ? 'text-white' : 'text-[#0f172a]'
                        }`}>
                          {trip.duration}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className={`mt-5 pt-4 border-t flex items-center justify-between ${
                  theme === 'dark' ? 'border-[#253840]' : 'border-[#e2e8f0]'
                }`}>
                  <div className={`flex items-center gap-2 ${
                    theme === 'dark' ? 'text-[#94a3b8]' : 'text-[#475569]'
                  }`}>
                    {trip.seats ? (
                      <>
                        <UsersIcon className="w-5 h-5" />
                        <span className="text-sm font-medium">{trip.seats} места</span>
                      </>
                    ) : (
                      <>
                        <Truck className="w-5 h-5" />
                        <span className="text-sm font-medium">{trip.cargo}</span>
                      </>
                    )}
                  </div>
                  <p className="text-xl font-bold text-[#1978e5]">{trip.price}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}