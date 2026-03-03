import { useState } from 'react';
import { 
  ChevronLeft, 
  Trash2, 
  Truck,
  Star,
  Wallet,
  Info,
  Car,
  Package
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { useTheme } from '../context/ThemeContext';

interface Notification {
  id: number;
  type: 'trip' | 'system' | 'payment' | 'info';
  icon: any;
  iconBg: string;
  title: string;
  description: string;
  time: string;
  isUnread?: boolean;
}

export function NotificationsPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      type: 'trip',
      icon: Truck,
      iconBg: 'bg-[#1978e5]/10 text-[#1978e5]',
      title: 'Ваш груз прибыл',
      description: 'Груз по маршруту Душанбе — Самара успешно доставлен в пункт выдачи.',
      time: '14:20',
      isUnread: true,
    },
    {
      id: 2,
      type: 'system',
      icon: Star,
      iconBg: 'bg-[#1978e5]/10 text-[#1978e5]',
      title: 'Оценка поездки',
      description: 'Водитель Бахром оценил вашу поездку на 5 звезд. Спасибо, что вы с нами!',
      time: '11:05',
      isUnread: true,
    },
    {
      id: 3,
      type: 'payment',
      icon: Wallet,
      iconBg: 'bg-emerald-500/10 text-emerald-500',
      title: 'Оплата получена',
      description: 'Средства за доставку заказа #4429 зачислены на ваш баланс.',
      time: '09:15',
      isUnread: false,
    },
  ]);

  const yesterdayNotifications: Notification[] = [
    {
      id: 4,
      type: 'info',
      icon: Info,
      iconBg: 'bg-[#1978e5]/10 text-[#1978e5]',
      title: 'Обновление системы',
      description: 'Мы обновили правила страхования грузов. Пожалуйста, ознакомьтесь с ними в профиле.',
      time: 'Вчера',
    },
    {
      id: 5,
      type: 'trip',
      icon: Car,
      iconBg: 'bg-[#1978e5]/10 text-[#1978e5]',
      title: 'Водитель ожидает',
      description: 'Водитель по маршруту Москва — Худжанд прибыл на место сбора.',
      time: 'Вчера',
    },
  ];

  const handleDelete = (id: number) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  return (
    <div className={`min-h-screen flex flex-col pb-24 font-['Sora'] ${
      theme === 'dark' ? 'bg-[#111821]' : 'bg-[#f6f7f8]'
    }`}>
      {/* Status Bar Spacer */}
      <div className={`h-11 sticky top-0 z-50 backdrop-blur-md ${
        theme === 'dark' ? 'bg-[#111821]/80' : 'bg-[#f6f7f8]/80'
      }`} />

      {/* Header */}
      <header className={`sticky top-11 z-40 backdrop-blur-md border-b px-4 py-3 flex items-center justify-between ${
        theme === 'dark'
          ? 'bg-[#111821]/80 border-[#1978e5]/10'
          : 'bg-[#f6f7f8]/80 border-[#1978e5]/10'
      }`}>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="p-1 -ml-1 text-[#1978e5]"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className={`text-xl font-bold tracking-tight ${
            theme === 'dark' ? 'text-white' : 'text-[#0f172a]'
          }`}>
            Уведомления
          </h1>
        </div>
        <button
          onClick={handleClearAll}
          className="text-[#1978e5] font-semibold text-sm hover:opacity-80 transition-opacity"
        >
          Очистить всё
        </button>
      </header>

      <main>
        {/* Section: Сегодня */}
        <section>
          <div className={`px-4 py-3 ${
            theme === 'dark' ? 'bg-[#1978e5]/10' : 'bg-[#1978e5]/5'
          }`}>
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#1978e5]/80">
              Сегодня
            </h2>
          </div>

          {notifications.length === 0 ? (
            <div className={`flex flex-col items-center justify-center py-12 ${
              theme === 'dark' ? 'text-[#64748b]' : 'text-[#64748b]'
            }`}>
              <Package className="w-16 h-16 mb-4 opacity-40" />
              <p className="text-lg font-medium">Нет новых уведомлений</p>
            </div>
          ) : (
            notifications.map((notification) => {
              const Icon = notification.icon;
              return (
                <div key={notification.id} className="relative overflow-hidden group">
                  {/* Delete Action (Background) */}
                  <div className="absolute inset-y-0 right-0 w-20 bg-red-500 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleDelete(notification.id)}>
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Card Content */}
                  <div className={`relative p-4 flex gap-4 border-b transition-transform duration-200 ${
                    theme === 'dark'
                      ? 'bg-[#111821] border-[#1978e5]/5'
                      : 'bg-[#f6f7f8] border-[#1978e5]/5'
                  }`}>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${notification.iconBg}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className={`font-bold text-sm ${
                          theme === 'dark' ? 'text-white' : 'text-[#0f172a]'
                        }`}>
                          {notification.title}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] ${
                            theme === 'dark' ? 'text-[#64748b]' : 'text-[#64748b]'
                          }`}>
                            {notification.time}
                          </span>
                          {notification.isUnread && (
                            <div className="w-2 h-2 rounded-full bg-[#1978e5]" />
                          )}
                        </div>
                      </div>
                      <p className={`text-sm line-clamp-2 ${
                        theme === 'dark' ? 'text-[#94a3b8]' : 'text-[#64748b]'
                      }`}>
                        {notification.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </section>

        {/* Section: Вчера */}
        <section className="mt-4">
          <div className={`px-4 py-3 ${
            theme === 'dark' ? 'bg-[#1978e5]/10' : 'bg-[#1978e5]/5'
          }`}>
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#1978e5]/80">
              Вчера
            </h2>
          </div>

          {yesterdayNotifications.map((notification) => {
            const Icon = notification.icon;
            return (
              <div key={notification.id} className="relative overflow-hidden group">
                <div className={`relative p-4 flex gap-4 border-b ${
                  theme === 'dark'
                    ? 'bg-[#111821] border-[#1978e5]/5'
                    : 'bg-[#f6f7f8] border-[#1978e5]/5'
                }`}>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${notification.iconBg}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className={`font-bold text-sm ${
                        theme === 'dark' ? 'text-white' : 'text-[#0f172a]'
                      }`}>
                        {notification.title}
                      </h3>
                      <span className={`text-[10px] ${
                        theme === 'dark' ? 'text-[#64748b]' : 'text-[#64748b]'
                      }`}>
                        {notification.time}
                      </span>
                    </div>
                    <p className={`text-sm ${
                      theme === 'dark' ? 'text-[#94a3b8]' : 'text-[#64748b]'
                    }`}>
                      {notification.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {/* Promotion Banner */}
        <div className="m-4 rounded-xl overflow-hidden relative h-32 flex flex-col justify-end p-4">
          <img
            alt="Truck on a highway"
            className="absolute inset-0 w-full h-full object-cover"
            src="https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=800&h=400&fit=crop"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
          <div className="relative">
            <h4 className="text-white font-bold text-sm">
              Отправляйте чаще — платите меньше!
            </h4>
            <p className="text-white/80 text-[10px]">
              Ваша персональная скидка 15% на следующую отправку.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
