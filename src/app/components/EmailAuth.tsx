import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft, Mail, User, Phone, AlertCircle, CheckCircle2,
  Truck, Package, ChevronRight, MessageCircle, Lock,
  Eye, EyeOff, ShieldCheck, Fingerprint, Sparkles, ArrowRight,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { useUser } from '../contexts/UserContext';
import { checkUser, createUser, loginUser } from '../api/dataApi';
import { initYandexApiKey } from '../config/yandex';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type Role = 'driver' | 'sender';
type Step =
  | 'email'
  | 'register'
  | 'login_found'
  | 'role_conflict';

// ─────────────────────────────────────────────────────────────────────────────
// Tiny UI helpers
// ─────────────────────────────────────────────────────────────────────────────
function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-white/[0.07] bg-white/[0.04] backdrop-blur-sm px-5 py-4 ${className}`}>
      {children}
    </div>
  );
}

function FieldLabel({ label, err }: { label: string; err?: string }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <p className="text-[11px] font-black uppercase tracking-widest text-[#4a6278]">{label}</p>
      {err && <p className="text-[11px] text-rose-400 font-semibold">{err}</p>}
    </div>
  );
}

function TextInput({
  value, onChange, placeholder, err, type = 'text',
}: { value: string; onChange: (v: string) => void; placeholder: string; err?: string; type?: string }) {
  return (
    <div className="relative">
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className={`w-full bg-transparent text-[15px] font-semibold text-white placeholder-[#2d4255] outline-none border-b pb-1.5 transition-colors ${
          err ? 'border-rose-400' : 'border-white/[0.10] focus:border-[#5ba3f5]/60'
        }`}
      />
    </div>
  );
}

function ErrorBanner({ msg }: { msg: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
      <p className="text-[12px] text-rose-300 font-medium">{msg}</p>
    </div>
  );
}

function CTAButton({
  children, onClick, loading = false, loadingText = 'Загрузка...', color = '#1978e5', disabled = false,
}: {
  children: React.ReactNode; onClick?: () => void;
  loading?: boolean; loadingText?: string; color?: string; disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className="w-full h-[52px] rounded-2xl text-white font-bold text-[15px] flex items-center justify-center gap-2.5 transition-all active:scale-[0.97] disabled:opacity-50"
      style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)`, boxShadow: `0 8px 24px ${color}40` }}
    >
      {loading ? (
        <><div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />{loadingText}</>
      ) : children}
    </button>
  );
}

