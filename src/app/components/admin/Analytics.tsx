import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  AreaChart,
  Area,
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Users, Car, Package, MapPin } from 'lucide-react';

// Mock data
const monthlyRevenue = [
  { month: 'Янв', revenue: 45000, trips: 320, drivers: 45, users: 250 },
  { month: 'Фев', revenue: 52000, trips: 380, drivers: 52, users: 310 },
  { month: 'Мар', revenue: 48000, trips: 340, drivers: 49, users: 290 },
  { month: 'Апр', revenue: 61000, trips: 420, drivers: 58, users: 380 },
  { month: 'Май', revenue: 55000, trips: 390, drivers: 54, users: 350 },
  { month: 'Июн', revenue: 67000, trips: 450, drivers: 62, users: 410 },
  { month: 'Июл', revenue: 72000, trips: 510, drivers: 68, users: 480 },
];

const cityData = [
  { city: 'Душанбе', trips: 1247, revenue: 186500, color: '#3b82f6' },
  { city: 'Худжанд', trips: 643, revenue: 95200, color: '#10b981' },
  { city: 'Куляб', trips: 312, revenue: 42800, color: '#f59e0b' },
  { city: 'Курган-Тюбе', trips: 241, revenue: 31500, color: '#ef4444' },
  { city: 'Хорог', trips: 100, revenue: 18500, color: '#8b5cf6' },
];

const hourlyTrips = [
  { hour: '00:00', trips: 12 },
  { hour: '03:00', trips: 5 },
  { hour: '06:00', trips: 45 },
  { hour: '09:00', trips: 89 },
  { hour: '12:00', trips: 134 },
  { hour: '15:00', trips: 98 },
  { hour: '18:00', trips: 156 },
  { hour: '21:00', trips: 78 },
];

const tripTypes = [
  { name: 'Внутригород', value: 1847, color: '#3b82f6' },
  { name: 'Междугород', value: 543, color: '#10b981' },
  { name: 'Груз малый', value: 234, color: '#f59e0b' },
  { name: 'Груз большой', value: 156, color: '#ef4444' },
];

const driverPerformance = [
  { name: 'Алишер Р.', trips: 342, revenue: 42500, rating: 4.8 },
  { name: 'Мурод К.', trips: 528, revenue: 65300, rating: 4.9 },
  { name: 'Рустам А.', trips: 445, revenue: 56800, rating: 4.8 },
  { name: 'Джамшед И.', trips: 389, revenue: 48700, rating: 4.7 },
  { name: 'Сухроб Н.', trips: 214, revenue: 28900, rating: 4.6 },
];

const weeklyComparison = [
  { day: 'Пн', thisWeek: 234, lastWeek: 198 },
  { day: 'Вт', thisWeek: 267, lastWeek: 223 },
  { day: 'Ср', thisWeek: 289, lastWeek: 245 },
  { day: 'Чт', thisWeek: 312, lastWeek: 276 },
  { day: 'Пт', thisWeek: 345, lastWeek: 298 },
  { day: 'Сб', thisWeek: 398, lastWeek: 356 },
  { day: 'Вс', thisWeek: 367, lastWeek: 334 },
];

export function Analytics() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Аналитика и отчеты</h1>
        <p className="text-gray-600 mt-1">Детальная статистика работы платформы</p>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Средний чек</span>
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">127 ТЖС</p>
            <div className="flex items-center gap-1 mt-2 text-sm">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-green-600 font-medium">+8.3%</span>
              <span className="text-gray-500">vs прошлый месяц</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Заполненность</span>
              <Car className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">73%</p>
            <div className="flex items-center gap-1 mt-2 text-sm">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-green-600 font-medium">+5.2%</span>
              <span className="text-gray-500">vs прошлый месяц</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Активных водителей</span>
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">68</p>
            <div className="flex items-center gap-1 mt-2 text-sm">
              <TrendingDown className="w-4 h-4 text-red-600" />
              <span className="text-red-600 font-medium">-2.1%</span>
              <span className="text-gray-500">vs прошлый месяц</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Отмен</span>
              <Package className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">6.1%</p>
            <div className="flex items-center gap-1 mt-2 text-sm">
              <TrendingDown className="w-4 h-4 text-green-600" />
              <span className="text-green-600 font-medium">-1.4%</span>
              <span className="text-gray-500">vs прошлый месяц</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue and trips trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Доход и поездки по месяцам</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyRevenue}>
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

        <Card>
          <CardHeader>
            <CardTitle>Рост пользователей и водителей</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="users" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" name="Пользователи" />
                <Area type="monotone" dataKey="drivers" stackId="1" stroke="#f59e0b" fill="#f59e0b" name="Водители" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* City distribution and trip types */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Распределение по городам</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={cityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="city" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="trips" fill="#3b82f6" name="Поездки" />
              </BarChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-4 mt-4">
              {cityData.map((city) => (
                <div key={city.city} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">{city.city}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{city.revenue.toLocaleString()} ТЖС</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Типы поездок</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={tripTypes}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {tripTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-3 mt-4">
              {tripTypes.map((type) => (
                <div key={type.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: type.color }}></div>
                  <span className="text-sm text-gray-700">{type.name}: <strong>{type.value}</strong></span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hourly activity and weekly comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Активность по часам</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={hourlyTrips}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="trips" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} name="Поездки" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Сравнение недель</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyComparison}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="lastWeek" fill="#94a3b8" name="Прошлая неделя" />
                <Bar dataKey="thisWeek" fill="#3b82f6" name="Эта неделя" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top drivers */}
      <Card>
        <CardHeader>
          <CardTitle>Топ водителей</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {driverPerformance.map((driver, index) => (
              <div key={driver.name} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{driver.name}</p>
                  <p className="text-sm text-gray-600">{driver.trips} поездок • Рейтинг {driver.rating}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{driver.revenue.toLocaleString()} ТЖС</p>
                  <p className="text-sm text-gray-600">Заработано</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
