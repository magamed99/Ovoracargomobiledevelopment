import { useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import type { LangCode } from '../i18n/translations';
import { getPublicStats } from '../api/dataApi';

// ── Palette ────────────────────────────────────────────────────────────
const C = {
  dim:       '#6b8299',
  dim2:      '#4a6080',
  dim3:      '#3d5268',
  blue:      '#2176e8',
  blueLight: '#5ba3f5',
  cyan:      '#38bdf8',
  green:     '#34d399',
  orange:    '#ff7a3b',
  purple:    '#a78bfa',
  cardLine:  'rgba(80,140,230,0.14)',
} as const;

// ── Language list ──────────────────────────────────────────────────────
const LANGS: { code: LangCode; display: string; flag: string }[] = [
  { code: 'ru', display: 'RU', flag: '🇷🇺' },
  { code: 'tj', display: 'TJ', flag: '🇹🇯' },
  { code: 'en', display: 'EN', flag: '🇺🇸' },
];

// ── Partner placeholders ───────────────────────────────────────────────
const PARTNERS = [
  { name: 'Atlas Freight', sub: 'Global Logistics', mark: 'AF', color: '#e8443d' },
  { name: 'Northwave',     sub: 'Ocean Shipping',   mark: 'NW', color: '#1872c4' },
  { name: 'SwiftLine',     sub: 'Express Chain',    mark: 'SL', color: '#f5b81d' },
  { name: 'Anatolia',      sub: 'Air Freight',      mark: 'AN', color: '#cf2d2d' },
  { name: 'Eurorail',      sub: 'Logistics',        mark: 'ER', color: '#cf2222' },
];

// ── Counter ────────────────────────────────────────────────────────────
function Counter({ target, suffix }: { target: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const steps = Math.round((1200 / 1000) * 60);
    let step = 0;
    const timer = setInterval(() => {
      step++;
      setCount(Math.round((1 - Math.pow(1 - step / steps, 3)) * target));
      if (step >= steps) clearInterval(timer);
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [target]);
  return <>{count.toLocaleString('ru-RU')}{suffix}</>;
}

// ── Live dot ───────────────────────────────────────────────────────────
function LiveDot({ color = C.green, size = 8 }: { color?: string; size?: number }) {
  return (
    <span style={{ position: 'relative', width: size, height: size, display: 'inline-block', flexShrink: 0 }}>
      <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: color, animation: 'pulseRing 2s ease-out infinite' }} />
      <span style={{ position: 'absolute', inset: size * 0.18, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}` }} />
    </span>
  );
}

// ── Map background ─────────────────────────────────────────────────────
function MapBackground() {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(rgba(91,163,245,0.12) 1px, transparent 1px)',
        backgroundSize: '18px 18px',
        maskImage: 'radial-gradient(ellipse 80% 60% at 50% 30%, #000 30%, transparent 75%)',
        WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 30%, #000 30%, transparent 75%)',
      }} />
      <div style={{
        position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)',
        width: 520, height: 520, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(33,118,232,0.35) 0%, transparent 60%)',
        filter: 'blur(20px)',
      }} />
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 460 920" preserveAspectRatio="none">
        <defs>
          <linearGradient id="arcGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#5ba3f5" stopOpacity="0" />
            <stop offset="50%"  stopColor="#5ba3f5" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#5ba3f5" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M-20 220 Q 230 80 480 220" stroke="url(#arcGrad)" strokeWidth="1" fill="none"
          strokeDasharray="6 6" style={{ animation: 'dashMove 4s linear infinite' }} />
        <path d="M-20 320 Q 230 200 480 320" stroke="url(#arcGrad)" strokeWidth="1" fill="none"
          strokeDasharray="3 7" opacity="0.6" style={{ animation: 'dashMove 7s linear infinite reverse' }} />
        <circle cx="80"  cy="180" r="2.5" fill="#5ba3f5" />
        <circle cx="380" cy="190" r="2.5" fill="#5ba3f5" />
        <circle cx="230" cy="115" r="3"   fill="#34d399" />
      </svg>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 50% 30%, transparent 30%, #03070f 100%)' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%', background: 'linear-gradient(to top, #03070f 35%, transparent 100%)' }} />
    </div>
  );
}

// ── Logo ───────────────────────────────────────────────────────────────
function Logo() {
  return (
    <div style={{
      width: 44, height: 44, borderRadius: 14,
      boxShadow: '0 0 0 1px rgba(91,163,245,0.3), 0 8px 24px rgba(25,100,200,0.55)',
      overflow: 'hidden', flexShrink: 0,
    }}>
      <img src="/icons/logo-bird.png" alt="Ovora" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
    </div>
  );
}

// ── Eyebrow label ──────────────────────────────────────────────────────
function Eyebrow({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
      <div style={{ width: 22, height: 2, background: C.blue, borderRadius: 1 }} />
      <span style={{ fontSize: 10, fontWeight: 700, color: C.blueLight, letterSpacing: '0.14em', textTransform: 'uppercase' }}>{label}</span>
    </div>
  );
}

// ── Arrow right ────────────────────────────────────────────────────────
function ArrowRight({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  );
}

// ── 3D icon wrapper ────────────────────────────────────────────────────
function Icon3D({ size = 42, hue1, hue2, glow, children, radius = 12 }: {
  size?: number; hue1: string; hue2: string; glow: string; children: ReactNode; radius?: number;
}) {
  return (
    <div style={{
      width: size, height: size, borderRadius: radius, flexShrink: 0,
      background: `linear-gradient(155deg, ${hue1} 0%, ${hue2} 100%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
      boxShadow: `0 0 0 1px rgba(255,255,255,0.08),inset 0 1.2px 0 rgba(255,255,255,0.45),inset 0 -1.5px 1px rgba(0,0,0,0.25),0 8px 18px ${glow},0 2px 4px rgba(0,0,0,0.3)`,
    }}>
      <span style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '55%', background: 'linear-gradient(180deg, rgba(255,255,255,0.32), transparent)', borderRadius: `${radius}px ${radius}px 100% 100% / ${radius}px ${radius}px 30% 30%`, pointerEvents: 'none' }} />
      <span style={{ position: 'absolute', top: '8%', left: '12%', width: '30%', height: '18%', background: 'rgba(255,255,255,0.55)', borderRadius: '50%', filter: 'blur(3px)', pointerEvents: 'none' }} />
      <span style={{ position: 'relative', zIndex: 1, display: 'flex', filter: 'drop-shadow(0 1.5px 1.5px rgba(0,0,0,0.35))' }}>{children}</span>
    </div>
  );
}

