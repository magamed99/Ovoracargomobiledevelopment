import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router';
import { Search, RefreshCw, Boxes, Clock, CheckCircle, XCircle, ChevronDown, Weight, Download, MapPin, Ban, Pencil, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getAdminCargos, deleteAdminCargo, updateAdminCargo } from '../../api/dataApi';
import { AdminPageHeader, HeaderBtn, FilterChips, SkeletonList, Pagination } from './AdminPageHeader';
import { exportCsv } from '../../utils/adminCsvExport';

const PAGE_SIZE = 20;

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
  const [currencyFilter, setCurrencyFilter] = useState('all');
  const [weightMin, setWeightMin] = useState('');
  const [weightMax, setWeightMax] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [editingCargo, setEditingCargo] = useState<any | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
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

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, currencyFilter, weightMin, weightMax, dateFrom, dateTo]);

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleBulkRemove = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Снять с публикации ${selected.size} грузов?`)) return;
    setBulkLoading(true);
    const ids = Array.from(selected);
    const results = await Promise.allSettled(ids.map(id => deleteAdminCargo(id)));
    const okIds = ids.filter((_, i) => results[i].status === 'fulfilled');
    setCargos(prev => prev.map(cg => okIds.includes(cg.id) ? { ...cg, status: 'cancelled' } : cg));
    const failed = results.length - okIds.length;
    if (okIds.length) toast.success(`Снято: ${okIds.length}`);
    if (failed) toast.error(`Не удалось снять: ${failed}`);
    setSelected(new Set());
    setBulkLoading(false);
  };

  const handleSaveEdit = async (updates: Record<string, unknown>) => {
    if (!editingCargo) return;
    try {
      const updated = await updateAdminCargo(editingCargo.id, updates);
      setCargos(prev => prev.map(cg => cg.id === editingCargo.id ? { ...cg, ...updated } : cg));
      toast.success('Груз обновлён');
      setEditingCargo(null);
    } catch {
      toast.error('Ошибка при сохранении');
    }
  };

  const active    = cargos.filter(cg => (cg?.status || 'active') === 'active').length;
  const matched   = cargos.filter(cg => cg?.status === 'matched').length;
  const cancelled = cargos.filter(cg => cg?.status === 'cancelled').length;

  const currencies = Array.from(new Set(cargos.map(cg => cg?.currency).filter(Boolean)));

  const filtered = cargos.filter(cg => {
    if (!cg) return false;
    const q = search.toLowerCase();
    const matchSearch = !q
      || (cg.senderEmail || '').toLowerCase().includes(q)
      || (cg.senderName || '').toLowerCase().includes(q)
      || (cg.senderPhone || '').includes(q)
      || (cg.from || '').toLowerCase().includes(q)
      || (cg.to || '').toLowerCase().includes(q)
      || (cg.notes || '').toLowerCase().includes(q);
    const st = cg.status || 'active';
    const matchStatus = statusFilter === 'all' || st === statusFilter;
    const matchCurrency = currencyFilter === 'all' || cg.currency === currencyFilter;
    const weight = parseFloat(cg.cargoWeight);
    const matchWeightMin = !weightMin || (!isNaN(weight) && weight >= parseFloat(weightMin));
    const matchWeightMax = !weightMax || (!isNaN(weight) && weight <= parseFloat(weightMax));
    const createdTime = cg.createdAt ? new Date(cg.createdAt).getTime() : 0;
    const matchDateFrom = !dateFrom || createdTime >= new Date(dateFrom).getTime();
    const matchDateTo = !dateTo || createdTime <= new Date(dateTo).getTime() + 86400000;
    return matchSearch && matchStatus && matchCurrency && matchWeightMin && matchWeightMax && matchDateFrom && matchDateTo;
  });

  const removableFiltered = filtered.filter(cg => (cg.status || 'active') !== 'cancelled');
  const allVisibleSelected = removableFiltered.length > 0 && removableFiltered.every(cg => selected.has(cg.id));
  const toggleSelectAll = () => {
    setSelected(allVisibleSelected ? new Set() : new Set(removableFiltered.map(cg => cg.id)));
  };

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
                filtered.map(cg => ({
                  id: cg.id, from: cg.from, to: cg.to,
                  sender: cg.senderEmail, senderPhone: cg.senderPhone || '', status: cg.status,
                  weight: cg.cargoWeight, budget: cg.budget, currency: cg.currency || '',
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
            placeholder="Поиск по email, телефону, маршруту..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-gray-700 outline-none transition-all"
            style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
            onFocus={e => { e.currentTarget.style.borderColor = '#0891b266'; e.currentTarget.style.boxShadow = '0 0 0 3px #0891b212'; }}
            onBlur={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}
          />
        </div>

        {currencies.length > 0 && (
          <FilterChips
            value={currencyFilter}
            onChange={setCurrencyFilter}
            options={[{ value: 'all', label: 'Все валюты' }, ...currencies.map(c => ({ value: c, label: c }))]}
          />
        )}

        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Weight className="w-3.5 h-3.5 text-gray-400" />
            <input
              type="number"
              placeholder="Вес от"
              value={weightMin}
              onChange={e => setWeightMin(e.target.value)}
              className="w-24 px-3 py-1.5 rounded-xl text-sm text-gray-700 outline-none"
              style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
            />
            <span className="text-gray-400">—</span>
            <input
              type="number"
              placeholder="до"
              value={weightMax}
              onChange={e => setWeightMax(e.target.value)}
              className="w-24 px-3 py-1.5 rounded-xl text-sm text-gray-700 outline-none"
              style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
            />
            <span className="text-xs text-gray-400">кг</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="px-3 py-1.5 rounded-xl text-sm text-gray-700 outline-none"
              style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
            />
            <span className="text-gray-400">—</span>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="px-3 py-1.5 rounded-xl text-sm text-gray-700 outline-none"
              style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
            />
          </div>
        </div>
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-2xl" style={{ background: '#ecfeff', border: '1px solid #a5f3fc' }}>
          <span className="text-sm font-semibold text-cyan-700">Выбрано: {selected.size}</span>
          <div className="flex items-center gap-2 ml-auto">
            <button
              disabled={bulkLoading}
              onClick={handleBulkRemove}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors disabled:opacity-50"
              style={{ background: '#fef2f2', color: '#dc2626' }}
            >
              <Ban className="w-3.5 h-3.5" /> Снять с публикации
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
            <Boxes className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Грузы не найдены</p>
            <p className="text-gray-400 text-sm mt-1">Попробуйте изменить фильтры</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            <div className="flex items-center gap-3 px-4 sm:px-5 py-2" style={{ background: '#f8fafc' }}>
              <input
                type="checkbox"
                checked={allVisibleSelected}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded cursor-pointer accent-cyan-600"
              />
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Выбрать все</span>
            </div>
            {paged.map(cargo => {
              const id = cargo.id;
              const isExpanded = expandedId === id;
              const status = cargo.status || 'active';
              const meta = STATUS_META[status] || STATUS_META.active;

              return (
                <div key={id}>
                  <div
                    className="flex items-start sm:items-center gap-3 sm:gap-4 px-3 sm:px-5 py-3 sm:py-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : id)}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(id)}
                      onChange={e => { e.stopPropagation(); toggleSelect(id); }}
                      onClick={e => e.stopPropagation()}
                      disabled={status === 'cancelled'}
                      className="w-4 h-4 rounded cursor-pointer accent-cyan-600 flex-shrink-0 disabled:opacity-30"
                    />
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
                      <div className="flex items-center gap-2 sm:gap-4 text-xs text-gray-500 flex-wrap">
                        <span className="flex items-center gap-1 min-w-0">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{cargo.from || '—'}</span>
                        </span>
                        <span className="text-gray-300">→</span>
                        <span className="truncate">{cargo.to || '—'}</span>
                        {cargo.cargoWeight && (
                          <span className="flex items-center gap-1">
                            <Weight className="w-3 h-3" />
                            {cargo.cargoWeight} кг
                          </span>
                        )}
                        <span className="flex items-center gap-1 sm:ml-auto">
                          <Clock className="w-3 h-3" />
                          <RelTime iso={cargo.createdAt} />
                        </span>
                      </div>
                    </div>

                    <ChevronDown
                      className="w-4 h-4 text-gray-400 flex-shrink-0 transition-transform mt-1 sm:mt-0"
                      style={{ transform: isExpanded ? 'rotate(180deg)' : 'none' }}
                    />
                  </div>

                  {isExpanded && (
                    <div className="px-3 sm:px-5 pb-4 pt-3 grid grid-cols-2 md:grid-cols-3 gap-3" style={{ background: '#f8fafc', borderTop: '1px solid #f0f4f8' }}>
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
                      <div className="col-span-2 md:col-span-3 pt-1 flex gap-2">
                        <button
                          onClick={e => { e.stopPropagation(); setEditingCargo(cargo); }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Редактировать
                        </button>
                        {status !== 'cancelled' && (
                          <button
                            onClick={e => { e.stopPropagation(); handleRemove(cargo); }}
                            disabled={removingId === id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-50"
                          >
                            <Ban className="w-3.5 h-3.5" />
                            {removingId === id ? 'Снятие...' : 'Снять груз (модерация)'}
                          </button>
                        )}
                      </div>
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
        Показано {paged.length} из {filtered.length} грузов (всего {cargos.length})
      </p>

      {editingCargo && (
        <EditCargoModal
          cargo={editingCargo}
          onClose={() => setEditingCargo(null)}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
}

function EditCargoModal({ cargo, onClose, onSave }: { cargo: any; onClose: () => void; onSave: (u: Record<string, unknown>) => Promise<void> }) {
  const [from, setFrom] = useState(cargo.from || '');
  const [to, setTo] = useState(cargo.to || '');
  const [cargoWeight, setCargoWeight] = useState(cargo.cargoWeight || '');
  const [budget, setBudget] = useState(cargo.budget || '');
  const [currency, setCurrency] = useState(cargo.currency || '');
  const [notes, setNotes] = useState(cargo.notes || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await onSave({ from, to, cargoWeight, budget, currency, notes });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.5)' }} onClick={onClose}>
      <div className="bg-white rounded-2xl p-5 w-full max-w-md space-y-3" onClick={e => e.stopPropagation()}>
        <h3 className="font-bold text-gray-900">Редактировать груз</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-semibold text-gray-400 uppercase">Откуда</label>
            <input value={from} onChange={e => setFrom(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-xl text-sm" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }} />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-gray-400 uppercase">Куда</label>
            <input value={to} onChange={e => setTo(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-xl text-sm" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }} />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-gray-400 uppercase">Вес (кг)</label>
            <input value={cargoWeight} onChange={e => setCargoWeight(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-xl text-sm" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }} />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-gray-400 uppercase">Бюджет</label>
            <input value={budget} onChange={e => setBudget(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-xl text-sm" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }} />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-gray-400 uppercase">Валюта</label>
            <input value={currency} onChange={e => setCurrency(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-xl text-sm" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }} />
          </div>
        </div>
        <div>
          <label className="text-[11px] font-semibold text-gray-400 uppercase">Заметки</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="w-full mt-1 px-3 py-2 rounded-xl text-sm resize-none" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }} />
        </div>
        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">Отмена</button>
          <button onClick={handleSubmit} disabled={saving} className="flex-1 py-2 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5">
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}
