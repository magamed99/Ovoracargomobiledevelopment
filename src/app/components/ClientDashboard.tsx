import { useState, useEffect, useCallback } from 'react';
import { usePolling } from '../hooks/usePolling';
import { useNavigate } from 'react-router';
import {
  Bell, Star, Users as UsersIcon, Truck,
  Zap, TrendingUp, ArrowRight, MapPin,
  Package
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useUser } from '../contexts/UserContext';
import { useTrips } from '../contexts/TripsContext';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { getPublicAds } from '../api/dataApi';
import { getCityCountry } from '../utils/addressUtils';
import { DriverDashboardActions } from './DriverDashboardActions';
import { SenderDashboardActions } from './SenderDashboardActions';
import { DesktopDashboard } from './DesktopDashboard';

// ── Helpers ────────────────────────────────────────────────────────────────────
function toEmbedUrl(url?: string): string | null {
  if (!url) return null;
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&mute=1&loop=1&playlist=${ytMatch[1]}`;
  const vmMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vmMatch) return `https://player.vimeo.com/video/${vmMatch[1]}?autoplay=1&muted=1&loop=1`;
  const rtMatch = url.match(/rutube\.ru\/video\/([a-f0-9]+)/);
  if (rtMatch) return `https://rutube.ru/play/embed/${rtMatch[1]}`;
  return null;
}
function isDirectVideo(url?: string): boolean {
  if (!url) return false;
  return /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);
}

const MONTHS = ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'];
function formatTripDate(dateStr: string) {
  if (!dateStr) return '';
  if (dateStr.includes('-')) {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
  }
  return dateStr;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'Доброе утро';
  if (h < 18) return 'Добрый день';
  if (h < 23) return 'Добрый вечер';
  return 'Доброй ночи';
}

// ── Fallback ads ───────────────────────────────────────────────────────────────
const FALLBACK_ADS = [
  { id: 1, image: 'https://images.unsplash.com/photo-1760035434884-f77dc4ce45af?w=600&h=200&fit=crop', emoji: '🚚', badge: 'Специальное предложение', title: 'Грузоперевозки\nот 500₽/км', description: 'Надежно • Быстро • Выгодно', url: 'https://example.com/cargo' },
  { id: 2, image: 'https://images.unsplash.com/photo-1628695333027-df075f487dff?w=600&h=200&fit=crop', emoji: '✈️', badge: 'Новое направление', title: 'Авиабилеты\nсо скидкой 25%', description: 'Лучшие цены • Без комиссий', url: 'https://example.com/flights' },
  { id: 3, image: 'https://images.unsplash.com/photo-1637052885415-ccda7cbaf7d9?w=600&h=200&fit=crop', emoji: '🛡️', badge: 'Безопасность', title: 'Страхование грузов\nот 99₽', description: 'Полная защита • 24/7', url: 'https://example.com/insurance' },
  { id: 4, image: 'https://images.unsplash.com/photo-1745847768380-2caeadbb3b71?w=600&h=200&fit=crop', emoji: '🤝', badge: 'Партнерство', title: 'Станьте водителем\nOvora Cargo', description: 'Высокие доходы • Свободный график', url: 'https://example.com/driver' },
  { id: 5, image: 'https://images.unsplash.com/photo-1614020661483-d2bb855eee1d?w=600&h=200&fit=crop', emoji: '📱', badge: 'Технология', title: 'Скачайте приложение\nи получите бонус', description: '500₽ на первую поездку', url: 'https://example.com/app' },
];

