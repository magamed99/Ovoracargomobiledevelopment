import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router';
import {
  Search, Users as UsersIcon,
  Car, RefreshCw, Loader2, Download,
  Trash2, UserCheck, UserX, ChevronDown, ChevronUp, MoreVertical,
  ShieldOff, Shield,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { toast } from 'sonner';
import { getAdminUsers, adminHeaders } from '../../api/dataApi';
import { projectId } from '../../../../utils/supabase/info';
import { AdminPageHeader, HeaderBtn, FilterChips, SkeletonList } from './AdminPageHeader';

const BASE = `https://${projectId}.supabase.co/functions/v1/make-server-4e36197a`;

// ── CSV export ────────────────────────────────────────────────────────────────
function exportCsv(rows: Record<string, any>[], filename: string) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const esc = (v: any) => {
    const s = String(v ?? '').replace(/"/g, '""');
    return /[,"\n]/.test(s) ? `"${s}"` : s;
  };
  const csv = [keys.join(','), ...rows.map(r => keys.map(k => esc(r[k])).join(','))].join('\n');
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })),
    download: filename,
  });
  a.click();
  URL.revokeObjectURL(a.href);
}

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
  if (mins < 1) return <span>только что</span>;
  if (mins < 60) return <span>{mins} мин. назад</span>;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return <span>{hrs} ч. назад</span>;
  const days = Math.floor(hrs / 24);
  if (days < 30) return <span>{days} дн. назад</span>;
  return <span>{new Date(iso).toLocaleDateString('ru-RU')}</span>;
}

