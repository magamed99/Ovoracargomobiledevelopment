import { useState, useEffect } from 'react';
import {
  ArrowLeft, Truck, Package, Users, Globe, Shield,
  Award, Target, TrendingUp, Heart, Zap,
  CheckCircle2, Star, MessageSquare, Activity,
  MapPin, Rocket, ChevronRight, Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';

interface PlatformStats {
  users: number; drivers: number; trips: number;
  completedTrips: number; rating: number; timestamp: string;
}

const FEATURE_COLORS = ['#5ba3f5', '#10b981', '#f59e0b', '#ec4899'];

export function AboutPage() {
  const navigate = useNavigate();
  const [stats, setStats]         = useState<PlatformStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-4e36197a/stats`,
        { headers: { Authorization: `Bearer ${publicAnonKey}` } }
      );
      if (!res.ok) throw new Error('Failed');
      setStats(await res.json());
    } catch {
      setStats({ users: 0, drivers: 0, trips: 0, completedTrips: 0, rating: 5.0, timestamp: new Date().toISOString() });
    } finally { setIsLoading(false); }
  };

  useEffect(() => {
    fetchStats();
    const iv = setInterval(fetchStats, 30000);
    return () => clearInterval(iv);
  }, []);

  const formatStat = (v: number) => {
    if (v === 0) return '0';
    if (v < 1000) return `${v}+`;
    return `${Math.floor(v / 1000)}K+`;
  };

  const displayStats = [
    { icon: Users,   value: stats ? formatStat(stats.users)   : '...', label: 'Пользователи', color: '#5ba3f5' },
    { icon: Truck,   value: stats ? formatStat(stats.drivers) : '...', label: 'Водители',     color: '#10b981' },
    { icon: Package, value: stats ? formatStat(stats.trips)   : '...', label: 'Поездки',      color: '#f59e0b' },
    { icon: Star,    value: stats ? (stats.rating != null ? stats.rating.toFixed(1) : '5.0') : '5.0', label: 'Рейтинг', color: '#ec4899' },
  ];

  const features = [
    { icon: Shield, title: 'Безопасность', desc: 'Верификация документов водителей и страхование грузов',          color: '#5ba3f5' },
    { icon: Zap,    title: 'Быстрота',     desc: 'Моментальный поиск поездок и GPS-отслеживание в реальном времени', color: '#f59e0b' },
    { icon: Truck,  title: 'Удобство',     desc: 'Простое создание поездок и подача заявок в пару кликов',           color: '#10b981' },
    { icon: Heart,  title: 'Поддержка',    desc: 'Служба поддержки 24/7 на русском, таджикском и английском',        color: '#ec4899' },
  ];

  const values = [
    { icon: Target,     title: 'Наша миссия',  text: 'Сделать грузоперевозки в Таджикистане доступными, прозрачными и безопасными.', color: '#5ba3f5' },
    { icon: TrendingUp, title: 'Наша цель',    text: 'Стать ведущей платформой грузоперевозок в Центральной Азии.',                   color: '#10b981' },
    { icon: Globe,      title: 'Наше видение', text: 'Создать экосистему логистики, где каждый может заработать или отправить груз быстро.', color: '#8b5cf6' },
  ];

  const timeline = [
    { year: '2026', title: 'Запуск платформы',       desc: 'Начало работы в Душанбе и Худжанде',             current: true,  color: '#10b981' },
    { year: '2027', title: 'Рост и развитие',         desc: 'Расширение на все крупные города Таджикистана',  current: false, color: '#5ba3f5' },
    { year: '2028', title: 'Международная экспансия', desc: 'Выход на рынки Узбекистана и Кыргызстана',       current: false, color: '#8b5cf6' },
    { year: '2029', title: 'Лидер рынка',             desc: 'Крупнейшая платформа грузоперевозок в ЦА',       current: false, color: '#f59e0b' },
  ];

  const whyUs = [
    { text: 'Оплата через приложение — быстро и безопасно',            icon: '💳' },
    { text: 'Только водители создают объявления — прозрачная система', icon: '✅' },
    { text: 'GPS-отслеживание груза в реальном времени',               icon: '📍' },
    { text: 'Верификация документов всех водителей',                   icon: '🛡️' },
    { text: 'Встроенный чат для быстрой коммуникации',                icon: '💬' },
    { text: 'Система рейтингов и отзывов',                             icon: '⭐' },
    { text: 'Поддержка 3 языков: русский, таджикский, английский',    icon: '🌐' },
    { text: 'Автоматический расчёт стоимости перевозки',              icon: '🧮' },
    { text: 'Служба поддержки 24/7',                                   icon: '🎧' },
  ];

  /* ══════════════════════════════════════════════════════════ */
  return (
    <div className="font-['Sora'] bg-[#0e1621] text-white min-h-screen">

      {/* ════════════════ MOBILE (не трогаем) ════════════════ */}
      <div className="md:hidden flex flex-col min-h-screen max-w-3xl mx-auto">
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0" style={{ background: 'linear-gradient(150deg, #0a1f3d 0%, #0e1621 55%)' }} />
            <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full" style={{ background: 'radial-gradient(circle, #1d4ed8 0%, transparent 70%)', opacity: 0.22 }} />
            <div className="absolute top-16 -left-12 w-48 h-48 rounded-full" style={{ background: 'radial-gradient(circle, #0f4a30 0%, transparent 70%)', opacity: 0.30 }} />
          </div>
          <div className="relative flex items-center justify-between px-4" style={{ paddingTop: 'max(52px, env(safe-area-inset-top, 52px))', paddingBottom: 4 }}>
            <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/[0.07] border border-white/10 text-white active:scale-90 transition-all shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="text-center">
              <p className="text-[10px] font-semibold tracking-widest uppercase text-[#607080]">Ovora Cargo</p>
              <h1 className="text-[20px] font-black text-white leading-tight">О нас</h1>
            </div>
            <button onClick={fetchStats} className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/[0.07] border border-white/10 text-[#5ba3f5] active:scale-90 transition-all">
              <Activity className={`w-4.5 h-4.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div className="relative px-4 pt-6 pb-7 flex flex-col items-center text-center">
            <div className="relative mb-4">
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl" style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #0f2a70 100%)', boxShadow: '0 8px 32px #1d4ed840' }}>
                <Truck className="w-9 h-9 text-white" />
              </div>
              <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-xl bg-emerald-500 flex items-center justify-center border-2 border-[#0e1621] shadow">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
            </div>
            <h2 className="text-[26px] font-black text-white mb-1">Ovora Cargo</h2>
            <p className="text-[13px] text-[#8899aa] max-w-[260px] leading-snug">Платформа для грузоперевозок и райдшеринга в Таджикистане</p>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-[#5ba3f5]" /><span className="text-[11px] text-[#607080]">С 2026 года</span></div>
              <div className="w-1 h-1 rounded-full bg-[#607080]" />
              <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-[#10b981]" /><span className="text-[11px] text-[#607080]">Душанбе 🇹🇯</span></div>
              <div className="w-1 h-1 rounded-full bg-[#607080]" />
              <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /><span className="text-[11px] text-[#607080]">В сети</span></div>
            </div>
          </div>
          <div className="relative px-4 pb-6 grid grid-cols-4 gap-2">
            {displayStats.map(s => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border border-white/[0.07] bg-white/[0.04]">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${s.color}18`, border: `1px solid ${s.color}28` }}>
                    <Icon className="w-4 h-4" style={{ color: s.color }} />
                  </div>
                  <span className="text-[15px] font-black text-white leading-none">{s.value}</span>
                  <span className="text-[9px] font-semibold text-[#607080] text-center leading-tight">{s.label}</span>
                </div>
              );
            })}
          </div>
          {stats && (
            <div className="relative flex items-center justify-center gap-2 pb-5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] text-[#607080]">Данные обновляются в реальном времени</span>
            </div>
          )}
        </div>
        <div className="flex-1 pb-32 flex flex-col gap-4 px-4">
          <section>
            <SectionHeaderMobile icon={Rocket} title="Что мы делаем" color="#5ba3f5" />
            <div className="rounded-3xl bg-white/[0.04] border border-white/[0.07] p-4 flex flex-col gap-3">
              <p className="text-[14px] leading-relaxed text-[#8899aa]">
                <span className="font-black text-white">Ovora Cargo</span> — современное приложение, которое объединяет водителей, готовых перевезти грузы или пассажиров, с людьми и компаниями, которым нужна доставка.
              </p>
              <div className="rounded-2xl bg-[#5ba3f5]/10 border border-[#5ba3f5]/20 px-4 py-3">
                <p className="text-[13px] text-[#5ba3f5] font-bold leading-snug">«Водитель создаёт — отправитель находит»</p>
              </div>
              <p className="text-[13px] leading-relaxed text-[#607080]">Оплата проходит через встроенную систему приложения — безопасно и прозрачно.</p>
            </div>
          </section>
          <section>
            <SectionHeaderMobile icon={Award} title="Наши преимущества" color="#f59e0b" />
            <div className="grid grid-cols-2 gap-2.5">
              {features.map(f => {
                const Icon = f.icon;
                return (
                  <div key={f.title} className="rounded-2xl bg-white/[0.04] border border-white/[0.07] p-4 flex flex-col gap-2">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${f.color}18`, border: `1px solid ${f.color}28` }}>
                      <Icon className="w-4.5 h-4.5" style={{ color: f.color }} />
                    </div>
                    <p className="text-[13px] font-black text-white">{f.title}</p>
                    <p className="text-[11px] text-[#607080] leading-snug">{f.desc}</p>
                  </div>
                );
              })}
            </div>
          </section>
          <section>
            <SectionHeaderMobile icon={Target} title="Миссия и ценности" color="#8b5cf6" />
            <div className="rounded-3xl bg-white/[0.04] border border-white/[0.07] overflow-hidden divide-y divide-white/[0.06]">
              {values.map(v => {
                const Icon = v.icon;
                return (
                  <div key={v.title} className="flex items-start gap-3.5 px-4 py-4">
                    <div className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 mt-0.5" style={{ background: `${v.color}18`, border: `1px solid ${v.color}28` }}>
                      <Icon className="w-4.5 h-4.5" style={{ color: v.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-black text-white">{v.title}</p>
                      <p className="text-[12px] text-[#607080] leading-relaxed mt-0.5">{v.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
          <section>
            <SectionHeaderMobile icon={TrendingUp} title="История и планы" color="#10b981" />
            <div className="relative pl-4">
              <div className="absolute left-8 top-2 bottom-2 w-px bg-white/[0.06]" />
              <div className="flex flex-col gap-1">
                {timeline.map(item => (
                  <div key={item.year} className="flex items-start gap-4 py-3">
                    <div className="relative shrink-0 flex flex-col items-center">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center z-10" style={{ background: item.current ? `${item.color}25` : 'rgba(255,255,255,0.05)', border: `1px solid ${item.current ? item.color + '50' : 'rgba(255,255,255,0.08)'}` }}>
                        <span className="text-[9px] font-black" style={{ color: item.current ? item.color : '#607080' }}>{item.year}</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[13px] font-black text-white">{item.title}</p>
                        {item.current && <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">Сейчас</span>}
                      </div>
                      <p className="text-[11px] text-[#607080] mt-0.5 leading-snug">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
          <section>
            <SectionHeaderMobile icon={CheckCircle2} title="Почему выбирают нас" color="#10b981" />
            <div className="rounded-3xl bg-white/[0.04] border border-white/[0.07] overflow-hidden divide-y divide-white/[0.06]">
              {whyUs.map((item, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3.5">
                  <span className="text-[16px] shrink-0">{item.icon}</span>
                  <span className="flex-1 text-[13px] text-white font-medium leading-snug">{item.text}</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                </div>
              ))}
            </div>
          </section>
          <button onClick={() => navigate('/help')} className="w-full h-13 rounded-3xl flex items-center justify-center gap-3 font-black text-[15px] text-white active:scale-[0.98] transition-all" style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)', boxShadow: '0 4px 20px #1d4ed830' }}>
            <MessageSquare className="w-5 h-5" /> Написать в поддержку <ChevronRight className="w-4 h-4 opacity-60" />
          </button>
          <div className="flex items-center justify-center gap-4 py-2">
            <button onClick={() => navigate('/privacy-policy')} className="text-[11px] text-[#607080]/60 font-medium underline underline-offset-2 active:text-[#5ba3f5] transition-colors">Конфиденциальность</button>
            <span className="text-[11px] text-[#607080]/30">·</span>
            <button onClick={() => navigate('/terms-of-service')} className="text-[11px] text-[#607080]/60 font-medium underline underline-offset-2 active:text-[#5ba3f5] transition-colors">Условия</button>
          </div>
          <div className="flex flex-col items-center gap-1 py-2">
            <p className="text-[11px] text-[#607080]/60 font-medium">Ovora Cargo · v1.0.0</p>
            <p className="text-[11px] text-[#607080]/40">Душанбе, Таджикистан</p>
          </div>
        </div>
      </div>

      {/* ════════════════ DESKTOP ════════════════ */}
      <div className="hidden md:block min-h-screen" style={{ background: '#080f1a' }}>
        <style>{`
          @keyframes ab-up   { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
          @keyframes ab-in   { from{opacity:0} to{opacity:1} }
          @keyframes ab-pop  { from{opacity:0;transform:scale(.92)} to{opacity:1;transform:scale(1)} }
          @keyframes ab-line { from{height:0} to{height:100%} }
          @keyframes ab-shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
          .ab-s1{animation:ab-up .4s cubic-bezier(.22,1,.36,1) .05s both}
          .ab-s2{animation:ab-up .4s cubic-bezier(.22,1,.36,1) .12s both}
          .ab-s3{animation:ab-up .4s cubic-bezier(.22,1,.36,1) .19s both}
          .ab-s4{animation:ab-up .4s cubic-bezier(.22,1,.36,1) .26s both}
          .ab-s5{animation:ab-up .4s cubic-bezier(.22,1,.36,1) .33s both}
          .ab-stat-card {
            border-radius:20px; overflow:hidden;
            background:linear-gradient(145deg,#0e1e32,#0a1520);
            border:1px solid #1a2d42;
            transition:border-color .2s,box-shadow .2s,transform .2s;
          }
          .ab-stat-card:hover { border-color:#2a4565; box-shadow:0 12px 32px #00000055; transform:translateY(-4px); }
          .ab-feature-card {
            border-radius:22px; overflow:hidden; padding:22px;
            background:linear-gradient(145deg,#0e1e32,#0a1520);
            border:1px solid #1a2d42;
            transition:border-color .2s,box-shadow .2s,transform .2s;
          }
          .ab-feature-card:hover { border-color:#2a4565; box-shadow:0 12px 36px #00000060; transform:translateY(-3px); }
          .ab-why-row {
            display:flex; align-items:center; gap:14px;
            padding:14px 18px; border-radius:14px;
            background:linear-gradient(90deg,#0e1e3200,#0e1e3200);
            border:1px solid #1a2d3d;
            transition:background .18s,border-color .18s,transform .15s;
          }
          .ab-why-row:hover { background:linear-gradient(90deg,#0e1e32,#0a1520); border-color:#2a4060; transform:translateX(4px); }
          .ab-cta-btn {
            display:flex; align-items:center; justify-content:center; gap:10px;
            padding:14px 32px; border-radius:18px; font-size:15px; font-weight:800;
            cursor:pointer; border:none; font-family:inherit; color:#fff;
            background:linear-gradient(135deg,#1d4ed8,#5ba3f5);
            box-shadow:0 8px 28px #1d4ed840;
            transition:transform .2s ease,box-shadow .2s ease;
          }
          .ab-cta-btn:hover { transform:translateY(-2px); box-shadow:0 14px 36px #1d4ed860; }
          .ab-refresh-btn {
            display:flex; align-items:center; gap:6px;
            padding:7px 16px; border-radius:12px; font-size:12px; font-weight:700;
            cursor:pointer; border:none; font-family:inherit;
            background:#0e1e32; border:1px solid #1e2d3d; color:#4a7090;
            transition:background .15s,color .15s,transform .15s;
          }
          .ab-refresh-btn:hover { background:#152840; color:#5ba3f5; transform:translateY(-1px); }
          .ab-section-label {
            display:flex; align-items:center; gap:10px; margin-bottom:18px;
          }
        `}</style>

        {/* ── TOP BAR ── */}
        <div style={{ background:'#0a1220', borderBottomWidth:1, borderBottomStyle:'solid', borderBottomColor:'#ffffff08', animation:'ab-in .3s ease both' }}>
          <div className="max-w-7xl mx-auto px-10 py-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate(-1)}
                className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                style={{ background:'#ffffff0a', borderWidth:1, borderStyle:'solid', borderColor:'#ffffff0f', color:'#8a9bb0' }}>
                <ArrowLeft style={{ width:18, height:18 }} />
              </button>
              <div>
                <p style={{ fontSize:10, fontWeight:800, letterSpacing:'.18em', textTransform:'uppercase', color:'#3a5570' }}>Ovora Cargo</p>
                <h1 style={{ fontSize:22, fontWeight:900, color:'#fff', lineHeight:1.2 }}>О нас</h1>
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              {stats && (
                <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:'#3a5570', fontWeight:600 }}>
                  <div style={{ width:7, height:7, borderRadius:'50%', background:'#10b981', boxShadow:'0 0 8px #10b981', animation:'ab-pop 1.4s ease infinite alternate' }} />
                  Данные в реальном времени
                </div>
              )}
              <button onClick={fetchStats} className="ab-refresh-btn">
                <Activity style={{ width:13, height:13, animation: isLoading ? 'spin 1s linear infinite' : 'none' }} />
                Обновить
              </button>
            </div>
          </div>
        </div>

        {/* ── BODY ── */}
        <div className="max-w-7xl mx-auto px-10 py-8 flex gap-10 items-start">

          {/* ── LEFT STICKY PANEL ── */}
          <div style={{ width:300, flexShrink:0 }} className="sticky top-8 flex flex-col gap-5">

            {/* Brand card */}
            <div className="ab-s1 rounded-3xl overflow-hidden"
              style={{ background:'linear-gradient(160deg,#0f1f38,#0c1624)', borderWidth:1, borderStyle:'solid', borderColor:'#1a2d45', boxShadow:'0 24px 48px #00000060' }}>
              <div style={{ height:3, background:'linear-gradient(90deg,#1d4ed8,#5ba3f5,#10b981)' }} />
              <div style={{ padding:24 }}>
                {/* Logo */}
                <div style={{ position:'relative', display:'inline-block', marginBottom:18 }}>
                  <div style={{ width:68, height:68, borderRadius:22, display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,#1d4ed8,#0f2a70)', boxShadow:'0 10px 32px #1d4ed850' }}>
                    <Truck style={{ width:30, height:30, color:'#fff' }} />
                  </div>
                  <div style={{ position:'absolute', bottom:-4, right:-4, width:22, height:22, borderRadius:8, background:'#10b981', display:'flex', alignItems:'center', justifyContent:'center', borderWidth:2, borderStyle:'solid', borderColor:'#0c1624', boxShadow:'0 4px 10px #10b98150' }}>
                    <CheckCircle2 style={{ width:12, height:12, color:'#fff' }} />
                  </div>
                </div>
                <p style={{ fontSize:22, fontWeight:900, color:'#fff', lineHeight:1.1, marginBottom:6 }}>Ovora Cargo</p>
                <p style={{ fontSize:13, color:'#4a6580', lineHeight:1.7, marginBottom:16 }}>
                  Платформа для грузоперевозок и райдшеринга в Таджикистане
                </p>
                {/* Meta tags */}
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {[
                    { icon: Globe,  label:'С 2026 года',  color:'#5ba3f5' },
                    { icon: MapPin, label:'Душанбе 🇹🇯',  color:'#10b981' },
                  ].map(({ icon: Icon, label, color }) => (
                    <span key={label} style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'5px 10px', borderRadius:100, background:`${color}12`, borderWidth:1, borderStyle:'solid', borderColor:`${color}25`, fontSize:11, fontWeight:600, color }}>
                      <Icon style={{ width:11, height:11 }} /> {label}
                    </span>
                  ))}
                  <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'5px 10px', borderRadius:100, background:'#10b98112', borderWidth:1, borderStyle:'solid', borderColor:'#10b98125', fontSize:11, fontWeight:600, color:'#10b981' }}>
                    <span style={{ width:6, height:6, borderRadius:'50%', background:'#10b981', boxShadow:'0 0 6px #10b981', display:'inline-block' }} /> В сети
                  </span>
                </div>
              </div>
            </div>

            {/* Stats cards 2×2 */}
            <div className="ab-s2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {displayStats.map(s => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="ab-stat-card" style={{ padding:'16px', display:'flex', flexDirection:'column', alignItems:'center', gap:8, textAlign:'center' }}>
                    <div style={{ width:38, height:38, borderRadius:13, display:'flex', alignItems:'center', justifyContent:'center', background:`${s.color}18`, borderWidth:1, borderStyle:'solid', borderColor:`${s.color}30`, boxShadow:`0 4px 14px ${s.color}15` }}>
                      <Icon style={{ width:17, height:17, color:s.color }} />
                    </div>
                    <p style={{ fontSize:22, fontWeight:900, color:'#fff', lineHeight:1 }}>{s.value}</p>
                    <p style={{ fontSize:11, color:'#4a6580', fontWeight:600 }}>{s.label}</p>
                  </div>
                );
              })}
            </div>

            {/* CTA */}
            <div className="ab-s3">
              <button onClick={() => navigate('/help')} className="ab-cta-btn" style={{ width:'100%' }}>
                <MessageSquare style={{ width:17, height:17 }} />
                Написать в поддержку
              </button>
            </div>

            {/* Version badge */}
            <div className="ab-s4 rounded-2xl overflow-hidden"
              style={{ background:'#0e1e32', borderWidth:1, borderStyle:'solid', borderColor:'#1a2d42', padding:'14px 18px', display:'flex', alignItems:'center', gap:10 }}>
              <Sparkles style={{ width:15, height:15, color:'#f59e0b', flexShrink:0 }} />
              <div>
                <p style={{ fontSize:11, color:'#3a5570', fontWeight:700 }}>Версия приложения</p>
                <p style={{ fontSize:13, color:'#fff', fontWeight:800 }}>Ovora Cargo v1.0.0</p>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Main content ── */}
          <div style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column', gap:32 }}>

            {/* ── What we do ── */}
            <div className="ab-s1">
              <div className="ab-section-label">
                <div style={{ width:34, height:34, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', background:'#5ba3f520', borderWidth:1, borderStyle:'solid', borderColor:'#5ba3f530' }}>
                  <Rocket style={{ width:16, height:16, color:'#5ba3f5' }} />
                </div>
                <div>
                  <p style={{ fontSize:10, fontWeight:800, textTransform:'uppercase', letterSpacing:'.16em', color:'#3a5570' }}>О платформе</p>
                  <p style={{ fontSize:19, fontWeight:900, color:'#fff', lineHeight:1.1 }}>Что мы делаем</p>
                </div>
              </div>
              <div style={{ borderRadius:24, overflow:'hidden', background:'linear-gradient(145deg,#0e1e32,#0a1520)', borderWidth:1, borderStyle:'solid', borderColor:'#1a2d42', boxShadow:'0 16px 40px #00000050' }}>
                <div style={{ height:2, background:'linear-gradient(90deg,#5ba3f5,#10b981,transparent)' }} />
                <div style={{ padding:28 }}>
                  <p style={{ fontSize:15, lineHeight:1.8, color:'#7a9ab5', marginBottom:18 }}>
                    <span style={{ fontWeight:900, color:'#fff' }}>Ovora Cargo</span> — современное приложение, которое объединяет
                    водителей, готовых перевезти грузы или пассажиров, с людьми и компаниями, которым нужна доставка.
                  </p>
                  <div style={{ background:'#5ba3f510', borderRadius:16, borderWidth:1, borderStyle:'solid', borderColor:'#5ba3f525', padding:'14px 18px', marginBottom:18 }}>
                    <p style={{ fontSize:15, color:'#5ba3f5', fontWeight:800, lineHeight:1.5 }}>
                      «Водитель создаёт — отправитель находит»
                    </p>
                  </div>
                  <p style={{ fontSize:14, lineHeight:1.75, color:'#4a6580' }}>
                    Оплата проходит через встроенную систему приложения — безопасно и прозрачно. Мы строим будущее логистики в Таджикистане.
                  </p>
                </div>
              </div>
            </div>

            {/* ── Features 2×2 grid ── */}
            <div className="ab-s2">
              <div className="ab-section-label">
                <div style={{ width:34, height:34, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', background:'#f59e0b20', borderWidth:1, borderStyle:'solid', borderColor:'#f59e0b30' }}>
                  <Award style={{ width:16, height:16, color:'#f59e0b' }} />
                </div>
                <div>
                  <p style={{ fontSize:10, fontWeight:800, textTransform:'uppercase', letterSpacing:'.16em', color:'#3a5570' }}>Почему мы</p>
                  <p style={{ fontSize:19, fontWeight:900, color:'#fff', lineHeight:1.1 }}>Наши преимущества</p>
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                {features.map((f, i) => {
                  const Icon = f.icon;
                  return (
                    <div key={f.title} className="ab-feature-card" style={{ animationDelay:`${i * 60}ms` }}>
                      <div style={{ height:2, background:`linear-gradient(90deg,${f.color},transparent)`, margin:'-22px -22px 18px -22px' }} />
                      <div style={{ width:46, height:46, borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center', background:`${f.color}18`, borderWidth:1, borderStyle:'solid', borderColor:`${f.color}30`, boxShadow:`0 6px 18px ${f.color}15`, marginBottom:14 }}>
                        <Icon style={{ width:20, height:20, color:f.color }} />
                      </div>
                      <p style={{ fontSize:16, fontWeight:900, color:'#fff', marginBottom:6 }}>{f.title}</p>
                      <p style={{ fontSize:13, color:'#4a6580', lineHeight:1.65 }}>{f.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Mission + Timeline side by side ── */}
            <div className="ab-s3" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              {/* Mission */}
              <div>
                <div className="ab-section-label">
                  <div style={{ width:30, height:30, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', background:'#8b5cf620', borderWidth:1, borderStyle:'solid', borderColor:'#8b5cf630' }}>
                    <Target style={{ width:14, height:14, color:'#8b5cf6' }} />
                  </div>
                  <p style={{ fontSize:16, fontWeight:800, color:'#fff' }}>Миссия и ценности</p>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {values.map(v => {
                    const Icon = v.icon;
                    return (
                      <div key={v.title} style={{ borderRadius:16, overflow:'hidden', background:'linear-gradient(145deg,#0e1e32,#0a1520)', borderWidth:1, borderStyle:'solid', borderColor:'#1a2d42', padding:'16px 18px', display:'flex', alignItems:'flex-start', gap:12 }}>
                        <div style={{ width:36, height:36, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', background:`${v.color}18`, borderWidth:1, borderStyle:'solid', borderColor:`${v.color}28`, flexShrink:0, boxShadow:`0 4px 12px ${v.color}12` }}>
                          <Icon style={{ width:16, height:16, color:v.color }} />
                        </div>
                        <div>
                          <p style={{ fontSize:13, fontWeight:800, color:'#fff', marginBottom:4 }}>{v.title}</p>
                          <p style={{ fontSize:12, color:'#4a6580', lineHeight:1.65 }}>{v.text}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Timeline */}
              <div>
                <div className="ab-section-label">
                  <div style={{ width:30, height:30, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', background:'#10b98120', borderWidth:1, borderStyle:'solid', borderColor:'#10b98130' }}>
                    <TrendingUp style={{ width:14, height:14, color:'#10b981' }} />
                  </div>
                  <p style={{ fontSize:16, fontWeight:800, color:'#fff' }}>История и планы</p>
                </div>
                <div style={{ borderRadius:20, overflow:'hidden', background:'linear-gradient(145deg,#0e1e32,#0a1520)', borderWidth:1, borderStyle:'solid', borderColor:'#1a2d42', padding:'20px 22px', position:'relative' }}>
                  {/* Vertical line */}
                  <div style={{ position:'absolute', left:42, top:24, bottom:24, width:1, background:'linear-gradient(180deg,#10b98150,#5ba3f530,#8b5cf630,#f59e0b30)' }} />
                  <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
                    {timeline.map((item, i) => (
                      <div key={item.year} style={{ display:'flex', alignItems:'flex-start', gap:16 }}>
                        {/* Year badge */}
                        <div style={{ width:40, height:40, borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', background: item.current ? `${item.color}22` : '#0a1520', borderWidth:1, borderStyle:'solid', borderColor: item.current ? `${item.color}55` : '#1a2d3d', flexShrink:0, zIndex:1, boxShadow: item.current ? `0 0 16px ${item.color}30` : 'none' }}>
                          <span style={{ fontSize:9, fontWeight:900, color: item.current ? item.color : '#3a5570' }}>{item.year}</span>
                        </div>
                        <div style={{ flex:1, paddingTop:4 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                            <p style={{ fontSize:13, fontWeight:800, color:'#fff' }}>{item.title}</p>
                            {item.current && (
                              <span style={{ fontSize:9, fontWeight:900, padding:'2px 8px', borderRadius:100, background:'#10b98118', color:'#10b981', borderWidth:1, borderStyle:'solid', borderColor:'#10b98130' }}>Сейчас</span>
                            )}
                          </div>
                          <p style={{ fontSize:11, color:'#4a6580', lineHeight:1.6 }}>{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Why us ── */}
            <div className="ab-s4">
              <div className="ab-section-label">
                <div style={{ width:34, height:34, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', background:'#10b98120', borderWidth:1, borderStyle:'solid', borderColor:'#10b98130' }}>
                  <CheckCircle2 style={{ width:16, height:16, color:'#10b981' }} />
                </div>
                <div>
                  <p style={{ fontSize:10, fontWeight:800, textTransform:'uppercase', letterSpacing:'.16em', color:'#3a5570' }}>Наши плюсы</p>
                  <p style={{ fontSize:19, fontWeight:900, color:'#fff', lineHeight:1.1 }}>Почему выбирают нас</p>
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
                {whyUs.map((item, i) => (
                  <div key={i} className="ab-why-row" style={{ animationDelay:`${i * 40}ms` }}>
                    <span style={{ fontSize:18, flexShrink:0 }}>{item.icon}</span>
                    <span style={{ fontSize:12, color:'#8ab0cc', fontWeight:500, lineHeight:1.55, flex:1 }}>{item.text}</span>
                    <CheckCircle2 style={{ width:14, height:14, color:'#10b981', flexShrink:0 }} />
                  </div>
                ))}
              </div>
            </div>

            {/* ── Footer ── */}
            <div className="ab-s5" style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, padding:'12px 0 8px', borderTopWidth:1, borderTopStyle:'solid', borderTopColor:'#1a2d3d' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ width:6, height:6, borderRadius:'50%', background:'#10b981', boxShadow:'0 0 8px #10b981' }} />
                <p style={{ fontSize:12, color:'#2a4060', fontWeight:600 }}>Ovora Cargo · v1.0.0 · Душанбе, Таджикистан</p>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <button onClick={() => navigate('/privacy-policy')} style={{ fontSize:11, color:'#3a5570', fontWeight:500, background:'none', border:'none', cursor:'pointer', textDecoration:'underline', textUnderlineOffset:2, transition:'color .15s' }}>Конфиденциальность</button>
                <span style={{ fontSize:11, color:'#1e2d3d' }}>·</span>
                <button onClick={() => navigate('/terms-of-service')} style={{ fontSize:11, color:'#3a5570', fontWeight:500, background:'none', border:'none', cursor:'pointer', textDecoration:'underline', textUnderlineOffset:2, transition:'color .15s' }}>Условия</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Mobile section header ── */
function SectionHeaderMobile({ icon: Icon, title, color }: { icon: any; title: string; color: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: `${color}18`, border: `1px solid ${color}28` }}>
        <Icon className="w-3.5 h-3.5" style={{ color }} />
      </div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#607080]">{title}</p>
    </div>
  );
}