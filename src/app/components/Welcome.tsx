import { useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import type { LangCode } from '../i18n/translations';
import { getPublicStats } from '../api/dataApi';
import { getSiteConfig } from '../utils/siteConfig';

const LANGS: { code: LangCode; display: string; flag: string }[] = [
  { code: 'ru', display: 'RU', flag: '🇷🇺' },
  { code: 'tj', display: 'TJ', flag: '🇹🇯' },
  { code: 'en', display: 'EN', flag: '🇺🇸' },
];

// ── Animated counter ───────────────────────────────────────────────────
function Counter({ target, suffix }: { target: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const steps = Math.round((1400 / 1000) * 60);
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

// ── Live pulse dot ─────────────────────────────────────────────────────
function LiveDot({ color = '#10d98b', size = 7 }: { color?: string; size?: number }) {
  return (
    <span style={{ position: 'relative', width: size, height: size, display: 'inline-block', flexShrink: 0 }}>
      <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: color, animation: 'pulseRing 2s ease-out infinite' }} />
      <span style={{ position: 'absolute', inset: Math.floor(size * 0.2), borderRadius: '50%', background: color }} />
    </span>
  );
}

// ── SVG icons ──────────────────────────────────────────────────────────
function ArrowIcon({ color = '#fff' }: { color?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  );
}

const TagIcons = {
  shield: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></svg>,
  user:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>,
  box:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></svg>,
  plane:  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12c0 .55-.45 1-1 1h-6.5l-3 7H10l1.5-7H7l-2 2H3l1.5-3L3 9h2l2 2h4.5L10 4h1.5l3 7H21c.55 0 1 .45 1 1z" /></svg>,
  mail:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>,
  radio:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M4.9 16.1C1 12.2 1 5.8 4.9 1.9" /><path d="M7.8 4.7a6.14 6.14 0 0 0-.8 7.5" /><circle cx="12" cy="9" r="2" /><path d="M16.2 4.8c2 2 2.26 5.11.8 7.47" /><path d="M19.1 1.9a9.96 9.96 0 0 1 0 14.1" /><path d="M9.5 18h5" /><path d="m8 22 4-11 4 11" /></svg>,
  flex:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M3 21v-5h5" /></svg>,
};

const MetricIcons: Record<string, ReactNode> = {
  truck: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3" /><rect width="7" height="7" x="14" y="11" rx="1" /><circle cx="7.5" cy="17.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" /></svg>,
  globe: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" /></svg>,
  star:  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>,
  pkg:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16.5 9.4 7.55 4.24" /><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></svg>,
};

// ── Service card ───────────────────────────────────────────────────────
interface ServiceCardProps {
  accent: string;
  glow: string;
  gradFrom: string;
  imgSrc: string;
  title: string;
  subtitle: string;
  desc: string;
  tags: { icon: ReactNode; label: string; bg?: string }[];
  onClick: () => void;
}

function ServiceCard({ accent, glow, gradFrom, imgSrc, title, subtitle, desc, tags, onClick }: ServiceCardProps) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.18 }}
      style={{
        background: 'rgba(6,14,38,0.95)',
        border: `1px solid ${hovered ? accent + '40' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: 20,
        padding: 0,
        width: '100%',
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: 'inherit',
        overflow: 'hidden',
        position: 'relative',
        boxShadow: hovered
          ? `0 0 0 1px ${accent}28, 0 20px 60px rgba(0,0,0,0.55), 0 0 50px ${glow}`
          : '0 4px 24px rgba(0,0,0,0.4)',
        transition: 'border-color 0.2s, box-shadow 0.2s',
      }}
    >
      {/* Accent top bar */}
      <div style={{ height: 3, background: `linear-gradient(90deg, transparent 0%, ${accent} 45%, transparent 100%)` }} />

      {/* Main row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(10px,2.5vw,18px)', padding: 'clamp(14px,3.5vw,22px) clamp(14px,3.5vw,20px) clamp(10px,2.5vw,14px)' }}>
        {/* Image */}
        <div style={{ width: 'clamp(70px,18vw,90px)', height: 'clamp(58px,15vw,74px)', borderRadius: 14, overflow: 'hidden', background: 'rgba(0,5,18,0.9)', border: '1px solid rgba(255,255,255,0.06)', flexShrink: 0, position: 'relative' }}>
          <img src={imgSrc} alt={title} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
          <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 50% 70%, ${glow}, transparent 65%)`, pointerEvents: 'none' }} />
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 'clamp(6px,1.5vw,10px)', flexWrap: 'wrap', marginBottom: 3 }}>
            <span style={{ fontSize: 'clamp(22px,5.5vw,28px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1 }}>{title}</span>
            <span style={{ fontSize: 'clamp(10px,2.2vw,13px)', fontWeight: 600, color: accent, letterSpacing: '0.04em' }}>{subtitle}</span>
          </div>
          <p style={{ fontSize: 'clamp(9px,2vw,12px)', color: '#7a90b4', margin: 0, lineHeight: 1.4 }}>{desc}</p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 8, background: 'rgba(16,217,139,0.09)', border: '1px solid rgba(16,217,139,0.22)', borderRadius: 20, padding: '2px 8px' }}>
            <LiveDot />
            <span style={{ fontSize: 'clamp(8px,1.8vw,10px)', fontWeight: 700, color: '#10d98b', letterSpacing: '0.07em' }}>LIVE</span>
          </div>
        </div>

        {/* CTA button */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, flexShrink: 0 }}>
          <div style={{
            width: 'clamp(40px,9vw,48px)', height: 'clamp(40px,9vw,48px)', borderRadius: 14,
            background: `linear-gradient(145deg, ${gradFrom}, ${accent})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 6px 20px ${glow}`,
            transform: hovered ? 'scale(1.1)' : 'scale(1)',
            transition: 'transform 0.15s ease',
          }}>
            <ArrowIcon />
          </div>
        </div>
      </div>

      {/* Tags */}
      <div style={{ display: 'flex', gap: 'clamp(4px,1.2vw,6px)', flexWrap: 'wrap', padding: '0 clamp(14px,3.5vw,20px) clamp(14px,3.5vw,18px)' }}>
        {tags.map((t, i) => (
          <span key={i} style={{ fontSize: 'clamp(8px,1.8vw,10px)', fontWeight: 600, color: '#c0d0f0', padding: 'clamp(3px,0.8vw,5px) clamp(7px,1.8vw,10px)', borderRadius: 8, background: t.bg ?? 'rgba(255,255,255,0.06)', border: t.bg ? 'none' : '1px solid rgba(255,255,255,0.08)', display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
            <span style={{ display: 'inline-flex', opacity: 0.7 }}>{t.icon}</span>
            {t.label}
          </span>
        ))}
      </div>
    </motion.button>
  );
}