export function UsersManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAdminUsers();
      setUsers(data || []);
    } catch {
      toast.error('Ошибка загрузки пользователей');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleStatus = async (user: any, status: string) => {
    setActionLoading(user.email);
    try {
      await setUserStatus(user.email, status);
      setUsers(prev => prev.map(u => u.email === user.email ? { ...u, status } : u));
      toast.success(status === 'blocked' ? `${user.firstName} заблокирован` : `${user.firstName} разблокирован`);
    } catch {
      toast.error('Ошибка изменения статуса');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (user: any) => {
    if (!confirm(`Удалить пользователя ${user.firstName} ${user.lastName}? Это нельзя отменить.`)) return;
    setActionLoading(user.email);
    try {
      await deleteUser(user.email);
      setUsers(prev => prev.filter(u => u.email !== user.email));
      toast.success('Пользователь удалён');
    } catch {
      toast.error('Ошибка удаления');
    } finally {
      setActionLoading(null);
    }
  };

  const drivers = users.filter(u => u?.role === 'driver').length;
  const senders = users.filter(u => u?.role === 'sender').length;
  const blocked = users.filter(u => u?.status === 'blocked').length;

  const filtered = users
    .filter(u => {
      if (!u) return false;
      const name = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
      const q = searchQuery.toLowerCase();
      const matchSearch = !q || name.includes(q) || (u.email || '').toLowerCase().includes(q) || (u.phone || '').includes(q);
      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      const matchStatus = statusFilter === 'all'
        || (statusFilter === 'blocked' ? u.status === 'blocked' : u.status !== 'blocked');
      return matchSearch && matchRole && matchStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'name') {
        const na = `${a.firstName} ${a.lastName}`.toLowerCase();
        const nb = `${b.firstName} ${b.lastName}`.toLowerCase();
        return sortDir === 'asc' ? na.localeCompare(nb) : nb.localeCompare(na);
      }
      const ta = new Date(a.createdAt || 0).getTime();
      const tb = new Date(b.createdAt || 0).getTime();
      return sortDir === 'asc' ? ta - tb : tb - ta;
    });

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Управление пользователями"
        subtitle="Все зарегистрированные аккаунты платформы"
        icon={UsersIcon}
        gradient="linear-gradient(135deg,#7c3aed,#8b5cf6)"
        accent="#7c3aed"
        stats={[
          { label: 'Всего', value: users.length },
          { label: 'Водителей', value: drivers },
          { label: 'Отправителей', value: senders },
          ...(blocked > 0 ? [{ label: 'Заблокировано', value: blocked }] : []),
        ]}
        actions={
          <>
            <HeaderBtn
              icon={Download}
              variant="ghost"
              onClick={() => exportCsv(
                filtered.map(u => ({ email: u.email, name: `${u.firstName || ''} ${u.lastName || ''}`.trim(), role: u.role, phone: u.phone || '', city: u.city || '', status: u.status || 'active', created: u.createdAt || '' })),
                `users_export_${new Date().toISOString().slice(0, 10)}.csv`
              )}
            >
              CSV
            </HeaderBtn>
            <HeaderBtn icon={RefreshCw} onClick={load}>Обновить</HeaderBtn>
          </>
        }
      />

      {/* ── Filters ── */}
      <div className="bg-white rounded-2xl p-4 space-y-3" style={{ border: '1px solid #f0f4f8' }}>
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Поиск по имени, email, телефону..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-gray-700 outline-none transition-all"
            style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
            onFocus={e => { e.currentTarget.style.borderColor = '#7c3aed66'; e.currentTarget.style.boxShadow = '0 0 0 3px #7c3aed12'; }}
            onBlur={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}
          />
        </div>

        <div className="flex flex-wrap gap-4">
          {/* Role chips */}
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Роль</p>
            <FilterChips
              value={roleFilter as any}
              onChange={setRoleFilter as any}
              options={[
                { value: 'all', label: 'Все', count: users.length },
                { value: 'driver', label: '🚛 Водители', count: drivers },
                { value: 'sender', label: '📦 Отправители', count: senders },
              ]}
            />
          </div>
          {/* Status chips */}
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Статус</p>
            <FilterChips
              value={statusFilter as any}
              onChange={setStatusFilter as any}
              options={[
                { value: 'all', label: 'Все' },
                { value: 'active', label: '✅ Активные' },
                { value: 'blocked', label: '🚫 Заблокированные', count: blocked },
              ]}
            />
          </div>
          {/* Sort */}
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Сортировка</p>
            <FilterChips
              value={`${sortBy}_${sortDir}` as any}
              onChange={(v: string) => {
                const [s, d] = v.split('_');
                setSortBy(s as any);
                setSortDir(d as any);
              }}
              options={[
                { value: 'date_desc', label: 'Новые' },
                { value: 'date_asc', label: 'Старые' },
                { value: 'name_asc', label: 'А–Я' },
                { value: 'name_desc', label: 'Я–А' },
              ]}
            />
          </div>
        </div>
      </div>

      {/* ── List ── */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #f0f4f8' }}>
        {loading ? (
          <SkeletonList rows={6} />
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <UsersIcon className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Пользователи не найдены</p>
            <p className="text-gray-400 text-sm mt-1">Попробуйте изменить фильтры</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(user => {
              const isBlocked = user.status === 'blocked';
              const isExpanded = expandedId === user.email;
              const isLoading = actionLoading === user.email;
              const initials = `${(user.firstName || '?')[0]}${(user.lastName || '?')[0]}`.toUpperCase();
              const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;

              return (
                <div key={user.email} style={{ background: isBlocked ? '#fef2f210' : undefined }}>
                  <div className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                    {/* Avatar */}
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden"
                      style={{
                        background: isBlocked
                          ? '#94a3b8'
                          : user.role === 'driver'
                          ? 'linear-gradient(135deg,#1565d8,#2385f4)'
                          : 'linear-gradient(135deg,#7c3aed,#8b5cf6)',
                      }}
                    >
                      {user.avatarUrl
                        ? <img src={user.avatarUrl} alt={fullName} className="w-full h-full object-cover" />
                        : initials}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-semibold text-sm ${isBlocked ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                          {fullName}
                        </span>
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-semibold"
                          style={
                            user.role === 'driver'
                              ? { background: '#eff6ff', color: '#1d4ed8' }
                              : { background: '#f5f3ff', color: '#6d28d9' }
                          }
                        >
                          {user.role === 'driver' ? '🚛 Водитель' : '📦 Отправитель'}
                        </span>
                        {isBlocked && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-600">
                            🚫 Заблокирован
                          </span>
                        )}
                        {user.documentsVerified && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                            ✓ Верифицирован
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{user.email}</p>
                    </div>

                    <div className="hidden md:block text-sm text-gray-500 flex-shrink-0">{user.phone || '—'}</div>
                    <div className="hidden lg:block text-xs text-gray-400 flex-shrink-0">
                      <RelTime iso={user.createdAt} />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {user.role === 'driver' && (
                        <Link
                          to="/admin/drivers"
                          className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-xl transition-colors"
                          style={{ background: '#eff6ff', color: '#1565d8' }}
                        >
                          <Car className="w-3.5 h-3.5" /> Водитель
                        </Link>
                      )}
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : user.email)}
                        className="p-1.5 hover:bg-gray-100 rounded-xl text-gray-400 transition-colors"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            disabled={isLoading}
                            className="p-1.5 hover:bg-gray-100 rounded-xl text-gray-400 transition-colors"
                          >
                            {isLoading
                              ? <Loader2 className="w-4 h-4 animate-spin" />
                              : <MoreVertical className="w-4 h-4" />}
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          {isBlocked ? (
                            <DropdownMenuItem onClick={() => handleStatus(user, 'active')} className="text-emerald-600">
                              <UserCheck className="w-4 h-4 mr-2" /> Разблокировать
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleStatus(user, 'blocked')} className="text-orange-600">
                              <UserX className="w-4 h-4 mr-2" /> Заблокировать
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleDelete(user)} className="text-red-600">
                            <Trash2 className="w-4 h-4 mr-2" /> Удалить
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Expanded */}
                  {isExpanded && (
                    <div className="px-5 pb-4 pt-3 grid grid-cols-2 md:grid-cols-4 gap-4" style={{ background: '#f8fafc', borderTop: '1px solid #f0f4f8' }}>
                      {[
                        { label: 'Email', value: user.email },
                        { label: 'Телефон', value: user.phone || '—' },
                        { label: 'Город', value: user.city || '—' },
                        { label: 'Регистрация', value: user.createdAt ? new Date(user.createdAt).toLocaleDateString('ru-RU') : '—' },
                      ].map(f => (
                        <div key={f.label}>
                          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">{f.label}</p>
                          <p className="text-sm text-gray-900 break-all">{f.value}</p>
                        </div>
                      ))}
                      {user.vehicle && (
                        <div className="col-span-2">
                          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Транспорт</p>
                          <p className="text-sm text-gray-900">
                            {[user.vehicle.model, user.vehicle.plate, user.vehicle.type].filter(Boolean).join(' • ')}
                          </p>
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
        Показано {filtered.length} из {users.length} пользователей
      </p>
    </div>
  );
}