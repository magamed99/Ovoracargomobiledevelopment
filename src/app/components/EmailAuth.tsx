import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft, Mail, User, Phone, AlertCircle, CheckCircle2,
  Truck, Package, ChevronRight, ShieldCheck, Sparkles, Lock,
  Send, RotateCcw,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router';
import { useUser } from '../contexts/UserContext';
import { toast } from 'sonner';
import * as notificationsApi from '../api/notificationsApi';
import {
  sendEmailOtp, verifyEmailOtp, registerWithOtp, loginUser,
  type OvoraUser,
} from '../api/authApi';
import { motion } from 'motion/react';
import { validateCisPhone } from '../utils/phoneValidator';

// ── Steps ──────────────────────────────────────────────────────────────────────
type Step = 'email' | 'otp' | 'register' | 'login_found' | 'role_conflict';

const STEP_LABELS: Partial<Record<Step, string>> = {
  email:        'Email',
  otp:          'Верификация',
  register:     'Регистрация',
  login_found:  'Вход',
  role_conflict:'Конфликт',
};

// ═══════════════════════════════════════════════════════════════════════════════
// Standalone helpers
// ═══════════════════════════════════════════════════════════════════════════════

function Spinner() {
  return <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />;
}

function ErrorBanner({ msg }: { msg: string }) {
  return (
    <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-2xl bg-red-500/10 border border-red-500/20">
      <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
      <p className="text-[12px] text-red-400 font-medium">{msg}</p>
    </div>
  );
}

