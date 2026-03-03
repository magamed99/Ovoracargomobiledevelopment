import { 
  TrendingUp, 
  Users, 
  Car, 
  Package, 
  DollarSign,
  ArrowUp,
  ArrowDown,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Mock data
const stats = [
  {
    title: 'Всего поездок',
    value: '2,543',
    change: '+12.5%',
    trend: 'up',
    icon: Package,
    color: 'bg-blue-500'
  },
  {
    title: 'Активные водители',
    value: '342',
    change: '+8.3%',
    trend: 'up',
    icon: Car,
    color: 'bg-green-500'
  },
  {
    title: 'Пользователей',
    value: '1,847',
    change: '+15.2%',
    trend: 'up',
    icon: Users,
    color: 'bg-purple-500'
  },
  {
    title: 'Доход',
    value: '324,560 ТЖС',
    change: '-3.1%',
    trend: 'down',
    icon: DollarSign,
    color: 'bg-orange-500'
  },
];

const revenueData = [
  { month: 'Янв', revenue: 45000, trips: 320 },
  { month: 'Фев', revenue: 52000, trips: 380 },
  { month: 'Мар', revenue: 48000, trips: 340 },
  { month: 'Апр', revenue: 61000, trips: 420 },
  { month: 'Май', revenue: 55000, trips: 390 },
  { month: 'Июн', revenue: 67000, trips: 450 },
  { month: 'Июл', revenue: 72000, trips: 510 },
];

const tripStatusData = [
  { name: 'Завершено', value: 1847, color: '#10b981' },
  { name: 'В процессе', value: 234, color: '#3b82f6' },
  { name: 'Отменено', value: 156, color: '#ef4444' },
  { name: 'Запланировано', value: 306, color: '#f59e0b' },
];

const recentTrips = [
  {
    id: '#TR-1234',
    driver: 'Алишер Рахимов',
    passenger: 'Фарход Юсупов',
    route: 'Душанбе → Худжанд',
    status: 'active',
    price: '250 ТЖС',
    time: '2 часа назад'
  },
  {
    id: '#TR-1235',
    driver: 'Мурод Каримов',
    passenger: 'Зарина Саидова',
    route: 'Душанбе → Куляб',
    status: 'completed',
    price: '180 ТЖС',
    time: '3 часа назад'
  },
  {
    id: '#TR-1236',
    driver: 'Сухроб Назаров',
    passenger: 'Дилшод Азимов',
    route: 'Худжанд → Душанбе',
    status: 'cancelled',
    price: '260 ТЖС',
    time: '4 часа назад'
  },
  {
    id: '#TR-1237',
    driver: 'Джамшед Исмоилов',
    passenger: 'Нозанин Раджабова',
    route: 'Душанбе → Курган-Тюбе',
    status: 'scheduled',
    price: '150 ТЖС',
    time: '5 часов назад'
  },
];

const pendingVerifications = [
  {
    driver: 'Рустам Абдуллоев',
    document: 'Водительские права',
    submitted: '1 час назад',
    avatar: 'РА'
  },
  {
    driver: 'Шахло Мирзоева',
    document: 'Техпаспорт',
    submitted: '2 часа назад',
    avatar: 'ШМ'
  },
  {
    driver: 'Фаррух Хакимов',
    document: 'Страховка',
    submitted: '3 часа назад',
    avatar: 'ФХ'
  },
];

export function AdminDashboard() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Панель управления</h1>
        <p className="text-gray-600 mt-1">Обзор системы Ovora Cargo</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  <div className="flex items-center gap-1 mt-2">
                    {stat.trend === 'up' ? (
                      <ArrowUp className="w-4 h-4 text-green-600" />
                    ) : (
                      <ArrowDown className="w-4 h-4 text-red-600" />
                    )}
                    <span className={`text-sm font-medium ${
                      stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stat.change}
                    </span>
                    <span className="text-sm text-gray-500">vs прошлый месяц</span>
                  </div>
                </div>
                <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue chart */}
        <Card>
          <CardHeader>
            <CardTitle>Доход и поездки</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#3b82f6" name="Доход (ТЖС)" strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="trips" stroke="#10b981" name="Поездки" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Trip status pie chart */}
        <Card>
          <CardHeader>
            <CardTitle>Статус поездок</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={tripStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {tripStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-4 mt-4">
              {tripStatusData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-sm text-gray-600">{item.name}: <strong>{item.value}</strong></span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent trips */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Последние поездки</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTrips.map((trip) => (
                <div key={trip.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900">{trip.id}</span>
                      {trip.status === 'active' && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          В процессе
                        </span>
                      )}
                      {trip.status === 'completed' && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Завершено
                        </span>
                      )}
                      {trip.status === 'cancelled' && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full flex items-center gap-1">
                          <XCircle className="w-3 h-3" />
                          Отменено
                        </span>
                      )}
                      {trip.status === 'scheduled' && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-700 rounded-full flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Запланировано
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{trip.route}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>Водитель: {trip.driver}</span>
                      <span>•</span>
                      <span>Пассажир: {trip.passenger}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{trip.price}</p>
                    <p className="text-xs text-gray-500 mt-1">{trip.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pending verifications */}
        <Card>
          <CardHeader>
            <CardTitle>Ожидают верификации</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingVerifications.map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {item.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{item.driver}</p>
                    <p className="text-sm text-gray-600 truncate">{item.document}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.submitted}</p>
                  </div>
                </div>
              ))}
              <button className="w-full py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors">
                Показать все
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
