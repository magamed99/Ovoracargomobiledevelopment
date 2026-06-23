import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router';
import { Search, RefreshCw, Package, Clock, CheckCircle, XCircle, ChevronDown, User, Truck, Weight, Download, ClipboardList, Ban } from 'lucide-react';
import { toast } from 'sonner';
import { getAdminOffers, updateAdminOfferStatus } from '../../api/dataApi';
import { AdminPageHeader, HeaderBtn, FilterChips, SkeletonList, Pagination } from './AdminPageHeader';
import { exportCsv } from '../../utils/adminCsvExport';
import { useBulkSelect } from '../../hooks/useBulkSelect';

const PAGE_SIZE = 20;

type StatusFilter = 'all' | 'pending' | 'accepted' | 'rejected';

const STATUS_META: Record<string, { label: string; color: string; bg: string; dot: string; icon: any }> = {
  pending:   { label: 'Ожидает',  color: 'text-amber-700',  bg: 'bg-amber-50 border-amber-200',  dot: 'bg-amber-400',  icon: Clock },
  accepted:  { label: 'Принято',  color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500', icon: CheckCircle },
  rejected:  { label: 'Отменено', color: 'text-red-700',    bg: 'bg-red-50 border-red-200',    dot: 'bg-red-500',    icon: XCircle },
  declined:  { label: 'Отказано', color: 'text-red-700',    bg: 'bg-red-50 border-red-200',    dot: 'bg-red-500',    icon: XCircle },
  cancelled: { label: 'Отменено', color: 'text-red-700',    bg: 'bg-red-50 border-red-200',    dot: 'bg-red-500',    icon: XCircle },
};

function RelTime({ iso }: { iso?: string }) {
  if (!iso) return <span className="text-gray-400">—</span>;
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return <span>только что</span>;
  if (mins < 60) return <span>{mins} мин. назад</span>;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return <span>{hrs} ч. назад</span>;
  return <span>{Math.floor(hrs / 24)} дн. назад</span>;
}

function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] || { label: status, color: 'text-gray-600', bg: 'bg-gray-100 border-gray-200', dot: 'bg-gray-400', icon: Package };
  const Icon = m.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${m.color} ${m.bg}`}>
      <Icon className="w-3 h-3" />
      {m.label}
    </span>
  );
}

export function OffersManagement() {
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [searchParams] = useSearchParams();

  // Переход из глобального поиска в шапке админки (AdminLayout)
  useEffect(() => {
    const q = searchParams.get('q');
    const expand = searchParams.get('expand');
    if (q) setSearch(q);
    if (expand) setExpandedId(expand);
  }, [searchParams]);

  const handleCancel = async (offer: any) => {
    const id = offer.offerId || offer.id;
    if (!offer.tripId || !id) return;
    if (!confirm(`Отменить оферту между ${offer.senderName || offer.senderEmail || 'отправителем'} и ${offer.driverName || offer.driverEmail || 'водителем'}? Это действие для разрешения спора.`)) return;
    setCancellingId(id);
    try {
      await updateAdminOfferStatus(offer.tripId, id, 'cancelled');
      setOffers(prev => prev.map(o => (o.offerId || o.id) === id ? { ...o, status: 'cancelled' } : o));
      toast.success('Оферта отменена администратором');
    } catch {
      toast.error('Ошибка при отмене оферты');
    } finally {
      setCancellingId(null);
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAdminOffers();
      setOffers((data || []).sort(
        (a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      ));
    } catch {
      toast.error('Ошибка загрузки оферт');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const getId = (offer: any) => offer.offerId || offer.id || `${offer.tripId}_${offer.senderEmail}`;

  const handleBulkCancel = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Отменить ${selected.size} оферт? Это действие для разрешения спора.`)) return;
    setBulkLoading(true);
    const ids = Array.from(selected);
    const targets = offers.filter(o => ids.includes(getId(o)));
    const results = await Promise.allSettled(
      targets.map(o => updateAdminOfferStatus(o.tripId, o.offerId || o.id, 'cancelled'))
    );
    const okIds = targets.filter((_, i) => results[i].status === 'fulfilled').map(getId);
    setOffers(prev => prev.map(o => okIds.includes(getId(o)) ? { ...o, status: 'cancelled' } : o));
    const failed = results.length - okIds.length;
    if (okIds.length) toast.success(`Отменено: ${okIds.length}`);
    if (failed) toast.error(`Не удалось отменить: ${failed}`);
    setSelected(new Set());
    setBulkLoading(false);
  };

  const pending   = offers.filter(o => o?.status === 'pending').length;
  const accepted  = offers.filter(o => o?.status === 'accepted').length;
  const cancelled = offers.filter(o => ['rejected','cancelled','declined'].includes(o?.status)).length;
  const convRate  = offers.length > 0 ? Math.round((accepted / offers.length) * 100) : 0;

  const filtered = offers.filter(o => {
    if (!o) return false;
    const q = search.toLowerCase();
    const matchSearch = !q
      || (o.senderEmail || '').toLowerCase().includes(q)
      || (o.driverEmail || '').toLowerCase().includes(q)
      || (o.tripId || '').toLowerCase().includes(q)
      || (o.description || '').toLowerCase().includes(q);
    const st = o.status || 'pending';
    const matchStatus = statusFilter === 'all'
      || (statusFilter === 'rejected' ? (st === 'rejected' || st === 'cancelled' || st === 'declined') : st === statusFilter);
    return matchSearch && matchStatus;
  });

  const cancellableFiltered = filtered.filter(o => ['pending', 'accepted'].includes(o.status || 'pending'));
  const { selected, setSelected, toggleSelect, toggleSelectAll, allVisibleSelected } = useBulkSelect(cancellableFiltered, getId);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Управление офертами"
        subtitle={`Конверсия принятых оферт: ${convRate}%`}
        icon={ClipboardList}
        gradient="linear-gradient(135deg,#d97706,#f59e0b)"
        accent="#d97706"
        stats={[
          { label: 'Всего', value: offers.length },
          { label: 'Ожидают', value: pending },
          { label: 'Принято', value: accepted },
          { label: 'Отменено', value: cancelled },
        ]}
        actions={
          <>
            <HeaderBtn
              icon={Download}
              variant="ghost"
              onClick={() => exportCsv(
                offers.map(o => ({
                  offerId: o.offerId, tripId: o.tripId,
                  sender: o.senderEmail, driver: o.driverEmail,
                  status: o.status, price: o.price, weight: o.weight,
                  created: o.createdAt,
                })),
                `offers_export_${new Date().toISOString().slice(0, 10)}.csv`
              )}
            >
              CSV
            </HeaderBtn>
            <HeaderBtn icon={RefreshCw} onClick={load}>Обновить</HeaderBtn>
          </>
        }
      />

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 space-y-3" style={{ border: '1px solid #f0f4f8' }}>
        <FilterChips
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: 'all',      label: 'Все оферты', count: offers.length },
            { value: 'pending',  label: '⏳ Ожидают',   count: pending },
            { value: 'accepted', label: '✅ Принято',   count: accepted },
            { value: 'rejected', label: '❌ Отменено',  count: cancelled },
          ]}
        />
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Поиск по email, ID рейса..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-gray-700 outline-none transition-all"
            style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
            onFocus={e => { e.currentTarget.style.borderColor = '#d9770666'; e.currentTarget.style.boxShadow = '0 0 0 3px #d9770612'; }}
            onBlur={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}
          />
        </div>
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-2xl" style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}>
          <span className="text-sm font-semibold text-orange-700">Выбрано: {selected.size}</span>
          <div className="flex items-center gap-2 ml-auto">
            <button
              disabled={bulkLoading}
              onClick={handleBulkCancel}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors disabled:opacity-50"
              style={{ background: '#fef2f2', color: '#dc2626' }}
            >
              <Ban className="w-3.5 h-3.5" /> Отменить оферты
            </button>
            <button
              disabled={bulkLoading}
              onClick={() => setSelected(new Set())}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              Снять выделение
            </button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #f0f4f8' }}>
        {loading ? (
          <SkeletonList rows={5} />
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Оферты не найдены</p>
            <p className="text-gray-400 text-sm mt-1">Попробуйте изменить фильтры</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            <div className="flex items-center gap-3 px-4 sm:px-5 py-2" style={{ background: '#f8fafc' }}>
              <input
                type="checkbox"
                checked={allVisibleSelected}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded cursor-pointer accent-orange-600"
              />
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Выбрать все</span>
            </div>
            {paged.map(offer => {
              const id = getId(offer);
              const isExpanded = expandedId === id;
              const status = offer.status || 'pending';
              const meta = STATUS_META[status] || STATUS_META.pending;

              return (
                <div key={id}>
                  <div
                    className="flex items-start sm:items-center gap-3 sm:gap-4 px-3 sm:px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : id)}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(id)}
                      onChange={e => { e.stopPropagation(); toggleSelect(id); }}
                      onClick={e => e.stopPropagation()}
                      disabled={!['pending', 'accepted'].includes(status)}
                      className="w-4 h-4 rounded cursor-pointer accent-orange-600 flex-shrink-0 disabled:opacity-30"
                    />
                    {/* Status dot */}
                    <div className="flex-shrink-0">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ background: meta.dot + '20' }}
                      >
                        <div className="w-3 h-3 rounded-full" style={{ background: meta.dot }} />
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span
                          className="px-2.5 py-0.5 rounded-xl text-xs font-bold"
                          style={{ background: meta.dot + '18', color: meta.color.replace('text-', '') === meta.color ? '#64748b' : undefined }}
                        >
                          <StatusBadge status={status} />
                        </span>
                        <span className="text-xs text-gray-400 font-mono">
                          #{(offer.offerId || offer.tripId || '').slice(-8)}
                        </span>
                        {offer.price && (
                          <span className="text-sm font-bold text-gray-900 ml-1">{offer.price} ТЖС</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 sm:gap-4 text-xs text-gray-500 flex-wrap">
                        <span className="flex items-center gap-1 min-w-0">
                          <User className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{offer.senderName || offer.senderEmail || '—'}</span>
                        </span>
                        <span className="text-gray-300 hidden sm:inline">→</span>
                        <span className="flex items-center gap-1 min-w-0">
                          <Truck className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{offer.driverName || offer.driverEmail || '—'}</span>
                        </span>
                        {offer.weight && (
                          <span className="flex items-center gap-1">
                            <Weight className="w-3 h-3" />
                            {offer.weight} кг
                          </span>
                        )}
                        <span className="flex items-center gap-1 sm:ml-auto">
                          <Clock className="w-3 h-3" />
                          <RelTime iso={offer.createdAt} />
                        </span>
                      </div>
                    </div>

                    <ChevronDown
                      className="w-4 h-4 text-gray-400 flex-shrink-0 transition-transform mt-1 sm:mt-0"
                      style={{ transform: isExpanded ? 'rotate(180deg)' : 'none' }}
                    />
                  </div>

                  {isExpanded && (
                    <div className="px-3 sm:px-5 pb-4 pt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3" style={{ background: '#f8fafc', borderTop: '1px solid #f0f4f8' }}>
                      {[
                        { label: 'Email отправителя', value: offer.senderEmail || '—' },
                        { label: 'Email водителя', value: offer.driverEmail || '—' },
                        { label: 'ID рейса', value: offer.tripId || '—' },
                        { label: 'Цена', value: offer.price ? `${offer.price} ТЖС` : '—' },
                        { label: 'Вес', value: offer.weight ? `${offer.weight} кг` : '—' },
                        { label: 'Создана', value: offer.createdAt ? new Date(offer.createdAt).toLocaleString('ru-RU') : '—' },
                      ].map(f => (
                        <div key={f.label}>
                          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1">{f.label}</p>
                          <p className="text-sm text-gray-900 break-all">{f.value}</p>
                        </div>
                      ))}
                      {offer.description && (
                        <div className="sm:col-span-2 md:col-span-3">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1">Описание</p>
                          <p className="text-sm text-gray-900">{offer.description}</p>
                        </div>
                      )}
                      {(status === 'pending' || status === 'accepted') && (
                        <div className="sm:col-span-2 md:col-span-3 pt-1">
                          <button
                            onClick={e => { e.stopPropagation(); handleCancel(offer); }}
                            disabled={cancellingId === id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-50 w-full sm:w-auto justify-center sm:justify-start"
                          >
                            <Ban className="w-3.5 h-3.5" />
                            {cancellingId === id ? 'Отмена...' : 'Отменить оферту (спор)'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      <p className="text-xs text-gray-400 text-center">
        Показано {paged.length} из {filtered.length} оферт (всего {offers.length})
      </p>
    </div>
  );
}