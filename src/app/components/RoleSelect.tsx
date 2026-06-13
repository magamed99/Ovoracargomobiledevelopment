import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import {
  Truck, ChevronLeft,
  MapPin, Star, Shield, Package, Zap,
  TrendingUp, CheckCircle2, ArrowRight, Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import { getPublicStats } from '../api/dataApi';
import { getAllReviews } from '../api/dataApi';

// ── data ──────────────────────────────────────────────────────────────────────
const ROLES = [
  {
    id:        'driver' as const,
    icon:      Truck,
    label:     'Водитель',
    labelTj:   'Ронанда',
    tagline:   'Создавайте рейсы и зарабатывайте',
    color:     '#5ba3f5',
    colorDim:  '#5ba3f514',
    colorBrd:  '#5ba3f530',
    gFrom:     '#1d4ed8',
    gTo:       '#0ea5e9',
    emoji:     '🚛',
    perks: [
      { icon: TrendingUp,   text: 'Зарабатывайте на своих маршрутах' },
      { icon: MapPin,       text: 'GPS-навигация и трекинг в реальном времени' },
      { icon: Star,         text: 'Система рейтингов и отзывов' },
      { icon: Shield,       text: 'Страховка груза и верификация клиентов' },
    ],
  },
  {
    id:       'sender' as const,
    icon:     Package,
    label:    'Отправитель',
    labelTj:  'Фиристанда',
    tagline:  'Найдите водителя и отправьте груз',
    color:    '#10b981',
    colorDim: '#10b98114',
    colorBrd: '#10b98130',
    gFrom:    '#059669',
    gTo:      '#14b8a6',
    emoji:    '📦',
    perks: [
      { icon: Zap,          text: 'Мгновенный поиск свободных водителей' },
      { icon: Package,      text: 'Доставка любого груза по маршруту' },
      { icon: CheckCircle2, text: 'Оплата через встроенную систему' },
      { icon: Shield,       text: 'Верифицированные водители — безопасно' },
    ],
  },
] as const;

const LEFT_FEATURES = [
  { icon: MapPin,       text: 'GPS-трекинг в реальном времени',    color: '#5ba3f5' },
  { icon: Shield,       text: 'Застрахованный груз',               color: '#a78bfa' },
  { icon: Star,         text: 'Рейтинги и система отзывов',        color: '#fbbf24' },
  { icon: CheckCircle2, text: 'Верифицированные участники',        color: '#34d399' },
];

// ── local counter ─────────────────────────────────────────────────────────────
function StatCounter({ target, suffix }: { target: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(false);
  useEffect(() => {
    if (ref.current) return;
    ref.current = true;
    const steps = 84;
    let step = 0;
    const t = setInterval(() => {
      step++;
      const eased = 1 - Math.pow(1 - step / steps, 3);
      setCount(Math.round(eased * target));
      if (step >= steps) clearInterval(t);
    }, 1000 / 60);
    return () => clearInterval(t);
  }, [target]);
  return <>{count.toLocaleString('ru-RU')}{suffix}</>;
}

// ── truck svg ─────────────────────────────────────────────────────────────────
function TruckSvg({ size = 48, selected = false }: { size?: number; selected?: boolean }) {
  const body    = selected ? '#cce4ff' : '#1e6fd0';
  const cab     = selected ? '#ddeeff' : '#2176e8';
  const glass   = selected ? '#ffffff' : '#90c8f0';
  const wheel   = selected ? '#aec8e0' : '#0d1d2e';
  const rim     = selected ? '#d0e4f5' : '#1a2b3c';
  const hub     = selected ? '#ffffff' : '#5ba3f5';
  const accent  = selected ? '#99bfe0' : '#0a3870';
  const shineOp = selected ? 0.35 : 0.12;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none"
      style={{ animation: 'truck_float 2.8s ease-in-out infinite', display: 'block', flexShrink: 0 }}>
      {/* Trailer */}
      <rect x="2" y="10" width="40" height="20" rx="3" fill={body}/>
      <rect x="2" y="10" width="40" height="9" rx="3" fill="white" fillOpacity={shineOp}/>
      <line x1="21" y1="11" x2="21" y2="29" stroke={accent} strokeWidth="0.8" strokeOpacity="0.5"/>
      <line x1="33" y1="11" x2="33" y2="29" stroke={accent} strokeWidth="0.8" strokeOpacity="0.5"/>
      {/* Chassis */}
      <rect x="2" y="29" width="60" height="3" rx="2" fill={selected ? '#90b8d8' : '#0b1b2b'}/>
      {/* Cab roof */}
      <path d="M43 16 L52 9 L63 16 Z" fill={selected ? '#c8dffa' : '#1a50b8'}/>
      {/* Cab body */}
      <rect x="43" y="16" width="20" height="16" rx="3" fill={cab}/>
      <rect x="43" y="16" width="20" height="8" rx="3" fill="white" fillOpacity={shineOp}/>
      {/* Windshield */}
      <rect x="46" y="19" width="14" height="10" rx="2" fill={glass} fillOpacity="0.85"/>
      <rect x="46" y="19" width="14" height="4" rx="2" fill="white" fillOpacity="0.2"/>
      {/* Side window */}
      <rect x="44" y="19" width="4" height="8" rx="1.5" fill={glass} fillOpacity="0.6"/>
      {/* Headlight */}
      <rect x="61" y="23" width="3" height="5" rx="1" fill="#fef9c3" fillOpacity="0.95"/>
      {/* Exhaust */}
      <rect x="59" y="7" width="2.5" height="10" rx="1.5" fill={selected ? '#b0c8e0' : '#182433'}/>
      {/* Rear wheel */}
      <g style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: 'truck_wheel 1.4s linear infinite' }}>
        <circle cx="14" cy="38" r="8" fill={wheel}/>
        <circle cx="14" cy="38" r="5" fill={rim}/>
        <circle cx="14" cy="38" r="2" fill={hub}/>
        <line x1="14" y1="30" x2="14" y2="33.5" stroke={hub} strokeWidth="1.5" strokeOpacity="0.7"/>
        <line x1="14" y1="42.5" x2="14" y2="46" stroke={hub} strokeWidth="1.5" strokeOpacity="0.7"/>
        <line x1="6" y1="38" x2="9.5" y2="38" stroke={hub} strokeWidth="1.5" strokeOpacity="0.7"/>
        <line x1="18.5" y1="38" x2="22" y2="38" stroke={hub} strokeWidth="1.5" strokeOpacity="0.7"/>
      </g>
      {/* Front wheel */}
      <g style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: 'truck_wheel 1.4s linear infinite' }}>
        <circle cx="53" cy="38" r="8" fill={wheel}/>
        <circle cx="53" cy="38" r="5" fill={rim}/>
        <circle cx="53" cy="38" r="2" fill={hub}/>
        <line x1="53" y1="30" x2="53" y2="33.5" stroke={hub} strokeWidth="1.5" strokeOpacity="0.7"/>
        <line x1="53" y1="42.5" x2="53" y2="46" stroke={hub} strokeWidth="1.5" strokeOpacity="0.7"/>
        <line x1="45" y1="38" x2="48.5" y2="38" stroke={hub} strokeWidth="1.5" strokeOpacity="0.7"/>
        <line x1="57.5" y1="38" x2="61" y2="38" stroke={hub} strokeWidth="1.5" strokeOpacity="0.7"/>
      </g>
      {/* Speed lines */}
      <line x1="0" y1="17" x2="5" y2="17" stroke={hub} strokeWidth="1.5" strokeOpacity="0.3"
        style={{ animation: 'truck_line 1.4s ease-in-out infinite' }}/>
      <line x1="0" y1="22" x2="7" y2="22" stroke={hub} strokeWidth="1" strokeOpacity="0.2"
        style={{ animation: 'truck_line 1.4s ease-in-out infinite 0.2s' }}/>
    </svg>
  );
}

