import { useState, useCallback, useEffect } from 'react';

const KEY = 'ovora_favorites';

export interface FavoriteTrip {
  id: string;
  from: string;
  to: string;
  date: string;
  time: string;
  pricePerSeat?: number;
  pricePerKg?: number;
  driverName?: string;
  availableSeats?: number;
  cargoCapacity?: number;
  savedAt: string;
}

function load(): FavoriteTrip[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}

function save(items: FavoriteTrip[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteTrip[]>(load);

  // Sync if changed in another tab
  useEffect(() => {
    const onStorage = () => setFavorites(load());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const isFavorite = useCallback((id: string) =>
    favorites.some(f => f.id === id), [favorites]);

  const toggle = useCallback((trip: Omit<FavoriteTrip, 'savedAt'>) => {
    setFavorites(prev => {
      const exists = prev.some(f => f.id === trip.id);
      const next = exists
        ? prev.filter(f => f.id !== trip.id)
        : [{ ...trip, savedAt: new Date().toISOString() }, ...prev];
      save(next);
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setFavorites(prev => {
      const next = prev.filter(f => f.id !== id);
      save(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    save([]);
    setFavorites([]);
  }, []);

  return { favorites, isFavorite, toggle, remove, clear };
}
