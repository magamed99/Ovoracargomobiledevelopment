import { useState, useEffect } from 'react';
import { ArrowLeft, Star, Truck, TrendingUp, BarChart2, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../contexts/UserContext';
import { useLanguage } from '../context/LanguageContext';
import { getMyTrips, getUserStats, getOffersForDriver } from '../api/dataApi';

function formatMonth(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ru-RU', { month: 'short', year: '2-digit' });
}

function groupEarningsByMonth(offers: any[]): { month: string; amount: number }[] {
  const accepted = offers.filter(o => o.status === 'accepted' && o.price && o.createdAt);
  const map: Record<string, number> = {};
  for (const o of accepted) {
    const key = formatMonth(o.createdAt);
    map[key] = (map[key] || 0) + Number(o.price);
  }
  return Object.entries(map)
    .map(([month, amount]) => ({ month, amount }))
    .slice(-6);
}

function StarRating({ value }: { value: number }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          size={14}
          fill={i <= Math.round(value) ? '#f59e0b' : 'none'}
          color={i <= Math.round(value) ? '#f59e0b' : '#3d5263'}
        />
      ))}
    </div>
  );
}

export function DriverStatsPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { user } = useUser();
  const { t } = useLanguage();
  const isDark = theme === 'dark';

  const bg  = isDark ? '#0e1621' : '#ffffff';
  const cardBg = isDark ? '#131f2e' : '#f8fafc';
  const border = isDark ? '#1e2d3d' : '#f0f2f5';
  const txt = isDark ? '#ffffff' : '#0f172a';
  const sub = isDark ? '#6b7f94' : '#94a3b8';

  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState<any[]>([]);
  const [stats, setStats] = useState({ tripCount: 0, reviewCount: 0, avgRating: 0, reviews: [] as any[] });
  const [earnings, setEarnings] = useState<{ month: string; amount: number }[]>([]);

  useEffect(() => {
    if (!user?.email) return;
    const email = user.email;

    Promise.all([
      getMyTrips(email),
      getUserStats(email, 'driver'),
      getOffersForDriver(email),
    ]).then(([myTrips, userStats, offers]) => {
      setTrips(myTrips);
      setStats(userStats);
      setEarnings(groupEarningsByMonth(offers));
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user?.email]);

  const completed = trips.filter(t => t.status === 'completed').length;
  const active    = trips.filter(t => t.status === 'active' || t.status === 'in_progress').length;
  const maxEarning = earnings.length ? Math.max(...earnings.map(e => e.amount)) : 1;

  return (
    <div style={{ minHeight: '100vh', background: bg, color: txt, fontFamily: "'Sora', sans-serif" }}>

      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: isDark ? 'rgba(14,22,33,0.95)' : 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${border}`,
        padding: '12px 16px',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: sub, display: 'flex' }}
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: sub, margin: 0 }}>
            {t('driver_stats_subtitle')}
          </p>
          <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>{t('driver_stats_title')}</h1>
        </div>
      </header>

      <div style={{ padding: '16px', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ height: 90, borderRadius: 16, background: cardBg, opacity: 0.6 }} />
            ))}
          </div>
        ) : (
          <>
            {/* Trip counts */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              {[
                { label: t('driver_stats_trips'),     value: String(trips.length), icon: Truck,      color: '#5ba3f5' },
                { label: t('driver_stats_completed'), value: String(completed),   icon: BarChart2,   color: '#10b981' },
                { label: t('driver_stats_active'),    value: String(active),      icon: TrendingUp,  color: '#f59e0b' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} style={{
                  background: cardBg, borderRadius: 16,
                  border: `1px solid ${border}`,
                  padding: '14px 10px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 12,
                    background: `${color}18`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={18} color={color} />
                  </div>
                  <span style={{ fontSize: 22, fontWeight: 800, color: txt }}>{value}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: sub, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
                </div>
              ))}
            </div>

            {/* Rating */}
            <div style={{
              background: cardBg, borderRadius: 16, border: `1px solid ${border}`,
              padding: '16px',
              display: 'flex', alignItems: 'center', gap: 16,
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: 16,
                background: '#f59e0b18',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Star size={24} color="#f59e0b" fill="#f59e0b" />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: sub, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px' }}>
                  {t('driver_stats_rating')}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 28, fontWeight: 800, color: '#f59e0b', lineHeight: 1 }}>
                    {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '—'}
                  </span>
                  {stats.avgRating > 0 && <StarRating value={stats.avgRating} />}
                </div>
                <p style={{ fontSize: 12, color: sub, margin: '4px 0 0' }}>
                  {stats.reviewCount} {t('driver_stats_reviews').toLowerCase()}
                </p>
              </div>
            </div>

            {/* Earnings chart */}
            <div style={{ background: cardBg, borderRadius: 16, border: `1px solid ${border}`, padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: '#5ba3f518',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <TrendingUp size={16} color="#5ba3f5" />
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>{t('driver_stats_earnings')}</p>
                  <p style={{ fontSize: 11, color: sub, margin: 0 }}>{t('driver_stats_earnings_subtitle')}</p>
                </div>
              </div>

              {earnings.length === 0 ? (
                <p style={{ fontSize: 13, color: sub, textAlign: 'center', padding: '16px 0' }}>
                  {t('driver_stats_no_earnings')}
                </p>
              ) : (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80 }}>
                  {earnings.map(({ month, amount }) => {
                    const h = Math.max(8, Math.round((amount / maxEarning) * 72));
                    return (
                      <div key={month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontSize: 9, color: sub, fontWeight: 600 }}>
                          {amount >= 1000 ? `${Math.round(amount / 1000)}k` : String(amount)}
                        </span>
                        <div style={{
                          width: '100%', height: h,
                          background: 'linear-gradient(180deg, #5ba3f5 0%, #1978e5 100%)',
                          borderRadius: 6,
                        }} />
                        <span style={{ fontSize: 9, color: sub }}>{month}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Reviews */}
            <div style={{ background: cardBg, borderRadius: 16, border: `1px solid ${border}`, padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: '#8b5cf618',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <MessageSquare size={16} color="#8b5cf6" />
                </div>
                <p style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>{t('driver_stats_recent_reviews')}</p>
              </div>

              {stats.reviews.length === 0 ? (
                <p style={{ fontSize: 13, color: sub, textAlign: 'center', padding: '12px 0' }}>
                  {t('driver_stats_no_reviews')}
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {stats.reviews.slice(0, 5).map((r: any, i: number) => (
                    <div key={i} style={{
                      padding: '12px',
                      background: isDark ? '#0e1621' : '#ffffff',
                      borderRadius: 12,
                      border: `1px solid ${border}`,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{r.authorName || r.authorEmail?.split('@')[0] || '—'}</span>
                        <StarRating value={r.rating || 0} />
                      </div>
                      {r.comment && (
                        <p style={{ fontSize: 12, color: sub, margin: 0, lineHeight: 1.5 }}>{r.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
