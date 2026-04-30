import React, { useState, useEffect } from 'react';
import {
  Settings, Star, Shield, Bell, HelpCircle, LogOut,
  ChevronRight, Phone, Mail, MapPin,
  Heart, Calendar, Info, Edit2, Truck,
  Package, Award, Copy, Check, User,
  Calculator, FileText, Scale, UserCheck, Share2, Crown,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { useUser } from '../contexts/UserContext';
import * as notificationsApi from '../api/notificationsApi';
import { getUserStats } from '../api/dataApi';

function calcCompleteness(user: any, isDriver: boolean): { pct: number; missing: string[] } {
  const checks = [
    { field: user?.firstName,   label: 'Имя' },
    { field: user?.lastName,    label: 'Фамилия' },
    { field: user?.phone,       label: 'Телефон' },
    { field: user?.avatarUrl,   label: 'Фото профиля' },
    { field: user?.city,        label: 'Город' },
    { field: user?.about,       label: 'О себе' },
    ...(isDriver ? [{ field: user?.vehicle?.brand, label: 'Информация об автомобиле' }] : []),
  ];
  const missing = checks.filter(c => !c.field).map(c => c.label);
  const pct = Math.round(((checks.length - missing.length) / checks.length) * 100);
  return { pct, missing };
}

export function ProfilePage() {
  const navigate = useNavigate();
  const { user: currentUser, loading } = useUser();
  const userRole = sessionStorage.getItem('userRole') || 'sender';
  const isDriver = userRole === 'driver';

  const accent = isDriver ? '#5ba3f5' : '#10b981';
  const accentDim = isDriver ? '#5ba3f510' : '#10b98110';
  const accentBorder = isDriver ? '#5ba3f520' : '#10b98120';

  const displayName = currentUser
    ? (currentUser.fullName || `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim())
    : 'Пользователь';
  const displayPhone = currentUser?.phone || null;
  const displayEmail = currentUser?.email || null;
  const displayBirthDate = currentUser?.birthDate
    ? new Date(currentUser.birthDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  const [ratingData, setRatingData] = useState({ avg: 0, count: 0, trips: 0 });
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!currentUser?.email) return;
    getUserStats(currentUser.email, userRole as 'driver' | 'sender')
      .then(stats => setRatingData({ avg: stats.avgRating, count: stats.reviewCount, trips: stats.tripCount }))
      .catch(() => {});
  }, [currentUser?.email, userRole]);

  useEffect(() => {
    if (!currentUser?.email) return;
    const load = async () => {
      try {
        const notifs = await notificationsApi.getNotifications(currentUser.email!);
        setUnreadNotifications(notifs.filter(n => n.isUnread).length);
      } catch { setUnreadNotifications(0); }
    };
    load();
    const iv = setInterval(load, 10000);
    return () => clearInterval(iv);
  }, [currentUser?.email]);

  const displayRating = ratingData.avg > 0 ? ratingData.avg.toFixed(1) : null;

  const handleCopyId = () => {
    if (currentUser?.email) {
      navigator.clipboard.writeText(currentUser.email).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const initials = [currentUser?.firstName?.[0], currentUser?.lastName?.[0]]
    .filter(Boolean).join('').toUpperCase() || '?';

  const stats = [
    { label: isDriver ? 'Поездки' : 'Заказов', value: ratingData.trips > 0 ? String(ratingData.trips) : '0', icon: isDriver ? Truck : Package, color: accent },
    { label: 'Рейтинг', value: displayRating || '—', icon: Star, color: '#f59e0b' },
    { label: 'Отзывы', value: String(ratingData.count), icon: Award, color: '#8b5cf6' },
  ];

  const accountItems = [
    { icon: Edit2,  label: 'Редактировать профиль', sub: 'Имя, фото, контакты', action: () => navigate('/profile/edit'), color: '#5ba3f5' },
    { icon: Star,   label: 'Мои отзывы',            sub: displayRating ? `★ ${displayRating} · ${ratingData.count} отзывов` : 'Все отзывы', action: () => navigate('/reviews'), color: '#f59e0b' },
    ...(isDriver ? [{ icon: Shield, label: 'Верификация', sub: 'Документы водителя', action: () => navigate('/documents'), color: '#10b981' }] : []),
  ];

  const appItems = [
    { icon: Bell,       label: 'Уведомления',    sub: 'Оповещения и пуши',        action: () => navigate('/notifications'), color: '#8b5cf6', badge: unreadNotifications > 0 ? unreadNotifications : undefined },
    { icon: Heart,      label: 'Избранное',       sub: 'Сохранённые поездки',       action: () => navigate('/favorites'),     color: '#ec4899' },
    { icon: Calculator, label: 'Калькулятор цен', sub: 'Рассчитать стоимость',      action: () => navigate('/calculator'),    color: '#f59e0b' },
    { icon: Settings,   label: 'Настройки',       sub: 'Тема, язык, безопасность',  action: () => navigate('/settings'),      color: '#607080' },
  ];

  const supportItems = [
    { icon: HelpCircle, label: 'Помощь',                     sub: 'FAQ и поддержка 24/7',          action: () => navigate('/help'),               color: '#14b8a6' },
    { icon: Info,       label: 'О приложении',               sub: 'Ovora Cargo v1.0',              action: () => navigate('/about'),              color: '#6366f1' },
    { icon: FileText,   label: 'Политика конфиденциальности', sub: 'Обработка данных',              action: () => navigate('/privacy-policy'),     color: '#607080' },
    { icon: Scale,      label: 'Условия использования',       sub: 'Пользовательское соглашение',   action: () => navigate('/terms-of-service'),   color: '#607080' },
  ];

  // ── Avatar component (shared) ──
  const renderAvatar = (size: number, fontSize: string) => (
    <div className="relative shrink-0">
      <div className="overflow-hidden"
        style={{
          width: size, height: size, borderRadius: size > 60 ? 24 : 20,
          background: currentUser?.avatarUrl ? undefined : `linear-gradient(135deg, ${accent}, #7c3aed)`,
          boxShadow: `0 8px 28px ${accent}35`,
        }}>
        {currentUser?.avatarUrl
          ? <img src={currentUser.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center">
              <span className={`text-white font-black ${fontSize}`}>{initials}</span>
            </div>
        }
      </div>
      <div className={`absolute -bottom-1.5 -right-1.5 rounded-xl flex items-center justify-center border-2 border-[#0e1621] ${isDriver ? 'bg-[#5ba3f5]' : 'bg-emerald-500'}`}
        style={{ width: size > 60 ? 28 : 22, height: size > 60 ? 28 : 22, boxShadow: `0 4px 12px ${isDriver ? '#5ba3f550' : '#10b98150'}` }}>
        {isDriver ? <Truck style={{ width: size > 60 ? 14 : 10, height: size > 60 ? 14 : 10, color: '#fff' }} /> : <Package style={{ width: size > 60 ? 14 : 10, height: size > 60 ? 14 : 10, color: '#fff' }} />}
      </div>
    </div>
  );

  return (
    <div className="font-['Sora'] bg-[#0e1621] text-white min-h-screen">

      {/* ══════════════════════════ MOBILE ══════════════════════════ */}
      <div className="md:hidden flex flex-col min-h-screen">

        {/* ── HERO ── */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0"
              style={{ background: 'linear-gradient(145deg, #0f2744 0%, #0e1621 55%, #0e1621 100%)' }} />
            <div className="absolute -top-20 sm:-top-24 -right-20 sm:-right-24 w-56 sm:w-72 h-56 sm:h-72 rounded-full"
              style={{ background: 'radial-gradient(circle, #1e4a8a 0%, transparent 70%)', opacity: 0.35 }} />
            <div className="absolute top-8 -left-12 sm:-left-16 w-40 sm:w-48 h-40 sm:h-48 rounded-full"
              style={{ background: 'radial-gradient(circle, #1a3a6b 0%, transparent 70%)', opacity: 0.25 }} />
          </div>

          <div className="relative flex items-center justify-between px-4 sm:px-5"
            style={{ paddingTop: 'max(52px, env(safe-area-inset-top, 52px))', paddingBottom: 4 }}>
            <div>
              <p className="text-[10px] sm:text-[11px] font-semibold tracking-widest uppercase text-[#607080]">Аккаунт</p>
              <h1 className="text-[20px] sm:text-[22px] font-black text-white leading-tight">Профиль</h1>
            </div>
            <button onClick={() => navigate('/settings')}
              className="w-9 sm:w-10 h-9 sm:h-10 rounded-2xl flex items-center justify-center bg-white/[0.07] border border-white/10 text-[#607080] active:scale-90 transition-all">
              <Settings className="w-4.5 sm:w-5 h-4.5 sm:h-5" />
            </button>
          </div>

          {loading ? (
            <div className="relative px-4 sm:px-5 pt-5 sm:pt-6 pb-5 sm:pb-6 animate-pulse">
              <div className="flex items-end gap-3 sm:gap-4">
                <div className="w-16 sm:w-20 h-16 sm:h-20 rounded-3xl bg-white/10" />
                <div className="flex-1 pb-1 space-y-2">
                  <div className="h-4 sm:h-5 w-32 sm:w-40 rounded-lg bg-white/10" />
                  <div className="h-3 w-20 sm:w-24 rounded-lg bg-white/[0.07]" />
                </div>
              </div>
            </div>
          ) : currentUser ? (
            <div className="relative px-4 sm:px-5 pt-4 sm:pt-5 pb-5 sm:pb-6">
              <div className="flex items-end gap-3 sm:gap-4">
                {renderAvatar(72, 'text-2xl')}
                <div className="flex-1 min-w-0 pb-1">
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    <h2 className="text-[16px] sm:text-[18px] font-black text-white leading-tight truncate max-w-[140px] sm:max-w-[180px]">{displayName}</h2>
                    {isDriver && (
                      <span className="flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-[9px] sm:text-[10px] font-bold shrink-0">
                        <Shield className="w-2 sm:w-2.5 h-2 sm:h-2.5" /> Верифицирован
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 sm:gap-2.5 mt-0.5 sm:mt-1 flex-wrap">
                    <span className={`text-[11px] sm:text-[12px] font-bold ${isDriver ? 'text-emerald-400' : 'text-[#5ba3f5]'}`}>
                      {isDriver ? 'Водитель' : 'Отправитель'}
                    </span>
                    {displayRating && (
                      <span className="flex items-center gap-1">
                        <Star className="w-2.5 sm:w-3 h-2.5 sm:h-3 text-amber-400 fill-amber-400" />
                        <span className="text-[11px] sm:text-[12px] font-black text-amber-400">{displayRating}</span>
                        <span className="text-[10px] sm:text-[11px] text-[#607080]">· {ratingData.count} отз.</span>
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={() => navigate('/profile/edit')}
                  className="shrink-0 w-8 sm:w-9 h-8 sm:h-9 rounded-xl sm:rounded-2xl flex items-center justify-center bg-[#5ba3f5]/15 border border-[#5ba3f5]/25 text-[#5ba3f5] active:scale-90 transition-all mb-1">
                  <Edit2 className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                </button>
              </div>
              <div className="mt-4 sm:mt-5 grid grid-cols-3 gap-2 sm:gap-2.5">
                {stats.map((s) => {
                  const Icon = s.icon;
                  return (
                    <div key={s.label}
                      className="rounded-xl sm:rounded-2xl bg-white/[0.05] border border-white/[0.07] p-2.5 sm:p-3 flex flex-col items-center gap-0.5 sm:gap-1">
                      <Icon className="w-3.5 sm:w-4 h-3.5 sm:h-4 mb-0.5" style={{ color: s.color }} />
                      <span className="text-[17px] sm:text-[19px] font-black text-white leading-none">{s.value}</span>
                      <span className="text-[9px] sm:text-[10px] font-semibold text-[#607080] uppercase tracking-wide text-center">{s.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>

        <main className="flex-1 px-3 sm:px-4 pb-28 sm:pb-32 md:pb-10 flex flex-col gap-3 sm:gap-4 mt-1">
          {currentUser && (displayPhone || displayEmail || currentUser.city || displayBirthDate) && (
            <section>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#607080] mb-2 px-1">Контакты</p>
              <div className="rounded-3xl bg-white/[0.04] border border-white/[0.07] overflow-hidden divide-y divide-white/[0.06]">
                {displayPhone && <ContactRow icon={Phone} color="#5ba3f5" label="Телефон" value={displayPhone} />}
                {displayEmail && (
                  <div className="flex items-center gap-3 px-4 py-3.5">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#14b8a620', border: '1px solid #14b8a630' }}>
                      <Mail className="w-4 h-4" style={{ color: '#14b8a6' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-[#607080] font-semibold">E-mail</p>
                      <p className="text-[13px] font-semibold text-white truncate">{displayEmail}</p>
                    </div>
                    <button onClick={handleCopyId}
                      className="w-7 h-7 rounded-xl flex items-center justify-center text-[#607080] hover:text-white active:scale-90 transition-all"
                      style={{ background: 'rgba(255,255,255,0.05)' }}>
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                )}
                {currentUser.city && <ContactRow icon={MapPin} color="#f59e0b" label="Город" value={currentUser.city} />}
                {displayBirthDate && <ContactRow icon={Calendar} color="#8b5cf6" label="Дата рождения" value={displayBirthDate} />}
              </div>
            </section>
          )}
          {/* ── Completeness card ── */}
          {currentUser && (() => {
            const { pct, missing } = calcCompleteness(currentUser, isDriver);
            if (pct >= 100) return null;
            return (
              <div className="mx-1 mb-2 rounded-3xl overflow-hidden border border-white/[0.06]"
                style={{ background: 'linear-gradient(135deg,#0d1929,#111e30)' }}>
                <div className="px-4 pt-4 pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4" style={{ color: accent }} />
                      <span className="text-[13px] font-bold text-white">Профиль заполнен на {pct}%</span>
                    </div>
                    <button onClick={() => navigate('/profile/edit')}
                      className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                      style={{ background: `${accent}20`, color: accent }}>
                      Заполнить
                    </button>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden mb-2.5">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${accent}, ${accent}aa)` }} />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {missing.slice(0, 3).map(m => (
                      <span key={m} className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(255,255,255,0.05)', color: '#607080' }}>
                        + {m}
                      </span>
                    ))}
                    {missing.length > 3 && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(255,255,255,0.05)', color: '#607080' }}>
                        ещё {missing.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ── Referral card ── */}
          {currentUser?.email && (() => {
            const refLink = `https://ovora-cargo.ru/?ref=${encodeURIComponent(currentUser.email)}`;
            return (
              <div className="mx-1 mb-2 rounded-3xl overflow-hidden border border-white/[0.06]"
                style={{ background: 'linear-gradient(135deg,#0d1929,#111e30)' }}>
                <div className="px-4 py-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0"
                    style={{ background: '#f59e0b20' }}>
                    <Share2 className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-bold text-white">Пригласи друга</div>
                    <div className="text-[11px] text-[#607080] truncate">{refLink}</div>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(refLink).catch(() => {});
                      navigator.share?.({ url: refLink, title: 'Ovora Cargo — грузоперевозки' }).catch(() => {});
                    }}
                    className="text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0"
                    style={{ background: '#f59e0b20', color: '#f59e0b' }}>
                    Поделиться
                  </button>
                </div>
              </div>
            );
          })()}

          <MenuSection title="Аккаунт" items={accountItems} />
          <MenuSection title="Приложение" items={appItems} />
          <MenuSection title="Поддержка" items={supportItems} />
          <button onClick={() => navigate('/welcome')}
            className="w-full flex items-center gap-3.5 px-4 py-4 rounded-3xl border border-rose-500/20 bg-rose-500/[0.07] active:scale-[0.98] transition-all text-left">
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center bg-rose-500/20 shrink-0">
              <LogOut className="w-4.5 h-4.5 text-rose-400" />
            </div>
            <div className="flex-1">
              <p className="text-[15px] font-bold text-rose-400">Выйти из аккаунта</p>
              <p className="text-[11px] text-rose-400/60">Завершить сессию</p>
            </div>
          </button>
          <p className="text-center text-[11px] text-[#607080]/50 font-medium pb-2">Ovora Cargo · v1.0.0</p>
        </main>
      </div>

      {/* ══════════════════════════ DESKTOP ══════════════════════════════════ */}
      <div className="hidden md:flex flex-col min-h-screen">

        {/* ── Compact header ── */}
        <div className="shrink-0 border-b border-white/[0.06] px-6 lg:px-10 py-4" style={{ background: '#0a1520' }}>
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${accent}, #7c3aed)`, boxShadow: `0 4px 16px ${accent}50` }}>
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-[20px] font-black text-white leading-tight">Профиль</h1>
                <p className="text-[11px] text-[#4a6278] font-semibold">Управление аккаунтом</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => navigate('/notifications')}
                className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                style={{ background: '#ffffff08', border: '1px solid #ffffff0f' }}>
                <Bell className="w-4 h-4" style={{ color: '#8b5cf6' }} />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 rounded-full bg-[#8b5cf6] text-white text-[9px] font-black flex items-center justify-center">
                    {unreadNotifications}
                  </span>
                )}
              </button>
              <button onClick={() => navigate('/settings')}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-[12px] font-bold transition-all hover:text-white"
                style={{ background: '#ffffff08', border: '1px solid #ffffff0f', color: '#8a9bb0' }}>
                <Settings className="w-3.5 h-3.5" /> Настройки
              </button>
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e2d3d transparent' }}>
          <div className="max-w-5xl mx-auto px-6 lg:px-10 py-8 flex gap-8 items-start">

            {/* ── LEFT: Profile card ── */}
            <div className="w-[300px] flex-shrink-0 flex flex-col gap-4 sticky top-8">

              <div className="rounded-3xl overflow-hidden"
                style={{
                  background: 'linear-gradient(160deg, #0f1f38 0%, #0c1624 100%)',
                  border: `1px solid #1a2d45`,
                  boxShadow: `0 0 0 1px ${accent}10, 0 24px 48px #00000060`,
                }}>
                <div className="h-1" style={{ background: `linear-gradient(90deg, ${accent}, ${accent}60, transparent)` }} />
                <div className="p-6">
                  {loading ? (
                    <div className="animate-pulse space-y-4">
                      <div className="w-20 h-20 rounded-3xl bg-white/10" />
                      <div className="space-y-2">
                        <div className="h-5 w-40 rounded-lg bg-white/10" />
                        <div className="h-3 w-24 rounded-lg bg-white/[0.07]" />
                      </div>
                    </div>
                  ) : currentUser ? (
                    <>
                      {/* Avatar + edit */}
                      <div className="flex items-start justify-between mb-5">
                        {renderAvatar(72, 'text-2xl')}
                        <button onClick={() => navigate('/profile/edit')}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all hover:scale-105 active:scale-95"
                          style={{ background: accentDim, border: `1px solid ${accentBorder}`, color: accent }}>
                          <Edit2 className="w-3 h-3" /> Изменить
                        </button>
                      </div>

                      {/* Name & role */}
                      <div className="mb-5">
                        <h2 className="text-[20px] font-black text-white leading-tight mb-1">{displayName}</h2>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[12px] font-bold" style={{ color: accent }}>
                            {isDriver ? 'Водитель' : 'Отправитель'}
                          </span>
                          {isDriver && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/25 text-emerald-400">
                              <Shield className="w-2.5 h-2.5" /> Верифицирован
                            </span>
                          )}
                          {displayRating && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                              <span className="text-[12px] font-black text-amber-400">{displayRating}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-2 mb-5">
                        {stats.map((s) => {
                          const Icon = s.icon;
                          return (
                            <div key={s.label} className="rounded-2xl p-3 flex flex-col items-center gap-1 text-center transition-transform hover:-translate-y-0.5"
                              style={{ background: s.color + '0d', border: `1px solid ${s.color}22` }}>
                              <Icon className="w-4 h-4" style={{ color: s.color }} />
                              <span className="text-[18px] font-black text-white leading-none">{s.value}</span>
                              <span className="text-[9px] font-bold text-[#607080] uppercase tracking-wide leading-tight">{s.label}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Contacts */}
                      {(displayPhone || displayEmail || currentUser.city || displayBirthDate) && (
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-[.18em] mb-2.5" style={{ color: '#3a5570' }}>Контакты</p>
                          <div className="rounded-2xl overflow-hidden divide-y"
                            style={{ background: '#0a1622', border: '1px solid #1a2d40', divideColor: '#1a2d40' }}>
                            {displayPhone && <DesktopContactRow icon={Phone} color="#5ba3f5" label="Телефон" value={displayPhone} />}
                            {displayEmail && (
                              <div className="flex items-center gap-3 px-4 py-3" style={{ borderTop: '1px solid #1a2d40' }}>
                                <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#14b8a612' }}>
                                  <Mail className="w-3.5 h-3.5" style={{ color: '#14b8a6' }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[9px] text-[#607080] font-semibold uppercase tracking-wide">E-mail</p>
                                  <p className="text-[12px] font-semibold text-white truncate">{displayEmail}</p>
                                </div>
                                <button onClick={handleCopyId}
                                  className="w-6 h-6 rounded-lg flex items-center justify-center text-[#607080] hover:text-white transition-all"
                                  style={{ background: '#ffffff08' }}>
                                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                </button>
                              </div>
                            )}
                            {currentUser.city && <DesktopContactRow icon={MapPin} color="#f59e0b" label="Город" value={currentUser.city} />}
                            {displayBirthDate && <DesktopContactRow icon={Calendar} color="#8b5cf6" label="Дата рождения" value={displayBirthDate} />}
                          </div>
                        </div>
                      )}
                    </>
                  ) : null}
                </div>
              </div>

              {/* Logout */}
              <button onClick={() => navigate('/welcome')}
                className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-left transition-all hover:scale-[1.01] active:scale-[0.99]"
                style={{ background: '#1a0a0f', border: '1px solid #3d1220', boxShadow: '0 4px 16px #ef444418' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'linear-gradient(135deg,#7f1d1d,#ef4444)', boxShadow: '0 4px 12px #ef444440' }}>
                  <LogOut className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-[14px] font-bold text-rose-400">Выйти из аккаунта</p>
                  <p className="text-[11px] text-rose-400/40">Завершить сессию</p>
                </div>
              </button>

              <p className="text-center text-[10px] font-medium" style={{ color: '#2a3f52' }}>Ovora Cargo · v1.0.0</p>
            </div>

            {/* ── RIGHT: Menu sections ── */}
            <div className="flex-1 min-w-0 flex flex-col gap-6">
              <DesktopMenuBlock title="Аккаунт" items={accountItems} />
              <DesktopMenuBlock title="Приложение" items={appItems} />
              <DesktopMenuBlock title="Поддержка" items={supportItems} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Mobile sub-components ──────────────────────────────────────────────────────

function ContactRow({ icon: Icon, color, label, value }: {
  icon: React.ElementType; color: string; label: string; value: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${color}20`, border: `1px solid ${color}30` }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-[#607080] font-semibold">{label}</p>
        <p className="text-[13px] font-semibold text-white truncate">{value}</p>
      </div>
    </div>
  );
}

function MenuSection({ title, items }: {
  title: string;
  items: Array<{ icon: React.ElementType; label: string; sub: string; action: () => void; color: string; badge?: number }>;
}) {
  return (
    <section>
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#607080] mb-2 px-1">{title}</p>
      <div className="rounded-3xl bg-white/[0.04] border border-white/[0.07] overflow-hidden divide-y divide-white/[0.06]">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.label} onClick={item.action}
              className="w-full flex items-center gap-3.5 px-4 py-3.5 text-left hover:bg-white/[0.03] active:bg-white/[0.06] transition-all">
              <div className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: `${item.color}18`, border: `1px solid ${item.color}28` }}>
                <Icon className="w-4.5 h-4.5" style={{ color: item.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold text-white">{item.label}</p>
                <p className="text-[11px] text-[#607080]">{item.sub}</p>
              </div>
              {item.badge ? (
                <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-[#5ba3f5] text-white text-[10px] font-black flex items-center justify-center shrink-0">
                  {item.badge}
                </span>
              ) : (
                <ChevronRight className="w-4 h-4 text-[#607080]/50 shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

// ── Desktop sub-components ──────────────────────────────────────────────────────

function DesktopContactRow({ icon: Icon, color, label, value }: {
  icon: React.ElementType; color: string; label: string; value: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3" style={{ borderTop: '1px solid #1a2d40' }}>
      <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}15` }}>
        <Icon className="w-3.5 h-3.5" style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[9px] text-[#607080] font-semibold uppercase tracking-wide">{label}</p>
        <p className="text-[12px] font-semibold text-white truncate">{value}</p>
      </div>
    </div>
  );
}

function DesktopMenuBlock({ title, items }: {
  title: string;
  items: Array<{ icon: React.ElementType; label: string; sub: string; action: () => void; color: string; badge?: number }>;
}) {
  return (
    <section>
      {/* Section header */}
      <div className="flex items-center gap-3 mb-3 px-1">
        <p className="text-[10px] font-black uppercase tracking-[.18em]" style={{ color: '#3a5570' }}>{title}</p>
        <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, #1e2d3d, transparent)' }} />
      </div>

      {/* Items grid */}
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              onClick={item.action}
              className="relative text-left rounded-2xl p-5 overflow-hidden group transition-all hover:-translate-y-0.5"
              style={{
                background: 'linear-gradient(145deg, #0e1e32, #0a1520)',
                border: '1px solid #1a2d42',
                boxShadow: '0 4px 20px #00000040',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = item.color + '40';
                (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 32px ${item.color}18, 0 0 0 1px ${item.color}20`;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = '#1a2d42';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px #00000040';
              }}
            >
              {/* Corner glow */}
              <div className="absolute top-0 right-0 w-20 h-20 pointer-events-none rounded-full"
                style={{ background: `radial-gradient(circle at top right, ${item.color}12, transparent 70%)` }} />

              {/* Icon */}
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4 shrink-0 transition-transform group-hover:scale-110 group-hover:-rotate-6"
                style={{
                  background: `linear-gradient(135deg, ${item.color}22, ${item.color}0d)`,
                  border: `1px solid ${item.color}30`,
                  boxShadow: `0 4px 14px ${item.color}20`,
                }}>
                <Icon style={{ width: 20, height: 20, color: item.color }} />
              </div>

              {/* Text */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[15px] font-black text-white leading-tight">{item.label}</p>
                  <p className="text-[11px] mt-0.5 leading-snug" style={{ color: '#4a6580' }}>{item.sub}</p>
                </div>
                {item.badge ? (
                  <span className="mt-0.5 min-w-[22px] h-[22px] px-1.5 rounded-full text-white text-[10px] font-black flex items-center justify-center shrink-0"
                    style={{ background: `linear-gradient(135deg, ${item.color}, ${item.color}cc)`, boxShadow: `0 2px 8px ${item.color}50` }}>
                    {item.badge}
                  </span>
                ) : (
                  <ChevronRight className="w-4 h-4 mt-0.5 shrink-0 transition-transform duration-200 group-hover:translate-x-1" style={{ color: '#2a3f52' }} />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
