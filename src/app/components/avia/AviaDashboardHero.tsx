import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router';
import {
  TrendingUp, Plane, Package, Handshake,
  ThumbsUp, ThumbsDown, ArrowRight, Zap, ChevronRight,
  Target, MapPin,
} from 'lucide-react';
import type { AviaFlight, AviaRequest } from '../../api/aviaApi';
import type { AviaUser } from '../../api/aviaApi';
import { getAviaDeals } from '../../api/aviaDealApi';
import { getAviaUserReviews } from '../../api/aviaReviewApi';

// ── Типы ─────────────────────────────────────────────────────────────────────

interface MatchItem {
  type: 'flight' | 'request';
  id: string;
  from: string;
  to: string;
  date?: string;
  name?: string;
  weight?: number;
  price?: number;
}

interface HeroProps {
  user: AviaUser;
  flights: AviaFlight[];
  requests: AviaRequest[];
  myFlights: AviaFlight[];
  myRequests: AviaRequest[];
  onFlightClick: (f: AviaFlight) => void;
  onRequestClick: (r: AviaRequest) => void;
}

// ── Утилиты ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  } catch { return iso; }
}

function greet(): string {
  const h = new Date().getHours();
  if (h < 6)  return 'Доброй ночи';
  if (h < 12) return 'Доброе утро';
  if (h < 18) return 'Добрый день';
  return 'Добрый вечер';
}

function normalize(s: string): string {
  return (s || '').trim().toLowerCase();
}

// ── Smart Match — ядро алгоритма ─────────────────────────────────────────────
// Курьер → заявки под его рейсы; Отправитель → рейсы под его заявки; Оба → оба.

function buildMatches(
  user: AviaUser,
  flights: AviaFlight[],
  requests: AviaRequest[],
  myFlights: AviaFlight[],
  myRequests: AviaRequest[],
): MatchItem[] {
  const matches: MatchItem[] = [];

  // Курьер или оба: ищем заявки совпадающие с маршрутами моих рейсов
  if (user.role === 'courier' || user.role === 'both') {
    for (const mf of myFlights.filter(f => f.status === 'active')) {
      const fromN = normalize(mf.from);
      const toN   = normalize(mf.to);
      const found = requests.filter(r =>
        r.senderId !== user.phone &&
        r.status !== 'closed' &&
        normalize(r.from).includes(fromN.slice(0, 4)) &&
        normalize(r.to).includes(toN.slice(0, 4))
      );
      for (const r of found.slice(0, 2)) {
        if (matches.some(m => m.id === r.id)) continue;
        matches.push({
          type: 'request', id: r.id,
          from: r.from, to: r.to,
          date: r.beforeDate,
          name: r.senderName,
          weight: r.weightKg,
        });
      }
    }
  }

  // Отправитель или оба: ищем рейсы совпадающие с маршрутами моих заявок
  if (user.role === 'sender' || user.role === 'both') {
    for (const mr of myRequests.filter(r => r.status === 'active')) {
      const fromN = normalize(mr.from);
      const toN   = normalize(mr.to);
      const found = flights.filter(f =>
        f.courierId !== user.phone &&
        f.status !== 'closed' &&
        normalize(f.from).includes(fromN.slice(0, 4)) &&
        normalize(f.to).includes(toN.slice(0, 4))
      );
      for (const f of found.slice(0, 2)) {
        if (matches.some(m => m.id === f.id)) continue;
        matches.push({
          type: 'flight', id: f.id,
          from: f.from, to: f.to,
          date: f.date,
          name: f.courierName,
          price: f.pricePerKg,
        });
      }
    }
  }

  return matches.slice(0, 4);
}

// ── Stat chip ─────────────────────────────────────────────────────────────────

function StatChip({
  icon: Icon, label, value, color, delay,
}: {
  icon: typeof TrendingUp;
  label: string;
  value: string | number;
  color: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      style={{
        flex: '1 1 0', minWidth: 0,
        padding: '10px 8px', borderRadius: 14,
        background: `${color}08`,
        border: `1px solid ${color}15`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
        boxShadow: `0 2px 10px ${color}08`,
      }}
    >
      <div style={{
        width: 30, height: 30, borderRadius: 10,
        background: `${color}12`, border: `1px solid ${color}20`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: `0 0 10px ${color}10`,
      }}>
        <Icon style={{ width: 13, height: 13, color }} />
      </div>
      <div style={{ fontSize: 16, fontWeight: 900, color: '#e2eaf3', letterSpacing: '-0.6px' }}>
        {value}
      </div>
      <div style={{ fontSize: 8.5, fontWeight: 700, color: '#1e3550', textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'center' }}>
        {label}
      </div>
    </motion.div>
  );
}

// ── Match card ────────────────────────────────────────────────────────────────

