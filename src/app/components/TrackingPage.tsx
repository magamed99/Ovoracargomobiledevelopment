/**
 * TrackingPage — роутер.
 * Перенаправляет на DriverTrackingPage или SenderTrackingPage в зависимости от роли.
 */
import { useUser } from '../contexts/UserContext';
import { DriverTrackingPage } from './DriverTrackingPage';
import { SenderTrackingPage } from './SenderTrackingPage';

export function TrackingPage() {
  const { user } = useUser();
  const userRole = user?.role || sessionStorage.getItem('userRole') || 'sender';
  if (userRole === 'driver') return <DriverTrackingPage />;
  return <SenderTrackingPage />;
}
