import { Location } from '../types';
import { calculateDistance as calcDist } from '@/utils/geolocation';

export class LocationService {
  private watchId: number | null = null;

  async requestPermission(): Promise<boolean> {
    if (!('geolocation' in navigator)) {
      return false;
    }

    try {
      const position = await this.getCurrentPosition();
      return !!position;
    } catch (error) {
      console.error('Location permission denied:', error);
      return false;
    }
  }

  getCurrentPosition(): Promise<Location> {
    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }

  watchPosition(callback: (location: Location) => void): void {
    if (!('geolocation' in navigator)) {
      return;
    }

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        callback({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        console.error('Watch position error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    );
  }

  stopWatching(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  calculateDistance(from: Location, to: Location): number {
    return calcDist(from, to);
  }

  async geocodeAddress(address: string): Promise<Location | null> {
    // In production, use a real geocoding service like Google Maps or Mapbox
    // For now, return mock data
    return new Promise((resolve) => {
      setTimeout(() => {
        // Mock geocoding
        const mockLocations: Record<string, Location> = {
          'Душанбе': { lat: 38.5598, lng: 68.7738, address: 'Душанбе' },
          'Худжанд': { lat: 40.3848, lng: 69.3450, address: 'Худжанд' },
          'Хорог': { lat: 37.4899, lng: 71.5554, address: 'Хорог' },
          'Куляб': { lat: 37.9144, lng: 69.7849, address: 'Куляб' },
        };

        resolve(mockLocations[address] || null);
      }, 500);
    });
  }

  async reverseGeocode(location: Location): Promise<string> {
    // In production, use a real reverse geocoding service
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`);
      }, 500);
    });
  }
}

export const locationService = new LocationService();