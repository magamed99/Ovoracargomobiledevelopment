import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../app/components/ui/button';
import { Card } from '../app/components/ui/card';
import { Input } from '../app/components/ui/input';
import { Search, Plus, MapPin, Clock, Star, TrendingUp, Map } from 'lucide-react';
import { useTripStore } from '../store/trips';
import { useAuthStore } from '../store/auth';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

export function HomeScreen() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { trips, fetchTrips } = useTripStore();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchTrips();
  }, []);

  const quickActions = [
    {
      icon: Plus,
      label: 'Создать поездку',
      color: 'bg-blue-600',
      action: () => navigate('/search'), // Интегрировано в SearchPage
    },
    {
      icon: Search,
      label: 'Найти поездку',
      color: 'bg-green-600',
      action: () => navigate('/search'),
    },
    {
      icon: TrendingUp,
      label: 'Мои поездки',
      color: 'bg-purple-600',
      action: () => navigate('/my-trips'),
    },
    {
      icon: Map,
      label: 'Тест карты',
      color: 'bg-orange-600',
      action: () => navigate('/map-test'),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-1">
            Привет, {user?.name || 'Пользователь'}!
          </h1>
          <p className="text-gray-600">Куда планируете поездку?</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Search Bar */}
        <Card className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Поиск поездок..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => navigate('/search')}
              className="pl-10"
            />
          </div>
        </Card>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Быстрые действия</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {quickActions.map((action, index) => (
              <Card
                key={index}
                className="p-4 text-center cursor-pointer hover:shadow-md transition-shadow"
                onClick={action.action}
              >
                <div className={`w-12 h-12 ${action.color} rounded-full flex items-center justify-center mx-auto mb-2`}>
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                <p className="text-sm font-medium">{action.label}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Featured Trips */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Рекомендуемые поездки</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/search')}>
              Все →
            </Button>
          </div>

          <div className="space-y-3">
            {trips.slice(0, 3).map((trip) => (
              <Card
                key={trip.id}
                className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/trip/${trip.id}`)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-blue-600" />
                      <span className="font-semibold">{trip.from.address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{trip.to.address}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">
                      {trip.price} {trip.currency}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>
                      {format(new Date(trip.departureDate), 'd MMM, HH:mm', { locale: ru })}
                    </span>
                  </div>
                  
                  {trip.availableSeats && (
                    <span>{trip.availableSeats} мест</span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}