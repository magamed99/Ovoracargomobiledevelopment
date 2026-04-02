import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import {
  Users, Car, Package, CheckCircle, RefreshCw, Loader2, Route,
  Star, Activity, Download, ArrowRight, Clock, TrendingUp,
  AlertCircle, Zap,
} from 'lucide-react';
import { DonutChart } from '../ui/DonutChart';
import { SimpleBarChart } from '../ui/SimpleBarChart';
import { getAdminTrips, getAdminUsers, getAdminOffers, getAdminReviews } from '../../api/dataApi';
import { toast } from 'sonner';

// ── CSV export ────────────────────────────────────────────────────────────────
function exportCsv(rows: Record<string, unknown>[], filename: string) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const esc = (v: unknown) => {
    const s = String(v ?? '').replace(/"/g, '""');
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s}"` : s;
  };
  const csv = [keys.join(','), ...rows.map(r => keys.map(k => esc(r[k])).join(','))].join('\n');
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })),
    download: filename,
  });
  a.click();
  URL.revokeObjectURL(a.href);
}

function RelTime({ iso }: { iso: string }) {
  if (!iso) return <span className="text-gray-400">—</span>;
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return <span className="text-emerald-600 font-medium">только что</span>;
  if (mins < 60) return <span>{mins} мин. назад</span>;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return <span>{hrs} ч. назад</span>;
  return <span>{Math.floor(hrs / 24)} дн. назад</span>;
}

const STATUS_COLOR: Record<string, string> = {
  active: '#3b82f6',
  completed: '#10b981',
  cancelled: '#ef4444',
  scheduled: '#f59e0b',
};

const STATUS_LABEL: Record<string, string> = {
  active: 'Активна',
  completed: 'Завершена',
  cancelled: 'Отменена',
  scheduled: 'Запланирована',
};

