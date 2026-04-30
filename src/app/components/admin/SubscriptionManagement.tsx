import { useState, useEffect, useCallback } from 'react';
import { AdminPageHeader } from './AdminPageHeader';
import {
  getAllSubscriptions,
  getSubStats,
  activateSubscription,
  grantLifetime,
  revokeSubscription,
  getStatusLabel,
  getDaysLeft,
  PLATFORM_COSTS,
  type Subscription,
  type SubStats,
} from '../../api/subscriptionApi';
import {
  Crown, CheckCircle, XCircle, Clock, RefreshCw,
  TrendingUp, Users, DollarSign, Percent,
  ChevronDown, ChevronUp, Search, MoreVertical,
} from 'lucide-react';
import { toast } from 'sonner';

const ADMIN_EMAIL_KEY = 'ovora_admin_email';

function getAdminEmail(): string {
  return sessionStorage.getItem(ADMIN_EMAIL_KEY) || 'admin@ovora.app';
}

function statusColor(status: Subscription['status']): { bg: string; text: string; dot: string } {
  switch (status) {
    case 'lifetime': return { bg: 'rgba(168,85,247,0.12)', text: '#c084fc', dot: '#a855f7' };
    case 'active':   return { bg: 'rgba(34,197,94,0.12)',  text: '#4ade80', dot: '#22c55e' };
    case 'trial':    return { bg: 'rgba(251,191,36,0.12)', text: '#fbbf24', dot: '#f59e0b' };
    case 'expired':  return { bg: 'rgba(239,68,68,0.12)',  text: '#f87171', dot: '#ef4444' };
  }
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

// ── Stats Card ─────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 14,
      padding: '18px 20px',
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {label}
        </span>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={16} color={color} />
        </div>
      </div>
      <div style={{ fontSize: 28, fontWeight: 900, color: '#e8f4ff', letterSpacing: '-0.5px' }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.35)' }}>{sub}</div>}
    </div>
  );
}

