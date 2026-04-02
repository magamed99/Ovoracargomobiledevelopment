import { useState, useEffect, useCallback } from 'react';
import {
  Search, MoreVertical, Car, Star, CheckCircle, RefreshCw,
  Loader2, UserX, UserCheck, Trash2, ChevronDown, ChevronUp,
  Package, MapPin, TrendingUp, Award,
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { toast } from 'sonner';
import { getAdminUsers, getAdminTrips, getAdminOffers, adminHeaders } from '../../api/dataApi';
import { projectId } from '../../../../utils/supabase/info';
import { AdminPageHeader, HeaderBtn, FilterChips, SkeletonList } from './AdminPageHeader';

const BASE = `https://${projectId}.supabase.co/functions/v1/make-server-4e36197a`;

async function setUserStatus(email: string, status: string) {
  const res = await fetch(`${BASE}/admin/users/${encodeURIComponent(email)}/status`, {
    method: 'PUT', headers: adminHeaders(), body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
async function deleteUser(email: string) {
  const res = await fetch(`${BASE}/admin/users/${encodeURIComponent(email)}`, {
    method: 'DELETE', headers: adminHeaders(),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function RelTime({ iso }: { iso?: string }) {
  if (!iso) return <span className="text-gray-400">—</span>;
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return <span>{Math.max(0, mins)} мин. назад</span>;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return <span>{hrs} ч. назад</span>;
  return <span>{Math.floor(hrs / 24)} дн. назад</span>;
}

export function DriversManagement() {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [tripsByDriver, setTripsByDriver] = useState<Record<string, number>>({});
  const [offersByDriver, setOffersByDriver] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('trips');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [usersData, tripsData, offersData] = await Promise.all([
        getAdminUsers(), getAdminTrips(), getAdminOffers(),
      ]);
      setDrivers((usersData || []).filter((u: any) => u?.role === 'driver'));

      const tbd: Record<string, number> = {};
      (tripsData || []).forEach((t: any) => {
        if (t?.driverEmail) tbd[t.driverEmail] = (tbd[t.driverEmail] || 0) + 1;
      });
      setTripsByDriver(tbd);

      const obd: Record<string, number> = {};
      (offersData || []).filter((o: any) => o?.status === 'accepted').forEach((o: any) => {
        const trip = (tripsData || []).find((t: any) => String(t.id) === String(o.tripId));
        if (trip?.driverEmail) obd[trip.driverEmail] = (obd[trip.driverEmail] || 0) + 1;
      });
      setOffersByDriver(obd);
    } catch {
      toast.error('Ошибка загрузки водителей');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleStatus = async (driver: any, status: string) => {
    setActionLoading(driver.email);
    try {
      await setUserStatus(driver.email, status);
      setDrivers(prev => prev.map(d => d.email === driver.email ? { ...d, status } : d));
      toast.success(status === 'blocked' ? `${driver.firstName} заблокирован` : `${driver.firstName} разблокирован`);
    } catch { toast.error('Ошибка изменения статуса'); }
    finally { setActionLoading(null); }
  };

  const handleDelete = async (driver: any) => {
    if (!confirm(`Удалить водителя ${driver.firstName} ${driver.lastName}?`)) return;
    setActionLoading(driver.email);
    try {
      await deleteUser(driver.email);
      setDrivers(prev => prev.filter(d => d.email !== driver.email));
      toast.success('Водитель удалён');
    } catch { toast.error('Ошибка удаления'); }
    finally { setActionLoading(null); }
  };

  const activeCount = drivers.filter(d => d.status !== 'blocked').length;
  const blockedCount = drivers.filter(d => d.status === 'blocked').length;
  const verifiedCount = drivers.filter(d => d.isVerified || d.documentsVerified).length;

  const maxTrips = Math.max(1, ...Object.values(tripsByDriver));

  const filtered = drivers
    .filter(d => {
      const name = `${d.firstName || ''} ${d.lastName || ''}`.toLowerCase();
      const q = searchQuery.toLowerCase();
      const matchSearch = !q || name.includes(q) || (d.email || '').toLowerCase().includes(q) || (d.phone || '').includes(q);
      const isBlocked = d.status === 'blocked';
      const matchStatus = statusFilter === 'all'
        || (statusFilter === 'blocked' ? isBlocked : !isBlocked)
        || (statusFilter === 'verified' ? (d.isVerified || d.documentsVerified) : true);
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'trips') return (tripsByDriver[b.email] || 0) - (tripsByDriver[a.email] || 0);
      if (sortBy === 'name') return `${a.firstName}${a.lastName}`.localeCompare(`${b.firstName}${b.lastName}`);
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Управление водителями"
        subtitle="Все зарегистрированные водители платформы"
        icon={Car}
        gradient="linear-gradient(135deg,#1565d8,#2385f4)"
        accent="#1565d8"
        stats={[
          { label: 'Всего', value: drivers.length },
          { label: 'Активных', value: activeCount },
          { label: 'Верифицировано', value: verifiedCount },
          ...(blockedCount > 0 ? [{ label: 'Заблокировано', value: blockedCount }] : []),
        ]}
        actions={<HeaderBtn icon={RefreshCw} onClick={load}>Обновить</HeaderBtn>}
      />

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 space-y-3" style={{ border: '1px solid #f0f4f8' }}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Поиск по имени, email, телефону..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-gray-700 outline-none transition-all"
            style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
            onFocus={e => { e.currentTarget.style.borderColor = '#2385f466'; e.currentTarget.style.boxShadow = '0 0 0 3px #1565d812'; }}
            onBlur={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}
          />
        </div>
        <div className="flex flex-wrap gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-1.5">Статус</p>
            <FilterChips
              value={statusFilter as any}
              onChange={setStatusFilter as any}
              options={[
                { value: 'all', label: 'Все', count: drivers.length },
                { value: 'active', label: '✅ Активные', count: activeCount },
                { value: 'verified', label: '🔵 Верифицированные', count: verifiedCount },
                { value: 'blocked', label: '🚫 Заблокированные', count: blockedCount },
              ]}
            />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-1.5">Сортировка</p>
            <FilterChips
              value={sortBy as any}
              onChange={setSortBy as any}
              options={[
                { value: 'trips', label: 'По поездкам' },
                { value: 'name', label: 'По имени' },
                { value: 'date', label: 'По дате' },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #f0f4f8' }}>
          <SkeletonList rows={4} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl py-16 text-center" style={{ border: '1px solid #f0f4f8' }}>
          <Car className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Водители не найдены</p>
          <p className="text-gray-400 text-sm mt-1">Попробуйте изменить фильтры</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((driver, rank) => {
            const isBlocked = driver.status === 'blocked';
            const isExpanded = expandedId === driver.email;
            const isLoading = actionLoading === driver.email;
            const initials = `${(driver.firstName || '?')[0]}${(driver.lastName || '?')[0]}`.toUpperCase();
            const fullName = `${driver.firstName || ''} ${driver.lastName || ''}`.trim() || driver.email;
            const tripsCount = tripsByDriver[driver.email] || 0;
            const offersCount = offersByDriver[driver.email] || 0;
            const isVerified = driver.isVerified || driver.documentsVerified;
            const tripPct = Math.round((tripsCount / maxTrips) * 100);

            return (
              <div
                key={driver.email}
                className="bg-white rounded-2xl overflow-hidden transition-all hover:shadow-lg"
                style={{
                  border: `1px solid ${isBlocked ? '#fecaca' : '#f0f4f8'}`,
                  background: isBlocked ? '#fff9f9' : '#ffffff',
                }}
              >
                {/* Top accent bar */}
                <div
                  className="h-1"
                  style={{
                    background: isBlocked
                      ? '#ef4444'
                      : rank === 0 && tripsCount > 0
                      ? 'linear-gradient(90deg,#f59e0b,#fbbf24)'
                      : 'linear-gradient(90deg,#1565d8,#2385f4)',
                  }}
                />

                <div className="p-5">
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-sm overflow-hidden"
                        style={{
                          background: isBlocked
                            ? '#94a3b8'
                            : 'linear-gradient(135deg,#1565d8,#2385f4)',
                        }}
                      >
                        {driver.avatarUrl
                          ? <img src={driver.avatarUrl} alt={fullName} className="w-full h-full object-cover" />
                          : initials}
                      </div>
                      {rank === 0 && tripsCount > 0 && !isBlocked && (
                        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
                          <Award className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={`font-bold text-sm ${isBlocked ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                          {fullName}
                        </h3>
                        {isVerified && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xl text-xs font-semibold" style={{ background: '#eff6ff', color: '#1565d8' }}>
                            <CheckCircle className="w-3 h-3" /> Верифицирован
                          </span>
                        )}
                        {isBlocked && (
                          <span className="px-2 py-0.5 rounded-xl text-xs font-semibold bg-red-100 text-red-600">🚫 Заблокирован</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{driver.email}</p>
                      {driver.phone && <p className="text-xs text-gray-500 mt-0.5">{driver.phone}</p>}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : driver.email)}
                        className="p-1.5 hover:bg-gray-100 rounded-xl text-gray-400 transition-colors"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button disabled={isLoading} className="p-1.5 hover:bg-gray-100 rounded-xl text-gray-400 transition-colors">
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MoreVertical className="w-4 h-4" />}
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          {isBlocked ? (
                            <DropdownMenuItem onClick={() => handleStatus(driver, 'active')} className="text-emerald-600">
                              <UserCheck className="w-4 h-4 mr-2" /> Разблокировать
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleStatus(driver, 'blocked')} className="text-orange-600">
                              <UserX className="w-4 h-4 mr-2" /> Заблокировать
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleDelete(driver)} className="text-red-600">
                            <Trash2 className="w-4 h-4 mr-2" /> Удалить
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="mt-4 pt-3" style={{ borderTop: '1px solid #f0f4f8' }}>
                    <div className="flex items-center gap-4 mb-3">
                      <div className="text-center">
                        <p className="text-xl font-black text-gray-900">{tripsCount}</p>
                        <p className="text-[11px] text-gray-500 font-medium">Поездок</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-black text-emerald-600">{offersCount}</p>
                        <p className="text-[11px] text-gray-500 font-medium">Принято</p>
                      </div>
                      {driver.vehicle && (
                        <div className="flex-1 text-right">
                          <p className="text-xs font-semibold text-gray-700 truncate">
                            {driver.vehicle.model || driver.vehicle.type || '—'}
                          </p>
                          <p className="text-xs text-gray-400">{driver.vehicle.plate || '—'}</p>
                        </div>
                      )}
                    </div>

                    {/* Activity bar */}
                    {tripsCount > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] text-gray-400 font-medium flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" /> Активность
                          </span>
                          <span className="text-[11px] font-bold" style={{ color: '#1565d8' }}>{tripPct}%</span>
                        </div>
                        <div className="w-full rounded-full h-1.5" style={{ background: '#f1f5f9' }}>
                          <div
                            className="h-1.5 rounded-full transition-all"
                            style={{
                              width: `${tripPct}%`,
                              background: rank === 0 ? '#f59e0b' : '#1565d8',
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Expanded */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 grid grid-cols-2 gap-3" style={{ borderTop: '1px solid #f0f4f8' }}>
                      {[
                        { label: 'Регистрация', value: driver.createdAt ? new Date(driver.createdAt).toLocaleDateString('ru-RU') : '—' },
                        { label: 'Город', value: driver.city || '—' },
                        { label: 'Email', value: driver.email },
                        { label: 'Статус', value: isVerified ? '✅ Верифицирован' : '⏳ Не верифицирован' },
                      ].map(f => (
                        <div key={f.label}>
                          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1">{f.label}</p>
                          <p className="text-sm text-gray-900 break-all">{f.value}</p>
                        </div>
                      ))}
                      {driver.vehicle?.model && (
                        <div className="col-span-2">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1">Транспорт</p>
                          <p className="text-sm text-gray-900">
                            {[driver.vehicle.model, driver.vehicle.year, '•', driver.vehicle.plate].filter(Boolean).join(' ')}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-gray-400 text-center">
        Показано {filtered.length} из {drivers.length} водителей
      </p>
    </div>
  );
}
