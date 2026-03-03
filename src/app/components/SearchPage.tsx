import { useState, useRef, useEffect } from 'react';
import { MapPin, Calendar, Users, SlidersHorizontal, Map as MapIcon, Plus, DollarSign, Package } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useTheme } from '../context/ThemeContext';
import { searchCities, City } from '../data/cities';

export function SearchPage() {
  const { theme } = useTheme();
  const userRole = localStorage.getItem('userRole') || 'sender';
  const [searchType, setSearchType] = useState<'trip' | 'cargo'>('trip');
  const navigate = useNavigate();

  // City autocomplete state
  const [fromCity, setFromCity] = useState('');
  const [toCity, setToCity] = useState('');
  const [fromSuggestions, setFromSuggestions] = useState<City[]>([]);
  const [toSuggestions, setToSuggestions] = useState<City[]>([]);
  const [showFromDropdown, setShowFromDropdown] = useState(false);
  const [showToDropdown, setShowToDropdown] = useState(false);
  
  const fromInputRef = useRef<HTMLDivElement>(null);
  const toInputRef = useRef<HTMLDivElement>(null);

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

  // Driver creates trips, sender searches for trips
  if (userRole === 'driver') {
    return (
      <div className={`min-h-screen ${
        theme === 'dark' ? 'bg-[#111821]' : 'bg-[#f6f7f8]'
      }`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-teal-600 text-white px-4 pt-6 pb-4 safe-area-top">
          <h1 className="text-xl sm:text-2xl font-bold mb-2">Создать поездку</h1>
          <p className="text-blue-100 text-sm">Разместите объявление о вашей поездке</p>
        </div>

        {/* Create trip form */}
        <div className="px-4 py-6 max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
            {/* From */}
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Откуда
              </label>
              <div className="relative" ref={fromInputRef}>
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-600 z-10" />
                <input
                  type="text"
                  placeholder="Душанбе"
                  value={fromCity}
                  onChange={(e) => handleFromCityChange(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 text-base bg-gray-50 rounded-xl border-2 border-transparent focus:border-blue-500 outline-none transition-colors"
                />
                {showFromDropdown && fromSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto z-20">
                    {fromSuggestions.map((city, index) => (
                      <button
                        key={`${city.name}-${index}`}
                        onClick={() => selectFromCity(city)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-100 transition-colors flex items-center justify-between border-b border-gray-100 last:border-b-0"
                      >
                        <span className="font-semibold text-gray-900">{city.name}</span>
                        <span className="text-xs text-gray-500">{city.country}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* To */}
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Куда
              </label>
              <div className="relative" ref={toInputRef}>
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-teal-600 z-10" />
                <input
                  type="text"
                  placeholder="Москва"
                  value={toCity}
                  onChange={(e) => handleToCityChange(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 text-base bg-gray-50 rounded-xl border-2 border-transparent focus:border-blue-500 outline-none transition-colors"
                />
                {showToDropdown && toSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto z-20">
                    {toSuggestions.map((city, index) => (
                      <button
                        key={`${city.name}-${index}`}
                        onClick={() => selectToCity(city)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-100 transition-colors flex items-center justify-between border-b border-gray-100 last:border-b-0"
                      >
                        <span className="font-semibold text-gray-900">{city.name}</span>
                        <span className="text-xs text-gray-500">{city.country}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Date and time */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Дата отправления
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="date"
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-blue-500 outline-none transition-colors text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Время
                </label>
                <input
                  type="time"
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-blue-500 outline-none transition-colors text-sm"
                />
              </div>
            </div>

            {/* Available seats */}
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Доступно мест
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  placeholder="4"
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-blue-500 outline-none transition-colors"
                />
              </div>
            </div>

            {/* Cargo capacity */}
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Грузоподъемность (кг)
              </label>
              <div className="relative">
                <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  placeholder="500"
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-blue-500 outline-none transition-colors"
                />
              </div>
            </div>

            {/* Price per seat */}
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Цена за место (TJS)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  placeholder="5000"
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-blue-500 outline-none transition-colors"
                />
              </div>
            </div>

            {/* Additional notes */}
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Дополнительная информация
              </label>
              <textarea
                placeholder="Укажите особенности поездки, остановки и другую информацию..."
                rows={3}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-blue-500 outline-none transition-colors resize-none"
              />
            </div>

            {/* Publish button */}
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-4 rounded-xl transition-colors shadow-lg flex items-center justify-center gap-2">
              <Plus className="w-5 h-5" />
              <span>Опубликовать поездку</span>
            </button>
          </div>

          {/* Tips */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
            <h3 className="font-semibold text-blue-900 mb-2">💡 Советы</h3>
            <ul className="space-y-1 text-sm text-blue-800">
              <li> Укажите точное время отправления</li>
              <li>• Добаьте промежуточные остановки</li>
              <li>• Опишите условия перевозки груза</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Sender searches for trips
  return (
    <div className={`min-h-screen ${
      theme === 'dark' ? 'bg-[#111821]' : 'bg-[#f6f7f8]'
    }`}>
      {/* Header */}
      <div className={`px-4 pt-6 pb-4 border-b ${
        theme === 'dark'
          ? 'bg-[#111821] border-[#2a424a]'
          : 'bg-white border-gray-200'
      }`}>
        <h1 className={`text-2xl font-bold mb-4 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>Поиск</h1>
        
        {/* Type selector */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setSearchType('trip')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
              searchType === 'trip'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            Поездка
          </button>
          <button
            onClick={() => setSearchType('cargo')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
              searchType === 'cargo'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            Груз
          </button>
        </div>
      </div>

      {/* Search form */}
      <div className="px-4 py-6">
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
          {/* From */}
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Откуда
            </label>
            <div className="relative" ref={fromInputRef}>
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-600" />
              <input
                type="text"
                placeholder="Душанбе"
                value={fromCity}
                onChange={(e) => handleFromCityChange(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-blue-500 outline-none transition-colors"
              />
              {showFromDropdown && (
                <div className="absolute left-0 right-0 top-full bg-white border border-gray-200 rounded-b-2xl shadow-sm z-10">
                  {fromSuggestions.map((city, index) => (
                    <button
                      key={`${city.name}-${index}`}
                      onClick={() => selectFromCity(city)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors flex items-center justify-between border-b border-gray-100 last:border-b-0"
                    >
                      <span className="font-semibold text-gray-900">{city.name}</span>
                      <span className="text-xs text-gray-500">{city.country}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* To */}
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Куда
            </label>
            <div className="relative" ref={toInputRef}>
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-teal-600" />
              <input
                type="text"
                placeholder="Москва"
                value={toCity}
                onChange={(e) => handleToCityChange(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-blue-500 outline-none transition-colors"
              />
              {showToDropdown && (
                <div className="absolute left-0 right-0 top-full bg-white border border-gray-200 rounded-b-2xl shadow-sm z-10">
                  {toSuggestions.map((city, index) => (
                    <button
                      key={`${city.name}-${index}`}
                      onClick={() => selectToCity(city)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors flex items-center justify-between border-b border-gray-100 last:border-b-0"
                    >
                      <span className="font-semibold text-gray-900">{city.name}</span>
                      <span className="text-xs text-gray-500">{city.country}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Date */}
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Дата
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                className="w-full pl-11 pr-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-blue-500 outline-none transition-colors"
              />
            </div>
          </div>

          {/* Passengers/Weight */}
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              {searchType === 'trip' ? 'Количество пассажиров' : 'Вес груза (кг)'}
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="number"
                placeholder={searchType === 'trip' ? '1' : '50'}
                className="w-full pl-11 pr-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-blue-500 outline-none transition-colors"
              />
            </div>
          </div>

          {/* Filters button */}
          <button className="w-full flex items-center justify-center gap-2 py-3 px-4 border-2 border-gray-200 rounded-xl text-gray-700 font-medium hover:border-gray-300 transition-colors mb-4">
            <SlidersHorizontal className="w-5 h-5" />
            <span>Фильтры</span>
          </button>

          {/* Search button */}
          <button 
            onClick={() => navigate('/search-results')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-4 rounded-xl transition-colors shadow-lg"
          >
            {userRole === 'driver' ? 'Опубликовать поездку' : 'Найти поездки'}
          </button>
        </div>

        {/* Map view button */}
        <button className="w-full flex items-center justify-center gap-2 bg-white py-4 px-4 rounded-xl text-gray-700 font-medium shadow-sm hover:shadow-md transition-shadow">
          <MapIcon className="w-5 h-5" />
          <span>Показать на карте</span>
        </button>
      </div>

      {/* Popular routes */}
      <div className="px-4 pb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          Популярные маршруты
        </h2>
        <div className="space-y-2">
          {['Душанбе → Москва', 'Худжанд → С.-Петербург', 'Душанбе → Екатеринбург'].map((route, index) => (
            <button
              key={index}
              className="w-full bg-white px-4 py-3 rounded-xl shadow-sm text-left hover:shadow-md transition-shadow active:scale-98"
            >
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-gray-900">{route}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}