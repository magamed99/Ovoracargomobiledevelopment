import { useState } from 'react';
import { 
  Search, 
  Filter, 
  MapPin,
  Clock,
  DollarSign,
  Package,
  User,
  Car,
  Calendar,
  Eye,
  XCircle,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';

interface Trip {
  id: string;
  driver: {
    name: string;
    phone: string;
    avatar: string;
  };
  passenger: {
    name: string;
    phone: string;
    avatar: string;
  };
  pickup: string;
  dropoff: string;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  type: 'passenger' | 'cargo';
  price: string;
  distance: string;
  duration: string;
  date: string;
  time: string;
  paymentMethod: 'cash' | 'card';
}

const mockTrips: Trip[] = [
  {
    id: 'TR-1234',
    driver: { name: 'Алишер Рахимов', phone: '+992 92 123 4567', avatar: 'АР' },
    passenger: { name: 'Фарход Юсупов', phone: '+992 92 111 2222', avatar: 'ФЮ' },
    pickup: 'ул. Рудаки, 54, Душанбе',
    dropoff: 'пр. Ленина, 12, Худжанд',
    status: 'active',
    type: 'passenger',
    price: '250 ТЖС',
    distance: '342 км',
    duration: '5 ч 20 мин',
    date: '27.02.2026',
    time: '14:30',
    paymentMethod: 'card'
  },
  {
    id: 'TR-1235',
    driver: { name: 'Мурод Каримов', phone: '+992 93 234 5678', avatar: 'МК' },
    passenger: { name: 'Зарина Саидова', phone: '+992 93 222 3333', avatar: 'ЗС' },
    pickup: 'ул. Исмоили Сомони, 23, Душанбе',
    dropoff: 'ул. Айни, 89, Куляб',
    status: 'completed',
    type: 'cargo',
    price: '180 ТЖС',
    distance: '198 км',
    duration: '3 ч 45 мин',
    date: '27.02.2026',
    time: '10:15',
    paymentMethod: 'cash'
  },
  {
    id: 'TR-1236',
    driver: { name: 'Сухроб Назаров', phone: '+992 90 345 6789', avatar: 'СН' },
    passenger: { name: 'Дилшод Азимов', phone: '+992 90 333 4444', avatar: 'ДА' },
    pickup: 'пр. Ленина, 45, Худжанд',
    dropoff: 'ул. Рудаки, 78, Душанбе',
    status: 'cancelled',
    type: 'passenger',
    price: '260 ТЖС',
    distance: '342 км',
    duration: '5 ч 30 мин',
    date: '27.02.2026',
    time: '08:00',
    paymentMethod: 'card'
  },
  {
    id: 'TR-1237',
    driver: { name: 'Джамшед Исмоилов', phone: '+992 91 456 7890', avatar: 'ДИ' },
    passenger: { name: 'Нозанин Раджабова', phone: '+992 91 444 5555', avatar: 'НР' },
    pickup: 'ул. Шевченко, 12, Душанбе',
    dropoff: 'ул. Ленинабад, 34, Курган-Тюбе',
    status: 'scheduled',
    type: 'cargo',
    price: '150 ТЖС',
    distance: '98 км',
    duration: '1 ч 50 мин',
    date: '28.02.2026',
    time: '09:00',
    paymentMethod: 'cash'
  },
  {
    id: 'TR-1238',
    driver: { name: 'Фаррух Хакимов', phone: '+992 92 567 8901', avatar: 'ФХ' },
    passenger: { name: 'Шахло Мирзоева', phone: '+992 92 555 6666', avatar: 'ШМ' },
    pickup: 'ул. Хоруги, 56, Куляб',
    dropoff: 'пр. Рудаки, 90, Душанбе',
    status: 'completed',
    type: 'passenger',
    price: '195 ТЖС',
    distance: '203 км',
    duration: '3 ч 30 мин',
    date: '26.02.2026',
    time: '15:45',
    paymentMethod: 'card'
  },
  {
    id: 'TR-1239',
    driver: { name: 'Рустам Абдуллоев', phone: '+992 93 678 9012', avatar: 'РА' },
    passenger: { name: 'Бахтиёр Холов', phone: '+992 93 666 7777', avatar: 'БХ' },
    pickup: 'ул. Фирдавси, 23, Душанбе',
    dropoff: 'ул. Саъди Шерози, 67, Душанбе',
    status: 'active',
    type: 'passenger',
    price: '45 ТЖС',
    distance: '12 км',
    duration: '25 мин',
    date: '27.02.2026',
    time: '16:10',
    paymentMethod: 'cash'
  },
  {
    id: 'TR-1240',
    driver: { name: 'Алишер Рахимов', phone: '+992 92 123 4567', avatar: 'АР' },
    passenger: { name: 'Мехрона Назарова', phone: '+992 90 777 8888', avatar: 'МН' },
    pickup: 'Рынок Корвон, Душанбе',
    dropoff: 'пр. Ленина, 89, Худжанд',
    status: 'scheduled',
    type: 'cargo',
    price: '320 ТЖС',
    distance: '344 км',
    duration: '5 ч 40 мин',
    date: '28.02.2026',
    time: '07:00',
    paymentMethod: 'card'
  },
  {
    id: 'TR-1241',
    driver: { name: 'Мурод Каримов', phone: '+992 93 234 5678', avatar: 'МК' },
    passenger: { name: 'Анвар Раҳимов', phone: '+992 91 888 9999', avatar: 'АР' },
    pickup: 'ул. Рудаки, 123, Душанбе',
    dropoff: 'ул. Вахдат, 45, Курган-Тюбе',
    status: 'completed',
    type: 'passenger',
    price: '140 ТЖС',
    distance: '96 км',
    duration: '1 ч 45 мин',
    date: '26.02.2026',
    time: '11:20',
    paymentMethod: 'cash'
  },
];

export function TripsManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filteredTrips = mockTrips.filter(trip => {
    const matchesSearch = trip.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.driver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.passenger.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.pickup.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.dropoff.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || trip.status === statusFilter;
    const matchesType = typeFilter === 'all' || trip.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleViewDetails = (tripId: string) => {
    toast.success(`Просмотр деталей поездки ${tripId}`);
  };

  const getStatusBadge = (status: Trip['status']) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            В процессе
          </Badge>
        );
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Завершено
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100 flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            Отменено
          </Badge>
        );
      case 'scheduled':
        return (
          <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Запланировано
          </Badge>
        );
    }
  };

  const getTypeBadge = (type: Trip['type']) => {
    return type === 'passenger' ? (
      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
        <User className="w-3 h-3 mr-1" />
        Пассажир
      </Badge>
    ) : (
      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
        <Package className="w-3 h-3 mr-1" />
        Груз
      </Badge>
    );
  };

  const statusCounts = {
    all: mockTrips.length,
    active: mockTrips.filter(t => t.status === 'active').length,
    completed: mockTrips.filter(t => t.status === 'completed').length,
    scheduled: mockTrips.filter(t => t.status === 'scheduled').length,
    cancelled: mockTrips.filter(t => t.status === 'cancelled').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Управление поездками</h1>
        <p className="text-gray-600 mt-1">Всего поездок: {mockTrips.length}</p>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('all')}>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 mb-1">Все</p>
            <p className="text-2xl font-bold text-gray-900">{statusCounts.all}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('active')}>
          <CardContent className="p-4">
            <p className="text-sm text-blue-600 mb-1">В процессе</p>
            <p className="text-2xl font-bold text-blue-700">{statusCounts.active}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('completed')}>
          <CardContent className="p-4">
            <p className="text-sm text-green-600 mb-1">Завершено</p>
            <p className="text-2xl font-bold text-green-700">{statusCounts.completed}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('scheduled')}>
          <CardContent className="p-4">
            <p className="text-sm text-orange-600 mb-1">Запланировано</p>
            <p className="text-2xl font-bold text-orange-700">{statusCounts.scheduled}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('cancelled')}>
          <CardContent className="p-4">
            <p className="text-sm text-red-600 mb-1">Отменено</p>
            <p className="text-2xl font-bold text-red-700">{statusCounts.cancelled}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск по ID, водителю, пассажиру или маршруту..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Все типы</option>
              <option value="passenger">Пассажирские</option>
              <option value="cargo">Грузовые</option>
            </select>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Фильтры
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Trips list */}
      <div className="space-y-4">
        {filteredTrips.map((trip) => (
          <Card key={trip.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                {/* Trip ID and Status */}
                <div className="flex items-center gap-3 lg:w-48">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Package className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{trip.id}</p>
                    <div className="flex gap-2 mt-1">
                      {getStatusBadge(trip.status)}
                    </div>
                  </div>
                </div>

                {/* Driver and Passenger */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Car className="w-4 h-4 text-gray-400" />
                      <span className="text-xs font-medium text-gray-500 uppercase">Водитель</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                        {trip.driver.avatar}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{trip.driver.name}</p>
                        <p className="text-xs text-gray-500">{trip.driver.phone}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-xs font-medium text-gray-500 uppercase">Пассажир</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                        {trip.passenger.avatar}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{trip.passenger.name}</p>
                        <p className="text-xs text-gray-500">{trip.passenger.phone}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Route */}
                <div className="flex-1">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{trip.pickup}</p>
                      <div className="h-4 border-l-2 border-dashed border-gray-300 ml-1.5 my-1"></div>
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-red-500 flex-shrink-0" />
                        <p className="text-sm text-gray-900">{trip.dropoff}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="lg:w-48 space-y-2">
                  {getTypeBadge(trip.type)}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>{trip.distance} • {trip.duration}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{trip.date} • {trip.time}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-gray-600" />
                      <span className="font-semibold text-gray-900">{trip.price}</span>
                    </div>
                    <button 
                      onClick={() => handleViewDetails(trip.id)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTrips.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Поездки не найдены</h3>
          <p className="text-gray-600">Попробуйте изменить параметры поиска</p>
        </div>
      )}
    </div>
  );
}
