import { useState } from 'react';
import { X, Loader2, Package, AlertCircle, ArrowRight, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { createAviaRequest } from '../../api/aviaApi';
import type { AviaUser, AviaRequest } from '../../api/aviaApi';
import { AirportAutocomplete } from './AirportAutocomplete';
import { AviaCurrencySelector, getCurrency } from './AviaCurrencySelector';

interface Props {
  user: AviaUser;
  onClose: () => void;
  onSuccess: (request: AviaRequest) => void;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 12,
  border: '1.5px solid #ffffff12',
  background: '#ffffff08',
  color: '#fff',
  fontSize: 14,
  fontWeight: 500,
  outline: 'none',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontWeight: 600,
  color: '#6b8299',
  marginBottom: 6,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
};

export function CreateRequestModal({ user, onClose, onSuccess }: Props) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [beforeDate, setBeforeDate] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];
  const cur = getCurrency(currency);

  const isValid =
    from.trim().length >= 2 &&
    to.trim().length >= 2 &&
    !!beforeDate &&
    Number(weightKg) > 0;

  const handleSubmit = async () => {
    if (!isValid) {
      setError('Заполните обязательные поля: откуда, куда, дедлайн, вес');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await createAviaRequest({
        senderId: user.phone,
        from: from.trim(),
        to: to.trim(),
        beforeDate,
        weightKg: Number(weightKg),
        description: description.trim() || undefined,
        budget: budget ? Number(budget) : undefined,
        currency,
      });
      if (result.error) throw new Error(result.error);
      if (result.request) onSuccess(result.request);
      else throw new Error('Сервер не вернул данные заявки');
    } catch (e: any) {
      console.error('[CreateRequestModal]', e);
      const msg = e.message || 'Ошибка создания заявки';
      setError(msg);
      toast.error(msg, { duration: 3000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        key="request-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.78)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        }}
      >
        <motion.div
          key="request-sheet"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%', maxWidth: 520,
            background: '#0a1525',
            border: '1px solid #ffffff0f',
            borderRadius: '24px 24px 0 0',
            padding: '24px 20px 44px',
            maxHeight: '94dvh',
            overflowY: 'auto',
            fontFamily: "'Sora', 'Inter', sans-serif",
          }}
        >
          {/* Handle */}
          <div style={{ width: 36, height: 4, borderRadius: 2, background: '#ffffff20', margin: '0 auto 20px' }} />

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 12,
                background: 'linear-gradient(135deg, #6d28d9, #a78bfa)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Package style={{ width: 18, height: 18, color: '#fff' }} />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>Новая заявка</div>
                <div style={{ fontSize: 10, color: '#4a6080', fontWeight: 600 }}>Поиск курьера</div>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                width: 34, height: 34, borderRadius: 10,
                border: '1px solid #ffffff12', background: '#ffffff08',
                color: '#6b8299', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <X style={{ width: 16, height: 16 }} />
            </button>
          </div>

          {/* Route */}
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Маршрут *</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AirportAutocomplete
                value={from}
                onChange={v => { setFrom(v); setError(''); }}
                placeholder="Откуда"
                accentColor="#6d28d9"
                iconColor="#4a6080"
              />
              <ArrowRight style={{ width: 16, height: 16, color: '#4a6080', flexShrink: 0 }} />
              <AirportAutocomplete
                value={to}
                onChange={v => { setTo(v); setError(''); }}
                placeholder="Куда"
                accentColor="#a78bfa"
                iconColor="#a78bfa"
              />
            </div>
          </div>

          {/* Deadline */}
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Нужно до *</label>
            <input
              type="date" value={beforeDate} min={todayStr}
              onChange={e => { setBeforeDate(e.target.value); setError(''); }}
              style={{ ...inputStyle, colorScheme: 'dark' }}
            />
          </div>

          {/* Weight */}
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Вес посылки, кг *</label>
            <input
              type="number" value={weightKg} min="0.1" step="0.1"
              onChange={e => { setWeightKg(e.target.value); setError(''); }}
              placeholder="Напр: 2.5"
              style={inputStyle}
            />
          </div>

          {/* Description */}
          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>Описание посылки</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Документы, одежда, электроника... (необязательно)"
              rows={3}
              style={{ ...inputStyle, resize: 'none', lineHeight: 1.5 }}
            />
          </div>

          {/* ── Currency selector ── */}
          <div style={{
            marginBottom: 14, padding: '14px 16px', borderRadius: 16,
            background: '#ffffff05', border: '1px solid #ffffff0d',
          }}>
            <AviaCurrencySelector
              value={currency}
              onChange={setCurrency}
              label="Валюта бюджета"
            />
          </div>

          {/* ── Budget (optional) ── */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>
                Бюджет за кг, {cur.symbol} ({cur.code})
              </label>
              <span style={{
                fontSize: 9, fontWeight: 700, color: '#a78bfa',
                background: '#a78bfa10', border: '1px solid #a78bfa20',
                padding: '2px 8px', borderRadius: 99,
              }}>
                необязательно
              </span>
            </div>
            <div style={{ position: 'relative' }}>
              {/* Currency symbol prefix */}
              <div style={{
                position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                display: 'flex', alignItems: 'center', gap: 4,
                pointerEvents: 'none', zIndex: 1,
              }}>
                <DollarSign style={{ width: 13, height: 13, color: cur.color }} />
              </div>
              <input
                type="number" value={budget} min="0" step="0.5"
                onChange={e => setBudget(e.target.value)}
                placeholder="Максимальная цена за кг"
                style={{
                  ...inputStyle,
                  paddingLeft: 30,
                  border: '1.5px solid #a78bfa20',
                }}
              />
            </div>
            <p style={{ fontSize: 10, color: '#4a6080', marginTop: 6 }}>
              Укажите ваш максимальный бюджет за 1 кг — курьеры увидят и смогут предложить подходящую цену
            </p>

            {/* Budget preview badge */}
            {budget && Number(budget) > 0 && weightKg && Number(weightKg) > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  marginTop: 10, padding: '10px 14px', borderRadius: 12,
                  background: `${cur.color}08`, border: `1px solid ${cur.color}20`,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}
              >
                <span style={{ fontSize: 11, color: '#4a6080', fontWeight: 500 }}>
                  Примерный бюджет за доставку:
                </span>
                <span style={{ fontSize: 14, fontWeight: 800, color: cur.color }}>
                  {cur.symbol} {(Number(budget) * Number(weightKg)).toFixed(2)}
                </span>
              </motion.div>
            )}
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  marginBottom: 14, padding: '10px 14px', borderRadius: 12,
                  background: '#ef444410', border: '1px solid #ef444430',
                }}
              >
                <AlertCircle style={{ width: 14, height: 14, color: '#f87171', flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: '#f87171' }}>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSubmit}
            disabled={loading || !isValid}
            style={{
              width: '100%', padding: '16px 24px',
              borderRadius: 16, border: 'none',
              background: loading || !isValid
                ? '#ffffff10'
                : 'linear-gradient(135deg, #6d28d9, #a78bfa)',
              color: loading || !isValid ? '#4a6080' : '#fff',
              fontSize: 15, fontWeight: 700,
              cursor: loading ? 'wait' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: !loading && isValid ? '0 8px 24px #a78bfa30' : 'none',
              transition: 'background 0.2s',
            }}
          >
            {loading ? (
              <>
                <Loader2 style={{ width: 18, height: 18, animation: 'avia-spin 1s linear infinite' }} />
                Публикация...
              </>
            ) : (
              <>
                <Package style={{ width: 16, height: 16 }} />
                Опубликовать заявку · {cur.flag} {cur.code}
              </>
            )}
          </motion.button>

          <style>{`@keyframes avia-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
