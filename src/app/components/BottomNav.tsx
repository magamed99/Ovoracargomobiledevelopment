import { Home as HomeIcon, Truck, MessageSquare, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router';
import { useTheme } from '../context/ThemeContext';

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme } = useTheme();

  const navItems = [
    {
      icon: HomeIcon,
      label: 'Главная',
      path: '/dashboard',
    },
    {
      icon: Truck,
      label: 'Поездки',
      path: '/trips',
    },
    {
      icon: MessageSquare,
      label: 'Чаты',
      path: '/messages',
      badge: 2,
    },
    {
      icon: User,
      label: 'Профиль',
      path: '/profile',
    },
  ];

  return (
    null
  );
}
