import { MapMarker } from '../app/components/map/MapView';

/**
 * Generate random coordinates within Tajikistan bounds
 */
function randomCoordInRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/**
 * Generate mock trips for testing map clustering
 * Tajikistan bounds: lat 36.67-41.05, lng 67.34-75.14
 */
export function generateMockMapMarkers(count: number = 50): MapMarker[] {
  const markers: MapMarker[] = [];
  
  const cities = [
    { name: 'Душанбе', lat: 38.5598, lng: 68.7738 },
    { name: 'Худжанд', lat: 40.3848, lng: 69.3450 },
    { name: 'Хорог', lat: 39.0270, lng: 70.9963 },
    { name: 'Курган-Тюбе', lat: 37.8345, lng: 68.7777 },
    { name: 'Турсунзаде', lat: 38.5089, lng: 68.2311 },
    { name: 'Куляб', lat: 37.9126, lng: 69.7849 },
    { name: 'Истаравшан', lat: 39.9141, lng: 69.0026 },
    { name: 'Панджакент', lat: 39.4952, lng: 67.6095 },
  ];

  const types: Array<'driver' | 'trip'> = ['driver', 'trip'];
  
  for (let i = 0; i < count; i++) {
    // Cluster around major cities (80% of markers)
    const isCityCluster = Math.random() < 0.8;
    let lat: number;
    let lng: number;
    
    if (isCityCluster) {
      const city = cities[Math.floor(Math.random() * cities.length)];
      // Add some random offset (±0.1 degrees ≈ ±11km)
      lat = city.lat + (Math.random() - 0.5) * 0.2;
      lng = city.lng + (Math.random() - 0.5) * 0.2;
    } else {
      // Random location in Tajikistan
      lat = randomCoordInRange(36.67, 41.05);
      lng = randomCoordInRange(67.34, 75.14);
    }

    const type = types[Math.floor(Math.random() * types.length)];
    const price = Math.floor(Math.random() * 300) + 50;
    const seats = Math.floor(Math.random() * 4) + 1;

    markers.push({
      id: `marker-${i}`,
      lat,
      lng,
      type,
      title: type === 'driver' ? `Водитель #${i + 1}` : `Поездка #${i + 1}`,
      description: type === 'driver' 
        ? 'Готов к поездке' 
        : 'Поездка с комфортом',
      price: type === 'trip' ? price : undefined,
      currency: 'TJS',
      availableSeats: type === 'trip' ? seats : undefined,
    });
  }

  return markers;
}

/**
 * Generate markers clustered around a specific location
 */
export function generateClusteredMarkers(
  center: { lat: number; lng: number },
  count: number = 20,
  radiusKm: number = 10
): MapMarker[] {
  const markers: MapMarker[] = [];
  const radiusDeg = radiusKm / 111; // Convert km to degrees (approximate)

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * 2 * Math.PI;
    const distance = Math.random() * radiusDeg;
    
    const lat = center.lat + distance * Math.cos(angle);
    const lng = center.lng + distance * Math.sin(angle);

    markers.push({
      id: `clustered-${i}`,
      lat,
      lng,
      type: Math.random() > 0.5 ? 'driver' : 'trip',
      title: `Маркер #${i + 1}`,
      description: 'Рядом с вами',
      price: Math.floor(Math.random() * 200) + 50,
      currency: 'TJS',
    });
  }

  return markers;
}

/**
 * Group markers by city
 */
export function groupMarkersByCity(markers: MapMarker[]): Record<string, MapMarker[]> {
  const cities = {
    'Душанбе': { lat: 38.5598, lng: 68.7738, radius: 0.5 },
    'Худжанд': { lat: 40.3848, lng: 69.3450, radius: 0.5 },
    'Хорог': { lat: 39.0270, lng: 70.9963, radius: 0.5 },
    'Другие': { lat: 0, lng: 0, radius: Infinity },
  };

  const grouped: Record<string, MapMarker[]> = {
    'Душанбе': [],
    'Худжанд': [],
    'Хорог': [],
    'Другие': [],
  };

  markers.forEach((marker) => {
    let assigned = false;
    
    for (const [cityName, city] of Object.entries(cities)) {
      if (cityName === 'Другие') continue;
      
      const distance = Math.sqrt(
        Math.pow(marker.lat - city.lat, 2) + Math.pow(marker.lng - city.lng, 2)
      );
      
      if (distance < city.radius) {
        grouped[cityName].push(marker);
        assigned = true;
        break;
      }
    }
    
    if (!assigned) {
      grouped['Другие'].push(marker);
    }
  });

  return grouped;
}

/**
 * Get marker statistics
 */
export function getMarkerStats(markers: MapMarker[]): {
  total: number;
  drivers: number;
  trips: number;
  users: number;
  avgPrice: number;
} {
  const stats = {
    total: markers.length,
    drivers: 0,
    trips: 0,
    users: 0,
    avgPrice: 0,
  };

  let priceSum = 0;
  let priceCount = 0;

  markers.forEach((marker) => {
    if (marker.type === 'driver') stats.drivers++;
    else if (marker.type === 'trip') stats.trips++;
    else if (marker.type === 'user') stats.users++;

    if (marker.price) {
      priceSum += marker.price;
      priceCount++;
    }
  });

  stats.avgPrice = priceCount > 0 ? Math.round(priceSum / priceCount) : 0;

  return stats;
}
