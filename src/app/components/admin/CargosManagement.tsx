import { useState, useEffect, useCallback } from 'react';
import { Search, RefreshCw, Boxes, Clock, CheckCircle, XCircle, ChevronDown, Weight, Download, MapPin, Ban } from 'lucide-react';
import { toast } from 'sonner';
import { getAdminCargos, deleteAdminCargo } from '../../api/dataApi';
import { AdminPageHeader, HeaderBtn, FilterChips, SkeletonList } from './AdminPageHeader';

// ── CSV export ─────────────────────────────────────────────────────────────────
function exportCsv(rows: Record<string, any>[], filename: string) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const esc = (v: any) => { const s = String(v ?? '').replace(/"/g, '""'); return /[,"\n]/.test(s) ? `"${s}"` : s; };
  const csv = [keys.join(','), ...rows.map(r => keys.map(k => esc(r[k])).join(','))].join('\n');
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })),
    download: filename,
  });
  a.click(); URL.revokeObjectURL(a.href);
}

type StatusFilter = 'all' | 'active' | 'matched' | 'cancelled';

const STATUS_META: Record<string, { label: string; color: string; bg: string; dot: string; icon: any }> = {
  active:    { label: 'Активен',  color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500', icon: CheckCircle },
  matched:   { label: 'Подобран', color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200',    dot: 'bg-blue-500',    icon: Clock },
  completed: { label: 'Завершён', color: 'text-gray-600',    bg: 'bg-gray-100 border-gray-200',   dot: 'bg-gray-400',    icon: CheckCircle },
  cancelled: { label: 'Отменён',  color: 'text-red-700',     bg: 'bg-red-50 border-red-200',      dot: 'bg-red-500',     icon: XCircle },
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
  const m = STATUS_META[status] || { label: status, color: 'text-gray-600', bg: 'bg-gray-100 border-gray-200', dot: 'bg-gray-400', icon: Boxes };
  const Icon = m.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${m.color} ${m.bg}`}>
      <Icon className="w-3 h-3" />
      {m.label}
    </span>
  );
}

export function CargosManagement() {
  const [cargos, setCargos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleRemove = async (cargo: any) => {
    if (!cargo.id) return;
    if (!confirm(`Снять груз ${cargo.from || ''} → ${cargo.to || ''} (${cargo.senderName || cargo.senderEmail || 'отправитель'})? Это действие для модерации/разрешения спора.`)) return;
    setRemovingId(cargo.id);
    try {
      await deleteAdminCargo(cargo.id);
      setCargos(prev => prev.map(cg => cg.id === cargo.id ? { ...cg, status: 'cancelled' } : cg));
      toast.success('Груз снят с публикации');
    } catch {
      toast.error('Ошибка при снятии груза');
    } finally {
      setRemovingId(null);
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAdminCargos();
      setCargos((data || []).sort(
        (a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      ));
    } catch {
      toast.error('Ошибка загрузки грузов');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const active    = cargos.filter(cg => (cg?.status || 'active') === 'active').length;
  const matched   = cargos.filter(cg => cg?.status === 'matched').length;
  const cancelled = cargos.filter(cg => cg?.status === 'cancelled').length;

  const filtered = cargos.filter(cg => {
    if (!cg) return false;
    const q = search.toLowerCase();
    const matchSearch = !q
      || (cg.senderEmail || '').toLowerCase().includes(q)
      || (cg.senderName || '').toLowerCase().includes(q)
      || (cg.from || '').toLowerCase().includes(q)
      || (cg.to || '').toLowerCase().includes(q)
      || (cg.notes || '').toLowerCase().includes(q);
    const st = cg.status || 'active';
    const matchStatus = statusFilter === 'all' || st === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Управление грузами"
        subtitle="Объявления отправителей о грузах"
        icon={Boxes}
        gradient="linear-gradient(135deg,#0891b2,#06b6d4)"
        accent="#0891b2"
        stats={[
          { label: 'Всего', value: cargos.length },
          { label: 'Активны', value: active },
          { label: 'Подобраны', value: matched },
          { label: 'Отменены', value: cancelled },
        ]}
        actions={
          <>
            <HeaderBtn
              icon={Download}
              variant="ghost"
              onClick={() => exportCsv(
                cargos.map(cg => ({
                  id: cg.id, from: cg.from, to: cg.to,
                  sender: cg.senderEmail, status: cg.status,
                  weight: cg.cargoWeight, budget: cg.budget,
                  created: cg.createdAt,
                })),
                `cargos_export_${new Date().toISOString().slice(0, 10)}.csv`
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
            { value: 'all',       label: 'Все грузы',  count: cargos.length },
            { value: 'active',    label: '✅ Активны',  count: active },
            { value: 'matched',   label: '⏳ Подобраны', count: matched },
            { value: 'cancelled', label: '❌ Отменены', count: cancelled },
          ]}
        />
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Поиск по email, маршруту..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-gray-700 outline-none transition-all"
            style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
            onFocus={e => { e.currentTarget.style.borderColor = '#0891b266'; e.currentTarget.style.boxShadow = '0 0 0 3px #0891b212'; }}
            onBlur={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}
          />
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #f0f4f8' }}>
        {loading ? (
          <SkeletonList rows={5} />
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Boxes className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Грузы не найдены</p>
            <p className="text-gray-400 text-sm mt-1">Попробуйте изменить фильтры</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(cargo => {
              const id = cargo.id;
              const isExpanded = expandedId === id;
              const status = cargo.status || 'active';
              const meta = STATUS_META[status] || STATUS_META.active;

              return (
                <div key={id}>
                  <div
                    className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : id)}
                  >
                    <div className="flex-shrink-0">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ background: meta.dot + '20' }}
                      >
                        <div className="w-3 h-3 rounded-full" style={{ background: meta.dot }} />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <StatusBadge status={status} />
                        <span className="text-xs text-gray-400 font-mono">
                          #{(cargo.id || '').slice(-8)}
                        </span>
                        {cargo.budget && (
                          <span className="text-sm font-bold text-gray-900 ml-1">{cargo.budget} {cargo.currency || ''}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {cargo.from || '—'}
                        </span>
                        <span className="text-gray-300">→</span>
                        <span>{cargo.to || '—'}</span>
                        {cargo.cargoWeight && (
                          <span className="flex items-center gap-1">
                            <Weight className="w-3 h-3" />
                            {cargo.cargoWeight} кг
                          </span>
                        )}
                        <span className="flex items-center gap-1 ml-auto">
                          <Clock className="w-3 h-3" />
                          <RelTime iso={cargo.createdAt} />
                        </span>
                      </div>
                    </div>

                    <ChevronDown
                      className="w-4 h-4 text-gray-400 flex-shrink-0 transition-transform"
                      style={{ transform: isExpanded ? 'rotate(180deg)' : 'none' }}
                    />
                  </div>

                  {isExpanded && (
                    <div className="px-5 pb-4 pt-3 grid grid-cols-2 md:grid-cols-3 gap-3" style={{ background: '#f8fafc', borderTop: '1px solid #f0f4f8' }}>
                      {[
                        { label: 'Отправитель', value: cargo.senderName || '—' },
                        { label: 'Email отправителя', value: cargo.senderEmail || '—' },
                        { label: 'Телефон', value: cargo.senderPhone || '—' },
                        { label: 'Вес груза', value: cargo.cargoWeight ? `${cargo.cargoWeight} кг` : '—' },
                        { label: 'Бюджет', value: cargo.budget ? `${cargo.budget} ${cargo.currency || ''}` : '—' },
                        { label: 'Создан', value: cargo.createdAt ? new Date(cargo.createdAt).toLocaleString('ru-RU') : '—' },
                      ].map(f => (
                        <div key={f.label}>
                          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1">{f.label}</p>
                          <p className="text-sm text-gray-900 break-all">{f.value}</p>
                        </div>
                      ))}
                      {cargo.notes && (
                        <div className="col-span-2 md:col-span-3">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1">Заметки</p>
                          <p className="text-sm text-gray-900">{cargo.notes}</p>
                        </div>
                      )}
                      {status !== 'cancelled' && (
                        <div className="col-span-2 md:col-span-3 pt-1">
                          <button
                            onClick={e => { e.stopPropagation(); handleRemove(cargo); }}
                            disabled={removingId === id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-50"
                          >
                            <Ban className="w-3.5 h-3.5" />
                            {removingId === id ? 'Снятие...' : 'Снять груз (модерация)'}
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

      <p className="text-xs text-gray-400 text-center">
        Показано {filtered.length} из {cargos.length} грузов
      </p>
    </div>
  );
}
