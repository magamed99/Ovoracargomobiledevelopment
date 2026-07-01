import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, X, Navigation, Loader } from 'lucide-react';
import { YANDEX_MAPS_CONFIG } from '../config/yandex';

interface AddressPickerProps {
  value: { address: string; lat: number; lng: number; } | null;
  onChange: (value: { address: string; lat: number; lng: number }) => void;
  placeholder?: string;
  label?: string;
  showCurrentLocation?: boolean;
}

interface SearchResult {
  name: string;
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

// Бывают веб-вью, где запрос, заблокированный CSP, не реджектится — виснет навечно
async function fetchWithTimeout(url: string, init?: RequestInit, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function yandexSearch(query: string, apiKey: string): Promise<SearchResult[]> {
  const resp = await fetchWithTimeout(
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
      out.push({ name, lat: parseFloat(latStr), lng: parseFloat(lngStr) });
    }
  }
  return out;
}

async function yandexReverse(lat: number, lng: number, apiKey: string): Promise<string> {
  const resp = await fetchWithTimeout(
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

// ── Nominatim fallback ────────────────────────────────────────────────────────

const NOM_HDR = { 'User-Agent': 'OvoraCargo/1.0 contact@ovora.tj' };

async function nominatimSearch(query: string): Promise<SearchResult[]> {
  const resp = await fetchWithTimeout(
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
      out.push({ name, lat: parseFloat(item.lat), lng: parseFloat(item.lon) });
    }
  }
  return out;
}

async function nominatimReverse(lat: number, lng: number): Promise<string> {
  const resp = await fetchWithTimeout(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ru&addressdetails=1`,
    { headers: NOM_HDR }
  );
  if (!resp.ok) return '';
  const data = await resp.json();
  const a = data.address ?? {};
  return a.city || a.town || a.village || a.municipality || a.county || a.state || '';
}

// ── Unified geocoding ─────────────────────────────────────────────────────────

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
    try { return await yandexReverse(lat, lng, key); } catch { /* fall through */ }
  }
  try {
    const name = await nominatimReverse(lat, lng);
    return name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

// ═════════════════════════════════════════════════════════════════════════════

export function AddressPicker({
  value,
  onChange,
  placeholder = 'Введите город',
  label,
  showCurrentLocation = true,
}: AddressPickerProps) {
  const [query, setQuery] = useState(value?.address || '');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Sync input when value changes externally
  // ⚠️ Намеренно без 'query' в зависимостях: этот эффект синхронизирует
  // query ТОЛЬКО когда меняется внешний value.address (например, выбор
  // из другого источника). Если добавить query — эффект будет срабатывать
  // на каждое нажатие клавиши и затирать то, что печатает пользователь,
  // откатывая query обратно к value.address.
  useEffect(() => {
    if (value?.address && value.address !== query) {
      setQuery(value.address);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value?.address]);

  // Debounced search — 400ms
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (query.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }
    timer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await geocodeSearch(query);
        setResults(res);
        setShowResults(res.length > 0);
      } catch {
        setResults([]);
        setShowResults(false);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [query]);

  const selectResult = (r: SearchResult) => {
    setQuery(r.name);
    setShowResults(false);
    onChange({ address: r.name, lat: r.lat, lng: r.lng });
  };

  const clear = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
    onChange({ address: '', lat: 0, lng: 0 });
  };

  const detectLocation = () => {
    if (!('geolocation' in navigator)) {
      alert('Геолокация не поддерживается вашим браузером');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        try {
          const address = await geocodeReverse(lat, lng);
          setQuery(address);
          onChange({ address, lat, lng });
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setLocating(false);
        const msgs: Record<number, string> = {
          1: 'Доступ к геолокации запрещён. Разрешите доступ в настройках браузера.',
          2: 'Информация о местоположении недоступна',
          3: 'Превышено время ожидания',
        };
        alert(msgs[err.code] ?? 'Не удалось определить местоположение');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div ref={containerRef} className="relative space-y-2">
      {label && (
        <p className="text-[9px] font-black uppercase tracking-widest text-[#4a6278]">{label}</p>
      )}

      {/* Search input */}
      <div className="relative flex items-center">
        {searching
          ? <Loader className="absolute left-3 w-4 h-4 text-[#5ba3f5] animate-spin" />
          : <Search className="absolute left-3 w-4 h-4 text-[#4a6278]" />
        }
        <input
          type="text"
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => { if (results.length > 0) setShowResults(true); }}
          placeholder={placeholder}
          className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-[#0c1520] border border-white/[0.08] text-white text-[13px] font-medium placeholder-[#2a3f52] outline-none focus:border-[#5ba3f5]/50 transition-colors"
        />
        {query && (
          <button onClick={clear} className="absolute right-2.5 p-0.5 text-[#4a6278] hover:text-white transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Results dropdown */}
      {showResults && results.length > 0 && (
        <div className="absolute left-0 right-0 z-50 mt-1 rounded-xl border border-white/[0.10] bg-[#111c28] shadow-2xl overflow-hidden">
          {results.map((r, i) => (
            <button
              key={i}
              onMouseDown={() => selectResult(r)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-[#5ba3f5]/10 transition-colors border-b border-white/[0.05] last:border-0 text-left"
            >
              <MapPin className="w-3.5 h-3.5 text-[#5ba3f5] flex-shrink-0" />
              <span className="text-[13px] font-medium text-white truncate">{r.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Selected address chip */}
      {value?.address && !showResults && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#5ba3f5]/10 border border-[#5ba3f5]/20">
          <MapPin className="w-3.5 h-3.5 text-[#5ba3f5] flex-shrink-0" />
          <span className="text-[12px] font-semibold text-[#5ba3f5] truncate">{value.address}</span>
        </div>
      )}

      {/* My location button — ОТКУДА only */}
      {showCurrentLocation && (
        <button
          onClick={detectLocation}
          disabled={locating}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[#5ba3f5]/25 text-[#5ba3f5] text-[12px] font-bold hover:bg-[#5ba3f5]/10 active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {locating
            ? <Loader className="w-3.5 h-3.5 animate-spin" />
            : <Navigation className="w-3.5 h-3.5" />
          }
          {locating ? 'Определяем...' : 'Моё местоположение'}
        </button>
      )}
    </div>
  );
}
