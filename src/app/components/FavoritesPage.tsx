import { useState } from 'react';
import {
  ArrowLeft, Heart, Truck, Trash2, ChevronRight, Package,
  Search, MapPin, Calendar, Clock, Star, Sparkles, X,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { useTheme } from '../context/ThemeContext';
import { useFavorites } from '../hooks/useFavorites';
import { toast } from 'sonner';

const CARD_ACCENTS = [
  { from: '#1d4ed8', to: '#5ba3f5' },
  { from: '#7c3aed', to: '#a855f7' },
  { from: '#059669', to: '#10b981' },
  { from: '#dc2626', to: '#f43f5e' },
  { from: '#d97706', to: '#f59e0b' },
  { from: '#0891b2', to: '#06b6d4' },
];

export function FavoritesPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { favorites, remove, clear } = useFavorites();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  /* ── helpers ── */
  const bg      = 'bg-[#0E1621]';
  const txt     = isDark ? 'text-white' : 'text-[#0f172a]';
  const sub     = isDark ? 'text-[#64748b]' : 'text-slate-500';
  const divider = isDark ? 'border-white/[0.06]' : 'border-black/[0.06]';
  const hover   = isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-black/[0.02]';

  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }); }
    catch { return d; }
  };

  /* ══════════════════════════════════════════════════════════ */
  return (
    <div className={`font-['Sora'] ${bg} ${txt} min-h-screen`}>

      {/* ════════════════ MOBILE (не трогаем) ════════════════ */}
      <div className="md:hidden flex flex-col min-h-screen max-w-3xl mx-auto">
        <header className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 border-b backdrop-blur-xl bg-[#0E1621]/95 border-white/[0.06]">
          <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center active:scale-90 text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
            <h1 className="text-[18px] font-bold text-white">Избранное</h1>
            {favorites.length > 0 && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-slate-400">
                {favorites.length}
              </span>
            )}
          </div>
          {favorites.length > 0 && (
            <button onClick={() => setShowClearConfirm(true)} className="text-[13px] font-semibold text-rose-500 active:scale-95">
              Очистить
            </button>
          )}
        </header>

        <div className="flex-1 pb-28">
          {favorites.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4 px-6">
              <Heart className="w-12 h-12 text-[#64748b]" strokeWidth={1.5} />
              <div className="text-center">
                <h3 className="text-[17px] font-bold mb-1 text-white">Нет сохранённых поездок</h3>
                <p className="text-[13px] leading-relaxed text-[#64748b]">
                  Нажмите ❤️ на карточке поездки,<br />чтобы сохранить её здесь
                </p>
              </div>
              <button onClick={() => navigate('/search-results')}
                className="mt-2 h-11 px-6 bg-[#1978e5] text-white font-bold flex items-center gap-2 active:scale-[0.97]">
                <Search className="w-4 h-4" /> Найти поездки
              </button>
            </div>
          ) : (
            <>
              <div className={`px-4 py-2.5 border-b ${divider}`}>
                <p className="text-[12px] text-[#64748b]">Сохранённые поездки · {favorites.length} шт.</p>
              </div>
              {favorites.map(trip => (
                <div key={trip.id} className={`border-b ${divider}`}>
                  <button onClick={() => navigate(`/trip/${trip.id}`)}
                    className={`w-full text-left px-4 py-3.5 transition-all ${hover}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-[#1978e5] shrink-0" />
                      <span className="text-[14px] font-bold truncate text-white">{trip.from}</span>
                      <ChevronRight className="w-3.5 h-3.5 shrink-0 text-[#64748b]" />
                      <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      <span className="text-[14px] font-bold truncate text-white">{trip.to}</span>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-1.5 text-[12px] text-[#64748b]">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{formatDate(trip.date)}{trip.time ? ` · ${trip.time}` : ''}</span>
                      </div>
                      {trip.driverName && (
                        <div className="flex items-center gap-1.5 text-[12px] text-[#64748b]">
                          <Truck className="w-3.5 h-3.5" />
                          <span>{trip.driverName}</span>
                        </div>
                      )}
                      {trip.availableSeats != null && (
                        <div className="flex items-center gap-1.5 text-[12px] text-[#64748b]">
                          <Package className="w-3.5 h-3.5" />
                          <span>{trip.availableSeats} мест</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-3">
                        {trip.pricePerSeat != null && (
                          <span className="text-[15px] font-extrabold text-[#1978e5]">
                            {trip.pricePerSeat.toLocaleString()} <span className="text-[12px] font-normal">TJS/место</span>
                          </span>
                        )}
                        {trip.pricePerKg != null && !trip.pricePerSeat && (
                          <span className="text-[15px] font-extrabold text-[#1978e5]">
                            {trip.pricePerKg} <span className="text-[12px] font-normal">TJS/кг</span>
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-[#64748b]">Сохранено {formatDate(trip.savedAt)}</span>
                    </div>
                  </button>
                  <div className={`flex border-t ${divider}`}>
                    <button
                      onClick={() => navigate(`/search-results?from=${encodeURIComponent(trip.from)}&to=${encodeURIComponent(trip.to)}`)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[12px] font-semibold text-[#1978e5] ${hover}`}>
                      <Search className="w-3.5 h-3.5" /> Похожие рейсы
                    </button>
                    <div className={`w-px ${divider}`} />
                    <button onClick={() => { remove(trip.id); toast('Удалено из избранного'); }}
                      className={`flex items-center justify-center gap-1.5 px-5 py-2.5 text-[12px] font-semibold text-rose-500 ${hover}`}>
                      <Trash2 className="w-3.5 h-3.5" /> Удалить
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {showClearConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowClearConfirm(false)} />
            <div className="relative w-full max-w-sm p-6 bg-[#0E1621]">
              <h3 className="text-[17px] font-bold mb-1 text-white">Очистить избранное?</h3>
              <p className="text-[13px] mb-6 text-[#64748b]">Все сохранённые поездки будут удалены</p>
              <div className="flex gap-3">
                <button onClick={() => setShowClearConfirm(false)}
                  className="flex-1 h-11 font-semibold text-[14px] border border-white/10 text-white">Отмена</button>
                <button onClick={() => { clear(); setShowClearConfirm(false); toast('Избранное очищено'); }}
                  className="flex-1 h-11 bg-rose-500 text-white font-bold text-[14px]">Очистить</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ════════════════ DESKTOP ════════════════ */}
      <div className="hidden md:block min-h-screen" style={{ background: '#080f1a' }}>
        <style>{`
          @keyframes fv-up   { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
          @keyframes fv-in   { from { opacity:0; } to { opacity:1; } }
          @keyframes fv-card { from { opacity:0; transform:translateY(14px) scale(.985); } to { opacity:1; transform:translateY(0) scale(1); } }
          @keyframes fv-heart-beat { 0%,100%{transform:scale(1);} 30%{transform:scale(1.3);} 60%{transform:scale(.92);} }
          .fv-section { animation: fv-up .44s cubic-bezier(.22,1,.36,1) both; }
          .fv-section:nth-child(1){ animation-delay:.05s }
          .fv-section:nth-child(2){ animation-delay:.12s }
          .fv-section:nth-child(3){ animation-delay:.19s }
          .fv-trip-card {
            border-radius: 22px; overflow: hidden;
            border: 1px solid #1a2d42;
            background: linear-gradient(145deg, #0e1e32, #0a1520);
            cursor: pointer;
            transition: border-color .22s ease, box-shadow .22s ease, transform .22s ease;
          }
          .fv-trip-card:hover {
            border-color: #2a4565;
            box-shadow: 0 12px 40px #00000065;
            transform: translateY(-3px);
          }
          .fv-btn-ghost {
            display: flex; align-items: center; justify-content: center; gap: 6px;
            padding: 8px 16px; border-radius: 12px; font-size: 12px; font-weight: 700;
            cursor: pointer; border: none; font-family: inherit;
            transition: background .18s, color .18s, transform .15s;
          }
          .fv-btn-ghost:hover { transform: translateY(-1px); }
          .fv-remove-btn {
            width: 34px; height: 34px; border-radius: 10px; border: none;
            display: flex; align-items: center; justify-content: center;
            background: transparent; cursor: pointer;
            color: #2a4060; transition: background .15s, color .15s, transform .15s;
          }
          .fv-remove-btn:hover { background: #3a0f0f; color: #f43f5e; transform: scale(1.1); }
          .fv-empty-btn {
            display: flex; align-items: center; gap: 8px;
            padding: 12px 28px; border-radius: 16px; font-size: 14px; font-weight: 800;
            cursor: pointer; border: none; font-family: inherit; color: #fff;
            background: linear-gradient(135deg, #1d4ed8, #5ba3f5);
            box-shadow: 0 8px 24px #1d4ed840;
            transition: transform .2s ease, box-shadow .2s ease;
          }
          .fv-empty-btn:hover { transform: translateY(-2px); box-shadow: 0 14px 32px #1d4ed855; }
          .fv-clear-btn {
            display: flex; align-items: center; gap: 6px;
            padding: 8px 18px; border-radius: 12px; font-size: 12px; font-weight: 700;
            cursor: pointer; border: none; font-family: inherit;
            background: #3a0f0f20; color: #f43f5e;
            border: 1px solid #f43f5e20;
            transition: background .18s, transform .15s;
          }
          .fv-clear-btn:hover { background: #3a0f0f40; transform: translateY(-1px); }
          .fv-modal-overlay {
            position: fixed; inset: 0; z-index: 50;
            display: flex; align-items: center; justify-content: center; padding: 24px;
            background: #00000080; backdrop-filter: blur(8px);
            animation: fv-in .2s ease both;
          }
          .fv-modal {
            width: 100%; max-width: 440px; border-radius: 26px; overflow: hidden;
            background: linear-gradient(160deg, #0f1f38, #0a1520);
            border: 1px solid #1e2d45;
            box-shadow: 0 32px 80px #00000090;
            animation: fv-card .3s cubic-bezier(.34,1.56,.64,1) both;
          }
          .fv-route-dot-from { width:10px; height:10px; border-radius:50%; background:#5ba3f5; flex-shrink:0; box-shadow:0 0 8px #5ba3f560; }
          .fv-route-dot-to   { width:10px; height:10px; border-radius:50%; background:#10b981; flex-shrink:0; box-shadow:0 0 8px #10b98160; }
          .fv-meta-chip {
            display: inline-flex; align-items: center; gap: 5px;
            padding: 4px 10px; border-radius: 100px; font-size: 11px; font-weight: 600;
            background: #0a1520; border: 1px solid #1a2d3d; color: #4a6580;
          }
        `}</style>

        {/* ── TOP BAR ── */}
        <div style={{ background: '#0a1220', borderBottomWidth:1, borderBottomStyle:'solid', borderBottomColor:'#ffffff08', animation:'fv-in .3s ease both' }}>
          <div className="max-w-7xl mx-auto px-10 py-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate(-1)}
                className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                style={{ background:'#ffffff0a', borderWidth:1, borderStyle:'solid', borderColor:'#ffffff0f', color:'#8a9bb0' }}>
                <ArrowLeft style={{ width:18, height:18 }} />
              </button>
              <div>
                <p style={{ fontSize:10, fontWeight:800, letterSpacing:'.18em', textTransform:'uppercase', color:'#3a5570' }}>Коллекция</p>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <h1 style={{ fontSize:22, fontWeight:900, color:'#fff', lineHeight:1.2 }}>Избранное</h1>
                  {favorites.length > 0 && (
                    <span style={{ fontSize:12, fontWeight:800, padding:'3px 12px', borderRadius:100, background:'linear-gradient(135deg,#831843,#f43f5e)', color:'#fff', boxShadow:'0 4px 12px #f43f5e40', display:'flex', alignItems:'center', gap:5 }}>
                      <Heart style={{ width:11, height:11, fill:'#fff' }} />
                      {favorites.length}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {favorites.length > 0 && (
              <button onClick={() => setShowClearConfirm(true)} className="fv-clear-btn">
                <Trash2 style={{ width:14, height:14 }} /> Очистить всё
              </button>
            )}
          </div>
        </div>

        {/* ── BODY ── */}
        <div className="max-w-7xl mx-auto px-10 py-8 flex gap-8 items-start">

          {/* ── LEFT PANEL ── */}
          <div style={{ width:270, flexShrink:0 }} className="sticky top-8 flex flex-col gap-5">

            {/* Stats card */}
            <div className="fv-section rounded-3xl overflow-hidden"
              style={{ background:'linear-gradient(160deg,#0f1f38,#0c1624)', borderWidth:1, borderStyle:'solid', borderColor:'#1a2d45', boxShadow:'0 24px 48px #00000060' }}>
              <div style={{ height:3, background:'linear-gradient(90deg,#831843,#f43f5e,#fb923c)' }} />
              <div style={{ padding:22 }}>
                {/* Heart icon + count */}
                <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:20 }}>
                  <div style={{ width:52, height:52, borderRadius:18, display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,#831843,#f43f5e)', boxShadow:'0 8px 24px #f43f5e40', flexShrink:0 }}>
                    <Heart style={{ width:24, height:24, fill:'#fff', color:'#fff', animation: favorites.length ? 'fv-heart-beat 1.4s ease infinite' : 'none' }} />
                  </div>
                  <div>
                    <p style={{ fontSize:10, fontWeight:800, color:'#3a5570', textTransform:'uppercase', letterSpacing:'.14em' }}>Сохранено</p>
                    <p style={{ fontSize:38, fontWeight:900, color:'#fff', lineHeight:1 }}>{favorites.length}</p>
                    <p style={{ fontSize:11, color:'#4a6580' }}>поездок</p>
                  </div>
                </div>

                {/* Quick tip */}
                <div style={{ background:'#0a1520', borderRadius:14, padding:'12px 14px', borderWidth:1, borderStyle:'solid', borderColor:'#1a2d3d', display:'flex', alignItems:'flex-start', gap:10 }}>
                  <Sparkles style={{ width:14, height:14, color:'#f59e0b', flexShrink:0, marginTop:1 }} />
                  <p style={{ fontSize:12, color:'#4a6580', lineHeight:1.6 }}>
                    Нажмите на карточку, чтобы открыть детали поездки
                  </p>
                </div>
              </div>
            </div>

            {/* Find trips CTA */}
            <div className="fv-section">
              <button onClick={() => navigate('/search-results')} className="fv-empty-btn" style={{ width:'100%', justifyContent:'center' }}>
                <Search style={{ width:16, height:16 }} /> Найти поездки
              </button>
            </div>

            {/* Legend */}
            <div className="fv-section rounded-2xl overflow-hidden"
              style={{ background:'#0e1e32', borderWidth:1, borderStyle:'solid', borderColor:'#1a2d42' }}>
              <div style={{ padding:'14px 16px', borderBottomWidth:1, borderBottomStyle:'solid', borderBottomColor:'#1a2d3d' }}>
                <span style={{ fontSize:11, fontWeight:800, textTransform:'uppercase', letterSpacing:'.14em', color:'#3a5570' }}>Обозначения</span>
              </div>
              <div style={{ padding:'14px 16px', display:'flex', flexDirection:'column', gap:10 }}>
                {[
                  { dot:'#5ba3f5', label:'Откуда' },
                  { dot:'#10b981', label:'Куда' },
                  { dot:'#f59e0b', label:'Дата поездки' },
                  { dot:'#a855f7', label:'Дата сохранения' },
                ].map(({ dot, label }) => (
                  <div key={label} style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:dot, boxShadow:`0 0 6px ${dot}`, flexShrink:0 }} />
                    <span style={{ fontSize:12, color:'#4a6580' }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── RIGHT: Trip cards grid ── */}
          <div style={{ flex:1, minWidth:0 }}>

            {favorites.length === 0 ? (
              /* ── Empty state ── */
              <div className="fv-section" style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'80px 0', gap:20 }}>
                <div style={{ position:'relative' }}>
                  <div style={{ width:90, height:90, borderRadius:28, display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,#0f1e32,#0a1520)', borderWidth:1, borderStyle:'solid', borderColor:'#1a2d42' }}>
                    <Heart style={{ width:40, height:40, color:'#2a4060', strokeWidth:1.5 }} />
                  </div>
                  <div style={{ position:'absolute', top:-4, right:-4, width:24, height:24, borderRadius:8, background:'linear-gradient(135deg,#831843,#f43f5e)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 12px #f43f5e50' }}>
                    <X style={{ width:12, height:12, color:'#fff' }} />
                  </div>
                </div>
                <div style={{ textAlign:'center' }}>
                  <p style={{ fontSize:22, fontWeight:900, color:'#fff', marginBottom:8 }}>Нет сохранённых поездок</p>
                  <p style={{ fontSize:14, color:'#3a5570', lineHeight:1.7, maxWidth:340 }}>
                    Нажмите ❤️ на карточке поездки, чтобы сохранить её здесь для быстрого доступа
                  </p>
                </div>
                <button onClick={() => navigate('/search-results')} className="fv-empty-btn">
                  <Search style={{ width:16, height:16 }} /> Найти поездки
                </button>
              </div>
            ) : (
              <>
                {/* Count bar */}
                <div className="fv-section" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
                  <p style={{ fontSize:14, fontWeight:700, color:'#fff' }}>
                    Сохранённые рейсы
                    <span style={{ marginLeft:10, fontSize:11, fontWeight:800, padding:'3px 10px', borderRadius:100, background:'#1e2d45', color:'#5ba3f5' }}>{favorites.length}</span>
                  </p>
                  <p style={{ fontSize:12, color:'#3a5570', fontWeight:600 }}>↓ Последние сохранения</p>
                </div>

                {/* Grid */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(360px, 1fr))', gap:16 }}>
                  {favorites.map((trip, idx) => {
                    const accent = CARD_ACCENTS[idx % CARD_ACCENTS.length];
                    const isHovered = hoveredId === trip.id;
                    return (
                      <div
                        key={trip.id}
                        className="fv-trip-card fv-section"
                        style={{ animationDelay:`${idx * 60}ms` }}
                        onMouseEnter={() => setHoveredId(trip.id)}
                        onMouseLeave={() => setHoveredId(null)}
                      >
                        {/* Top accent line */}
                        <div style={{ height:3, background:`linear-gradient(90deg,${accent.from},${accent.to},transparent)` }} />

                        {/* Card body */}
                        <div style={{ padding:'20px 22px' }} onClick={() => navigate(`/trip/${trip.id}`)}>

                          {/* Route */}
                          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
                            <div className="fv-route-dot-from" />
                            <span style={{ fontSize:16, fontWeight:800, color:'#fff', flex:1, minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{trip.from}</span>
                            <ChevronRight style={{ width:16, height:16, color:'#3a5570', flexShrink:0 }} />
                            <div className="fv-route-dot-to" />
                            <span style={{ fontSize:16, fontWeight:800, color:'#fff', flex:1, minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{trip.to}</span>
                          </div>

                          {/* Meta chips */}
                          <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:16 }}>
                            {trip.date && (
                              <span className="fv-meta-chip">
                                <Calendar style={{ width:11, height:11, color:'#f59e0b' }} />
                                {formatDate(trip.date)}{trip.time ? ` · ${trip.time}` : ''}
                              </span>
                            )}
                            {trip.driverName && (
                              <span className="fv-meta-chip">
                                <Truck style={{ width:11, height:11, color:`${accent.to}` }} />
                                {trip.driverName}
                              </span>
                            )}
                            {trip.availableSeats != null && (
                              <span className="fv-meta-chip">
                                <Package style={{ width:11, height:11, color:'#10b981' }} />
                                {trip.availableSeats} мест
                              </span>
                            )}
                          </div>

                          {/* Price row */}
                          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                            <div>
                              {trip.pricePerSeat != null && (
                                <p style={{ fontSize:22, fontWeight:900, color: accent.to, lineHeight:1 }}>
                                  {trip.pricePerSeat.toLocaleString()}
                                  <span style={{ fontSize:12, fontWeight:500, color:'#4a6580', marginLeft:4 }}>TJS/место</span>
                                </p>
                              )}
                              {trip.pricePerKg != null && !trip.pricePerSeat && (
                                <p style={{ fontSize:22, fontWeight:900, color: accent.to, lineHeight:1 }}>
                                  {trip.pricePerKg}
                                  <span style={{ fontSize:12, fontWeight:500, color:'#4a6580', marginLeft:4 }}>TJS/кг</span>
                                </p>
                              )}
                              {!trip.pricePerSeat && !trip.pricePerKg && (
                                <p style={{ fontSize:14, color:'#3a5570' }}>Цена не указана</p>
                              )}
                            </div>
                            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                              <Clock style={{ width:11, height:11, color:'#a855f7' }} />
                              <span style={{ fontSize:11, color:'#3a5570' }}>Сохранено {formatDate(trip.savedAt)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Footer actions */}
                        <div style={{ display:'flex', alignItems:'center', borderTopWidth:1, borderTopStyle:'solid', borderTopColor:'#1a2d3d', background:'#070e1a' }}>
                          <button
                            onClick={() => navigate(`/search-results?from=${encodeURIComponent(trip.from)}&to=${encodeURIComponent(trip.to)}`)}
                            className="fv-btn-ghost"
                            style={{ flex:1, color:'#5ba3f5', background:'transparent', borderRightWidth:1, borderRightStyle:'solid', borderRightColor:'#1a2d3d', borderRadius:0, padding:'11px 16px' }}>
                            <Search style={{ width:13, height:13 }} /> Похожие рейсы
                          </button>
                          <button
                            onClick={() => { remove(trip.id); toast('Удалено из избранного'); }}
                            className="fv-remove-btn"
                            style={{ margin:'0 12px' }}>
                            <Trash2 style={{ width:14, height:14 }} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── CLEAR CONFIRM MODAL ── */}
        {showClearConfirm && (
          <div className="fv-modal-overlay" onClick={() => setShowClearConfirm(false)}>
            <div className="fv-modal" onClick={e => e.stopPropagation()}>
              <div style={{ height:3, background:'linear-gradient(90deg,#831843,#f43f5e,#fb923c)' }} />
              <div style={{ padding:'28px 28px 24px' }}>
                {/* Icon */}
                <div style={{ width:52, height:52, borderRadius:18, display:'flex', alignItems:'center', justifyContent:'center', background:'#3a0f0f', marginBottom:16, borderWidth:1, borderStyle:'solid', borderColor:'#f43f5e30' }}>
                  <Trash2 style={{ width:22, height:22, color:'#f43f5e' }} />
                </div>
                <h3 style={{ fontSize:20, fontWeight:900, color:'#fff', marginBottom:8 }}>Очистить избранное?</h3>
                <p style={{ fontSize:13, color:'#4a6580', lineHeight:1.6, marginBottom:24 }}>
                  Все {favorites.length} сохранённых поездок будут удалены без возможности восстановления.
                </p>
                <div style={{ display:'flex', gap:12 }}>
                  <button onClick={() => setShowClearConfirm(false)}
                    style={{ flex:1, padding:'12px', borderRadius:14, fontFamily:'inherit', fontSize:14, fontWeight:700, cursor:'pointer', background:'#0e1e32', borderWidth:1, borderStyle:'solid', borderColor:'#1a2d42', color:'#7a9ab5', transition:'background .15s' }}>
                    Отмена
                  </button>
                  <button onClick={() => { clear(); setShowClearConfirm(false); toast('Избранное очищено'); }}
                    style={{ flex:1, padding:'12px', borderRadius:14, fontFamily:'inherit', fontSize:14, fontWeight:800, cursor:'pointer', background:'linear-gradient(135deg,#831843,#f43f5e)', color:'#fff', border:'none', boxShadow:'0 6px 20px #f43f5e40', transition:'transform .15s, box-shadow .15s' }}>
                    Очистить всё
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