// ── Tag mini-icons ─────────────────────────────────────────────────────
const _ti = (paths: ReactNode) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">{paths}</svg>
);
const Ti = {
  border: _ti(<><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></>),
  driver: _ti(<><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>),
  box:    _ti(<><path d="M16.5 9.4 7.55 4.24"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></>),
  radio:  _ti(<><path d="M4.9 16.1C1 12.2 1 5.8 4.9 1.9"/><path d="M7.8 4.7a6.14 6.14 0 0 0-.8 7.5"/><circle cx="12" cy="9" r="2"/><path d="M16.2 4.8c2 2 2.26 5.11.8 7.47"/><path d="M19.1 1.9a9.96 9.96 0 0 1 0 14.1"/><path d="M9.5 18h5"/><path d="m8 22 4-11 4 11"/></>),
  plane:  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12c0 .55-.45 1-1 1h-6.5l-3 7H10l1.5-7H7l-2 2H3l1.5-3L3 9h2l2 2h4.5L10 4h1.5l3 7H21c.55 0 1 .45 1 1z"/></svg>,
  mail:   _ti(<><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></>),
  flex:   _ti(<><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></>),
};

// ── Cargo truck photo ─────────────────────────────────────────────────
function TruckBig() {
  return (
    <img
      src="/icons/cargo-truck.png"
      alt="OVORA-CARGO"
      style={{ width: 110, height: 74, objectFit: 'cover', borderRadius: 10, flexShrink: 0, display: 'block' }}
    />
  );
}

