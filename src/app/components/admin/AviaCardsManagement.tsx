import { useState, useEffect, useCallback } from 'react';
import { Boxes, RefreshCw, Loader2, Download, Trash2, Plane, Package } from 'lucide-react';
import { toast } from 'sonner';
import { getAviaAdminDeals, getAviaAdminFlights, deleteAviaAdminDeal } from '../../api/aviaAdminApi';
import { AdminPageHeader, HeaderBtn, FilterChips, SkeletonList } from './AdminPageHeader';

function exportCsv(rows: Record<string, any>[], filename: string) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const esc = (v: any) => {
    const s = String(v ?? '').replace(/"/g, '""');
    return /[,"\n]/.test(s) ? `"${s}"` : s;
  };
  const csv = [keys.join(','), ...rows.map(r => keys.map(k => esc(r[k])).join(','))].join('\n');
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })),
    download: filename,
  });
  a.click();
  URL.revokeObjectURL(a.href);
}

const STATUS_LABELS: Record<string, string> = {
  pending: '⏳ Ожидает', accepted: '🤝 Принята', rejected: '❌ Отклонена',
  cancelled: '🚫 Отменена', completed: '⭐ Завершена',
  active: '✅ Активен', in_progress: '✈ В пути', closed: '🔒 Закрыт',
};

