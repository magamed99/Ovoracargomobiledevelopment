import { useState, useRef } from 'react';
import {
  Camera, Mail, Phone, MapPin, Calendar, ArrowLeft, Check,
  Loader2, User as UserIcon, Truck, Package, FileText, Sparkles,
  Save, Eye, EyeOff,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router';
import { useUser } from '../contexts/UserContext';
import { SK } from '../constants/storageKeys';
import { toast } from 'sonner';
import {
  updateUser as updateUserApi, uploadAvatar,
  syncUserNameInChats, syncUserNameInTrips,
} from '../api/userApi';

// ── Field definitions ────────────────────────────────────────────────────────
const FIELDS = [
  { label: 'Имя',           name: 'firstName', type: 'text',  icon: UserIcon, placeholder: 'Введите имя',         color: '#5ba3f5', maxLength: 50  },
  { label: 'Фамилия',       name: 'lastName',  type: 'text',  icon: UserIcon, placeholder: 'Введите фамилию',     color: '#5ba3f5', maxLength: 50  },
  { label: 'Телефон',       name: 'phone',     type: 'tel',   icon: Phone,    placeholder: '+992 900 000 000',    color: '#10b981', maxLength: 20  },
  { label: 'Email',         name: 'email',     type: 'email', icon: Mail,     placeholder: 'example@mail.com',    color: '#a855f7', maxLength: 100 },
  { label: 'Город',         name: 'city',      type: 'text',  icon: MapPin,   placeholder: 'Душанбе',             color: '#f59e0b', maxLength: 80  },
  { label: 'Дата рождения', name: 'birthDate', type: 'date',  icon: Calendar, placeholder: '',                    color: '#ec4899', maxLength: undefined },
] as const;

// ── Component ────────────────────────────────────────────────────────────────
export function EditProfile() {
  const navigate = useNavigate();
  const { user: saved, updateUser: updateUserContext } = useUser();
  const userRole = sessionStorage.getItem(SK.USER_ROLE) || 'sender';
  const isDriver = userRole === 'driver';

  const [formData, setFormData] = useState({
    firstName: saved?.firstName || '',
    lastName:  saved?.lastName  || '',
    phone:     saved?.phone     || '',
    email:     saved?.email     || '',
    city:      saved?.city      || 'Душанбе',
    birthDate: saved?.birthDate || '',
    about:     saved?.about     || (isDriver ? 'Опытный водитель' : ''),
  });
  const [saving,        setSaving]        = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(saved?.avatarUrl || null);
  const [avatarFile,    setAvatarFile]    = useState<File | null>(null);
  const [focusedField,  setFocusedField]  = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    if (!saved?.email) { toast.error('Ошибка: email не найден'); return; }
    // Валидация телефона: только +, цифры, пробелы, дефис — мин 7 цифр
    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (formData.phone && phoneDigits.length < 7) {
      toast.error('Телефон: введите не менее 7 цифр');
      return;
    }
    setSaving(true);
    try {
      let avatarUrl = saved?.avatarUrl;
      if (avatarFile) {
        toast.loading('Загружаем фото...', { id: 'avatar-upload' });
        try {
          avatarUrl = await uploadAvatar(saved.email, avatarFile);
          toast.success('Фото загружено!', { id: 'avatar-upload' });
        } catch (err) {
          toast.error(`Ошибка загрузки фото: ${err}`, { id: 'avatar-upload' });
        }
      }
      const updates = { ...formData, ...(avatarUrl !== undefined ? { avatarUrl } : {}) };
      await updateUserApi(saved.email, updates);
      await updateUserContext(updates);

      const { firstName, lastName } = formData;
      if (firstName || lastName) {
        const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
        const syncData = { firstName, lastName, fullName, ...(avatarUrl ? { avatarUrl } : {}) };
        syncUserNameInChats(saved.email, syncData).catch(() => {});
        syncUserNameInTrips(saved.email, syncData).catch(() => {});
      }

      try {
        const contactsMap: Record<string, any> = JSON.parse(localStorage.getItem(SK.CHAT_CONTACTS) || '{}');
        const newFullName = [formData.firstName, formData.lastName].filter(Boolean).join(' ').trim();
        let changed = false;
        for (const chatId of Object.keys(contactsMap)) {
          if (contactsMap[chatId]?.email === saved.email) {
            contactsMap[chatId] = {
              ...contactsMap[chatId],
              name: newFullName || contactsMap[chatId].name,
              ...(avatarUrl ? { avatar: avatarUrl } : {}),
            };
            changed = true;
          }
        }
        if (changed) {
          localStorage.setItem(SK.CHAT_CONTACTS, JSON.stringify(contactsMap));
          window.dispatchEvent(new Event('ovora_chat_update'));
        }
      } catch { /* ignore */ }

      toast.success('Профиль сохранён!');
      navigate('/profile');
    } catch (err) {
      console.error('[EditProfile] Save error:', err);
      toast.error(`Ошибка сохранения: ${err}`);
    } finally {
      setSaving(false);
    }
  };

  const roleColor  = isDriver ? '#10b981' : '#5ba3f5';
  const roleBg     = isDriver ? '#10b98118' : '#5ba3f518';
  const RoleIcon   = isDriver ? Truck : Package;
  const roleLabel  = isDriver ? 'Водитель' : 'Отправитель';

  const initials = [formData.firstName?.[0], formData.lastName?.[0]].filter(Boolean).join('') || '?';
  const displayName = [formData.firstName, formData.lastName].filter(Boolean).join(' ') || 'Ваш профиль';

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="font-['Sora'] bg-[#0e1621] text-white min-h-screen">

      {/* ══════════════════════════ MOBILE (unchanged) ══════════════════════════ */}
      <div className="md:hidden flex flex-col min-h-screen max-w-2xl mx-auto">

        {/* ── HEADER ── */}
        <div className="relative overflow-hidden shrink-0">
          {/* Background */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0"
              style={{ background: 'linear-gradient(160deg, #0d2040 0%, #0e1621 65%)' }} />
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full pointer-events-none"
              style={{ background: `radial-gradient(circle, ${roleColor} 0%, transparent 70%)`, opacity: 0.10 }} />
          </div>

          {/* Top bar */}
          <div className="relative flex items-center justify-between px-4 pt-14 pb-4">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/[0.07] border border-white/10 text-white active:scale-90 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#607080]">Редактирование</p>
              <p className="text-[16px] font-black text-white leading-tight">Профиля</p>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold transition-all active:scale-90 disabled:opacity-60"
              style={{ background: `linear-gradient(135deg, #1d4ed8, ${roleColor})` }}
            >
              {saving
                ? <Loader2 className="w-4.5 h-4.5 animate-spin" />
                : <Check className="w-4.5 h-4.5" strokeWidth={3} />
              }
            </button>
          </div>

          {/* Avatar block */}
          <motion.div
            className="flex flex-col items-center pb-7 gap-3"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          >
            {/* Avatar */}
            <div className="relative">
              {/* Glow ring */}
              <div className="absolute inset-0 rounded-full pointer-events-none"
                style={{ boxShadow: `0 0 0 3px ${roleColor}40, 0 8px 32px ${roleColor}30` }} />

              <div className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center"
                style={{ background: avatarPreview ? undefined : `linear-gradient(135deg, #1d4ed8, ${roleColor})` }}>
                {avatarPreview
                  ? <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                  : <span className="text-white text-[28px] font-black">{initials}</span>
                }
              </div>

              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />

              {/* Camera button */}
              <motion.button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-2xl flex items-center justify-center text-white border-2 border-[#0e1621]"
                style={{ background: `linear-gradient(135deg, #1d4ed8, ${roleColor})` }}
                whileTap={{ scale: 0.88 }}
              >
                <Camera className="w-3.5 h-3.5" />
              </motion.button>
            </div>

            {/* Name & role */}
            <div className="flex flex-col items-center gap-1.5">
              <p className="text-[18px] font-black text-white">{displayName}</p>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black px-3 py-1 rounded-full flex items-center gap-1.5"
                  style={{ background: roleBg, color: roleColor, border: `1.5px solid ${roleColor}35` }}>
                  <RoleIcon className="w-3 h-3" />
                  {roleLabel}
                </span>
                <AnimatePresence>
                  {avatarFile && (
                    <motion.span
                      className="text-[11px] font-bold px-3 py-1 rounded-full text-amber-400"
                      style={{ background: '#f59e0b18', border: '1.5px solid #f59e0b35' }}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                    >
                      📷 Фото выбрано
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── FORM ── */}
        <div className="flex-1 overflow-y-auto pb-28">
          <div className="px-4 flex flex-col gap-4 pt-2">

            {/* Personal info section */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.35 }}
            >
              <div className="flex items-center gap-2 px-1 mb-3">
                <Sparkles className="w-3.5 h-3.5 text-[#5ba3f5]" />
                <p className="text-[10px] font-black uppercase tracking-widest text-[#607080]">Личные данные</p>
              </div>

              <div className="rounded-3xl border border-white/[0.07] overflow-hidden divide-y divide-white/[0.06]"
                style={{ background: 'rgba(255,255,255,0.04)' }}>
                {FIELDS.map(({ label, name, type, icon: Icon, placeholder, color, maxLength }) => {
                  const isFocused = focusedField === name;
                  return (
                    <div key={name} className="relative px-4 py-3.5 transition-all"
                      style={{ background: isFocused ? `${color}08` : undefined }}>
                      {/* Label row */}
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <div className="w-4 h-4 flex items-center justify-center">
                          <Icon className="w-3.5 h-3.5" style={{ color: isFocused ? color : '#607080' }} />
                        </div>
                        <label className="text-[10px] font-black uppercase tracking-widest"
                          style={{ color: isFocused ? color : '#607080' }}>
                          {label}
                        </label>
                      </div>
                      {/* Input */}
                      <input
                        type={type}
                        name={name}
                        value={(formData as any)[name]}
                        onChange={handleChange}
                        onFocus={() => setFocusedField(name)}
                        onBlur={() => setFocusedField(null)}
                        placeholder={placeholder}
                        maxLength={(maxLength as any) || undefined}
                        // ✅ FIX S-3: email нельзя менять — это ключ KV-записи пользователя
                        readOnly={name === 'email'}
                        className={`w-full bg-transparent text-[15px] font-semibold placeholder-[#607080]/60 outline-none ${
                          name === 'email' ? 'text-[#607080] cursor-not-allowed select-all' : 'text-white'
                        }`}
                      />
                      {/* Подсказка под email */}
                      {name === 'email' && (
                        <p className="text-[10px] text-[#607080]/50 mt-1">Email нельзя изменить — это ваш уникальный идентификатор</p>
                      )}
                      {/* Focus underline */}
                      <AnimatePresence>
                        {isFocused && (
                          <motion.div
                            className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full"
                            style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
                            initial={{ scaleX: 0, opacity: 0 }}
                            animate={{ scaleX: 1, opacity: 1 }}
                            exit={{ scaleX: 0, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                          />
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* About — drivers only */}
            {isDriver && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.16, duration: 0.35 }}
              >
                <div className="flex items-center gap-2 px-1 mb-3">
                  <FileText className="w-3.5 h-3.5 text-[#10b981]" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#607080]">О себе</p>
                </div>

                <div className="rounded-3xl border overflow-hidden transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    borderColor: focusedField === 'about' ? '#10b98140' : 'rgba(255,255,255,0.07)',
                  }}>
                  <div className="px-4 pt-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <FileText className="w-3.5 h-3.5" style={{ color: focusedField === 'about' ? '#10b981' : '#607080' }} />
                      <label className="text-[10px] font-black uppercase tracking-widest"
                        style={{ color: focusedField === 'about' ? '#10b981' : '#607080' }}>
                        Описание
                      </label>
                    </div>
                  </div>
                  <textarea
                    name="about"
                    value={formData.about}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('about')}
                    onBlur={() => setFocusedField(null)}
                    rows={4}
                    placeholder="Расскажите о себе и своём опыте вождения..."
                    className="w-full bg-transparent text-[14px] font-semibold text-white placeholder-[#607080]/60 outline-none resize-none px-4 pb-4"
                  />
                </div>
              </motion.div>
            )}

            {/* Save button */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22, duration: 0.35 }}
            >
              <motion.button
                onClick={handleSave}
                disabled={saving}
                className="w-full h-14 rounded-2xl flex items-center justify-center gap-2.5 text-[15px] font-black text-white disabled:opacity-60 transition-all"
                style={{
                  background: saving
                    ? '#1d3a6e'
                    : `linear-gradient(135deg, #1d4ed8, ${roleColor})`,
                  boxShadow: saving ? 'none' : `0 6px 24px ${roleColor}35`,
                }}
                whileTap={{ scale: 0.97 }}
              >
                {saving
                  ? <><Loader2 className="w-5 h-5 animate-spin" /> Сохраняем...</>
                  : <><Check className="w-5 h-5" strokeWidth={3} /> Сохранить изменения</>
                }
              </motion.button>
            </motion.div>

            {/* Cancel */}
            <motion.button
              onClick={() => navigate(-1)}
              className="w-full h-11 rounded-2xl text-[14px] font-semibold text-[#607080] border border-white/[0.07] hover:border-white/[0.14] hover:text-white transition-all"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.28 }}
            >
              Отмена
            </motion.button>

          </div>
        </div>
      </div>

      {/* ══════════════════════════ DESKTOP ══════════════════════════════════ */}
      <div className="hidden md:flex flex-col min-h-screen" style={{ background: '#080f1a' }}>

        <style>{`
          @keyframes ep-fade-up {
            from { opacity: 0; transform: translateY(20px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes ep-fade-in {
            from { opacity: 0; }
            to   { opacity: 1; }
          }
          @keyframes ep-avatar-in {
            from { opacity: 0; transform: scale(0.85); }
            to   { opacity: 1; transform: scale(1); }
          }
          .ep-section { animation: ep-fade-up .45s cubic-bezier(.22,1,.36,1) both; }
          .ep-section:nth-child(1){ animation-delay:.06s }
          .ep-section:nth-child(2){ animation-delay:.14s }
          .ep-section:nth-child(3){ animation-delay:.22s }
          .ep-field {
            transition: background .2s ease, border-color .2s ease;
          }
          .ep-field:focus-within {
            background: #0f2040 !important;
          }
          .ep-input {
            background: transparent;
            border: none;
            outline: none;
            color: #fff;
            font-family: 'Sora', sans-serif;
            font-weight: 600;
            font-size: 15px;
            width: 100%;
          }
          .ep-input::placeholder { color: #3a5570; }
          .ep-input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.5); }
          .ep-save-btn {
            transition: transform .2s ease, box-shadow .2s ease, opacity .2s ease;
          }
          .ep-save-btn:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 12px 32px var(--role-glow);
          }
          .ep-save-btn:active:not(:disabled) { transform: scale(0.98); }
          .ep-avatar-wrap {
            animation: ep-avatar-in .5s cubic-bezier(.34,1.56,.64,1) .1s both;
          }
          .ep-avatar-btn {
            transition: transform .2s ease, box-shadow .2s ease;
          }
          .ep-avatar-btn:hover { transform: scale(1.08); }
        `}</style>

        {/* ── TOP BAR ── */}
        <div style={{ borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: '#ffffff08', background: '#0a1220' }}>
          <div className="max-w-7xl mx-auto px-10 py-5 flex items-center justify-between"
            style={{ animation: 'ep-fade-in .3s ease both' }}>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                style={{ background: '#ffffff0a', borderWidth: 1, borderStyle: 'solid', borderColor: '#ffffff0f', color: '#8a9bb0' }}
              >
                <ArrowLeft className="w-4.5 h-4.5" />
              </button>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.18em]" style={{ color: '#3a5570' }}>Аккаунт</p>
                <h1 className="text-[22px] font-black text-white leading-tight">Редактировать профиль</h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="px-5 py-2.5 rounded-2xl text-[13px] font-bold transition-all hover:scale-105 active:scale-95"
                style={{ background: '#ffffff08', borderWidth: 1, borderStyle: 'solid', borderColor: '#ffffff0f', color: '#607080' }}
              >
                Отмена
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="ep-save-btn flex items-center gap-2 px-6 py-2.5 rounded-2xl text-[13px] font-black text-white disabled:opacity-60"
                style={{
                  background: `linear-gradient(135deg, #1d4ed8, ${roleColor})`,
                  boxShadow: `0 6px 20px ${roleColor}30`,
                  '--role-glow': `${roleColor}50`,
                } as React.CSSProperties}
              >
                {saving
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Сохраняем...</>
                  : <><Save className="w-4 h-4" /> Сохранить</>
                }
              </button>
            </div>
          </div>
        </div>

        {/* ── BODY ── */}
        <div className="max-w-7xl mx-auto px-10 py-8 flex gap-8 items-start w-full">

          {/* ── LEFT: Avatar + Preview ── */}
          <div className="w-[280px] flex-shrink-0 flex flex-col gap-5 sticky top-8">

            {/* Avatar card */}
            <div className="ep-section rounded-3xl overflow-hidden"
              style={{
                background: 'linear-gradient(160deg, #0f1f38 0%, #0c1624 100%)',
                borderWidth: 1, borderStyle: 'solid', borderColor: '#1a2d45',
                boxShadow: `0 0 0 1px ${roleColor}10, 0 24px 48px #00000060`,
              }}>
              <div className="h-1" style={{ background: `linear-gradient(90deg, ${roleColor}, ${roleColor}60, transparent)` }} />

              <div className="p-6 flex flex-col items-center gap-5">
                {/* Avatar */}
                <div className="ep-avatar-wrap relative">
                  <div className="absolute inset-0 rounded-full pointer-events-none"
                    style={{ boxShadow: `0 0 0 3px ${roleColor}35, 0 12px 40px ${roleColor}25` }} />
                  <div className="w-28 h-28 rounded-full overflow-hidden flex items-center justify-center"
                    style={{ background: avatarPreview ? undefined : `linear-gradient(135deg, #1d4ed8, ${roleColor})` }}>
                    {avatarPreview
                      ? <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                      : <span className="text-white text-[34px] font-black">{initials}</span>
                    }
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="ep-avatar-btn absolute bottom-1 right-1 w-9 h-9 rounded-2xl flex items-center justify-center text-white border-2 border-[#0f1f38]"
                    style={{
                      background: `linear-gradient(135deg, #1d4ed8, ${roleColor})`,
                      boxShadow: `0 4px 14px ${roleColor}50`,
                    }}
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>

                {/* Name live preview */}
                <div className="text-center">
                  <p className="text-[18px] font-black text-white leading-tight">{displayName}</p>
                  <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
                    <span className="text-[11px] font-black px-3 py-1 rounded-full flex items-center gap-1.5"
                      style={{ background: roleBg, color: roleColor, borderWidth: 1, borderStyle: 'solid', borderColor: `${roleColor}35` }}>
                      <RoleIcon className="w-3 h-3" />
                      {roleLabel}
                    </span>
                    {avatarFile && (
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full text-amber-400"
                        style={{ background: '#f59e0b18', borderWidth: 1, borderStyle: 'solid', borderColor: '#f59e0b35' }}>
                        📷 Новое фото
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick info preview */}
                <div className="w-full space-y-2">
                  {formData.email && (
                    <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl"
                      style={{ background: '#0a1622', borderWidth: 1, borderStyle: 'solid', borderColor: '#1a2d40' }}>
                      <Mail className="w-3.5 h-3.5 shrink-0" style={{ color: '#a855f7' }} />
                      <span className="text-[11px] text-white font-medium truncate">{formData.email}</span>
                    </div>
                  )}
                  {formData.city && (
                    <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl"
                      style={{ background: '#0a1622', borderWidth: 1, borderStyle: 'solid', borderColor: '#1a2d40' }}>
                      <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: '#f59e0b' }} />
                      <span className="text-[11px] text-white font-medium truncate">{formData.city}</span>
                    </div>
                  )}
                </div>

                {/* Upload hint */}
                <p className="text-[10px] text-center leading-relaxed" style={{ color: '#2a4060' }}>
                  Нажмите на иконку камеры,<br />чтобы изменить фото профиля
                </p>
              </div>
            </div>

            {/* Save button in left column */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="ep-section ep-save-btn w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl text-[14px] font-black text-white disabled:opacity-60"
              style={{
                background: `linear-gradient(135deg, #1d4ed8, ${roleColor})`,
                boxShadow: `0 8px 24px ${roleColor}30`,
                '--role-glow': `${roleColor}50`,
              } as React.CSSProperties}
            >
              {saving
                ? <><Loader2 className="w-4.5 h-4.5 animate-spin" /> Сохраняем...</>
                : <><Save className="w-4.5 h-4.5" /> Сохранить изменения</>
              }
            </button>
          </div>

          {/* ── RIGHT: Form sections ── */}
          <div className="flex-1 min-w-0 flex flex-col gap-6">

            {/* ── Personal Info ── */}
            <div className="ep-section">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-7 h-7 rounded-xl flex items-center justify-center"
                  style={{ background: '#5ba3f520', borderWidth: 1, borderStyle: 'solid', borderColor: '#5ba3f530' }}>
                  <Sparkles className="w-3.5 h-3.5" style={{ color: '#5ba3f5' }} />
                </div>
                <p className="text-[11px] font-black uppercase tracking-[.18em]" style={{ color: '#3a5570' }}>Личные данные</p>
                <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, #1e2d3d, transparent)' }} />
              </div>

              {/* 2-column grid of field cards */}
              <div className="grid grid-cols-2 gap-3">
                {FIELDS.map(({ label, name, type, icon: Icon, placeholder, color, maxLength }) => {
                  const isFocused = focusedField === name;
                  return (
                    <div
                      key={name}
                      className="ep-field rounded-2xl px-5 py-4 cursor-text"
                      style={{
                        background: isFocused ? '#0e2040' : 'linear-gradient(145deg, #0e1e32, #0a1520)',
                        borderWidth: 1,
                        borderStyle: 'solid',
                        borderColor: isFocused ? `${color}50` : '#1a2d42',
                        boxShadow: isFocused ? `0 0 0 1px ${color}25, 0 8px 24px ${color}12` : '0 4px 16px #00000030',
                        transition: 'background .2s ease, border-color .2s ease, box-shadow .2s ease',
                      }}
                      onClick={() => {
                        const el = document.querySelector<HTMLInputElement>(`input[name="${name}"]`);
                        el?.focus();
                      }}
                    >
                      {/* Icon + label */}
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{
                            background: isFocused ? `${color}25` : '#ffffff08',
                            transition: 'background .2s ease',
                          }}>
                          <Icon style={{ width: 13, height: 13, color: isFocused ? color : '#4a6580' }} />
                        </div>
                        <label className="text-[10px] font-black uppercase tracking-[.14em] cursor-pointer select-none"
                          style={{ color: isFocused ? color : '#3a5570', transition: 'color .2s ease' }}>
                          {label}
                        </label>
                      </div>

                      {/* Input */}
                      <input
                        type={type}
                        name={name}
                        value={(formData as any)[name]}
                        onChange={handleChange}
                        onFocus={() => setFocusedField(name)}
                        onBlur={() => setFocusedField(null)}
                        placeholder={placeholder}
                        maxLength={(maxLength as any) || undefined}
                        // ✅ FIX S-3: email нельзя менять — это ключ KV-записи пользователя
                        readOnly={name === 'email'}
                        className={`w-full bg-transparent text-[15px] font-semibold placeholder-[#607080]/60 outline-none ${
                          name === 'email' ? 'text-[#607080] cursor-not-allowed select-all' : 'text-white'
                        }`}
                      />
                      {/* Подсказка под email */}
                      {name === 'email' && (
                        <p className="text-[10px] text-[#607080]/50 mt-1">Email нельзя изменить — это ваш уникальный идентификатор</p>
                      )}

                      {/* Bottom line */}
                      <div className="mt-2 h-[1.5px] rounded-full"
                        style={{
                          background: isFocused
                            ? `linear-gradient(90deg, ${color}, ${color}40)`
                            : 'linear-gradient(90deg, #1e2d3d, transparent)',
                          transition: 'background .25s ease',
                        }} />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── About (drivers only) ── */}
            {isDriver && (
              <div className="ep-section">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-7 h-7 rounded-xl flex items-center justify-center"
                    style={{ background: '#10b98120', borderWidth: 1, borderStyle: 'solid', borderColor: '#10b98130' }}>
                    <FileText className="w-3.5 h-3.5" style={{ color: '#10b981' }} />
                  </div>
                  <p className="text-[11px] font-black uppercase tracking-[.18em]" style={{ color: '#3a5570' }}>О себе</p>
                  <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, #1e2d3d, transparent)' }} />
                </div>

                <div
                  className="rounded-2xl px-5 pt-4 pb-2"
                  style={{
                    background: focusedField === 'about' ? '#0e2040' : 'linear-gradient(145deg, #0e1e32, #0a1520)',
                    borderWidth: 1, borderStyle: 'solid',
                    borderColor: focusedField === 'about' ? '#10b98150' : '#1a2d42',
                    boxShadow: focusedField === 'about' ? '0 0 0 1px #10b98125, 0 8px 24px #10b98112' : '0 4px 16px #00000030',
                    transition: 'background .2s ease, border-color .2s ease, box-shadow .2s ease',
                  }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                      style={{ background: focusedField === 'about' ? '#10b98125' : '#ffffff08', transition: 'background .2s' }}>
                      <FileText style={{ width: 13, height: 13, color: focusedField === 'about' ? '#10b981' : '#4a6580' }} />
                    </div>
                    <label className="text-[10px] font-black uppercase tracking-[.14em]"
                      style={{ color: focusedField === 'about' ? '#10b981' : '#3a5570', transition: 'color .2s' }}>
                      Описание профиля
                    </label>
                    <span className="ml-auto text-[10px]" style={{ color: '#2a4060' }}>
                      {formData.about.length} / 300
                    </span>
                  </div>
                  <textarea
                    name="about"
                    value={formData.about}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('about')}
                    onBlur={() => setFocusedField(null)}
                    maxLength={300}
                    rows={5}
                    placeholder="Расскажите о себе, опыте вождения, маршрутах..."
                    className="w-full bg-transparent text-[14px] font-semibold text-white outline-none resize-none"
                    style={{ color: '#e2e8f0', fontFamily: "'Sora', sans-serif" }}
                  />
                  <div className="h-[1.5px] rounded-full mt-1"
                    style={{
                      background: focusedField === 'about'
                        ? 'linear-gradient(90deg, #10b981, #10b98140)'
                        : 'linear-gradient(90deg, #1e2d3d, transparent)',
                      transition: 'background .25s ease',
                    }} />
                </div>
              </div>
            )}

            {/* ── Bottom actions ── */}
            <div className="ep-section flex gap-3 pt-2 pb-8">
              <button
                onClick={() => navigate(-1)}
                className="flex-1 py-3.5 rounded-2xl text-[14px] font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: '#0e1e32',
                  borderWidth: 1, borderStyle: 'solid', borderColor: '#1a2d42',
                  color: '#607080',
                }}
              >
                Отмена
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="ep-save-btn flex-[2] flex items-center justify-center gap-2.5 py-3.5 rounded-2xl text-[14px] font-black text-white disabled:opacity-60"
                style={{
                  background: `linear-gradient(135deg, #1d4ed8, ${roleColor})`,
                  boxShadow: `0 8px 28px ${roleColor}35`,
                  '--role-glow': `${roleColor}55`,
                } as React.CSSProperties}
              >
                {saving
                  ? <><Loader2 className="w-4.5 h-4.5 animate-spin" /> Сохраняем...</>
                  : <><Save className="w-4.5 h-4.5" /> Сохранить изменения</>
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}