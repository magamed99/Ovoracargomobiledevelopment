/**
 * AdminAuthGate.tsx
 * Экран входа в admin-панель.
 * Вводится код доступа → сервер сверяет с ADMIN_ACCESS_CODE из env.
 * Код никогда не хранится в базе и не передаётся на клиент.
 */

import { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Truck, ShieldCheck, Eye, EyeOff, RefreshCw, ArrowLeft } from 'lucide-react';
import { projectId, publicAnonKey } from '../../../../utils/supabase/info';
import { useNavigate } from 'react-router';

const BASE = `https://${projectId}.supabase.co/functions/v1/make-server-4e36197a`;
const HEADERS = { 'Content-Type': 'application/json', Authorization: `Bearer ${publicAnonKey}` };
const ADMIN_SESSION_KEY = 'ovora_admin_auth';

interface Props {
  onSuccess: () => void;
}

export function AdminAuthGate({ onSuccess }: Props) {
  const navigate = useNavigate();
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [shake, setShake] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    setTimeout(() => inputRefs.current[0]?.focus(), 120);
  }, []);

  // Auto-submit when all 6 digits filled
  useEffect(() => {
    if (digits.every(d => d !== '')) {
      handleSubmit();
    }
  }, [digits]);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleSubmit = async () => {
    const code = digits.join('');
    if (code.length < 6) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${BASE}/admin/auth`, {
        method: 'POST',
        headers: HEADERS,
        body: JSON.stringify({ code }),
      });
      const data = await res.json();

      if (data.success) {
        sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
        sessionStorage.setItem('ovora_admin_token', code);
        onSuccess();
      } else {
        setDigits(['', '', '', '', '', '']);
        setTimeout(() => inputRefs.current[0]?.focus(), 50);
        setError(data.error || 'Неверный код');
        triggerShake();
      }
    } catch {
      setError('Нет соединения с сервером');
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const handleDigitChange = (index: number, value: string) => {
    const v = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = v;
    setDigits(next);
    setError('');
    if (v && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleDigitKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        const next = [...digits];
        next[index] = '';
        setDigits(next);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
        const next = [...digits];
        next[index - 1] = '';
        setDigits(next);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    } else if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const next = ['', '', '', '', '', ''];
    pasted.split('').forEach((ch, i) => { next[i] = ch; });
    setDigits(next);
    const focusIdx = Math.min(pasted.length, 5);
    setTimeout(() => inputRefs.current[focusIdx]?.focus(), 10);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0b1526 0%, #0e1e36 50%, #0a1220 100%)' }}
    >
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, #1565d820 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-15%] right-[-10%] w-[400px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, #7c3aed18 0%, transparent 70%)' }} />
        <svg className="absolute inset-0 w-full h-full opacity-[0.04]">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#4a90d9" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
        className="relative w-full max-w-[380px]"
      >
        {/* Card */}
        <motion.div
          animate={shake ? { x: [-8, 8, -6, 6, -3, 3, 0] } : { x: 0 }}
          transition={{ duration: 0.45 }}
          className="rounded-3xl overflow-hidden"
          style={{
            background: 'linear-gradient(145deg, #111d2e, #0d1826)',
            border: '1px solid #1e3553',
            boxShadow: '0 32px 80px #00000066, 0 0 0 1px #ffffff08 inset',
          }}
        >
          {/* Top accent */}
          <div style={{ height: 3, background: 'linear-gradient(90deg, #1565d8, #5ba3f5, #7c3aed)' }} />

          <div className="p-8">
            {/* Logo */}
            <div className="flex flex-col items-center mb-8">
              <div className="relative mb-4">
                {/* Rotating rainbow glow ring */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  style={{
                    position: 'absolute',
                    inset: -4,
                    borderRadius: 24,
                    background: 'conic-gradient(from 0deg, #ff0080, #ff8c00, #ffe000, #00ff88, #00cfff, #7c3aed, #ff0080)',
                    filter: 'blur(2px)',
                    zIndex: 0,
                  }}
                />
                {/* Inner mask */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 2,
                    borderRadius: 20,
                    background: '#0d1b2e',
                    zIndex: 1,
                  }}
                />
                {/* Icon box */}
                <div
                  className="relative w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{
                    zIndex: 2,
                    background: 'linear-gradient(160deg, #2a6ee0 0%, #1245a8 60%, #0d3080 100%)',
                    boxShadow: '0 2px 0 #5b9af8 inset, 0 -2px 0 #0a2560 inset, 2px 0 0 #1e5fd4 inset, -2px 0 0 #0e3899 inset, 0 8px 24px #1565d860, 0 16px 40px #00000060',
                  }}
                >
                  {/* Top shine highlight */}
                  <div style={{
                    position: 'absolute',
                    top: 4,
                    left: 6,
                    right: 6,
                    height: 10,
                    borderRadius: 6,
                    background: 'linear-gradient(180deg, #ffffff55 0%, transparent 100%)',
                    pointerEvents: 'none',
                  }} />
                  {/* Bottom depth shadow */}
                  <div style={{
                    position: 'absolute',
                    bottom: 4,
                    left: 6,
                    right: 6,
                    height: 6,
                    borderRadius: 4,
                    background: 'linear-gradient(180deg, transparent 0%, #00000040 100%)',
                    pointerEvents: 'none',
                  }} />
                  <ShieldCheck
                    style={{
                      width: 30,
                      height: 30,
                      color: '#ffffff',
                      filter: 'drop-shadow(0 2px 4px #00000060)',
                      position: 'relative',
                      zIndex: 1,
                    }}
                  />
                </div>
              </div>
              <h1 className="text-xl font-bold text-white tracking-tight">Ovora Admin</h1>
              <p className="text-sm mt-1" style={{ color: '#4a7a9b' }}>
                Введите код доступа
              </p>
            </div>

            <div className="space-y-6">
              {/* Info */}
              <div
                className="flex items-start gap-2.5 px-4 py-3 rounded-xl"
                style={{ background: '#0d2040', border: '1px solid #1a3a5c' }}
              >
                <ShieldCheck className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#5ba3f5' }} />
                <p className="text-xs leading-relaxed" style={{ color: '#7aafd4' }}>
                  Код хранится только на сервере в защищённых переменных окружения — он недоступен из браузера
                </p>
              </div>

              {/* OTP Boxes */}
              <div className="flex items-center justify-center gap-2.5">
                {digits.map((digit, i) => (
                  <div key={i} className="relative">
                    <input
                      ref={el => { inputRefs.current[i] = el; }}
                      type={showCode ? 'text' : 'password'}
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleDigitChange(i, e.target.value)}
                      onKeyDown={e => handleDigitKeyDown(i, e)}
                      onPaste={handlePaste}
                      disabled={loading}
                      className="w-12 h-14 text-center text-xl font-bold rounded-2xl outline-none transition-all select-none"
                      style={{
                        background: digit ? '#0d2040' : '#080f1c',
                        border: error
                          ? '2px solid #ef4444'
                          : digit
                          ? '2px solid #2385f4'
                          : '2px solid #1a2e44',
                        color: '#ffffff',
                        boxShadow: digit && !error ? '0 0 12px #1565d830' : 'none',
                        caretColor: 'transparent',
                      }}
                      onFocus={e => {
                        if (!error) {
                          e.currentTarget.style.borderColor = '#2385f4';
                          e.currentTarget.style.boxShadow = '0 0 0 3px #1565d820';
                        }
                      }}
                      onBlur={e => {
                        e.currentTarget.style.borderColor = error ? '#ef4444' : digit ? '#2385f4' : '#1a2e44';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    />
                    {i === 2 && (
                      <span
                        className="absolute -right-3.5 top-1/2 -translate-y-1/2 text-lg font-bold"
                        style={{ color: '#1e3553' }}
                      >
                        ·
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Show/hide toggle */}
              <button
                type="button"
                onClick={() => setShowCode(v => !v)}
                className="flex items-center gap-1.5 mx-auto text-xs font-medium transition-all"
                style={{ color: '#4a7a9b' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#7aafd4')}
                onMouseLeave={e => (e.currentTarget.style.color = '#4a7a9b')}
              >
                {showCode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {showCode ? 'Скрыть' : 'Показать'}
              </button>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-sm font-bold text-center"
                    style={{ color: '#f87171' }}
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Submit */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || digits.some(d => d === '')}
                className="w-full py-3.5 rounded-2xl text-white font-bold text-sm transition-all disabled:opacity-40"
                style={{
                  background: loading ? '#1e3553' : 'linear-gradient(135deg, #1565d8, #2385f4)',
                  boxShadow: loading ? 'none' : '0 8px 24px #1565d840',
                }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Проверяем...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    Войти
                  </span>
                )}
              </button>

              {/* Back */}
              <button
                type="button"
                onClick={() => navigate('/')}
                className="flex items-center justify-center gap-1.5 w-full py-2 rounded-2xl text-sm font-medium transition-all"
                style={{ color: '#4a7a9b' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#7aafd4')}
                onMouseLeave={e => (e.currentTarget.style.color = '#4a7a9b')}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                На главную
              </button>
            </div>
          </div>
        </motion.div>

        {/* Security badge */}
        <div className="flex items-center justify-center gap-2 mt-5">
          <ShieldCheck className="w-3.5 h-3.5" style={{ color: '#2d4a60' }} />
          <span className="text-xs" style={{ color: '#2d4a60' }}>
            Защищено env-переменными • Код не хранится в базе
          </span>
        </div>
      </motion.div>
    </div>
  );
}