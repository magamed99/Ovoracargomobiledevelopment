import { useState } from 'react';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Users as UsersIcon, 
  Star,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Shield,
  Eye,
  Ban,
  Edit,
  Package
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

interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  avatar: string;
  rating: number;
  totalTrips: number;
  status: 'active' | 'inactive' | 'suspended';
  userType: 'passenger' | 'sender';
  joinDate: string;
  location: string;
  totalSpent: string;
  lastActive: string;
}

const mockUsers: User[] = [
  {
    id: 'USR-001',
    name: 'Фарход Юсупов',
    phone: '+992 92 111 2222',
    email: 'farkhod.y@mail.tj',
    avatar: 'ФЮ',
    rating: 4.7,
    totalTrips: 45,
    status: 'active',
    userType: 'passenger',
    joinDate: '10.01.2024',
    location: 'Душанбе',
    totalSpent: '8,500 ТЖС',
    lastActive: '2 часа назад'
  },
  {
    id: 'USR-002',
    name: 'Зарина Саидова',
    phone: '+992 93 222 3333',
    email: 'zarina.s@mail.tj',
    avatar: 'ЗС',
    rating: 4.9,
    totalTrips: 82,
    status: 'active',
    userType: 'sender',
    joinDate: '05.12.2023',
    location: 'Худжанд',
    totalSpent: '15,200 ТЖС',
    lastActive: '1 час назад'
  },
  {
    id: 'USR-003',
    name: 'Дилшод Азимов',
    phone: '+992 90 333 4444',
    email: 'dilshod.a@mail.tj',
    avatar: 'ДА',
    rating: 4.5,
    totalTrips: 28,
    status: 'inactive',
    userType: 'passenger',
    joinDate: '20.02.2024',
    location: 'Душанбе',
    totalSpent: '4,300 ТЖС',
    lastActive: '5 дней назад'
  },
  {
    id: 'USR-004',
    name: 'Нозанин Раджабова',
    phone: '+992 91 444 5555',
    email: 'nozanin.r@mail.tj',
    avatar: 'НР',
    rating: 4.8,
    totalTrips: 63,
    status: 'active',
    userType: 'sender',
    joinDate: '15.11.2023',
    location: 'Куляб',
    totalSpent: '11,800 ТЖС',
    lastActive: '30 минут назад'
  },
  {
    id: 'USR-005',
    name: 'Шахло Мирзоева',
    phone: '+992 92 555 6666',
    email: 'shakhlo.m@mail.tj',
    avatar: 'ШМ',
    rating: 3.8,
    totalTrips: 12,
    status: 'suspended',
    userType: 'passenger',
    joinDate: '08.03.2024',
    location: 'Душанбе',
    totalSpent: '1,900 ТЖС',
    lastActive: '2 недели назад'
  },
  {
    id: 'USR-006',
    name: 'Бахтиёр Холов',
    phone: '+992 93 666 7777',
    email: 'bakhtiyor.kh@mail.tj',
    avatar: 'БХ',
    rating: 4.6,
    totalTrips: 51,
    status: 'active',
    userType: 'passenger',
    joinDate: '22.01.2024',
    location: 'Душанбе',
    totalSpent: '9,400 ТЖС',
    lastActive: '3 часа назад'
  },
  {
    id: 'USR-007',
    name: 'Мехрона Назарова',
    phone: '+992 90 777 8888',
    email: 'mehrona.n@mail.tj',
    avatar: 'МН',
    rating: 4.9,
    totalTrips: 94,
    status: 'active',
    userType: 'sender',
    joinDate: '18.10.2023',
    location: 'Худжанд',
    totalSpent: '18,600 ТЖС',
    lastActive: '15 минут назад'
  },
  {
    id: 'USR-008',
    name: 'Анвар Раҳимов',
    phone: '+992 91 888 9999',
    email: 'anvar.r@mail.tj',
    avatar: 'АР',
    rating: 4.4,
    totalTrips: 33,
    status: 'active',
    userType: 'passenger',
    joinDate: '05.02.2024',
    location: 'Курган-Тюбе',
    totalSpent: '6,200 ТЖС',
    lastActive: '1 день назад'
  },
];

export function UsersManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filteredUsers = mockUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone.includes(searchQuery);
    
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    const matchesType = typeFilter === 'all' || user.userType === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleAction = (action: string, user: User) => {
    toast.success(`${action}: ${user.name}`);
  };

  const getStatusBadge = (status: User['status']) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Активен</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">Неактивен</Badge>;
      case 'suspended':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Заблокирован</Badge>;
    }
  };

  const getUserTypeBadge = (type: User['userType']) => {
    return type === 'passenger' ? (
      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Пассажир</Badge>
    ) : (
      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Отправитель</Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Управление пользователями</h1>
          <p className="text-gray-600 mt-1">Всего пользователей: {mockUsers.length}</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
          <UsersIcon className="w-5 h-5" />
          Добавить пользователя
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
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Все типы</option>
              <option value="passenger">Пассажиры</option>
              <option value="sender">Отправители</option>
            </select>
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

      {/* Users list */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredUsers.map((user) => (
          <Card key={user.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                    {user.avatar}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{user.name}</h3>
                    <p className="text-sm text-gray-600">{user.id}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium text-gray-900">{user.rating}</span>
                      <span className="text-sm text-gray-500">({user.totalTrips} поездок)</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {getStatusBadge(user.status)}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <MoreVertical className="w-5 h-5 text-gray-600" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleAction('Просмотр', user)}>
                        <Eye className="w-4 h-4 mr-2" />
                        Просмотр профиля
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleAction('Редактирование', user)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Редактировать
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleAction('Блокировка', user)} className="text-red-600">
                        <Ban className="w-4 h-4 mr-2" />
                        Заблокировать
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="mb-3">
                {getUserTypeBadge(user.userType)}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{user.location}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span>{user.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>Регистрация: {user.joinDate}</span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                <div className="text-sm">
                  <span className="text-gray-600">Потрачено: </span>
                  <span className="font-semibold text-gray-900">{user.totalSpent}</span>
                </div>
                <div className="text-sm text-gray-600">
                  Активность: {user.lastActive}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <UsersIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Пользователи не найдены</h3>
          <p className="text-gray-600">Попробуйте изменить параметры поиска</p>
        </div>
      )}
    </div>
  );
}
