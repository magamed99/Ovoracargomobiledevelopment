import React, { useEffect, useState, useRef } from 'react';
import { YMaps, Map, Placemark } from 'react-yandex-maps';
import { YANDEX_MAPS_CONFIG } from '../config/yandex';
import { Navigation, MapPin, Clock, TrendingUp } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface RouteMapProps {
  from: {
    address: string;
    lat: number;
    lng: number;
  };
  to: {
    address: string;
    lat: number;
    lng: number;
  };
  height?: string;
}

/**
 * 🗺️ Компонент отображения маршрута между двумя точками
 * Показывает линию маршрута и информацию о расстоянии
 */
export function RouteMap({ from, to, height = '400px' }: RouteMapProps) {
  const { theme } = useTheme();
  const [routeInfo, setRouteInfo] = useState<{
    distance: string;
    duration: string;
  } | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([
    (from.lat + to.lat) / 2,
    (from.lng + to.lng) / 2,
  ]);
  const [mapZoom, setMapZoom] = useState(8);
  const mapRef = useRef<any>(null);

  // Calculate initial zoom based on straight-line distance (for initial state only)
  useEffect(() => {
    const R = 6371;
    const dLat = toRad(to.lat - from.lat);
    const dLon = toRad(to.lng - from.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(from.lat)) *
        Math.cos(toRad(to.lat)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    const centerLat = (from.lat + to.lat) / 2;
    const centerLng = (from.lng + to.lng) / 2;
    setMapCenter([centerLat, centerLng]);
    let zoom = 8;
    if (distance < 10) zoom = 12;
    else if (distance < 50) zoom = 10;
    else if (distance < 200) zoom = 8;
    else zoom = 6;
    setMapZoom(zoom);
  }, [from, to]);

  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const handleMapLoad = (ymapsInstance: any) => {
    if (!mapRef.current) return;

    const buildRoute = (ymaps: any) => {
      const multiRoute = new ymaps.multiRouter.MultiRoute(
        {
          referencePoints: [
            [from.lat, from.lng],
            [to.lat, to.lng],
          ],
          params: { routingMode: 'auto' },
        },
        {
          boundsAutoApply: true,
          routeActiveStrokeColor: '#5ba3f5',
          routeActiveStrokeWidth: 6,
          routeStrokeStyle: 'solid',
          routeActiveStrokeStyle: 'solid',
          wayPointVisible: false,
        }
      );

      mapRef.current.geoObjects.add(multiRoute);

      multiRoute.model.events.add('requestsuccess', () => {
        const activeRoute = multiRoute.getActiveRoute();
        if (activeRoute) {
          const dist = activeRoute.properties.get('distance');
          const dur  = activeRoute.properties.get('duration');
          const distKm = Math.round((dist?.value ?? 0) / 1000);
          const durMin = Math.round((dur?.value  ?? 0) / 60);
          const durText =
            durMin < 60
              ? `${durMin} мин`
              : `${Math.floor(durMin / 60)} ч ${durMin % 60} мин`;
          setRouteInfo({ distance: `${distKm} км`, duration: durText });
        }
      });
    };

    if (ymapsInstance?.multiRouter) {
      buildRoute(ymapsInstance);
    } else {
      // Ждём загрузки модуля multiRouter
      (ymapsInstance || (window as any).ymaps)?.modules?.require(
        ['multiRouter.MultiRoute'],
        () => buildRoute((window as any).ymaps)
      );
    }
  };

  return (
    <div className="space-y-3">
      {/* Route Info */}
      {routeInfo && (
        <div className={`grid grid-cols-2 gap-3`}>
          <div className={`p-3 rounded-lg ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
          }`}>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Расстояние
              </span>
            </div>
            <p className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {routeInfo.distance}
            </p>
          </div>

          <div className={`p-3 rounded-lg ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
          }`}>
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-green-500" />
              <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                В пути
              </span>
            </div>
            <p className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {routeInfo.duration}
            </p>
          </div>
        </div>
      )}

      {/* Map */}
      <div className={`rounded-xl overflow-hidden border ${
        theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
      } shadow-lg`}>
        <YMaps query={{ apikey: YANDEX_MAPS_CONFIG.apiKey, lang: 'ru_RU', load: 'package.full' }}>
          <Map
            defaultState={{
              center: mapCenter,
              zoom: mapZoom,
            }}
            width="100%"
            height={height}
            instanceRef={mapRef}
            onLoad={handleMapLoad}
          >
            {/* Point A - Start */}
            <Placemark
              geometry={[from.lat, from.lng]}
              options={{
                preset: 'islands#greenCircleDotIcon',
                iconColor: '#10b981',
              }}
              properties={{
                hintContent: 'Откуда: ' + from.address,
                balloonContent: `<strong>Точка А (Откуда)</strong><br/>${from.address}`,
              }}
            />

            {/* Point B - Destination */}
            <Placemark
              geometry={[to.lat, to.lng]}
              options={{
                preset: 'islands#redCircleDotIcon',
                iconColor: '#ef4444',
              }}
              properties={{
                hintContent: 'Куда: ' + to.address,
                balloonContent: `<strong>Точка Б (Куда)</strong><br/>${to.address}`,
              }}
            />
          </Map>
        </YMaps>
      </div>

      {/* Addresses */}
      <div className="space-y-2">
        <div className={`flex items-start gap-3 p-3 rounded-lg ${
          theme === 'dark' ? 'bg-green-500/10' : 'bg-green-50'
        }`}>
          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white font-bold shrink-0">
            А
          </div>
          <div>
            <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
              Откуда
            </p>
            <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {from.address}
            </p>
          </div>
        </div>

        <div className={`flex items-start gap-3 p-3 rounded-lg ${
          theme === 'dark' ? 'bg-red-500/10' : 'bg-red-50'
        }`}>
          <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white font-bold shrink-0">
            Б
          </div>
          <div>
            <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
              Куда
            </p>
            <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {to.address}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}