// ══════════════════════════════════════════════════════════════════════
// WELCOME
// ══════════════════════════════════════════════════════════════════════
export function Welcome() {
  const navigate = useNavigate();
  const { lang, setLang } = useLanguage();
  const [selectedLang, setSelectedLang] = useState<LangCode>(lang);
  const [mounted, setMounted] = useState(false);
  const [liveStats, setLiveStats] = useState<{ drivers: number; cities: number; satisfied: number } | null>(null);
  const [siteConfig, setSiteConfig] = useState(() => getSiteConfig());

  useEffect(() => {
    setMounted(true);
    getPublicStats().then(s => setLiveStats(s)).catch(() => {});
    const onCfgChange = () => setSiteConfig(getSiteConfig());
    window.addEventListener('ovora_site_config_changed', onCfgChange);
    return () => window.removeEventListener('ovora_site_config_changed', onCfgChange);
  }, []);

  const handleLang = (code: LangCode) => { setSelectedLang(code); setLang(code); };

  if (!mounted) return null;

  const metrics = [
    { val: liveStats?.drivers  ?? 3400, suffix: '+', label: 'Водителей',    color: '#4fa3ff', iconKey: 'truck' },
    { val: liveStats?.cities   ?? 12,   suffix: '',  label: 'Городов',      color: '#a78bfa', iconKey: 'globe' },
    { val: liveStats?.satisfied ?? 98,  suffix: '%', label: 'Довольных',    color: '#10d98b', iconKey: 'star'  },
    { val: 128,                         suffix: '',  label: 'Рейсов онлайн', color: '#ff8c42', iconKey: 'pkg'   },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#020812', position: 'relative' }}>

      {/* Ambient background glow */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-15%', left: '50%', transform: 'translateX(-50%)', width: 900, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(30,111,217,0.14) 0%, transparent 65%)', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', top: '50%', right: '-5%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,200,255,0.07) 0%, transparent 65%)', filter: 'blur(40px)' }} />
      </div>

      {/* ── HERO: full-bleed cinematic ── */}
      <motion.div className="ovora-hero-fullbleed" style={{ position: 'relative', zIndex: 1 }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7 }}
      >
        <img src={siteConfig.icons.hero} alt="Ovora Cargo" />
        {/* Cinematic overlay fading to background */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(2,8,18,0.2) 0%, rgba(2,8,18,0.5) 60%, #020812 100%)' }} />
        {/* Text overlay — desktop only via CSS class */}
        <div className="ovora-hero-text">
          <motion.div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 14px', background: 'rgba(30,111,217,0.2)', border: '1px solid rgba(79,163,255,0.32)', borderRadius: 20, backdropFilter: 'blur(12px)', marginBottom: 14 }}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          >
            <LiveDot />
            <span style={{ fontSize: 'clamp(9px,1.5vw,12px)', fontWeight: 700, color: '#7dc4ff', letterSpacing: '0.1em' }}>ПЛАТФОРМА №1 В СНГ</span>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
            <div style={{ fontSize: 'clamp(36px,6vw,80px)', fontWeight: 900, color: '#fff', lineHeight: 0.9, letterSpacing: '-0.04em', textShadow: '0 4px 30px rgba(0,0,0,0.7)' }}>OVORA</div>
            <div style={{ fontSize: 'clamp(13px,2.5vw,28px)', fontWeight: 300, color: 'rgba(180,210,255,0.75)', letterSpacing: '0.2em', marginTop: 6, textTransform: 'uppercase' }}>Cargo Platform</div>
          </motion.div>
          <motion.p style={{ fontSize: 'clamp(11px,1.6vw,17px)', color: 'rgba(145,180,228,0.7)', margin: 'clamp(10px,2vw,20px) 0 0', lineHeight: 1.6, maxWidth: 480 }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }}
          >
            Соединяем грузоотправителей и водителей<br />по всей России и СНГ
          </motion.p>
        </div>
      </motion.div>

      {/* ── MAIN CONTENT ── */}
      <div style={{ position: 'relative', zIndex: 2, maxWidth: 1280, margin: '0 auto', padding: 'clamp(14px,3vw,32px) clamp(12px,3.5vw,32px) clamp(32px,6vw,64px)' }}>

        {/* Service cards — 1 col mobile / 2 col desktop */}
        <motion.div className="ovora-services-grid"
          initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}
        >
          <ServiceCard
            accent="#4fa3ff"
            glow="rgba(79,163,255,0.2)"
            gradFrom="#103a8c"
            imgSrc={siteConfig.icons.truck}
            title="CARGO"
            subtitle="Грузоперевозки"
            desc="Россия · Таджикистан · СНГ"
            tags={[
              { icon: TagIcons.shield, label: 'Границы' },
              { icon: TagIcons.user,   label: 'Водители', bg: 'rgba(220,38,38,0.6)' },
              { icon: TagIcons.box,    label: 'Грузы',    bg: 'rgba(217,119,6,0.6)' },
              { icon: TagIcons.radio,  label: 'Рация' },
            ]}
            onClick={() => navigate('/role-select')}
          />
          <ServiceCard
            accent="#00c8ff"
            glow="rgba(0,200,255,0.18)"
            gradFrom="#004a5e"
            imgSrc={siteConfig.icons.plane}
            title="AVIA"
            subtitle="Авиагруз"
            desc="Россия ↔ Таджикистан"
            tags={[
              { icon: TagIcons.plane, label: 'Курьер' },
              { icon: TagIcons.mail,  label: 'Отправитель' },
              { icon: TagIcons.flex,  label: 'Гибкие роли' },
            ]}
            onClick={() => navigate('/avia')}
          />
        </motion.div>

        {/* Metrics strip — 2 col mobile / 4 col desktop */}
        <motion.div className="ovora-metrics-grid"
          style={{ marginTop: 'clamp(10px,2.5vw,20px)' }}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.45 }}
        >
          {metrics.map((m, i) => (
            <div key={i} style={{ background: 'rgba(6,14,38,0.95)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 'clamp(12px,3vw,20px) clamp(10px,2.5vw,16px)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: `linear-gradient(135deg, ${m.color}22, ${m.color}44)`, border: `1px solid ${m.color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: m.color }}>
                {MetricIcons[m.iconKey]}
              </div>
              <div>
                <div style={{ fontSize: 'clamp(20px,5vw,28px)', fontWeight: 900, color: m.color, lineHeight: 1, letterSpacing: '-0.02em' }}>
                  <Counter target={m.val} suffix={m.suffix} />
                </div>
                <div style={{ fontSize: 'clamp(9px,2vw,11px)', color: '#6a84a8', fontWeight: 600, marginTop: 2, lineHeight: 1.2 }}>{m.label}</div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Bottom row: Partners + Language */}
        <motion.div className="ovora-bottom-row"
          style={{ marginTop: 'clamp(10px,2.5vw,20px)' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45, duration: 0.4 }}
        >
          {/* Partners */}
          <div style={{ background: 'rgba(6,14,38,0.95)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 'clamp(12px,3vw,18px)', overflow: 'hidden', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 'clamp(11px,2.5vw,14px)', fontWeight: 800, color: '#b8ccee' }}>Наши партнёры</span>
              <span style={{ fontSize: 'clamp(9px,2vw,11px)', color: '#4fa3ff', fontWeight: 600, cursor: 'pointer' }}>Все →</span>
            </div>
            <div style={{ display: 'flex', gap: 'clamp(8px,2vw,14px)', overflowX: 'auto', paddingBottom: 4, WebkitOverflowScrolling: 'touch' as any }}>
              {siteConfig.partners.map((p, i) => (
                <div key={p.id ?? i} style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, width: 'clamp(52px,12vw,68px)' }}>
                  <div style={{ width: 'clamp(38px,9vw,50px)', height: 'clamp(38px,9vw,50px)', borderRadius: 12, background: `linear-gradient(145deg, ${p.color}18, ${p.color}35)`, border: `1px solid ${p.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: p.mark.length > 2 ? 'clamp(7px,2vw,10px)' : 'clamp(10px,2.5vw,14px)', fontWeight: 900, color: p.textColor ?? p.color }}>{p.mark}</span>
                  </div>
                  <span style={{ fontSize: 'clamp(7px,1.6vw,9px)', color: '#8898b8', fontWeight: 700, textAlign: 'center', lineHeight: 1.2 }}>{p.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Language selector */}
          <div style={{ background: 'rgba(6,14,38,0.95)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 'clamp(12px,3vw,18px)', flexShrink: 0 }}>
            <div style={{ fontSize: 'clamp(9px,2vw,11px)', fontWeight: 700, color: '#4a6080', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>Язык</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 'clamp(120px,16vw,160px)' }}>
              {LANGS.map(l => {
                const active = selectedLang === l.code;
                return (
                  <button key={l.code} onClick={() => handleLang(l.code)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 'clamp(7px,2vw,10px) clamp(8px,2vw,12px)', borderRadius: 10, border: active ? '1px solid rgba(79,163,255,0.4)' : '1px solid transparent', background: active ? 'rgba(30,111,217,0.16)' : 'rgba(255,255,255,0.02)', color: active ? '#bdd9ff' : '#4a6080', fontSize: 'clamp(11px,2.5vw,13px)', fontWeight: active ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit', width: '100%', textAlign: 'left', transition: 'all 0.15s ease' }}>
                    <span style={{ fontSize: 'clamp(14px,3.5vw,17px)' }}>{l.flag}</span>
                    <span>{l.display}</span>
                    {active && <span style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: '#4fa3ff', boxShadow: '0 0 6px #4fa3ff88' }} />}
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
