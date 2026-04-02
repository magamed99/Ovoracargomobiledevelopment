import { useState } from 'react';
import {
  ArrowLeft, ChevronDown, ChevronUp, MessageSquare,
  Send, CheckCircle2, Truck, Package,
  CreditCard, Shield, Star, HelpCircle,
  Phone, Mail, MapPin, Clock, Search,
  Headphones, BookOpen, Zap, Sparkles, ExternalLink,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

interface FAQ { q: string; a: string; icon: any; category: string; }

const FAQS: FAQ[] = [
  { category: 'Регистрация', icon: Shield,    q: 'Как зарегистрироваться в Ovora Cargo?',  a: 'Нажмите «Начать» на главном экране, выберите роль (Водитель или Отправитель), введите ваш email — получите код подтверждения и заполните профиль.' },
  { category: 'Регистрация', icon: Shield,    q: 'Почему мне нужно выбрать роль?',          a: 'Водители создают объявления о поездках и принимают заявки. Отправители ищут подходящие поездки и подают заявки. Роль определяет функционал в приложении.' },
  { category: 'Поездки',    icon: Truck,      q: 'Как водителю создать объявление?',        a: 'Перейдите в раздел «Поиск» — там водители видят форму создания поездки. Укажите маршрут, дату, время, количество мест и цену. Объявление сразу появится в поиске.' },
  { category: 'Поездки',    icon: Truck,      q: 'Как отправителю найти поездку?',          a: 'Откройте раздел «Поиск», укажите откуда и куда, выберите дату и нажмите «Найти». Система покажет все подходящие поездки от водителей.' },
  { category: 'Заявки',     icon: Package,    q: 'Как подать заявку на поездку?',           a: 'Откройте понравившуюся поездку, нажмите «Подать заявку», укажите количество мест или вес груза и ваше имя. Водитель получит уведомление.' },
  { category: 'Заявки',     icon: Package,    q: 'Может ли водитель отклонить заявку?',     a: 'Да, водитель сам решает — принять или отклонить каждую заявку. Отправитель получает уведомление о решении.' },
  { category: 'Оплата',     icon: CreditCard, q: 'Как происходит оплата?',                  a: 'Оплата производится через встроенную систему приложения Ovora Cargo. После подтверждения поездки средства списываются с вашего счёта автоматически — безопасно и быстро.' },
  { category: 'Оплата',     icon: CreditCard, q: 'Как узнать стоимость перевозки?',         a: 'Стоимость рассчитывается автоматически: для пассажиров — цена за место × количество мест, для груза — цена за кг × вес груза. Итоговая сумма отображается до подтверждения заказа.' },
  { category: 'Рейтинг',    icon: Star,       q: 'Как работает система рейтинга?',          a: 'После завершения поездки обе стороны могут оставить отзыв с оценкой от 1 до 5 звёзд. Рейтинг отображается в профиле.' },
  { category: 'Рейтинг',    icon: Star,       q: 'Как повысить рейтинг?',                   a: 'Будьте пунктуальны, вежливы и коммуникабельны. Своевременно отвечайте на сообщения и выполняйте обязательства.' },
];

const CATEGORIES = [...new Set(FAQS.map(f => f.category))];

const CATEGORY_META: Record<string, { color: string; icon: any }> = {
  'Регистрация': { color: '#8b5cf6', icon: Shield },
  'Поездки':     { color: '#5ba3f5', icon: Truck },
  'Заявки':      { color: '#10b981', icon: Package },
  'Оплата':      { color: '#f59e0b', icon: CreditCard },
  'Рейтинг':     { color: '#ec4899', icon: Star },
};

const CONTACTS = [
  { icon: Phone,         label: 'Телефон',  value: '+992 900 55 00 00', sub: 'Пн–Вс 08:00–22:00', color: '#10b981', action: () => window.open('tel:+992900550000') },
  { icon: Mail,          label: 'E-mail',   value: 'support@ovora.tj',  sub: 'Ответ до 24 часов',  color: '#5ba3f5', action: () => window.open('mailto:support@ovora.tj') },
  { icon: MessageSquare, label: 'Telegram', value: '@OvoraHelp',        sub: 'Быстрые ответы',     color: '#3b82f6', action: () => window.open('https://t.me/OvoraHelp') },
];

export function HelpPage() {
  const navigate = useNavigate();

  const [openFAQ,        setOpenFAQ]        = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState('Все');
  const [feedbackText,   setFeedbackText]   = useState('');
  const [feedbackSent,   setFeedbackSent]   = useState(false);
  const [sending,        setSending]        = useState(false);
  const [searchQuery,    setSearchQuery]    = useState('');

  const filteredFAQs = FAQS.filter(f => {
    const matchCat    = activeCategory === 'Все' || f.category === activeCategory;
    const matchSearch = !searchQuery || f.q.toLowerCase().includes(searchQuery.toLowerCase()) || f.a.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleSendFeedback = () => {
    if (!feedbackText.trim()) { toast.error('Введите текст обращения'); return; }
    setSending(true);
    setTimeout(() => { setSending(false); setFeedbackSent(true); setFeedbackText(''); }, 1500);
  };

  /* ══════════════════════════════════════════════════════════ */
  return (
    <div className="font-['Sora'] bg-[#0e1621] text-white min-h-screen">

      {/* ════════════════ MOBILE (не трогаем) ════════════════ */}
      <div className="md:hidden flex flex-col min-h-screen max-w-3xl mx-auto">
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0" style={{ background: 'linear-gradient(145deg, #0f2744 0%, #0e1621 60%)' }} />
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full" style={{ background: 'radial-gradient(circle, #14b8a6 0%, transparent 70%)', opacity: 0.18 }} />
            <div className="absolute top-10 -left-10 w-40 h-40 rounded-full" style={{ background: 'radial-gradient(circle, #1d4ed8 0%, transparent 70%)', opacity: 0.20 }} />
          </div>
          <div className="relative flex items-center gap-3 px-4" style={{ paddingTop: 'max(52px, env(safe-area-inset-top, 52px))', paddingBottom: 4 }}>
            <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/[0.07] border border-white/10 text-white active:scale-90 transition-all shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <p className="text-[10px] font-semibold tracking-widest uppercase text-[#607080]">Ovora Cargo</p>
              <h1 className="text-[20px] font-black text-white leading-tight">Помощь</h1>
            </div>
          </div>
          <div className="relative px-4 pt-5 pb-6 flex flex-col gap-3">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#607080] mb-1">Связаться с нами</p>
            <div className="grid grid-cols-3 gap-2.5">
              {CONTACTS.map(c => {
                const Icon = c.icon;
                return (
                  <button key={c.label} onClick={c.action} className="flex flex-col items-center gap-2 p-3.5 rounded-2xl border border-white/[0.08] bg-white/[0.04] active:scale-95 transition-all">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: `${c.color}18`, border: `1px solid ${c.color}30` }}>
                      <Icon className="w-5 h-5" style={{ color: c.color }} />
                    </div>
                    <div className="text-center">
                      <p className="text-[12px] font-black text-white">{c.label}</p>
                      <p className="text-[10px] text-[#607080] mt-0.5 leading-tight">{c.sub}</p>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="rounded-2xl bg-white/[0.04] border border-white/[0.07] overflow-hidden divide-y divide-white/[0.06]">
              {[
                { icon: MapPin, label: 'Адрес', value: 'г. Душанбе, Таджикистан', color: '#f59e0b' },
                { icon: Clock,  label: 'Режим работы', value: 'Пн–Вс: 08:00 – 22:00', color: '#607080' },
              ].map(row => {
                const Icon = row.icon;
                return (
                  <div key={row.label} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${row.color}18`, border: `1px solid ${row.color}28` }}>
                      <Icon className="w-4 h-4" style={{ color: row.color }} />
                    </div>
                    <div>
                      <p className="text-[10px] text-[#607080] font-semibold">{row.label}</p>
                      <p className="text-[13px] font-semibold text-white">{row.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex-1 pb-32 flex flex-col gap-4 px-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#607080]" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Поиск по вопросам..."
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/[0.05] border border-white/[0.08] text-[14px] text-white placeholder-[#607080] outline-none focus:border-[#5ba3f5]/40 transition-all" />
          </div>
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#5ba3f5]" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#607080]">Частые вопросы</p>
              </div>
              <span className="text-[11px] text-[#607080]">{filteredFAQs.length} вопр.</span>
            </div>
            {!searchQuery && (
              <div className="flex gap-2 pb-3 mb-1" style={{ overflowX: 'auto', scrollbarWidth: 'none' }}>
                <CategoryPill label="Все" active={activeCategory === 'Все'} color="#5ba3f5" icon={HelpCircle} onClick={() => setActiveCategory('Все')} />
                {CATEGORIES.map(cat => {
                  const meta = CATEGORY_META[cat] || { color: '#607080', icon: HelpCircle };
                  return <CategoryPill key={cat} label={cat} active={activeCategory === cat} color={meta.color} icon={meta.icon} onClick={() => { setActiveCategory(cat); setOpenFAQ(null); }} />;
                })}
              </div>
            )}
            <div className="rounded-3xl bg-white/[0.04] border border-white/[0.07] overflow-hidden divide-y divide-white/[0.06]">
              {filteredFAQs.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 px-4">
                  <HelpCircle className="w-8 h-8 text-[#607080]" />
                  <p className="text-[14px] font-bold text-white">Ничего не найдено</p>
                  <p className="text-[12px] text-[#607080] text-center">Попробуйте другой запрос или напишите нам</p>
                </div>
              ) : filteredFAQs.map((faq, i) => {
                const isOpen = openFAQ === i;
                const Icon = faq.icon;
                const meta = CATEGORY_META[faq.category] || { color: '#607080' };
                return (
                  <div key={i}>
                    <button onClick={() => setOpenFAQ(isOpen ? null : i)} className="w-full flex items-start gap-3.5 px-4 py-4 text-left hover:bg-white/[0.03] transition-all">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ background: `${meta.color}18`, border: `1px solid ${meta.color}28` }}>
                        <Icon className="w-4 h-4" style={{ color: meta.color }} />
                      </div>
                      <p className="flex-1 text-[14px] font-semibold leading-snug text-white">{faq.q}</p>
                      <div className="shrink-0 mt-0.5">
                        {isOpen ? <ChevronUp className="w-4 h-4 text-[#607080]" /> : <ChevronDown className="w-4 h-4 text-[#607080]" />}
                      </div>
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 pt-0">
                        <div className="ml-11 rounded-2xl bg-white/[0.04] border border-white/[0.06] px-4 py-3">
                          <p className="text-[13px] leading-relaxed text-[#8899aa]">{faq.a}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Headphones className="w-4 h-4 text-[#5ba3f5]" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#607080]">Написать обращение</p>
            </div>
            <div className="rounded-3xl bg-white/[0.04] border border-white/[0.07] overflow-hidden">
              {feedbackSent ? (
                <div className="flex flex-col items-center gap-3 py-10 px-4">
                  <div className="w-16 h-16 rounded-3xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-[15px] font-black text-white">Обращение отправлено!</p>
                    <p className="text-[12px] text-[#607080] mt-1">Ответим в течение 24 часов</p>
                  </div>
                  <button onClick={() => setFeedbackSent(false)} className="mt-1 px-5 py-2.5 rounded-2xl bg-[#5ba3f5]/15 border border-[#5ba3f5]/25 text-[#5ba3f5] text-[13px] font-bold active:scale-95 transition-all">
                    Отправить ещё
                  </button>
                </div>
              ) : (
                <div className="p-4 flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#5ba3f5]/15 border border-[#5ba3f5]/25 flex items-center justify-center shrink-0 mt-0.5">
                      <Zap className="w-5 h-5 text-[#5ba3f5]" />
                    </div>
                    <div>
                      <p className="text-[14px] font-bold text-white">Не нашли ответ?</p>
                      <p className="text-[12px] text-[#607080] mt-0.5">Опишите проблему — ответим за 24 часа</p>
                    </div>
                  </div>
                  <textarea value={feedbackText} onChange={e => setFeedbackText(e.target.value)} placeholder="Опишите вашу проблему подробно..." rows={4}
                    className="w-full px-4 py-3 rounded-2xl bg-white/[0.05] border border-white/[0.08] text-[14px] text-white placeholder-[#607080] outline-none focus:border-[#5ba3f5]/40 resize-none transition-all" />
                  <button onClick={handleSendFeedback} disabled={sending || !feedbackText.trim()}
                    className="w-full h-12 rounded-2xl bg-[#5ba3f5] disabled:opacity-40 text-white font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-all text-[14px]">
                    <Send className="w-4 h-4" />
                    {sending ? 'Отправляем...' : 'Отправить'}
                  </button>
                </div>
              )}
            </div>
          </section>
          <div className="flex flex-col items-center gap-1 py-4">
            <p className="text-[11px] text-[#607080]/60 font-medium">Ovora Cargo · v1.0.0</p>
            <p className="text-[11px] text-[#607080]/40">Разработано для рынка Таджикистана 🇹🇯</p>
          </div>
        </div>
      </div>

      {/* ════════════════ DESKTOP ════════════════ */}
      <div className="hidden md:block min-h-screen" style={{ background: '#080f1a' }}>
        <style>{`
          @keyframes hp-up  { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
          @keyframes hp-in  { from{opacity:0} to{opacity:1} }
          @keyframes hp-faq { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
          .hp-section { animation: hp-up .44s cubic-bezier(.22,1,.36,1) both; }
          .hp-section:nth-child(1){animation-delay:.05s}
          .hp-section:nth-child(2){animation-delay:.12s}
          .hp-section:nth-child(3){animation-delay:.19s}
          .hp-section:nth-child(4){animation-delay:.26s}
          .hp-contact-card {
            border-radius:18px; overflow:hidden; cursor:pointer;
            border:1px solid #1a2d42;
            background: linear-gradient(145deg,#0e1e32,#0a1520);
            transition: border-color .2s, box-shadow .2s, transform .2s;
          }
          .hp-contact-card:hover { border-color:#2a4060; box-shadow:0 10px 32px #00000055; transform:translateY(-3px); }
          .hp-faq-item {
            border-radius:16px; overflow:hidden;
            border:1px solid #1a2d3d;
            background:linear-gradient(145deg,#0e1e32,#0a1520);
            transition: border-color .2s, box-shadow .2s;
            animation: hp-faq .35s ease both;
          }
          .hp-faq-item:hover { border-color:#2a4060; box-shadow:0 6px 20px #00000040; }
          .hp-faq-item.open { border-color:#5ba3f540; box-shadow:0 0 0 1px #5ba3f510; }
          .hp-cat-pill {
            display:inline-flex; align-items:center; gap:6px;
            padding:7px 14px; border-radius:100px; font-size:12px; font-weight:700;
            cursor:pointer; border:none; font-family:inherit;
            transition: background .18s, color .18s, box-shadow .18s, transform .15s;
            white-space:nowrap;
          }
          .hp-cat-pill:hover { transform:translateY(-1px); }
          .hp-send-btn {
            width:100%; display:flex; align-items:center; justify-content:center; gap:8px;
            padding:14px; border-radius:16px; font-size:14px; font-weight:800;
            cursor:pointer; border:none; font-family:inherit; color:#fff;
            background:linear-gradient(135deg,#1d4ed8,#5ba3f5);
            box-shadow:0 8px 24px #1d4ed840;
            transition:transform .2s ease,box-shadow .2s ease,opacity .2s;
          }
          .hp-send-btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 12px 32px #1d4ed855;}
          .hp-send-btn:disabled{opacity:.4;cursor:not-allowed;}
          .hp-inp {
            width:100%; padding:12px 16px; border-radius:14px; font-size:14px; font-weight:500;
            outline:none; font-family:inherit; color:#e2e8f0;
            background:#0a1520; border:1px solid #1e2d3d;
            transition:border-color .2s;
          }
          .hp-inp:focus{border-color:#5ba3f550;}
          .hp-inp::placeholder{color:#3a5570;}
          .hp-ext-btn {
            display:flex; align-items:center; gap:6px;
            padding:8px 16px; border-radius:12px; font-size:12px; font-weight:700;
            cursor:pointer; border:none; font-family:inherit;
            transition:background .18s,transform .15s;
          }
          .hp-ext-btn:hover{transform:translateY(-1px);}
        `}</style>

        {/* ── TOP BAR ── */}
        <div style={{ background:'#0a1220', borderBottomWidth:1, borderBottomStyle:'solid', borderBottomColor:'#ffffff08', animation:'hp-in .3s ease both' }}>
          <div className="max-w-7xl mx-auto px-10 py-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate(-1)}
                className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                style={{ background:'#ffffff0a', borderWidth:1, borderStyle:'solid', borderColor:'#ffffff0f', color:'#8a9bb0' }}>
                <ArrowLeft style={{ width:18, height:18 }} />
              </button>
              <div>
                <p style={{ fontSize:10, fontWeight:800, letterSpacing:'.18em', textTransform:'uppercase', color:'#3a5570' }}>Ovora Cargo</p>
                <h1 style={{ fontSize:22, fontWeight:900, color:'#fff', lineHeight:1.2 }}>Центр помощи</h1>
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:11, color:'#3a5570' }}>
              <Sparkles style={{ width:14, height:14, color:'#f59e0b' }} />
              <span style={{ fontWeight:600 }}>v1.0.0 · 🇹🇯 Таджикистан</span>
            </div>
          </div>
        </div>

        {/* ── BODY ── */}
        <div className="max-w-7xl mx-auto px-10 py-8 flex gap-8 items-start">

          {/* ── LEFT SIDEBAR ── */}
          <div style={{ width:300, flexShrink:0 }} className="sticky top-8 flex flex-col gap-5">

            {/* Hero card */}
            <div className="hp-section rounded-3xl overflow-hidden"
              style={{ background:'linear-gradient(160deg,#0f1f38,#0c1624)', borderWidth:1, borderStyle:'solid', borderColor:'#1a2d45', boxShadow:'0 24px 48px #00000060' }}>
              <div style={{ height:3, background:'linear-gradient(90deg,#1d4ed8,#5ba3f5,#14b8a6)' }} />
              <div style={{ padding:24 }}>
                <div style={{ width:52, height:52, borderRadius:18, display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,#1d4ed8,#5ba3f5)', boxShadow:'0 8px 24px #1d4ed850', marginBottom:16 }}>
                  <Headphones style={{ width:24, height:24, color:'#fff' }} />
                </div>
                <p style={{ fontSize:20, fontWeight:900, color:'#fff', marginBottom:6, lineHeight:1.2 }}>Как мы можем помочь?</p>
                <p style={{ fontSize:13, color:'#4a6580', lineHeight:1.7 }}>
                  Найдите ответ в базе знаний или напишите нашей команде поддержки — ответим в течение 24 часов.
                </p>
              </div>
            </div>

            {/* Contacts */}
            <div className="hp-section flex flex-col gap-3">
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:2 }}>
                <div style={{ width:6, height:6, borderRadius:'50%', background:'#5ba3f5', boxShadow:'0 0 8px #5ba3f5' }} />
                <span style={{ fontSize:11, fontWeight:800, textTransform:'uppercase', letterSpacing:'.16em', color:'#3a5570' }}>Связаться</span>
                <div style={{ flex:1, height:1, background:'linear-gradient(90deg,#1e2d3d,transparent)' }} />
              </div>
              {CONTACTS.map(c => {
                const Icon = c.icon;
                return (
                  <button key={c.label} onClick={c.action} className="hp-contact-card" style={{ width:'100%', textAlign:'left', padding:'16px 18px', display:'flex', alignItems:'center', gap:14 }}>
                    <div style={{ width:44, height:44, borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', background:`${c.color}18`, borderWidth:1, borderStyle:'solid', borderColor:`${c.color}30`, flexShrink:0, boxShadow:`0 4px 14px ${c.color}15` }}>
                      <Icon style={{ width:20, height:20, color:c.color }} />
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <p style={{ fontSize:14, fontWeight:800, color:'#fff' }}>{c.label}</p>
                        <ExternalLink style={{ width:11, height:11, color:'#3a5570' }} />
                      </div>
                      <p style={{ fontSize:12, color:c.color, fontWeight:600 }}>{c.value}</p>
                      <p style={{ fontSize:11, color:'#3a5570' }}>{c.sub}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Info card */}
            <div className="hp-section rounded-2xl overflow-hidden"
              style={{ background:'#0e1e32', borderWidth:1, borderStyle:'solid', borderColor:'#1a2d42' }}>
              <div style={{ padding:'14px 18px', borderBottomWidth:1, borderBottomStyle:'solid', borderBottomColor:'#1a2d3d' }}>
                <span style={{ fontSize:11, fontWeight:800, textTransform:'uppercase', letterSpacing:'.14em', color:'#3a5570' }}>Информация</span>
              </div>
              <div style={{ padding:'14px 18px', display:'flex', flexDirection:'column', gap:12 }}>
                {[
                  { icon: MapPin, label:'Адрес',         value:'г. Душанбе, Таджикистан', color:'#f59e0b' },
                  { icon: Clock,  label:'Режим работы',  value:'Пн–Вс: 08:00 – 22:00',    color:'#10b981' },
                ].map(row => {
                  const Icon = row.icon;
                  return (
                    <div key={row.label} style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:34, height:34, borderRadius:11, display:'flex', alignItems:'center', justifyContent:'center', background:`${row.color}18`, borderWidth:1, borderStyle:'solid', borderColor:`${row.color}28`, flexShrink:0 }}>
                        <Icon style={{ width:15, height:15, color:row.color }} />
                      </div>
                      <div>
                        <p style={{ fontSize:10, color:'#3a5570', fontWeight:700, textTransform:'uppercase', letterSpacing:'.1em' }}>{row.label}</p>
                        <p style={{ fontSize:13, fontWeight:600, color:'#fff' }}>{row.value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── RIGHT: Main content ── */}
          <div style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column', gap:28 }}>

            {/* Search bar */}
            <div className="hp-section" style={{ position:'relative' }}>
              <Search style={{ position:'absolute', left:16, top:'50%', transform:'translateY(-50%)', width:16, height:16, color:'#3a5570' }} />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Поиск по вопросам и ответам..."
                className="hp-inp"
                style={{ paddingLeft:44, fontSize:15 }}
              />
            </div>

            {/* FAQ section */}
            <div className="hp-section">
              {/* Header */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:32, height:32, borderRadius:11, display:'flex', alignItems:'center', justifyContent:'center', background:'#5ba3f520', borderWidth:1, borderStyle:'solid', borderColor:'#5ba3f530' }}>
                    <BookOpen style={{ width:15, height:15, color:'#5ba3f5' }} />
                  </div>
                  <div>
                    <p style={{ fontSize:10, fontWeight:800, textTransform:'uppercase', letterSpacing:'.16em', color:'#3a5570' }}>База знаний</p>
                    <p style={{ fontSize:18, fontWeight:900, color:'#fff', lineHeight:1.1 }}>Частые вопросы</p>
                  </div>
                </div>
                <span style={{ fontSize:12, fontWeight:600, color:'#3a5570' }}>{filteredFAQs.length} вопросов</span>
              </div>

              {/* Category pills */}
              {!searchQuery && (
                <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:16 }}>
                  {[{ label:'Все', color:'#5ba3f5', icon: HelpCircle }, ...CATEGORIES.map(c => ({ label:c, ...CATEGORY_META[c] }))].map(({ label, color, icon: Icon }) => {
                    const isActive = activeCategory === label;
                    return (
                      <button key={label}
                        className="hp-cat-pill"
                        onClick={() => { setActiveCategory(label); setOpenFAQ(null); }}
                        style={{ background: isActive ? `${color}22` : '#0e1e32', color: isActive ? color : '#4a6580', borderWidth:1, borderStyle:'solid', borderColor: isActive ? `${color}50` : '#1a2d42', boxShadow: isActive ? `0 4px 14px ${color}20` : 'none' }}>
                        <Icon style={{ width:13, height:13 }} />
                        {label}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* FAQ list */}
              {filteredFAQs.length === 0 ? (
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'60px 0', gap:12 }}>
                  <div style={{ width:60, height:60, borderRadius:20, display:'flex', alignItems:'center', justifyContent:'center', background:'#0e1e32', borderWidth:1, borderStyle:'solid', borderColor:'#1a2d42' }}>
                    <HelpCircle style={{ width:26, height:26, color:'#2a4060' }} />
                  </div>
                  <p style={{ fontSize:18, fontWeight:800, color:'#fff' }}>Ничего не найдено</p>
                  <p style={{ fontSize:13, color:'#3a5570', textAlign:'center' }}>Попробуйте другой запрос или напишите нам</p>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {filteredFAQs.map((faq, i) => {
                    const isOpen = openFAQ === i;
                    const Icon   = faq.icon;
                    const meta   = CATEGORY_META[faq.category] || { color:'#607080' };
                    return (
                      <div key={i} className={`hp-faq-item${isOpen ? ' open' : ''}`} style={{ animationDelay:`${i * 40}ms` }}>
                        <button
                          onClick={() => setOpenFAQ(isOpen ? null : i)}
                          style={{ width:'100%', display:'flex', alignItems:'flex-start', gap:14, padding:'18px 20px', textAlign:'left', background:'transparent', border:'none', cursor:'pointer', fontFamily:'inherit' }}>
                          <div style={{ width:38, height:38, borderRadius:13, display:'flex', alignItems:'center', justifyContent:'center', background:`${meta.color}18`, borderWidth:1, borderStyle:'solid', borderColor:`${meta.color}30`, flexShrink:0, boxShadow:`0 4px 12px ${meta.color}12` }}>
                            <Icon style={{ width:17, height:17, color:meta.color }} />
                          </div>
                          <div style={{ flex:1 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:2 }}>
                              <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:100, background:`${meta.color}15`, color:meta.color, borderWidth:1, borderStyle:'solid', borderColor:`${meta.color}25` }}>
                                {faq.category}
                              </span>
                            </div>
                            <p style={{ fontSize:15, fontWeight:700, color:'#fff', lineHeight:1.4 }}>{faq.q}</p>
                          </div>
                          <div style={{ flexShrink:0, marginTop:2, width:28, height:28, borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', background: isOpen ? '#5ba3f520' : '#0a1520', transition:'background .2s' }}>
                            {isOpen
                              ? <ChevronUp style={{ width:15, height:15, color:'#5ba3f5' }} />
                              : <ChevronDown style={{ width:15, height:15, color:'#4a6580' }} />
                            }
                          </div>
                        </button>
                        {isOpen && (
                          <div style={{ padding:'0 20px 20px', paddingLeft:72 }}>
                            <div style={{ borderRadius:14, background:'#080f1a', borderWidth:1, borderStyle:'solid', borderColor:'#1a2d3d', padding:'14px 18px' }}>
                              <p style={{ fontSize:14, lineHeight:1.75, color:'#7a9ab5' }}>{faq.a}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Feedback form */}
            <div className="hp-section rounded-3xl overflow-hidden"
              style={{ background:'linear-gradient(145deg,#0e1e32,#0a1520)', borderWidth:1, borderStyle:'solid', borderColor:'#1a2d42', boxShadow:'0 16px 40px #00000050' }}>
              <div style={{ height:2, background:'linear-gradient(90deg,#5ba3f5,#10b981,transparent)' }} />
              <div style={{ padding:28 }}>
                {feedbackSent ? (
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'24px 0', gap:16 }}>
                    <div style={{ width:64, height:64, borderRadius:22, display:'flex', alignItems:'center', justifyContent:'center', background:'#10b98120', borderWidth:1, borderStyle:'solid', borderColor:'#10b98130' }}>
                      <CheckCircle2 style={{ width:30, height:30, color:'#10b981' }} />
                    </div>
                    <div style={{ textAlign:'center' }}>
                      <p style={{ fontSize:20, fontWeight:900, color:'#fff', marginBottom:6 }}>Обращение отправлено!</p>
                      <p style={{ fontSize:14, color:'#4a6580' }}>Наша команда ответит в течение 24 часов</p>
                    </div>
                    <button onClick={() => setFeedbackSent(false)} className="hp-ext-btn"
                      style={{ background:'#5ba3f518', borderWidth:1, borderStyle:'solid', borderColor:'#5ba3f530', color:'#5ba3f5' }}>
                      <Send style={{ width:14, height:14 }} /> Отправить ещё
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Form header */}
                    <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:22 }}>
                      <div style={{ width:46, height:46, borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,#1d4ed8,#5ba3f5)', boxShadow:'0 6px 18px #1d4ed850', flexShrink:0 }}>
                        <Zap style={{ width:20, height:20, color:'#fff' }} />
                      </div>
                      <div>
                        <p style={{ fontSize:10, fontWeight:800, color:'#3a5570', textTransform:'uppercase', letterSpacing:'.14em' }}>Поддержка</p>
                        <p style={{ fontSize:18, fontWeight:900, color:'#fff' }}>Написать обращение</p>
                        <p style={{ fontSize:12, color:'#4a6580' }}>Не нашли ответ? Опишите проблему — ответим за 24 ч</p>
                      </div>
                    </div>

                    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                      <textarea
                        value={feedbackText}
                        onChange={e => setFeedbackText(e.target.value)}
                        placeholder="Опишите вашу проблему подробно..."
                        rows={5}
                        className="hp-inp"
                        style={{ resize:'none' }}
                      />
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                        <p style={{ fontSize:12, color:'#2a4060' }}>
                          {feedbackText.length > 0 ? `${feedbackText.length} символов` : 'Минимум 10 символов'}
                        </p>
                        <button onClick={handleSendFeedback} disabled={sending || !feedbackText.trim()}
                          className="hp-send-btn" style={{ width:'auto', padding:'12px 32px', fontSize:14 }}>
                          <Send style={{ width:16, height:16 }} />
                          {sending ? 'Отправляем...' : 'Отправить'}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Category pill (mobile) ── */
function CategoryPill({ label, active, color, icon: Icon, onClick }: {
  label: string; active: boolean; color: string; icon: any; onClick: () => void;
}) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-1.5 shrink-0 px-3.5 py-2 rounded-2xl border text-[12px] font-bold transition-all active:scale-95"
      style={{ background: active ? `${color}22` : 'rgba(255,255,255,0.04)', borderColor: active ? `${color}50` : 'rgba(255,255,255,0.08)', color: active ? color : '#607080' }}>
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}
