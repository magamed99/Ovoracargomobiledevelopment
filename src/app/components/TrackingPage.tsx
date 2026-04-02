/**
 * TrackingPage — роутер.
 * Перенаправляет на DriverTrackingPage или SenderTrackingPage в зависимости от роли.
 */
import { DriverTrackingPage } from './DriverTrackingPage';
import { SenderTrackingPage } from './SenderTrackingPage';

export function TrackingPage() {
  const userRole = sessionStorage.getItem('userRole') || 'sender';
  if (userRole === 'driver') return <DriverTrackingPage />;
  return <SenderTrackingPage />;
}