// ── Row actions ─────────────────────────────────────────────────────────────────
function RowActions({ sub, onRefresh }: { sub: Subscription; onRefresh: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const adminEmail = getAdminEmail();

  async function handle(action: 'activate' | 'lifetime' | 'revoke') {
    setLoading(true);
    setOpen(false);
    try {
      if (action === 'activate') await activateSubscription(sub.email, adminEmail);
      if (action === 'lifetime') await grantLifetime(sub.email, adminEmail);
      if (action === 'revoke')   await revokeSubscription(sub.email, adminEmail);
      toast.success('Готово');
      onRefresh();
    } catch (e: any) {
      toast.error(e.message || 'Ошибка');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        disabled={loading}
        style={{
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 7, padding: '5px 8px', cursor: 'pointer', color: '#94a3b8',
          display: 'flex', alignItems: 'center',
        }}
      >
        {loading ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <MoreVertical size={14} />}
      </button>

      {open && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 40 }}
            onClick={() => setOpen(false)}
          />
          <div style={{
            position: 'absolute', right: 0, top: 34, zIndex: 50,
            background: '#0d1b2e', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10, overflow: 'hidden', minWidth: 160,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}>
            {sub.status !== 'active' && sub.status !== 'lifetime' && (
              <button onClick={() => handle('activate')} style={menuItem}>
                <CheckCircle size={13} color="#4ade80" /> Активировать
              </button>
            )}
            {sub.status !== 'lifetime' && (
              <button onClick={() => handle('lifetime')} style={menuItem}>
                <Crown size={13} color="#c084fc" /> Пожизненная
              </button>
            )}
            {sub.status !== 'expired' && (
              <button onClick={() => handle('revoke')} style={{ ...menuItem, color: '#f87171' }}>
                <XCircle size={13} color="#f87171" /> Отозвать
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

const menuItem: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8,
  width: '100%', padding: '9px 14px',
  background: 'none', border: 'none', cursor: 'pointer',
  fontSize: 13, color: '#cbd5e1', textAlign: 'left',
};

// ── Main Component ─────────────────────────────────────────────────────────────
export function SubscriptionManagement() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [stats, setStats] = useState<SubStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'email' | 'status' | 'date'>('date');
  const [sortDesc, setSortDesc] = useState(true);
  const [filterStatus, setFilterStatus] = useState<Subscription['status'] | 'all'>('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, st] = await Promise.all([getAllSubscriptions(), getSubStats()]);
      setSubs(s);
      setStats(st);
    } catch (e: any) {
      toast.error('Ошибка загрузки: ' + (e.message || ''));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Cost coverage calculation
  const exchangeRateTJS = 10.9; // примерный курс USD→TJS
  const annualRevenueTJS = stats ? stats.activeSubscriptions * PLATFORM_COSTS.prices.TJS : 0;
  const annualRevenueUSD = annualRevenueTJS / exchangeRateTJS;
  const costCoverage = PLATFORM_COSTS.annualCostUsd > 0
    ? Math.round((annualRevenueUSD / PLATFORM_COSTS.annualCostUsd) * 100)
    : 0;

  // Filter + sort
  let filtered = subs.filter(s => {
    if (filterStatus !== 'all' && s.status !== filterStatus) return false;
    if (search && !s.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  filtered = filtered.sort((a, b) => {
    let va: string, vb: string;
    if (sort === 'email')  { va = a.email;      vb = b.email; }
    else if (sort === 'status') { va = a.status; vb = b.status; }
    else { va = a.createdAt; vb = b.createdAt; }
    return sortDesc ? vb.localeCompare(va) : va.localeCompare(vb);
  });

  function toggleSort(col: typeof sort) {
    if (sort === col) setSortDesc(d => !d);
    else { setSort(col); setSortDesc(true); }
  }

  const SortIcon = ({ col }: { col: typeof sort }) =>
    sort === col
      ? (sortDesc ? <ChevronDown size={12} /> : <ChevronUp size={12} />)
      : null;

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <AdminPageHeader
        title="Подписки"
        subtitle="Управление годовыми подписками пользователей"
      />

      {/* ── Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        <StatCard
          icon={Users} label="Всего пользователей"
          value={stats?.totalUsers ?? '—'}
          color="#38bdf8"
        />
        <StatCard
          icon={CheckCircle} label="Активных подписок"
          value={stats?.activeSubscriptions ?? '—'}
          sub={`+ ${stats?.trialUsers ?? 0} на пробном`}
          color="#4ade80"
        />
        <StatCard
          icon={DollarSign} label="Доход в год"
          value={stats ? `${annualRevenueTJS.toLocaleString('ru-RU')} с.` : '—'}
          sub={`≈ $${annualRevenueUSD.toFixed(0)} / $${PLATFORM_COSTS.annualCostUsd.toLocaleString()} расходов`}
          color="#fbbf24"
        />
        <StatCard
          icon={Percent} label="Покрытие расходов"
          value={stats ? `${costCoverage}%` : '—'}
          sub={costCoverage >= 100 ? '✅ Расходы покрыты' : '⚠️ Требуется больше подписчиков'}
          color={costCoverage >= 100 ? '#4ade80' : '#f87171'}
        />
      </div>

      {/* ── Toolbar ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск по email..."
            style={{
              width: '100%', paddingLeft: 32, paddingRight: 12, paddingTop: 9, paddingBottom: 9,
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 9, color: '#cbd5e1', fontSize: 13, outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Status filter */}
        {(['all', 'trial', 'active', 'expired', 'lifetime'] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            style={{
              padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              border: filterStatus === s ? '1px solid rgba(56,189,248,0.5)' : '1px solid rgba(255,255,255,0.07)',
              background: filterStatus === s ? 'rgba(56,189,248,0.1)' : 'rgba(255,255,255,0.03)',
              color: filterStatus === s ? '#38bdf8' : '#64748b',
            }}
          >
            {s === 'all' ? 'Все' : getStatusLabel(s as Subscription['status'])}
          </button>
        ))}

        {/* Refresh */}
        <button
          onClick={load}
          disabled={loading}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            border: '1px solid rgba(56,189,248,0.3)',
            background: 'rgba(56,189,248,0.08)', color: '#38bdf8',
          }}
        >
          <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          Обновить
        </button>
      </div>

      {/* ── Table ── */}
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 14, overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 130px 90px 100px 100px 80px',
          padding: '12px 18px',
          background: 'rgba(255,255,255,0.03)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          gap: 8,
        }}>
          {[
            { label: 'Email',   col: 'email' as const },
            { label: 'Статус',  col: 'status' as const },
            { label: 'Истекает', col: null },
            { label: 'ID перевода', col: null },
            { label: 'Дата рег.', col: 'date' as const },
            { label: '',  col: null },
          ].map(({ label, col }) => (
            <div
              key={label}
              onClick={col ? () => toggleSort(col) : undefined}
              style={{
                fontSize: 11, fontWeight: 700, color: '#475569',
                textTransform: 'uppercase', letterSpacing: '0.07em',
                cursor: col ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', gap: 4,
                userSelect: 'none',
              }}
            >
              {label}
              {col && <SortIcon col={col} />}
            </div>
          ))}
        </div>

        {/* Rows */}
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#475569' }}>Загрузка...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#475569' }}>Нет данных</div>
        ) : (
          filtered.map(sub => {
            const sc = statusColor(sub.status);
            const days = getDaysLeft(sub);
            const endDate = sub.status === 'trial' ? sub.trialEndsAt : sub.expiresAt;

            return (
              <div
                key={sub.email}
                style={{
                  display: 'grid', gridTemplateColumns: '1fr 130px 90px 100px 100px 80px',
                  padding: '13px 18px', gap: 8, alignItems: 'center',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                }}
              >
                {/* Email */}
                <div style={{ fontSize: 13, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {sub.email}
                </div>

                {/* Status badge */}
                <div>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '3px 9px', borderRadius: 20,
                    background: sc.bg, color: sc.text, fontSize: 11.5, fontWeight: 700,
                  }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: sc.dot }} />
                    {getStatusLabel(sub.status)}
                  </span>
                </div>

                {/* Days left */}
                <div style={{ fontSize: 12, color: days <= 3 && sub.status !== 'lifetime' ? '#f87171' : '#64748b' }}>
                  {sub.status === 'lifetime' ? '∞' : endDate ? `${fmtDate(endDate)}` : '—'}
                </div>

                {/* TX ID */}
                <div style={{ fontSize: 11, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {sub.txId || '—'}
                </div>

                {/* Created at */}
                <div style={{ fontSize: 11.5, color: '#475569' }}>
                  {fmtDate(sub.createdAt)}
                </div>

                {/* Actions */}
                <RowActions sub={sub} onRefresh={load} />
              </div>
            );
          })
        )}
      </div>

      {/* Summary */}
      {!loading && (
        <div style={{ marginTop: 10, fontSize: 12, color: '#334155', textAlign: 'right' }}>
          Показано {filtered.length} из {subs.length}
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
