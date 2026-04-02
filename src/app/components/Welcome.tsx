import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Truck, Plane, ChevronRight, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import type { LangCode } from '../i18n/translations';
import { MapBackground } from './MapBackground';
import { getPublicAds, getPublicStats } from '../api/dataApi';

const LANGS: { code: LangCode; flag: string; label: string }[] = [
  { code: 'ru', flag: '\u{1F1F7}\u{1F1FA}', label: 'RU' },
  { code: 'tj', flag: '\u{1F1F9}\u{1F1EF}', label: 'TJ' },
  { code: 'en', flag: '\u{1F1FA}\u{1F1F8}', label: 'EN' },
];

/* ── Ad banner carousel ────────────────────────────────────────────── */
function AdCarousel({ ads }: { ads: any[] }) {
  const [idx, setIdx] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (ads.length <= 1) return;
    timerRef.current = setInterval(() => setIdx(p => (p + 1) % ads.length), 5000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [ads.length]);

  if (!ads.length) return null;
  const ad = ads[idx % ads.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.9, duration: 0.5 }}
      style={{ width: '100%' }}
    >
      <a
        href={ad.url && ad.url !== '#' ? ad.url : undefined}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'block',
          borderRadius: 16,
          overflow: 'hidden',
          border: '1px solid #ffffff12',
          background: '#ffffff08',
          textDecoration: 'none',
          position: 'relative',
          cursor: ad.url && ad.url !== '#' ? 'pointer' : 'default',
        }}
      >
        {/* Image background */}
        {ad.image && (
          <img
            src={ad.image}
            alt=""
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.25 }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        )}
        <div style={{
          position: 'relative', zIndex: 2,
          padding: '14px 16px',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              {ad.emoji && <span style={{ fontSize: 13 }}>{ad.emoji}</span>}
              {ad.badge && (
                <span style={{
                  fontSize: 9, fontWeight: 800, color: '#5ba3f5',
                  padding: '1px 7px', borderRadius: 8,
                  background: '#5ba3f514', border: '1px solid #5ba3f525',
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                }}>
                  {ad.badge}
                </span>
              )}
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#e0e8f0', lineHeight: 1.3 }}>
              {ad.title}
            </div>
            {ad.description && (
              <div style={{ fontSize: 11, color: '#6b8299', marginTop: 2 }}>{ad.description}</div>
            )}
          </div>
          {ad.url && ad.url !== '#' && (
            <ChevronRight style={{ width: 16, height: 16, color: '#3d5268', flexShrink: 0 }} />
          )}
        </div>
        {/* Dots */}
        {ads.length > 1 && (
          <div style={{
            display: 'flex', gap: 4, justifyContent: 'center',
            paddingBottom: 8,
            position: 'relative', zIndex: 2,
          }}>
            {ads.map((_, i) => (
              <div key={i} style={{
                width: i === idx % ads.length ? 16 : 5,
                height: 4, borderRadius: 3,
                background: i === idx % ads.length ? '#5ba3f5' : '#ffffff1a',
                transition: 'width 0.3s, background 0.3s',
              }} />
            ))}
          </div>
        )}
        {/* Ad label */}
        <div style={{
          position: 'absolute', top: 8, right: 8, zIndex: 3,
          fontSize: 8, fontWeight: 700, color: '#ffffff40',
          letterSpacing: '0.08em', textTransform: 'uppercase',
        }}>
          AD
        </div>
      </a>
    </motion.div>
  );
}

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
   WELCOME — единый портал двух миров
   ══════════════════════════════════════════════════════════════════════ */
