/**
 * PublicTrackingPage — публичная страница трекинга.
 * Открывается по ссылке /track/:tripId БЕЗ авторизации.
 * Показывает: маршрут, статус, прогресс, POD фото.
 */
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router';
import { YMaps, Map, Placemark } from 'react-yandex-maps';
import { YANDEX_MAPS_CONFIG } from '../config/yandex';
import {
  MapPin, Package, Truck, Clock, CheckCircle2,
  Navigation, AlertCircle, RefreshCw, Camera,
} from 'lucide-react';
import { getPublicTracking, SHIPMENT_STATUS_LABELS, SHIPMENT_STATUS_ICONS } from '../api/trackingApi';
import { calculateDistance } from '@/utils/geolocation';
import { cleanAddress } from '../utils/addressUtils';

type ShipmentStatus = 'pending' | 'loaded' | 'inProgress' | 'customs' | 'arrived' | 'delivered' | 'completed' | 'cancelled';

const STATUS_STEPS: { key: ShipmentStatus; label: string; icon: string }[] = [
  { key: 'pending',    label: 'Ожидает',  icon: '⏳' },
  { key: 'loaded',     label: 'Загружен', icon: '📦' },
  { key: 'inProgress', label: 'В пути',   icon: '🚚' },
  { key: 'customs',    label: 'Таможня',  icon: '🛂' },
  { key: 'arrived',    label: 'Прибыл',   icon: '📍' },
  { key: 'delivered',  label: 'Доставлен',icon: '✅' },
];

const STATUS_ORDER: ShipmentStatus[] = ['pending', 'loaded', 'inProgress', 'customs', 'arrived', 'delivered'];

function getStatusIndex(status: ShipmentStatus): number {
  const idx = STATUS_ORDER.indexOf(status);
  if (status === 'completed') return STATUS_ORDER.length - 1;
  return idx >= 0 ? idx : 0;
}

