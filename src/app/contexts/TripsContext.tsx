import { createContext, useContext, useState, useEffect, useRef, ReactNode, useMemo } from 'react';
import { getTrips, getCargos, getMyTrips } from '../api/dataApi';

interface TripsContextType {
  trips: any[]; // «feed»: Cargos для Driver, Trips для Sender
  activeTrip: any | null;
  loading: boolean;
  error: string | null;
  refreshTrips: () => Promise<void>;
}

const TripsContext = createContext<TripsContextType | undefined>(undefined);

async function fetchWithRetry(fn: () => Promise<any[]>, retries = 3, delayMs = 1500): Promise<any[]> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      const isNetworkError = err instanceof TypeError && err.message.includes('fetch');
      if (isNetworkError && attempt < retries) {
        const wait = delayMs * Math.pow(2, attempt);
        console.warn(`[TripsContext] Network error, retrying in ${wait}ms (attempt ${attempt + 1}/${retries})...`);
        await new Promise(r => setTimeout(r, wait));
        continue;
      }
      throw err;
    }
  }
  throw new Error('Max retries exceeded');
}

export function TripsProvider({ children }: { children: ReactNode }) {
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // ✅ FIX П-2: Отдельный стейт для активного рейса водителя
  const [driverActiveTrip, setDriverActiveTrip] = useState<any | null>(null);
  const hasCacheRef = useRef(false);

  const loadTrips = async () => {
    try {
      const userRole = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('userRole') : 'sender';

      localStorage.removeItem('ovora_published_trips');
      localStorage.removeItem('ovora_published_cargos');

      let freshItems: any[] = [];
      if (userRole === 'driver') {
        // Driver видит Cargos от отправителей в основном фиде
        freshItems = await fetchWithRetry(getCargos);

        // ✅ FIX П-2: Отдельно загружаем СВОИ рейсы для определения активного
        const email = sessionStorage.getItem('ovora_user_email') || '';
        if (email) {
          try {
            const myTrips = await getMyTrips(email);
            const active = myTrips.find((t: any) =>
              t.status === 'inProgress' ||
              t.status === 'inprogress' ||
              t.status === 'started' ||
              t.status === 'in_progress'
            ) || null;
            setDriverActiveTrip(active);
          } catch {
            // Ошибка загрузки собственных рейсов — не блокируем UX
          }
        }
      } else {
        // Sender видит Trips от водителей
        freshItems = await fetchWithRetry(getTrips);
        setDriverActiveTrip(null);
      }

      const activeItems = freshItems.filter((t: any) =>
        t && !t.deletedAt && t.status !== 'cancelled' && t.status !== 'completed' && t.status !== 'deleted'
      );
      setTrips(activeItems);
      setError(null);
      hasCacheRef.current = true;
    } catch (err: any) {
      console.warn('[TripsContext] Failed to load feed:', err.message);
      if (!hasCacheRef.current) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshTrips = async () => {
    await loadTrips();
  };

  // ✅ FIX П-2: activeTrip берётся из правильного источника по роли
  const activeTrip = useMemo(() => {
    const userEmail = sessionStorage.getItem('ovora_user_email') || '';
    const userRole = sessionStorage.getItem('userRole') || 'sender';

    if (!userEmail) return null;

    if (userRole === 'driver') {
      // Для водителя — активный рейс из его СОБСТВЕННЫХ рейсов (не из фида Cargos)
      return driverActiveTrip;
    }

    // Для отправителя — логика не изменилась (через офферты)
    return null;
  }, [driverActiveTrip]);

  useEffect(() => {
    loadTrips();
    const interval = setInterval(loadTrips, 120000);
    const handleTripUpdate = () => { loadTrips(); };
    window.addEventListener('ovora_trip_update', handleTripUpdate);
    return () => {
      clearInterval(interval);
      window.removeEventListener('ovora_trip_update', handleTripUpdate);
    };
  }, []);

  return (
    <TripsContext.Provider value={{ trips, activeTrip, loading, error, refreshTrips }}>
      {children}
    </TripsContext.Provider>
  );
}

const defaultTripsContext: TripsContextType = {
  trips: [],
  activeTrip: null,
  loading: false,
  error: null,
  refreshTrips: async () => {},
};

export function useTrips() {
  const context = useContext(TripsContext);
  return context ?? defaultTripsContext;
}