import { useNavigate } from 'react-router';
import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Plane, Phone, Lock, Users, Package, Repeat, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAvia } from './AviaContext';
import { checkPhone, registerAvia, loginAvia } from '../../api/aviaApi';

type Step = 'phone' | 'pin-create' | 'pin-login' | 'role';
type AviaRole = 'courier' | 'sender' | 'both';

const ROLES: { id: AviaRole; icon: typeof Package; label: string; desc: string; color: string }[] = [
  { id: 'courier', icon: Package, label: 'Курьер', desc: 'Перевожу посылки авиарейсами', color: '#0ea5e9' },
  { id: 'sender', icon: Users, label: 'Отправитель', desc: 'Ищу курьера для отправки', color: '#a78bfa' },
  { id: 'both', icon: Repeat, label: 'Оба', desc: 'Могу и перевозить и отправлять', color: '#34d399' },
];

export function AviaAuth() {
  const navigate = useNavigate();
  // Loader в routes.tsx (redirectAviaIfAuthenticated) уже обработал случай
  // "пользователь уже авторизован" — редирект произошёл ДО монтирования
  // этого компонента. Никакого isAuth-useEffect здесь не нужно.
  const { login } = useAvia();

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('+992');
  const [pin, setPin] = useState(['', '', '', '']);
  const [pinConfirm, setPinConfirm] = useState(['', '', '', '']);
  const [showPin, setShowPin] = useState(false);
  const [selectedRole, setSelectedRole] = useState<AviaRole | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const pinRefs = useRef<(HTMLInputElement | null)[]>([]);
  const confirmRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ── Автофокус при смене шагов ──────────────────────────────────────────────
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (step === 'pin-create') {
        if (!isConfirming) {
          pinRefs.current[0]?.focus();
        } else {
          confirmRefs.current[0]?.focus();
        }
      } else if (step === 'pin-login') {
        pinRefs.current[0]?.focus();
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [step, isConfirming]);

  // ── Форматирование телефона ────────────────────────────────────────────────
  const handlePhoneChange = (value: string) => {
    // Разрешаем только + и цифры
    const cleaned = value.replace(/[^\d+]/g, '');
    setPhone(cleaned);
    setError('');
  };

  // ── Проверка телефона ──────────────────────────────────────────────────────
  const handlePhoneSubmit = async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 9) {
      setError('Введите корректный номер телефона');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await checkPhone(phone);
      if (result.isNew) {
        setStep('pin-create');
      } else {
        setStep('pin-login');
      }
    } catch (e: any) {
      setError(e.message || 'Ошибка проверки');
    } finally {
      setLoading(false);
    }
  };

  // ── PIN ввод ───────────────────────────────────────────────────────────────
  // (Старые функции удалены, так как теперь используем единый невидимый инпут)
  
  // ── Создание PIN (шаг 1: ввод, шаг 2: подтверждение) ──────────────────────
  const handlePinCreateNext = () => {
    const pinStr = pin.join('');
    if (pinStr.length < 4) { setError('Введите 4 цифры'); return; }
    if (!isConfirming) {
      setIsConfirming(true);
      setPinConfirm(['', '', '', '']);
      setTimeout(() => confirmRefs.current[0]?.focus(), 100);
    } else {
      const confirmStr = pinConfirm.join('');
      if (pinStr !== confirmStr) {
        setError('PIN-коды не совпадают');
        setPinConfirm(['', '', '', '']);
        setTimeout(() => confirmRefs.current[0]?.focus(), 100);
        return;
      }
      setStep('role');
    }
  };

  // ── Вход по PIN ────────────────────────────────────────────────────────────
  const handlePinLogin = async () => {
    const pinStr = pin.join('');
    if (pinStr.length < 4) { setError('Введите 4 цифры'); return; }
    setLoading(true);
    setError('');
    try {
      const user = await loginAvia(phone, pinStr);
      login(user);
      navigate('/avia/dashboard', { replace: true });
    } catch (e: any) {
      setError(e.message || 'Ошибка входа');
      setPin(['', '', '', '']);
      setTimeout(() => pinRefs.current[0]?.focus(), 100);
    } finally {
      setLoading(false);
    }
  };

  // ── Регистрация с ролью ────────────────────────────────────────────────────
  const handleRegister = async () => {
    if (!selectedRole) { setError('Выберите роль'); return; }
    setLoading(true);
    setError('');
    try {
      const pinStr = pin.join('');
      const user = await registerAvia(phone, pinStr, selectedRole);
      login(user);
      navigate('/avia/dashboard', { replace: true });
    } catch (e: any) {
      setError(e.message || 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  // ── Навигация назад ────────────────────────────────────────────────────────
  const handleBack = () => {
    setError('');
    if (step === 'role') {
      setStep('pin-create');
      setIsConfirming(false);
    } else if (step === 'pin-create') {
      if (isConfirming) {
        setIsConfirming(false);
        setPinConfirm(['', '', '', '']);
      } else {
        setStep('phone');
        setPin(['', '', '', '']);
      }
    } else if (step === 'pin-login') {
      setStep('phone');
      setPin(['', '', '', '']);
    } else {
      navigate('/');
    }
  };

  // ── PIN Input Grid ─────────────────────────────────────────────────────────
  const PinGrid = ({
    values,
    setValues,
    refs,
    autoFocus,
  }: {
    values: string[];
    setValues: React.Dispatch<React.SetStateAction<string[]>>;
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>;
    autoFocus?: boolean;
  }) => {
    // Вспомогательный скрытый инпут, который принимает весь ввод
    const handleHiddenInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value.replace(/\D/g, '').slice(0, 4);
      const newValues = ['', '', '', ''];
      for (let i = 0; i < val.length; i++) {
        newValues[i] = val[i];
      }
      setValues(newValues);
      setError('');
    };

    return (
      <div style={{ position: 'relative', width: 'fit-content', margin: '0 auto' }}>
        {/* Невидимый инпут, перехватывающий фокус и клавиатуру */}
        <input
          ref={(el) => { refs.current[0] = el; }} // Храним ссылку только на первый (единственный реальный) инпут
          type={showPin ? 'text' : 'password'}
          inputMode="numeric"
          pattern="\d*"
          maxLength={4}
          autoFocus={autoFocus}
          value={values.join('')}
          onChange={handleHiddenInputChange}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            opacity: 0,
            cursor: 'text',
            zIndex: 10,
          }}
        />
        
        {/* Видимые ячейки (только для отображения) */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', pointerEvents: 'none' }}>
          {values.map((v, i) => {
            const isActive = values.join('').length === i || (values.join('').length === 4 && i === 3);
            return (
              <div
                key={i}
                style={{
                  width: 56, height: 64,
                  borderRadius: 16,
                  border: `2px solid ${v || isActive ? '#0ea5e960' : '#ffffff15'}`,
                  background: v ? '#0ea5e910' : '#ffffff08',
                  color: '#fff',
                  fontSize: 24, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'border-color 0.2s, background 0.2s',
                  boxShadow: isActive ? '0 0 0 2px #0ea5e920' : 'none',
                }}
              >
                {showPin ? v : (v ? '•' : '')}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div style={{
      minHeight: '100dvh',
      background: '#060d18',
      display: 'flex', flexDirection: 'column',
      fontFamily: "'Sora', 'Inter', sans-serif",
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute', width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, #0ea5e918 0%, transparent 70%)',
        top: '10%', left: '50%', transform: 'translateX(-50%)', pointerEvents: 'none',
      }} />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: 'clamp(14px, 4vw, 20px) clamp(16px, 5vw, 24px)',
        }}
      >
        <button onClick={handleBack} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 14px', borderRadius: 12,
          border: '1px solid #ffffff12', background: '#ffffff08',
          color: '#8ea8b8', fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}>
          <ArrowLeft style={{ width: 16, height: 16 }} />
          Назад
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: 'linear-gradient(135deg, #0369a1 0%, #0ea5e9 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Plane style={{ width: 18, height: 18, color: '#fff' }} />
          </div>
          <span style={{ fontSize: 15, fontWeight: 800, color: '#fff', letterSpacing: '-0.3px' }}>
            AVIA
          </span>
        </div>
      </motion.div>

      {/* Content */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '0 clamp(20px, 6vw, 40px) clamp(30px, 6dvh, 60px)',
        maxWidth: 440, margin: '0 auto', width: '100%',
      }}>
        <AnimatePresence mode="wait">
          {/* ══════════ STEP: PHONE ══════════ */}
          {step === 'phone' && (
            <motion.div
              key="phone"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              style={{ width: '100%', textAlign: 'center' }}
            >
              <div style={{
                width: 64, height: 64, borderRadius: 20, margin: '0 auto 20px',
                background: '#0ea5e915', border: '1px solid #0ea5e930',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Phone style={{ width: 28, height: 28, color: '#0ea5e9' }} />
              </div>

              <h2 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: '0 0 6px', letterSpacing: '-0.5px' }}>
                Вход в AVIA
              </h2>
              <p style={{ fontSize: 13, color: '#6b8299', margin: '0 0 28px', lineHeight: 1.5 }}>
                Введите номер телефона для входа или регистрации
              </p>

              <div style={{ position: 'relative', marginBottom: 16 }}>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="+992 XX XXX XX XX"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handlePhoneSubmit()}
                  style={{
                    width: '100%', padding: '16px 18px',
                    borderRadius: 16, border: '2px solid #ffffff15',
                    background: '#ffffff08', color: '#fff',
                    fontSize: 18, fontWeight: 600,
                    outline: 'none', letterSpacing: '0.5px',
                    textAlign: 'center',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ color: '#f87171', fontSize: 13, marginBottom: 16 }}
                >
                  {error}
                </motion.p>
              )}

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handlePhoneSubmit}
                disabled={loading || phone.replace(/\D/g, '').length < 9}
                style={{
                  width: '100%', padding: '16px 24px',
                  borderRadius: 16, border: 'none',
                  background: loading || phone.replace(/\D/g, '').length < 9
                    ? '#ffffff10' : 'linear-gradient(135deg, #0369a1 0%, #0ea5e9 100%)',
                  color: '#fff', fontSize: 15, fontWeight: 700,
                  cursor: loading ? 'wait' : 'pointer',
                  opacity: phone.replace(/\D/g, '').length < 9 ? 0.4 : 1,
                  boxShadow: '0 8px 24px #0ea5e933',
                }}
              >
                {loading ? 'Проверка...' : 'Продолжить'}
              </motion.button>

              <p style={{ fontSize: 11, color: '#3d5268', marginTop: 16, lineHeight: 1.5 }}>
                Поддерживаются номера: +992 (TJ), +7 (RU), +998 (UZ)
              </p>
            </motion.div>
          )}

          {/* ══════════ STEP: PIN CREATE ══════════ */}
          {step === 'pin-create' && (
            <motion.div
              key="pin-create"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              style={{ width: '100%', textAlign: 'center' }}
            >
              <div style={{
                width: 64, height: 64, borderRadius: 20, margin: '0 auto 20px',
                background: '#0ea5e915', border: '1px solid #0ea5e930',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Lock style={{ width: 28, height: 28, color: '#0ea5e9' }} />
              </div>

              <h2 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: '0 0 6px', letterSpacing: '-0.5px' }}>
                {isConfirming ? 'Подтвердите PIN' : 'Создайте PIN'}
              </h2>
              <p style={{ fontSize: 13, color: '#6b8299', margin: '0 0 24px', lineHeight: 1.5 }}>
                {isConfirming
                  ? 'Введите PIN-код повторно для подтверждения'
                  : 'Придумайте 4-значный PIN-код для входа'}
              </p>

              {!isConfirming ? (
                <PinGrid key="pin" values={pin} setValues={setPin} refs={pinRefs} autoFocus />
              ) : (
                <PinGrid key="confirm" values={pinConfirm} setValues={setPinConfirm} refs={confirmRefs} autoFocus />
              )}

              {/* Show/hide toggle */}
              <button
                onClick={() => setShowPin(!showPin)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  margin: '16px auto 0', padding: '6px 12px',
                  borderRadius: 10, border: 'none', background: 'transparent',
                  color: '#6b8299', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}
              >
                {showPin ? <EyeOff style={{ width: 14, height: 14 }} /> : <Eye style={{ width: 14, height: 14 }} />}
                {showPin ? 'Скрыть' : 'Показать'}
              </button>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ color: '#f87171', fontSize: 13, marginTop: 12 }}
                >
                  {error}
                </motion.p>
              )}

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handlePinCreateNext}
                disabled={(!isConfirming ? pin : pinConfirm).join('').length < 4}
                style={{
                  width: '100%', padding: '16px 24px', marginTop: 24,
                  borderRadius: 16, border: 'none',
                  background: (!isConfirming ? pin : pinConfirm).join('').length < 4
                    ? '#ffffff10' : 'linear-gradient(135deg, #0369a1 0%, #0ea5e9 100%)',
                  color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer',
                  opacity: (!isConfirming ? pin : pinConfirm).join('').length < 4 ? 0.4 : 1,
                  boxShadow: '0 8px 24px #0ea5e933',
                }}
              >
                {isConfirming ? 'Подтвердить' : 'Далее'}
              </motion.button>
            </motion.div>
          )}

          {/* ══════════ STEP: PIN LOGIN ══════════ */}
          {step === 'pin-login' && (
            <motion.div
              key="pin-login"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              style={{ width: '100%', textAlign: 'center' }}
            >
              <div style={{
                width: 64, height: 64, borderRadius: 20, margin: '0 auto 20px',
                background: '#34d39915', border: '1px solid #34d39930',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Lock style={{ width: 28, height: 28, color: '#34d399' }} />
              </div>

              <h2 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: '0 0 6px', letterSpacing: '-0.5px' }}>
                Введите PIN
              </h2>
              <p style={{ fontSize: 13, color: '#6b8299', margin: '0 0 8px', lineHeight: 1.5 }}>
                Введите ваш 4-значный PIN-код
              </p>
              <p style={{
                fontSize: 12, color: '#3d5268', margin: '0 0 24px',
                padding: '6px 14px', borderRadius: 10,
                background: '#ffffff06', display: 'inline-block',
              }}>
                {phone}
              </p>

              <PinGrid key="login" values={pin} setValues={setPin} refs={pinRefs} autoFocus />

              <button
                onClick={() => setShowPin(!showPin)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  margin: '16px auto 0', padding: '6px 12px',
                  borderRadius: 10, border: 'none', background: 'transparent',
                  color: '#6b8299', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}
              >
                {showPin ? <EyeOff style={{ width: 14, height: 14 }} /> : <Eye style={{ width: 14, height: 14 }} />}
                {showPin ? 'Скрыть' : 'Показать'}
              </button>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ color: '#f87171', fontSize: 13, marginTop: 12 }}
                >
                  {error}
                </motion.p>
              )}

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handlePinLogin}
                disabled={loading || pin.join('').length < 4}
                style={{
                  width: '100%', padding: '16px 24px', marginTop: 24,
                  borderRadius: 16, border: 'none',
                  background: loading || pin.join('').length < 4
                    ? '#ffffff10' : 'linear-gradient(135deg, #0369a1 0%, #0ea5e9 100%)',
                  color: '#fff', fontSize: 15, fontWeight: 700,
                  cursor: loading ? 'wait' : 'pointer',
                  opacity: pin.join('').length < 4 ? 0.4 : 1,
                  boxShadow: '0 8px 24px #0ea5e933',
                }}
              >
                {loading ? 'Проверка...' : 'Войти'}
              </motion.button>
            </motion.div>
          )}

          {/* ══════════ STEP: ROLE SELECT ══════════ */}
          {step === 'role' && (
            <motion.div
              key="role"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              style={{ width: '100%', textAlign: 'center' }}
            >
              <h2 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: '0 0 6px', letterSpacing: '-0.5px' }}>
                Выберите роль
              </h2>
              <p style={{ fontSize: 13, color: '#6b8299', margin: '0 0 24px', lineHeight: 1.5 }}>
                Роль можно изменить позже в профиле
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {ROLES.map((r, i) => {
                  const isSelected = selectedRole === r.id;
                  const Icon = r.icon;
                  return (
                    <motion.button
                      key={r.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1, duration: 0.4 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => { setSelectedRole(r.id); setError(''); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 14,
                        padding: '16px 18px', borderRadius: 18, cursor: 'pointer',
                        background: isSelected ? `${r.color}12` : '#ffffff06',
                        border: `2px solid ${isSelected ? `${r.color}50` : '#ffffff10'}`,
                        textAlign: 'left',
                        transition: 'border-color 0.2s, background 0.2s',
                      }}
                    >
                      <div style={{
                        width: 44, height: 44, borderRadius: 14,
                        background: `${r.color}18`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <Icon style={{ width: 22, height: 22, color: r.color }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 2 }}>
                          {r.label}
                        </div>
                        <div style={{ fontSize: 12, color: '#6b8299' }}>
                          {r.desc}
                        </div>
                      </div>
                      {isSelected && (
                        <CheckCircle2 style={{ width: 22, height: 22, color: r.color, flexShrink: 0 }} />
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ color: '#f87171', fontSize: 13, marginTop: 16 }}
                >
                  {error}
                </motion.p>
              )}

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleRegister}
                disabled={loading || !selectedRole}
                style={{
                  width: '100%', padding: '16px 24px', marginTop: 24,
                  borderRadius: 16, border: 'none',
                  background: loading || !selectedRole
                    ? '#ffffff10' : 'linear-gradient(135deg, #0369a1 0%, #0ea5e9 100%)',
                  color: '#fff', fontSize: 15, fontWeight: 700,
                  cursor: loading ? 'wait' : 'pointer',
                  opacity: !selectedRole ? 0.4 : 1,
                  boxShadow: '0 8px 24px #0ea5e933',
                }}
              >
                {loading ? 'Регистрация...' : 'Зарегистрироваться'}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Step indicator */}
      <div style={{
        display: 'flex', gap: 6, justifyContent: 'center',
        paddingBottom: 'clamp(20px, 4dvh, 32px)',
      }}>
        {['phone', 'pin', 'role'].map((s, i) => {
          const current =
            s === 'phone' ? step === 'phone' :
            s === 'pin' ? (step === 'pin-create' || step === 'pin-login') :
            step === 'role';
          const past =
            s === 'phone' ? step !== 'phone' :
            s === 'pin' ? step === 'role' :
            false;
          return (
            <div key={s} style={{
              width: current ? 20 : 6, height: 6, borderRadius: 3,
              background: current ? '#0ea5e9' : past ? '#0ea5e960' : '#ffffff15',
              transition: 'width 0.3s, background 0.3s',
            }} />
          );
        })}
      </div>
    </div>
  );
}