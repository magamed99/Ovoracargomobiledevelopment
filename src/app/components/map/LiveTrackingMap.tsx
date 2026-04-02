import React, { useEffect, useState } from 'react';
import { YMaps, Map, Placemark, Polyline } from 'react-yandex-maps';
import { useLocationStore, DriverLocation } from '../../store/location';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { 
  Navigation, 
  Phone, 
  MessageCircle, 
  MapPin, 
  Clock,
  Car,
  Users,
  X,
  Locate
} from 'lucide-react';
import { formatDistance } from '../../utils/yandexMaps';
import { calculateDistance } from '@/utils/geolocation';
import { toast } from 'sonner';
import { YANDEX_MAPS_CONFIG } from '../../config/yandex';

interface LiveTrackingMapProps {
  driverId: string;
  onClose?: () => void;
}

/**
 * Компонент для отслеживания местоположения водителя в реальном времени
 * Используется отправителями для мониторинга поездки
 */
export function LiveTrackingMap({ driverId, onClose }: LiveTrackingMapProps) {
  const { 
    driverLocations, 
    userLocation, 
    updateUserLocation,
    startLocationTracking,
    stopLocationTracking
  } = useLocationStore();

  const [mapState, setMapState] = useState({
    center: [38.5598, 68.7738] as [number, number],
    zoom: 13,
  });

  const driver = driverLocations.find(d => d.driverId === driverId);

  useEffect(() => {
    // Запускаем отслеживание местоположения пользователя
    startLocationTracking();

    // Получаем текущее местоположение пользователя (с проверкой разрешений)
    if ('geolocation' in navigator && 'permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'granted' || result.state === 'prompt') {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              updateUserLocation({
                lat: position.coords.latitude,
                lng: position.coords.longitude,
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
          updateUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {} // Silently fail
      );
    }

    return () => {
      stopLocationTracking();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (driver) {
      setMapState({
        center: [driver.lat, driver.lng],
        zoom: 14,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driver?.driverId, driver?.lat, driver?.lng]);

  if (!driver) {
    return (
      <Card className="p-6">
        <p className="text-gray-600">Водитель не найден</p>
      </Card>
    );
  }

  const distanceToDriver = userLocation
    ? calculateDistance(
        userLocation.lat,
        userLocation.lng,
        driver.lat,
        driver.lng
      )
    : null;

  return (
    <div className="h-screen flex flex-col bg-gray-50">
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
            {/* Маркер водителя */}
            <Placemark
              geometry={[driver.lat, driver.lng]}
              properties={{
                balloonContent: createDriverBalloon(driver),
                hintContent: driver.driverName,
              }}
              options={{
                preset: 'islands#blueCarIcon',
                iconColor: driver.status === 'online' ? '#10b981' : '#ef4444',
              }}
            />

            {/* Маркер пользователя */}
            {userLocation && (
              <Placemark
                geometry={[userLocation.lat, userLocation.lng]}
                properties={{
                  hintContent: 'Вы здесь',
                }}
                options={{
                  preset: 'islands#redPersonIcon',
                }}
              />
            )}

            {/* Линия между пользователем и водителем */}
            {userLocation && (
              <Polyline
                geometry={[
                  [userLocation.lat, userLocation.lng],
                  [driver.lat, driver.lng],
                ]}
                options={{
                  strokeColor: '#1978e5',
                  strokeWidth: 3,
                  strokeStyle: 'shortdash',
                  strokeOpacity: 0.6,
                }}
              />
            )}
          </Map>
        </YMaps>

        {/* Кнопка закрытия */}
        {onClose && (
          <Button
            variant="outline"
            size="icon"
            className="absolute top-4 right-4 bg-white shadow-lg"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>
        )}

        {/* Кнопка центрирования на водителе */}
        <Button
          variant="outline"
          size="icon"
          className="absolute bottom-24 right-4 bg-white shadow-lg"
          onClick={() => {
            setMapState({
              center: [driver.lat, driver.lng],
              zoom: 14,
            });
          }}
        >
          <Locate className="w-5 h-5" />
        </Button>
      </div>

      {/* Информационная панель */}
      <Card className="m-4 p-4 shadow-lg">
        <div className="flex items-start gap-3">
          {/* Аватар водителя */}
          <Avatar className="w-16 h-16">
            <AvatarImage src={driver.driverAvatar} alt={driver.driverName} />
            <AvatarFallback>
              {driver.driverName.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            {/* Имя и статус */}
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="font-bold text-lg">{driver.driverName}</h3>
                <div className="flex items-center gap-2 text-sm">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      driver.status === 'online' ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  />
                  <span className="text-gray-600">
                    {driver.status === 'online' ? 'В сети' : 'Занят'}
                  </span>
                </div>
              </div>
              <div className="text-right">
                {distanceToDriver !== null && (
                  <div className="text-lg font-bold text-blue-600">
                    {formatDistance(distanceToDriver)}
                  </div>
                )}
                <div className="text-xs text-gray-500">до вас</div>
              </div>
            </div>

            {/* Информация о транспорте */}
            <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
              {driver.vehicleType && (
                <div className="flex items-center gap-1 text-gray-600">
                  <Car className="w-4 h-4" />
                  <span>{driver.vehicleType}</span>
                </div>
              )}
              {driver.availableSeats && (
                <div className="flex items-center gap-1 text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>{driver.availableSeats} мест</span>
                </div>
              )}
              {driver.speed && (
                <div className="flex items-center gap-1 text-gray-600">
                  <Navigation className="w-4 h-4" />
                  <span>{driver.speed} км/ч</span>
                </div>
              )}
            </div>

            {/* Маршрут */}
            {driver.currentRoute && (
              <div className="bg-blue-50 rounded-lg p-2 mb-3 text-sm">
                <div className="flex items-center gap-2 text-gray-700">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <div className="flex-1">
                    <span className="font-medium">{driver.currentRoute.from}</span>
                    <span className="mx-2">→</span>
                    <span className="font-medium">{driver.currentRoute.to}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-gray-600 mt-1 ml-6">
                  <Clock className="w-3 h-3" />
                  <span className="text-xs">
                    Отправление: {new Date(driver.currentRoute.departureDate).toLocaleString('ru-RU', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            )}

            {/* Кнопки действий */}
            <div className="flex gap-2">
              <Button className="flex-1" size="sm">
                <Phone className="w-4 h-4 mr-2" />
                Позвонить
              </Button>
              <Button variant="outline" className="flex-1" size="sm">
                <MessageCircle className="w-4 h-4 mr-2" />
                Написать
              </Button>
            </div>
          </div>
        </div>

        {/* Время последнего обновления */}
        <div className="mt-3 pt-3 border-t text-xs text-gray-500 text-center">
          Обновлено: {new Date(driver.lastUpdate).toLocaleTimeString('ru-RU')}
        </div>
      </Card>
    </div>
  );
}

function createDriverBalloon(driver: DriverLocation): string {
  let content = `<div style="padding: 12px; min-width: 200px; font-family: 'Sora', system-ui, sans-serif;">`;
  content += `<h3 style="font-weight: bold; margin-bottom: 8px; font-size: 16px;">${driver.driverName}</h3>`;
  
  if (driver.vehicleType) {
    content += `<p style="color: #666; font-size: 14px; margin-bottom: 4px;">🚗 ${driver.vehicleType}</p>`;
  }
  
  if (driver.speed) {
    content += `<p style="color: #666; font-size: 14px; margin-bottom: 4px;">⚡ ${driver.speed} км/ч</p>`;
  }
  
  if (driver.availableSeats) {
    content += `<p style="color: #666; font-size: 14px;">👥 ${driver.availableSeats} свободных мест</p>`;
  }
  
  content += `</div>`;
  return content;
}