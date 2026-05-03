import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import type { LangCode } from '../i18n/translations';
import { getPublicStats } from '../api/dataApi';

const LANGS: { code: LangCode; flag: string; label: string }[] = [
  { code: 'ru', flag: '🇷🇺', label: 'RU' },
  { code: 'tj', flag: '🇹🇯', label: 'TJ' },
  { code: 'en', flag: '🇺🇸', label: 'EN' },
];

const PARTNERS = [
  { name: 'DP World',       logo: 'https://upload.wikimedia.org/wikipedia/commons/0/0b/DP_World_logo.svg' },
  { name: 'Maersk',         logo: 'https://upload.wikimedia.org/wikipedia/commons/7/79/Maersk_Group_Logo.svg' },
  { name: 'DHL',            logo: 'https://upload.wikimedia.org/wikipedia/commons/a/ac/DHL_Logo.svg' },
  { name: 'Turkish Cargo',  logo: null },
  { name: 'DB Schenker',    logo: null },
];

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
    { value: 128,                        suffix: '',    label: 'Грузов\nонлайн',        color: '#0d6efd' },
    { value: liveStats?.drivers ?? 43,   suffix: '',    label: 'Водителей\nонлайн',     color: '#00ff88' },
    { value: 12,                         suffix: ' мин', label: 'Очередь на\nгранице',  color: '#ff9900' },
    { value: liveStats?.satisfied ?? 98, suffix: '%',   label: 'Доставка\nв срок',       color: '#b14cff' },
  ];

  const S = {
    app: {
      background: 'linear-gradient(to bottom, #020817, #031126)',
      minHeight: '100dvh',
      width: '100%',
      maxWidth: 480,
      margin: '0 auto',
      fontFamily: "'Sora', Arial, sans-serif",
      color: '#fff',
    } as React.CSSProperties,

    header: {
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: 'max(20px, env(safe-area-inset-top, 20px)) 20px 14px',
    } as React.CSSProperties,

    card: {
      margin: '0 16px 12px',
      background: '#061225',
      border: '1px solid rgba(0,136,255,0.2)',
      borderRadius: 24,
      padding: 18,
      boxShadow: '0 0 20px rgba(0,119,255,0.08)',
    } as React.CSSProperties,
  };

  return (
    <div style={S.app}>

      {/* ── HEADER ── */}
      <motion.div
        style={S.header}
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{
            width: 55, height: 55, borderRadius: 16, flexShrink: 0,
            background: 'linear-gradient(135deg, #0f52b6, #2176e8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 18px rgba(25,120,229,0.35)',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="3" width="15" height="13" rx="2"/>
              <path d="M16 8h4l3 5v4h-7V8z"/>
              <circle cx="5.5" cy="18.5" r="2.5"/>
              <circle cx="18.5" cy="18.5" r="2.5"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.3px', lineHeight: 1.1 }}>
              OVORA <span style={{ color: '#ff6b00' }}>CARGO</span>
            </div>
            <div style={{ fontSize: 10, color: '#4a6080', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Логистика и авиаперевозки
            </div>
          </div>
        </div>

        {/* Online */}
        <div style={{
          background: '#061b14', border: '1px solid #0f5132',
          padding: '10px 16px', borderRadius: 18,
          color: '#00ff88', fontWeight: 700, fontSize: 13,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <motion.span
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.8, repeat: Infinity }}
          >●</motion.span>
          ОНЛАЙН
        </div>
      </motion.div>

      {/* ── CARGO CARD ── */}
      <motion.button
        style={{ ...S.card, width: 'calc(100% - 32px)', textAlign: 'left', cursor: 'pointer', display: 'block' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.45 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => navigate('/role-select')}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <div style={{
              width: 72, height: 72, borderRadius: 18,
              background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 18px rgba(59,130,246,0.3)', flexShrink: 0,
            }}>
              <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3" width="15" height="13" rx="2"/>
                <path d="M16 8h4l3 5v4h-7V8z"/>
                <circle cx="5.5" cy="18.5" r="2.5"/>
                <circle cx="18.5" cy="18.5" r="2.5"/>
              </svg>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                <span style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.5px' }}>CARGO</span>
                <span style={{
                  color: '#00ff88', border: '1px solid #00ff88',
                  padding: '2px 10px', borderRadius: 12, fontSize: 13, fontWeight: 700,
                }}>LIVE</span>
              </div>
              <div style={{ color: '#8ea6c7', fontSize: 14, lineHeight: 1.4 }}>
                Грузоперевозки Россия · Таджикистан · СНГ
              </div>
            </div>
          </div>
          <span style={{ fontSize: 34, color: '#1677ff', flexShrink: 0 }}>→</span>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
          {['🛂 Границы', '🚛 Водители', '📦 Грузы', '📡 Рация'].map(tag => (
            <div key={tag} style={{
              flex: 1, minWidth: 80, padding: '11px 8px', borderRadius: 14,
              border: '1px solid rgba(0,136,255,0.15)', background: '#04101f',
              textAlign: 'center', color: '#4ea1ff', fontSize: 13, fontWeight: 600,
            }}>
              {tag}
            </div>
          ))}
        </div>
      </motion.button>

      {/* ── AVIA CARD ── */}
      <motion.button
        style={{ ...S.card, width: 'calc(100% - 32px)', textAlign: 'left', cursor: 'pointer', display: 'block' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18, duration: 0.45 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => navigate('/avia')}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <div style={{
              width: 72, height: 72, borderRadius: 18,
              background: 'linear-gradient(135deg, #0369a1, #0ea5e9)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 18px rgba(14,165,233,0.3)', flexShrink: 0,
            }}>
              <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21 4 19 4c-1.4 0-2.2.7-2.5 1.5L13 9 4.8 6.2c-.4-.1-.8.1-1 .5l-.3.6c-.2.4-.1.8.2 1.1L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.3.7.4 1.1.2l.6-.3c.4-.2.6-.6.5-1z"/>
              </svg>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                <span style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.5px' }}>AVIA</span>
                <span style={{
                  color: '#00ff88', border: '1px solid #00ff88',
                  padding: '2px 10px', borderRadius: 12, fontSize: 13, fontWeight: 700,
                }}>LIVE</span>
              </div>
              <div style={{ color: '#8ea6c7', fontSize: 14, lineHeight: 1.4 }}>
                Авиагруз Россия ↔ Таджикистан
              </div>
            </div>
          </div>
          <span style={{ fontSize: 34, color: '#1677ff', flexShrink: 0 }}>→</span>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
          {['✈️ Курьер', '✉️ Отправитель', '🧳 Гибкие роли'].map(tag => (
            <div key={tag} style={{
              flex: 1, minWidth: 90, padding: '11px 8px', borderRadius: 14,
              border: '1px solid rgba(0,136,255,0.15)', background: '#04101f',
              textAlign: 'center', color: '#4ea1ff', fontSize: 13, fontWeight: 600,
            }}>
              {tag}
            </div>
          ))}
        </div>
      </motion.button>

      {/* ── HERO ── */}
      <motion.div
        style={{ padding: '8px 20px 0' }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.26, duration: 0.5 }}
      >
        <h2 style={{ fontSize: 52, fontWeight: 900, lineHeight: 1, letterSpacing: '-1.5px' }}>
          Платформа<br />
          <span style={{
            background: 'linear-gradient(95deg, #1a56db, #60a5fa)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Ovora
          </span>
        </h2>

        <p style={{ marginTop: 16, color: '#94a3b8', lineHeight: 1.6, fontSize: 17 }}>
          Грузоперевозки и авиадоставка между Россией, Таджикистаном и СНГ.
        </p>

        {/* Truck photo */}
        <div style={{ marginTop: 20, borderRadius: 22, overflow: 'hidden', position: 'relative' }}>
          <img
            src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=800&auto=format&fit=crop"
            alt="cargo truck"
            style={{ width: '100%', display: 'block', objectFit: 'cover', height: 200 }}
            onError={(e) => {
              const el = e.currentTarget as HTMLImageElement;
              el.style.display = 'none';
              const parent = el.parentElement!;
              parent.style.background = 'linear-gradient(135deg, #0d1f3c, #0a1628)';
              parent.style.height = '160px';
              parent.style.display = 'flex';
              parent.style.alignItems = 'center';
              parent.style.justifyContent = 'center';
              parent.innerHTML = '<span style="font-size:80px;opacity:0.4">🚛</span>';
            }}
          />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to right, rgba(2,8,23,0.5) 0%, transparent 50%, rgba(2,8,23,0.3) 100%)',
          }} />
        </div>

        {/* Language */}
        <div style={{ color: '#8ea6c7', fontSize: 17, marginTop: 24, marginBottom: 14, fontWeight: 600, letterSpacing: '0.05em' }}>
          ЯЗЫК ИНТЕРФЕЙСА
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {LANGS.map(l => {
            const isActive = selectedLang === l.code;
            return (
              <motion.button
                key={l.code}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleLangSelect(l.code)}
                style={{
                  flex: 1, borderRadius: 18, padding: '18px 8px',
                  border: `2px solid ${isActive ? '#0d6efd' : 'rgba(0,136,255,0.2)'}`,
                  background: '#061225', cursor: 'pointer',
                  textAlign: 'center', fontSize: 22, fontWeight: 700,
                  color: isActive ? '#fff' : '#8ea6c7',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                <span style={{ fontSize: 22 }}>{l.flag}</span>
                <span style={{ fontSize: 16, fontWeight: 700 }}>{l.label}</span>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* ── PARTNERS ── */}
      <motion.div
        style={{
          margin: '20px 16px 0',
          background: '#061225',
          borderRadius: 24,
          border: '1px solid rgba(0,136,255,0.15)',
          padding: '20px 20px 16px',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35, duration: 0.5 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h3 style={{ fontSize: 26, fontWeight: 800 }}>Наши партнёры</h3>
          <span style={{ color: '#0d6efd', fontSize: 14, cursor: 'pointer' }}>Смотреть все →</span>
        </div>

        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
          {PARTNERS.map(p => (
            <div key={p.name} style={{
              minWidth: 100, flexShrink: 0,
              background: '#07101d', borderRadius: 16,
              border: '1px solid rgba(255,255,255,0.06)',
              padding: '16px 12px', textAlign: 'center',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
            }}>
              {p.logo ? (
                <img
                  src={p.logo}
                  alt={p.name}
                  style={{ width: 60, height: 44, objectFit: 'contain' }}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />
              ) : (
                <div style={{
                  width: 60, height: 44, borderRadius: 10,
                  background: 'rgba(25,120,229,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22,
                }}>
                  {p.name === 'Turkish Cargo' ? '✈️' : '🚂'}
                </div>
              )}
              <p style={{ color: '#cbd5e1', fontSize: 11, fontWeight: 600, lineHeight: 1.3 }}>{p.name}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── STATS 2×2 ── */}
      <motion.div
        style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: 12, padding: '16px 16px max(28px, env(safe-area-inset-bottom, 28px))',
        }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.42, duration: 0.45 }}
      >
        {stats.map(s => (
          <div key={s.label} style={{
            background: '#061225', borderRadius: 22, padding: '22px 20px',
            border: '1px solid rgba(0,136,255,0.15)',
          }}>
            <div style={{ fontSize: 36, fontWeight: 900, color: s.color, marginBottom: 8, lineHeight: 1, letterSpacing: '-0.5px' }}>
              <Counter target={s.value} suffix={s.suffix} />
            </div>
            <p style={{ color: '#94a3b8', lineHeight: 1.4, fontSize: 14, whiteSpace: 'pre-line' }}>
              {s.label}
            </p>
          </div>
        ))}
      </motion.div>

    </div>
  );
}
