/**
 * TrackingPage — роутер.
 * Перенаправляет на DriverTrackingPage или SenderTrackingPage в зависимости от роли.
 */
import { useUser } from '../contexts/UserContext';
import { DriverTrackingPage } from './DriverTrackingPage';
import { SenderTrackingPage } from './SenderTrackingPage';
import { SK } from '../constants/storageKeys';

export function TrackingPage() {
  const { user } = useUser();
  const userRole = user?.role || sessionStorage.getItem(SK.USER_ROLE) || 'sender';
  if (userRole === 'driver') return <DriverTrackingPage />;
  return <SenderTrackingPage />;
}
