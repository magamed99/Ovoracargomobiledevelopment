import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'motion/react';
import { useNavigate } from 'react-router';
import {
  Star, Users as UsersIcon, Truck, Zap, TrendingUp,
  ArrowRight, MapPin, Package, ArrowUpRight, Navigation,
  Clock, Globe, Shield, ChevronRight, Activity, Plus,
  Search, CheckCircle, AlertCircle, Route,
} from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { TripCard } from './TripCard';

// ── Helpers ───────────────────────────────────────────────────────────────────
function toEmbedUrl(url?: string): string | null {
  if (!url) return null;
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?autoplay=1&mute=1&loop=1&playlist=${yt[1]}`;
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}?autoplay=1&muted=1&loop=1`;
  return null;
}
function isDirectVideo(url?: string) { return /\.(mp4|webm|ogg)(\?.*)?$/i.test(url || ''); }

// ── Animated counter ─────────────────────────────────────────────────────────
function AnimCounter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 60, damping: 18 });
  const display = useTransform(spring, v => Math.round(v).toLocaleString() + suffix);
  useEffect(() => { mv.set(to); }, [to, mv]);
  return <motion.span>{display}</motion.span>;
}

// ── Floating orb ──────────────────────────────────────────────────────────────
function FloatOrb({ x, y, size, color, dur }: { x: string; y: string; size: number; color: string; dur: number }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{ left: x, top: y, width: size, height: size, background: color, filter: 'blur(60px)', opacity: 0.18 }}
      animate={{ y: [0, -40, 0], x: [0, 25, 0], scale: [1, 1.15, 1] }}
      transition={{ duration: dur, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

// ── 3D Tilt card ──────────────────────────────────────────────────────────────
function TiltCard({ children, className = '', onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const rotX = useMotionValue(0);
  const rotY = useMotionValue(0);
  const sX = useSpring(rotX, { stiffness: 200, damping: 20 });
  const sY = useSpring(rotY, { stiffness: 200, damping: 20 });
  const onMouseMove = (e: React.MouseEvent) => {
    const el = ref.current; if (!el) return;
    const rect = el.getBoundingClientRect();
    rotX.set(((e.clientY - rect.top - rect.height / 2) / rect.height) * -10);
    rotY.set(((e.clientX - rect.left - rect.width / 2) / rect.width) * 10);
  };
  const onMouseLeave = () => { rotX.set(0); rotY.set(0); };
  return (
    <motion.div ref={ref} onClick={onClick} onMouseMove={onMouseMove} onMouseLeave={onMouseLeave}
      className={className} style={{ rotateX: sX, rotateY: sY, transformPerspective: 800 }}
      whileHover={{ scale: 1.02 }} transition={{ scale: { type: 'spring', stiffness: 300, damping: 20 } }}>
      {children}
    </motion.div>
  );
}

// ── SVG grid background ───────────────────────────────────────────────────────
function GridLines() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.04]">
      <defs>
        <pattern id="dg" width="60" height="60" patternUnits="userSpaceOnUse">
          <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#5ba3f5" strokeWidth="0.8" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dg)" />
    </svg>
  );
}

// ── Animated route dots ───────────────────────────────────────────────────────
function RouteViz({ from, to, accent }: { from: string; to: string; accent: string }) {
  return (
    <div className="flex items-stretch gap-3 py-1">
      <div className="flex flex-col items-center shrink-0 gap-1">
        <motion.div className="w-3 h-3 rounded-full"
          style={{ background: accent, boxShadow: `0 0 10px ${accent}` }}
          animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 2, repeat: Infinity }} />
        <div className="flex-1 w-px" style={{ background: `linear-gradient(to bottom, ${accent}, #10b981)`, minHeight: 28 }} />
        <motion.div className="w-3 h-3 rounded-full bg-[#10b981]"
          style={{ boxShadow: '0 0 10px #10b981' }}
          animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 2, repeat: Infinity, delay: 1 }} />
      </div>
      <div className="flex-1 flex flex-col justify-between min-w-0 gap-2">
        <p className="font-bold text-[15px] text-white truncate">{from}</p>
        <p className="font-bold text-[15px] text-white truncate">{to}</p>
      </div>
    </div>
  );
}

