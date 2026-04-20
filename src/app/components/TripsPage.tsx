/**
 * TripsPage — роутер.
 * Перенаправляет на DriverTripsPage или SenderTripsPage в зависимости от роли.
 */
import { useUser } from '../contexts/UserContext';
import { DriverTripsPage } from './DriverTripsPage';
import { SenderTripsPage } from './SenderTripsPage';

export function TripsPage() {
  const { user } = useUser();
  // Prefer reactive context value; fall back to sessionStorage during context hydration
  const userRole = user?.role || sessionStorage.getItem('userRole') || 'sender';
  if (userRole === 'driver') return <DriverTripsPage />;
  return <SenderTripsPage />;
}