function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-3xl border border-white/[0.07] bg-white/[0.04] p-4 ${className}`}>
      {children}
    </div>
  );
}

function CTAButton({
  onClick, disabled, loading, loadingText, children, color, ariaLabel = '#1d4ed8',
}: {
  onClick: () => void; disabled?: boolean; loading?: boolean;
  loadingText?: string; children: React.ReactNode; color?: string; ariaLabel?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      className="w-full rounded-3xl font-black text-[15px] text-white flex items-center justify-center gap-2.5 transition-all active:scale-[0.97] disabled:opacity-50"
      style={{
        background: `linear-gradient(135deg, ${color}, ${color}cc)`,
        boxShadow: `0 4px 20px ${color}40`,
        height: 52,
      }}
    >
      {loading ? <><Spinner /><span>{loadingText}</span></> : children}
    </button>
  );
}

function EmailBadge({ email, tag, tagColor }: { email: string; tag: string; tagColor: string }) {
  return (
    <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl border border-white/[0.07] bg-white/[0.04]">
      <Mail className="w-3.5 h-3.5 text-[#5ba3f5] shrink-0" />
      <p className="text-[12px] font-medium text-[#8899aa] truncate flex-1">{email.trim()}</p>
      <span className="text-[9px] font-black px-2 py-0.5 rounded-full shrink-0"
        style={{ background: `${tagColor}18`, color: tagColor, border: `1px solid ${tagColor}30` }}>
        {tag}
      </span>
    </div>
  );
}

// ── OTP Digit handlers ───────────────────────────────────────────────────────
function handleOtpChange(
  i: number, val: string,
  arr: string[], setArr: React.Dispatch<React.SetStateAction<string[]>>,
  refs: React.MutableRefObject<(HTMLInputElement | null)[]>,
  onClearError: () => void,
) {
  const d = val.replace(/\D/g, '').slice(-1);
  const next = [...arr]; next[i] = d; setArr(next); onClearError();
  if (d && i < 5) setTimeout(() => { refs.current[i + 1]?.focus(); refs.current[i + 1]?.select(); }, 10);
}

function handleOtpKeyDown(
  e: React.KeyboardEvent<HTMLInputElement>,
  i: number, arr: string[], setArr: React.Dispatch<React.SetStateAction<string[]>>,
  refs: React.MutableRefObject<(HTMLInputElement | null)[]>,
  onClearError: () => void,
) {
  if (e.key === 'Backspace') {
    e.preventDefault();
    const next = [...arr];
    if (arr[i]) { next[i] = ''; setArr(next); }
    else if (i > 0) { next[i - 1] = ''; setArr(next); setTimeout(() => refs.current[i - 1]?.focus(), 10); }
    onClearError();
  } else if (e.key === 'ArrowLeft' && i > 0) { e.preventDefault(); refs.current[i - 1]?.focus(); }
  else if (e.key === 'ArrowRight' && i < 5) { e.preventDefault(); refs.current[i + 1]?.focus(); }
  else if (/^\d$/.test(e.key)) {
    e.preventDefault();
    const next = [...arr]; next[i] = e.key; setArr(next); onClearError();
    if (i < 5) setTimeout(() => { refs.current[i + 1]?.focus(); refs.current[i + 1]?.select(); }, 10);
  }
}

function handleOtpPaste(
  e: React.ClipboardEvent<HTMLInputElement>,
  setArr: React.Dispatch<React.SetStateAction<string[]>>,
  refs: React.MutableRefObject<(HTMLInputElement | null)[]>,
  onClearError: () => void,
) {
  e.preventDefault();
  const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6).split('');
  const next = Array(6).fill('');
  digits.forEach((d, i) => { if (i < 6) next[i] = d; });
  setArr(next); onClearError();
  setTimeout(() => refs.current[Math.min(digits.length, 5)]?.focus(), 10);
}

function OtpRow({
  arr, setArr, refs, label, codeErr, onClearError,
}: {
  arr: string[]; setArr: React.Dispatch<React.SetStateAction<string[]>>;
  refs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  label: string; codeErr: string; onClearError: () => void;
}) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#607080] mb-3">{label}</p>
      <div className="flex gap-2 justify-center">
        {arr.map((digit, i) => (
          <input
            key={i}
            ref={el => { refs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={digit}
            onChange={e => handleOtpChange(i, e.target.value, arr, setArr, refs, onClearError)}
            onKeyDown={e => handleOtpKeyDown(e, i, arr, setArr, refs, onClearError)}
            onPaste={e => handleOtpPaste(e, setArr, refs, onClearError)}
            onFocus={e => setTimeout(() => e.target.select(), 10)}
            autoComplete="one-time-code"
            className="text-center font-black outline-none transition-all rounded-2xl border-2"
            style={{
              width: 'clamp(28px, calc((100vw - 120px) / 6), 52px)',
              height: 'clamp(36px, calc((100vw - 120px) / 6 * 1.2), 60px)',
              fontSize: 'clamp(14px, calc((100vw - 120px) / 6 * 0.45), 22px)',
              background: digit ? (codeErr ? '#ef444419' : '#5ba3f51e') : '#ffffff0d',
              borderColor: codeErr ? '#ef4444' : digit ? '#5ba3f5' : '#ffffff1a',
              color: codeErr ? '#f87171' : '#fff',
              boxShadow: digit && !codeErr ? '0 2px 12px #5ba3f52e' : 'none',
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main component
// ═══════════════════════════════════════════════════════════════════════════════
export function EmailAuth() {
  const navigate = useNavigate();
  const { setUserEmail } = useUser();
  const [searchParams] = useSearchParams();
  const role = (searchParams.get('role') as 'driver' | 'sender') || 'sender';

  const [step, setStep] = useState<Step>('email');

  // email
  const [email, setEmail] = useState('');
  const [emailErr, setEmailErr] = useState('');
  const [checking, setChecking] = useState(false);

  // OTP
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpErr, setOtpErr] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // register
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [formErr, setFormErr] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const [existingUser, setExistingUser] = useState<OvoraUser | null>(null);
  const [conflictRole] = useState<'driver' | 'sender' | null>(null);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const emailRef = useRef<HTMLInputElement>(null);
  const stepRef = useRef<Step>(step);
  useEffect(() => { stepRef.current = step; }, [step]);

  const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
  const otpStr = otp.join('');

  const roleColor = role === 'driver' ? '#5ba3f5' : '#10b981';
  const roleLabel = role === 'driver' ? 'Водитель' : 'Отправитель';

  useEffect(() => { if (step === 'email') emailRef.current?.focus(); }, [step]);
  useEffect(() => {
    if (step === 'otp') setTimeout(() => otpRefs.current[0]?.focus(), 200);
  }, [step]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown(c => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const resetOtp = () => setOtp(['', '', '', '', '', '']);
  const clearOtpErr = () => setOtpErr('');

  // ── Step 1: Submit email → send OTP ──────────────────────────────────────
  const handleEmailSubmit = async () => {
    const t = email.trim();
    if (!t) { setEmailErr('Введите email'); return; }
    if (!isValidEmail(t)) { setEmailErr('Некорректный формат email'); return; }
    setEmailErr('');
    setChecking(true);
    try {
      const result = await sendEmailOtp(t);
      if (result.success) {
        resetOtp(); setOtpErr('');
        setStep('otp');
        setCooldown(60);
        if (result.emailSent) {
          toast.success('Код отправлен на ' + t);
        } else if ((result as any).otp) {
          toast('Код: ' + (result as any).otp, { duration: 60000, description: 'Скопируйте и введите код', style: { background: '#1a2a3a', border: '1px solid #5ba3f5', color: '#fff' } });
        } else {
          toast.success('Код отправлен на ' + t);
        }
      } else {
        setEmailErr(result.error || 'Ошибка отправки');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Ошибка отправки OTP');
    } finally {
      setChecking(false);
    }
  };

  // ── Step 2: Verify OTP ───────────────────────────────────────────────────
  const handleVerifyOtp = async () => {
    if (otpStr.length < 6) { setOtpErr('Введите 6-значный код'); return; }
    setOtpErr('');
    setVerifying(true);
    const calledFromStep = stepRef.current;
    try {
      const result = await verifyEmailOtp(email.trim(), otpStr);
      if (stepRef.current !== calledFromStep) return;

      if (result.success) {
        if (result.user) {
          // Existing user — login
          setExistingUser(result.user);
          setStep('login_found');
        } else {
          // New user — register
          setStep('register');
        }
      } else {
        setOtpErr(result.error || 'Неверный код');
        resetOtp();
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
      }
    } catch (err: any) {
      if (stepRef.current === calledFromStep) {
        setOtpErr(err?.message || 'Ошибка верификации');
        resetOtp();
      }
    } finally {
      setVerifying(false);
    }
  };

  // ── Resend OTP ───────────────────────────────────────────────────────────
  const handleResendOtp = async () => {
    if (cooldown > 0) return;
    setResending(true);
    try {
      const result = await sendEmailOtp(email.trim());
      if (result.success) {
        setCooldown(60);
        toast.success('Код повторно отправлен');
      } else {
        toast.error(result.error || 'Ошибка отправки');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Ошибка');
    } finally {
      setResending(false);
    }
  };

  // ── Step 3: Register ─────────────────────────────────────────────────────
  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!firstName.trim()) errs.firstName = 'Введите имя';
    if (!lastName.trim()) errs.lastName = 'Введите фамилию';
    if (!phone.trim()) {
    errs.phone = 'Введите номер телефона';
  } else {
    const pv = validateCisPhone(phone);
    if (!pv.valid) errs.phone = pv.error || 'Неверный номер';
  }
    setFormErr(errs);
    return !Object.keys(errs).length;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const newUser = await registerWithOtp(email.trim(), role, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
      });
      try {
        await notificationsApi.createNotification({
          userEmail: newUser.email, type: 'auth', iconName: 'UserCheck',
          iconBg: 'bg-emerald-500/10 text-emerald-500',
          title: 'Аккаунт создан 🎉', description: 'Добро пожаловать в Ovora Cargo!',
        });
      } catch (_) {}
      toast.success('Аккаунт создан!');
      loginUser(newUser);
      setUserEmail(newUser.email);
      if (role === 'driver') navigate('/driver-registration-form');
      else navigate('/dashboard');
    } catch (err) {
      toast.error(`Ошибка регистрации: ${err}`);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Login existing user ──────────────────────────────────────────────────
  const handleLogin = async (u: OvoraUser) => {
    loginUser(u);
    setUserEmail(u.email);
    try {
      await notificationsApi.createNotification({
        userEmail: u.email, type: 'auth', iconName: 'UserCheck',
        iconBg: 'bg-emerald-500/10 text-emerald-500',
        title: 'Вход выполнен', description: `Добро пожаловать, ${u.firstName}!`,
      });
    } catch (_) {}
    toast.success(`Добро пожаловать, ${u.firstName}!`);
    navigate('/dashboard');
  };

  const handleBack = () => {
    const prev: Partial<Record<Step, Step>> = {
      otp: 'email', register: 'email', login_found: 'email', role_conflict: 'email',
    };
    const t = prev[step];
    if (t) { resetOtp(); setOtpErr(''); setStep(t); }
    else navigate('/role-select');
  };

  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen font-['Sora'] bg-[#060e1a] text-white">
      {/* ── HERO / BG ── */}
      <div className="relative overflow-hidden shrink-0">
        <div className="relative flex items-center justify-between px-4"
          style={{ paddingTop: 'max(52px, env(safe-area-inset-top, 52px))', paddingBottom: 8 }}>
          <button onClick={handleBack} aria-label="Назад"
            className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/[0.07] border border-white/10 text-white active:scale-90 transition-all">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#607080]">
              {STEP_LABELS[step] ?? 'Авторизация'}
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border"
            style={{ background: `${roleColor}14`, borderColor: `${roleColor}30` }}>
            {role === 'driver' ? <Truck className="w-3.5 h-3.5" style={{ color: roleColor }} /> : <Package className="w-3.5 h-3.5" style={{ color: roleColor }} />}
            <span className="text-[11px] font-black" style={{ color: roleColor }}>{roleLabel}</span>
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <main className="flex flex-col px-4 pb-8 pt-3 max-w-md mx-auto w-full">
        {/* Step progress dots */}
        <div className="flex items-center justify-center gap-2 mb-3">
          {[1, 2, 3].map(n => {
            const cur = step === 'email' ? 1 : step === 'otp' ? 2 : 3;
            return (
              <div key={n}
                className="h-[3px] rounded-full transition-all duration-500"
                style={{ width: n === cur ? 28 : 8, background: n <= cur ? '#5ba3f5' : 'rgba(255,255,255,0.10)' }}
              />
            );
          })}
        </div>

        <motion.div key={step} className="flex flex-col gap-3"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}>

          {/* ══ STEP 1: Email ══ */}
          {step === 'email' && (<>
            <div className="flex flex-col items-center text-center pt-4 pb-2">
              <div className="relative flex items-center justify-center mb-5">
                {[0, 1].map(i => (
                  <motion.div key={i} className="absolute"
                    initial={{ opacity: 0.45, scale: 1 }}
                    animate={{ opacity: 0, scale: 1 + (i + 1) * 0.52 }}
                    transition={{ duration: 1.8, delay: i * 0.65, repeat: Infinity, ease: 'easeOut' }}>
                    <div style={{ width: 80, height: 80, border: '1.5px solid #5ba3f5', borderRadius: 24 }} />
                  </motion.div>
                ))}
                <div className="relative z-10 w-20 h-20 rounded-3xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #1d4ed8, #2563eb)' }}>
                  <div style={{ position: 'absolute', inset: 0, borderRadius: 24, boxShadow: '0 8px 32px #1d4ed840' }} />
                  <Mail className="w-9 h-9 text-white relative z-10" />
                </div>
                <div className="absolute -bottom-1.5 -right-1.5 z-20 w-7 h-7 rounded-xl bg-[#5ba3f5] flex items-center justify-center border-2 border-[#060e1a]">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
              <h2 className="text-[28px] font-black mb-2 leading-tight"
                style={{ background: 'linear-gradient(90deg, #fff 40%, #8899bb)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Добро пожаловать
              </h2>
              <p className="text-[13px] text-[#607080] max-w-[260px] leading-snug">
                Введите email — мы отправим код для входа
              </p>
            </div>

            <GlassCard>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#607080] mb-2">Email адрес</p>
                <div className="relative flex items-center rounded-2xl border transition-all"
                  style={{ background: emailErr ? 'rgba(239,68,68,0.07)' : 'rgba(255,255,255,0.04)', borderColor: emailErr ? '#ef4444' : 'rgba(255,255,255,0.09)' }}>
                  <Mail className="absolute left-3.5 w-4 h-4 text-[#607080]" />
                  <input ref={emailRef} type="email" value={email}
                    onChange={e => { setEmail(e.target.value); setEmailErr(''); }}
                    placeholder="example@mail.com" autoComplete="email" aria-label="Email адрес"
                    onKeyDown={e => e.key === 'Enter' && handleEmailSubmit()}
                    className="flex-1 bg-transparent outline-none py-3.5 pl-10 pr-4 font-medium text-white placeholder-[#607080]"
                    style={{ fontSize: 16 }} />
                </div>
                {emailErr && (
                  <p className="mt-1.5 text-[11px] text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />{emailErr}
                  </p>
                )}
              </div>
            </GlassCard>

            {checking && (
              <div className="animate-pulse space-y-3 px-4 py-3">
                <div className="h-3 bg-white/10 rounded w-3/4" />
                <div className="h-3 bg-white/10 rounded w-1/2" />
              </div>
            )}

            <div className="relative flex items-start gap-3 px-4 py-3.5 rounded-2xl overflow-hidden"
              style={{ background: '#5ba3f50e' }}>
              <div className="absolute left-0 top-0 bottom-0 w-[2px] rounded-r-full bg-[#5ba3f5]" />
              <ShieldCheck className="w-4 h-4 text-[#5ba3f5] shrink-0 mt-0.5" />
              <p className="text-[12px] text-[#607080] leading-snug">
                Код верификации будет отправлен на ваш email
              </p>
            </div>

            <CTAButton onClick={handleEmailSubmit} loading={checking} loadingText="Отправляем..." ariaLabel="Получить код верификации">
              <Send className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
              <span>Получить код</span>
            </CTAButton>
          </>)}

          {/* ══ STEP 2: OTP Verification ══ */}
          {step === 'otp' && (<>
            <div className="flex items-center gap-3 pt-1">
              <div className="relative flex items-center justify-center shrink-0">
                {[0, 1].map(i => (
                  <motion.div key={i} className="absolute"
                    initial={{ opacity: 0.4, scale: 1 }}
                    animate={{ opacity: 0, scale: 1 + (i + 1) * 0.48 }}
                    transition={{ duration: 1.8, delay: i * 0.6, repeat: Infinity, ease: 'easeOut' }}>
                    <div style={{ width: 52, height: 52, border: '1.5px solid #5ba3f5', borderRadius: 16 }} />
                  </motion.div>
                ))}
                <div className="relative z-10 flex items-center justify-center rounded-2xl"
                  style={{ width: 52, height: 52, background: 'linear-gradient(135deg, #1d4ed8, #2563eb)', boxShadow: '0 6px 20px #1d4ed840' }}>
                  <Lock className="w-6 h-6 text-white relative z-10" />
                </div>
              </div>
              <div>
                <h2 className="text-[20px] font-black text-white leading-tight">Введите код</h2>
                <p className="text-[12px] text-[#607080]">Отправили на {email}</p>
              </div>
            </div>

            <EmailBadge email={email} tag="OTP" tagColor="#5ba3f5" />

            <GlassCard className="flex flex-col gap-4">
              <OtpRow
                arr={otp} setArr={setOtp} refs={otpRefs}
                label="Код из письма" codeErr={otpErr} onClearError={clearOtpErr}
              />
              {otpErr && <ErrorBanner msg={otpErr} />}
            </GlassCard>

            <CTAButton
              onClick={handleVerifyOtp}
              disabled={otpStr.length < 6}
              loading={verifying} loadingText="Проверяем...">
              <CheckCircle2 className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
              <span>Верифицировать</span>
            </CTAButton>

            <button
              onClick={handleResendOtp}
              disabled={cooldown > 0 || resending}
              className="w-full h-12 rounded-2xl text-[13px] font-semibold border border-white/[0.07] hover:border-white/[0.15] hover:text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ color: cooldown > 0 ? '#607080' : '#5ba3f5' }}>
              {resending ? (
                <><Spinner /><span>Отправляем...</span></>
              ) : cooldown > 0 ? (
                <span>Повторить через {cooldown} сек</span>
              ) : (
                <><RotateCcw className="w-4 h-4" /><span>Отправить повторно</span></>
              )}
            </button>
          </>)}

          {/* ══ STEP 3: Register ══ */}
          {step === 'register' && (<>
            <div className="flex items-center gap-3 pt-1">
              <div className="relative flex items-center justify-center shrink-0">
                {[0, 1].map(i => (
                  <motion.div key={i} className="absolute"
                    initial={{ opacity: 0.4, scale: 1 }}
                    animate={{ opacity: 0, scale: 1 + (i + 1) * 0.48 }}
                    transition={{ duration: 1.8, delay: i * 0.6, repeat: Infinity, ease: 'easeOut' }}>
                    <div style={{ width: 52, height: 52, border: '1.5px solid #10b981', borderRadius: 16 }} />
                  </motion.div>
                ))}
                <div className="relative z-10 flex items-center justify-center rounded-2xl"
                  style={{ width: 52, height: 52, background: 'linear-gradient(135deg, #059669, #10b981)', boxShadow: '0 6px 20px #10b98140' }}>
                  <User className="w-6 h-6 text-white relative z-10" />
                </div>
              </div>
              <div>
                <h2 className="text-[20px] font-black text-white leading-tight">Завершите регистрацию</h2>
                <p className="text-[12px] text-[#607080]">Укажите ваши данные</p>
              </div>
            </div>

            <EmailBadge email={email} tag="НОВЫЙ" tagColor="#10b981" />

            <GlassCard className="flex flex-col gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#607080] mb-2">Имя</p>
                <div className="relative flex items-center rounded-2xl border transition-all"
                  style={{ background: formErr.firstName ? 'rgba(239,68,68,0.07)' : 'rgba(255,255,255,0.04)', borderColor: formErr.firstName ? '#ef4444' : 'rgba(255,255,255,0.09)' }}>
                  <User className="absolute left-3.5 w-4 h-4 text-[#607080]" />
                  <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)}
                    placeholder="Ваше имя" className="flex-1 bg-transparent outline-none py-3.5 pl-10 pr-4 font-medium text-white placeholder-[#607080]" style={{ fontSize: 16 }} aria-describedby={emailErr ? "email-error" : undefined} aria-invalid={!!emailErr} />
                </div>
                {formErr.firstName && <p className="mt-1 text-[11px] text-red-400">{formErr.firstName}</p>}
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#607080] mb-2">Фамилия</p>
                <div className="relative flex items-center rounded-2xl border transition-all"
                  style={{ background: formErr.lastName ? 'rgba(239,68,68,0.07)' : 'rgba(255,255,255,0.04)', borderColor: formErr.lastName ? '#ef4444' : 'rgba(255,255,255,0.09)' }}>
                  <User className="absolute left-3.5 w-4 h-4 text-[#607080]" />
                  <input type="text" value={lastName} onChange={e => setLastName(e.target.value)}
                    placeholder="Ваша фамилия" className="flex-1 bg-transparent outline-none py-3.5 pl-10 pr-4 font-medium text-white placeholder-[#607080]" style={{ fontSize: 16 }} aria-invalid={!!emailErr} />
                </div>
                {formErr.lastName && <p className="mt-1 text-[11px] text-red-400">{formErr.lastName}</p>}
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#607080] mb-2">Телефон</p>
                <div className="relative flex items-center rounded-2xl border transition-all"
                  style={{ background: formErr.phone ? 'rgba(239,68,68,0.07)' : 'rgba(255,255,255,0.04)', borderColor: formErr.phone ? '#ef4444' : 'rgba(255,255,255,0.09)' }}>
                  <Phone className="absolute left-3.5 w-4 h-4 text-[#607080]" />
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                    placeholder="+992 900 123 456" className="flex-1 bg-transparent outline-none py-3.5 pl-10 pr-4 font-medium text-white placeholder-[#607080]" style={{ fontSize: 16 }} aria-invalid={!!emailErr} />
                </div>
                {formErr.phone && <p className="mt-1 text-[11px] text-red-400">{formErr.phone}</p>}
              </div>
            </GlassCard>

            <CTAButton onClick={handleRegister} loading={submitting} loadingText="Создаём..." ariaLabel="Создать аккаунт"
              color="#059669">
              <CheckCircle2 className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
              <span>Создать аккаунт</span>
            </CTAButton>
          </>)}

          {/* ══ STEP: Login Found ══ */}
          {step === 'login_found' && existingUser && (<>
            <div className="flex flex-col items-center text-center pt-4 pb-2">
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5"
                style={{ background: 'linear-gradient(135deg, #1d4ed8, #2563eb)', boxShadow: '0 8px 32px #1d4ed840' }}>
                <CheckCircle2 className="w-9 h-9 text-white" />
              </div>
              <h2 className="text-[24px] font-black mb-2">С возвращением!</h2>
              <p className="text-[13px] text-[#607080]">
                Найден аккаунт: {existingUser.firstName} {existingUser.lastName}
              </p>
            </div>

            <EmailBadge email={email} tag="СУЩЕСТВУЮЩИЙ" tagColor="#5ba3f5" />

            <CTAButton onClick={() => handleLogin(existingUser)}>
              <span>Войти как {existingUser.firstName}</span>
              <ChevronRight className="w-5 h-5" />
            </CTAButton>
          </>)}

          {/* ══ STEP: Role Conflict ══ */}
          {step === 'role_conflict' && existingUser && (<>
            <div className="flex flex-col items-center text-center pt-4 pb-2">
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5"
                style={{ background: 'linear-gradient(135deg, #dc2626, #ef4444)', boxShadow: '0 8px 32px #dc262640' }}>
                <AlertCircle className="w-9 h-9 text-white" />
              </div>
              <h2 className="text-[24px] font-black mb-2">Конфликт ролей</h2>
              <p className="text-[13px] text-[#607080]">
                Этот email зарегистрирован как {conflictRole === 'driver' ? 'Водитель' : 'Отправитель'}
              </p>
            </div>

            <EmailBadge email={email} tag="КОНФЛИКТ" tagColor="#ef4444" />

            <div className="flex flex-col gap-2">
              <button onClick={() => handleLogin(existingUser)} aria-label="Войти в аккаунт"
                className="w-full h-12 rounded-2xl font-bold text-white flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #1d4ed8, #2563eb)' }}>
                <span>Войти как {conflictRole === 'driver' ? 'Водитель' : 'Отправитель'}</span>
              </button>
              <button onClick={() => setStep('email')} aria-label="Использовать другой email"
                className="w-full h-12 rounded-2xl text-[13px] font-semibold text-[#607080] border border-white/[0.07] hover:border-white/[0.15] hover:text-white transition-all">
                Использовать другой email
              </button>
            </div>
          </>)}

        </motion.div>
      </main>
    </div>
  );
}
