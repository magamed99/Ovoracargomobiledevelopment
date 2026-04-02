import React, { useState, useEffect } from 'react';
import { YMaps, Map, Placemark, Polyline } from 'react-yandex-maps';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { 
  MapPin, 
  Navigation, 
  Save, 
  Trash2,
  Plus,
  Locate,
  Route
} from 'lucide-react';
import { toast } from 'sonner';
import { useLocationStore } from '../../store/location';
import { TAJIKISTAN_CITIES } from '../../utils/yandexMaps';
import { YANDEX_MAPS_CONFIG } from '../../config/yandex';

interface RoutePoint {
  lat: number;
  lng: number;
  address: string;
}

/**
 * Компонент для водителя, чтобы установить свой маршрут
 * Водитель может:
 * - Установить точки маршрута (откуда, куда, промежуточные точки)
 * - Включить отслеживание местоположения
 * - Сохранить маршрут
 */
export function DriverRouteMap() {
  const { userLocation, startLocationTracking, stopLocationTracking } = useLocationStore();
  
  const [isTracking, setIsTracking] = useState(false);
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
  const [fromAddress, setFromAddress] = useState('');
  const [toAddress, setToAddress] = useState('');
  const [mapState, setMapState] = useState({
    center: [38.5598, 68.7738] as [number, number],
    zoom: 13,
  });

  useEffect(() => {
    // Получаем текущее местоположение при загрузке (с проверкой разрешений)
    if ('geolocation' in navigator && 'permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'granted' || result.state === 'prompt') {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude } = position.coords;
              setMapState({
                center: [latitude, longitude],
                zoom: 13,
              });
            },
            () => {
              // Silently handle - will use default center
            }
          );
        }
      }).catch(() => {
        // Permissions API not available - skip
      });
    } else if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setMapState({
            center: [latitude, longitude],
            zoom: 13,
          });
        },
        () => {} // Silently fail
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (userLocation) {
      setMapState(prev => ({
        ...prev,
        center: [userLocation.lat, userLocation.lng],
      }));
    }
    // Only update when lat/lng actually changes, not when object reference changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation?.lat, userLocation?.lng]);

  const handleStartTracking = () => {
    startLocationTracking();
    setIsTracking(true);
    toast.success('Отслеживание местоположения включено');
  };

  const handleStopTracking = () => {
    stopLocationTracking();
    setIsTracking(false);
    toast.info('Отслеживание местоположения выключено');
  };

  const handleAddRoutePoint = (lat: number, lng: number, address: string) => {
    setRoutePoints([...routePoints, { lat, lng, address }]);
    toast.success(`Добавлена точка: ${address}`);
  };

  const handleRemoveRoutePoint = (index: number) => {
    setRoutePoints(routePoints.filter((_, i) => i !== index));
    toast.info('Точка удалена');
  };

  const handleSelectCity = (cityKey: string, isFrom: boolean) => {
    const city = TAJIKISTAN_CITIES[cityKey as keyof typeof TAJIKISTAN_CITIES];
    if (city) {
      if (isFrom) {
        setFromAddress(city.name);
        setRoutePoints([{ lat: city.lat, lng: city.lng, address: city.name }]);
      } else {
        setToAddress(city.name);
        setRoutePoints([...routePoints, { lat: city.lat, lng: city.lng, address: city.name }]);
      }
      setMapState({
        center: [city.lat, city.lng],
        zoom: 12,
      });
    }
  };

  const handleSaveRoute = () => {
    if (routePoints.length < 2) {
      toast.error('Добавьте минимум 2 точки маршрута');
      return;
    }

    // Здесь должна быть логика сохранения маршрута в базу данных
    console.log('Saving route:', { routePoints, fromAddress, toAddress });
    toast.success('Маршрут сохранен!');
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Заголовок */}
      <div className="bg-white border-b px-4 py-3">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Route className="w-6 h-6 text-blue-600" />
          Настройка маршрута
        </h1>
      </div>

      {/* Карта */}
      <div className="flex-1 relative">
        <YMaps
          query={{
            apikey: YANDEX_MAPS_CONFIG.apiKey,
            lang: YANDEX_MAPS_CONFIG.lang,
            load: 'package.full',
          }}
        >
          <Map
            state={mapState}
            width="100%"
            height="100%"
            modules={['geoObject.addon.balloon', 'geoObject.addon.hint']}
            options={{
              suppressMapOpenBlock: true,
            }}
          >
            {/* Текущее местоположение водителя */}
            {userLocation && (
              <Placemark
                geometry={[userLocation.lat, userLocation.lng]}
                properties={{
                  hintContent: 'Вы здесь',
                  balloonContent: '<strong>Ваше текущее местоположение</strong>',
                }}
                options={{
                  preset: 'islands#blueCarIcon',
                  iconColor: '#10b981',
                }}
              />
            )}

            {/* Точки маршрута */}
            {routePoints.map((point, index) => (
              <Placemark
                key={index}
                geometry={[point.lat, point.lng]}
                properties={{
                  hintContent: point.address,
                  balloonContent: `
                    <div style="padding: 8px;">
                      <strong>${index === 0 ? 'Начало' : index === routePoints.length - 1 ? 'Конец' : `Точка ${index + 1}`}</strong>
                      <p style="margin: 4px 0 0 0;">${point.address}</p>
                    </div>
                  `,
                }}
                options={{
                  preset: index === 0 
                    ? 'islands#greenDotIcon' 
                    : index === routePoints.length - 1 
                      ? 'islands#redDotIcon' 
                      : 'islands#blueDotIcon',
                }}
              />
            ))}

            {/* Линия маршрута */}
            {routePoints.length > 1 && (
              <Polyline
                geometry={routePoints.map(p => [p.lat, p.lng])}
                options={{
                  strokeColor: '#1978e5',
                  strokeWidth: 4,
                  strokeOpacity: 0.7,
                }}
              />
            )}
          </Map>
        </YMaps>

        {/* Кнопка центрирования */}
        {userLocation && (
          <Button
            variant="outline"
            size="icon"
            className="absolute bottom-4 right-4 bg-white shadow-lg"
            onClick={() => {
              setMapState({
                center: [userLocation.lat, userLocation.lng],
                zoom: 13,
              });
            }}
          >
            <Locate className="w-5 h-5" />
          </Button>
        )}

        {/* Статус отслеживания */}
        <Card className="absolute top-4 left-4 right-4 p-3 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isTracking ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
              <span className="text-sm font-medium">
                {isTracking ? 'Отслеживание включено' : 'Отслеживание выключено'}
              </span>
            </div>
            <Button
              size="sm"
              variant={isTracking ? 'destructive' : 'default'}
              onClick={isTracking ? handleStopTracking : handleStartTracking}
            >
              <Navigation className="w-4 h-4 mr-2" />
              {isTracking ? 'Выключить' : 'Включить'}
            </Button>
          </div>
        </Card>
      </div>

      {/* Панель управления маршрутом */}
      <Card className="m-4 p-4 shadow-lg max-h-64 overflow-y-auto">
        <h2 className="font-bold text-lg mb-3 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-600" />
          Маршрут
        </h2>

        {/* Быстрый выбор городов */}
        <div className="mb-4">
          <Label className="text-xs text-gray-600 mb-2 block">Быстрый выбор:</Label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(TAJIKISTAN_CITIES).slice(0, 5).map(([key, city]) => (
              <Button
                key={key}
                variant="outline"
                size="sm"
                onClick={() => handleSelectCity(key, routePoints.length === 0)}
                className="text-xs"
              >
                {city.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Список точек маршрута */}
        {routePoints.length > 0 && (
          <div className="space-y-2 mb-4">
            {routePoints.map((point, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                  index === 0 ? 'bg-green-500' : index === routePoints.length - 1 ? 'bg-red-500' : 'bg-blue-500'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{point.address}</p>
                  <p className="text-xs text-gray-500">
                    {point.lat.toFixed(4)}, {point.lng.toFixed(4)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveRoutePoint(index)}
                  className="flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Информация */}
        {routePoints.length === 0 && (
          <div className="text-center py-6 text-gray-500">
            <MapPin className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Выберите города для построения маршрута</p>
          </div>
        )}

        {/* Кнопка сохранения */}
        <Button
          className="w-full"
          onClick={handleSaveRoute}
          disabled={routePoints.length < 2}
        >
          <Save className="w-4 h-4 mr-2" />
          Сохранить маршрут
        </Button>
      </Card>
    </div>
  );
}