// ═════════════════════════════════════════════════════════════════════════════
export function Home() {
  const navigate   = useNavigate();
  const { user: currentUser } = useUser();
  const { trips: publishedTrips, loading: tripsLoading } = useTrips();
  const userRole   = sessionStorage.getItem('userRole') || 'sender';
  const isDriver   = userRole === 'driver';

  const displayName = currentUser?.firstName
    ? currentUser.firstName
    : currentUser === null ? 'Пользователь' : '…';

  const initials = [currentUser?.firstName?.[0], currentUser?.lastName?.[0]]
    .filter(Boolean).join('').toUpperCase() || '?';

  // ── Ads ────────────────────────────────────────────────────────────────────
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [touchStart, setTouchStart]         = useState(0);
  const [touchEnd, setTouchEnd]             = useState(0);
  const [serverAds, setServerAds]           = useState<any[] | null>(null);

  usePolling(async () => {
    try {
      const data = await getPublicAds('cargo');
      if (data?.length) setServerAds(data);
    } catch { /* silent */ }
  }, 5 * 60_000);

  const advertisements = serverAds?.length ? serverAds : FALLBACK_ADS;
  const currentAd      = advertisements[currentAdIndex] ?? advertisements[0];
  const hasAds         = advertisements.length > 0 && currentAd != null;

  useEffect(() => {
    const id = setInterval(() => {
      setCurrentAdIndex(prev => (prev + 1) % advertisements.length);
    }, 5000);
    return () => clearInterval(id);
  }, [advertisements.length]);

  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.targetTouches[0].clientX);
  const handleTouchMove  = (e: React.TouchEvent) => setTouchEnd(e.targetTouches[0].clientX);
  const handleTouchEnd   = () => {
    if (touchStart - touchEnd >  75) setCurrentAdIndex(p => (p + 1) % advertisements.length);
    if (touchStart - touchEnd < -75) setCurrentAdIndex(p => (p - 1 + advertisements.length) % advertisements.length);
  };

  // ── Trip mapping ──────────────────────────────────────────────────────────
  const allPopularTrips = publishedTrips
    .filter(t => {
      const s = t.status?.toLowerCase();
      // Скрываем завершённые, отменённые и начатые поездки
      if (s === 'completed' || s === 'cancelled' || s === 'inprogress' || s === 'started' || s === 'in_progress') return false;
      return true;
    })
    .map(t => {
      const nameParts = (t.driverName || 'Водитель').split(' ');
      const initials  = nameParts.map((p: string) => p[0] || '').join('').toUpperCase().slice(0, 2) || '?';
      const shortName = nameParts[0] + (nameParts[1] ? ' ' + nameParts[1][0] + '.' : '');
      return {
        id:         t.id,
        driver:     { name: shortName, initials, avatar: t.driverAvatar || null, rating: t.driverRating ?? null, trips: t.driverTrips ?? null, verified: !!t.driverVerified },
        from:       t.from,
        fromCountry:t.fromCountry || getCityCountry(t.from),
        to:         t.to,
        toCountry:  t.toCountry  || getCityCountry(t.to),
        time:       t.time    || '',
        date:       formatTripDate(t.date),
        duration:   t.duration || '',
        seats:      t.availableSeats > 0 ? t.availableSeats : null,
        price:      t.pricePerSeat ? `${t.pricePerSeat} TJS` : null,
        childSeats: t.childSeats > 0 ? t.childSeats : null,
        childPrice: t.pricePerChild > 0 ? `${t.pricePerChild} TJS` : null,
        cargo:      t.cargoCapacity > 0 ? `${t.cargoCapacity} кг` : null,
        cargoPrice: t.pricePerKg ? `${t.pricePerKg} TJS/кг` : null,
        notes:      t.notes?.trim() || null,
        // Для определения "заполняется"
        rawSeats:   t.availableSeats || 0,
        rawCargo:   t.cargoCapacity  || 0,
      };
    })
    // Скрываем полностью заполненные поездки (нет ни мест, ни груза)
    .filter(trip => trip.seats !== null || trip.childSeats !== null || trip.cargo !== null);

  // ══════════════════════════════════════════════════════════════════════════
  return (
    <>
      {/* ── DESKTOP: уникальный анимированный дизайн (md+) ── */}
      <DesktopDashboard
        currentUser={currentUser}
        displayName={displayName}
        initials={initials}
        isDriver={isDriver}
        greeting={getGreeting()}
        advertisements={advertisements}
        currentAdIndex={currentAdIndex}
        setCurrentAdIndex={setCurrentAdIndex}
        allPopularTrips={allPopularTrips}
        tripsLoading={tripsLoading}
        DriverActions={DriverDashboardActions}
        SenderActions={SenderDashboardActions}
      />

      {/* ── MOBILE: оригинальный дизайн (только телефон) ── */}
      <div className="md:hidden min-h-screen flex flex-col overflow-x-hidden font-['Sora'] bg-[#0e1621] text-white">

      {/* ── HERO HEADER ── */}
      <div className="relative overflow-hidden shrink-0">
        {/* BG */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0" style={{ background: 'linear-gradient(145deg, #0f2744 0%, #0e1621 60%)' }} />
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full"
            style={{ background: 'radial-gradient(circle, #1d4ed8 0%, transparent 70%)', opacity: 0.20 }} />
        </div>

        {/* Top bar + user info */}
        <div className="relative px-4 w-full"
          style={{ paddingTop: 'max(52px, env(safe-area-inset-top, 52px))', paddingBottom: 16 }}>
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-black uppercase tracking-widest text-[#607080]">{getGreeting()}</p>
              <h1 className="text-[24px] font-black text-white leading-tight truncate">{displayName}</h1>
            </div>
            <div className="relative shrink-0 ml-4">
              <div className="w-12 h-12 rounded-2xl overflow-hidden ring-2 ring-[#5ba3f5]/30 shadow-lg"
                style={{ background: currentUser?.avatarUrl ? undefined : 'linear-gradient(135deg, #1d4ed8 0%, #7c3aed 100%)' }}>
                {currentUser?.avatarUrl ? (
                  <img src={currentUser.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-white font-black text-base">{initials}</span>
                  </div>
                )}
              </div>
              <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-lg flex items-center justify-center border-2 border-[#0e1621] shadow-lg ${isDriver ? 'bg-[#5ba3f5]' : 'bg-emerald-500'}`}>
                {isDriver
                  ? <Truck className="w-2.5 h-2.5 text-white" />
                  : <Package className="w-2.5 h-2.5 text-white" />
                }
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <main className="flex-1 flex flex-col w-full">
        <div className="px-4 pt-3 pb-5">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-[#5ba3f5]" />
            <p className="text-[11px] font-black uppercase tracking-widest text-[#607080]">Быстрые действия</p>
          </div>
          {isDriver ? <DriverDashboardActions /> : <SenderDashboardActions />}
        </div>

        {/* ── НОВЫЕ СЕРВИСЫ — только для водителей ───────────────────────── */}
        {isDriver && (
        <div className="px-4 pb-5">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-3.5 h-3.5 text-[#f59e0b]" />
            <p className="text-[11px] font-black uppercase tracking-widest text-[#607080]">Сервисы для водителей</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            {[
              {
                href: '/borders',
                emoji: '🛂',
                label: 'Границы',
                sub: 'Статус КПП',
                color: '#f59e0b',
                bg: 'linear-gradient(135deg,#1a1000,#0a0800)',
                border: '#3a2000',
              },
              {
                href: '/rest-stops',
                emoji: '🛖',
                label: 'Стоянки',
                sub: 'Кафе и отдых',
                color: '#22c55e',
                bg: 'linear-gradient(135deg,#052015,#030e0a)',
                border: '#0a3020',
              },
              {
                href: '/radio',
                emoji: '📡',
                label: 'Рация',
                sub: 'Каналы трасс',
                color: '#5ba3f5',
                bg: 'linear-gradient(135deg,#0a1e40,#060f20)',
                border: '#1a3060',
              },
            ].map((item, i) => (
              <motion.button
                key={item.href}
                onClick={() => navigate(item.href)}
                style={{
                  background: item.bg, border: `1px solid ${item.border}`,
                  borderRadius: 18, padding: '14px 10px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                  cursor: 'pointer', textDecoration: 'none',
                }}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.07 }}
                whileTap={{ scale: 0.95 }}
              >
                <span style={{ fontSize: 26 }}>{item.emoji}</span>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 13, fontWeight: 800, color: item.color, lineHeight: 1 }}>{item.label}</p>
                  <p style={{ fontSize: 10, color: '#2a4060', marginTop: 3, lineHeight: 1.3 }}>{item.sub}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
        )}

        {hasAds && (
          <motion.div
            className="px-4 pb-5"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.38 }}
          >
            <a href={currentAd.url} target="_blank" rel="noopener noreferrer"
              className="block rounded-3xl overflow-hidden active:scale-[0.99] transition-transform w-full">
              <div className="relative overflow-hidden" style={{ height: 'clamp(160px, 50vw, 200px)' }}
                onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
                <div className="absolute inset-0">
                  <ImageWithFallback src={currentAd.image} alt="Advertisement" className="w-full h-full object-cover" />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #00000090 0%, transparent 55%)' }} />
                </div>
                {currentAd.videoUrl && toEmbedUrl(currentAd.videoUrl) && (
                  <div className="absolute inset-0 z-20">
                    <div className="absolute inset-0 bg-black/20 z-10 pointer-events-none">
                      <span className="absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-full bg-black/50 text-white/80 backdrop-blur-sm">Реклама</span>
                    </div>
                    <iframe src={toEmbedUrl(currentAd.videoUrl)!} className="absolute inset-0 w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title="ad video" />
                  </div>
                )}
                {currentAd.videoUrl && isDirectVideo(currentAd.videoUrl) && !toEmbedUrl(currentAd.videoUrl) && (
                  <div className="absolute inset-0 z-20">
                    <video src={currentAd.videoUrl} className="w-full h-full object-cover" autoPlay muted loop playsInline />
                  </div>
                )}
                {!toEmbedUrl(currentAd.videoUrl) && !isDirectVideo(currentAd.videoUrl) && (
                  <div className="absolute inset-0 z-10 flex flex-col justify-between p-4">
                    <div className="flex items-start justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-white/20 text-white backdrop-blur-sm">{currentAd.badge}</span>
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-black/40 text-white/80 backdrop-blur-sm">Реклама</span>
                    </div>
                    <div>
                      <p className="text-[20px] font-black text-white leading-tight drop-shadow-lg">
                        {currentAd.title.split('\\n').map((l: string, i: number) => (
                          <span key={i}>{l}{i < currentAd.title.split('\\n').length - 1 && <br />}</span>
                        ))}
                      </p>
                      <p className="text-[12px] text-white/80 mt-1">{currentAd.description}</p>
                    </div>
                  </div>
                )}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 flex gap-1.5">
                  {advertisements.map((_, idx) => (
                    <div key={idx} className="h-1.5 rounded-full transition-all duration-300"
                      style={{ width: idx === currentAdIndex ? 20 : 6, background: idx === currentAdIndex ? '#fff' : 'rgba(255,255,255,0.4)' }} />
                  ))}
                </div>
              </div>
            </a>
          </motion.div>
        )}

        <section className="px-4 pb-8">
          <motion.div className="flex items-center justify-between mb-4"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-[#f59e0b]" />
              <p className="text-[10px] font-black uppercase tracking-widest text-[#607080]">Популярные поездки</p>
            </div>
            <button onClick={() => navigate('/search-results')} className="flex items-center gap-1 text-[12px] font-bold text-[#5ba3f5]">
              Все <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </motion.div>

          <div className="flex flex-col gap-3">
            {tripsLoading && allPopularTrips.length === 0 && [1, 2].map(i => (
              <div key={i} className="rounded-3xl border border-white/[0.06] p-4 animate-pulse" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-white/[0.08]" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-28 bg-white/[0.08] rounded-full" />
                    <div className="h-2.5 w-20 bg-white/[0.06] rounded-full" />
                  </div>
                </div>
                <div className="h-14 bg-white/[0.05] rounded-2xl" />
              </div>
            ))}
            {!tripsLoading && allPopularTrips.length === 0 && (
              <motion.div className="rounded-3xl border border-white/[0.06] p-8 flex flex-col items-center gap-3 text-center"
                style={{ background: 'rgba(255,255,255,0.03)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="w-14 h-14 rounded-3xl flex items-center justify-center text-3xl" style={{ background: 'rgba(255,255,255,0.05)' }}>🚗</div>
                <div>
                  <p className="font-black text-[15px] text-white mb-1">Поездок пока нет</p>
                  <p className="text-[12px] text-[#607080]">Водители ещё не опубликовали рейсы</p>
                </div>
                <button onClick={() => navigate('/search-results')}
                  className="mt-1 px-5 py-2.5 rounded-xl text-[13px] font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #1d4ed8, #5ba3f5)' }}>
                  Открыть поиск
                </button>
              </motion.div>
            )}
            <div className="flex flex-col gap-3">
              {allPopularTrips.map((trip, index) => (
                <motion.div key={trip.id} onClick={() => navigate(`/trip/${trip.id}`)}
                  className="rounded-3xl border border-white/[0.07] overflow-hidden cursor-pointer"
                  style={{ background: 'rgba(255,255,255,0.04)' }}
                  initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.32 + index * 0.07 }} whileTap={{ scale: 0.98 }}>
                  <div className="p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        {trip.driver.avatar
                          ? <img src={trip.driver.avatar} alt={trip.driver.name} className="w-10 h-10 rounded-2xl object-cover" />
                          : <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-[13px] text-white"
                              style={{ background: 'linear-gradient(135deg, #1d4ed8, #7c3aed)' }}>{trip.driver.initials}</div>
                        }
                        {trip.driver.verified && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#10b981] border-2 border-[#0e1621] flex items-center justify-center">
                            <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-bold text-white truncate">{trip.driver.name}</p>
                        {trip.driver.rating !== null
                          ? <div className="flex items-center gap-1.5 mt-0.5">
                              <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-500/10">
                                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                <span className="text-[11px] font-bold text-amber-400">{trip.driver.rating}</span>
                              </div>
                              {trip.driver.trips !== null && <span className="text-[11px] text-[#607080]">· {trip.driver.trips} поездок</span>}
                            </div>
                          : <p className="text-[11px] text-[#607080] mt-0.5">Водитель</p>
                        }
                      </div>
                      <div className="shrink-0 px-2.5 py-1 rounded-xl text-[11px] font-bold"
                        style={{
                          background: trip.seats && trip.cargo ? '#a855f715' : trip.seats ? '#5ba3f515' : '#f59e0b15',
                          color: trip.seats && trip.cargo ? '#a855f7' : trip.seats ? '#5ba3f5' : '#f59e0b',
                          border: `1.5px solid ${trip.seats && trip.cargo ? '#a855f730' : trip.seats ? '#5ba3f530' : '#f59e0b30'}`,
                        }}>
                        {trip.seats && trip.cargo ? '👥+📦' : trip.seats ? '👥' : '📦'}
                      </div>
                    </div>
                    <div className="rounded-2xl p-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
                      <div className="flex items-stretch gap-3">
                        <div className="flex flex-col items-center shrink-0 pt-1">
                          <div className="w-2.5 h-2.5 rounded-full bg-[#5ba3f5]" />
                          <div className="flex-1 w-px my-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.12)', minHeight: 18 }} />
                          <div className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
                        </div>
                        <div className="flex-1 flex flex-col justify-between gap-2 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-bold text-[14px] text-white truncate">{trip.from}</p>
                              {trip.fromCountry && <p className="text-[11px] text-[#607080]">{trip.fromCountry}</p>}
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-[13px] font-bold text-[#5ba3f5]">{trip.time}</p>
                              <p className="text-[11px] text-[#607080]">{trip.date}</p>
                            </div>
                          </div>
                          <div className="flex items-end justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-bold text-[14px] text-white truncate">{trip.to}</p>
                              {trip.toCountry && <p className="text-[11px] text-[#607080]">{trip.toCountry}</p>}
                            </div>
                            {trip.duration && (
                              <span className="shrink-0 text-[11px] font-bold text-[#5ba3f5] px-2 py-0.5 rounded-lg bg-[#5ba3f510]">{trip.duration}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none"
                      style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch', paddingBottom: 2 }}>
                      {trip.seats && (
                        <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#5ba3f510] shrink-0" style={{ scrollSnapAlign: 'start' }}>
                          <UsersIcon className="w-3 h-3 text-[#5ba3f5]" />
                          <span className="text-[11px] font-bold text-white">{trip.seats} м.</span>
                          <span className="text-[11px] font-semibold text-[#5ba3f5]">{trip.price || '—'}</span>
                        </div>
                      )}
                      {trip.childSeats && (
                        <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#10b98110] shrink-0" style={{ scrollSnapAlign: 'start' }}>
                          <span className="text-[11px]">👶</span>
                          <span className="text-[11px] font-bold text-white">{trip.childSeats} м.</span>
                          <span className="text-[11px] font-semibold text-[#10b981]">{trip.childPrice || '—'}</span>
                        </div>
                      )}
                      {trip.cargo && (
                        <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#f59e0b10] shrink-0" style={{ scrollSnapAlign: 'start' }}>
                          <Truck className="w-3 h-3 text-[#f59e0b]" />
                          <span className="text-[11px] font-bold text-white">{trip.cargo}</span>
                          <span className="text-[11px] font-semibold text-[#f59e0b]">{trip.cargoPrice || '—'}</span>
                        </div>
                      )}
                      {((trip.rawSeats === 1 || trip.rawSeats === 2) || (trip.rawCargo > 0 && trip.rawCargo <= 10)) && (
                        <div className="flex items-center gap-1 px-2 py-1 rounded-xl shrink-0"
                          style={{ background: '#ef444412', border: '1.5px solid #ef444430', scrollSnapAlign: 'start' }}>
                          <span className="text-[10px]">🔥</span>
                          <span className="text-[10px] font-black text-[#ef4444]">
                            {trip.rawSeats === 1 ? 'Последнее место' : trip.rawSeats === 2 ? 'Почти занято' : 'Мало груза'}
                          </span>
                        </div>
                      )}
                    </div>
                    {trip.notes && (
                      <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl border border-white/[0.06]" style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <MapPin className="w-3.5 h-3.5 text-[#607080] shrink-0 mt-0.5" />
                        <p className="text-[12px] text-[#94a3b8] leading-relaxed line-clamp-2">{trip.notes}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
    </>
  );
}