// ── Avia plane photo ──────────────────────────────────────────────────
function PlaneBig() {
  return (
    <img
      src="/icons/avia-plane.png"
      alt="AVIA-CARGO"
      style={{ width: 110, height: 74, objectFit: 'cover', borderRadius: 10, flexShrink: 0, display: 'block' }}
    />
  );
}

// ── World card ─────────────────────────────────────────────────────────
interface WorldCardProps {
  title: string;
  desc: string;
  tags: { icon: ReactNode; label: string }[];
  accent: string;
  accentLight: string;
  icon: ReactNode;
  onClick: () => void;
}
function WorldCard({ title, desc, tags, accent, accentLight, icon, onClick }: WorldCardProps) {
  return (
    <button onClick={onClick} style={{
      border: `1px solid ${accent}30`,
      background: `linear-gradient(145deg, ${accent}1a 0%, rgba(10,22,40,0.55) 100%)`,
      borderRadius: 20, padding: 0, width: '100%', cursor: 'pointer',
      textAlign: 'left', position: 'relative', overflow: 'hidden',
      fontFamily: 'inherit', backdropFilter: 'blur(8px)',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${accent}, transparent)`, opacity: 0.7 }} />
      <div style={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, borderRadius: '50%', background: `radial-gradient(circle, ${accent}40, transparent 70%)`, filter: 'blur(8px)', pointerEvents: 'none' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '15px 15px 11px', position: 'relative' }}>
        {icon}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '-0.3px' }}>{title}</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: C.green, padding: '2px 7px', borderRadius: 9, background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', letterSpacing: '0.06em', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <LiveDot size={5} /> LIVE
            </span>
          </div>
          <p style={{ fontSize: 11, color: C.dim, lineHeight: 1.45, margin: 0 }}>{desc}</p>
        </div>
        <ArrowRight color={accentLight} />
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: '0 15px 15px', position: 'relative' }}>
        {tags.map((t, i) => (
          <span key={i} style={{ fontSize: 10, fontWeight: 600, color: accentLight, padding: '4px 9px', borderRadius: 8, background: `${accent}10`, border: `1px solid ${accent}25`, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <span style={{ display: 'inline-flex' }}>{t.icon}</span>
            {t.label}
          </span>
        ))}
      </div>
    </button>
  );
}

// ── Stat icon type ─────────────────────────────────────────────────────
type StatIconType = 'box' | 'driver' | 'clock' | 'check';
const STAT_HUES: Record<StatIconType, { h1: string; h2: string; glow: string }> = {
  box:    { h1: '#7dd3fc', h2: '#0369a1', glow: 'rgba(56,189,248,0.4)' },
  driver: { h1: '#6ee7b7', h2: '#047857', glow: 'rgba(52,211,153,0.4)' },
  clock:  { h1: '#fdba74', h2: '#c2410c', glow: 'rgba(251,146,60,0.4)' },
  check:  { h1: '#c4b5fd', h2: '#5b21b6', glow: 'rgba(167,139,250,0.4)' },
};
function StatIcon3D({ type }: { type: StatIconType }) {
  const { h1, h2, glow } = STAT_HUES[type];
  const p = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: '#fff', strokeWidth: 1.9, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const svgs: Record<StatIconType, ReactNode> = {
    box:    <svg {...p}><path d="M16.5 9.4 7.55 4.24"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>,
    driver: <svg {...p}><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>,
    clock:  <svg {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    check:  <svg {...p}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  };
  return <Icon3D size={32} hue1={h1} hue2={h2} glow={glow} radius={10}>{svgs[type]}</Icon3D>;
}

// ══════════════════════════════════════════════════════════════════════
// WELCOME
// ══════════════════════════════════════════════════════════════════════
export function Welcome() {
  const navigate  = useNavigate();
  const { lang, setLang } = useLanguage();
  const [selectedLang, setSelectedLang] = useState<LangCode>(lang);
  const [mounted, setMounted]   = useState(false);
  const [liveStats, setLiveStats] = useState<{ drivers: number; cities: number; satisfied: number } | null>(null);

  useEffect(() => {
    setMounted(true);
    getPublicStats().then(s => setLiveStats(s)).catch(() => {});
  }, []);

  const handleLang = (code: LangCode) => { setSelectedLang(code); setLang(code); };

  if (!mounted) return null;

  const statsStrip = [
    { target: liveStats?.drivers  ?? 3400, suffix: liveStats ? '' : '+', label: 'Водителей', color: C.blueLight },
    { target: liveStats?.cities   ?? 12,   suffix: '',                    label: 'Городов',   color: C.purple },
    { target: liveStats?.satisfied ?? 98,  suffix: '%',                   label: 'Довольных', color: C.green },
  ];

  const bottomStats: { icon: StatIconType; val: number; suffix: string; label: string; color: string }[] = [
    { icon: 'box',    val: 128, suffix: '',      label: 'Грузов онлайн',      color: C.blueLight },
    { icon: 'driver', val: 43,  suffix: '',      label: 'Водителей онлайн',   color: C.green },
    { icon: 'clock',  val: 12,  suffix: ' мин',  label: 'Очередь на границе', color: C.orange },
    { icon: 'check',  val: 98,  suffix: '%',     label: 'Доставка в срок',    color: C.purple },
  ];

  return (
    <div className="ovora-app">
      <MapBackground />

      <div className="ovora-screen" style={{ position: 'relative', zIndex: 2 }}>

        {/* ── HEADER ── */}
        <motion.div className="ovora-area-header"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 18px 0' }}
          initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <Logo />
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.3px', lineHeight: 1.05 }}>Ovora</div>
              <div style={{ fontSize: 9, color: C.dim2, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 2 }}>Logistics & Air Cargo</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 11px', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.25)', borderRadius: 20 }}>
            <LiveDot />
            <span style={{ fontSize: 10, fontWeight: 700, color: C.green, letterSpacing: '0.08em' }}>ОНЛАЙН</span>
          </div>
        </motion.div>

        {/* ── HERO ── */}
        <motion.div className="ovora-area-hero"
          style={{ padding: '18px 18px 0' }}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5 }}
        >
          <Eyebrow label="Выберите направление" />
          <h1 style={{ fontSize: 44, fontWeight: 900, lineHeight: 1.02, letterSpacing: '-1.8px', color: '#fff', margin: '0 0 8px' }}>
            Платформа<br />
            <span style={{ background: 'linear-gradient(95deg, #2176e8 0%, #5ba3f5 45%, #38bdf8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Ovora
            </span>
          </h1>
          <p className="ovora-hide-mobile" style={{ fontSize: 13, color: C.dim, lineHeight: 1.55, margin: 0, maxWidth: 300 }}>
            Грузоперевозки и авиадоставка между Россией, Таджикистаном и&nbsp;СНГ.
          </p>

        </motion.div>

        {/* ── LANGUAGE ── */}
        <motion.div className="ovora-area-lang"
          style={{ padding: '18px 18px 0' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.4 }}
        >
          <div style={{ fontSize: 9, fontWeight: 700, color: C.dim3, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Язык интерфейса</div>
          <div style={{ display: 'flex', gap: 7 }}>
            {LANGS.map(l => {
              const active = selectedLang === l.code;
              return (
                <button key={l.code} onClick={() => handleLang(l.code)} style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '10px 4px', borderRadius: 12,
                  border: active ? '1px solid rgba(91,163,245,0.5)' : '1px solid rgba(255,255,255,0.06)',
                  background: active ? 'rgba(33,118,232,0.13)' : 'rgba(255,255,255,0.03)',
                  color: active ? '#e8f0ff' : C.dim3,
                  fontSize: 12, fontWeight: 700, letterSpacing: '0.04em',
                  cursor: 'pointer', fontFamily: 'inherit', position: 'relative', overflow: 'hidden',
                }}>
                  {active && <span style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at top, rgba(91,163,245,0.18), transparent 70%)' }} />}
                  <span style={{ fontSize: 16, position: 'relative' }}>{l.flag}</span>
                  <span style={{ position: 'relative' }}>{l.display}</span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* ── CITY ROUTE ── */}
        <motion.div className="ovora-area-route"
          style={{ padding: '12px 18px 0' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25, duration: 0.4 }}
        >
          <svg width="100%" height="22" viewBox="0 0 360 22" preserveAspectRatio="none" style={{ display: 'block' }}>
            <path d="M20 14 Q 100 -2 180 14 T 340 14" stroke={C.blueLight} strokeWidth="1.2" fill="none" strokeDasharray="2 3" opacity="0.55" style={{ animation: 'dashMove 5s linear infinite' }} />
            <circle cx="20"  cy="14" r="4" fill={C.blueLight} />
            <circle cx="180" cy="14" r="4" fill={C.blueLight} />
            <circle cx="340" cy="14" r="4" fill={C.blueLight} />
          </svg>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.dim2, marginTop: 4, padding: '0 4px', fontWeight: 500 }}>
            <span>Москва</span><span>Казань</span><span>Екатеринбург</span>
          </div>
        </motion.div>

        {/* ── CARDS ── */}
        <motion.div className="ovora-area-cards"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.45 }}
        >
          <div className="ovora-cards-grid" style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '14px 18px 0' }}>
            <WorldCard
              title="AVIA"
              desc="Авиагруз  Россия ↔ Таджикистан"
              icon={<PlaneBig />}
              accent="#0369a1" accentLight={C.cyan}
              onClick={() => navigate('/avia')}
              tags={[
                { icon: Ti.plane, label: 'Курьер' },
                { icon: Ti.mail,  label: 'Отправитель' },
                { icon: Ti.flex,  label: 'Гибкие роли' },
              ]}
            />
            <WorldCard
              title="CARGO"
              desc="Грузоперевозки  Россия · Таджикистан · СНГ"
              icon={<TruckBig />}
              accent="#1d4ed8" accentLight={C.blueLight}
              onClick={() => navigate('/role-select')}
              tags={[
                { icon: Ti.border, label: 'Границы' },
                { icon: Ti.driver, label: 'Водители' },
                { icon: Ti.box,    label: 'Грузы' },
                { icon: Ti.radio,  label: 'Рация' },
              ]}
            />
          </div>
        </motion.div>

        {/* ── PARTNERS ── */}
        <motion.div className="ovora-area-partners"
          style={{ padding: '16px 18px 0' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.38, duration: 0.4 }}
        >
          <div style={{ background: 'rgba(13,20,40,0.7)', border: `1px solid ${C.cardLine}`, borderRadius: 18, padding: '14px 14px 12px', backdropFilter: 'blur(10px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>Наши партнёры</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: C.blueLight, fontWeight: 600 }}>
                Смотреть все
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.blueLight} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 6 }}>
              {PARTNERS.map((p, i) => (
                <div key={i} style={{ width: 82, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 82, height: 64, borderRadius: 12, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.08)', position: 'relative', overflow: 'hidden', boxShadow: '0 4px 14px rgba(0,0,0,0.35)' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: p.color, letterSpacing: -0.5 }}>{p.mark}</div>
                    <div style={{ position: 'absolute', bottom: 5, right: 7, width: 16, height: 3, borderRadius: 2, background: p.color, opacity: 0.55 }} />
                  </div>
                  <div style={{ textAlign: 'center', lineHeight: 1.2 }}>
                    <div style={{ fontSize: 11, fontWeight: 700 }}>{p.name}</div>
                    <div style={{ fontSize: 9, color: C.dim2, marginTop: 1 }}>{p.sub}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 5, marginTop: 6 }}>
              {[1, 0, 0, 0, 0].map((a, i) => (
                <span key={i} style={{ width: a ? 14 : 5, height: 5, borderRadius: 99, background: a ? C.blueLight : 'rgba(255,255,255,0.18)' }} />
              ))}
            </div>
          </div>
        </motion.div>


      </div>
    </div>
  );
}
