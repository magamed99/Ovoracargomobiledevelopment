import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Plane, Package, ArrowRight, Scale,
  DollarSign, MessageSquare, Loader2, CheckCircle2, AlertCircle,
  FileText,
} from 'lucide-react';
import { createAviaDeal } from '../../api/aviaDealApi';
import type { AviaDeal } from '../../api/aviaDealApi';
import type { AviaFlight, AviaRequest } from '../../api/aviaApi';
import type { AviaUser } from '../../api/aviaApi';
import { initAviaChat, sendTypedChatMessage, makeAviaChatId } from '../../api/aviaChatApi';
import type { AviaChatAdRef } from '../../api/aviaChatApi';

interface AviaDealOfferModalProps {
  /** Текущий пользователь */
  me: AviaUser;
  /** Если предложение на рейс (Отправитель → Курьеру) */
  flight?: AviaFlight;
  /** Если предложение на заявку (Курьер → Отправителю) */
  request?: AviaRequest;
  onClose: () => void;
  onSuccess?: (deal: AviaDeal) => void;
  /** Открыть чат после отправки предложения */
  onOpenChat?: (chatId: string, otherPhone: string, adRef: AviaChatAdRef) => void;
}

export function AviaDealOfferModal({ me, flight, request, onClose, onSuccess, onOpenChat }: AviaDealOfferModalProps) {
  // Определяем доступные типы на основе настроек рейса курьера
  const isCargoAvail = flight ? (flight.cargoEnabled ?? true) : true;
  const isDocsAvail  = flight ? (flight.docsEnabled ?? false) : false;

  // Начальный тип: если доступны оба — предлагаем cargo первым; если только docs — docs
  const initialType = isCargoAvail ? 'cargo' : 'docs';
  const [dealType, setDealType] = useState<'cargo' | 'docs'>(initialType);

  const [weightKg, setWeightKg] = useState(request?.weightKg ? String(request.weightKg) : '');
  const [price, setPrice] = useState(
    flight?.pricePerKg && dealType === 'cargo'
      ? String(Math.round(Number(weightKg || 1) * flight.pricePerKg))
      : '',
  );
  const [currency, setCurrency] = useState<string>(flight?.currency || request?.currency || 'USD');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  // Определяем, кто получатель
  const recipientPhone = flight ? flight.courierId : request!.senderId;
  const recipientName  = flight ? (flight.courierName || flight.courierId) : (request!.senderName || request!.senderId);
  const adType: 'flight' | 'request' = flight ? 'flight' : 'request';
  const adId    = flight ? flight.id   : request!.id;
  const adFrom  = flight ? flight.from : request!.from;
  const adTo    = flight ? flight.to   : request!.to;
  const adDate  = flight ? flight.date : request!.beforeDate;

  // Роли
  const courierId   = flight ? flight.courierId : me.phone;
  const senderId    = flight ? me.phone : request!.senderId;
  const courierName = flight ? (flight.courierName || '') : (`${me.firstName || ''} ${me.lastName || ''}`.trim() || me.phone);
  const senderName  = flight ? (`${me.firstName || ''} ${me.lastName || ''}`.trim() || me.phone) : (request!.senderName || '');
  const myName      = `${me.firstName || ''} ${me.lastName || ''}`.trim() || me.phone;

  // Доступный кг на рейсе
  const availKg = flight ? Math.max(0, (flight.freeKg || 0) - (flight.reservedKg || 0)) : null;

  const handleWeightChange = (v: string) => {
    setWeightKg(v);
    if (flight?.pricePerKg && v && dealType === 'cargo') {
      const kg = Number(v) || 0;
      setPrice(String(Math.round(kg * flight.pricePerKg)));
    }
  };

  const handleDealTypeChange = (t: 'cargo' | 'docs') => {
    setDealType(t);
    setError('');
    if (t === 'docs') {
      setWeightKg('');
      setPrice(flight?.docsPrice ? String(flight.docsPrice) : '');
    } else {
      setPrice(flight?.pricePerKg && weightKg ? String(Math.round(Number(weightKg) * flight.pricePerKg)) : '');
    }
  };

  const handleSubmit = async () => {
    if (dealType === 'cargo' && (!weightKg || Number(weightKg) <= 0)) {
      setError('Укажите вес в кг');
      return;
    }
    setLoading(true);
    setError('');

    const result = await createAviaDeal({
      initiatorPhone: me.phone,
      initiatorName: myName,
      recipientPhone,
      recipientName,
      adType,
      adId,
      adFrom,
      adTo,
      adDate,
      weightKg: dealType === 'cargo' ? Number(weightKg) : 0,
      price: price ? Number(price) : undefined,
      currency,
      message: message.trim(),
      courierId,
      senderId,
      courierName,
      senderName,
      dealType,
    });

    setLoading(false);
    if (!result.success) {
      setError(result.error || 'Ошибка отправки предложения');
      return;
    }
    setDone(true);
    const deal = result.deal!;
    if (onSuccess) onSuccess(deal);

    // ── Открываем чат и отправляем deal_offer-сообщение ──────────────────────
    try {
      const adRef: AviaChatAdRef = { type: adType, id: adId, from: adFrom, to: adTo };
      const { chatId } = await initAviaChat(me.phone, recipientPhone, adRef);
      await sendTypedChatMessage(chatId, me.phone, '', 'deal_offer', {
        dealId:         deal.id,
        dealType,
        weightKg:       dealType === 'cargo' ? Number(weightKg) : null,
        price:          price ? Number(price) : null,
        currency,
        adFrom,
        adTo,
        adDate,
        adType,
        message:        message.trim(),
        initiatorPhone: me.phone,
        recipientPhone,
      });
      setTimeout(() => {
        onClose();
        if (onOpenChat) onOpenChat(chatId, recipientPhone, adRef);
      }, 1200);
    } catch (chatErr) {
      console.warn('[AviaDealOfferModal] Chat init error (non-fatal):', chatErr);
      setTimeout(() => onClose(), 1800);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px',
    borderRadius: 12, border: '1.5px solid #ffffff10',
    background: '#ffffff08', color: '#fff',
    fontSize: 14, fontWeight: 500, outline: 'none',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 11, fontWeight: 700,
    color: '#6b8299', marginBottom: 6, letterSpacing: '0.04em', textTransform: 'uppercase',
  };

  const accentColor = flight ? '#0ea5e9' : '#a78bfa';
  const AdIcon = flight ? Plane : Package;

  const showTypeSelector = flight && isCargoAvail && isDocsAvail;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          fontFamily: "'Sora', 'Inter', sans-serif",
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%', maxWidth: 520,
            background: '#0a1628',
            borderRadius: '24px 24px 0 0',
            border: '1px solid #ffffff0c',
            borderBottom: 'none',
            padding: 'clamp(20px, 5vw, 28px)',
            paddingBottom: 'calc(clamp(20px, 5vw, 28px) + env(safe-area-inset-bottom, 16px))',
            maxHeight: '90dvh', overflowY: 'auto',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 12,
                background: `${accentColor}14`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <AdIcon style={{ width: 18, height: 18, color: accentColor }} />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>
                  Отправить предложение
                </div>
                <div style={{ fontSize: 11, color: '#4a6080', marginTop: 1 }}>
                  {flight ? 'на рейс курьера' : 'на заявку отправителя'}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                width: 32, height: 32, borderRadius: 9,
                border: '1px solid #ffffff12', background: '#ffffff08',
                color: '#6b8299', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <X style={{ width: 15, height: 15 }} />
            </button>
          </div>

          {/* Route Info */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '12px 14px', borderRadius: 12,
            background: `${accentColor}0a`, border: `1px solid ${accentColor}20`,
            marginBottom: 20,
          }}>
            <AdIcon style={{ width: 14, height: 14, color: accentColor, flexShrink: 0 }} />
            <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{adFrom}</span>
            <ArrowRight style={{ width: 12, height: 12, color: '#4a6080', flexShrink: 0 }} />
            <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{adTo}</span>
            {adDate && (
              <span style={{ fontSize: 11, color: '#4a6080', marginLeft: 'auto', fontWeight: 600 }}>
                {new Date(adDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
              </span>
            )}
          </div>

          {/* Recipient */}
          <div style={{
            padding: '10px 14px', borderRadius: 12,
            background: '#ffffff06', border: '1px solid #ffffff0a',
            marginBottom: showTypeSelector ? 16 : 20,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: 9,
              background: `${accentColor}14`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <AdIcon style={{ width: 12, height: 12, color: accentColor }} />
            </div>
            <div>
              <div style={{ fontSize: 10, color: '#4a6080', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {flight ? 'Курьер' : 'Отправитель'}
              </div>
              <div style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>
                {recipientName}
              </div>
            </div>
          </div>

          {/* Тип сделки — только если курьер включил оба */}
          {showTypeSelector && !done && (
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Тип отправления</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => handleDealTypeChange('cargo')}
                  style={{
                    flex: 1, padding: '10px 12px', borderRadius: 12,
                    border: `1.5px solid ${dealType === 'cargo' ? '#0ea5e940' : '#ffffff12'}`,
                    background: dealType === 'cargo' ? '#0ea5e910' : '#ffffff06',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    transition: 'border-color 0.2s, background 0.2s',
                  }}
                >
                  <Package style={{ width: 14, height: 14, color: dealType === 'cargo' ? '#0ea5e9' : '#4a6080' }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: dealType === 'cargo' ? '#0ea5e9' : '#4a6080' }}>
                    Груз
                  </span>
                </button>
                <button
                  onClick={() => handleDealTypeChange('docs')}
                  style={{
                    flex: 1, padding: '10px 12px', borderRadius: 12,
                    border: `1.5px solid ${dealType === 'docs' ? '#a78bfa40' : '#ffffff12'}`,
                    background: dealType === 'docs' ? '#a78bfa10' : '#ffffff06',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    transition: 'border-color 0.2s, background 0.2s',
                  }}
                >
                  <FileText style={{ width: 14, height: 14, color: dealType === 'docs' ? '#a78bfa' : '#4a6080' }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: dealType === 'docs' ? '#a78bfa' : '#4a6080' }}>
                    Документы
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Тип badge (если не selector, но тип определён) */}
          {!showTypeSelector && isDocsAvail && !done && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 12px', borderRadius: 10, marginBottom: 16,
              background: '#a78bfa10', border: '1px solid #a78bfa25',
            }}>
              <FileText style={{ width: 13, height: 13, color: '#a78bfa' }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#a78bfa' }}>Документы / конверты</span>
            </div>
          )}

          {/* Done state */}
          <AnimatePresence>
            {done && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
                  padding: '32px 20px', textAlign: 'center',
                }}
              >
                <div style={{
                  width: 56, height: 56, borderRadius: 18,
                  background: '#34d39914', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <CheckCircle2 style={{ width: 28, height: 28, color: '#34d399' }} />
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>Предложение отправлено!</div>
                <div style={{ fontSize: 12, color: '#4a6080', lineHeight: 1.5 }}>
                  {recipientName} получит уведомление и может принять или отклонить его
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          {!done && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Weight — только для cargo */}
              {dealType === 'cargo' && (
                <div>
                  <label style={labelStyle}>
                    <Scale style={{ width: 11, height: 11, display: 'inline', marginRight: 4 }} />
                    Вес груза (кг) *
                  </label>
                  <input
                    type="number"
                    min={0.1}
                    step={0.1}
                    value={weightKg}
                    onChange={e => handleWeightChange(e.target.value)}
                    placeholder="Например: 5"
                    style={inputStyle}
                  />
                  {availKg !== null && (
                    <p style={{ fontSize: 10, color: '#3d5268', marginTop: 4 }}>
                      Доступно на рейсе: <span style={{ color: availKg > 0 ? '#34d399' : '#f87171', fontWeight: 700 }}>{availKg} кг</span>
                      {(flight?.reservedKg || 0) > 0 && (
                        <span style={{ color: '#f59e0b' }}> · {flight!.reservedKg} кг ожидает</span>
                      )}
                    </p>
                  )}
                </div>
              )}

              {/* Docs note */}
              {dealType === 'docs' && (
                <div style={{
                  padding: '10px 14px', borderRadius: 12,
                  background: '#a78bfa08', border: '1px solid #a78bfa18',
                }}>
                  <p style={{ fontSize: 12, color: '#a78bfa', margin: 0, lineHeight: 1.5 }}>
                    📄 Вы отправляете документы/конверты. Курьер принимает без ограничений по количеству.
                  </p>
                </div>
              )}

              {/* Price */}
              <div>
                <label style={labelStyle}>
                  <DollarSign style={{ width: 11, height: 11, display: 'inline', marginRight: 4 }} />
                  Предлагаемая цена
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="number"
                    min={0}
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    placeholder="Необязательно"
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <select
                    value={currency}
                    onChange={e => setCurrency(e.target.value)}
                    style={{
                      padding: '12px 10px', borderRadius: 12,
                      border: '1.5px solid #ffffff10', background: '#0a1525',
                      color: '#fff', fontSize: 13, fontWeight: 600,
                      outline: 'none', cursor: 'pointer',
                    }}
                  >
                    <option value="USD">🇺🇸 USD</option>
                    <option value="EUR">🇪🇺 EUR</option>
                    <option value="RUB">🇷🇺 RUB</option>
                    <option value="AED">🇦🇪 AED</option>
                    <option value="TJS">🇹🇯 TJS</option>
                    <option value="KZT">🇰🇿 KZT</option>
                    <option value="UZS">🇺🇿 UZS</option>
                    <option value="CNY">🇨🇳 CNY</option>
                  </select>
                </div>
                {flight?.pricePerKg && weightKg && dealType === 'cargo' && (
                  <p style={{ fontSize: 10, color: '#34d399', marginTop: 4, fontWeight: 600 }}>
                    Расчёт: {weightKg} кг × {flight.currency ?? 'USD'} {flight.pricePerKg}/кг = {flight.currency ?? 'USD'} {Math.round(Number(weightKg) * flight.pricePerKg)}
                  </p>
                )}
                {dealType === 'docs' && flight?.docsPrice && (
                  <p style={{ fontSize: 10, color: '#a78bfa', marginTop: 4, fontWeight: 600 }}>
                    Цена курьера за пакет: {flight.currency ?? 'USD'} {flight.docsPrice}
                  </p>
                )}
              </div>

              {/* Message */}
              <div>
                <label style={labelStyle}>
                  <MessageSquare style={{ width: 11, height: 11, display: 'inline', marginRight: 4 }} />
                  Сообщение
                </label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Дополнительные условия, вопросы..."
                  rows={3}
                  maxLength={300}
                  style={{ ...inputStyle, resize: 'none', lineHeight: 1.5 }}
                />
                <p style={{ fontSize: 10, color: '#3d5268', marginTop: 2, textAlign: 'right' }}>
                  {message.length}/300
                </p>
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '10px 14px', borderRadius: 12,
                      background: '#ef444410', border: '1px solid #ef444430',
                    }}
                  >
                    <AlertCircle style={{ width: 15, height: 15, color: '#f87171', flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: '#f87171' }}>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSubmit}
                disabled={loading}
                style={{
                  width: '100%', padding: '15px 24px',
                  borderRadius: 14, border: 'none',
                  background: loading
                    ? '#ffffff10'
                    : dealType === 'docs'
                      ? 'linear-gradient(135deg, #7c3aed, #a78bfa)'
                      : `linear-gradient(135deg, ${accentColor}cc, ${accentColor})`,
                  color: '#fff', fontSize: 15, fontWeight: 700,
                  cursor: loading ? 'wait' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: loading ? 'none' : `0 8px 24px ${dealType === 'docs' ? '#a78bfa33' : accentColor + '33'}`,
                  transition: 'background 0.2s',
                }}
              >
                {loading ? (
                  <>
                    <Loader2 style={{ width: 17, height: 17, animation: 'spin 1s linear infinite' }} />
                    Отправка...
                  </>
                ) : (
                  <>
                    <CheckCircle2 style={{ width: 17, height: 17 }} />
                    Отправить предложение
                  </>
                )}
              </motion.button>
            </div>
          )}
        </motion.div>
      </motion.div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </AnimatePresence>
  );
}