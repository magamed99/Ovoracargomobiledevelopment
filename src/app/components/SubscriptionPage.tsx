import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../contexts/UserContext';
import { toast } from 'sonner';
import {
  ArrowLeft, Shield, CheckCircle2, Clock, Infinity,
  AlertCircle, ChevronDown, ChevronUp, Copy, Send,
  Users, DollarSign, TrendingDown, Server,
} from 'lucide-react';
import {
  PLATFORM_COSTS, getSubscription, submitPaymentRequest,
  getCachedSubscription, cacheSubscription,
  isSubActive, getDaysLeft, getStatusLabel,
  type Subscription, type SubStatus,
} from '../api/subscriptionApi';

// ── Реквизиты для перевода ────────────────────────────────────────────────────
const PAYMENT_DETAILS = {
  TJS: {
    label: 'Сомони (Таджикистан)',
    flag: '🇹🇯',
    amount: PLATFORM_COSTS.prices.TJS,
    currency: 'сомони',
    bank: 'Алиф Банк',
    card: '5614 6800 0000 0000',
    recipient: 'Ovora Cargo Platform',
    note: 'Годовая подписка Ovora + ваш email',
  },
  RUB: {
    label: 'Рубли (Россия)',
    flag: '🇷🇺',
    amount: PLATFORM_COSTS.prices.RUB,
    currency: 'руб.',
    bank: 'Тинькофф / СБП',
    card: '+7 (900) 000-00-00',
    recipient: 'Ovora Cargo',
    note: 'Подписка Ovora + ваш email',
  },
  KZT: {
    label: 'Тенге (Казахстан)',
    flag: '🇰🇿',
    amount: PLATFORM_COSTS.prices.KZT,
    currency: '₸',
    bank: 'Kaspi Bank',
    card: '+7 (700) 000-00-00',
    recipient: 'Ovora Cargo',
    note: 'Подписка Ovora + ваш email',
  },
};

type Currency = keyof typeof PAYMENT_DETAILS;

const STATUS_CONFIG: Record<SubStatus, { color: string; icon: typeof Shield; bg: string }> = {
  trial:    { color: '#f59e0b', icon: Clock,        bg: 'rgba(245,158,11,0.1)' },
  active:   { color: '#22c55e', icon: CheckCircle2, bg: 'rgba(34,197,94,0.1)' },
  expired:  { color: '#ef4444', icon: AlertCircle,  bg: 'rgba(239,68,68,0.1)' },
  lifetime: { color: '#a78bfa', icon: Infinity,     bg: 'rgba(167,139,250,0.1)' },
};

