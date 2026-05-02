import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Truck, Plane, ArrowRight, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import type { LangCode } from '../i18n/translations';
import { MapBackground } from './MapBackground';
import { getPublicStats } from '../api/dataApi';

const LANGS: { code: LangCode; flag: string; label: string }[] = [
  { code: 'ru', flag: '🇷🇺', label: 'RU' },
  { code: 'tj', flag: '🇹🇯', label: 'TJ' },
  { code: 'en', flag: '🇺🇸', label: 'EN' },
];

const PARTNERS = [
  { name: 'DP WORLD',       sub: 'Global Logistics',  emoji: '🌐', color: '#e8501a' },
  { name: 'MAERSK',         sub: 'Ocean Shipping',    emoji: '⚓', color: '#00243d' },
  { name: 'DHL Supply',     sub: 'Chain',              emoji: '📦', color: '#fc0' },
  { name: 'Turkish Cargo',  sub: 'Air Freight',        emoji: '✈️', color: '#e81932' },
  { name: 'DB Schenker',    sub: 'Logistics',          emoji: '🚂', color: '#ec0016' },
  { name: 'Walmart',        sub: 'Global Trade',       emoji: '🛒', color: '#0071ce' },
];

/* ── Live dot ──────────────────────────────────────────────────── */
function LiveDot({ color = '#34d399' }: { color?: string }) {
  return (
    <div style={{ position: 'relative', width: 8, height: 8, flexShrink: 0 }}>
      <motion.div
        style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: color, opacity: 0.4 }}
        animate={{ scale: [1, 2.2, 1], opacity: [0.4, 0, 0.4] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
      />
      <div style={{ position: 'absolute', inset: 1.5, borderRadius: '50%', background: color }} />
    </div>
  );
}

/* ── Animated counter ──────────────────────────────────────────── */
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
      const eased = 1 - Math.pow(1 - step / steps, 3);
      setCount(Math.round(eased * target));
      if (step >= steps) clearInterval(timer);
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [target]);
  return <>{count.toLocaleString('ru-RU')}{suffix}</>;
}

/* ══════════════════════════════════════════════════════════════════
   WELCOME
   ══════════════════════════════════════════════════════════════════ */
