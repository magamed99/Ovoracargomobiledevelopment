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
  { name: 'DP World',       sub: 'Global Logistics', mark: 'DP',  color: '#005eb8', bg: '#e8f0fb' },
  { name: 'Maersk',         sub: 'Ocean Shipping',   mark: 'MAE', color: '#42b0d5', bg: '#e8f6fb' },
  { name: 'DHL',            sub: 'Supply Chain',     mark: 'DHL', color: '#FFCC00', bg: '#fff8e1', textColor: '#D40511' },
  { name: 'Turkish Cargo',  sub: 'Air Freight',      mark: 'TC',  color: '#e01a22', bg: '#fdecea' },
  { name: 'Schenker',       sub: 'Logistics',        mark: 'DB',  color: '#ec0016', bg: '#fdecea' },
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
    <div style={{ width: 'clamp(90px,26vw,115px)', height: 'clamp(80px,22vw,100px)', borderRadius: 14, flexShrink: 0, overflow: 'hidden', background: 'rgba(0,8,24,0.85)', boxShadow: '0 0 0 1px rgba(91,163,245,0.15)' }}>
      <img src="/icons/cargo-truck.png" alt="CARGO"
        style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
      />
    </div>
  );
}

// ── Avia plane photo ──────────────────────────────────────────────────
function PlaneBig() {
  return (
    <div style={{ width: 'clamp(90px,26vw,115px)', height: 'clamp(80px,22vw,100px)', borderRadius: 14, flexShrink: 0, overflow: 'hidden', background: 'rgba(0,8,24,0.85)', boxShadow: '0 0 0 1px rgba(91,163,245,0.15)' }}>
      <img src="/icons/avia-plane.png" alt="AVIA"
        style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
      />
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────────────────
interface WorldCardProps {
  title: string;
  desc: string;
  tags: { icon: ReactNode; label: string; bg?: string }[];
  accentLight: string;
  icon: ReactNode;
  onClick: () => void;
}
function WorldCard({ title, desc, tags, accentLight, icon, onClick }: WorldCardProps) {
  return (
    <button onClick={onClick} style={{
      background: 'rgba(10,16,36,0.95)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 16, padding: 0, width: '100%', cursor: 'pointer',
      textAlign: 'left', fontFamily: 'inherit',
      boxShadow: '0 2px 16px rgba(0,0,0,0.45)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px,2.5vw,13px)', padding: 'clamp(10px,3vw,14px) clamp(10px,3vw,14px) clamp(7px,2vw,9px)' }}>
        {icon}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
            <span style={{ fontSize: 'clamp(15px,4.5vw,18px)', fontWeight: 800, color: '#fff', letterSpacing: '-0.2px' }}>{title}</span>
            <span style={{ fontSize: 'clamp(8px,2.2vw,9px)', fontWeight: 700, color: C.green, padding: '2px 6px', borderRadius: 7, background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.28)', letterSpacing: '0.05em', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
              <LiveDot size={4} /> LIVE
            </span>
          </div>
          <p style={{ fontSize: 'clamp(9px,2.8vw,11px)', color: 'rgba(155,170,210,0.85)', lineHeight: 1.4, margin: 0 }}>{desc}</p>
        </div>
        <ArrowRight color={accentLight} />
      </div>
      <div style={{ display: 'flex', gap: 'clamp(4px,1.5vw,6px)', flexWrap: 'wrap', padding: '0 clamp(10px,3vw,13px) clamp(10px,3vw,13px)' }}>
        {tags.map((t, i) => (
          <span key={i} style={{
            fontSize: 'clamp(9px,2.5vw,10px)', fontWeight: 600,
            color: '#fff',
            padding: 'clamp(3px,1vw,4px) clamp(7px,2vw,9px)', borderRadius: 7,
            background: t.bg ?? 'rgba(255,255,255,0.07)',
            border: t.bg ? 'none' : '1px solid rgba(255,255,255,0.08)',
            display: 'inline-flex', alignItems: 'center', gap: 4,
          }}>
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

        {/* ── HEADER + HERO → promo photo ── */}
        <motion.div className="ovora-area-header"
          style={{ position: 'relative', margin: '6px 12px 0', borderRadius: 18, overflow: 'hidden', boxShadow: '0 0 0 1px rgba(91,163,245,0.2), 0 10px 32px rgba(0,0,0,0.5)' }}
          initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}
        >
          <img src="/icons/hero-promo.png" alt="Ovora Cargo" style={{ width: '100%', display: 'block', objectFit: 'cover' }} />
        </motion.div>

        {/* ── HERO placeholder (keeps grid area) ── */}
        <div className="ovora-area-hero" />

        {/* ── LANGUAGE ── */}
        <motion.div className="ovora-area-lang"
          style={{ padding: 'clamp(8px,2.5vw,14px) clamp(12px,4vw,18px) 0' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.4 }}
        >
          <div style={{
            background: 'rgba(10,16,36,0.95)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16,
            padding: 'clamp(10px,3vw,14px)',
            boxShadow: '0 2px 16px rgba(0,0,0,0.45)',
          }}>
            <div style={{ fontSize: 'clamp(8px,2.2vw,10px)', fontWeight: 700, color: C.dim2, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Язык интерфейса</div>
            <div style={{ display: 'flex', gap: 'clamp(5px,1.8vw,8px)' }}>
              {LANGS.map(l => {
                const active = selectedLang === l.code;
                return (
                  <button key={l.code} onClick={() => handleLang(l.code)} style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: 'clamp(8px,2.5vw,12px) 4px', borderRadius: 10,
                    border: active ? '1px solid rgba(91,163,245,0.5)' : '1px solid rgba(255,255,255,0.08)',
                    background: active ? 'rgba(33,118,232,0.18)' : 'rgba(255,255,255,0.04)',
                    color: active ? '#e8f0ff' : C.dim,
                    fontSize: 'clamp(11px,3.2vw,13px)', fontWeight: 700, letterSpacing: '0.04em',
                    cursor: 'pointer', fontFamily: 'inherit', position: 'relative', overflow: 'hidden',
                    transition: 'all 0.18s ease',
                  }}>
                    {active && <span style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at top, rgba(91,163,245,0.22), transparent 70%)' }} />}
                    <span style={{ fontSize: 'clamp(15px,4.5vw,18px)', position: 'relative' }}>{l.flag}</span>
                    <span style={{ position: 'relative' }}>{l.display}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>


        {/* ── CARDS ── */}
        <motion.div className="ovora-area-cards"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.45 }}
        >
          <div className="ovora-cards-grid" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(8px,2.5vw,12px)', padding: 'clamp(10px,3vw,14px) clamp(12px,4vw,18px) 0' }}>
            <WorldCard
              title="CARGO"
              desc="Грузоперевозки  Россия · Таджикистан · СНГ"
              icon={<TruckBig />}
              accentLight={C.blueLight}
              onClick={() => navigate('/role-select')}
              tags={[
                { icon: Ti.border, label: 'Границы' },
                { icon: Ti.driver, label: 'Водители', bg: 'rgba(220,38,38,0.7)' },
                { icon: Ti.box,    label: 'Грузы',    bg: 'rgba(217,119,6,0.7)' },
                { icon: Ti.radio,  label: 'Рация' },
              ]}
            />
            <WorldCard
              title="AVIA"
              desc="Авиагруз  Россия ↔ Таджикистан"
              icon={<PlaneBig />}
              accentLight={C.cyan}
              onClick={() => navigate('/avia')}
              tags={[
                { icon: Ti.plane, label: 'Курьер' },
                { icon: Ti.mail,  label: 'Отправитель' },
                { icon: Ti.flex,  label: 'Гибкие роли' },
              ]}
            />
          </div>
        </motion.div>

        {/* ── PARTNERS ── */}
        <motion.div className="ovora-area-partners"
          style={{ padding: 'clamp(12px,3.5vw,16px) clamp(12px,4vw,18px) 0' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.38, duration: 0.4 }}
        >
          <div style={{ background: 'rgba(10,16,36,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: '14px 14px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>Наши партнёры</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: C.blueLight, fontWeight: 600 }}>
                Смотреть всех
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.blueLight} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
              </div>
            </div>
            {/* Horizontal carousel */}
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 2, WebkitOverflowScrolling: 'touch' as any }}>
              {PARTNERS.map((p, i) => (
                <div key={i} style={{
                  flexShrink: 0, width: 'clamp(86px,24vw,105px)',
                  background: '#fff', borderRadius: 14,
                  boxShadow: '0 2px 10px rgba(0,0,0,0.14)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  padding: 'clamp(9px,2.5vw,12px) clamp(6px,2vw,8px) clamp(8px,2.2vw,11px)', gap: 6,
                }}>
                  <div style={{
                    width: 'clamp(46px,13vw,58px)', height: 'clamp(38px,11vw,48px)', borderRadius: 9,
                    background: p.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: p.mark.length > 2 ? 'clamp(12px,3.5vw,15px)' : 'clamp(16px,5vw,20px)', fontWeight: 900, color: p.textColor ?? p.color, letterSpacing: -0.5 }}>{p.mark}</span>
                  </div>
                  <div style={{ textAlign: 'center', lineHeight: 1.25 }}>
                    <div style={{ fontSize: 'clamp(9px,2.8vw,11px)', fontWeight: 800, color: '#0f172a' }}>{p.name}</div>
                    <div style={{ fontSize: 'clamp(8px,2.2vw,9px)', color: '#64748b', marginTop: 2 }}>{p.sub}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 5, marginTop: 10 }}>
              {[1, 0, 0, 0, 0].map((a, i) => (
                <span key={i} style={{ width: a ? 16 : 5, height: 5, borderRadius: 99, background: a ? C.blueLight : 'rgba(255,255,255,0.18)' }} />
              ))}
            </div>
          </div>
        </motion.div>


      </div>
    </div>
  );
}