export function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{
    trips: number; drivers: number; users: number; senders: number;
    offers: number; reviews: number; acceptedOffers: number;
    pendingOffers: number; activeTrips: number;
  } | null>(null);
  const [trips, setTrips] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [exportOpen, setExportOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [tripsData, usersData, offersData, reviewsData] = await Promise.all([
        getAdminTrips(), getAdminUsers(), getAdminOffers(), getAdminReviews(),
      ]);
      console.log('[AdminDashboard] Data loaded:', {
        trips: (tripsData || []).length,
        users: (usersData || []).length,
        offers: (offersData || []).length,
        reviews: (reviewsData || []).length,
      });
      const t = tripsData || [];
      const u = usersData || [];
      const o = offersData || [];
      setTrips(t); setUsers(u); setOffers(o);
      const validTrips = t.filter((x: any) => x && !x.deletedAt);
      setStats({
        trips: validTrips.length,
        drivers: u.filter((x: any) => x?.role === 'driver').length,
        users: u.length,
        senders: u.filter((x: any) => x?.role === 'sender').length,
        offers: o.length,
        reviews: (reviewsData || []).length,
        acceptedOffers: o.filter((x: any) => x?.status === 'accepted').length,
        pendingOffers: o.filter((x: any) => x?.status === 'pending').length,
        activeTrips: validTrips.filter((x: any) => x.status === 'active').length,
      });
      setLastUpdated(new Date());
    } catch (err) {
      console.error('[AdminDashboard] Load error:', err);
      toast.error('Ошибка загрузки данных: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ── Chart data ────────────────────────────────────────────────────────────
  const tripStatusData = [
    { name: 'Активные',      value: trips.filter(t => t?.status === 'active').length,                    color: '#3b82f6' },
    { name: 'Завершены',     value: trips.filter(t => t?.status === 'completed').length,                 color: '#10b981' },
    { name: 'Отменены',      value: trips.filter(t => t?.status === 'cancelled' || t?.deletedAt).length, color: '#ef4444' },
    { name: 'Запланированы', value: trips.filter(t => t?.status === 'scheduled').length,                 color: '#f59e0b' },
  ].filter(d => d.value > 0);

  const offerStatusData = [
    { name: 'Ожидают',   value: offers.filter(o => o?.status === 'pending').length,                              color: '#f59e0b' },
    { name: 'Приняты',   value: offers.filter(o => o?.status === 'accepted').length,                             color: '#10b981' },
    { name: 'Отклонены', value: offers.filter(o => o?.status === 'rejected' || o?.status === 'declined').length, color: '#ef4444' },
  ].filter(d => d.value > 0);

  const userRoleData = [
    { name: 'Водители',    value: users.filter(u => u?.role === 'driver').length, color: '#3b82f6' },
    { name: 'Отправители', value: users.filter(u => u?.role === 'sender').length, color: '#8b5cf6' },
  ].filter(d => d.value > 0);

  // Activity (last 7 days)
  const dayLabels = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  const weekAgo = Date.now() - 7 * 24 * 3600 * 1000;
  const dayActivity: Record<string, number> = {};
  trips.filter(t => t?.createdAt && new Date(t.createdAt).getTime() > weekAgo).forEach(t => {
    const d = dayLabels[new Date(t.createdAt).getDay()];
    dayActivity[d] = (dayActivity[d] || 0) + 1;
  });
  const activityBarData = dayLabels.map(d => ({ label: d, value: dayActivity[d] || 0 }));

  const recentTrips = [...trips]
    .filter(t => t && !t.deletedAt)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);

  const driverMap: Record<string, { name: string; trips: number; email: string }> = {};
  trips.forEach(t => {
    if (!t?.driverEmail) return;
    if (!driverMap[t.driverEmail]) driverMap[t.driverEmail] = { name: t.driverName || t.driverEmail, trips: 0, email: t.driverEmail };
    driverMap[t.driverEmail].trips++;
  });
  const topDrivers = Object.values(driverMap).sort((a, b) => b.trips - a.trips).slice(0, 5);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-72 gap-3">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: '#eff6ff' }}>
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
      <p className="text-gray-500 text-sm font-medium">Загрузка данных из базы...</p>
    </div>
  );

  const statCards = [
    {
      title: 'Всего поездок', value: stats?.trips ?? 0, icon: Route,
      gradient: 'linear-gradient(135deg,#1565d8,#2385f4)',
      sub: `${stats?.activeTrips ?? 0} активных`,
      to: '/admin/trips', badge: stats?.activeTrips,
    },
    {
      title: 'Водители', value: stats?.drivers ?? 0, icon: Car,
      gradient: 'linear-gradient(135deg,#059669,#10b981)',
      sub: `${stats?.senders ?? 0} отправителей`,
      to: '/admin/drivers',
    },
    {
      title: 'Пользователей', value: stats?.users ?? 0, icon: Users,
      gradient: 'linear-gradient(135deg,#7c3aed,#8b5cf6)',
      sub: 'Всего в системе',
      to: '/admin/users',
    },
    {
      title: 'Оферт', value: stats?.offers ?? 0, icon: Package,
      gradient: 'linear-gradient(135deg,#d97706,#f59e0b)',
      sub: `${stats?.pendingOffers ?? 0} ожидают`,
      to: '/admin/offers', badge: stats?.pendingOffers,
    },
    {
      title: 'Принято', value: stats?.acceptedOffers ?? 0, icon: CheckCircle,
      gradient: 'linear-gradient(135deg,#0891b2,#06b6d4)',
      sub: 'Завершённых сделок',
      to: '/admin/offers',
    },
    {
      title: 'Отзывов', value: stats?.reviews ?? 0, icon: Star,
      gradient: 'linear-gradient(135deg,#db2777,#ec4899)',
      sub: 'В системе',
      to: '/admin/reviews',
    },
  ];

  const convRate = offers.length > 0
    ? ((offers.filter(o => o?.status === 'accepted').length / offers.length) * 100).toFixed(0)
    : '0';

  return (
    <div className="space-y-6">

      {/* ── Welcome banner ── */}
      <div
        className="rounded-2xl px-6 py-5 flex items-center justify-between gap-4 flex-wrap"
        style={{
          background: 'linear-gradient(135deg, #1565d8 0%, #2385f4 60%, #3b9ef8 100%)',
          boxShadow: '0 8px 32px #1565d840',
        }}
      >
        <div>
          <h1 className="text-xl font-bold text-white">Панель управления</h1>
          <p className="text-sm mt-0.5" style={{ color: '#bfdbfe' }}>
            {new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            {lastUpdated && (
              <span className="ml-2 opacity-75">
                • обновлено в {lastUpdated.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Conversion rate pill */}
          <div className="px-3 py-2 rounded-xl flex items-center gap-2" style={{ background: '#ffffff20' }}>
            <TrendingUp className="w-4 h-4 text-white" />
            <span className="text-sm text-white font-semibold">Конверсия: {convRate}%</span>
          </div>
          {/* Export */}
          <div className="relative">
            <button
              onClick={() => setExportOpen(v => !v)}
              onBlur={() => setTimeout(() => setExportOpen(false), 180)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all"
              style={{ background: '#ffffff25', color: '#ffffff' }}
            >
              <Download className="w-4 h-4" />
              Экспорт CSV
            </button>
            {exportOpen && (
              <div className="absolute right-0 top-full mt-2 w-44 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 overflow-hidden">
                {[
                  {
                    label: 'Поездки', icon: Route, color: 'text-blue-500',
                    onClick: () => exportCsv(
                      trips.map(t => ({ id: t.id, from: t.from, to: t.to, date: t.date, status: t.status, driver: t.driverName || t.driverEmail, price: t.pricePerSeat || t.pricePerKg, created: t.createdAt })),
                      `ovora_trips_${new Date().toISOString().slice(0, 10)}.csv`
                    ),
                  },
                  {
                    label: 'Пользователи', icon: Users, color: 'text-purple-500',
                    onClick: () => exportCsv(
                      users.map(u => ({ email: u.email, name: `${u.firstName || ''} ${u.lastName || ''}`.trim(), role: u.role, phone: u.phone, city: u.city, created: u.createdAt })),
                      `ovora_users_${new Date().toISOString().slice(0, 10)}.csv`
                    ),
                  },
                  {
                    label: 'Оферты', icon: Package, color: 'text-orange-500',
                    onClick: () => exportCsv(
                      offers.map(o => ({ offerId: o.offerId, tripId: o.tripId, senderEmail: o.senderEmail, driverEmail: o.driverEmail, status: o.status, price: o.price, weight: o.weight, created: o.createdAt })),
                      `ovora_offers_${new Date().toISOString().slice(0, 10)}.csv`
                    ),
                  },
                ].map(item => (
                  <button key={item.label} onClick={item.onClick}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2 border-b border-gray-100 last:border-0"
                  >
                    <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={load}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all"
            style={{ background: '#ffffff25', color: '#ffffff' }}
          >
            <RefreshCw className="w-4 h-4" />
            Обновить
          </button>
        </div>
      </div>

      {/* ── Pending alert ── */}
      {(stats?.pendingOffers ?? 0) > 0 && (
        <Link to="/admin/offers" className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:shadow-md" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800 font-medium flex-1">
            Есть <strong>{stats?.pendingOffers}</strong> оферт, ожидающих рассмотрения
          </p>
          <ArrowRight className="w-4 h-4 text-amber-600" />
        </Link>
      )}

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map(card => (
          <Link key={card.title} to={card.to} className="group">
            <div
              className="rounded-2xl p-4 transition-all hover:shadow-lg hover:-translate-y-0.5 relative overflow-hidden"
              style={{ background: '#ffffff', border: '1px solid #f0f4f8' }}
            >
              {/* Icon */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 relative"
                style={{ background: card.gradient }}
              >
                <card.icon className="w-5 h-5 text-white" />
                {card.badge != null && card.badge > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-[9px] font-bold">
                    {card.badge > 9 ? '9+' : card.badge}
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              <p className="text-xs font-semibold text-gray-700 mt-0.5">{card.title}</p>
              <p className="text-xs text-gray-400 mt-0.5">{card.sub}</p>
              {/* Hover arrow */}
              <ArrowRight className="absolute bottom-3 right-3 w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
            </div>
          </Link>
        ))}
      </div>

      {/* ── Charts row 1 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity bar chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5" style={{ border: '1px solid #f0f4f8' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#eff6ff' }}>
                <Activity className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Активность за 7 дней</p>
                <p className="text-xs text-gray-500">Количество новых поездок</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-semibold text-gray-600">
                Итого: {activityBarData.reduce((s, d) => s + d.value, 0)}
              </span>
            </div>
          </div>
          {activityBarData.some(d => d.value > 0) ? (
            <SimpleBarChart data={activityBarData} color="#3b82f6" height={200} />
          ) : (
            <div className="h-[200px] flex flex-col items-center justify-center text-gray-400">
              <Activity className="w-10 h-10 mb-2 text-gray-200" />
              <p className="text-sm">Нет данных за последние 7 дней</p>
            </div>
          )}
        </div>

        {/* Trip status donut */}
        <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #f0f4f8' }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#eff6ff' }}>
              <Route className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Статус поездок</p>
              <p className="text-xs text-gray-500">Всего: {trips.filter(t => !t?.deletedAt).length}</p>
            </div>
          </div>
          {tripStatusData.length > 0 ? (
            <>
              <div className="flex justify-center">
                <DonutChart data={tripStatusData} innerRadius={45} outerRadius={70} size={160} />
              </div>
              <div className="space-y-2 mt-3">
                {tripStatusData.map(item => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-gray-600 text-xs">{item.name}</span>
                    </div>
                    <span className="font-bold text-gray-900 text-sm">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">Нет данных</div>
          )}
        </div>
      </div>

      {/* ── Charts row 2 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Offers status */}
        <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #f0f4f8' }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#fff7ed' }}>
              <Package className="w-4 h-4 text-orange-500" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Статус оферт</p>
              <p className="text-xs text-gray-500">Всего: {offers.length}</p>
            </div>
          </div>
          {offerStatusData.length > 0 ? (
            <>
              <div className="flex justify-center">
                <DonutChart data={offerStatusData} innerRadius={40} outerRadius={65} size={160} />
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3">
                {offerStatusData.map(item => (
                  <div key={item.name} className="text-center p-2 rounded-xl" style={{ background: item.color + '12' }}>
                    <p className="text-lg font-bold" style={{ color: item.color }}>{item.value}</p>
                    <p className="text-[11px] text-gray-500">{item.name}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">Нет данных</div>
          )}
        </div>

        {/* Users by role */}
        <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #f0f4f8' }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#f5f3ff' }}>
              <Users className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Роли пользователей</p>
              <p className="text-xs text-gray-500">Всего: {users.length}</p>
            </div>
          </div>
          {userRoleData.length > 0 ? (
            <>
              <div className="flex justify-center">
                <DonutChart data={userRoleData} innerRadius={40} outerRadius={65} size={160} />
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                {userRoleData.map(item => (
                  <div key={item.name} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: item.color + '12' }}>
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                    <div>
                      <p className="text-lg font-bold" style={{ color: item.color }}>{item.value}</p>
                      <p className="text-[11px] text-gray-600">{item.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">Нет данных</div>
          )}
        </div>
      </div>

      {/* ── Bottom row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent trips */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5" style={{ border: '1px solid #f0f4f8' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#eff6ff' }}>
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
              <p className="font-semibold text-gray-900 text-sm">Последние поездки</p>
            </div>
            <Link to="/admin/trips" className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors">
              Все поездки <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {recentTrips.length === 0 ? (
            <div className="py-10 text-center text-gray-400">
              <Route className="w-10 h-10 mb-2 mx-auto text-gray-200" />
              <p className="text-sm">Поездок пока нет</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentTrips.map(trip => (
                <div key={trip.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: (STATUS_COLOR[trip.status] || '#94a3b8') + '20' }}
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: STATUS_COLOR[trip.status] || '#94a3b8' }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{trip.from} → {trip.to}</p>
                    <p className="text-xs text-gray-500 truncate">{trip.driverName || trip.driverEmail || '—'}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-bold text-gray-700">{trip.pricePerSeat || trip.pricePerKg || '—'} ТЖС</p>
                    <p className="text-xs text-gray-400"><RelTime iso={trip.createdAt} /></p>
                  </div>
                  <span
                    className="hidden sm:inline text-[10px] font-semibold px-2 py-1 rounded-lg flex-shrink-0"
                    style={{
                      background: (STATUS_COLOR[trip.status] || '#94a3b8') + '18',
                      color: STATUS_COLOR[trip.status] || '#94a3b8',
                    }}
                  >
                    {STATUS_LABEL[trip.status] || trip.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top drivers */}
        <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #f0f4f8' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#f0fdf4' }}>
                <Car className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="font-semibold text-gray-900 text-sm">Топ водителей</p>
            </div>
            <Link to="/admin/drivers" className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors">
              Все <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {topDrivers.length === 0 ? (
            <div className="py-10 text-center text-gray-400">
              <Car className="w-10 h-10 mb-2 mx-auto text-gray-200" />
              <p className="text-sm">Нет данных</p>
            </div>
          ) : (
            <div className="space-y-3">
              {topDrivers.map((d, i) => {
                const medals = ['#f59e0b', '#94a3b8', '#d97706'];
                return (
                  <div key={d.email} className="flex items-center gap-3">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ background: medals[i] || '#3b82f6' }}
                    >
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{d.name}</p>
                      <div className="w-full rounded-full h-1.5 mt-1" style={{ background: '#f1f5f9' }}>
                        <div
                          className="h-1.5 rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, (d.trips / (topDrivers[0]?.trips || 1)) * 100)}%`,
                            background: medals[i] || '#3b82f6',
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-bold text-gray-700 flex-shrink-0">{d.trips}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}