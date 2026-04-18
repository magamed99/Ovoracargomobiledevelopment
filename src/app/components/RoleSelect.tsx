import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import {
  Truck, ChevronLeft,
  MapPin, Star, Shield, Package, Zap,
  TrendingUp, CheckCircle2, ArrowRight, Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import dispatchSvg from '../../imports/dispatch_17418872.svg';
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
  const [pressing, setPressing]  = useState<string | null>(null);
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

  // ══════════════════════════════════════════════════════
  // MOBILE LAYOUT (unchanged)
  // ══════════════════════════════════════════════════════
  const MobileContent = (
    <div className="md:hidden w-full flex flex-col font-['Sora'] bg-[#0e1621] text-white overflow-hidden" style={{ height: '100dvh' }}>

      {/* ── HERO / BG ── */}
      <div className="relative overflow-hidden shrink-0">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(150deg, #0a1f3d 0%, #0e1621 60%)' }} />
          <motion.div
            className="absolute -top-16 sm:-top-20 -right-16 sm:-right-20 w-56 sm:w-72 h-56 sm:h-72 rounded-full"
            animate={{ opacity: activeRole ? 0.25 : 0.15 }}
            transition={{ duration: 0.5 }}
            style={{
              background: `radial-gradient(circle, ${activeRole?.gFrom ?? '#1d4ed8'} 0%, transparent 70%)`,
            }}
          />
          <motion.div
            className="absolute top-24 sm:top-32 -left-12 sm:-left-16 w-40 sm:w-52 h-40 sm:h-52 rounded-full"
            animate={{ opacity: activeRole ? 0.20 : 0.10 }}
            transition={{ duration: 0.5 }}
            style={{
              background: `radial-gradient(circle, ${activeRole?.gTo ?? '#0ea5e9'} 0%, transparent 70%)`,
            }}
          />
        </div>

        {/* Top bar */}
        <div
          className="relative flex items-center justify-between px-3 sm:px-4"
          style={{ paddingTop: 'max(52px, env(safe-area-inset-top, 52px))', paddingBottom: 8 }}
        >
          <button
            onClick={() => navigate('/welcome')}
            className="flex items-center gap-1 sm:gap-1.5 text-[12px] sm:text-[13px] font-semibold text-[#607080] hover:text-white active:scale-90 transition-all"
          >
            <ChevronLeft className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
            Назад
          </button>

          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#5ba3f5]/40" />
            <div className="w-4 sm:w-5 h-1.5 rounded-full bg-[#5ba3f5]" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#5ba3f5]/40" />
          </div>

          <div className="w-12 sm:w-14" />
        </div>

        {/* Brand block */}
        <div className="relative px-3 sm:px-4 pt-3 sm:pt-4 pb-5 sm:pb-6 flex flex-col items-center text-center">
          <motion.div
            className="relative mb-2.5 sm:mb-3"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <div
              className="w-14 sm:w-16 h-14 sm:h-16 rounded-2xl sm:rounded-3xl flex items-center justify-center relative overflow-hidden"
              style={{
                background: activeRole
                  ? `linear-gradient(160deg, ${activeRole.gFrom}ee 0%, ${activeRole.gTo} 100%)`
                  : 'linear-gradient(160deg, #1d4ed8ee 0%, #0ea5e9 100%)',
                boxShadow: activeRole
                  ? `0 2px 0 ${activeRole.gFrom}88 inset, 0 -3px 0 #00000040 inset, 0 12px 36px ${activeRole.color}55, 0 4px 12px #00000060`
                  : '0 2px 0 #3b82f688 inset, 0 -3px 0 #00000040 inset, 0 12px 36px #1d4ed855, 0 4px 12px #00000060',
                transition: 'background 0.4s, box-shadow 0.4s',
              }}
            >
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '52%',
                background: 'linear-gradient(180deg, #ffffff28 0%, #ffffff08 60%, transparent 100%)',
                borderRadius: 'inherit', pointerEvents: 'none', zIndex: 1,
              }} />
              <div style={{
                position: 'absolute', top: 0, left: '15%', right: '15%', height: 1,
                background: 'linear-gradient(90deg, transparent, #ffffff60, transparent)',
                pointerEvents: 'none', zIndex: 2,
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
                    <Package style={{ width: 34, height: 34, color: '#fff', filter: 'drop-shadow(0 2px 8px #00000060)' }} />
                  ) : (
                    <TruckSvg size={44} />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>

          <motion.h1 className="text-[24px] font-black text-white leading-tight" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            {t('role_title')}
          </motion.h1>
          <motion.p className="text-[13px] text-[#607080] mt-1 max-w-[260px] leading-snug" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            {t('role_subtitle')}
          </motion.p>
        </div>
      </div>

      {/* ── ROLE CARDS ── */}
      <div className="flex-1 flex flex-col px-4 gap-3 overflow-y-auto pb-6">
        {ROLES.map((role, idx) => {
          const isSelected = selected === role.id;
          const Icon = role.icon;
          return (
            <motion.button
              key={role.id}
              onClick={() => setSelected(role.id)}
              onTouchStart={() => setPressing(role.id)}
              onTouchEnd={() => setPressing(null)}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 + idx * 0.08, type: 'spring', stiffness: 260, damping: 22 }}
              className="w-full text-left rounded-3xl overflow-hidden relative transition-transform duration-150 active:scale-[0.97]"
              style={{
                border: `1.5px solid ${isSelected ? role.color + '60' : 'rgba(255,255,255,0.07)'}`,
                background: isSelected ? role.colorDim : 'rgba(255,255,255,0.035)',
                boxShadow: isSelected ? `0 8px 32px ${role.color}28, 0 0 0 1px ${role.color}20` : 'none',
                transition: 'border-color 0.3s, background 0.3s, box-shadow 0.3s',
              }}
            >
              <AnimatePresence>
                {isSelected && (
                  <motion.div className="absolute top-0 inset-x-0 h-[2px]"
                    initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} exit={{ scaleX: 0 }} transition={{ duration: 0.3 }}
                    style={{ background: `linear-gradient(90deg, ${role.gFrom}, ${role.gTo})` }}
                  />
                )}
              </AnimatePresence>

              <div className="flex items-center gap-4 px-4 pt-4 pb-3">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300"
                  style={{
                    background: isSelected ? `linear-gradient(135deg, ${role.gFrom}, ${role.gTo})` : 'rgba(255,255,255,0.07)',
                    boxShadow: isSelected ? `0 4px 20px ${role.color}40` : 'none',
                  }}
                >
                  {role.id === 'driver' ? (
                    <TruckSvg size={44} selected={isSelected} />
                  ) : (
                    <Icon className="w-7 h-7 transition-colors duration-300" style={{ color: isSelected ? '#fff' : role.color }} />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-[17px] font-black text-white">{role.label}</h3>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-lg"
                      style={{
                        background: isSelected ? role.colorDim : 'rgba(255,255,255,0.07)',
                        color: isSelected ? role.color : '#607080',
                        border: `1px solid ${isSelected ? role.colorBrd : 'rgba(255,255,255,0.07)'}`,
                      }}
                    >
                      {role.labelTj}
                    </span>
                  </div>
                  <p className="text-[12px] font-medium leading-snug transition-colors duration-300"
                    style={{ color: isSelected ? role.color : '#607080' }}>
                    {role.tagline}
                  </p>
                </div>

                <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-300"
                  style={{ borderColor: isSelected ? role.color : 'rgba(255,255,255,0.15)', background: isSelected ? role.color : 'transparent' }}>
                  <AnimatePresence>
                    {isSelected && (
                      <motion.svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}
                        initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 18 }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </motion.svg>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <AnimatePresence>
                {isSelected && (
                  <motion.div className="overflow-hidden"
                    initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}>
                    <div className="mx-4 mb-4 rounded-2xl p-3 flex flex-col gap-2"
                      style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${role.colorBrd}` }}>
                      {role.perks.map((perk, i) => {
                        const PIcon = perk.icon;
                        return (
                          <motion.div key={i} className="flex items-center gap-2.5"
                            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.055 }}>
                            <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                              style={{ background: role.colorDim, border: `1px solid ${role.colorBrd}` }}>
                              <PIcon className="w-3.5 h-3.5" style={{ color: role.color }} />
                            </div>
                            <span className="text-[12px] text-[#c0d0e0] leading-snug">{perk.text}</span>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}

        {/* ── CTA ── */}
        <motion.div className="mt-1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.36 }}>
          <motion.button
            onClick={handleContinue}
            disabled={!selected}
            whileTap={selected ? { scale: 0.97 } : {}}
            className="w-full h-13 rounded-3xl font-black text-[15px] flex items-center justify-center gap-2.5 transition-all duration-300"
            style={
              selected
                ? { background: `linear-gradient(135deg, ${activeRole!.gFrom}, ${activeRole!.gTo})`, boxShadow: `0 4px 24px ${activeRole!.color}40`, color: '#fff' }
                : { background: 'rgba(255,255,255,0.05)', color: '#607080', cursor: 'not-allowed' }
            }
          >
            <AnimatePresence mode="wait">
              {selected ? (
                <motion.span key="continue" className="flex items-center gap-2"
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
                  {t('role_continue')}
                  <ArrowRight style={{ width: 18, height: 18 }} />
                </motion.span>
              ) : (
                <motion.span key="hint" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
                  Выберите роль для продолжения
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
          <motion.p className="text-center text-[12px] text-[#607080] mt-3 leading-snug"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            {t('role_helper')}
          </motion.p>
        </motion.div>

        <div style={{ height: 'env(safe-area-inset-bottom, 16px)', minHeight: 16 }} />
      </div>
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
      <div className="rs-right flex flex-col overflow-y-auto" style={{ background: '#0a1322' }}>

        {/* Top bar */}
        <motion.div
          className="flex items-center justify-between px-10 pt-8 pb-0 shrink-0"
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
          className="px-10 pt-8 pb-6 shrink-0"
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
        <div className="px-10 pb-6 shrink-0">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {ROLES.map((role, idx) => {
              const isSelected = selected === role.id;
              const Icon = role.icon;
              return (
                <motion.button
                  key={role.id}
                  onClick={() => setSelected(role.id)}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.18 + idx * 0.1, type: 'spring', stiffness: 240, damping: 22 }}
                  style={{
                    textAlign: 'left', borderRadius: 22, overflow: 'hidden',
                    border: `1.5px solid ${isSelected ? role.color + '60' : '#ffffff10'}`,
                    background: isSelected ? role.colorDim : '#ffffff06',
                    boxShadow: isSelected ? `0 8px 40px ${role.color}28, 0 0 0 1px ${role.color}18` : 'none',
                    cursor: 'pointer', position: 'relative',
                    transition: 'border-color 0.3s, background 0.3s, box-shadow 0.35s',
                    padding: 0,
                  }}
                >
                  {/* Top accent */}
                  <div style={{
                    height: 2,
                    background: isSelected ? `linear-gradient(90deg, ${role.gFrom}, ${role.gTo})` : 'transparent',
                    transition: 'background 0.3s',
                  }} />

                  <div style={{ padding: '20px 20px 18px' }}>
                    {/* Icon row */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                      <div style={{
                        width: 52, height: 52, borderRadius: 16,
                        background: isSelected ? `linear-gradient(135deg, ${role.gFrom}, ${role.gTo})` : '#ffffff0a',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: isSelected ? `0 4px 20px ${role.color}40` : 'none',
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
                        width: 22, height: 22, borderRadius: '50%', border: `2px solid ${isSelected ? role.color : '#ffffff20'}`,
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
        <div className="px-10 pb-6 flex-1">
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
                  borderRadius: 20, border: '1.5px dashed #ffffff0d',
                  padding: '32px 24px', textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 12 }}>👆</div>
                <p style={{ fontSize: 13, color: '#2a4060', fontWeight: 600, margin: 0 }}>
                  Выберите роль выше, чтобы увидеть возможности
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* CTA */}
        <div className="px-10 pb-10 shrink-0">
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