export function Welcome() {
  const navigate = useNavigate();
  const { lang, setLang } = useLanguage();
  const [selectedLang, setSelectedLang] = useState<LangCode>(lang);
  const [mounted, setMounted] = useState(false);
  const [ads, setAds] = useState<any[]>([]);
  const [liveStats, setLiveStats] = useState<{ drivers: number; cities: number; satisfied: number } | null>(null);

  useEffect(() => {
    setMounted(true);
    getPublicAds('welcome').then(d => { if (d?.length) setAds(d); }).catch(() => {});
    getPublicStats().then(s => setLiveStats(s)).catch(() => {});
  }, []);

  const handleLangSelect = (code: LangCode) => { setSelectedLang(code); setLang(code); };

  if (!mounted) return null;

  const stats = [
    { value: liveStats?.drivers ?? 3400, suffix: liveStats ? '' : '+', label: 'Водителей', color: '#5ba3f5' },
    { value: liveStats?.cities ?? 12, suffix: '', label: 'Городов', color: '#a78bfa' },
    { value: liveStats?.satisfied ?? 98, suffix: '%', label: 'Довольных', color: '#34d399' },
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
      <div className="wc-portal-outer" style={{ position: 'relative', zIndex: 20 }}>

        {/* ── HEADER ── */}
        <motion.div
          className="wc-portal-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 13,
              background: 'linear-gradient(135deg, #0f52b6 0%, #2176e8 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 0 1px #5ba3f54d, 0 8px 24px #1964c899',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3" width="15" height="13" rx="2"/>
                <path d="M16 8h4l3 5v4h-7V8z"/>
                <circle cx="5.5" cy="18.5" r="2.5"/>
                <circle cx="18.5" cy="18.5" r="2.5"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#fff', letterSpacing: '-0.3px', lineHeight: 1.1 }}>
                Ovora
              </div>
              <div style={{ fontSize: 10, color: '#4a6080', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Logistics & Air Cargo
              </div>
            </div>
          </div>

          {/* Online badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 12px',
            background: '#34d39914', border: '1px solid #34d39933',
            borderRadius: 20,
          }}>
            <LiveDot />
            <span style={{ fontSize: 10, fontWeight: 700, color: '#34d399', letterSpacing: '0.06em' }}>
              {'\u041E\u041D\u041B\u0410\u0419\u041D'}
            </span>
          </div>
        </motion.div>

        {/* ── HERO ── */}
        <div className="wc-portal-hero">
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}
          >
            <div style={{ width: 24, height: 2, background: '#1978e5', borderRadius: 1 }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#5ba3f5', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              {'\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043D\u0430\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435'}
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="wc-portal-title"
            style={{
              fontWeight: 900, lineHeight: 1.05, letterSpacing: '-1.5px',
              color: '#fff', margin: '0 0 6px',
            }}
          >
            {'\u041F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u0430'}
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
            style={{ fontSize: 14, color: '#6b8299', lineHeight: 1.6, margin: '0 0 24px', maxWidth: 380 }}
          >
            {'\u0413\u0440\u0443\u0437\u043E\u043F\u0435\u0440\u0435\u0432\u043E\u0437\u043A\u0438 \u0438 \u0430\u0432\u0438\u0430\u0434\u043E\u0441\u0442\u0430\u0432\u043A\u0430 \u043C\u0435\u0436\u0434\u0443 \u0420\u043E\u0441\u0441\u0438\u0439, \u0422\u0430\u0434\u0436\u0438\u043A\u0438\u0441\u0442\u0430\u043D\u043E\u043C \u0438 \u0421\u041D\u0413. \u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0441\u0432\u043E\u0439 \u043C\u043E\u0434\u0443\u043B\u044C \u0438 \u043D\u0430\u0447\u043D\u0438\u0442\u0435 \u0440\u0430\u0431\u043E\u0442\u0430\u0442\u044C.'}
          </motion.p>

          {/* Stats — desktop only */}
          <motion.div
            className="wc-portal-stats"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.5 }}
          >
            {stats.map((s, i) => (
              <div key={s.label} className="wc-portal-stat-item" style={{ position: 'relative' }}>
                {i < stats.length - 1 && (
                  <div style={{
                    position: 'absolute', right: 0, top: '12%', height: '76%',
                    width: 1, background: '#ffffff0a', pointerEvents: 'none',
                  }} />
                )}
                <div style={{ fontSize: 22, fontWeight: 900, color: s.color, lineHeight: 1 }}>
                  <Counter target={s.value} suffix={s.suffix} />
                </div>
                <div style={{ fontSize: 10, color: '#4a6080', fontWeight: 600, letterSpacing: '0.05em', marginTop: 4 }}>
                  {s.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* ── WORLD CARDS ── */}
        <div className="wc-portal-cards">
          {/* CARGO card */}
          <motion.button
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/role-select')}
            className="wc-world-card"
            style={{
              background: 'linear-gradient(145deg, #0d1f3c 0%, #0a1628 100%)',
              border: '1px solid #1d4ed830',
              borderRadius: 22,
              padding: 0,
              cursor: 'pointer',
              overflow: 'hidden',
              textAlign: 'left',
              position: 'relative',
              width: '100%',
            }}
          >
            {/* Top glow */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 1,
              background: 'linear-gradient(90deg, transparent, #3b82f680, transparent)',
            }} />
            <div style={{ padding: 'clamp(18px, 4vw, 24px)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 16,
                  background: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 0 20px #3b82f633',
                }}>
                  <Truck style={{ width: 26, height: 26, color: '#fff' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '-0.3px' }}>
                      CARGO
                    </span>
                    <span style={{
                      fontSize: 9, fontWeight: 700, color: '#34d399',
                      padding: '2px 8px', borderRadius: 10,
                      background: '#34d39914', border: '1px solid #34d39930',
                      letterSpacing: '0.06em',
                    }}>
                      LIVE
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: '#6b8299', lineHeight: 1.5, margin: 0 }}>
                    {'\u0413\u0440\u0443\u0437\u043E\u043F\u0435\u0440\u0435\u0432\u043E\u0437\u043A\u0438 \u0420\u043E\u0441\u0441\u0438\u044F \u00B7 \u0422\u0430\u0434\u0436\u0438\u043A\u0438\u0441\u0442\u0430\u043D \u00B7 \u0421\u041D\u0413'}
                  </p>
                </div>
                <ArrowRight style={{ width: 20, height: 20, color: '#3b82f6', flexShrink: 0, marginTop: 4 }} />
              </div>
              {/* Features row */}
              <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                {['\u{1F6E3}\u{FE0F} \u0413\u0440\u0430\u043D\u0438\u0446\u044B', '\u{1F697} \u0412\u043E\u0434\u0438\u0442\u0435\u043B\u0438', '\u{1F4E6} \u0413\u0440\u0443\u0437\u044B', '\u{1F4E1} \u0420\u0430\u0446\u0438\u044F'].map(tag => (
                  <span key={tag} style={{
                    fontSize: 10, fontWeight: 600, color: '#5ba3f5',
                    padding: '3px 10px', borderRadius: 8,
                    background: '#3b82f60d', border: '1px solid #3b82f620',
                  }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </motion.button>

          {/* AVIA card */}
          <motion.button
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/avia')}
            className="wc-world-card"
            style={{
              background: 'linear-gradient(145deg, #0c1f2e 0%, #0a1420 100%)',
              border: '1px solid #0ea5e925',
              borderRadius: 22,
              padding: 0,
              cursor: 'pointer',
              overflow: 'hidden',
              textAlign: 'left',
              position: 'relative',
              width: '100%',
            }}
          >
            {/* Top glow */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 1,
              background: 'linear-gradient(90deg, transparent, #0ea5e960, transparent)',
            }} />
            <div style={{ padding: 'clamp(18px, 4vw, 24px)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 16,
                  background: 'linear-gradient(135deg, #0369a1 0%, #0ea5e9 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 0 20px #0ea5e933',
                }}>
                  <Plane style={{ width: 26, height: 26, color: '#fff' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '-0.3px' }}>
                      AVIA
                    </span>
                    <span style={{
                      fontSize: 9, fontWeight: 700, color: '#34d399',
                      padding: '2px 8px', borderRadius: 10,
                      background: '#34d39914', border: '1px solid #34d39930',
                      letterSpacing: '0.06em',
                    }}>
                      LIVE
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: '#6b8299', lineHeight: 1.5, margin: 0 }}>
                    {'\u0410\u0432\u0438\u0430\u0433\u0440\u0443\u0437 \u0420\u043E\u0441\u0441\u0438\u044F \u2194 \u0422\u0430\u0434\u0436\u0438\u043A\u0438\u0441\u0442\u0430\u043D'}
                  </p>
                </div>
                <ArrowRight style={{ width: 20, height: 20, color: '#0ea5e9', flexShrink: 0, marginTop: 4 }} />
              </div>
              {/* Features row */}
              <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                {['\u2708\u{FE0F} \u041A\u0443\u0440\u044C\u0435\u0440', '\u{1F4E8} \u041E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u0435\u043B\u044C', '\u{1F504} \u0413\u0438\u0431\u043A\u0438\u0435 \u0440\u043E\u043B\u0438'].map(tag => (
                  <span key={tag} style={{
                    fontSize: 10, fontWeight: 600, color: '#38bdf8',
                    padding: '3px 10px', borderRadius: 8,
                    background: '#0ea5e90d', border: '1px solid #0ea5e920',
                  }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </motion.button>
        </div>

        {/* ── BOTTOM: Lang + Ads ── */}
        <div className="wc-portal-bottom">
          {/* Language */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.4 }}
            style={{ width: '100%' }}
          >
            <div style={{ fontSize: 9, fontWeight: 700, color: '#3d5268', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
              {'\u042F\u0437\u044B\u043A \u0438\u043D\u0442\u0435\u0440\u0444\u0435\u0439\u0441\u0430'}
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
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      padding: '9px 6px', borderRadius: 12,
                      border: isActive ? '1px solid #5ba3f560' : '1px solid #ffffff0f',
                      background: isActive ? '#2176e820' : '#ffffff08',
                      cursor: 'pointer',
                      transition: 'border-color 0.2s, background 0.2s',
                    }}
                  >
                    <span style={{ fontSize: 18 }}>{l.flag}</span>
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

          {/* Ads carousel */}
          {ads.length > 0 && <AdCarousel ads={ads} />}
        </div>

      </div>

      <style>{`
        .wc-portal-outer {
          display: flex;
          flex-direction: column;
          min-height: 100dvh;
          width: 100%;
          max-width: 100vw;
          box-sizing: border-box;
          padding: 0;
        }
        .wc-portal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: clamp(14px,4vw,24px) clamp(16px,5vw,24px) 0;
          flex-shrink: 0;
        }
        .wc-portal-hero {
          padding: clamp(20px,5vw,32px) clamp(16px,5vw,24px) 0;
          flex-shrink: 0;
        }
        .wc-portal-title {
          font-size: clamp(30px, 8vw, 42px);
        }
        .wc-portal-stats {
          display: none;
        }
        .wc-portal-stat-item {
          flex: 1;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 14px 8px;
        }
        .wc-portal-cards {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: clamp(16px,4vw,24px) clamp(16px,5vw,24px) 0;
          flex: 1;
          justify-content: center;
        }
        .wc-portal-bottom {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: clamp(14px,3vw,20px) clamp(16px,5vw,24px) clamp(18px,4dvh,28px);
          flex-shrink: 0;
        }

        /* ── DESKTOP ── */
        @media (min-width: 700px) {
          .wc-portal-outer {
            max-width: 1200px;
            margin: 0 auto;
            flex-direction: row;
            flex-wrap: wrap;
            align-content: center;
            justify-content: center;
            padding: clamp(24px, 4vw, 40px) clamp(28px, 4vw, 56px);
            gap: 0;
          }
          .wc-portal-header {
            width: 100%;
            padding: 0 0 clamp(24px,4vh,40px);
          }
          .wc-portal-hero {
            flex: 1;
            min-width: 0;
            padding: 0 clamp(20px,3vw,40px) 0 0;
            display: flex;
            flex-direction: column;
            justify-content: center;
          }
          .wc-portal-title {
            font-size: clamp(38px, 4.5vw, 60px);
          }
          .wc-portal-stats {
            display: flex;
            gap: 0;
            margin-top: 28px;
            border: 1px solid #ffffff12;
            border-radius: 18px;
            overflow: hidden;
            backdrop-filter: blur(20px);
            background: #ffffff08;
            max-width: 380px;
          }
          .wc-portal-cards {
            width: clamp(320px, 35vw, 440px);
            flex-shrink: 0;
            flex: none;
            padding: 0;
            justify-content: center;
          }
          .wc-portal-bottom {
            width: 100%;
            flex-direction: row;
            align-items: flex-end;
            padding: clamp(20px,3vh,32px) 0 0;
            gap: 20px;
          }
          .wc-portal-bottom > * {
            flex: 1;
          }
        }

        /* ── LARGE DESKTOP ── */
        @media (min-width: 1200px) {
          .wc-portal-outer {
            max-width: 1360px;
          }
          .wc-portal-title {
            font-size: 64px;
          }
          .wc-portal-cards {
            width: 460px;
          }
        }
      `}</style>
    </div>
  );
}