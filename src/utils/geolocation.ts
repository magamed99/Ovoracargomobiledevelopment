export interface Coordinates {
  lat: number;
  lng: number;
}

export interface GeolocationResult {
  success: boolean;
  coordinates?: Coordinates;
  error?: string;
}

/**
 * Get user's current location using browser Geolocation API
 */
export async function getCurrentLocation(): Promise<GeolocationResult> {
  if (!navigator.geolocation) {
    return {
      success: false,
      error: 'Геолокация не поддерживается вашим браузером',
    };
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          success: true,
          coordinates: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
        });
      },
      (error) => {
        let errorMessage = 'Не удалось получить местоположение';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Доступ к геолокации запрещен';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Информация о местоположении недоступна';
            break;
          case error.TIMEOUT:
            errorMessage = 'Превышено время ожидания запроса';
            break;
        }

        resolve({
          success: false,
          error: errorMessage,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 * 
 * Supports two call signatures:
 * 1. calculateDistance(point1, point2) - with Coordinates objects
 * 2. calculateDistance(lat1, lng1, lat2, lng2) - with individual numbers
 */
export function calculateDistance(
  point1OrLat1: Coordinates | number,
  point2OrLng1: Coordinates | number,
  lat2?: number,
  lng2?: number
): number {
  let point1: Coordinates;
  let point2: Coordinates;

  // Handle both signatures
  if (typeof point1OrLat1 === 'number' && typeof point2OrLng1 === 'number' && lat2 !== undefined && lng2 !== undefined) {
    // Called with: calculateDistance(lat1, lng1, lat2, lng2)
    point1 = { lat: point1OrLat1, lng: point2OrLng1 };
    point2 = { lat: lat2, lng: lng2 };
  } else if (typeof point1OrLat1 === 'object' && typeof point2OrLng1 === 'object') {
    // Called with: calculateDistance(point1, point2)
    point1 = point1OrLat1;
    point2 = point2OrLng1;
  } else {
    console.error('[calculateDistance] Invalid arguments');
    return 0;
  }

  const R = 6371; // Earth's radius in km
  const dLat = toRad(point2.lat - point1.lat);
  const dLng = toRad(point2.lng - point1.lng);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(point1.lat)) *
      Math.cos(toRad(point2.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Get bounds for a circle with given center and radius
 */
export function getCircleBounds(
  center: Coordinates,
  radiusKm: number
): {
  north: number;
  south: number;
  east: number;
  west: number;
} {
  const latChange = radiusKm / 111; // 1 degree latitude ≈ 111 km
  const lngChange = radiusKm / (111 * Math.cos(toRad(center.lat)));

  return {
    north: center.lat + latChange,
    south: center.lat - latChange,
    east: center.lng + lngChange,
    west: center.lng - lngChange,
  };
}

/**
 * Check if a point is within a circle
 */
export function isWithinRadius(
  center: Coordinates,
  point: Coordinates,
  radiusKm: number
): boolean {
  const distance = calculateDistance(center, point);
  return distance <= radiusKm;
}

/**
 * Filter markers within radius from center point
 */
export function filterMarkersInRadius<T extends { lat: number; lng: number }>(
  markers: T[],
  center: Coordinates,
  radiusKm: number
): T[] {
  return markers.filter((marker) =>
    isWithinRadius(center, { lat: marker.lat, lng: marker.lng }, radiusKm)
  );
}

/**
 * Group markers by proximity for clustering
 */
export function groupNearbyMarkers<T extends { lat: number; lng: number }>(
  markers: T[],
  maxDistanceKm: number = 1
): T[][] {
  const groups: T[][] = [];
  const used = new Set<number>();

  markers.forEach((marker, index) => {
    if (used.has(index)) return;

    const group: T[] = [marker];
    used.add(index);

    markers.forEach((otherMarker, otherIndex) => {
      if (used.has(otherIndex)) return;

      const distance = calculateDistance(
        { lat: marker.lat, lng: marker.lng },
        { lat: otherMarker.lat, lng: otherMarker.lng }
      );

      if (distance <= maxDistanceKm) {
        group.push(otherMarker);
        used.add(otherIndex);
      }
    });

    groups.push(group);
  });

  return groups;
}

/**
 * Format coordinates for display
 */
export function formatCoordinates(coords: Coordinates, precision: number = 6): string {
  return `${coords.lat.toFixed(precision)}, ${coords.lng.toFixed(precision)}`;
}

/**
 * Geocoding: Convert address to coordinates (mock implementation)
 * In production, use a real geocoding service like Nominatim, Google Maps, etc.
 */
export async function geocodeAddress(address: string): Promise<GeolocationResult> {
  // Mock implementation - in production, use actual geocoding API
  // For now, return Dushanbe center coordinates
  return {
    success: true,
    coordinates: {
      lat: 38.5598,
      lng: 68.7738,
    },
  };
}

/**
 * Reverse geocoding: Convert coordinates to address (mock implementation)
 */
export async function reverseGeocode(coords: Coordinates): Promise<string> {
  // Mock implementation - in production, use actual reverse geocoding API
  return `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`;
}

/**
 * Check if browser supports geolocation
 */
export function isGeolocationSupported(): boolean {
  return 'geolocation' in navigator;
}

/**
 * Request location permission
 */
export async function requestLocationPermission(): Promise<boolean> {
  if (!isGeolocationSupported()) {
    return false;
  }

  try {
    const result = await getCurrentLocation();
    return result.success;
  } catch {
    return false;
  }
}