import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, X, Navigation, Loader } from 'lucide-react';
import { YMaps, Map, Placemark } from 'react-yandex-maps';
import { YANDEX_MAPS_CONFIG } from '../config/yandex';
import { useTheme } from '../context/ThemeContext';

interface AddressPickerProps {
  value: {
    address: string;
    lat: number;
    lng: number;
  } | null;
  onChange: (value: { address: string; lat: number; lng: number }) => void;
  placeholder?: string;
  label?: string;
}

interface SearchResult {
  name: string;
  description: string;
  lat: number;
  lng: number;
}

/**
 * 🗺️ Компонент выбора адреса с поиском и картой
 * Использует Yandex Geocoder API для поиска адресов
 */
export function AddressPicker({ value, onChange, placeholder = 'Введите адрес', label }: AddressPickerProps) {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState(value?.address || '');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([38.5598, 68.7738]); // Dushanbe
  const [mapZoom, setMapZoom] = useState(12);
  const searchTimeout = useRef<NodeJS.Timeout>();
  const ymapsRef = useRef<any>(null);

  // ══════════════════════════════════════════════════════════════════════
  // YANDEX GEOCODER - Поиск адресов
  // ══════════════════════════════════════════════════════════════════════
  const searchAddress = async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setSearchResults([]);
      return;
    }

    if (!YANDEX_MAPS_CONFIG.apiKey) {
      console.error('[AddressPicker] ⚠️ Yandex API key not found. Please set YANDEX_GEOCODER_API_KEY in environment variables.');
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      // Используем Yandex Geocoder API
      const response = await fetch(
        `https://geocode-maps.yandex.ru/1.x/?apikey=${YANDEX_MAPS_CONFIG.apiKey}&geocode=${encodeURIComponent(query)}&format=json&results=10&lang=ru_RU`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.response?.GeoObjectCollection?.featureMember) {
        console.warn('[AddressPicker] No results found or invalid response format');
        setSearchResults([]);
        setShowResults(false);
        return;
      }

      const results: SearchResult[] = [];
      const geoObjects = data.response.GeoObjectCollection.featureMember;
      
      for (const item of geoObjects) {
        const geo = item.GeoObject;
        if (geo?.Point?.pos) {
          const coords = geo.Point.pos.split(' '); // "lng lat" format
          const lng = parseFloat(coords[0]);
          const lat = parseFloat(coords[1]);
          
          // Извлекаем компоненты адреса
          const addressComponents = geo.metaDataProperty?.GeocoderMetaData?.Address?.Components || [];
          
          // Приоритет: город → район → область
          let cityName = '';
          let districtName = '';
          let provinceName = '';
          
          for (const component of addressComponents) {
            if (component.kind === 'locality') {
              cityName = component.name;
            } else if (component.kind === 'district') {
              districtName = component.name;
            } else if (component.kind === 'province') {
              provinceName = component.name;
            }
          }
          
          // Выбираем по приоритету (без страны!)
          const displayName = cityName || districtName || provinceName || geo.name;
          
          results.push({
            name: displayName,
            description: displayName, // Теперь тоже без полного адреса
            lat,
            lng,
          });
        }
      }

      // Убираем дубликаты по имени (один город может быть в разных результатах)
      const uniqueResults = results.filter((result, index, self) => 
        index === self.findIndex((r) => r.name === result.name)
      );

      setSearchResults(uniqueResults);
      setShowResults(true);
      console.log('[AddressPicker] Found unique results:', uniqueResults.length, '(filtered from', results.length, ')');
    } catch (error) {
      console.error('[AddressPicker] Search error:', error);
      setSearchResults([]);
      setShowResults(false);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(() => {
      if (searchQuery.length >= 3) {
        searchAddress(searchQuery);
      }
    }, 500);

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [searchQuery]);

  // ══════════════════════════════════════════════════════════════════════
  // Выбор адреса из результатов
  // ══════════════════════════════════════════════════════════════════════
  const selectAddress = async (result: SearchResult) => {
    setShowResults(false);
    setShowMap(false); // 🗺️ Скрыть карту после выбора адреса
    setMapCenter([result.lat, result.lng]);
    setMapZoom(15);

    // Результаты поиска уже содержат правильный формат (только город/район/область)
    setSearchQuery(result.name);
    onChange({
      address: result.name,
      lat: result.lat,
      lng: result.lng,
    });
  };

  // ══════════════════════════════════════════════════════════════════════
  // Клик по карте для выбора точки
  // ══════════════════════════════════════════════════════════════════════
  const handleMapClick = async (e: any) => {
    const coords = e.get('coords');
    const lat = coords[0];
    const lng = coords[1];

    if (!YANDEX_MAPS_CONFIG.apiKey) {
      console.error('[AddressPicker] ⚠️ Yandex API key not found for reverse geocoding');
      onChange({
        address: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        lat,
        lng,
      });
      return;
    }

    // Получить адрес по координатам (reverse geocoding)
    try {
      const response = await fetch(
        `https://geocode-maps.yandex.ru/1.x/?apikey=${YANDEX_MAPS_CONFIG.apiKey}&geocode=${lng},${lat}&format=json&lang=ru_RU`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.response?.GeoObjectCollection?.featureMember?.[0]) {
        throw new Error('No geocoding results found');
      }
      
      const geo = data.response.GeoObjectCollection.featureMember[0].GeoObject;
      
      if (geo) {
        // Извлечь только город/район/область из адреса (БЕЗ страны!)
        const addressComponents = geo.metaDataProperty?.GeocoderMetaData?.Address?.Components || [];
        
        // Приоритет: город → район → область
        let cityName = '';
        let districtName = '';
        let provinceName = '';
        
        for (const component of addressComponents) {
          if (component.kind === 'locality') {
            cityName = component.name;
          } else if (component.kind === 'district') {
            districtName = component.name;
          } else if (component.kind === 'province') {
            provinceName = component.name;
          }
          // НЕ используем 'country' - пропускаем страну
        }
        
        // Выбираем по приоритету
        const displayAddress = cityName || districtName || provinceName || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        
        setSearchQuery(displayAddress);
        onChange({
          address: displayAddress,
          lat,
          lng,
        });
      }
    } catch (error) {
      console.error('[AddressPicker] Reverse geocoding error:', error);
      // Fallback - use coordinates as address
      onChange({
        address: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        lat,
        lng,
      });
    }
  };

  // ══════════════════════════════════════════════════════════════════════
  // Определить текущую геопозицию
  // ══════════════════════════════════════════════════════════════════════
  const detectCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          setMapCenter([lat, lng]);
          setMapZoom(15);
          
          // Get address
          if (!YANDEX_MAPS_CONFIG.apiKey) {
            console.error('[AddressPicker] ⚠️ Yandex API key not found for geolocation');
            const coordsAddress = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
            setSearchQuery(coordsAddress);
            onChange({
              address: coordsAddress,
              lat,
              lng,
            });
            return;
          }

          try {
            const response = await fetch(
              `https://geocode-maps.yandex.ru/1.x/?apikey=${YANDEX_MAPS_CONFIG.apiKey}&geocode=${lng},${lat}&format=json&lang=ru_RU`
            );
            
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.response?.GeoObjectCollection?.featureMember?.[0]) {
              throw new Error('No geocoding results found');
            }
            
            const geo = data.response.GeoObjectCollection.featureMember[0].GeoObject;
            
            if (geo) {
              // Извлечь только город/район/область из адреса (БЕЗ страны!)
              const addressComponents = geo.metaDataProperty?.GeocoderMetaData?.Address?.Components || [];
              
              // Приоритет: город → район → область
              let cityName = '';
              let districtName = '';
              let provinceName = '';
              
              for (const component of addressComponents) {
                if (component.kind === 'locality') {
                  cityName = component.name;
                } else if (component.kind === 'district') {
                  districtName = component.name;
                } else if (component.kind === 'province') {
                  provinceName = component.name;
                }
                // НЕ используем 'country' - пропускаем страну
              }
              
              // Выбираем по приоритету
              const displayAddress = cityName || districtName || provinceName || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
              
              setSearchQuery(displayAddress);
              onChange({
                address: displayAddress,
                lat,
                lng,
              });
            }
          } catch (error) {
            console.error('[AddressPicker] Error getting address:', error);
            // Fallback to coordinates
            const coordsAddress = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
            setSearchQuery(coordsAddress);
            onChange({
              address: coordsAddress,
              lat,
              lng,
            });
          }
        },
        (error) => {
          // Детальная обработка ошибок геолокации
          let errorMessage = 'Не удалось определить местоположение';
          
          if (error) {
            switch (error.code) {
              case error.PERMISSION_DENIED:
                errorMessage = 'Доступ к геолокации запрещён. Разрешите доступ в настройках браузера.';
                console.warn('[AddressPicker] Geolocation permission denied');
                break;
              case error.POSITION_UNAVAILABLE:
                errorMessage = 'Информация о местоположении недоступна';
                console.warn('[AddressPicker] Geolocation position unavailable');
                break;
              case error.TIMEOUT:
                errorMessage = 'Превышено время ожидания определения местоположения';
                console.warn('[AddressPicker] Geolocation timeout');
                break;
              default:
                console.warn('[AddressPicker] Geolocation error:', error.message || 'Unknown error');
                break;
            }
          } else {
            console.warn('[AddressPicker] Geolocation error: Unknown error (empty error object)');
          }
          
          alert(errorMessage);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      alert('Геолокация не поддерживается вашим браузером');
      console.warn('[AddressPicker] Geolocation not supported');
    }
  };

  return (
    <div className="space-y-3">
      {label && (
        <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
          {label}
        </label>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowResults(true);
          }}
          placeholder={placeholder}
          className={`w-full pl-10 pr-24 py-3 rounded-xl border ${
            theme === 'dark'
              ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
          } focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
        />
        
        {/* Clear button */}
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSearchResults([]);
              onChange({ address: '', lat: 0, lng: 0 });
            }}
            className="absolute right-14 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        
        {/* Map toggle */}
        <button
          onClick={() => setShowMap(!showMap)}
          className={`absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 py-1.5 rounded-xl text-[11px] font-bold transition-all active:scale-95 ${ showMap ? 'bg-[#5ba3f5] text-white shadow-lg' : 'bg-[#1e2d3d] text-[#5ba3f5] border border-[#5ba3f5]/30' } m-[0px] px-[4px] py-[6px]`}
        >
          <MapPin className="w-3.5 h-3.5" />
          {showMap ? 'Скрыть' : 'Карта'}
        </button>
      </div>

      {/* Current location button */}
      <button
        onClick={detectCurrentLocation}
        className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg border ${
          theme === 'dark'
            ? 'border-gray-700 text-blue-400 hover:bg-gray-800'
            : 'border-gray-300 text-blue-600 hover:bg-gray-50'
        } transition-colors`}
      >
        <Navigation className="w-4 h-4" />
        <span className="text-sm font-medium">Моё местоположение</span>
      </button>

      {/* Loading indicator */}
      {loading && (
        <div className="flex items-center justify-center py-2">
          <Loader className="w-5 h-5 animate-spin text-blue-500" />
          <span className="ml-2 text-sm text-gray-500">Поиск...</span>
        </div>
      )}

      {/* Search Results */}
      {showResults && searchResults.length > 0 && (
        <div className={`border rounded-xl overflow-hidden ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        } shadow-lg max-h-64 overflow-y-auto`}>
          {searchResults.map((result, idx) => (
            <button
              key={idx}
              onClick={() => selectAddress(result)}
              className={`w-full text-left px-4 py-3 hover:bg-blue-500 hover:bg-opacity-10 transition-colors border-b ${
                theme === 'dark' ? 'border-gray-700' : 'border-gray-100'
              } last:border-b-0`}
            >
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {result.name}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Map View */}
      {showMap && (
        <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
          <YMaps query={{ apikey: YANDEX_MAPS_CONFIG.apiKey, lang: 'ru_RU' }}>
            <Map
              defaultState={{
                center: mapCenter,
                zoom: mapZoom,
              }}
              width="100%"
              height="300px"
              onClick={handleMapClick}
              instanceRef={ymapsRef}
              modules={['geocode']}
            >
              {value && value.lat && value.lng && (
                <Placemark
                  geometry={[value.lat, value.lng]}
                  options={{
                    preset: 'islands#redDotIcon',
                  }}
                />
              )}
            </Map>
          </YMaps>
          <div className={`px-3 py-2 text-xs ${theme === 'dark' ? 'bg-gray-800 text-gray-400' : 'bg-gray-50 text-gray-600'}`}>
            💡 Нажмите на карту чтобы выбрать точку
          </div>
        </div>
      )}

      {/* Selected Address Display */}
      {value && value.address && (
        <div className={`p-3 rounded-lg border ${
          theme === 'dark'
            ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
            : 'bg-blue-50 border-blue-200 text-blue-700'
        }`}>
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">{value.address}</p>
              <p className="text-xs opacity-70 mt-1">
                {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}