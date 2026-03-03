import { useState } from 'react';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Car, 
  Star,
  MapPin,
  Phone,
  Mail,
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Ban,
  Edit
} from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';

interface Driver {
  id: string;
  name: string;
  phone: string;
  email: string;
  avatar: string;
  rating: number;
  totalTrips: number;
  status: 'active' | 'inactive' | 'suspended';
  verified: boolean;
  vehicleModel: string;
  vehiclePlate: string;
  joinDate: string;
  location: string;
  earnings: string;
}

const mockDrivers: Driver[] = [
  {
    id: 'DRV-001',
    name: 'Алишер Рахимов',
    phone: '+992 92 123 4567',
    email: 'alisher.r@mail.tj',
    avatar: 'АР',
    rating: 4.8,
    totalTrips: 342,
    status: 'active',
    verified: true,
    vehicleModel: 'Toyota Camry 2020',
    vehiclePlate: '01 TJ 1234',
    joinDate: '15.01.2024',
    location: 'Душанбе',
    earnings: '42,500 ТЖС'
  },
  {
    id: 'DRV-002',
    name: 'Мурод Каримов',
    phone: '+992 93 234 5678',
    email: 'murod.k@mail.tj',
    avatar: 'МК',
    rating: 4.9,
    totalTrips: 528,
    status: 'active',
    verified: true,
    vehicleModel: 'Honda Accord 2019',
    vehiclePlate: '01 TJ 5678',
    joinDate: '03.12.2023',
    location: 'Душанбе',
    earnings: '65,300 ТЖС'
  },
  {
    id: 'DRV-003',
    name: 'Сухроб Назаров',
    phone: '+992 90 345 6789',
    email: 'sukhrob.n@mail.tj',
    avatar: 'СН',
    rating: 4.6,
    totalTrips: 214,
    status: 'inactive',
    verified: true,
    vehicleModel: 'Hyundai Sonata 2021',
    vehiclePlate: '02 TJ 2468',
    joinDate: '22.03.2024',
    location: 'Худжанд',
    earnings: '28,900 ТЖС'
  },
  {
    id: 'DRV-004',
    name: 'Джамшед Исмоилов',
    phone: '+992 91 456 7890',
    email: 'jamshed.i@mail.tj',
    avatar: 'ДИ',
    rating: 4.7,
    totalTrips: 389,
    status: 'active',
    verified: false,
    vehicleModel: 'Mazda 6 2018',
    vehiclePlate: '01 TJ 9876',
    joinDate: '10.02.2024',
    location: 'Душанбе',
    earnings: '48,700 ТЖС'
  },
  {
    id: 'DRV-005',
    name: 'Фаррух Хакимов',
    phone: '+992 92 567 8901',
    email: 'farrukh.h@mail.tj',
    avatar: 'ФХ',
    rating: 3.9,
    totalTrips: 156,
    status: 'suspended',
    verified: true,
    vehicleModel: 'Nissan Teana 2017',
    vehiclePlate: '03 TJ 1357',
    joinDate: '05.04.2024',
    location: 'Куляб',
    earnings: '19,200 ТЖС'
  },
  {
    id: 'DRV-006',
    name: 'Рустам Абдуллоев',
    phone: '+992 93 678 9012',
    email: 'rustam.a@mail.tj',
    avatar: 'РА',
    rating: 4.8,
    totalTrips: 445,
    status: 'active',
    verified: true,
    vehicleModel: 'Volkswagen Passat 2020',
    vehiclePlate: '01 TJ 2580',
    joinDate: '18.11.2023',
    location: 'Душанбе',
    earnings: '56,800 ТЖС'
  },
];

export function DriversManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredDrivers = mockDrivers.filter(driver => {
    const matchesSearch = driver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.phone.includes(searchQuery);
    
    const matchesStatus = statusFilter === 'all' || driver.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleAction = (action: string, driver: Driver) => {
    toast.success(`${action}: ${driver.name}`);
  };

  const getStatusBadge = (status: Driver['status']) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Активен</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">Неактивен</Badge>;
      case 'suspended':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Заблокирован</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Управление водителями</h1>
          <p className="text-gray-600 mt-1">Всего водителей: {mockDrivers.length}</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
          <Car className="w-5 h-5" />
          Добавить водителя
        </button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск по имени, ID или телефону..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Все статусы</option>
              <option value="active">Активные</option>
              <option value="inactive">Неактивные</option>
              <option value="suspended">Заблокированные</option>
            </select>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Фильтры
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Drivers list */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredDrivers.map((driver) => (
          <Card key={driver.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                    {driver.avatar}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{driver.name}</h3>
                      {driver.verified && (
                        <CheckCircle className="w-4 h-4 text-blue-500" title="Верифицирован" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{driver.id}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium text-gray-900">{driver.rating}</span>
                      <span className="text-sm text-gray-500">({driver.totalTrips} поездок)</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(driver.status)}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <MoreVertical className="w-5 h-5 text-gray-600" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleAction('Просмотр', driver)}>
                        <Eye className="w-4 h-4 mr-2" />
                        Просмотр профиля
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleAction('Редактирование', driver)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Редактировать
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleAction('Блокировка', driver)} className="text-red-600">
                        <Ban className="w-4 h-4 mr-2" />
                        Заблокировать
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Car className="w-4 h-4" />
                  <span>{driver.vehicleModel} • {driver.vehiclePlate}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{driver.location}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span>{driver.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span>{driver.email}</span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                <div className="text-sm">
                  <span className="text-gray-600">Заработок: </span>
                  <span className="font-semibold text-gray-900">{driver.earnings}</span>
                </div>
                <div className="text-sm text-gray-600">
                  Регистрация: {driver.joinDate}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredDrivers.length === 0 && (
        <div className="text-center py-12">
          <Car className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Водители не найдены</h3>
          <p className="text-gray-600">Попробуйте изменить параметры поиска</p>
        </div>
      )}
    </div>
  );
}
