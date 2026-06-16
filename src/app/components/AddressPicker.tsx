import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, X, Navigation, Loader } from 'lucide-react';
import { YMaps, Map, Placemark } from 'react-yandex-maps';
import { YANDEX_MAPS_CONFIG } from '../config/yandex';
import { useTheme } from '../context/ThemeContext';

interface AddressPickerProps {
  value: { address: string; lat: number; lng: number; } | null;
  onChange: (value: { address: string; lat: number; lng: number }) => void;
  placeholder?: string;
  label?: string;
  showCurrentLocation?: boolean;
}

interface SearchResult {
  name: string;
  description: string;
  lat: number;
  lng: number;
}

// ── Yandex helpers ────────────────────────────────────────────────────────────

function extractCity(components: { kind: string; name: string }[]): string {
  let city = '', district = '', province = '';
  for (const c of components) {
    if (c.kind === 'locality') city = c.name;
    else if (c.kind === 'district') district = c.name;
    else if (c.kind === 'province') province = c.name;
  }
  return city || district || province;
}

async function yandexSearch(query: string, apiKey: string): Promise<SearchResult[]> {
  const resp = await fetch(
    `https://geocode-maps.yandex.ru/1.x/?apikey=${apiKey}&geocode=${encodeURIComponent(query)}&format=json&results=10&lang=ru_RU`
  );
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const data = await resp.json();
  const members = data.response?.GeoObjectCollection?.featureMember ?? [];
  const out: SearchResult[] = [];
  for (const item of members) {
    const geo = item.GeoObject;
    if (!geo?.Point?.pos) continue;
    const [lngStr, latStr] = geo.Point.pos.split(' ');
    const name = extractCity(geo.metaDataProperty?.GeocoderMetaData?.Address?.Components ?? []) || geo.name;
    if (name && !out.find(r => r.name === name)) {
      out.push({ name, description: name, lat: parseFloat(latStr), lng: parseFloat(lngStr) });
    }
  }
  return out;
}

async function yandexReverse(lat: number, lng: number, apiKey: string): Promise<string> {
  const resp = await fetch(
    `https://geocode-maps.yandex.ru/1.x/?apikey=${apiKey}&geocode=${lng},${lat}&format=json&lang=ru_RU`
  );
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const data = await resp.json();
  const geo = data.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject;
  if (!geo) throw new Error('No results');
  const name = extractCity(geo.metaDataProperty?.GeocoderMetaData?.Address?.Components ?? []);
  if (!name) throw new Error('No city');
  return name;
}

// ── Nominatim fallback (free, no API key) ────────────────────────────────────

const NOM_HDR = { 'User-Agent': 'OvoraCargo/1.0 contact@ovora.tj' };

async function nominatimSearch(query: string): Promise<SearchResult[]> {
  const resp = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=7&accept-language=ru&addressdetails=1`,
    { headers: NOM_HDR }
  );
  if (!resp.ok) return [];
  const data: any[] = await resp.json();
  const out: SearchResult[] = [];
  for (const item of data) {
    const a = item.address ?? {};
    const name = a.city || a.town || a.village || a.municipality || a.county || item.display_name.split(',')[0].trim();
    if (name && !out.find(r => r.name === name)) {
      out.push({ name, description: name, lat: parseFloat(item.lat), lng: parseFloat(item.lon) });
    }
  }
  return out;
}

async function nominatimReverse(lat: number, lng: number): Promise<string> {
  const resp = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ru&addressdetails=1`,
    { headers: NOM_HDR }
  );
  if (!resp.ok) return '';
  const data = await resp.json();
  const a = data.address ?? {};
  return a.city || a.town || a.village || a.municipality || a.county || a.state || '';
}

// ── Unified geocoding (Yandex first, Nominatim fallback) ─────────────────────

async function geocodeSearch(query: string): Promise<SearchResult[]> {
  const key = YANDEX_MAPS_CONFIG.apiKey;
  if (key) {
    try {
      const results = await yandexSearch(query, key);
      if (results.length > 0) return results;
    } catch { /* fall through */ }
  }
  return nominatimSearch(query);
}