// ── CSS keyframes ─────────────────────────────────────────────────────────────
const shimmerKeyframes = `
@keyframes shimmer {
  0%   { background-position: -200% center; }
  100% { background-position:  200% center; }
}
@keyframes pulse-glow-blue  { 0%,100%{box-shadow:0 0 20px #5ba3f540} 50%{box-shadow:0 0 40px #5ba3f580} }
@keyframes pulse-glow-green { 0%,100%{box-shadow:0 0 20px #10b98140} 50%{box-shadow:0 0 40px #10b98180} }
`;

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  currentUser: any;
  displayName: string;
  initials: string;
  isDriver: boolean;
  greeting: string;
  advertisements: any[];
  currentAdIndex: number;
  setCurrentAdIndex: (i: number) => void;
  allPopularTrips: any[];
  tripsLoading: boolean;
  DriverActions: React.ComponentType;
  SenderActions: React.ComponentType;
}

// ═════════════════════════════════════════════════════════════════════════════
export function DesktopDashboard({
  currentUser, displayName, initials, isDriver, greeting,
  advertisements, currentAdIndex, setCurrentAdIndex,
  allPopularTrips, tripsLoading,
  DriverActions, SenderActions,
}: Props) {
  const navigate = useNavigate();
  const currentAd = advertisements[currentAdIndex] ?? advertisements[0];
  const hasAds = advertisements.length > 0 && currentAd != null;

  // ── Role-aware design tokens ──────────────────────────────────────────────
  const accent       = isDriver ? '#5ba3f5' : '#10b981';
  const accentGlow   = isDriver ? '#1d4ed8' : '#059669';
  const accentDim    = isDriver ? '#5ba3f512' : '#10b98112';
  const accentBorder = isDriver ? '#5ba3f540' : '#10b98140';
  const avatarBg     = isDriver
    ? 'linear-gradient(135deg,#1d4ed8,#7c3aed)'
    : 'linear-gradient(135deg,#059669,#0891b2)';
  const nameBg       = isDriver
    ? 'linear-gradient(135deg,#ffffff 0%,#5ba3f5 50%,#a855f7 100%)'
    : 'linear-gradient(135deg,#ffffff 0%,#10b981 50%,#06b6d4 100%)';
  const glowAnim     = isDriver ? 'pulse-glow-blue 3s ease-in-out infinite' : 'pulse-glow-green 3s ease-in-out infinite';
  const RoleIcon     = isDriver ? Truck : Package;

  // ── Role-specific stats (реальные данные из allPopularTrips) ─────────────
  // Фикс 8: убраны фиктивные расчёты, все числа из реальных данных
  const uniqueCitiesCount = new Set(
    allPopularTrips.flatMap((t: any) => [t.from, t.to].filter(Boolean))
  ).size;
  const withSeatsCount = allPopularTrips.filter((t: any) => t.seats !== null && t.seats !== undefined).length;
  const withCargoCount = allPopularTrips.filter((t: any) => t.cargo !== null && t.cargo !== undefined).length;

  const driverStats = [
    { label: 'Рейсов в сети',      value: allPopularTrips.length, suffix: '',  icon: Route,       color: '#5ba3f5' },
    { label: 'С пасс. местами',    value: withSeatsCount,         suffix: '',  icon: AlertCircle, color: '#f59e0b' },
    { label: 'С перевозкой груза', value: withCargoCount,         suffix: '',  icon: CheckCircle, color: '#10b981' },
    { label: 'Городов охвачено',   value: uniqueCitiesCount,      suffix: '+', icon: Navigation,  color: '#a855f7' },
  ];
  const senderStats = [
    { label: 'Доступных поездок',  value: allPopularTrips.length, suffix: '',  icon: Truck,       color: '#10b981' },
    { label: 'С пасс. местами',    value: withSeatsCount,         suffix: '',  icon: Navigation,  color: '#5ba3f5' },
    { label: 'С перевозкой груза', value: withCargoCount,         suffix: '',  icon: Globe,       color: '#a855f7' },
    { label: 'Городов охвачено',   value: uniqueCitiesCount,      suffix: '+', icon: Clock,       color: '#f59e0b' },
  ];
  const stats = isDriver ? driverStats : senderStats;

  // ── Role-specific nav buttons ─────────────────────────────────────────────
  const navBtns = isDriver
    ? [
        { label: 'Мои поездки', path: '/trips',       color: accent    },
        { label: 'Создать',     path: '/create-trip', color: '#a855f7' },
        { label: 'Профиль',     path: '/profile',     color: '#10b981' },
      ]
    : [
        { label: 'Поиск',       path: '/search',         color: accent    },
        { label: 'Мои посылки', path: '/trips',           color: '#5ba3f5' },
        { label: 'Профиль',     path: '/profile',         color: '#a855f7' },
      ];

  // ── Live clock ────────────────────────────────────────────────────────────
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // ── Floating particles ────────────────────────────────────────────────────
  const [particles, setParticles] = useState<{ id: number; x: number; delay: number; dur: number }[]>([]);
  useEffect(() => {
    setParticles(Array.from({ length: 12 }, (_, i) => ({
      id: i, x: Math.random() * 100, delay: Math.random() * 4, dur: 3 + Math.random() * 4,
    })));
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{shimmerKeyframes}</style>

      <div className="hidden md:flex min-h-screen w-full overflow-hidden relative" style={{ background: '#080f1a' }}>

        {/* ── BG ── */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <GridLines />
          <FloatOrb x="5%"  y="10%" size={500} color={accentGlow} dur={8}  />
          <FloatOrb x="60%" y="5%"  size={400} color="#7c3aed"    dur={11} />
          <FloatOrb x="80%" y="60%" size={350} color={accent}     dur={9}  />
          <FloatOrb x="20%" y="70%" size={300} color={accentGlow} dur={13} />
          {particles.map(p => (
            <motion.div key={p.id} className="absolute w-1 h-1 rounded-full"
              style={{ left: `${p.x}%`, bottom: 0, opacity: 0, background: accent }}
              animate={{ y: [0, -140], opacity: [0, 0.7, 0] }}
              transition={{ duration: p.dur, repeat: Infinity, delay: p.delay, ease: 'easeOut' }} />
          ))}
          <motion.div className="absolute left-0 right-0 h-px pointer-events-none"
            style={{ background: `linear-gradient(90deg,transparent,${accent}30,${accent}50,${accent}30,transparent)` }}
            animate={{ top: ['0%', '100%'] }} transition={{ duration: 8, repeat: Infinity, ease: 'linear' }} />
        </div>

        {/* ════ LEFT PANEL ══════════════════════════════════════════════════ */}
        <div className="relative flex flex-col w-[420px] xl:w-[480px] shrink-0 overflow-y-auto border-r"
          style={{ background: '#0d1929cc', backdropFilter: 'blur(20px)', borderColor: '#ffffff08' }}>

          {/* User hero */}
          <div className="relative px-8 pt-10 pb-6 overflow-hidden">
            <motion.div className="absolute -top-10 -left-10 w-64 h-64 rounded-full pointer-events-none"
              style={{ background: accentGlow + '35', filter: 'blur(50px)' }}
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 5, repeat: Infinity }} />

            {/* Clock + role badge */}
            <div className="flex items-center justify-between mb-6">
              <motion.div className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
                style={{ background: '#ffffff08', borderWidth: '1px', borderStyle: 'solid', borderColor: '#ffffff10' }}
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                <div className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
                <span className="text-[11px] font-bold text-[#607080] tabular-nums">
                  {time.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </motion.div>

              {/* ── ROLE BADGE — prominent ── */}
              <motion.div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-[12px] font-black uppercase tracking-widest"
                style={{ background: accentDim, color: accent, borderWidth: '1px', borderStyle: 'solid', borderColor: accentBorder }}
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                <RoleIcon style={{ width: 14, height: 14 }} />
                {isDriver ? 'Водитель' : 'Отправитель'}
              </motion.div>
            </div>

            {/* Greeting + name */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <p className="text-[12px] font-black uppercase tracking-[0.2em] mb-1" style={{ color: accent }}>{greeting}</p>
              <h1 className="text-[40px] xl:text-[48px] font-black leading-none mb-1">
                <span style={{
                  backgroundImage: nameBg,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundSize: '200% auto',
                  animation: 'shimmer 4s linear infinite',
                  display: 'inline',
                }}>
                  {displayName}
                </span>
              </h1>
              <p className="text-[13px] text-[#607080] font-medium">
                {isDriver ? 'Панель управленя водителя' : 'Панель управления отправителя'}
              </p>
            </motion.div>

            {/* Avatar */}
            <motion.div className="mt-6 flex items-center gap-4"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <div className="relative">
                <div className="w-20 h-20 rounded-3xl overflow-hidden shadow-2xl"
                  style={{ background: currentUser?.avatarUrl ? undefined : avatarBg, animation: glowAnim }}>
                  {currentUser?.avatarUrl
                    ? <img src={currentUser.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center">
                        <span className="text-white font-black text-2xl">{initials}</span>
                      </div>
                  }
                </div>
                {/* Role icon pin */}
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-xl flex items-center justify-center border-2 border-[#0d1929]"
                  style={{ background: accent }}>
                  <RoleIcon style={{ width: 13, height: 13, color: '#fff' }} />
                </div>
              </div>
              <div>
                <p className="text-white font-bold text-[16px]">{currentUser?.firstName} {currentUser?.lastName}</p>
                <p className="text-[#607080] text-[12px] mb-1.5">{currentUser?.email || 'Ovora пользователь'}</p>
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full w-fit" style={{ background: accentDim }}>
                  <Shield style={{ width: 11, height: 11, color: accent }} />
                  <span className="text-[11px] font-bold" style={{ color: accent }}>Верифицирован</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* ── Role promo block ── */}
          <div className="px-6 pb-4">
            <motion.div className="rounded-2xl p-4 relative overflow-hidden"
              style={{ background: accentDim, borderWidth: '1px', borderStyle: 'solid', borderColor: accentBorder }}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <motion.div className="absolute left-0 right-0 h-px pointer-events-none"
                style={{ background: `linear-gradient(90deg,transparent,${accent}60,transparent)` }}
                animate={{ top: ['0%', '100%'] }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }} />
              {isDriver ? (
                <>
                  <p className="text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: accent }}>💡 Совет водителю</p>
                  <p className="text-[13px] font-bold text-white mb-3">Опубликуйте маршрут и зарабатывайте больше</p>
                  <motion.button onClick={() => navigate('/create-trip')}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-bold text-white"
                    style={{ background: accent }} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Plus style={{ width: 14, height: 14 }} /> Создать маршрут
                  </motion.button>
                </>
              ) : (
                <>
                  <p className="text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: accent }}>💡 Совет отправителю</p>
                  <p className="text-[13px] font-bold text-white mb-3">Найдите водителя и отправьте груз выгодно</p>
                  <motion.button onClick={() => navigate('/search')}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-bold text-white"
                    style={{ background: accent }} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Search style={{ width: 14, height: 14 }} /> Найи поездку
                  </motion.button>
                </>
              )}
            </motion.div>
          </div>

          {/* ── Stats grid ── */}
          <div className="px-6 pb-5">
            <motion.p className="text-[10px] font-black uppercase tracking-widest text-[#607080] mb-3 flex items-center gap-2"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
              <Activity style={{ width: 12, height: 12, color: accent }} />
              {isDriver ? 'Моя статистика' : 'Статистика рынка'}
            </motion.p>
            <div className="grid grid-cols-2 gap-2.5">
              {stats.map((s, i) => (
                <motion.div key={s.label} className="relative rounded-2xl p-3.5 overflow-hidden cursor-default"
                  style={{ background: '#ffffff06', borderWidth: '1px', borderStyle: 'solid', borderColor: '#ffffff08', transition: 'background 0.2s, border-color 0.2s' }}
                  initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.32 + i * 0.06, type: 'spring', stiffness: 200 }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = s.color + '0d'; (e.currentTarget as HTMLElement).style.borderColor = s.color + '55'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#ffffff06'; (e.currentTarget as HTMLElement).style.borderColor = '#ffffff08'; }}>
                  <div className="absolute top-0 right-0 w-12 h-12 rounded-full pointer-events-none"
                    style={{ background: s.color + '20', filter: 'blur(12px)', transform: 'translate(30%,-30%)' }} />
                  <s.icon style={{ width: 16, height: 16, marginBottom: 8, color: s.color }} />
                  <p className="text-[22px] font-black text-white leading-none"><AnimCounter to={s.value} suffix={s.suffix} /></p>
                  <p className="text-[10px] text-[#607080] mt-1 leading-snug">{s.label}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* ── Hot route ── */}
          {allPopularTrips.length > 0 && (
            <div className="px-6 pb-6">
              <motion.div className="rounded-2xl p-4 relative overflow-hidden cursor-pointer"
                style={{ background: accentDim, borderWidth: '1px', borderStyle: 'solid', borderColor: accent + '30', transition: 'background 0.2s, border-color 0.2s' }}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = accent + '60'; (e.currentTarget as HTMLElement).style.background = accent + '1a'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = accent + '30'; (e.currentTarget as HTMLElement).style.background = accentDim; }}
                onClick={() => navigate(`/trip/${allPopularTrips[0].id}`)}>
                <motion.div className="absolute left-0 right-0 h-px pointer-events-none"
                  style={{ background: `linear-gradient(90deg,transparent,${accent}50,transparent)` }}
                  animate={{ top: ['0%', '100%'] }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }} />
                <p className="text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-1.5" style={{ color: accent }}>
                  <Navigation style={{ width: 12, height: 12 }} />
                  {isDriver ? 'Мой горячий маршрут' : 'Горячий маршрут'}
                </p>
                <RouteViz from={allPopularTrips[0].from} to={allPopularTrips[0].to} accent={accent} />
                <div className="flex items-center justify-between mt-3">
                  <span className="text-[12px] text-[#607080]">{allPopularTrips[0].date} · {allPopularTrips[0].time}</span>
                  <div className="flex items-center gap-1 text-[12px] font-bold" style={{ color: accent }}>
                    Подробнее <ChevronRight style={{ width: 14, height: 14 }} />
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </div>

        {/* ════ RIGHT PANEL ════════════════════════════════════════════════ */}
        <div className="relative flex-1 flex flex-col overflow-y-auto">

          {/* Sticky top bar */}
          <motion.div className="sticky top-0 z-20 flex flex-col gap-0 border-b border-[#ffffff06]"
            style={{ background: '#080f1acc', backdropFilter: 'blur(16px)' }}
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            {/* Top row: branding + nav */}
            <div className="flex items-center justify-between px-6 pt-3 pb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-[6px] h-[6px] rounded-full animate-pulse" style={{ background: accent }} />
                <span className="text-[13px] font-bold text-white">
                  {isDriver ? 'Панель водителя' : 'Панель отправителя'}
                </span>
                <span className="text-[10px] text-[#505a68]">— Ovora Cargo</span>
              </div>
              <div className="flex items-center gap-1.5">
                {navBtns.map((b, i) => (
                  <motion.button key={b.path} onClick={() => navigate(b.path)}
                    className="px-3.5 py-[6px] rounded-lg text-[11px] font-bold tracking-wide uppercase"
                    style={{ color: b.color, background: b.color + '0c', border: `1px solid ${b.color}25`, transition: 'all 0.2s ease' }}
                    initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.12 + i * 0.04 }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = b.color + '20'; el.style.borderColor = b.color + '60'; }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = b.color + '0c'; el.style.borderColor = b.color + '25'; }}
                    whileTap={{ scale: 0.96 }}>
                    {b.label}
                  </motion.button>
                ))}
              </div>
            </div>
            {/* Bottom row: quick actions */}
            <div className="flex items-center gap-1.5 px-6 pb-3 overflow-x-auto scrollbar-none">
              <span className="text-[9px] font-black uppercase tracking-[0.15em] text-[#404a58] mr-1.5 shrink-0">Быстрые</span>
              {[
                ...(isDriver
                  ? [
                      { label: 'Сообщения',   path: '/messages',      icon: '💬', color: '#5ba3f5' },
                      { label: 'Уведомления', path: '/notifications', icon: '🔔', color: '#f59e0b' },
                      { label: 'Трекинг',     path: '/tracking',      icon: '📍', color: '#10b981' },
                      { label: 'Калькулятор',  path: '/calculator',    icon: '🧮', color: '#8b5cf6' },
                    ]
                  : [
                      { label: 'Сообщения',   path: '/messages',      icon: '💬', color: '#5ba3f5' },
                      { label: 'Уведомления', path: '/notifications', icon: '🔔', color: '#f59e0b' },
                      { label: 'Избранное',   path: '/favorites',     icon: '⭐', color: '#ef4444' },
                      { label: 'Калькулятор',  path: '/calculator',    icon: '🧮', color: '#8b5cf6' },
                    ]
                ),
              ].map((q, i) => (
                <motion.button key={q.path} onClick={() => navigate(q.path)}
                  className="flex items-center gap-1.5 px-3 py-[5px] rounded-lg text-[10px] font-bold shrink-0"
                  style={{ color: q.color, background: q.color + '0a', border: `1px solid ${q.color}18`, transition: 'all 0.2s ease' }}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.035 }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = q.color + '1a'; el.style.borderColor = q.color + '50'; el.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = q.color + '0a'; el.style.borderColor = q.color + '18'; el.style.transform = 'translateY(0)'; }}
                  whileTap={{ scale: 0.96 }}>
                  <span className="text-[11px] leading-none">{q.icon}</span>{q.label}
                </motion.button>
              ))}
            </div>
          </motion.div>

          <div className="px-8 py-6 flex flex-col gap-8">

            {/* ── AD BANNER ── */}
            {hasAds && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[11px] font-black uppercase tracking-widest text-[#607080] flex items-center gap-2">
                    <Zap style={{ width: 14, height: 14, color: '#f59e0b' }} /> Реклама
                  </p>
                  <div className="flex gap-1.5">
                    {advertisements.map((_, idx) => (
                      <button key={idx} onClick={() => setCurrentAdIndex(idx)}
                        className="h-1.5 rounded-full transition-all duration-300"
                        style={{ width: idx === currentAdIndex ? 24 : 6, background: idx === currentAdIndex ? accent : '#ffffff20' }} />
                    ))}
                  </div>
                </div>
                <AnimatePresence mode="wait">
                  <motion.a key={currentAdIndex} href={currentAd.url} target="_blank" rel="noopener noreferrer"
                    className="block rounded-3xl overflow-hidden relative cursor-pointer group"
                    style={{ height: 'clamp(200px, 24vw, 320px)' }}
                    initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.4 }}
                    whileHover={{ scale: 1.01 }}>
                    <ImageWithFallback src={currentAd.image} alt="ad" className="w-full h-full object-cover" />
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(120deg,#00000099 0%,#00000030 60%,transparent 100%)' }} />
                    {currentAd.videoUrl && toEmbedUrl(currentAd.videoUrl) && (
                      <div className="absolute inset-0 z-10">
                        <iframe src={toEmbedUrl(currentAd.videoUrl)!} className="w-full h-full" allowFullScreen title="ad" />
                      </div>
                    )}
                    {currentAd.videoUrl && isDirectVideo(currentAd.videoUrl) && (
                      <div className="absolute inset-0 z-10">
                        <video src={currentAd.videoUrl} className="w-full h-full object-cover" autoPlay muted loop playsInline />
                      </div>
                    )}
                    {!toEmbedUrl(currentAd.videoUrl) && !isDirectVideo(currentAd.videoUrl) && (
                      <div className="absolute inset-0 z-10 p-8 flex flex-col justify-between">
                        <div className="flex items-start justify-between">
                          <span className="text-[11px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full text-white"
                            style={{ background: '#ffffff20', backdropFilter: 'blur(8px)', border: '1px solid #ffffff20' }}>
                            {currentAd.badge}
                          </span>
                          <span className="text-[11px] font-bold px-3 py-1.5 rounded-full text-white/70"
                            style={{ background: '#00000050', backdropFilter: 'blur(8px)' }}>Реклама</span>
                        </div>
                        <div>
                          <p className="text-[32px] xl:text-[42px] font-black text-white leading-none drop-shadow-2xl mb-2">
                            {currentAd.title?.split('\\n').map((l: string, i: number) => (
                              <span key={i}>{l}{i === 0 && <br />}</span>
                            ))}
                          </p>
                          <p className="text-[15px] text-white/70 mb-4">{currentAd.description}</p>
                          <motion.div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[13px] font-bold text-white"
                            style={{ background: `linear-gradient(135deg,${accentGlow},${accent})`, boxShadow: `0 0 20px ${accent}40` }}
                            whileHover={{ scale: 1.05 }}>
                            Узнать больше <ArrowUpRight style={{ width: 16, height: 16 }} />
                          </motion.div>
                        </div>
                      </div>
                    )}
                    <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      style={{ background: 'linear-gradient(105deg,transparent 40%,#ffffff08 50%,transparent 60%)' }} />
                  </motion.a>
                </AnimatePresence>
              </motion.div>
            )}

            {/* ── TRIPS / ROUTES ── */}
            <div>
              <motion.div className="flex items-center justify-between mb-5"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: accentDim }}>
                    <TrendingUp style={{ width: 16, height: 16, color: accent }} />
                  </div>
                  <div>
                    <p className="text-[15px] font-black text-white">
                      {isDriver ? 'Опубликованные маршруты' : 'Доступные поездки'}
                    </p>
                    <p className="text-[11px] text-[#607080]">
                      {allPopularTrips.length} {isDriver ? 'активных маршрутов' : 'доступных поездок'}
                    </p>
                  </div>
                </div>
                <motion.button onClick={() => navigate('/search-results')}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-bold"
                  style={{ color: accent, borderWidth: '1px', borderStyle: 'solid', borderColor: accent + '40', background: accentDim, transition: 'background 0.2s, border-color 0.2s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = accent + '22'; (e.currentTarget as HTMLElement).style.borderColor = accent + '70'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = accentDim; (e.currentTarget as HTMLElement).style.borderColor = accent + '40'; }}
                  whileTap={{ scale: 0.95 }}>
                  {isDriver ? 'Все мои поездки' : 'Все маршруты'} <ArrowRight style={{ width: 14, height: 14 }} />
                </motion.button>
              </motion.div>

              {/* Skeleton */}
              {tripsLoading && allPopularTrips.length === 0 && (
                <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="rounded-3xl border border-white/[0.06] p-5 animate-pulse" style={{ background: '#ffffff04' }}>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-11 h-11 rounded-2xl bg-white/[0.08]" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 w-24 bg-white/[0.08] rounded-full" />
                          <div className="h-2.5 w-16 bg-white/[0.06] rounded-full" />
                        </div>
                      </div>
                      <div className="h-16 bg-white/[0.05] rounded-2xl" />
                    </div>
                  ))}
                </div>
              )}

              {/* Empty */}
              {!tripsLoading && allPopularTrips.length === 0 && (
                <motion.div className="rounded-3xl border border-white/[0.06] p-16 flex flex-col items-center gap-4 text-center"
                  style={{ background: '#ffffff03' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <motion.div className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl"
                    style={{ background: accentDim }}
                    animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 3, repeat: Infinity }}>
                    {isDriver ? '🚚' : '📦'}
                  </motion.div>
                  <div>
                    <p className="font-black text-[20px] text-white mb-2">
                      {isDriver ? 'Нет опубликованных маршрутов' : 'Поездок пока нет'}
                    </p>
                    <p className="text-[14px] text-[#607080]">
                      {isDriver ? 'Создайте первый маршрут прямо сейчас' : 'Водители ещё не опубликовали рейсы'}
                    </p>
                  </div>
                  <motion.button
                    onClick={() => navigate(isDriver ? '/create-trip' : '/search-results')}
                    className="px-6 py-3 rounded-2xl text-[14px] font-bold text-white"
                    style={{ background: `linear-gradient(135deg,${accentGlow},${accent})`, boxShadow: `0 0 20px ${accent}40` }}
                    whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                    {isDriver ? 'Создать маршрут' : 'Открыть поиск'}
                  </motion.button>
                </motion.div>
              )}

              {/* Trip cards — единый TripCard */}
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
                {allPopularTrips.map((trip, index) => (
                  <motion.div
                    key={trip.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.38 + index * 0.06, duration: 0.4 }}
                  >
                    <TripCard
                      trip={{
                        id: trip.id,
                        tripId: trip.id,
                        from: trip.from,
                        to: trip.to,
                        date: trip.date,
                        time: trip.time,
                        availableSeats: trip.rawSeats ?? (trip.seats ?? 0),
                        childSeats: trip.rawChildSeats ?? trip.childSeats ?? 0,
                        cargoCapacity: trip.rawCargo ?? 0,
                        pricePerSeat: trip.price ? (parseInt(trip.price, 10) || 0) : (trip.pricePerSeat ?? 0),
                        pricePerChild: trip.childPrice ? (parseInt(trip.childPrice, 10) || 0) : (trip.pricePerChild ?? 0),
                        pricePerKg: trip.cargoPrice ? (parseInt(trip.cargoPrice, 10) || 0) : (trip.pricePerKg ?? 0),
                        vehicle: trip.vehicle || '',
                        notes: trip.notes || '',
                        driverName: trip.driver?.name || '',
                        driverAvatar: trip.driver?.avatar || '',
                        driverRating: trip.driver?.rating ?? undefined,
                        driverEmail: trip.driver?.email || '',
                        driverPhone: trip.driver?.phone || '',
                      }}
                      mode="search"
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}