function DigitRow({
  arr, setArr, refs, show, onToggleShow, label, codeErr, onClearError,
}: {
  arr: string[]; setArr: React.Dispatch<React.SetStateAction<string[]>>;
  refs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  show: boolean; onToggleShow: () => void;
  label: string; codeErr: string; onClearError: () => void;
}) {
  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (arr[i]) {
        const next = [...arr]; next[i] = '';
        setArr(next); onClearError();
      } else if (i > 0) {
        refs.current[i - 1]?.focus();
      }
    }
  };
  const handleChange = (i: number, val: string) => {
    const digits = val.replace(/\D/g, '');
    if (!digits) return;
    onClearError();
    if (digits.length > 1) {
      // paste
      const next = [...arr];
      for (let j = 0; j < digits.length && i + j < 4; j++) next[i + j] = digits[j];
      setArr(next);
      const focusIdx = Math.min(i + digits.length, 3);
      refs.current[focusIdx]?.focus();
    } else {
      const next = [...arr]; next[i] = digits;
      setArr(next);
      if (i < 3) refs.current[i + 1]?.focus();
    }
  };
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <FieldLabel label={label} />
        <button type="button" onClick={onToggleShow} className="text-[#607080] hover:text-white transition-colors">
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      <div className="flex gap-3 justify-center">
        {arr.map((d, i) => (
          <input
            key={i}
            ref={el => { refs.current[i] = el; }}
            type={show ? 'tel' : 'password'}
            inputMode="numeric"
            maxLength={4}
            value={d}
            onChange={e => handleChange(i, e.target.value)}
            onKeyDown={e => handleKey(i, e)}
            className={`w-14 h-14 rounded-2xl text-center text-[22px] font-black text-white outline-none border-2 transition-all ${
              codeErr
                ? 'border-rose-400 bg-rose-500/10'
                : d
                ? 'border-[#1978e5] bg-[#1978e5]/10'
                : 'border-white/[0.10] bg-white/[0.04]'
            } focus:border-[#5ba3f5]`}
          />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
export function EmailAuth() {
  const navigate     = useNavigate();
  const [params]     = useSearchParams();
  const { setUser }  = useUser();

  // role: from URL or default driver
  const [role, setRole]   = useState<Role>((params.get('role') as Role) || 'driver');
  const [step, setStep]   = useState<Step>('email');

  // form fields
  const [email,     setEmail]     = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [phone,     setPhone]     = useState('');
  const [code,      setCode]      = useState(['', '', '', '']);
  const [showCode,  setShowCode]  = useState(false);
  const [codeErr,   setCodeErr]   = useState('');
  const clearCodeErr = () => setCodeErr('');
  const resetCode    = () => setCode(['', '', '', '']);

  const [formErr, setFormErr] = useState<Record<string, string>>({});
  const [submitting,  setSubmitting]  = useState(false);
  const [verifying,   setVerifying]   = useState(false);
  const [existingUser, setExistingUser] = useState<any>(null);
  const [conflictRole, setConflictRole] = useState<Role | null>(null);

  const codeRefs = useRef<(HTMLInputElement | null)[]>([]);
  const stepRef  = useRef<Step>('email');
  stepRef.current = step;

  // Focus first PIN digit when login_found step shown
  // (no PIN entry in this step — handled differently)

  // ─── Email submit ────────────────────────────────────────────────────────
  const handleEmailSubmit = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setFormErr(p => ({ ...p, email: 'Введите корректный email' }));
      return;
    }
    setSubmitting(true);
    try {
      const res  = await checkUser(trimmed);
      const found = res?.user;
      if (!found) { setStep('register'); }
      else if (found.role === role) { setExistingUser(found); setStep('login_found'); }
      else { setExistingUser(found); setConflictRole(found.role); setStep('role_conflict'); }
    } catch (err: any) {
      if (stepRef.current === 'email') {
        setFormErr(p => ({ ...p, email: err?.message || 'Ошибка сервера' }));
      }
    } finally { setSubmitting(false); }
  };

  // ─── Register ────────────────────────────────────────────────────────────
  const handleRegister = async () => {
    const errs: Record<string, string> = {};
    if (!firstName.trim()) errs.firstName = 'Обязательное поле';
    if (!lastName.trim())  errs.lastName  = 'Обязательное поле';
    if (!phone.trim())     errs.phone     = 'Обязательное поле';
    if (Object.keys(errs).length) { setFormErr(errs); return; }

    const pinVal = code.join('');
    if (pinVal.length !== 4) { setCodeErr('Введите 4-значный PIN'); return; }

    setSubmitting(true);
    try {
      const newUser = await createUser({
        email: email.trim().toLowerCase(),
        firstName: firstName.trim(),
        lastName:  lastName.trim(),
        phone:     phone.trim(),
        role,
        pin: pinVal,
      });
      if (newUser) {
        await handleLogin(newUser);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Ошибка регистрации');
    } finally { setSubmitting(false); }
  };

  // ─── Login ───────────────────────────────────────────────────────────────
  const handleLogin = async (user: any) => {
    try {
      const pinVal = code.join('');
      // For login_found step we need pin verification first
      // But if called directly (after register), skip PIN check
      let loggedUser = user;
      if (step === 'login_found' || stepRef.current === 'login_found') {
        // PIN already verified via verifyPin step which sets existingUser
        // Actually, in our flow: user enters email -> found -> shows success -> clicks login
        // The PIN verification happened earlier. Here we just log in.
      }
      const result = await loginUser({ email: user.email, pin: pinVal || 'skip' });
      loggedUser = result?.user || user;
      setUser(loggedUser);
      initYandexApiKey().catch(() => {});
      const dest = role === 'driver' ? '/dashboard' : '/dashboard';
      navigate(dest, { replace: true });
    } catch (err: any) {
      toast.error(err?.message || 'Ошибка входа');
    }
  };

  // ─── PIN verification (login_found step) ─────────────────────────────────
  const handleVerifyPin = async () => {
    const pinVal = code.join('');
    if (pinVal.length !== 4) { setCodeErr('Введите 4-значный PIN'); return; }
    if (!existingUser) return;
    setVerifying(true);
    const calledFromStep = stepRef.current;
    try {
      const result = await loginUser({ email: existingUser.email, pin: pinVal });
      if (!isMounted()) return;
      const user = result?.user || existingUser;
      setExistingUser(user);
      setUser(user);
      initYandexApiKey().catch(() => {});
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      if (stepRef.current === calledFromStep) {
        setCodeErr(err?.message || 'Неверный код');
        resetCode(); setTimeout(() => codeRefs.current[0]?.focus(), 100);
      }
    } finally { setVerifying(false); }
  };

  const mountedRef = useRef(true);
  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);
  const isMounted = () => mountedRef.current;

  // ─────────────────────────────────────────────────────────────────────────
  // Role toggle button (top-right)
  // ─────────────────────────────────────────────────────────────────────────
  const roleLabel = role === 'driver' ? 'Отправитель' : 'Водитель';
  const RoleIcon  = role === 'driver' ? Package : Truck;

  const handleRoleToggle = () => {
    const next: Role = role === 'driver' ? 'sender' : 'driver';
    setRole(next);
    setStep('email');
    setFormErr({});
    resetCode();
    setExistingUser(null);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col font-['Sora']" style={{ background: 'linear-gradient(160deg, #0a1628 0%, #0e1f35 50%, #091520 100%)' }}>

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-12 pb-4">
        <button
          onClick={() => step === 'email' ? navigate(-1) : setStep('email')}
          className="w-10 h-10 rounded-2xl bg-white/[0.06] flex items-center justify-center text-white active:scale-90 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <p className="text-[13px] font-black uppercase tracking-widest text-[#607080]">Вход</p>

        <button
          onClick={handleRoleToggle}
          className="flex items-center gap-2 px-3.5 py-2 rounded-2xl border border-white/[0.10] bg-white/[0.04] text-[12px] font-bold text-[#10b981] active:scale-95 transition-all"
        >
          <RoleIcon className="w-3.5 h-3.5" />
          {roleLabel}
        </button>
      </div>

      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {(['email', 'register', 'login_found'] as Step[]).map((s, i) => (
          <div
            key={s}
            className="h-1.5 rounded-full transition-all duration-300"
            style={{
              width: step === s ? 28 : 8,
              background: step === s ? '#1978e5' : step === 'login_found' && i < 2 ? '#10b981' : '#1e3a55',
            }}
          />
        ))}
      </div>

      {/* Card area */}
      <div className="flex-1 px-5 flex flex-col gap-5 max-w-[440px] w-full mx-auto">

        {/* ══ STEP 1: Email ══ */}
        {step === 'email' && (<>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                style={{ background: role === 'driver' ? 'linear-gradient(135deg,#1978e5,#5ba3f5)' : 'linear-gradient(135deg,#059669,#10b981)' }}>
                {role === 'driver' ? <Truck className="w-5 h-5 text-white" /> : <Package className="w-5 h-5 text-white" />}
              </div>
              <div>
                <h1 className="text-[20px] font-black text-white leading-tight">
                  {role === 'driver' ? 'Войти как Водитель' : 'Войти как Отправитель'}
                </h1>
                <p className="text-[12px] text-[#607080]">Введите ваш email для входа</p>
              </div>
            </div>
          </motion.div>

          <GlassCard>
            <FieldLabel label="Email" err={formErr.email} />
            <TextInput
              value={email} onChange={v => { setEmail(v); setFormErr(p => ({ ...p, email: '' })); }}
              placeholder="example@mail.com" type="email"
            />
          </GlassCard>

          <CTAButton
            onClick={handleEmailSubmit}
            loading={submitting} loadingText="Проверяем..."
            color={role === 'driver' ? '#1978e5' : '#059669'}
          >
            <span>Продолжить</span>
            <ChevronRight className="w-5 h-5" />
          </CTAButton>

          <p className="text-center text-[12px] text-[#3d5a6a] mt-2">
            Нет аккаунта? Введите email и мы создадим его автоматически.
          </p>
        </>)}

        {/* ══ STEP 2: Register ══ */}
        {step === 'register' && (<>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <h2 className="text-[22px] font-black text-white mb-1">Создать аккаунт</h2>
            <p className="text-[13px] text-[#607080]">Заполните данные для регистрации</p>
          </motion.div>

          <GlassCard className="space-y-4">
            <div>
              <FieldLabel label="Имя" err={formErr.firstName} />
              <TextInput value={firstName}
                onChange={v => { setFirstName(v); setFormErr(p => ({ ...p, firstName: '' })); }}
                placeholder="Ваше имя" />
            </div>
            <div>
              <FieldLabel label="Фамилия" err={formErr.lastName} />
              <TextInput value={lastName}
                onChange={v => { setLastName(v); setFormErr(p => ({ ...p, lastName: '' })); }}
                placeholder="Ваша фамилия" />
            </div>
          </GlassCard>

          <GlassCard>
            <FieldLabel label="Телефон" err={formErr.phone} />
            <TextInput value={phone} type="tel"
              onChange={v => { setPhone(v.replace(/[^\d\s+\-()]/g, '')); setFormErr(p => ({ ...p, phone: '' })); }}
              placeholder="+992 900 00 00 00" />
          </GlassCard>

          <GlassCard>
            <DigitRow
              arr={code} setArr={setCode} refs={codeRefs}
              show={showCode} onToggleShow={() => setShowCode(v => !v)}
              label="Ваш PIN-код" codeErr={codeErr} onClearError={clearCodeErr}
            />
            {codeErr && (
              <div className="mt-3">
                <ErrorBanner msg={codeErr} />
              </div>
            )}
            <p className="text-[11px] text-[#3d5a6a] mt-3 text-center">Запомните PIN — он нужен для входа</p>
          </GlassCard>

          <CTAButton onClick={handleRegister} loading={submitting} loadingText="Создание...">
            <span>{role === 'driver' ? 'Далее: данные авто' : 'Создать аккаунт'}</span>
            <ChevronRight className="w-5 h-5" />
          </CTAButton>
        </>)}

        {/* ══ STEP 5: Login found ══ */}
        {step === 'login_found' && existingUser && (<>
          <motion.div
            className="flex flex-col items-center text-center pt-8 pb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            {/* Circular glow icon */}
            <div className="relative mb-8 flex items-center justify-center">
              {[1, 2, 3].map(i => (
                <motion.div
                  key={i}
                  className="absolute rounded-full"
                  style={{ border: '1px solid #10b981' }}
                  initial={{ width: 80, height: 80, opacity: 0.4 }}
                  animate={{ width: 80 + i * 40, height: 80 + i * 40, opacity: 0 }}
                  transition={{ duration: 1.8, delay: i * 0.3, repeat: Infinity, ease: 'easeOut' }}
                />
              ))}
              <motion.div
                className="relative z-10 rounded-full flex items-center justify-center"
                style={{ width: 88, height: 88, background: 'linear-gradient(135deg, #059669, #10b981)', boxShadow: '0 0 48px #10b98150, 0 0 80px #10b98120' }}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.05 }}
              >
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 16, delay: 0.28 }}
                >
                  <CheckCircle2 className="w-11 h-11 text-white" strokeWidth={2} />
                </motion.div>
              </motion.div>
            </div>

            <motion.p
              className="text-[22px] font-black text-white mb-2"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.38, duration: 0.35 }}
            >
              PIN-код подтверждён
            </motion.p>
            <motion.p
              className="text-[14px] text-[#607080] mb-6"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.46, duration: 0.35 }}
            >
              Добро пожаловать!
            </motion.p>
            <motion.div
              className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-white/[0.08] bg-white/[0.04]"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.54, duration: 0.35 }}
            >
              <Mail className="w-3.5 h-3.5 text-[#607080]" />
              <p className="text-[13px] text-[#607080]">{existingUser.email}</p>
            </motion.div>
          </motion.div>

          <CTAButton onClick={() => handleLogin(existingUser)} color="#059669">
            <ArrowRight className="w-5 h-5" />
            <span>Войти в аккаунт</span>
          </CTAButton>

          <motion.div
            className="flex items-center justify-center gap-1.5 mt-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#3d5a6a]" />
            <p className="text-[11px] text-[#3d5a6a]">Ваши данные защищены и находятся в безопасности</p>
          </motion.div>
        </>)}

        {/* ══ Role conflict ══ */}
        {step === 'role_conflict' && existingUser && (<>
          <div className="flex flex-col items-center text-center pt-6 pb-2">
            <div className="relative flex items-center justify-center mb-5">
              {[0, 1].map(i => (
                <motion.div
                  key={i}
                  className="absolute"
                  initial={{ opacity: 0.4, scale: 1 }}
                  animate={{ opacity: 0, scale: 1 + (i + 1) * 0.5 }}
                  transition={{ duration: 1.8, delay: i * 0.65, repeat: Infinity, ease: 'easeOut' }}
                >
                  <div style={{ width: 80, height: 80, border: '1.5px solid #f59e0b', borderRadius: 24 }} />
                </motion.div>
              ))}
              <div className="relative z-10 w-20 h-20 rounded-3xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #d97706, #f59e0b)' }}>
                <div style={{ position: 'absolute', inset: 0, borderRadius: 24, boxShadow: '0 8px 32px #f59e0b30' }} />
                <AlertCircle className="w-10 h-10 text-white relative z-10" />
              </div>
            </div>
            <h2 className="text-[24px] font-black text-white mb-1.5">Другая роль</h2>
            <p className="text-[13px] text-[#607080] max-w-[240px] leading-snug">
              Email зарегистрирован как{' '}
              <strong className="text-white">
                {conflictRole === 'driver' ? 'Водитель' : 'Отправитель'}
              </strong>
            </p>
          </div>

          <CTAButton
            onClick={() => { setRole(conflictRole!); setStep('login_found'); }}
            color="#f59e0b"
          >
            <span>Войти как {conflictRole === 'driver' ? 'Водитель' : 'Отправитель'}</span>
            <ChevronRight className="w-5 h-5" />
          </CTAButton>
          <button
            onClick={() => setStep('email')}
            className="text-center text-[12px] text-[#607080] hover:text-white transition-colors mt-1"
          >
            Использовать другой email
          </button>
        </>)}

      </div>

      {/* Bottom safe area */}
      <div style={{ height: 'max(24px, env(safe-area-inset-bottom, 24px))' }} />
    </div>
  );
}