function MatchCard({
  item, delay, onClick,
}: {
  item: MatchItem;
  delay: number;
  onClick: () => void;
}) {
  const isFlight  = item.type === 'flight';
  const color     = isFlight ? '#0ea5e9' : '#a78bfa';
  const Icon      = isFlight ? Plane : Package;

  return (
    <motion.button
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.3 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      style={{
        flexShrink: 0, width: 185,
        padding: '13px 14px', borderRadius: 18,
        background: `linear-gradient(145deg, ${color}08 0%, ${color}04 100%)`,
        border: `1px solid ${color}18`,
        textAlign: 'left', cursor: 'pointer',
        display: 'flex', flexDirection: 'column', gap: 9,
        boxShadow: `0 4px 16px ${color}06, inset 0 1px 0 ${color}10`,
        position: 'relative', overflow: 'hidden',
      }}
    >
      {/* Top line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 1, pointerEvents: 'none',
        background: `linear-gradient(90deg, transparent, ${color}30, transparent)`,
      }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <div style={{
          width: 26, height: 26, borderRadius: 9,
          background: `${color}14`, border: `1px solid ${color}22`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon style={{ width: 11, height: 11, color }} />
        </div>
        <span style={{ fontSize: 9, fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {isFlight ? 'Рейс' : 'Заявка'}
        </span>
        <span style={{ fontSize: 8.5, color: '#1e3040', marginLeft: 'auto', fontWeight: 600 }}>
          {item.date ? fmtDate(item.date) : ''}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={{
          fontSize: 12, fontWeight: 800, color: '#d4e8f5',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          letterSpacing: '-0.1px',
        }}>
          {item.from}
        </span>
        <ArrowRight style={{ width: 9, height: 9, color: '#1e3040', flexShrink: 0 }} />
        <span style={{
          fontSize: 12, fontWeight: 800, color: '#d4e8f5',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          letterSpacing: '-0.1px',
        }}>
          {item.to}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, color: '#1e3550', fontWeight: 600 }}>
          {item.name || '—'}
        </span>
        {item.weight && (
          <span style={{
            fontSize: 9, fontWeight: 700, color,
            padding: '2px 7px', borderRadius: 6,
            background: `${color}10`, border: `1px solid ${color}18`,
          }}>
            {item.weight} кг
          </span>
        )}
        {item.price != null && item.price > 0 && (
          <span style={{
            fontSize: 9, fontWeight: 700, color,
            padding: '2px 7px', borderRadius: 6,
            background: `${color}10`, border: `1px solid ${color}18`,
          }}>
            ${item.price}/кг
          </span>
        )}
      </div>
    </motion.button>
  );
}

// ── Главный компонент ─────────────────────────────────────────────────────────

export function AviaDashboardHero({
  user, flights, requests, myFlights, myRequests,
  onFlightClick, onRequestClick,
}: HeroProps) {
  const navigate = useNavigate();
  const [dealsCount, setDealsCount]   = useState(0);
  const [loadingDeals, setLoadingDeals] = useState(true);

  const fetchDeals = useCallback(() => {
    if (!user?.phone) return;
    setLoadingDeals(true);
    getAviaDeals(user.phone)
      .then(deals => {
        setDealsCount(deals.filter(d => d.status === 'accepted' || d.status === 'completed').length);
      })
      .catch(() => {})
      .finally(() => setLoadingDeals(false));
  }, [user?.phone]);

  useEffect(() => { fetchDeals(); }, [fetchDeals]);

  const matches = buildMatches(user, flights, requests, myFlights, myRequests);

  const activeMyFlights   = myFlights.filter(f => f.status === 'active').length;
  const activeMyRequests  = myRequests.filter(r => r.status === 'active').length;
  const name = user.firstName
    ? user.firstName
    : `+${user.phone.slice(0, 3)}···`;

  // Likes/Dislikes
  const [heroLikes, setHeroLikes] = useState(0);
  const [heroDislikes, setHeroDislikes] = useState(0);
  const [hasReviews, setHasReviews] = useState(false);

  useEffect(() => {
    if (!user?.phone) return;
    getAviaUserReviews(user.phone)
      .then(r => {
        if (r.length > 0) {
          setHasReviews(true);
          setHeroLikes(r.filter(x => x.type === 'like').length);
          setHeroDislikes(r.filter(x => x.type === 'dislike').length);
        }
      })
      .catch(() => {});
  }, [user?.phone]);

  return (
    <div style={{ marginBottom: 16 }}>

      {/* ── Приветствие ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          padding: '18px 18px 16px',
          borderRadius: 22,
          background: 'linear-gradient(145deg, rgba(14,165,233,0.08) 0%, rgba(10,22,40,0.95) 60%, rgba(6,14,26,1) 100%)',
          border: '1px solid rgba(14,165,233,0.12)',
          marginBottom: 12,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 4px 24px rgba(14,165,233,0.05), inset 0 1px 0 rgba(14,165,233,0.08)',
        }}
      >
        {/* Top line */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 1, pointerEvents: 'none',
          background: 'linear-gradient(90deg, transparent, rgba(14,165,233,0.3), transparent)',
        }} />
        {/* Radial glow */}
        <div style={{
          position: 'absolute', top: -40, right: -40,
          width: 140, height: 140, borderRadius: '50%', pointerEvents: 'none',
          background: 'radial-gradient(circle, rgba(14,165,233,0.07) 0%, transparent 70%)',
        }} />

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 10.5, color: '#1e3a55', fontWeight: 700, marginBottom: 4, letterSpacing: '0.04em' }}>
              {greet()},
            </div>
            <div style={{ fontSize: 19, fontWeight: 900, color: '#e2eaf3', letterSpacing: '-0.5px' }}>
              {name} 👋
            </div>
          </div>
          {hasReviews && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '6px 11px', borderRadius: 11,
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#34d399', fontSize: 12, fontWeight: 900 }}>
                <ThumbsUp style={{ width: 11, height: 11, color: '#34d399', fill: '#34d399' }} />
                {heroLikes}
              </span>
              <span style={{ color: '#0d1e30', fontSize: 9, fontWeight: 600 }}>/</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#f87171', fontSize: 12, fontWeight: 900 }}>
                <ThumbsDown style={{ width: 11, height: 11, color: '#f87171', fill: '#f87171' }} />
                {heroDislikes}
              </span>
            </div>
          )}
        </div>

        {/* Stat chips */}
        <div style={{ display: 'flex', gap: 8 }}>
          {(user.role === 'courier' || user.role === 'both') && (
            <StatChip
              icon={Plane} label="Мои рейсы"
              value={activeMyFlights}
              color="#0ea5e9" delay={0.1}
            />
          )}
          {(user.role === 'sender' || user.role === 'both') && (
            <StatChip
              icon={Package} label="Заявки"
              value={activeMyRequests}
              color="#a78bfa" delay={0.15}
            />
          )}
          <StatChip
            icon={Handshake} label="Сделки"
            value={loadingDeals ? '…' : dealsCount}
            color="#34d399" delay={0.2}
          />
          <StatChip
            icon={TrendingUp} label="Всего"
            value={flights.length + requests.length}
            color="#f59e0b" delay={0.25}
          />
        </div>
      </motion.div>

      {/* ── Smart Match секция ── */}
      <AnimatePresence>
        {matches.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
            style={{ marginBottom: 12 }}
          >
            {/* Заголовок */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 7,
              marginBottom: 10,
            }}>
              <div style={{
                width: 24, height: 24, borderRadius: 8,
                background: 'rgba(251,191,36,0.1)',
                border: '1px solid rgba(251,191,36,0.18)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Target style={{ width: 11, height: 11, color: '#fbbf24' }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#c8dae8', letterSpacing: '-0.1px' }}>
                Совпадения для вас
              </span>
              <span style={{
                fontSize: 9.5, fontWeight: 800, color: '#fbbf24',
                padding: '2px 7px', borderRadius: 6,
                background: 'rgba(251,191,36,0.08)',
                border: '1px solid rgba(251,191,36,0.15)',
              }}>
                {matches.length}
              </span>
              <div style={{ flex: 1 }} />
              <Zap style={{ width: 10, height: 10, color: '#1a3050' }} />
              <span style={{ fontSize: 9, color: '#1a3050', fontWeight: 600 }}>
                По маршрутам
              </span>
            </div>

            {/* Горизонтальный скролл */}
            <div style={{
              display: 'flex', gap: 10,
              overflowX: 'auto', paddingBottom: 4,
              scrollbarWidth: 'none',
            }}>
              {matches.map((item, i) => {
                const flight = item.type === 'flight'
                  ? flights.find(f => f.id === item.id)
                  : undefined;
                const request = item.type === 'request'
                  ? requests.find(r => r.id === item.id)
                  : undefined;
                return (
                  <MatchCard
                    key={item.id}
                    item={item}
                    delay={0.05 * i}
                    onClick={() => {
                      if (flight) onFlightClick(flight);
                      if (request) onRequestClick(request);
                    }}
                  />
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Quick Actions ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.25 }}
        style={{ display: 'flex', gap: 8, marginBottom: 4 }}
      >
        <QuickAction
          label="Профиль"
          color="#6b8299"
          onClick={() => navigate('/avia/profile')}
          icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>}
        />
        <QuickAction
          label="Сделки"
          color="#34d399"
          onClick={() => navigate('/avia/deals')}
          icon={<Handshake style={{ width: 12, height: 12 }} />}
        />
        <QuickAction
          label="Публичный"
          color="#a78bfa"
          onClick={() => navigate(`/avia/user/${user.phone}`)}
          icon={<ChevronRight style={{ width: 12, height: 12 }} />}
        />
      </motion.div>
    </div>
  );
}

function QuickAction({
  label, color, onClick, icon,
}: {
  label: string; color: string; onClick: () => void; icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
        padding: '8px 6px', borderRadius: 10,
        background: `${color}08`, border: `1px solid ${color}18`,
        color, fontSize: 10, fontWeight: 700,
        cursor: 'pointer', letterSpacing: '0.01em',
        transition: 'background 0.15s',
      }}
    >
      {icon}
      {label}
    </button>
  );
}