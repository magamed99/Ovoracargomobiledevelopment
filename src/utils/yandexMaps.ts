/**
 * Утилиты для работы с Яндекс картами
 */

import { calculateDistance as calcDistanceBase } from './geolocation';

export interface YandexCoordinates {
  lat: number;
  lng: number;
}

/**
 * Рассчитывает расстояние между двумя точками в километрах
 * Использует общую утилиту из geolocation
 */
export function calculateDistance(
  point1: YandexCoordinates,
  point2: YandexCoordinates
): number {
  return calcDistanceBase(point1, point2);
}

/**
 * Координаты основных городов Таджикистана
 */
export const TAJIKISTAN_CITIES = {
  dushanbe: { lat: 38.5598, lng: 68.7738, name: 'Душанбе' },
  khujand: { lat: 40.2828, lng: 69.6229, name: 'Худжанд' },
  kulob: { lat: 37.9144, lng: 69.7814, name: 'Куляб' },
  qurghonteppa: { lat: 37.8351, lng: 68.7819, name: 'Курган-Тюбе' },
  khorog: { lat: 37.4897, lng: 71.5536, name: 'Хорог' },
  istaravshan: { lat: 39.9142, lng: 69.0033, name: 'Истаравшан' },
  tursunzoda: { lat: 38.5094, lng: 68.2311, name: 'Турсунзаде' },
  vahdat: { lat: 38.5569, lng: 69.0153, name: 'Вахдат' },
  panjakent: { lat: 39.4950, lng: 67.6097, name: 'Пенджикент' },
  isfara: { lat: 40.1256, lng: 70.6250, name: 'Исфара' },
};

/**
 * Границы Таджикистана для ограничения области карты
 */
export const TAJIKISTAN_BOUNDS = {
  southwest: { lat: 36.67, lng: 67.34 },
  northeast: { lat: 41.04, lng: 75.14 },
};

/**
 * Центр Таджикистана (Душанбе)
 */
export const TAJIKISTAN_CENTER: YandexCoordinates = {
  lat: 38.5598,
  lng: 68.7738,
};

/**
 * Проверяет, находятся ли координаты в пределах Таджикистана
 */
export function isInTajikistan(coords: YandexCoordinates): boolean {
  return (
    coords.lat >= TAJIKISTAN_BOUNDS.southwest.lat &&
    coords.lat <= TAJIKISTAN_BOUNDS.northeast.lat &&
    coords.lng >= TAJIKISTAN_BOUNDS.southwest.lng &&
    coords.lng <= TAJIKISTAN_BOUNDS.northeast.lng
  );
}

/**
 * Находит ближайший город к заданным координатам
 */
export function findNearestCity(coords: YandexCoordinates): {
  name: string;
  distance: number;
  coords: YandexCoordinates;
} | null {
  let nearest: { name: string; distance: number; coords: YandexCoordinates } | null = null;
  let minDistance = Infinity;

  Object.entries(TAJIKISTAN_CITIES).forEach(([key, city]) => {
    const distance = calculateDistance(coords, { lat: city.lat, lng: city.lng });
    if (distance < minDistance) {
      minDistance = distance;
      nearest = {
        name: city.name,
        distance,
        coords: { lat: city.lat, lng: city.lng },
      };
    }
  });

  return nearest;
}

/**
 * Форматирует расстояние для отображения
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} м`;
  }
  return `${km} км`;
}

/**
 * Генерирует URL для статической карты Яндекс
 */
export function generateStaticMapUrl(
  coords: YandexCoordinates,
  zoom: number = 13,
  width: number = 600,
  height: number = 400
): string {
  return `https://static-maps.yandex.ru/1.x/?ll=${coords.lng},${coords.lat}&size=${width},${height}&z=${zoom}&l=map&pt=${coords.lng},${coords.lat},pm2rdm`;
}

/**
 * Преобразует адрес в координаты (требует API ключ)
 * В реальном приложении это должно использовать Geocoding API
 */
export async function geocodeAddress(address: string): Promise<YandexCoordinates | null> {
  // Заглушка - в реальном приложении здесь будет вызов API
  console.log('Geocoding address:', address);
  
  // Для демонстрации возвращаем координаты Душанбе
  return TAJIKISTAN_CENTER;
}

/**
 * Преобразует координаты в адрес (требует API ключ)
 * В реальном приложении это должно использовать Reverse Geocoding API
 */
export async function reverseGeocode(coords: YandexCoordinates): Promise<string | null> {
  // Заглушка - в реальном приложении здесь будет вызов API
  console.log('Reverse geocoding:', coords);
  
  const nearest = findNearestCity(coords);
  return nearest ? nearest.name : 'Неизвестное местоположение';
}
