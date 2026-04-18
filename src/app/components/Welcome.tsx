import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Truck, Plane, ArrowRight } from 'lucide-react';
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

/* ── Live dot ──────────────────────────────────────────────────────── */
function LiveDot() {
  return (
    <div style={{ position: 'relative', width: 8, height: 8, flexShrink: 0 }}>
      <motion.div
        style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#34d399', opacity: 0.4 }}
        animate={{ scale: [1, 2, 1], opacity: [0.4, 0, 0.4] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
      />
      <div style={{ position: 'absolute', inset: 1.5, borderRadius: '50%', background: '#34d399' }} />
    </div>
  );
}

/* ── Counter ───────────────────────────────────────────────────────── */
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

/* ══════════════════════════════════════════════════════════════════════
   WELCOME
   ══════════════════════════════════════════════════════════════════════ */
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

  const stats = [
    { value: liveStats?.drivers ?? 3400, suffix: liveStats ? '' : '+', label: 'Водителей', color: '#5ba3f5' },
    { value: liveStats?.cities ?? 12,    suffix: '',                    label: 'Городов',   color: '#a78bfa' },
    { value: liveStats?.satisfied ?? 98, suffix: '%',                   label: 'Довольных', color: '#34d399' },
  ];

  return (
    <div style={{
      position: 'relative', width: '100%', minHeight: '100dvh',
      overflow: 'hidden', background: '#060d18',
      fontFamily: "'Sora', 'Inter', sans-serif",
    }}>
      <MapBackground />

      {/* Vignettes */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 5, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 80% 60% at 50% 30%, transparent 30%, #060d18 100%)',
      }} />
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 5, pointerEvents: 'none',
        height: '60%',
        background: 'linear-gradient(to top, #060d18 45%, transparent 100%)',
      }} />

      {/* ══════ CONTENT ══════ */}
      <div className="wc-outer" style={{ position: 'relative', zIndex: 20 }}>

        {/* ── HEADER ── */}
        <motion.div
          className="wc-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 13,
              background: 'linear-gradient(135deg, #0f52b6 0%, #2176e8 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 0 1px #5ba3f54d, 0 8px 24px #1964c899',
              flexShrink: 0,
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3" width="15" height="13" rx="2"/>
                <path d="M16 8h4l3 5v4h-7V8z"/>
                <circle cx="5.5" cy="18.5" r="2.5"/>
                <circle cx="18.5" cy="18.5" r="2.5"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', letterSpacing: '-0.3px', lineHeight: 1.1 }}>
                Ovora
              </div>
              <div style={{ fontSize: 9, color: '#4a6080', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Logistics & Air Cargo
              </div>
            </div>
          </div>

          {/* Online badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '5px 11px',
            background: '#34d39914', border: '1px solid #34d39933',
            borderRadius: 20,
          }}>
            <LiveDot />
            <span style={{ fontSize: 10, fontWeight: 700, color: '#34d399', letterSpacing: '0.06em' }}>
              ОНЛАЙН
            </span>
          </div>

          {/* Lang selector — desktop header only */}
          <div className="wc-lang-header">
            {LANGS.map(l => {
              const isActive = selectedLang === l.code;
              return (
                <motion.button
                  key={l.code}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => handleLangSelect(l.code)}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                    padding: '8px 16px', borderRadius: 11,
                    border: isActive ? '1px solid #5ba3f560' : '1px solid #ffffff0f',
                    background: isActive ? '#2176e820' : '#ffffff08',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ fontSize: 16 }}>{l.flag}</span>
                  <span style={{
                    fontSize: 11, fontWeight: 700, letterSpacing: '0.04em',
                    color: isActive ? '#e8f0ff' : '#3d5268',
                  }}>
                    {l.label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* ── HERO ── */}
        <div className="wc-hero">
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}
          >
            <div style={{ width: 22, height: 2, background: '#1978e5', borderRadius: 1 }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: '#5ba3f5', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Выберите направление
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="wc-title"
            style={{ fontWeight: 900, lineHeight: 1.05, letterSpacing: '-1.5px', color: '#fff', margin: '0 0 6px' }}
          >
            Платформа
            <br />
            <span style={{
              background: 'linear-gradient(95deg, #2176e8 0%, #5ba3f5 45%, #38bdf8 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              Ovora
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="wc-desc"
            style={{ color: '#6b8299', lineHeight: 1.55, margin: '0 0 0', maxWidth: 380 }}
          >
            Грузоперевозки и авиадоставка между Россией, Таджикистаном и СНГ.
          </motion.p>

          {/* Stats — desktop only */}
          <motion.div
            className="wc-stats"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.5 }}
          >
            {stats.map((s, i) => (
              <div key={s.label} className="wc-stat-item" style={{ position: 'relative' }}>
                {i < stats.length - 1 && (
                  <div style={{
                    position: 'absolute', right: 0, top: '12%', height: '76%',
                    width: 1, background: '#ffffff0a', pointerEvents: 'none',
                  }} />
                )}
                <div style={{ fontSize: 20, fontWeight: 900, color: s.color, lineHeight: 1 }}>
                  <Counter target={s.value} suffix={s.suffix} />
                </div>
                <div style={{ fontSize: 10, color: '#4a6080', fontWeight: 600, letterSpacing: '0.05em', marginTop: 3 }}>
                  {s.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* ── LANGUAGE SELECTOR (above cards on mobile) ── */}
        <motion.div
          className="wc-lang"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          <div style={{ fontSize: 9, fontWeight: 700, color: '#3d5268', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 7 }}>
            Язык интерфейса
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {LANGS.map(l => {
              const isActive = selectedLang === l.code;
              return (
                <motion.button
                  key={l.code}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => handleLangSelect(l.code)}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                    padding: '8px 4px', borderRadius: 11,
                    border: isActive ? '1px solid #5ba3f560' : '1px solid #ffffff0f',
                    background: isActive ? '#2176e820' : '#ffffff08',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ fontSize: 16 }}>{l.flag}</span>
                  <span style={{
                    fontSize: 11, fontWeight: 700,
                    color: isActive ? '#e8f0ff' : '#3d5268',
                    letterSpacing: '0.04em',
                  }}>
                    {l.label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* ── WORLD CARDS ── */}
        <div className="wc-cards">
          {/* CARGO */}
          <motion.button
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/role-select')}
            className="wc-card"
            style={{
              background: 'linear-gradient(145deg, #0d1f3c 0%, #0a1628 100%)',
              border: '1px solid #1d4ed830',
            }}
          >
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, #3b82f680, transparent)' }} />
            <div className="wc-card-inner">
              <div style={{
                width: 48, height: 48, borderRadius: 15,
                background: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                boxShadow: '0 0 18px #3b82f633',
              }}>
                <Truck style={{ width: 24, height: 24, color: '#fff' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                  <span style={{ fontSize: 17, fontWeight: 800, color: '#fff', letterSpacing: '-0.3px' }}>CARGO</span>
                  <span style={{ fontSize: 9, fontWeight: 700, color: '#34d399', padding: '2px 7px', borderRadius: 9, background: '#34d39914', border: '1px solid #34d39930', letterSpacing: '0.06em' }}>LIVE</span>
                </div>
                <p style={{ fontSize: 11, color: '#6b8299', lineHeight: 1.45, margin: 0 }}>
                  Грузоперевозки Россия · Таджикистан · СНГ
                </p>
              </div>
              <ArrowRight style={{ width: 18, height: 18, color: '#3b82f6', flexShrink: 0 }} />
            </div>
            <div className="wc-card-tags">
              {['🛣️ Границы', '🚗 Водители', '📦 Грузы', '📡 Рация'].map(tag => (
                <span key={tag} style={{ fontSize: 10, fontWeight: 600, color: '#5ba3f5', padding: '3px 9px', borderRadius: 8, background: '#3b82f60d', border: '1px solid #3b82f620' }}>
                  {tag}
                </span>
              ))}
            </div>
          </motion.button>

          {/* AVIA */}
          <motion.button
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/avia')}
            className="wc-card"
            style={{
              background: 'linear-gradient(145deg, #0c1f2e 0%, #0a1420 100%)',
              border: '1px solid #0ea5e925',
            }}
          >
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, #0ea5e960, transparent)' }} />
            <div className="wc-card-inner">
              <div style={{
                width: 48, height: 48, borderRadius: 15,
                background: 'linear-gradient(135deg, #0369a1 0%, #0ea5e9 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                boxShadow: '0 0 18px #0ea5e933',
              }}>
                <Plane style={{ width: 24, height: 24, color: '#fff' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                  <span style={{ fontSize: 17, fontWeight: 800, color: '#fff', letterSpacing: '-0.3px' }}>AVIA</span>
                  <span style={{ fontSize: 9, fontWeight: 700, color: '#34d399', padding: '2px 7px', borderRadius: 9, background: '#34d39914', border: '1px solid #34d39930', letterSpacing: '0.06em' }}>LIVE</span>
                </div>
                <p style={{ fontSize: 11, color: '#6b8299', lineHeight: 1.45, margin: 0 }}>
                  Авиагруз Россия ↔ Таджикистан
                </p>
              </div>
              <ArrowRight style={{ width: 18, height: 18, color: '#0ea5e9', flexShrink: 0 }} />
            </div>
            <div className="wc-card-tags">
              {['✈️ Курьер', '📨 Отправитель', '🔄 Гибкие роли'].map(tag => (
                <span key={tag} style={{ fontSize: 10, fontWeight: 600, color: '#38bdf8', padding: '3px 9px', borderRadius: 8, background: '#0ea5e90d', border: '1px solid #0ea5e920' }}>
                  {tag}
                </span>
              ))}
            </div>
          </motion.button>
        </div>

        {/* ── FOOTER spacer ── */}
        <div className="wc-footer-space" />

      </div>

      <style>{`
        /* ═══════ BASE (mobile-first) ═══════ */
        .wc-outer {
          display: flex;
          flex-direction: column;
          min-height: 100dvh;
          width: 100%;
          box-sizing: border-box;
        }

        .wc-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: max(14px, env(safe-area-inset-top, 14px)) 18px 0;
          flex-shrink: 0;
        }

        .wc-hero {
          padding: 18px 18px 0;
          flex-shrink: 0;
        }

        .wc-title {
          font-size: clamp(28px, 9vw, 40px);
        }

        .wc-desc {
          font-size: clamp(12px, 3.5vw, 14px);
        }

        .wc-stats {
          display: none;
        }

        .wc-stat-item {
          flex: 1;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 12px 8px;
        }

        /* Language selector — shown above cards on mobile */
        .wc-lang {
          padding: 14px 18px 0;
          flex-shrink: 0;
        }

        .wc-cards {
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 12px 18px 0;
          flex: 1;
        }

        .wc-card {
          border-radius: 20px;
          padding: 0;
          cursor: pointer;
          overflow: hidden;
          text-align: left;
          position: relative;
          width: 100%;
        }

        .wc-card-inner {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 14px 10px;
        }

        .wc-card-tags {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          padding: 0 14px 14px;
        }

        .wc-footer-space {
          height: max(16px, env(safe-area-inset-bottom, 16px));
          flex-shrink: 0;
        }

        /* ── SMALL PHONES (≤ 360px) ── */
        @media (max-width: 360px) {
          .wc-title  { font-size: 26px; }
          .wc-desc   { font-size: 11px; }
          .wc-header { padding-top: max(12px, env(safe-area-inset-top, 12px)); }
          .wc-hero   { padding-top: 12px; }
          .wc-lang   { padding-top: 10px; }
          .wc-cards  { padding-top: 8px; gap: 8px; }
          .wc-card-inner { padding: 12px 12px 8px; gap: 10px; }
          .wc-card-tags  { padding: 0 12px 12px; gap: 5px; }
        }

        /* ── COMPACT HEIGHT (landscape phones) ── */
        @media (max-height: 600px) {
          .wc-hero  { padding-top: 10px; }
          .wc-lang  { padding-top: 8px; }
          .wc-cards { padding-top: 8px; gap: 7px; }
          .wc-title { font-size: 24px; letter-spacing: -1px; }
          .wc-desc  { display: none; }
          .wc-card-inner { padding: 11px 12px 8px; }
          .wc-card-tags  { padding: 0 12px 11px; }
        }

        /* Lang in header — hidden on mobile */
        .wc-lang-header {
          display: none;
        }

        /* ── TABLET / DESKTOP (≥ 700px) ── */
        @media (min-width: 700px) {
          .wc-outer {
            max-width: 1200px;
            margin: 0 auto;
            flex-direction: row;
            flex-wrap: wrap;
            align-content: center;
            justify-content: center;
            padding: clamp(24px, 4vw, 40px) clamp(28px, 4vw, 56px);
            min-height: 100dvh;
          }

          .wc-header {
            width: 100%;
            padding: 0 0 clamp(20px, 4vh, 36px);
          }

          .wc-hero {
            flex: 1;
            min-width: 0;
            padding: 0 clamp(20px, 3vw, 40px) 0 0;
            display: flex;
            flex-direction: column;
            justify-content: center;
          }

          .wc-title {
            font-size: clamp(36px, 4.5vw, 58px);
          }

          .wc-desc {
            font-size: 14px;
            display: block !important;
          }

          .wc-stats {
            display: flex;
            gap: 0;
            margin-top: 24px;
            border: 1px solid #ffffff12;
            border-radius: 16px;
            overflow: hidden;
            backdrop-filter: blur(20px);
            background: #ffffff08;
            max-width: 360px;
          }

          /* Lang selector hidden on desktop (shown in header instead) */
          .wc-lang {
            display: none;
          }

          /* Lang in header — shown on desktop, same style as mobile buttons */
          .wc-lang-header {
            display: flex;
            align-items: center;
            gap: 6px;
            width: 200px;
            flex-shrink: 0;
          }

          .wc-cards {
            width: clamp(300px, 34vw, 420px);
            flex-shrink: 0;
            flex: none;
            padding: 0;
            justify-content: center;
          }

          .wc-card-inner { padding: 18px 18px 12px; gap: 14px; }
          .wc-card-tags  { padding: 0 18px 18px; }

          .wc-footer-space {
            width: 100%;
            order: 4;
            height: clamp(16px, 3vh, 28px);
          }
        }

        /* ── LARGE DESKTOP (≥ 1200px) ── */
        @media (min-width: 1200px) {
          .wc-outer  { max-width: 1360px; }
          .wc-title  { font-size: 62px; }
          .wc-cards  { width: 450px; }
        }
      `}</style>
    </div>
  );
}
