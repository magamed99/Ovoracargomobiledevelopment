import { useState, useEffect, useCallback } from 'react';
import { ShieldOff, RefreshCw, Loader2, UserCheck, Search } from 'lucide-react';
import { toast } from 'sonner';
import { getAviaAdminBlacklist, removeFromAviaBlacklist } from '../../api/aviaAdminApi';
import { AdminPageHeader, HeaderBtn, SkeletonList } from './AdminPageHeader';
import { RelTime } from './RelTime';

export function AviaBlacklistManagement() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAviaAdminBlacklist();
      setEntries(data || []);
    } catch {
      toast.error('Ошибка загрузки чёрного списка');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRemove = async (entry: any) => {
    if (!confirm(`Снять блокировку с номера ${entry.phone}? Этот номер снова сможет регистрироваться в AVIA.`)) return;
    setActionLoading(entry.phone);
    try {
      await removeFromAviaBlacklist(entry.phone);
      setEntries(prev => prev.filter(e => e.phone !== entry.phone));
      toast.success(`Номер ${entry.phone} снят с чёрного списка`);
    } catch {
      toast.error('Ошибка снятия блокировки');
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = entries.filter(e => {
    if (!e) return false;
    const q = searchQuery.toLowerCase();
    return !q
      || e.phone?.includes(q)
      || (e.originalName || '').toLowerCase().includes(q);
  });

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Чёрный список (AVIA)"
        subtitle="Номера телефонов, заблокированные после удаления AVIA-аккаунта"
        icon={ShieldOff}
        gradient="linear-gradient(135deg,#dc2626,#ef4444)"
        accent="#dc2626"
        stats={[{ label: 'Всего', value: entries.length }]}
        actions={<HeaderBtn icon={RefreshCw} onClick={load}>Обновить</HeaderBtn>}
      />

      <div className="bg-white rounded-2xl p-4" style={{ border: '1px solid #f0f4f8' }}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Поиск по телефону, имени..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-gray-700 outline-none transition-all"
            style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #f0f4f8' }}>
        {loading ? (
          <SkeletonList rows={6} />
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <ShieldOff className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Чёрный список AVIA пуст</p>
            <p className="text-gray-400 text-sm mt-1">Удалённые AVIA-аккаунты появятся здесь</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(entry => {
              const isLoading = actionLoading === entry.phone;
              return (
                <div key={entry.phone} className="flex items-start sm:items-center flex-wrap sm:flex-nowrap gap-3 px-4 sm:px-5 py-3.5 hover:bg-gray-50 transition-colors">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0"
                    style={{ background: '#ef444420', color: '#dc2626' }}
                  >
                    <ShieldOff className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-sm block truncate text-gray-900">
                      {entry.phone}
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap mt-1">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: '#e0f2fe', color: '#0369a1' }}>
                        ✈ AVIA
                      </span>
                      {entry.originalRole && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                          {entry.originalRole}
                        </span>
                      )}
                    </div>
                    {entry.originalName && (
                      <p className="text-xs text-gray-400 mt-1 truncate">{entry.originalName}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">{entry.reason || '—'}</p>
                  </div>

                  <div className="hidden sm:block text-xs text-gray-400 flex-shrink-0">
                    <RelTime iso={entry.blockedAt} />
                  </div>

                  <button
                    disabled={isLoading}
                    onClick={() => handleRemove(entry)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-600 hover:bg-emerald-50 transition-colors flex-shrink-0"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                    Разблокировать
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 text-center">
        Показано {filtered.length} из {entries.length} записей
      </p>
    </div>
  );
}
