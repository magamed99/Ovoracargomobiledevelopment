import { useState, useEffect, useCallback } from 'react';
import {
  Search, MapPin, Clock, DollarSign, Package, Car, Calendar,
  XCircle, CheckCircle, AlertCircle, RefreshCw, Loader2,
  ChevronDown, ChevronUp, Trash2, Share2, Download, Route,
} from 'lucide-react';
import { toast } from 'sonner';
import { getAdminTrips, getAdminOffers, adminHeaders } from '../../api/dataApi';
import { projectId } from '../../../../utils/supabase/info';
import { AdminPageHeader, HeaderBtn, FilterChips, SkeletonList } from './AdminPageHeader';

const BASE = `https://${projectId}.supabase.co/functions/v1/make-server-4e36197a`;

// ── CSV export ────────────────────────────────────────────────────────────────
function exportCsv(rows: Record<string, any>[], filename: string) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const esc = (v: any) => { const s = String(v ?? '').replace(/"/g, '""'); return /[,"\n]/.test(s) ? `"${s}"` : s; };
  const csv = [keys.join(','), ...rows.map(r => keys.map(k => esc(r[k])).join(','))].join('\n');
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })),
    download: filename,
  });
  a.click(); URL.revokeObjectURL(a.href);
}

async function cancelTrip(id: string) {
  const res = await fetch(`${BASE}/trips/${id}`, {
    method: 'DELETE', headers: adminHeaders(),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function RelTime({ iso }: { iso?: string }) {
  if (!iso) return <span className="text-gray-400">—</span>;
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return <span>{Math.max(0, mins)} мин.</span>;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return <span>{hrs} ч.</span>;
  return <span>{Math.floor(hrs / 24)} дн.</span>;
}

export function TripsManagement() {
  const [trips, setTrips] = useState<any[]>([]);
  const [offersByTrip, setOffersByTrip] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [tripsData, offersData] = await Promise.all([getAdminTrips(), getAdminOffers()]);
      setTrips(tripsData || []);
      const obt: Record<string, any[]> = {};
      (offersData || []).forEach((o: any) => {
        if (!o?.tripId) return;
        if (!obt[o.tripId]) obt[o.tripId] = [];
        obt[o.tripId].push(o);
      });
      setOffersByTrip(obt);
    } catch {
      toast.error('Ошибка загрузки поездок');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCancel = async (trip: any) => {
    if (!confirm(`Отменить поездку ${trip.from} → ${trip.to}?`)) return;
    setActionLoading(trip.id);
    try {
      await cancelTrip(trip.id);
      setTrips(prev => prev.map(t => t.id === trip.id ? { ...t, deletedAt: new Date().toISOString(), status: 'cancelled' } : t));
      toast.success('Поездка отменена');
    } catch {
      toast.error('Ошибка отмены');
    } finally {
      setActionLoading(null);
    }
  };

  const statusCounts = {
    all: trips.length,
    active: trips.filter(t => t?.status === 'active' && !t.deletedAt).length,
    completed: trips.filter(t => t?.status === 'completed').length,
    scheduled: trips.filter(t => t?.status === 'scheduled').length,
    cancelled: trips.filter(t => t?.status === 'cancelled' || t?.deletedAt).length,
  };

  const filtered = trips
    .filter(t => {
      if (!t) return false;
      const q = searchQuery.toLowerCase();
      const matchSearch = !q
        || (t.from || '').toLowerCase().includes(q)
        || (t.to || '').toLowerCase().includes(q)
        || (t.driverName || '').toLowerCase().includes(q)
        || (t.driverEmail || '').toLowerCase().includes(q);
      const isCancel = t.status === 'cancelled' || t.deletedAt;
      const matchStatus = statusFilter === 'all'
        || (statusFilter === 'cancelled' ? isCancel : t.status === statusFilter && !isCancel);
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      const [field, dir] = sortBy.split('_');
      const ta = new Date(a.createdAt || 0).getTime();
      const tb = new Date(b.createdAt || 0).getTime();
      if (field === 'date') return dir === 'desc' ? tb - ta : ta - tb;
      if (field === 'price') {
        const pa = parseFloat(String(a.pricePerSeat || a.pricePerKg || 0));
        const pb = parseFloat(String(b.pricePerSeat || b.pricePerKg || 0));
        return dir === 'desc' ? pb - pa : pa - pb;
      }
      return 0;
    });

  const STATUS_META: Record<string, { label: string; dot: string; bg: string; text: string }> = {
    active:    { label: 'Активная',      dot: '#3b82f6', bg: '#eff6ff', text: '#1d4ed8' },
    completed: { label: 'Завершена',     dot: '#10b981', bg: '#f0fdf4', text: '#15803d' },
    cancelled: { label: 'Отменена',      dot: '#ef4444', bg: '#fef2f2', text: '#dc2626' },
    scheduled: { label: 'Запланирована', dot: '#f59e0b', bg: '#fffbeb', text: '#b45309' },
  };

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Управление поездками"
        subtitle="Все поездки платформы в реальном времени"
        icon={Route}
        gradient="linear-gradient(135deg,#059669,#10b981)"
        accent="#059669"
        stats={[
          { label: 'Всего', value: statusCounts.all },
          { label: 'Активных', value: statusCounts.active },
          { label: 'Завершено', value: statusCounts.completed },
          { label: 'Запланировано', value: statusCounts.scheduled },
        ]}
        actions={
          <>
            <HeaderBtn
              icon={Download}
              variant="ghost"
              onClick={() => exportCsv(
                filtered.map(t => ({
                  id: t.id, from: t.from, to: t.to,
                  date: t.departureDate || t.date, status: t.status,
                  driver: t.driverName || t.driverEmail,
                  pricePerSeat: t.pricePerSeat, pricePerKg: t.pricePerKg,
                  created: t.createdAt,
                })),
                `trips_export_${new Date().toISOString().slice(0, 10)}.csv`
              )}
            >
              CSV
            </HeaderBtn>
            <HeaderBtn icon={RefreshCw} onClick={load}>Обновить</HeaderBtn>
          </>
        }
      />

      {/* Status filter chips */}
      <div className="bg-white rounded-2xl p-4 space-y-3" style={{ border: '1px solid #f0f4f8' }}>
        <FilterChips
          value={statusFilter as any}
          onChange={setStatusFilter as any}
          options={[
            { value: 'all',       label: 'Все поездки',   count: statusCounts.all },
            { value: 'active',    label: '🔵 Активные',    count: statusCounts.active },
            { value: 'completed', label: '✅ Завершены',   count: statusCounts.completed },
            { value: 'scheduled', label: '🕐 Запланированы', count: statusCounts.scheduled },
            { value: 'cancelled', label: '❌ Отменены',    count: statusCounts.cancelled },
          ]}
        />
        <div className="flex gap-3 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск по маршруту, водителю..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-gray-700 outline-none transition-all"
              style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
              onFocus={e => { e.currentTarget.style.borderColor = '#05996666'; e.currentTarget.style.boxShadow = '0 0 0 3px #05996612'; }}
              onBlur={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}
            />
          </div>
          <FilterChips
            value={sortBy as any}
            onChange={setSortBy as any}
            options={[
              { value: 'date_desc', label: 'Новые' },
              { value: 'date_asc',  label: 'Старые' },
              { value: 'price_desc', label: 'Дороже' },
              { value: 'price_asc',  label: 'Дешевле' },
            ]}
          />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #f0f4f8' }}>
          <SkeletonList rows={5} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl py-16 text-center" style={{ border: '1px solid #f0f4f8' }}>
          <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Поездки не найдены</p>
          <p className="text-gray-400 text-sm mt-1">Попробуйте изменить фильтры</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(trip => {
            const isExpanded = expandedId === trip.id;
            const isActLoading = actionLoading === trip.id;
            const isCancelled = trip.status === 'cancelled' || trip.deletedAt;
            const statusKey = isCancelled ? 'cancelled' : (trip.status || 'active');
            const meta = STATUS_META[statusKey] || STATUS_META.active;
            const tripOffers = offersByTrip[trip.id] || [];
            const acceptedOffers = tripOffers.filter(o => o.status === 'accepted');
            const pendingOffers = tripOffers.filter(o => o.status === 'pending');

            return (
              <div
                key={trip.id}
                className="bg-white rounded-2xl overflow-hidden transition-all hover:shadow-md"
                style={{
                  border: '1px solid #f0f4f8',
                  opacity: isCancelled ? 0.7 : 1,
                }}
              >
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Status icon */}
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: meta.bg }}
                    >
                      <div className="w-3 h-3 rounded-full" style={{ background: meta.dot }} />
                    </div>

                    {/* Route */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-bold text-gray-900 text-sm">
                          {trip.from} → {trip.to}
                        </span>
                        <span
                          className="px-2.5 py-0.5 rounded-xl text-xs font-bold"
                          style={{ background: meta.bg, color: meta.text }}
                        >
                          {meta.label}
                        </span>
                        {pendingOffers.length > 0 && (
                          <span className="px-2 py-0.5 rounded-xl text-xs font-semibold" style={{ background: '#fffbeb', color: '#b45309' }}>
                            {pendingOffers.length} ожид.
                          </span>
                        )}
                        {acceptedOffers.length > 0 && (
                          <span className="px-2 py-0.5 rounded-xl text-xs font-semibold" style={{ background: '#f0fdf4', color: '#15803d' }}>
                            {acceptedOffers.length} принят.
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Car className="w-3 h-3" />
                          {trip.driverName || trip.driverEmail || '—'}
                        </span>
                        {trip.departureDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {trip.departureDate}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <RelTime iso={trip.createdAt} /> назад
                        </span>
                      </div>
                    </div>

                    {/* Price + actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {(trip.pricePerSeat || trip.pricePerKg) && (
                        <div
                          className="hidden sm:block px-3 py-1.5 rounded-xl text-right"
                          style={{ background: '#f8fafc' }}
                        >
                          <p className="text-sm font-bold text-gray-900">
                            {trip.pricePerSeat ? `${trip.pricePerSeat}` : `${trip.pricePerKg}`}
                          </p>
                          <p className="text-[11px] text-gray-400">
                            {trip.pricePerSeat ? 'ТЖС/мест' : 'ТЖС/кг'}
                          </p>
                        </div>
                      )}
                      <button
                        onClick={async () => {
                          const url = `${window.location.origin}/trip/${trip.id}`;
                          if (navigator.share) await navigator.share({ title: `${trip.from} → ${trip.to}`, url });
                          else { await navigator.clipboard.writeText(url); toast.success('Ссылка скопирована'); }
                        }}
                        className="p-1.5 hover:bg-blue-50 text-blue-400 rounded-xl transition-colors"
                        title="Скопировать ссылку"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : trip.id)}
                        className="p-1.5 hover:bg-gray-100 text-gray-400 rounded-xl transition-colors"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      {!isCancelled && (
                        <button
                          onClick={() => handleCancel(trip)}
                          disabled={isActLoading}
                          className="p-1.5 hover:bg-red-50 text-red-400 rounded-xl transition-colors"
                          title="Отменить поездку"
                        >
                          {isActLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 grid grid-cols-2 md:grid-cols-4 gap-3" style={{ borderTop: '1px solid #f0f4f8' }}>
                      {[
                        { label: 'Email водителя', value: trip.driverEmail || '—' },
                        { label: 'Мест / Груз', value: [trip.availableSeats ? `${trip.availableSeats} мест` : '', trip.cargoCapacity ? `${trip.cargoCapacity} кг` : ''].filter(Boolean).join(', ') || '—' },
                        { label: 'Создана', value: trip.createdAt ? new Date(trip.createdAt).toLocaleString('ru-RU') : '—' },
                        { label: 'ID', value: trip.id?.slice(0, 14) + '...' },
                      ].map(f => (
                        <div key={f.label}>
                          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1">{f.label}</p>
                          <p className="text-sm text-gray-900 break-all font-mono text-xs">{f.value}</p>
                        </div>
                      ))}
                      {tripOffers.length > 0 && (
                        <div className="col-span-2 md:col-span-4">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-2">
                            Оферты по поездке ({tripOffers.length})
                          </p>
                          <div className="space-y-1.5">
                            {tripOffers.slice(0, 5).map(offer => (
                              <div key={offer.offerId} className="flex items-center gap-3 p-2 rounded-xl text-xs" style={{ background: '#f8fafc' }}>
                                <span
                                  className="px-2 py-0.5 rounded-lg font-semibold"
                                  style={
                                    offer.status === 'accepted' ? { background: '#f0fdf4', color: '#15803d' } :
                                    offer.status === 'pending'  ? { background: '#fffbeb', color: '#b45309' } :
                                    { background: '#fef2f2', color: '#dc2626' }
                                  }
                                >
                                  {offer.status === 'accepted' ? 'Принята' : offer.status === 'pending' ? 'Ожидает' : 'Отклонена'}
                                </span>
                                <span className="text-gray-700 flex-1">{offer.senderName || offer.senderEmail || '—'}</span>
                                <span className="font-bold text-gray-900">{offer.price || '—'} ТЖС</span>
                              </div>
                            ))}
                            {tripOffers.length > 5 && (
                              <p className="text-xs text-gray-400 pl-2">+ ещё {tripOffers.length - 5}</p>
                            )}
                          </div>
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
        Показано {filtered.length} из {trips.length} поездок
      </p>
    </div>
  );
}