export function PublicTrackingPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const [shipment, setShipment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const mapInstanceRef = useRef<any>(null);
  const ymapsRef = useRef<any>(null);
  const routeRef = useRef<any>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [ymapsApi, setYmapsApi] = useState<any>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  useEffect(() => {
    if (!tripId) return;
    setLoading(true);
    getPublicTracking(tripId)
      .then(s => {
        if (s) setShipment(s);
        else setError('Отслеживание не найдено. Проверьте ссылку.');
      })
      .catch(() => setError('Ошибка загрузки. Попробуйте ещё раз.'))
      .finally(() => setLoading(false));
  }, [tripId, lastRefresh]);

  // Polling каждые 15 секунд
  useEffect(() => {
    const id = setInterval(() => setLastRefresh(Date.now()), 15000);
    return () => clearInterval(id);
  }, []);

  // Маршрут на карте
  useEffect(() => {
    if (!mapInstance || !ymapsApi || !shipment?.fromLat) return;
    if (routeRef.current) {
      try { mapInstance.geoObjects.remove(routeRef.current); } catch (_) {}
    }
    const multiRoute = new ymapsApi.multiRouter.MultiRoute(
      {
        referencePoints: [
          [shipment.fromLat, shipment.fromLng],
          [shipment.toLat, shipment.toLng],
        ],
        params: { routingMode: 'auto' },
      },
      {
        routeActiveStrokeColor: '#5ba3f5',
        routeActiveStrokeWidth: 5,
        routeStrokeColor: '#334155',
        boundsAutoApply: true,
        pinVisible: false,
      }
    );
    routeRef.current = multiRoute;
    mapInstance.geoObjects.add(multiRoute);
    return () => { try { mapInstance.geoObjects.remove(multiRoute); } catch (_) {} };
  }, [mapInstance, ymapsApi, shipment]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: '#0e1621' }}>
        <div className="w-12 h-12 rounded-full border-4 animate-spin" style={{ borderColor: '#1e3a55', borderTopColor: '#5ba3f5' }} />
        <p className="text-sm font-semibold" style={{ color: '#8ba4c0' }}>Загрузка трекинга…</p>
      </div>
    );
  }

  if (error || !shipment) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6" style={{ background: '#0e1621' }}>
        <AlertCircle size={48} style={{ color: '#ef4444' }} />
        <h1 className="text-lg font-bold text-white text-center">{error || 'Трекинг не найден'}</h1>
        <p className="text-sm text-center" style={{ color: '#8ba4c0' }}>
          Ссылка могла устареть или быть недействительной
        </p>
        <button
          onClick={() => setLastRefresh(Date.now())}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold"
          style={{ background: '#5ba3f5', color: '#fff' }}
        >
          <RefreshCw size={14} /> Попробовать ещё раз
        </button>
      </div>
    );
  }

  const totalKm = (shipment.fromLat && shipment.toLat)
    ? Math.round(calculateDistance(shipment.fromLat, shipment.fromLng, shipment.toLat, shipment.toLng))
    : 0;

  let progress = 0;
  if (shipment.driverLat && shipment.fromLat && totalKm > 0) {
    const gone = calculateDistance(shipment.fromLat, shipment.fromLng, shipment.driverLat, shipment.driverLng);
    progress = Math.min(100, Math.round((gone / totalKm) * 100));
  }

  const statusIdx = getStatusIndex(shipment.status);
  const currentLabel = SHIPMENT_STATUS_LABELS[shipment.status as ShipmentStatus] || shipment.status;
  const currentIcon = SHIPMENT_STATUS_ICONS[shipment.status as ShipmentStatus] || '📦';
  const isDelivered = shipment.status === 'delivered' || shipment.status === 'completed';
  const routeFrom = cleanAddress(shipment.from || '');
  const routeTo = cleanAddress(shipment.to || '');
  const podPhotos: any[] = shipment.podPhotos || [];
  const hasLiveGps = !!shipment.driverLat;

  const mapCenter = shipment.driverLat
    ? [shipment.driverLat, shipment.driverLng]
    : shipment.fromLat
    ? [(shipment.fromLat + shipment.toLat) / 2, (shipment.fromLng + shipment.toLng) / 2]
    : [41.3, 69.2];

  return (
    <div className="min-h-screen pb-10" style={{ background: '#0e1621', color: '#e2eaf4', fontFamily: "'Sora', sans-serif" }}>
      {/* Header */}
      <div
        className="sticky top-0 z-20 px-4 py-3 flex items-center justify-between"
        style={{ background: '#0e1621cc', backdropFilter: 'blur(16px)', borderBottom: '1px solid #1e3a55' }}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#5ba3f520', border: '1px solid #5ba3f530' }}>
            <Navigation size={14} style={{ color: '#5ba3f5' }} />
          </div>
          <div>
            <div className="text-xs font-black" style={{ color: '#5ba3f5' }}>OVORA CARGO</div>
            <div className="text-[10px]" style={{ color: '#8ba4c0' }}>Трекинг груза</div>
          </div>
        </div>
        <button
          onClick={() => setLastRefresh(Date.now())}
          className="w-8 h-8 rounded-xl flex items-center justify-center transition-all active:scale-90"
          style={{ background: '#1e3a5520', border: '1px solid #1e3a55' }}
        >
          <RefreshCw size={13} style={{ color: '#8ba4c0' }} />
        </button>
      </div>

      {/* Route hero */}
      <div className="px-4 pt-4">
        <div
          className="rounded-3xl p-5"
          style={{ background: isDelivered ? 'linear-gradient(135deg,#052e1a,#0d2d1e)' : 'linear-gradient(135deg,#0a1e32,#0c1d2e)', border: `1px solid ${isDelivered ? '#10b98140' : '#5ba3f530'}` }}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">{currentIcon}</span>
            <span className="text-sm font-black" style={{ color: isDelivered ? '#10b981' : '#5ba3f5' }}>
              {currentLabel}
            </span>
            {hasLiveGps && !isDelivered && (
              <span className="flex items-center gap-1 ml-auto px-2 py-0.5 rounded-full text-[10px] font-black" style={{ background: '#10b98120', border: '1px solid #10b98130', color: '#10b981' }}>
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                </span>
                LIVE
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#607080' }}>Откуда</div>
              <div className="font-extrabold text-white text-base leading-tight truncate">{routeFrom}</div>
            </div>
            <div className="flex flex-col items-center gap-1 shrink-0 px-2">
              <div className="w-2 h-2 rounded-full bg-[#5ba3f5]" />
              <div className="w-16 h-0.5 rounded-full" style={{ background: 'linear-gradient(90deg,#5ba3f5,#10b981)' }} />
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
            </div>
            <div className="flex-1 min-w-0 text-right">
              <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#607080' }}>Куда</div>
              <div className="font-extrabold text-white text-base leading-tight truncate">{routeTo}</div>
            </div>
          </div>

          {/* Progress bar */}
          {!isDelivered && (
            <div className="mt-4 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px]" style={{ color: '#607080' }}>
                  {hasLiveGps ? `Пройдено ${Math.round(totalKm * progress / 100)} км` : 'Данные GPS обновляются...'}
                </span>
                <span className="text-[11px] font-bold text-white">{progress}%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: '#1e3a55' }}>
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{ width: `${progress}%`, background: 'linear-gradient(90deg,#5ba3f5,#10b981)' }}
                />
              </div>
              {totalKm > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-[10px]" style={{ color: '#607080' }}>{routeFrom}</span>
                  <span className="text-[10px] font-semibold" style={{ color: '#10b981' }}>
                    {hasLiveGps && progress < 100 ? `осталось ${Math.round(totalKm * (1 - progress / 100))} км` : `${totalKm} км`}
                  </span>
                  <span className="text-[10px]" style={{ color: '#607080' }}>{routeTo}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Map */}
      {shipment.fromLat && (
        <div className="mx-4 mt-3 rounded-3xl overflow-hidden" style={{ height: 200, border: '1px solid #1e3a55' }}>
          <YMaps query={{ apikey: YANDEX_MAPS_CONFIG.apiKey, lang: YANDEX_MAPS_CONFIG.lang, load: 'package.full' }}>
            <Map
              state={{ center: mapCenter as [number, number], zoom: hasLiveGps ? 8 : 6 }}
              width="100%" height="100%"
              modules={['multiRouter.MultiRoute']}
              options={{ suppressMapOpenBlock: true }}
              instanceRef={(ref: any) => { if (ref && ref !== mapInstanceRef.current) { mapInstanceRef.current = ref; setMapInstance(ref); } }}
              onLoad={(ymaps: any) => { ymapsRef.current = ymaps; setYmapsApi(ymaps); }}
            >
              {shipment.driverLat && (
                <Placemark
                  geometry={[shipment.driverLat, shipment.driverLng]}
                  properties={{ hintContent: 'Груз сейчас', balloonContent: `<b>Ваш груз</b><br/>${progress}% пути` }}
                  options={{ preset: 'islands#blueCarIcon', iconColor: '#5ba3f5' }}
                />
              )}
            </Map>
          </YMaps>
        </div>
      )}

      {/* Status timeline */}
      <div className="mx-4 mt-3 rounded-3xl p-4" style={{ background: '#131f2e', border: '1px solid #1e3a55' }}>
        <div className="text-[10px] font-bold uppercase tracking-wider mb-4" style={{ color: '#607080' }}>
          История статусов
        </div>
        <div className="relative">
          {/* Connector line */}
          <div className="absolute left-[18px] top-3 bottom-3 w-0.5" style={{ background: '#1e3a55' }} />
          <div className="space-y-0">
            {STATUS_STEPS.map((step, i) => {
              const isActive = i === statusIdx;
              const isDone = i < statusIdx || isDelivered;
              const isFuture = i > statusIdx && !isDelivered;
              // Timestamp from history
              const histEntry = (shipment.statusHistory || []).find((h: any) => h.status === step.key);
              const ts = histEntry?.timestamp
                ? new Date(histEntry.timestamp).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                : null;

              return (
                <div key={step.key} className="flex items-start gap-3 pb-4">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-base z-10 relative shrink-0 transition-all"
                    style={{
                      background: isDone ? '#10b98120' : isActive ? '#5ba3f520' : '#1e3a5530',
                      border: `2px solid ${isDone ? '#10b981' : isActive ? '#5ba3f5' : '#1e3a55'}`,
                      boxShadow: isActive ? '0 0 12px #5ba3f540' : 'none',
                    }}
                  >
                    {isDone ? <CheckCircle2 size={16} style={{ color: '#10b981' }} /> : <span>{step.icon}</span>}
                  </div>
                  <div className="flex-1 pt-1.5">
                    <div className="font-semibold text-sm" style={{ color: isDone ? '#e2eaf4' : isActive ? '#fff' : '#607080' }}>
                      {step.label}
                    </div>
                    {ts && <div className="text-[11px] mt-0.5" style={{ color: '#607080' }}>{ts}</div>}
                    {isActive && !ts && (
                      <div className="text-[11px] mt-0.5 font-semibold" style={{ color: '#5ba3f5' }}>Текущий статус</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Driver & cargo info */}
      <div className="mx-4 mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-2xl p-3" style={{ background: '#131f2e', border: '1px solid #1e3a55' }}>
          <div className="flex items-center gap-1.5 mb-1">
            <Truck size={12} style={{ color: '#5ba3f5' }} />
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#607080' }}>Водитель</span>
          </div>
          <div className="font-bold text-white text-sm">{shipment.driverName || 'Водитель'}</div>
          {shipment.vehicleType && <div className="text-[11px] mt-0.5" style={{ color: '#607080' }}>{shipment.vehicleType}</div>}
        </div>
        <div className="rounded-2xl p-3" style={{ background: '#131f2e', border: '1px solid #1e3a55' }}>
          <div className="flex items-center gap-1.5 mb-1">
            <Package size={12} style={{ color: '#a855f7' }} />
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#607080' }}>Груз</span>
          </div>
          <div className="font-bold text-white text-sm">{shipment.cargoType || 'Груз'}</div>
          {totalKm > 0 && <div className="text-[11px] mt-0.5" style={{ color: '#607080' }}>{totalKm} км</div>}
        </div>
      </div>

      {/* POD Photos */}
      {podPhotos.length > 0 && (
        <div className="mx-4 mt-3 rounded-3xl p-4" style={{ background: '#131f2e', border: '1px solid #1e3a55' }}>
          <div className="flex items-center gap-2 mb-3">
            <Camera size={14} style={{ color: '#f97316' }} />
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#607080' }}>Фото-подтверждение</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {podPhotos.map((p: any, i: number) => (
              <button
                key={i}
                onClick={() => setSelectedPhoto(p.url)}
                className="relative rounded-2xl overflow-hidden aspect-video"
                style={{ border: '1px solid #1e3a55' }}
              >
                <img src={p.url} alt={p.type === 'loading' ? 'Загрузка' : 'Выгрузка'} className="w-full h-full object-cover" />
                <div className="absolute inset-0 flex items-end p-2" style={{ background: 'linear-gradient(transparent,#0e162199)' }}>
                  <span className="text-[10px] font-bold text-white">
                    {p.type === 'loading' ? '📦 Загрузка' : '✅ Выгрузка'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Last update */}
      <div className="mx-4 mt-3 flex items-center justify-center gap-2">
        <Clock size={11} style={{ color: '#607080' }} />
        <span className="text-[11px]" style={{ color: '#607080' }}>
          Обновлено: {shipment.updatedAt ? new Date(shipment.updatedAt).toLocaleString('ru-RU', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }) : '—'}
          {' · '}Обновляется каждые 15 сек
        </span>
      </div>

      {/* Branding */}
      <div className="mx-4 mt-4 text-center">
        <div className="text-xs font-semibold" style={{ color: '#607080' }}>Работает на платформе</div>
        <div className="text-sm font-black mt-0.5" style={{ color: '#5ba3f5' }}>Ovora Cargo</div>
      </div>

      {/* Photo modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: '#000000cc', backdropFilter: 'blur(8px)' }}
          onClick={() => setSelectedPhoto(null)}
        >
          <img src={selectedPhoto} alt="POD" className="max-w-full max-h-[80vh] rounded-2xl object-contain" />
        </div>
      )}
    </div>
  );
}
