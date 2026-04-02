/**
 * TripsPage — роутер.
 * Перенаправляет на DriverTripsPage или SenderTripsPage в зависимости от роли.
 */
import { DriverTripsPage } from './DriverTripsPage';
import { SenderTripsPage } from './SenderTripsPage';

export function TripsPage() {
  const userRole = sessionStorage.getItem('userRole') || 'sender';
  if (userRole === 'driver') return <DriverTripsPage />;
  return <SenderTripsPage />;
}
