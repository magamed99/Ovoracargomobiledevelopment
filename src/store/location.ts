import { create } from 'zustand';
import { calculateDistance } from '@/utils/geolocation';

export interface DriverLocation {
  driverId: string;
  driverName: string;
  driverAvatar?: string;
  lat: number;
  lng: number;
  heading?: number; // Направление движения в градусах
  speed?: number; // Скорость в км/ч
  lastUpdate: string;
  status: 'online' | 'busy' | 'offline';
  vehicleType?: string;
  availableSeats?: number;
  currentRoute?: {
    from: string;
    to: string;
    departureDate: string;
  };
}

interface LocationState {
  // Местоположения всех водителей
  driverLocations: DriverLocation[];
  
  // Местоположение текущего пользователя
  userLocation: { lat: number; lng: number } | null;
  
  // Активный водитель для отслеживания
  trackingDriverId: string | null;
  
  // Радиус поиска в км
  searchRadius: number;
  
  // Загрузка
  isLoading: boolean;
  
  // Actions
  updateDriverLocation: (location: DriverLocation) => void;
  updateUserLocation: (location: { lat: number; lng: number }) => void;
  setTrackingDriver: (driverId: string | null) => void;
  setSearchRadius: (radius: number) => void;
  fetchNearbyDrivers: (userLat: number, userLng: number, radius: number) => Promise<void>;
  startLocationTracking: () => void;
  stopLocationTracking: () => void;
}

// Моковые данные водителей для демонстрации
const mockDriverLocations: DriverLocation[] = [
  {
    driverId: 'driver1',
    driverName: 'Рахим Юсупов',
    driverAvatar: 'https://i.pravatar.cc/150?u=driver1',
    lat: 38.5598,
    lng: 68.7738,
    heading: 45,
    speed: 60,
    lastUpdate: new Date().toISOString(),
    status: 'online',
    vehicleType: 'Седан',
    availableSeats: 3,
    currentRoute: {
      from: 'Душанбе',
      to: 'Худжанд',
      departureDate: new Date(Date.now() + 3600000).toISOString(),
    },
  },
  {
    driverId: 'driver2',
    driverName: 'Давлат Назаров',
    driverAvatar: 'https://i.pravatar.cc/150?u=driver2',
    lat: 38.5650,
    lng: 68.7800,
    heading: 90,
    speed: 45,
    lastUpdate: new Date().toISOString(),
    status: 'online',
    vehicleType: 'Минивэн',
    availableSeats: 5,
    currentRoute: {
      from: 'Душанбе',
      to: 'Куляб',
      departureDate: new Date(Date.now() + 7200000).toISOString(),
    },
  },
  {
    driverId: 'driver3',
    driverName: 'Фарход Саидов',
    driverAvatar: 'https://i.pravatar.cc/150?u=driver3',
    lat: 38.5520,
    lng: 68.7650,
    heading: 180,
    speed: 50,
    lastUpdate: new Date().toISOString(),
    status: 'busy',
    vehicleType: 'Кроссовер',
    availableSeats: 2,
  },
  {
    driverId: 'driver4',
    driverName: 'Алишер Рахимов',
    driverAvatar: 'https://i.pravatar.cc/150?u=driver4',
    lat: 38.5700,
    lng: 68.7900,
    heading: 270,
    speed: 55,
    lastUpdate: new Date().toISOString(),
    status: 'online',
    vehicleType: 'Грузовик',
    availableSeats: 1,
    currentRoute: {
      from: 'Душанбе',
      to: 'Хорог',
      departureDate: new Date(Date.now() + 10800000).toISOString(),
    },
  },
];

let locationWatchId: number | null = null;

export const useLocationStore = create<LocationState>((set, get) => ({
  driverLocations: [],
  userLocation: null,
  trackingDriverId: null,
  searchRadius: 50, // по умолчанию 50 км
  isLoading: false,

  updateDriverLocation: (location) => {
    set((state) => {
      const existing = state.driverLocations.find(l => l.driverId === location.driverId);
      if (existing) {
        return {
          driverLocations: state.driverLocations.map(l => 
            l.driverId === location.driverId ? location : l
          ),
        };
      } else {
        return {
          driverLocations: [...state.driverLocations, location],
        };
      }
    });
  },

  updateUserLocation: (location) => {
    set({ userLocation: location });
  },

  setTrackingDriver: (driverId) => {
    set({ trackingDriverId: driverId });
  },

  setSearchRadius: (radius) => {
    set({ searchRadius: radius });
  },

  fetchNearbyDrivers: async (userLat, userLng, radius) => {
    set({ isLoading: true });
    try {
      // Симуляция задержки API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Фильтруем водителей в радиусе
      const nearbyDrivers = mockDriverLocations.filter(driver => {
        const distance = calculateDistance(userLat, userLng, driver.lat, driver.lng);
        return distance <= radius;
      });

      set({ 
        driverLocations: nearbyDrivers,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error fetching nearby drivers:', error);
      set({ isLoading: false });
    }
  },

  startLocationTracking: () => {
    if ('geolocation' in navigator) {
      locationWatchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          set({ 
            userLocation: { lat: latitude, lng: longitude }
          });
        },
        (error) => {
          console.error('Error watching location:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        }
      );
    }
  },

  stopLocationTracking: () => {
    if (locationWatchId !== null) {
      navigator.geolocation.clearWatch(locationWatchId);
      locationWatchId = null;
    }
  },
}));