export function SubscriptionPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { user } = useUser();
  const dark = theme === 'dark';

  const [sub, setSub]                   = useState<Subscription | null>(null);
  const [loading, setLoading]           = useState(true);
  const [currency, setCurrency]         = useState<Currency>('TJS');
  const [showDetails, setShowDetails]   = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [txId, setTxId]                 = useState('');
  const [submitting, setSubmitting]     = useState(false);
  const [submitted, setSubmitted]       = useState(false);

  const bg   = dark ? '#0e1621' : '#f5f7fa';
  const card = dark ? '#131f2e' : '#ffffff';
  const border = dark ? '#1e2d3d' : '#e8edf2';
  const muted  = dark ? '#4a6a8a' : '#94a3b8';
  const text   = dark ? '#e7f0f8' : '#0f172a';

  // ── Загрузка подписки ─────────────────────────────────────────────────────
  useEffect(() => {
    const cached = getCachedSubscription();
    if (cached) { setSub(cached); setLoading(false); }

    if (user?.email) {
      getSubscription(user.email).then(s => {
        setSub(s);
        if (s) cacheSubscription(s);
        setLoading(false);
      }).catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user?.email]);

  const active    = isSubActive(sub);
  const daysLeft  = getDaysLeft(sub);
  const details   = PAYMENT_DETAILS[currency];
  const statusCfg = sub ? STATUS_CONFIG[sub.status] : STATUS_CONFIG.trial;
  const StatusIcon = statusCfg.icon;

  // ── Копировать в буфер ────────────────────────────────────────────────────
  const copy = (val: string, label: string) => {
    navigator.clipboard.writeText(val).then(() => toast.success(`${label} скопирован`));
  };

  // ── Отправить заявку ──────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!user?.email) { toast.error('Войдите в аккаунт'); return; }
    if (!txId.trim()) { toast.error('Введите ID/номер транзакции'); return; }
    setSubmitting(true);
    try {
      await submitPaymentRequest(user.email, txId.trim(), currency, details.amount);
      setSubmitted(true);
      toast.success('Заявка отправлена! Администратор активирует подписку в течение 24 часов.');
    } catch (err: any) {
      toast.error(err.message || 'Ошибка отправки');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Расчёт цены за пользователя ──────────────────────────────────────────
  const costPerUserUsd = PLATFORM_COSTS.annualCostUsd / PLATFORM_COSTS.payingUsers;
  const coveragePercent = Math.round(
    (details.amount / (costPerUserUsd * (currency === 'TJS' ? 11 : currency === 'RUB' ? 90 : 450))) * 100
  );

  return (
    <div
      className="min-h-screen overflow-y-auto font-['Sora']"
      style={{ background: bg, color: text }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 backdrop-blur-md border-b"
        style={{ background: `${bg}f0`, borderColor: border }}
      >
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl border flex items-center justify-center"
          style={{ borderColor: border, background: card }}
        >
          <ArrowLeft className="w-4 h-4" style={{ color: muted }} />
        </button>
        <div className="flex-1">
          <div className="font-bold text-[15px]">Подписка Ovora</div>
          <div className="text-[11px]" style={{ color: muted }}>Годовой доступ к платформе</div>
        </div>
        <Shield className="w-5 h-5" style={{ color: '#1978e5' }} />
      </header>

      <div className="max-w-lg mx-auto px-4 pb-10 space-y-4 pt-4">

        {/* ── Статус подписки ── */}
        {!loading && (
          <div
            className="rounded-2xl border p-4"
            style={{ background: sub ? statusCfg.bg : 'rgba(25,120,229,0.08)', borderColor: sub ? statusCfg.color + '40' : '#1978e530' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: sub ? statusCfg.bg : 'rgba(25,120,229,0.15)' }}
              >
                <StatusIcon className="w-5 h-5" style={{ color: sub ? statusCfg.color : '#1978e5' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-[14px]">
                  {sub ? getStatusLabel(sub.status) : 'Загрузка...'}
                </div>
                {sub?.status === 'trial' && (
                  <div className="text-[12px]" style={{ color: '#f59e0b' }}>
                    {daysLeft > 0 ? `Осталось ${daysLeft} дней бесплатного использования` : 'Пробный период истёк'}
                  </div>
                )}
                {sub?.status === 'active' && (
                  <div className="text-[12px]" style={{ color: '#22c55e' }}>
                    {daysLeft > 0 ? `Действует ещё ${daysLeft} дней` : 'Активна'}
                  </div>
                )}
                {sub?.status === 'expired' && (
                  <div className="text-[12px]" style={{ color: '#ef4444' }}>
                    Продлите подписку для продолжения работы
                  </div>
                )}
                {sub?.status === 'lifetime' && (
                  <div className="text-[12px]" style={{ color: '#a78bfa' }}>
                    Пожизненный доступ — спасибо за поддержку!
                  </div>
                )}
              </div>
              {active && (
                <span
                  className="text-[11px] font-bold px-3 py-1 rounded-full"
                  style={{ background: statusCfg.bg, color: statusCfg.color, border: `1px solid ${statusCfg.color}40` }}
                >
                  Активна
                </span>
              )}
            </div>
          </div>
        )}

        {/* ── Суть модели (прозрачность) ── */}
        <div className="rounded-2xl border overflow-hidden" style={{ background: card, borderColor: border }}>
          <div
            className="px-4 py-3 border-b flex items-center gap-2"
            style={{ borderColor: border }}
          >
            <TrendingDown className="w-4 h-4" style={{ color: '#1978e5' }} />
            <span className="font-bold text-[13px]">Как формируется цена</span>
          </div>

          {/* Формула */}
          <div className="px-4 py-4">
            <div
              className="rounded-xl p-4 text-center mb-4"
              style={{ background: dark ? '#0a1828' : '#f0f6ff', border: `1px solid #1978e530` }}
            >
              <div className="text-[11px] font-semibold mb-1" style={{ color: muted }}>ФОРМУЛА ЦЕНЫ</div>
              <div className="font-bold text-[15px]" style={{ color: text }}>
                Расходы платформы при 5М users
              </div>
              <div className="text-[22px] font-black my-1" style={{ color: '#1978e5' }}>÷</div>
              <div className="font-bold text-[15px]" style={{ color: text }}>
                1 000 000 платящих пользователей
              </div>
              <div className="text-[22px] font-black my-1" style={{ color: '#1978e5' }}>=</div>
              <div className="font-bold text-[18px]" style={{ color: '#22c55e' }}>
                ${costPerUserUsd.toFixed(3)} / год / пользователь
              </div>
            </div>

            {/* Метрики */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Server,      label: 'Расходы/год', value: `$${(PLATFORM_COSTS.annualCostUsd / 1000).toFixed(0)}K` },
                { icon: Users,       label: 'Плательщики', value: '1 000 000' },
                { icon: DollarSign,  label: 'Ваш вклад',   value: `${details.amount} ${details.currency}` },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="rounded-xl p-3 text-center" style={{ background: dark ? '#0a1828' : '#f8fafc', border: `1px solid ${border}` }}>
                  <Icon className="w-4 h-4 mx-auto mb-1" style={{ color: '#1978e5' }} />
                  <div className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: muted }}>{label}</div>
                  <div className="font-bold text-[12px] mt-0.5" style={{ color: text }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Разбивка расходов */}
          <div className="px-4 pb-4">
            <button
              onClick={() => setShowBreakdown(v => !v)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[12px] font-semibold"
              style={{ background: dark ? '#0a1828' : '#f0f6ff', color: '#1978e5' }}
            >
              <span>Разбивка расходов платформы</span>
              {showBreakdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showBreakdown && (
              <div className="mt-2 space-y-2">
                {PLATFORM_COSTS.breakdown.map(item => (
                  <div key={item.name} className="flex items-center justify-between text-[12px] px-1">
                    <span style={{ color: muted }} className="flex-1 pr-4">{item.name}</span>
                    <span className="font-bold" style={{ color: text }}>${item.usd.toLocaleString()}/год</span>
                  </div>
                ))}
                <div className="flex items-center justify-between text-[13px] px-1 pt-2 border-t" style={{ borderColor: border }}>
                  <span className="font-bold">Итого</span>
                  <span className="font-black" style={{ color: '#1978e5' }}>
                    ${PLATFORM_COSTS.annualCostUsd.toLocaleString()}/год
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Что включено ── */}
        <div className="rounded-2xl border overflow-hidden" style={{ background: card, borderColor: border }}>
          <div className="px-4 py-3 border-b" style={{ borderColor: border }}>
            <span className="font-bold text-[13px]">Что включено в подписку</span>
          </div>
          <div className="px-4 py-3 space-y-2.5">
            {[
              'Публикация рейсов и грузов — без лимитов',
              'Чат с водителями и отправителями',
              'Отслеживание грузов в реальном времени',
              'Уведомления о новых заявках',
              'Доступ к картам маршрутов',
              'Верификация документов',
              'Радио и информация для водителей',
              'Авиа-модуль (курьеры на борту)',
              'Будущие функции без доплаты',
            ].map(feature => (
              <div key={feature} className="flex items-center gap-2.5 text-[13px]">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: '#22c55e' }} />
                <span style={{ color: text }}>{feature}</span>
              </div>
            ))}
            <div className="flex items-center gap-2.5 text-[13px] opacity-50">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: muted }} />
              <span style={{ color: muted }}>Транзакции между вами и партнёром — вне платформы (без комиссии)</span>
            </div>
          </div>
        </div>

        {/* ── Оплата ── */}
        {!active && !submitted && (
          <div className="rounded-2xl border overflow-hidden" style={{ background: card, borderColor: border }}>
            <div className="px-4 py-3 border-b" style={{ borderColor: border }}>
              <span className="font-bold text-[13px]">Оплатить подписку</span>
            </div>

            {/* Выбор валюты */}
            <div className="px-4 pt-4">
              <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: muted }}>Выберите валюту</div>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(PAYMENT_DETAILS) as Currency[]).map(c => (
                  <button
                    key={c}
                    onClick={() => setCurrency(c)}
                    className="py-2.5 rounded-xl border text-center transition-all"
                    style={{
                      background: currency === c ? 'rgba(25,120,229,0.12)' : 'transparent',
                      borderColor: currency === c ? '#1978e5' : border,
                    }}
                  >
                    <div className="text-[16px]">{PAYMENT_DETAILS[c].flag}</div>
                    <div className="text-[11px] font-bold mt-0.5" style={{ color: currency === c ? '#1978e5' : text }}>
                      {PAYMENT_DETAILS[c].amount} {PAYMENT_DETAILS[c].currency}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Сумма */}
            <div className="px-4 pt-4 pb-2">
              <div
                className="rounded-xl p-4 text-center"
                style={{ background: 'rgba(25,120,229,0.08)', border: '1px solid rgba(25,120,229,0.2)' }}
              >
                <div className="text-[11px]" style={{ color: muted }}>К оплате</div>
                <div className="font-black text-[32px]" style={{ color: '#1978e5' }}>
                  {details.amount}
                  <span className="text-[16px] ml-1">{details.currency}</span>
                </div>
                <div className="text-[11px] mt-1" style={{ color: muted }}>за 1 год доступа</div>
              </div>
            </div>

            {/* Реквизиты */}
            <div className="px-4 pb-2">
              <button
                onClick={() => setShowDetails(v => !v)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-semibold"
                style={{ background: dark ? '#0a1828' : '#f0f6ff', color: '#1978e5' }}
              >
                <span>Реквизиты для перевода ({details.bank})</span>
                {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showDetails && (
                <div className="mt-2 rounded-xl border p-4 space-y-3" style={{ borderColor: border }}>
                  {[
                    { label: 'Банк', value: details.bank },
                    { label: 'Номер / телефон', value: details.card },
                    { label: 'Получатель', value: details.recipient },
                    { label: 'Сумма', value: `${details.amount} ${details.currency}` },
                    { label: 'Назначение', value: details.note },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-[10px] font-semibold uppercase" style={{ color: muted }}>{label}</div>
                        <div className="font-semibold text-[13px] mt-0.5" style={{ color: text }}>{value}</div>
                      </div>
                      <button
                        onClick={() => copy(value, label)}
                        className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: dark ? '#1e2d3d' : '#f0f4f8' }}
                      >
                        <Copy className="w-3.5 h-3.5" style={{ color: muted }} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Подтверждение платежа */}
            <div className="px-4 pb-4 space-y-3">
              <div className="text-[11px] font-semibold" style={{ color: muted }}>
                После оплаты введите номер транзакции (ID чека/перевода):
              </div>
              <input
                type="text"
                value={txId}
                onChange={e => setTxId(e.target.value)}
                placeholder="Например: 20240115123456"
                className="w-full rounded-xl px-4 py-3 text-[13px] font-semibold border outline-none"
                style={{
                  background: dark ? '#0a1828' : '#f8fafc',
                  borderColor: border,
                  color: text,
                }}
              />
              <button
                onClick={handleSubmit}
                disabled={submitting || !txId.trim()}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-[14px] transition-all"
                style={{
                  background: txId.trim() ? '#1978e5' : (dark ? '#1e2d3d' : '#e8edf2'),
                  color: txId.trim() ? '#fff' : muted,
                  cursor: txId.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                <Send className="w-4 h-4" />
                {submitting ? 'Отправка...' : 'Подтвердить оплату'}
              </button>
              <div className="text-[11px] text-center" style={{ color: muted }}>
                Администратор активирует подписку в течение 24 часов
              </div>
            </div>
          </div>
        )}

        {/* ── Успешная отправка ── */}
        {submitted && (
          <div
            className="rounded-2xl border p-6 text-center"
            style={{ background: 'rgba(34,197,94,0.08)', borderColor: '#22c55e40' }}
          >
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3" style={{ color: '#22c55e' }} />
            <div className="font-bold text-[16px] mb-2">Заявка отправлена!</div>
            <div className="text-[13px]" style={{ color: muted }}>
              Ваш ID транзакции <strong style={{ color: text }}>«{txId}»</strong> получен.{'\n'}
              Администратор проверит платёж и активирует подписку в течение 24 часов.
            </div>
          </div>
        )}

        {/* ── Уже активна ── */}
        {active && sub?.status !== 'trial' && (
          <div
            className="rounded-2xl border p-5 text-center"
            style={{ background: 'rgba(34,197,94,0.08)', borderColor: '#22c55e40' }}
          >
            <CheckCircle2 className="w-10 h-10 mx-auto mb-3" style={{ color: '#22c55e' }} />
            <div className="font-bold text-[15px] mb-1">Подписка активна</div>
            <div className="text-[13px]" style={{ color: muted }}>
              {sub?.status === 'lifetime'
                ? 'У вас пожизненный доступ к платформе.'
                : `Истекает через ${daysLeft} дней`}
            </div>
          </div>
        )}

        {/* ── FAQ ── */}
        <div className="rounded-2xl border overflow-hidden" style={{ background: card, borderColor: border }}>
          <div className="px-4 py-3 border-b" style={{ borderColor: border }}>
            <span className="font-bold text-[13px]">Частые вопросы</span>
          </div>
          <div className="divide-y" style={{ borderColor: border }}>
            {[
              {
                q: 'Почему не бесплатно?',
                a: 'Серверы, базы данных и карты стоят денег. Вместо показа рекламы или взятия комиссии с ваших сделок — мы просим минимальный взнос для покрытия расходов.',
              },
              {
                q: 'Почему такая дешёвая цена?',
                a: `Цена рассчитана честно: $${PLATFORM_COSTS.annualCostUsd.toLocaleString()} расходов платформы ÷ ${PLATFORM_COSTS.payingUsers.toLocaleString()} пользователей = меньше $1 в год. Мы не зарабатываем, только окупаем расходы.`,
              },
              {
                q: 'Берёт ли платформа комиссию с грузоперевозок?',
                a: 'Нет. Деньги за перевозку вы передаёте водителю напрямую, платформа в этом не участвует. Мы только предоставляем площадку для встречи.',
              },
              {
                q: 'Что если мало пользователей — цена вырастет?',
                a: 'Да, при меньшем числе плательщиков цена немного выше. Но даже при 10,000 пользователях это всего ~6-7 сомони в год.',
              },
              {
                q: 'Когда активируется подписка?',
                a: 'После перевода введите ID транзакции в форме выше. Администратор проверит и активирует подписку в течение 24 часов.',
              },
            ].map(({ q, a }) => (
              <div key={q} className="px-4 py-3">
                <div className="font-semibold text-[13px] mb-1" style={{ color: text }}>{q}</div>
                <div className="text-[12px]" style={{ color: muted }}>{a}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