// ── component ─────────────────────────────────────────────────────────────────
export function RoleSelect() {
  const navigate = useNavigate();
  const { t }    = useLanguage();

  const [selected, setSelected]  = useState<'driver' | 'sender' | null>(null);
  const [hovered, setHovered]    = useState<'driver' | 'sender' | null>(null);
  const [_pressing, setPressing]  = useState<string | null>(null);
  const [liveStats, setLiveStats] = useState<{ drivers: number; cities: number; satisfied: number } | null>(null);
  const [realReview, setRealReview] = useState<{ text: string; author: string; initial: string } | null>(null);

  useEffect(() => {
    getPublicStats()
      .then(s => setLiveStats(s))
      .catch(err => console.warn('[RoleSelect] stats error:', err));

    getAllReviews()
      .then(reviews => {
        const fiveStars = reviews
          .filter((r: any) => r && (r.rating ?? 0) >= 5 && r.comment?.trim())
          .sort((a: any, b: any) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());
        if (fiveStars.length > 0) {
          const r = fiveStars[0];
          const name = r.reviewerName || r.authorName || r.senderName || '';
          const city = r.city || '';
          const initial = name.trim().charAt(0).toUpperCase() || 'О';
          const author = [name, city].filter(Boolean).join(', ') || 'Пользователь платформы';
          setRealReview({ text: r.comment.trim(), author, initial });
        }
      })
      .catch(err => console.warn('[RoleSelect] reviews error:', err));
  }, []);

  const handleContinue = () => {
    if (!selected) return;
    localStorage.setItem('userRole', selected);
    navigate(`/email-auth?role=${selected}`);
  };

  const activeRole = ROLES.find(r => r.id === selected) ?? null;
  // Role driving the reactive ambient glow: hovered takes priority, then selected
  const focusRole  = ROLES.find(r => r.id === (hovered ?? selected)) ?? null;

  // ══════════════════════════════════════════════════════
  // MOBILE LAYOUT (premium)
  // ══════════════════════════════════════════════════════
  const MobileContent = (
    <div className="md:hidden w-full flex flex-col font-['Sora'] text-white overflow-x-hidden"
      style={{ minHeight: '100dvh', background: '#07101e', position: 'relative' }}>

      {/* ── REACTIVE AMBIENT BG (fixed) ── */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <motion.div
          animate={{ background: `radial-gradient(circle at 80% 8%, ${focusRole?.gFrom ?? '#1d4ed8'}28 0%, transparent 55%)` }}
          transition={{ duration: 0.65 }}
          style={{ position: 'absolute', inset: 0 }}
        />
        <motion.div
          animate={{ background: `radial-gradient(circle at 18% 92%, ${focusRole?.gTo ?? '#0ea5e9'}1c 0%, transparent 52%)` }}
          transition={{ duration: 0.65 }}
          style={{ position: 'absolute', inset: 0 }}
        />
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(#5ba3f5 1px, transparent 1px), linear-gradient(90deg, #5ba3f5 1px, transparent 1px)',
          backgroundSize: '42px 42px', opacity: 0.018,
        }} />
      </div>

      {/* ── TOP BAR ── */}
      <div className="relative z-10 flex items-center justify-between px-4 shrink-0"
        style={{ paddingTop: 'max(52px, env(safe-area-inset-top, 52px))', paddingBottom: 10 }}>
        <button
          onClick={() => navigate('/welcome')}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            fontSize: 13, fontWeight: 600, color: '#607080',
            background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <ChevronLeft style={{ width: 15, height: 15 }} />
          Назад
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#5ba3f540' }} />
          <div style={{ width: 22, height: 6, borderRadius: 3, background: '#5ba3f5' }} />
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#5ba3f540' }} />
          <span style={{ fontSize: 10, color: '#3a5570', fontWeight: 700, marginLeft: 4, letterSpacing: '0.05em' }}>2 / 3</span>
        </div>

        <div style={{ width: 52 }} />
      </div>

      {/* ── HERO ── */}
      <div className="relative z-10 flex flex-col items-center text-center px-5 pt-3 pb-5 shrink-0">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 22 }}
          style={{ marginBottom: 14, position: 'relative' }}
        >
          <motion.div
            animate={{
              boxShadow: `0 0 0 ${activeRole ? '10px' : '6px'} ${(focusRole?.color ?? '#5ba3f5')}${activeRole ? '22' : '14'}`,
            }}
            transition={{ duration: 0.5 }}
            style={{ borderRadius: 24, display: 'inline-flex' }}
          >
            <motion.div
              animate={{
                background: activeRole
                  ? `linear-gradient(160deg, ${activeRole.gFrom}ee 0%, ${activeRole.gTo} 100%)`
                  : 'linear-gradient(160deg, #1d4ed8ee 0%, #0ea5e9 100%)',
                boxShadow: activeRole
                  ? `0 4px 0 ${activeRole.gFrom}88 inset, 0 -4px 0 #00000040 inset, 0 18px 52px ${activeRole.color}55`
                  : '0 4px 0 #3b82f688 inset, 0 -4px 0 #00000040 inset, 0 18px 52px #1d4ed855',
              }}
              transition={{ duration: 0.45 }}
              style={{
                width: 76, height: 76, borderRadius: 24,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative', overflow: 'hidden',
              }}
            >
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '52%',
                background: 'linear-gradient(180deg, #ffffff2a 0%, transparent 100%)',
                borderRadius: 'inherit', pointerEvents: 'none',
              }} />
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeRole?.id ?? 'default'}
                  initial={{ scale: 0.5, opacity: 0, rotate: -15 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  exit={{ scale: 0.5, opacity: 0, rotate: 15 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  style={{ position: 'relative', zIndex: 3 }}
                >
                  {activeRole?.id === 'sender' ? (
                    <Package style={{ width: 36, height: 36, color: '#fff', filter: 'drop-shadow(0 2px 8px #00000060)' }} />
                  ) : (
                    <TruckSvg size={46} />
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </motion.div>
        </motion.div>

        <motion.h1
          style={{ fontSize: 26, fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.5px', lineHeight: 1.1 }}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        >
          {t('role_title')}
        </motion.h1>
        <motion.p
          style={{ fontSize: 13, color: '#4a6880', margin: '8px 0 0', maxWidth: 260, lineHeight: 1.55, fontWeight: 500 }}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        >
          {t('role_subtitle')}
        </motion.p>
      </div>

      {/* ── ROLE CARDS ── */}
      <div className="relative z-10 flex flex-col px-4 gap-3 shrink-0">
        {ROLES.map((role, idx) => {
          const isSelected = selected === role.id;
          const Icon = role.icon;
          return (
            <motion.button
              key={role.id}
              onClick={() => setSelected(role.id)}
              onTouchStart={() => setPressing(role.id)}
              onTouchEnd={() => setPressing(null)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileTap={{ scale: 0.975 }}
              transition={{ delay: 0.18 + idx * 0.08, type: 'spring', stiffness: 260, damping: 22 }}
              style={{
                textAlign: 'left', borderRadius: 22, overflow: 'hidden', position: 'relative',
                border: `1.5px solid ${isSelected ? role.color + '60' : '#ffffff0f'}`,
                background: isSelected ? role.colorDim : '#ffffff07',
                backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                boxShadow: isSelected
                  ? `0 10px 40px ${role.color}30, 0 0 0 1px ${role.color}1a, inset 0 1px 0 #ffffff12`
                  : 'inset 0 1px 0 #ffffff08',
                cursor: 'pointer', padding: 0,
                transition: 'border-color 0.3s, background 0.3s, box-shadow 0.35s',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {/* Top accent bar */}
              <div style={{
                height: 3,
                background: isSelected ? `linear-gradient(90deg, ${role.gFrom}, ${role.gTo})` : 'transparent',
                transition: 'background 0.3s',
              }} />

              {/* Corner glow */}
              <div style={{
                position: 'absolute', top: 0, right: 0, width: 100, height: 100, pointerEvents: 'none',
                background: `radial-gradient(circle at top right, ${role.color}${isSelected ? '28' : '10'}, transparent 70%)`,
                transition: 'background 0.35s',
              }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px 15px' }}>
                {/* Icon */}
                <div style={{
                  width: 52, height: 52, borderRadius: 16, flexShrink: 0,
                  background: isSelected ? `linear-gradient(135deg, ${role.gFrom}, ${role.gTo})` : '#ffffff0a',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: isSelected ? `0 4px 20px ${role.color}40` : 'none',
                  transition: 'background 0.3s, box-shadow 0.3s',
                }}>
                  {role.id === 'driver' ? (
                    <TruckSvg size={40} selected={isSelected} />
                  ) : (
                    <Icon style={{ width: 24, height: 24, color: isSelected ? '#fff' : role.color, transition: 'color 0.3s' }} />
                  )}
                </div>

                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <h3 style={{ fontSize: 17, fontWeight: 900, color: '#fff', margin: 0 }}>{role.label}</h3>
                    <span style={{
                      fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 7,
                      background: isSelected ? role.colorDim : '#ffffff08',
                      color: isSelected ? role.color : '#607080',
                      border: `1px solid ${isSelected ? role.colorBrd : '#ffffff08'}`,
                      transition: 'all 0.25s',
                    }}>{role.labelTj}</span>
                  </div>
                  <p style={{ fontSize: 12, color: isSelected ? role.color : '#607080', margin: 0, lineHeight: 1.4, fontWeight: 500, transition: 'color 0.25s' }}>
                    {role.tagline}
                  </p>
                </div>

                {/* Radio */}
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                  border: `2px solid ${isSelected ? role.color : '#ffffff20'}`,
                  background: isSelected ? role.color : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'border-color 0.25s, background 0.25s',
                }}>
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                      >
                        <Check style={{ width: 11, height: 11, color: '#fff', strokeWidth: 3 }} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* ── PERKS / EMPTY STATE ── */}
      <div className="relative z-10 px-4 pt-4 pb-2">
        <AnimatePresence mode="wait">
          {activeRole ? (
            <motion.div
              key={activeRole.id}
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ flex: 1, height: 1, background: '#ffffff08' }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: activeRole.color, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Возможности · {activeRole.label}
                </span>
                <div style={{ flex: 1, height: 1, background: '#ffffff08' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {activeRole.perks.map((perk, i) => {
                  const PIcon = perk.icon;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.055 }}
                      style={{
                        display: 'flex', flexDirection: 'column', gap: 8,
                        padding: '12px 14px', borderRadius: 16,
                        background: activeRole.colorDim, border: `1px solid ${activeRole.colorBrd}`,
                      }}
                    >
                      <div style={{
                        width: 32, height: 32, borderRadius: 10,
                        background: `${activeRole.color}18`, border: `1px solid ${activeRole.colorBrd}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <PIcon style={{ width: 15, height: 15, color: activeRole.color }} />
                      </div>
                      <span style={{ fontSize: 11, color: '#c0d0e0', lineHeight: 1.45, fontWeight: 500 }}>{perk.text}</span>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="hint"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{
                borderRadius: 20, border: '1.5px dashed #ffffff10',
                padding: '22px 20px', textAlign: 'center',
                background: 'linear-gradient(180deg, #ffffff04, transparent)',
              }}
            >
              <motion.div
                animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.1, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  width: 52, height: 52, borderRadius: '50%', margin: '0 auto 10px',
                  background: 'radial-gradient(circle, #5ba3f530, transparent 70%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ fontSize: 24 }}
                >👆</motion.div>
              </motion.div>
              <p style={{ fontSize: 13, color: '#6a89a5', fontWeight: 700, margin: 0 }}>Выберите роль выше</p>
              <p style={{ fontSize: 11, color: '#33506e', margin: '4px 0 0', fontWeight: 500 }}>чтобы увидеть возможности платформы</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── STATS ── */}
      <div className="relative z-10 px-4 pb-3 shrink-0">
        <div style={{
          display: 'flex', borderRadius: 16, overflow: 'hidden',
          border: '1px solid #ffffff0e', background: '#ffffff06',
        }}>
          {[
            { value: liveStats?.drivers ?? 3400, suffix: '+', label: 'Водителей', color: '#5ba3f5' },
            { value: liveStats?.cities  ?? 12,   suffix: '',  label: 'Городов',   color: '#a78bfa' },
            { value: liveStats?.satisfied ?? 98,  suffix: '%', label: 'Довольных', color: '#34d399' },
          ].map((s, i, arr) => (
            <div key={s.label} style={{
              flex: 1, textAlign: 'center', padding: '12px 6px',
              borderRight: i < arr.length - 1 ? '1px solid #ffffff08' : 'none',
            }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: s.color, letterSpacing: '-0.03em', lineHeight: 1 }}>
                <StatCounter key={`${s.label}-${s.value}`} target={s.value} suffix={s.suffix} />
              </div>
              <div style={{ fontSize: 10, color: '#4a6880', fontWeight: 600, marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CTA ── */}
      <div className="relative z-10 px-4 pb-4 shrink-0">
        <motion.button
          onClick={handleContinue}
          disabled={!selected}
          whileTap={selected ? { scale: 0.97 } : {}}
          style={{
            width: '100%', borderRadius: 18, fontWeight: 900, fontSize: 15,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            height: 56,
            background: selected
              ? `linear-gradient(135deg, ${activeRole!.gFrom} 0%, ${activeRole!.gTo} 100%)`
              : '#ffffff08',
            color: selected ? '#fff' : '#2a4060',
            border: 'none', cursor: selected ? 'pointer' : 'not-allowed',
            boxShadow: selected ? `0 8px 32px ${activeRole!.color}40, inset 0 1px 0 #ffffff22` : 'none',
            fontFamily: 'inherit', position: 'relative', overflow: 'hidden',
            transition: 'background 0.3s, box-shadow 0.3s, color 0.3s',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {selected && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(105deg, transparent 20%, #ffffff20 50%, transparent 80%)',
              animation: 'rs_shimmer 2.6s ease-in-out infinite',
              borderRadius: 18,
            }} />
          )}
          <AnimatePresence mode="wait">
            {selected ? (
              <motion.span key="go"
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 10 }}
              >
                {t('role_continue')}
                <ArrowRight style={{ width: 18, height: 18 }} />
              </motion.span>
            ) : (
              <motion.span key="hint"
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                style={{ position: 'relative', zIndex: 1 }}
              >
                Выберите роль для продолжения
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        <motion.p
          style={{ textAlign: 'center', fontSize: 11, color: '#4a6880', margin: '10px 0 0', lineHeight: 1.5 }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        >
          {t('role_helper')}
        </motion.p>
      </div>

      <div style={{ height: 'env(safe-area-inset-bottom, 16px)', minHeight: 16 }} />
    </div>
  );

  // ═════════════════���════════════════════════════════════
  // DESKTOP LAYOUT (новый)
  // ══════════════════════════════════════════════════════
  const DesktopContent = (
    <div className="hidden md:flex h-screen overflow-hidden font-['Sora']" style={{ background: '#07101e' }}>

      {/* ══ LEFT PANEL ══ */}
      <div className="rs-left relative flex flex-col overflow-hidden">
        {/* Background */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(160deg, #071324 0%, #0a1930 50%, #060e1a 100%)',
        }} />
        {/* Grid */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(#5ba3f5 1px, transparent 1px), linear-gradient(90deg, #5ba3f5 1px, transparent 1px)',
          backgroundSize: '48px 48px', opacity: 0.025,
        }} />
        {/* Glow orbs */}
        <div style={{
          position: 'absolute', top: -80, right: -60,
          width: 360, height: 360, borderRadius: '50%',
          background: 'radial-gradient(circle, #1d4ed822 0%, transparent 70%)',
          animation: 'rs_orb1 9s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', bottom: 40, left: -80,
          width: 280, height: 280, borderRadius: '50%',
          background: 'radial-gradient(circle, #10b98118 0%, transparent 70%)',
          animation: 'rs_orb2 12s ease-in-out infinite',
        }} />

        {/* Content */}
        <div className="relative flex flex-col h-full px-10 py-10 z-10">

          {/* Logo */}
          <motion.div
            className="flex items-center gap-3 mb-auto"
            initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <div style={{
              width: 48, height: 48, borderRadius: 15,
              background: 'linear-gradient(135deg, #0f52b6 0%, #2176e8 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 0 1px #5ba3f54d, 0 8px 24px #1964c880',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3" width="15" height="13" rx="2"/>
                <path d="M16 8h4l3 5v4h-7V8z"/>
                <circle cx="5.5" cy="18.5" r="2.5"/>
                <circle cx="18.5" cy="18.5" r="2.5"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.3px', lineHeight: 1.1 }}>
                Ovora <span style={{ color: '#5ba3f5' }}>Cargo</span>
              </div>
              <div style={{ fontSize: 10, color: '#3a5570', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Logistics Pro
              </div>
            </div>
          </motion.div>

          {/* Headline */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <div style={{ width: 20, height: 2, background: '#1978e5', borderRadius: 1 }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: '#5ba3f5', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                Платформа СНГ
              </span>
            </div>
            <h2 style={{
              fontSize: 'clamp(28px, 2.8vw, 40px)',
              fontWeight: 900, lineHeight: 1.1, letterSpacing: '-1px',
              color: '#fff', margin: 0, marginBottom: 12,
            }}>
              Грузоперевозки<br />
              <span style={{
                background: 'linear-gradient(95deg, #2176e8 0%, #5ba3f5 50%, #a78bfa 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                нового поколения
              </span>
            </h2>
            <p style={{ fontSize: 13, color: '#4a6880', lineHeight: 1.7, maxWidth: 280 }}>
              Соединяем водителей и отправителей по всей сети СНГ — быстро, надёжно и прозрачно
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <div style={{ fontSize: 10, fontWeight: 700, color: '#2a4060', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>
              Сеть в цифрах
            </div>
            <div style={{ display: 'flex', gap: 0, border: '1px solid #ffffff0e', borderRadius: 16, overflow: 'hidden', background: '#ffffff06' }}>
              {[
                { value: liveStats?.drivers ?? 3400, suffix: '+', label: 'Водителей',   color: '#5ba3f5' },
                { value: liveStats?.cities  ?? 12,   suffix: '',  label: 'Городов',     color: '#a78bfa' },
                { value: liveStats?.satisfied ?? 98,   suffix: '%', label: 'Довольных',   color: '#34d399' },
              ].map((s, i, arr) => (
                <div key={s.label} style={{
                  flex: 1, textAlign: 'center', padding: '14px 8px',
                  borderRight: i < arr.length - 1 ? '1px solid #ffffff08' : 'none',
                }}>
                  <div style={{ fontSize: 'clamp(20px,2vw,26px)', fontWeight: 900, color: s.color, letterSpacing: '-0.03em', lineHeight: 1 }}>
                    <StatCounter key={`${s.label}-${s.value}`} target={s.value} suffix={s.suffix} />
                  </div>
                  <div style={{ fontSize: 11, color: '#4a6880', fontWeight: 600, marginTop: 5, letterSpacing: '0.04em' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Feature list */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {LEFT_FEATURES.map(({ icon: Icon, text, color }, i) => (
                <motion.div
                  key={text}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.07 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 10 }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                    background: `${color}14`, border: `1px solid ${color}28`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon style={{ width: 14, height: 14, color }} />
                  </div>
                  <span style={{ fontSize: 13, color: '#7a9ab5', fontWeight: 500 }}>{text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Testimonial */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
            style={{
              borderRadius: 16, padding: '14px 16px',
              background: '#ffffff06', border: '1px solid #ffffff0d',
              marginTop: 'auto',
            }}
          >
            {realReview ? (
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 11, flexShrink: 0,
                  background: 'linear-gradient(135deg, #1d4ed8cc, #0ea5e9)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 800, color: '#fff',
                }}>{realReview.initial}</div>
                <div>
                  <p style={{ fontSize: 13, color: '#8aacc5', lineHeight: 1.6, margin: 0, marginBottom: 6 }}>
                    «{realReview.text}»
                  </p>
                  <div style={{ display: 'flex', gap: 2 }}>
                    {[0,1,2,3,4].map(i => (
                      <Star key={i} style={{ width: 11, height: 11, color: '#fbbf24', fill: '#fbbf24' }} />
                    ))}
                    <span style={{ fontSize: 12, color: '#5a7890', marginLeft: 6, fontWeight: 600 }}>{realReview.author}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 11, flexShrink: 0,
                  background: 'linear-gradient(135deg, #1d4ed8cc, #0ea5e9)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 800, color: '#fff',
                }}>А</div>
                <div>
                  <p style={{ fontSize: 13, color: '#8aacc5', lineHeight: 1.6, margin: 0, marginBottom: 6 }}>
                    «Уже 2 года вожу через Ovora Cargo — клиенты всегда на связи, оплата без задержек»
                  </p>
                  <div style={{ display: 'flex', gap: 2 }}>
                    {[0,1,2,3,4].map(i => (
                      <Star key={i} style={{ width: 11, height: 11, color: '#fbbf24', fill: '#fbbf24' }} />
                    ))}
                    <span style={{ fontSize: 12, color: '#5a7890', marginLeft: 6, fontWeight: 600 }}>Акбар М., Душанбе</span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>

        </div>
      </div>

      {/* ══ RIGHT PANEL ══ */}
      <div className="rs-right flex flex-col overflow-y-auto relative" style={{ background: '#0a1322' }}>

        {/* Ambient reactive background */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
          {/* fine grid */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'linear-gradient(#5ba3f5 1px, transparent 1px), linear-gradient(90deg, #5ba3f5 1px, transparent 1px)',
            backgroundSize: '54px 54px', opacity: 0.022,
            maskImage: 'radial-gradient(ellipse 90% 70% at 70% 20%, #000 30%, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(ellipse 90% 70% at 70% 20%, #000 30%, transparent 80%)',
          }} />
          {/* reactive color wash — shifts with hovered/selected role */}
          <motion.div
            animate={{
              background: `radial-gradient(circle at 75% 18%, ${(focusRole?.gFrom ?? '#1d4ed8')}26 0%, transparent 55%)`,
            }}
            transition={{ duration: 0.6 }}
            style={{ position: 'absolute', inset: 0 }}
          />
          <motion.div
            animate={{
              background: `radial-gradient(circle at 20% 90%, ${(focusRole?.gTo ?? '#0ea5e9')}1c 0%, transparent 50%)`,
            }}
            transition={{ duration: 0.6 }}
            style={{ position: 'absolute', inset: 0 }}
          />
          {/* drifting glow orb */}
          <motion.div
            animate={{ background: `radial-gradient(circle, ${(focusRole?.color ?? '#1d4ed8')}1f 0%, transparent 70%)` }}
            transition={{ duration: 0.6 }}
            style={{
              position: 'absolute', top: -60, right: -40, width: 320, height: 320, borderRadius: '50%',
              animation: 'rs_orb1 10s ease-in-out infinite',
            }}
          />
        </div>

        {/* Top bar */}
        <motion.div
          className="flex items-center justify-between px-10 pt-8 pb-0 shrink-0 relative z-10"
          initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        >
          <button
            onClick={() => navigate('/welcome')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 13, fontWeight: 600, color: '#4a6880',
              background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              transition: 'color 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#fff'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#4a6880'}
          >
            <ChevronLeft style={{ width: 16, height: 16 }} />
            Назад
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#5ba3f540' }} />
            <div style={{ width: 24, height: 6, borderRadius: 3, background: '#5ba3f5' }} />
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#5ba3f540' }} />
            <span style={{ fontSize: 11, color: '#3a5570', fontWeight: 600, marginLeft: 6 }}>Шаг 2 из 3</span>
          </div>
        </motion.div>

        {/* Heading */}
        <motion.div
          className="px-10 pt-8 pb-6 shrink-0 relative z-10"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        >
          <h1 style={{ fontSize: 'clamp(26px, 2.5vw, 36px)', fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.5px', lineHeight: 1.1 }}>
            Выберите вашу роль
          </h1>
          <p style={{ fontSize: 14, color: '#4a6880', marginTop: 8, marginBottom: 0 }}>
            Как вы хотите использовать Ovora Cargo?
          </p>
        </motion.div>

        {/* Role cards — 2 columns */}
        <div className="px-10 pb-6 shrink-0 relative z-10">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {ROLES.map((role, idx) => {
              const isSelected = selected === role.id;
              const isHovered  = hovered === role.id;
              const lit         = isSelected || isHovered;
              const Icon = role.icon;
              return (
                <motion.button
                  key={role.id}
                  onClick={() => setSelected(role.id)}
                  onMouseEnter={() => setHovered(role.id)}
                  onMouseLeave={() => setHovered(null)}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -5 }}
                  whileTap={{ scale: 0.985 }}
                  transition={{ delay: 0.18 + idx * 0.1, type: 'spring', stiffness: 240, damping: 22 }}
                  style={{
                    textAlign: 'left', borderRadius: 22, overflow: 'hidden',
                    border: `1.5px solid ${isSelected ? role.color + '70' : isHovered ? role.color + '40' : '#ffffff10'}`,
                    background: isSelected ? role.colorDim : '#ffffff07',
                    backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
                    boxShadow: isSelected
                      ? `0 14px 50px ${role.color}33, 0 0 0 1px ${role.color}22, inset 0 1px 0 #ffffff14`
                      : isHovered
                        ? `0 18px 48px ${role.color}24, inset 0 1px 0 #ffffff12`
                        : 'inset 0 1px 0 #ffffff08',
                    cursor: 'pointer', position: 'relative',
                    transition: 'border-color 0.3s, background 0.3s, box-shadow 0.35s',
                    padding: 0,
                  }}
                >
                  {/* Corner glow highlight */}
                  <div style={{
                    position: 'absolute', top: -1, right: -1, width: 120, height: 120, pointerEvents: 'none',
                    background: `radial-gradient(circle at top right, ${role.color}${lit ? '2e' : '12'}, transparent 70%)`,
                    transition: 'background 0.35s', borderRadius: 'inherit',
                  }} />
                  {/* Top accent */}
                  <div style={{
                    height: 3,
                    background: lit ? `linear-gradient(90deg, ${role.gFrom}, ${role.gTo})` : 'transparent',
                    transition: 'background 0.3s',
                  }} />

                  <div style={{ padding: '20px 20px 18px' }}>
                    {/* Icon row */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                      <div style={{
                        width: 54, height: 54, borderRadius: 16,
                        background: isSelected
                          ? `linear-gradient(135deg, ${role.gFrom}, ${role.gTo})`
                          : isHovered ? `${role.color}1c` : '#ffffff0a',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: isSelected
                          ? `0 6px 24px ${role.color}50`
                          : isHovered ? `0 4px 18px ${role.color}2e` : 'none',
                        transition: 'background 0.3s, box-shadow 0.3s',
                        flexShrink: 0,
                      }}>
                        {role.id === 'driver' ? (
                          <TruckSvg size={42} selected={isSelected} />
                        ) : (
                          <Icon style={{ width: 26, height: 26, color: isSelected ? '#fff' : role.color, transition: 'color 0.3s' }} />
                        )}
                      </div>
                      {/* Radio */}
                      <div style={{
                        width: 22, height: 22, borderRadius: '50%',
                        border: `2px solid ${isSelected ? role.color : isHovered ? role.color + '99' : '#ffffff20'}`,
                        background: isSelected ? role.color : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'border-color 0.25s, background 0.25s', flexShrink: 0,
                      }}>
                        <AnimatePresence>
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0, opacity: 0 }}
                              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                            >
                              <Check style={{ width: 12, height: 12, color: '#fff', strokeWidth: 3 }} />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* Label */}
                    <div style={{ marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <h3 style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: 0 }}>{role.label}</h3>
                      <span style={{
                        fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 8,
                        background: isSelected ? role.colorDim : '#ffffff08',
                        color: isSelected ? role.color : '#4a6880',
                        border: `1px solid ${isSelected ? role.colorBrd : '#ffffff08'}`,
                        transition: 'all 0.25s',
                      }}>
                        {role.labelTj}
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: isSelected ? role.color : '#4a6880', margin: 0, lineHeight: 1.5, fontWeight: 500, transition: 'color 0.25s' }}>
                      {role.tagline}
                    </p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Perks grid — appears when role selected */}
        <div className="px-10 pb-6 flex-1 relative z-10">
          <AnimatePresence mode="wait">
            {activeRole && (
              <motion.div
                key={activeRole.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <div style={{ flex: 1, height: 1, background: '#ffffff08' }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: activeRole.color, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    Возможности · {activeRole.label}
                  </span>
                  <div style={{ flex: 1, height: 1, background: '#ffffff08' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {activeRole.perks.map((perk, i) => {
                    const PIcon = perk.icon;
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                        style={{
                          display: 'flex', alignItems: 'flex-start', gap: 12,
                          padding: '14px 16px', borderRadius: 16,
                          background: activeRole.colorDim,
                          border: `1px solid ${activeRole.colorBrd}`,
                        }}
                      >
                        <div style={{
                          width: 34, height: 34, borderRadius: 11, flexShrink: 0,
                          background: `${activeRole.color}18`,
                          border: `1px solid ${activeRole.colorBrd}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <PIcon style={{ width: 15, height: 15, color: activeRole.color }} />
                        </div>
                        <span style={{ fontSize: 12, color: '#c0d0e0', lineHeight: 1.5, fontWeight: 500 }}>{perk.text}</span>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
            {!activeRole && (
              <motion.div
                key="hint"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                style={{
                  borderRadius: 20, border: '1.5px dashed #ffffff12',
                  padding: '28px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden',
                  background: 'linear-gradient(180deg, #ffffff05, transparent)',
                }}
              >
                {/* Animated halo */}
                <motion.div
                  animate={{ opacity: [0.25, 0.5, 0.25], scale: [1, 1.12, 1] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  style={{
                    width: 64, height: 64, borderRadius: '50%', margin: '0 auto 14px',
                    background: 'radial-gradient(circle, #5ba3f53a, transparent 70%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ fontSize: 30 }}
                  >👆</motion.div>
                </motion.div>
                <p style={{ fontSize: 14, color: '#6a89a5', fontWeight: 700, margin: 0 }}>
                  Выберите роль выше
                </p>
                <p style={{ fontSize: 12, color: '#33506e', fontWeight: 500, margin: '6px 0 0' }}>
                  чтобы увидеть возможности платформы
                </p>
                {/* Teaser skeleton of the perks grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 22 }}>
                  {[0,1,2,3].map(i => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '13px 14px', borderRadius: 14,
                      background: '#ffffff05', border: '1px solid #ffffff0a',
                    }}>
                      <div style={{ width: 30, height: 30, borderRadius: 10, background: '#ffffff0a', flexShrink: 0 }} />
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ height: 7, borderRadius: 4, background: '#ffffff0d', width: '85%' }} />
                        <div style={{ height: 7, borderRadius: 4, background: '#ffffff08', width: '55%' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* CTA */}
        <div className="px-10 pb-10 shrink-0 relative z-10">
          <div style={{ height: 1, background: '#ffffff08', marginBottom: 20 }} />
          <motion.button
            onClick={handleContinue}
            disabled={!selected}
            whileTap={selected ? { scale: 0.98 } : {}}
            style={{
              width: '100%', borderRadius: 18, fontWeight: 900, fontSize: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              padding: '18px 28px',
              background: selected
                ? `linear-gradient(135deg, ${activeRole!.gFrom} 0%, ${activeRole!.gTo} 100%)`
                : '#ffffff08',
              color: selected ? '#fff' : '#2a4060',
              border: 'none', cursor: selected ? 'pointer' : 'not-allowed',
              boxShadow: selected ? `0 8px 36px ${activeRole!.color}40, inset 0 1px 0 #ffffff25` : 'none',
              fontFamily: 'inherit',
              transition: 'background 0.3s, box-shadow 0.3s, color 0.3s',
              position: 'relative', overflow: 'hidden',
            }}
          >
            {selected && (
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(105deg, transparent 20%, #ffffff20 50%, transparent 80%)',
                animation: 'rs_shimmer 2.6s ease-in-out infinite',
                borderRadius: 18,
              }} />
            )}
            <span style={{ position: 'relative', zIndex: 1 }}>
              {selected ? `Продолжить как ${activeRole!.label}` : 'Выберите роль для продолжения'}
            </span>
            {selected && <ArrowRight style={{ width: 20, height: 20, position: 'relative', zIndex: 1 }} />}
          </motion.button>

          <p style={{ textAlign: 'center', fontSize: 12, color: '#4a6880', marginTop: 12 }}>
            {t('role_helper')}
          </p>
        </div>

      </div>

      <style>{`
        @keyframes truck_wheel {
          to { transform: rotate(360deg); }
        }
        @keyframes truck_float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        @keyframes truck_line {
          0%, 100% { opacity: 0.2; transform: translateX(0); }
          50% { opacity: 0; transform: translateX(-6px); }
        }
        @keyframes rs_orb1 {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-28px) scale(1.06); }
        }
        @keyframes rs_orb2 {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(24px) scale(1.04); }
        }
        @keyframes rs_shimmer {
          0% { transform: translateX(-130%); }
          55% { transform: translateX(130%); }
          100% { transform: translateX(130%); }
        }
        .rs-left {
          width: clamp(320px, 36vw, 460px);
          flex-shrink: 0;
          border-right: 1px solid #ffffff08;
        }
        .rs-right {
          flex: 1;
          min-width: 0;
        }
        @media (min-width: 1400px) {
          .rs-left { width: 500px; }
        }
      `}</style>
    </div>
  );

  return (
    <>
      {MobileContent}
      {DesktopContent}
    </>
  );
}