export function Welcome() {
  const navigate = useNavigate();
  const { lang, setLang } = useLanguage();
  const [selectedLang, setSelectedLang] = useState<LangCode>(lang);
  const [mounted, setMounted] = useState(false);
  const [liveStats, setLiveStats] = useState<{ drivers: number; cities: number; satisfied: number } | null>(null);

  useEffect(() => {
    setMounted(true);
    getPublicStats().then(s => setLiveStats(s)).catch(() => {});
  }, []);

  const handleLangSelect = (code: LangCode) => { setSelectedLang(code); setLang(code); };

  if (!mounted) return null;

  const bottomStats = [
    { value: liveStats?.drivers ?? 128, suffix: '',   label: 'Грузов\nонлайн',       color: '#5ba3f5',  icon: '📦' },
    { value: liveStats?.drivers ?? 43,  suffix: '',   label: 'Водителей\nонлайн',     color: '#34d399',  icon: '🚗' },
    { value: 12,                        suffix: ' мин', label: 'Время на\nгранице',   color: '#a78bfa',  icon: '⏱' },
    { value: 98,                        suffix: '%',  label: 'Доставка\nв срок',       color: '#fbbf24',  icon: '✅' },
  ];

  return (
    <div style={{
      position: 'relative', width: '100%', minHeight: '100dvh',
      background: '#060d18', fontFamily: "'Sora', 'Inter', sans-serif",
      overflowX: 'hidden',
    }}>
      {/* Map background — subtle, behind everything */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, opacity: 0.4 }}>
        <MapBackground />
      </div>
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 100% 50% at 50% 0%, transparent 20%, #060d18 80%)',
      }} />

      {/* ══ CONTENT ══ */}
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>

        {/* ── HEADER ── */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: 'max(14px, env(safe-area-inset-top, 14px)) 16px 12px',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            background: 'rgba(6,13,24,0.7)', backdropFilter: 'blur(16px)',
            position: 'sticky', top: 0, zIndex: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 13,
              background: 'linear-gradient(135deg, #0f52b6, #2176e8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 0 1px #5ba3f54d, 0 6px 20px #1964c880',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3" width="15" height="13" rx="2"/>
                <path d="M16 8h4l3 5v4h-7V8z"/>
                <circle cx="5.5" cy="18.5" r="2.5"/>
                <circle cx="18.5" cy="18.5" r="2.5"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 900, color: '#fff', letterSpacing: '-0.2px', lineHeight: 1.1 }}>
                OVORA <span style={{ color: '#5ba3f5' }}>CARGO</span>
              </div>
              <div style={{ fontSize: 9, color: '#3d5570', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Logistics & Air Cargo
              </div>
            </div>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '5px 12px', borderRadius: 20,
            background: '#34d39914', border: '1px solid #34d39933',
          }}>
            <LiveDot />
            <span style={{ fontSize: 10, fontWeight: 700, color: '#34d399', letterSpacing: '0.08em' }}>ОНЛАЙН</span>
          </div>
        </motion.div>

        {/* ── SERVICE CARDS ── */}
        <div style={{ padding: '14px 14px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* AVIA — first */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/avia')}
            style={{
              width: '100%', textAlign: 'left', cursor: 'pointer',
              borderRadius: 20, padding: 0, overflow: 'hidden',
              background: 'linear-gradient(145deg, #0c1f30 0%, #091520 100%)',
              border: '1px solid rgba(14,165,233,0.2)',
              position: 'relative',
            }}
          >
            {/* top shimmer */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, #0ea5e970, transparent)' }} />
            {/* glow */}
            <div style={{ position: 'absolute', top: -30, right: -30, width: 130, height: 130, borderRadius: '50%', background: 'radial-gradient(circle, rgba(14,165,233,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 14px 10px' }}>
              <div style={{
                width: 48, height: 48, borderRadius: 15, flexShrink: 0,
                background: 'linear-gradient(135deg, #0369a1, #0ea5e9)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(14,165,233,0.3)',
              }}>
                <Plane style={{ width: 23, height: 23, color: '#fff' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                  <span style={{ fontSize: 17, fontWeight: 900, color: '#fff', letterSpacing: '-0.3px' }}>AVIA</span>
                  <span style={{ fontSize: 9, fontWeight: 700, color: '#34d399', padding: '2px 7px', borderRadius: 8, background: '#34d39914', border: '1px solid #34d39930', letterSpacing: '0.06em' }}>LIVE</span>
                </div>
                <p style={{ fontSize: 11, color: '#5c8aaa', margin: 0, lineHeight: 1.4 }}>Авиагруз Россия → Таджикистан</p>
              </div>
              <div style={{ width: 30, height: 30, borderRadius: 10, background: 'rgba(14,165,233,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ArrowRight style={{ width: 16, height: 16, color: '#0ea5e9' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: '0 14px 14px' }}>
              {['✈️ Курьер', '📨 Отправитель', '🔄 Гибкие роли'].map(tag => (
                <span key={tag} style={{ fontSize: 10, fontWeight: 600, color: '#38bdf8', padding: '3px 9px', borderRadius: 8, background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.15)' }}>
                  {tag}
                </span>
              ))}
            </div>
          </motion.button>

          {/* CARGO — second */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/role-select')}
            style={{
              width: '100%', textAlign: 'left', cursor: 'pointer',
              borderRadius: 20, padding: 0, overflow: 'hidden',
              background: 'linear-gradient(145deg, #0d1f3c 0%, #0a1628 100%)',
              border: '1px solid rgba(59,130,246,0.2)',
              position: 'relative',
            }}
          >
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, #3b82f670, transparent)' }} />
            <div style={{ position: 'absolute', top: -30, right: -30, width: 130, height: 130, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 14px 10px' }}>
              <div style={{
                width: 48, height: 48, borderRadius: 15, flexShrink: 0,
                background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(59,130,246,0.3)',
              }}>
                <Truck style={{ width: 23, height: 23, color: '#fff' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                  <span style={{ fontSize: 17, fontWeight: 900, color: '#fff', letterSpacing: '-0.3px' }}>CARGO</span>
                  <span style={{ fontSize: 9, fontWeight: 700, color: '#34d399', padding: '2px 7px', borderRadius: 8, background: '#34d39914', border: '1px solid #34d39930', letterSpacing: '0.06em' }}>LIVE</span>
                </div>
                <p style={{ fontSize: 11, color: '#5c7eaa', margin: 0, lineHeight: 1.4 }}>Грузоперевозки Россия · Таджикистан · СНГ</p>
              </div>
              <div style={{ width: 30, height: 30, borderRadius: 10, background: 'rgba(59,130,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ArrowRight style={{ width: 16, height: 16, color: '#3b82f6' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: '0 14px 14px' }}>
              {['🛣️ Границы', '🚗 Водители', '📦 Грузы', '📡 Рация'].map(tag => (
                <span key={tag} style={{ fontSize: 10, fontWeight: 600, color: '#5ba3f5', padding: '3px 9px', borderRadius: 8, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>
                  {tag}
                </span>
              ))}
            </div>
          </motion.button>
        </div>

        {/* ── HERO SECTION (below cards) ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: 'relative', margin: '14px 14px 0', borderRadius: 22, overflow: 'hidden',
            background: 'linear-gradient(160deg, #0a1f3d 0%, #060d18 60%)',
            border: '1px solid rgba(91,163,245,0.1)',
            minHeight: 160,
          }}
        >
          {/* Background glow */}
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 70% 50%, rgba(25,120,229,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

          {/* Truck illustration */}
          <div style={{
            position: 'absolute', right: -8, bottom: -4,
            fontSize: 90, opacity: 0.18, lineHeight: 1,
            filter: 'blur(1px)',
            userSelect: 'none', pointerEvents: 'none',
          }}>
            🚛
          </div>
          {/* Second truck layer for depth */}
          <div style={{
            position: 'absolute', right: 10, bottom: 10,
            fontSize: 64, opacity: 0.12, lineHeight: 1,
            filter: 'blur(0px)',
            userSelect: 'none', pointerEvents: 'none',
          }}>
            🚛
          </div>

          <div style={{ position: 'relative', padding: '20px 18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <div style={{ width: 18, height: 2, background: '#1978e5', borderRadius: 1 }} />
              <span style={{ fontSize: 9, fontWeight: 700, color: '#5ba3f5', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                Платформа
              </span>
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 900, color: '#fff', margin: '0 0 6px', letterSpacing: '-0.5px', lineHeight: 1.05 }}>
              Платформа<br />
              <span style={{ background: 'linear-gradient(95deg, #2176e8, #5ba3f5, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Ovora
              </span>
            </h1>
            <p style={{ fontSize: 12, color: '#4a6a8a', lineHeight: 1.5, margin: 0, maxWidth: 200 }}>
              Грузоперевозки и авиадоставка между Россией, Таджикистаном и СНГ.
            </p>
          </div>
        </motion.div>

        {/* ── LANGUAGE SELECTOR ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.36, duration: 0.4 }}
          style={{ padding: '14px 14px 0' }}
        >
          <div style={{ fontSize: 9, fontWeight: 700, color: '#2e4560', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>
            Язык интерфейса
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {LANGS.map(l => {
              const isActive = selectedLang === l.code;
              return (
                <motion.button
                  key={l.code}
                  whileTap={{ scale: 0.93 }}
                  onClick={() => handleLangSelect(l.code)}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '10px 4px', borderRadius: 13, cursor: 'pointer',
                    border: isActive ? '1px solid rgba(91,163,245,0.45)' : '1px solid rgba(255,255,255,0.06)',
                    background: isActive ? 'rgba(33,118,232,0.15)' : 'rgba(255,255,255,0.04)',
                    transition: 'all 0.2s',
                  }}
                >
                  <span style={{ fontSize: 17 }}>{l.flag}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: isActive ? '#c8deff' : '#2e4560', letterSpacing: '0.04em' }}>
                    {l.label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* ── PARTNERS ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.44, duration: 0.5 }}
          style={{ paddingTop: 18 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px 10px' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', letterSpacing: '-0.2px' }}>Наши партнёры</span>
            <span style={{ fontSize: 11, color: '#2e4560', display: 'flex', alignItems: 'center', gap: 2 }}>
              Смотреть все <ChevronRight size={12} />
            </span>
          </div>
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '0 14px 4px', scrollbarWidth: 'none' }}>
            {PARTNERS.map(p => (
              <div key={p.name} style={{
                flexShrink: 0, width: 88, height: 72,
                borderRadius: 16,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
                cursor: 'pointer',
              }}>
                <span style={{ fontSize: 22 }}>{p.emoji}</span>
                <span style={{ fontSize: 8, fontWeight: 700, color: '#3d5570', textAlign: 'center', lineHeight: 1.2, letterSpacing: '0.04em' }}>
                  {p.name}
                </span>
              </div>
            ))}
          </div>
          {/* scroll dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 4, paddingTop: 8 }}>
            {[0,1,2].map(i => (
              <div key={i} style={{ width: i===0?14:5, height: 5, borderRadius: 4, background: i===0?'#1978e5':'rgba(255,255,255,0.1)' }} />
            ))}
          </div>
        </motion.div>

        {/* ── STATS STRIP ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.52, duration: 0.5 }}
          style={{
            margin: '14px 14px',
            borderRadius: 18,
            background: 'linear-gradient(135deg, rgba(25,120,229,0.08) 0%, rgba(6,13,24,0.9) 100%)',
            border: '1px solid rgba(25,120,229,0.12)',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr 1fr',
          }}
        >
          {bottomStats.map((s, i) => (
            <div key={s.label} style={{
              padding: '14px 6px',
              textAlign: 'center',
              borderRight: i < 3 ? '1px solid rgba(255,255,255,0.06)' : 'none',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: s.color, lineHeight: 1, letterSpacing: '-0.5px' }}>
                <Counter target={s.value} suffix={s.suffix} />
              </div>
              <div style={{ fontSize: 8.5, color: '#2e4a6a', fontWeight: 600, textAlign: 'center', lineHeight: 1.3, whiteSpace: 'pre-line', letterSpacing: '0.03em' }}>
                {s.label}
              </div>
            </div>
          ))}
        </motion.div>

        <div style={{ height: 'max(16px, env(safe-area-inset-bottom, 16px))', flexShrink: 0 }} />
      </div>
    </div>
  );
}