export function AviaCardsManagement() {
  const [tab, setTab] = useState<'deals' | 'flights'>('deals');
  const [deals, setDeals] = useState<any[]>([]);
  const [flights, setFlights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [d, f] = await Promise.all([getAviaAdminDeals(), getAviaAdminFlights()]);
      setDeals(d || []);
      setFlights(f || []);
    } catch {
      toast.error('Ошибка загрузки карточек AVIA');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDeleteDeal = async (deal: any) => {
    if (!confirm(`Удалить сделку ${deal.id}? Действие затронет обе стороны.`)) return;
    setActionLoading(deal.id);
    try {
      await deleteAviaAdminDeal(deal.id);
      setDeals(prev => prev.map(d => d.id === deal.id ? { ...d, deletedAt: new Date().toISOString() } : d));
      toast.success('Сделка удалена');
    } catch {
      toast.error('Ошибка удаления');
    } finally {
      setActionLoading(null);
    }
  };

  const activeDeals = deals.filter(d => !d.deletedAt);
  const deletedDeals = deals.filter(d => d.deletedAt);

  const filteredDeals = (statusFilter === 'all' ? deals : deals.filter(d => d.status === statusFilter));
  const filteredFlights = (statusFilter === 'all' ? flights : flights.filter(f => f.status === statusFilter));

  const dealStatuses = Array.from(new Set(deals.map(d => d.status))).filter(Boolean);
  const flightStatuses = Array.from(new Set(flights.map(f => f.status))).filter(Boolean);

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="AVIA — Карточки"
        subtitle="Все сделки и рейсы, включая удалённые (полный аудит)"
        icon={Boxes}
        gradient="linear-gradient(135deg,#f59e0b,#fbbf24)"
        accent="#f59e0b"
        stats={[
          { label: 'Сделок', value: deals.length },
          { label: 'Активных', value: activeDeals.length },
          { label: 'Удалённых', value: deletedDeals.length },
          { label: 'Рейсов', value: flights.length },
        ]}
        actions={
          <>
            <HeaderBtn
              icon={Download}
              variant="ghost"
              onClick={() => exportCsv(
                tab === 'deals'
                  ? filteredDeals.map(d => ({ id: d.id, status: d.status, initiator: d.initiatorPhone, recipient: d.recipientPhone, dealType: d.dealType, weightKg: d.weightKg, price: d.price, created: d.createdAt, deleted: d.deletedAt || '' }))
                  : filteredFlights.map(f => ({ id: f.id, status: f.status, courier: f.courierId, from: f.from, to: f.to, date: f.date, freeKg: f.freeKg, created: f.createdAt })),
                `avia_${tab}_export_${new Date().toISOString().slice(0, 10)}.csv`
              )}
            >
              CSV
            </HeaderBtn>
            <HeaderBtn icon={RefreshCw} onClick={load}>Обновить</HeaderBtn>
          </>
        }
      />

      <div className="bg-white rounded-2xl p-4 space-y-3" style={{ border: '1px solid #f0f4f8' }}>
        <div className="flex flex-wrap gap-4">
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Тип карточек</p>
            <FilterChips
              value={tab}
              onChange={v => { setTab(v); setStatusFilter('all'); }}
              options={[
                { value: 'deals', label: '🤝 Сделки', count: deals.length },
                { value: 'flights', label: '✈ Рейсы', count: flights.length },
              ]}
            />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Статус</p>
            <FilterChips
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'all', label: 'Все' },
                ...(tab === 'deals' ? dealStatuses : flightStatuses).map(s => ({ value: s, label: STATUS_LABELS[s] || s })),
              ]}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #f0f4f8' }}>
        {loading ? (
          <SkeletonList rows={6} />
        ) : tab === 'deals' ? (
          filteredDeals.length === 0 ? (
            <EmptyState icon={Package} text="Сделки не найдены" />
          ) : (
            <div className="divide-y divide-gray-50">
              {filteredDeals.map(deal => (
                <div key={deal.id} className="flex items-start gap-3 px-3 sm:px-5 py-3.5" style={{ opacity: deal.deletedAt ? 0.5 : 1 }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#fef3c7' }}>
                    <Package className="w-4 h-4" style={{ color: '#d97706' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900 break-words">{deal.adFrom} → {deal.adTo}</span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: '#f1f5f9', color: '#475569' }}>
                        {STATUS_LABELS[deal.status] || deal.status}
                      </span>
                      {deal.deletedAt && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-600">Удалена</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 break-words">
                      {deal.initiatorPhone} → {deal.recipientPhone} · {deal.dealType === 'docs' ? 'документы' : `${deal.weightKg} кг`}{deal.price ? ` · $${deal.price}` : ''}
                    </p>
                    <div className="text-xs text-gray-400 mt-0.5 md:hidden">
                      {deal.createdAt ? new Date(deal.createdAt).toLocaleDateString('ru-RU') : '—'}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 flex-shrink-0 hidden md:block">
                    {deal.createdAt ? new Date(deal.createdAt).toLocaleDateString('ru-RU') : '—'}
                  </div>
                  {!deal.deletedAt && (
                    <button
                      onClick={() => handleDeleteDeal(deal)}
                      disabled={actionLoading === deal.id}
                      className="p-1.5 hover:bg-red-50 rounded-xl text-red-400 hover:text-red-600 transition-colors flex-shrink-0"
                    >
                      {actionLoading === deal.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )
        ) : (
          filteredFlights.length === 0 ? (
            <EmptyState icon={Plane} text="Рейсы не найдены" />
          ) : (
            <div className="divide-y divide-gray-50">
              {filteredFlights.map(flight => (
                <div key={flight.id} className="flex items-start gap-3 px-3 sm:px-5 py-3.5" style={{ opacity: flight.isDeleted ? 0.5 : 1 }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#e0f2fe' }}>
                    <Plane className="w-4 h-4" style={{ color: '#0369a1' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900 break-words">{flight.from} → {flight.to}</span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: '#f1f5f9', color: '#475569' }}>
                        {STATUS_LABELS[flight.status] || flight.status}
                      </span>
                      {flight.isDeleted && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-600">Удалён</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 break-words">
                      {flight.courierId} · {flight.date} · свободно {flight.freeKg} кг
                    </p>
                    <div className="text-xs text-gray-400 mt-0.5 md:hidden">
                      {flight.createdAt ? new Date(flight.createdAt).toLocaleDateString('ru-RU') : '—'}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 flex-shrink-0 hidden md:block">
                    {flight.createdAt ? new Date(flight.createdAt).toLocaleDateString('ru-RU') : '—'}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div className="py-16 text-center">
      <Icon className="w-12 h-12 text-gray-200 mx-auto mb-3" />
      <p className="text-gray-500 font-medium">{text}</p>
    </div>
  );
}
