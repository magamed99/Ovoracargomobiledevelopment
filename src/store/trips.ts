import { create } from 'zustand';
import { Trip, Booking } from '../types';

interface TripState {
  trips: Trip[];
  myTrips: Trip[];
  activeTrip: Trip | null;
  isLoading: boolean;
  fetchTrips: (filters?: any) => Promise<void>;
  fetchMyTrips: () => Promise<void>;
  createTrip: (trip: Omit<Trip, 'id' | 'createdAt' | 'status'>) => Promise<Trip>;
  updateTrip: (id: string, data: Partial<Trip>) => Promise<void>;
  deleteTrip: (id: string) => Promise<void>;
  setActiveTrip: (trip: Trip | null) => void;
}

// Mock data
const mockTrips: Trip[] = [
  {
    id: '1',
    driverId: 'driver1',
    from: { lat: 38.5598, lng: 68.7738, address: 'Душанбе' },
    to: { lat: 40.3848, lng: 69.3450, address: 'Худжанд' },
    departureDate: new Date(Date.now() + 86400000).toISOString(),
    price: 150,
    currency: 'TJS',
    availableSeats: 3,
    status: 'pending',
    description: 'Комфортная поездка с кондиционером',
    createdAt: new Date().toISOString(),
    distance: 340,
    duration: 300,
  },
  {
    id: '2',
    driverId: 'driver2',
    from: { lat: 38.5598, lng: 68.7738, address: 'Душанбе' },
    to: { lat: 39.0270, lng: 70.9963, address: 'Хорог' },
    departureDate: new Date(Date.now() + 172800000).toISOString(),
    price: 250,
    currency: 'TJS',
    availableSeats: 2,
    status: 'pending',
    description: 'Доставка до Хорога через Памир',
    createdAt: new Date().toISOString(),
    distance: 525,
    duration: 480,
  },
];

export const useTripStore = create<TripState>((set, get) => ({
  trips: [],
  myTrips: [],
  activeTrip: null,
  isLoading: false,

  fetchTrips: async (filters) => {
    set({ isLoading: true });
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      set({ trips: mockTrips, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  fetchMyTrips: async () => {
    set({ isLoading: true });
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      set({ myTrips: mockTrips, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  createTrip: async (tripData) => {
    set({ isLoading: true });
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newTrip: Trip = {
        ...tripData,
        id: `trip-${Date.now()}`,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      set(state => ({
        trips: [...state.trips, newTrip],
        myTrips: [...state.myTrips, newTrip],
        isLoading: false,
      }));

      return newTrip;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  updateTrip: async (id, data) => {
    set({ isLoading: true });
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      set(state => ({
        trips: state.trips.map(t => t.id === id ? { ...t, ...data } : t),
        myTrips: state.myTrips.map(t => t.id === id ? { ...t, ...data } : t),
        isLoading: false,
      }));
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  deleteTrip: async (id) => {
    set({ isLoading: true });
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      set(state => ({
        trips: state.trips.filter(t => t.id !== id),
        myTrips: state.myTrips.filter(t => t.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  setActiveTrip: (trip) => set({ activeTrip: trip }),
}));