async function geocodeReverse(lat: number, lng: number): Promise<string> {
  const key = YANDEX_MAPS_CONFIG.apiKey;
  if (key) {
    try {
      return await yandexReverse(lat, lng, key);
    } catch { /* fall through */ }
  }
  const name = await nominatimReverse(lat, lng);
  return name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

// ═════════════════════════════════════════════════════════════════════════════

export function AddressPicker({
  value,
  onChange,
  placeholder = 'Введите адрес',
  label,
  showCurrentLocation = true,
}: AddressPickerProps) {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState(value?.address || '');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([38.5598, 68.7738]);
  const [mapZoom, setMapZoom] = useState(12);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const ymapsRef = useRef<any>(null);

  // Debounced city search
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(async () => {
      if (searchQuery.length >= 3) {
        setLoading(true);
        try {
          const results = await geocodeSearch(searchQuery);
          setSearchResults(results);
          setShowResults(results.length > 0);
        } catch {
          setSearchResults([]);
          setShowResults(false);
        } finally {
          setLoading(false);
        }
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 800);
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); };
  }, [searchQuery]);

  const selectAddress = (result: SearchResult) => {
    setShowResults(false);
    setShowMap(false);
    setMapCenter([result.lat, result.lng]);
    setMapZoom(15);
    setSearchQuery(result.name);
    onChange({ address: result.name, lat: result.lat, lng: result.lng });
  };

  const handleMapClick = async (e: any) => {
    const [lat, lng] = e.get('coords') as [number, number];
    setLoading(true);
    try {
      const address = await geocodeReverse(lat, lng);
      setSearchQuery(address);
      onChange({ address, lat, lng });
    } finally {
      setLoading(false);
    }
  };

  const detectCurrentLocation = () => {
    if (!('geolocation' in navigator)) {
      alert('Геолокация не поддерживается вашим браузером');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setMapCenter([lat, lng]);
        setMapZoom(15);
        setLocating(true);
        try {
          const address = await geocodeReverse(lat, lng);
          setSearchQuery(address);
          onChange({ address, lat, lng });
        } finally {
          setLocating(false);
        }
      },
      (error) => {
        const msgs: Record<number, string> = {
          1: 'Доступ к геолокации запрещён. Разрешите доступ в настройках браузера.',
          2: 'Информация о местоположении недоступна',
          3: 'Превышено время ожидания определения местоположения',
        };
        alert(msgs[error.code] ?? 'Не удалось определить местоположение');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="space-y-3">
      {label && (
        <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
          {label}
        </label>
      )}

      {/* Search input */}
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
        <button
          onClick={() => setShowMap(!showMap)}
          className={`absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 py-1.5 rounded-xl text-[11px] font-bold transition-all active:scale-95 ${
            showMap ? 'bg-[#5ba3f5] text-white shadow-lg' : 'bg-[#1e2d3d] text-[#5ba3f5] border border-[#5ba3f5]/30'
          } m-[0px] px-[4px] py-[6px]`}
        >
          <MapPin className="w-3.5 h-3.5" />
          {showMap ? 'Скрыть' : 'Карта'}
        </button>
      </div>

      {/* My location button — only for ОТКУДА */}
      {showCurrentLocation && (
        <button
          onClick={detectCurrentLocation}
          disabled={locating}
          className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg border ${
            theme === 'dark'
              ? 'border-gray-700 text-blue-400 hover:bg-gray-800'
              : 'border-gray-300 text-blue-600 hover:bg-gray-50'
          } transition-colors disabled:opacity-60`}
        >
          {locating
            ? <Loader className="w-4 h-4 animate-spin" />
            : <Navigation className="w-4 h-4" />
          }
          <span className="text-sm font-medium">
            {locating ? 'Определяем...' : 'Моё местоположение'}
          </span>
        </button>
      )}

      {/* Search loading */}
      {loading && (
        <div className="flex items-center justify-center py-2">
          <Loader className="w-5 h-5 animate-spin text-blue-500" />
          <span className="ml-2 text-sm text-gray-500">Поиск...</span>
        </div>
      )}

      {/* Search results dropdown */}
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
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-blue-500 shrink-0" />
                <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {result.name}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Map */}
      {showMap && (
        <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
          <YMaps query={{ apikey: YANDEX_MAPS_CONFIG.apiKey, lang: 'ru_RU' }}>
            <Map
              defaultState={{ center: mapCenter, zoom: mapZoom }}
              width="100%"
              height="300px"
              onClick={handleMapClick}
              instanceRef={ymapsRef as any}
              modules={['geocode']}
            >
              {value && value.lat && value.lng && (
                <Placemark
                  geometry={[value.lat, value.lng]}
                  options={{ preset: 'islands#redDotIcon' }}
                />
              )}
            </Map>
          </YMaps>
          <div className={`px-3 py-2 text-xs ${theme === 'dark' ? 'bg-gray-800 text-gray-400' : 'bg-gray-50 text-gray-600'}`}>
            💡 Нажмите на карту чтобы выбрать точку
          </div>
        </div>
      )}
    </div>
  );
}
