import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { DonutChart } from '../ui/DonutChart';
import { SimpleBarChart } from '../ui/SimpleBarChart';
import { SimpleAreaChart } from '../ui/SimpleAreaChart';
import { TrendingUp, Users, Plane, Package, RefreshCw, Activity, BarChart3 } from 'lucide-react';
import { getAviaAdminUsers, getAviaAdminDeals, getAviaAdminFlights } from '../../api/aviaAdminApi';
import { toast } from 'sonner';
import { AdminPageHeader, HeaderBtn, SkeletonList } from './AdminPageHeader';

export function AviaAnalytics() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [flights, setFlights] = useState<any[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [u, d, f] = await Promise.all([
        getAviaAdminUsers(), getAviaAdminDeals(), getAviaAdminFlights(),
      ]);
      setUsers(u || []);
      setDeals(d || []);
      setFlights(f || []);
    } catch {
      toast.error('Ошибка загрузки аналитики AVIA');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Computed metrics ──────────────────────────────────────────────────────────

  const now = Date.now();
  const days14 = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(now - (13 - i) * 86400000);
    return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
  });

  const flightsByDay: Record<string, number> = {};
  const dealsByDay: Record<string, number> = {};
  days14.forEach(d => { flightsByDay[d] = 0; dealsByDay[d] = 0; });

  flights.forEach(f => {
    if (!f?.createdAt) return;
    const d = new Date(f.createdAt).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
    if (d in flightsByDay) flightsByDay[d]++;
  });
  deals.forEach(d => {
    if (!d?.createdAt) return;
    const key = new Date(d.createdAt).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
    if (key in dealsByDay) dealsByDay[key]++;
  });

  const activityData = days14.map(d => ({
    date: d, flights: flightsByDay[d], deals: dealsByDay[d],
  }));

  const usersByDay: Record<string, number> = {};
  days14.forEach(d => { usersByDay[d] = 0; });
  users.forEach(u => {
    if (!u?.createdAt) return;
    const d = new Date(u.createdAt).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
    if (d in usersByDay) usersByDay[d]++;
  });
  const userGrowthData = days14.map(d => ({ date: d, users: usersByDay[d] }));

  const flightStatusData = [
    { name: 'Активные', value: flights.filter(f => f?.status === 'active' && !f.isDeleted).length, color: '#3b82f6' },
    { name: 'В пути', value: flights.filter(f => f?.status === 'in_progress').length, color: '#0ea5e9' },
    { name: 'Закрыты', value: flights.filter(f => f?.status === 'closed').length, color: '#94a3b8' },
    { name: 'Завершены', value: flights.filter(f => f?.status === 'completed').length, color: '#10b981' },
    { name: 'Отменены', value: flights.filter(f => f?.status === 'cancelled' || f?.isDeleted).length, color: '#ef4444' },
  ].filter(d => d.value > 0);

  const dealStatusData = [
    { name: 'Ожидают', value: deals.filter(d => d?.status === 'pending').length, color: '#f59e0b' },
    { name: 'Приняты', value: deals.filter(d => d?.status === 'accepted').length, color: '#0ea5e9' },
    { name: 'Завершены', value: deals.filter(d => d?.status === 'completed').length, color: '#10b981' },
    { name: 'Отклонены', value: deals.filter(d => d?.status === 'rejected').length, color: '#ef4444' },
    { name: 'Отменены', value: deals.filter(d => d?.status === 'cancelled').length, color: '#94a3b8' },
  ].filter(d => d.value > 0);

  const userRoleData = [
    { name: 'Курьеры', value: users.filter(u => u?.role === 'courier').length, color: '#3b82f6' },
    { name: 'Отправители', value: users.filter(u => u?.role === 'sender').length, color: '#8b5cf6' },
  ].filter(d => d.value > 0);

  const routeMap: Record<string, number> = {};
  flights.filter(f => f?.from && f?.to).forEach(f => {
    const key = `${f.from} → ${f.to}`;
    routeMap[key] = (routeMap[key] || 0) + 1;
  });
  const topRoutes = Object.entries(routeMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([route, count]) => ({ route, count }));

  const courierMap: Record<string, { name: string; flights: number }> = {};
  flights.forEach(f => {
    if (!f?.courierId) return;
    if (!courierMap[f.courierId]) courierMap[f.courierId] = { name: f.courierName || f.courierId, flights: 0 };
    courierMap[f.courierId].flights++;
  });
  const topCouriers = Object.values(courierMap).sort((a, b) => b.flights - a.flights).slice(0, 5);

  const conversionRate = deals.length > 0
    ? ((deals.filter(d => d?.status === 'completed').length / deals.length) * 100).toFixed(1)
    : '0';

  const passportVerifiedCount = users.filter(u => u?.passportVerified).length;

  const keyMetrics = [
    { label: 'Пользователей', value: users.length, icon: Users, color: 'text-purple-600' },
    { label: 'Рейсов', value: flights.length, icon: Plane, color: 'text-blue-600' },
    { label: 'Сделок всего', value: deals.length, icon: Package, color: 'text-orange-600' },
    { label: 'Конверсия сделок', value: `${conversionRate}%`, icon: TrendingUp, color: 'text-emerald-600' },
    { label: 'Паспорт подтверждён', value: passportVerifiedCount, icon: Activity, color: 'text-yellow-600' },
  ];

  if (loading) return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Аналитика AVIA"
        subtitle="Загрузка данных..."
        icon={BarChart3}
        gradient="linear-gradient(135deg,#0ea5e9,#38bdf8)"
        accent="#0ea5e9"
      />
      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #f0f4f8' }}>
        <SkeletonList rows={6} />
      </div>
    </div>
  );

  const hasActivity = activityData.some(d => d.flights > 0 || d.deals > 0);
  const hasUserGrowth = userGrowthData.some(d => d.users > 0);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Аналитика AVIA"
        subtitle="Реальные данные из базы AVIA"
        icon={BarChart3}
        gradient="linear-gradient(135deg,#0ea5e9,#38bdf8)"
        accent="#0ea5e9"
        stats={[
          { label: 'Рейсов', value: flights.length },
          { label: 'Сделок', value: deals.length },
          { label: 'Пользователей', value: users.length },
          { label: 'Конверсия', value: `${conversionRate}%` },
        ]}
        actions={
          <HeaderBtn icon={RefreshCw} onClick={load}>Обновить</HeaderBtn>
        }
      />

      {/* Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {keyMetrics.map((m) => (
          <Card key={m.label}>
            <CardContent className="p-3 sm:p-4">
              <m.icon className={`w-5 h-5 ${m.color} mb-2`} />
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{m.value}</p>
              <p className="text-xs text-gray-500 mt-0.5 truncate">{m.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Activity chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            Активность за 14 дней
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasActivity ? (
            <SimpleAreaChart
              data={activityData}
              labelKey="date"
              series={[
                { dataKey: 'flights', color: '#3b82f6', label: 'Рейсы' },
                { dataKey: 'deals', color: '#10b981', label: 'Сделки' },
              ]}
              height={280}
            />
          ) : (
            <div className="h-[280px] flex flex-col items-center justify-center text-gray-400">
              <Plane className="w-12 h-12 mb-3 text-gray-200" />
              <p className="text-sm">Нет данных за последние 14 дней</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Статус рейсов</CardTitle></CardHeader>
          <CardContent>
            {flightStatusData.length > 0 ? (
              <>
                <div className="flex justify-center">
                  <div className="w-full max-w-[220px] [&_svg]:w-full [&_svg]:h-auto">
                    <DonutChart data={flightStatusData} innerRadius={55} outerRadius={85} size={220} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  {flightStatusData.map(item => (
                    <div key={item.name} className="flex items-center gap-2 min-w-0">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-sm text-gray-600 truncate">{item.name}: <strong>{item.value}</strong></span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-[260px] flex items-center justify-center text-gray-400 text-sm">Нет данных</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Статус сделок</CardTitle></CardHeader>
          <CardContent>
            {dealStatusData.length > 0 ? (
              <>
                <div className="flex justify-center">
                  <div className="w-full max-w-[220px] [&_svg]:w-full [&_svg]:h-auto">
                    <DonutChart data={dealStatusData} innerRadius={55} outerRadius={85} size={220} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  {dealStatusData.map(item => (
                    <div key={item.name} className="flex items-center gap-2 min-w-0">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-sm text-gray-600 truncate">{item.name}: <strong>{item.value}</strong></span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-[260px] flex items-center justify-center text-gray-400 text-sm">Нет данных</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* User growth + role */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Регистрации пользователей (14 дней)</CardTitle></CardHeader>
          <CardContent>
            {hasUserGrowth ? (
              <SimpleBarChart
                data={userGrowthData.map(d => ({ label: d.date, value: d.users }))}
                color="#8b5cf6"
                height={220}
              />
            ) : (
              <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">Нет регистраций за 14 дней</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Роли пользователей</CardTitle></CardHeader>
          <CardContent>
            {userRoleData.length > 0 ? (
              <>
                <div className="flex justify-center">
                  <div className="w-full max-w-[160px] [&_svg]:w-full [&_svg]:h-auto">
                    <DonutChart data={userRoleData} innerRadius={45} outerRadius={70} size={160} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-4">
                  {userRoleData.map(item => (
                    <div key={item.name} className="text-center p-2.5 sm:p-3 rounded-xl min-w-0" style={{ backgroundColor: item.color + '15' }}>
                      <p className="text-2xl font-bold" style={{ color: item.color }}>{item.value}</p>
                      <p className="text-xs text-gray-600 mt-0.5 truncate">{item.name}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">Нет данных</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top routes */}
      {topRoutes.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Популярные маршруты</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topRoutes.map((r, i) => (
                <div key={r.route} className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${
                    i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-orange-500' : 'bg-blue-400'
                  }`}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">{r.route}</p>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                      <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${(r.count / (topRoutes[0]?.count || 1)) * 100}%` }} />
                    </div>
                  </div>
                  <span className="text-sm font-bold text-gray-700 flex-shrink-0">{r.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top couriers */}
      {topCouriers.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Топ курьеров по рейсам</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topCouriers.map((d, i) => (
                <div key={d.name} className="flex items-center gap-4 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${
                    i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-orange-500' : 'bg-blue-400'
                  }`}>{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{d.name}</p>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1.5">
                      <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${(d.flights / (topCouriers[0]?.flights || 1)) * 100}%` }} />
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-gray-900">{d.flights}</p>
                    <p className="text-xs text-gray-500">рейсов</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {flights.length === 0 && users.length === 0 && (
        <div className="py-16 text-center">
          <Activity className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Данные появятся по мере использования платформы</p>
          <p className="text-gray-400 text-sm mt-1">Аналитика строится на основе реальных рейсов и сделок</p>
        </div>
      )}
    </div>
  );
}
