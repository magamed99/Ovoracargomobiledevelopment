import { Outlet, Link, useLocation } from 'react-router';
import { Home, Search, Package, MessageSquare, User } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const navigation = [
  { name: 'Главная', href: '/dashboard', icon: Home },
  { name: 'Поиск', href: '/search', icon: Search },
  { name: 'Поездки', href: '/trips', icon: Package },
  { name: 'Чат', href: '/messages', icon: MessageSquare },
  { name: 'Профиль', href: '/profile', icon: User },
];

export function MobileLayout() {
  const location = useLocation();
  const { theme } = useTheme();
  const userRole = localStorage.getItem('userRole') || 'sender';

  // Update navigation based on user role
  const nav = [...navigation];
  if (userRole === 'driver') {
    nav[1] = { name: 'Создать', href: '/search', icon: Search };
  }

  return (
    <div className={`min-h-screen flex flex-col ${
      theme === 'dark' ? 'bg-[#111821]' : 'bg-[#f6f7f8]'
    }`}>
      {/* Main content with proper spacing */}
      <main className="flex-1 pb-20 overflow-y-auto">
        <Outlet />
      </main>

      {/* Bottom navigation - optimized for all phones */}
      <nav className={`fixed bottom-0 left-0 right-0 border-t z-50 shadow-lg ${
        theme === 'dark'
          ? 'bg-[#111821] border-[#2a424a]'
          : 'bg-white border-gray-200'
      }`} style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="grid grid-cols-5 items-center max-w-screen-xl mx-auto">
          {nav.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex flex-col items-center justify-center py-2 px-1 min-h-[60px] touch-target transition-all ${
                  isActive
                    ? 'text-blue-600'
                    : theme === 'dark'
                      ? 'text-gray-400 active:bg-white/10'
                      : 'text-gray-600 active:bg-gray-100'
                }`}
              >
                <div className="relative mb-1">
                  <item.icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                  {isActive && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full" />
                  )}
                </div>
                <span className={`text-[10px] sm:text-xs font-medium text-center leading-tight ${
                  isActive 
                    ? 'text-blue-600' 
                    : theme === 'dark' 
                      ? 'text-gray-400' 
                      : 'text-gray-600'
                }`}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}