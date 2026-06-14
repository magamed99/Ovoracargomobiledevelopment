import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  Truck, Package, MessageSquare, Star, Crown, ArrowRight, X, ChevronRight,
} from 'lucide-react';

const ONBOARD_KEY = 'ovora_onboarded_v1';

function hasOnboarded(): boolean {
  try { return localStorage.getItem(ONBOARD_KEY) === 'true'; } catch { return true; }
}
function markOnboarded(): void {
  try { localStorage.setItem(ONBOARD_KEY, 'true'); } catch {}
}

interface Step {
  icon: React.ElementType;
  color: string;
  title: string;
  body: string;
  cta?: string;
  ctaPath?: string;
}

const DRIVER_STEPS: Step[] = [
  {
    icon: Truck,
    color: '#38bdf8',
    title: 'Добро пожаловать!',
    body: 'Ovora Cargo — платформа для грузоперевозок без комиссий. Вы публикуете рейсы, отправители находят вас и договариваются напрямую.',
  },
  {
    icon: Package,
    color: '#4ade80',
    title: 'Публикуйте рейсы',
    body: 'Укажите маршрут, дату, свободный тоннаж — и получайте заявки от отправителей. Никаких посредников.',
    cta: 'Создать рейс',
    ctaPath: '/create-trip',
  },
  {
    icon: MessageSquare,
    color: '#a78bfa',
    title: 'Общайтесь напрямую',
    body: 'Встроенный чат позволяет договариваться об условиях, деталях маршрута и оплате без звонков.',
  },
  {
    icon: Star,
    color: '#fbbf24',
    title: 'Стройте репутацию',
    body: 'После каждой поездки отправители оставляют отзывы. Высокий рейтинг = больше заказов.',
  },
  {
    icon: Crown,
    color: '#c084fc',
    title: '30 дней бесплатно',
    body: 'Пробный период уже активен. После него — 9 сомони/год. Это меньше чашки чая.',
    cta: 'Посмотреть тарифы',
    ctaPath: '/subscription',
  },
];

const SENDER_STEPS: Step[] = [
  {
    icon: Package,
    color: '#38bdf8',
    title: 'Добро пожаловать!',
    body: 'Ovora Cargo — найдите водителя для вашего груза за минуты. Никаких комиссий — платите напрямую водителю.',
  },
  {
    icon: Truck,
    color: '#4ade80',
    title: 'Ищите рейсы',
    body: 'Тысячи рейсов по маршрутам Таджикистан–Россия–Казахстан. Фильтруйте по дате, направлению, типу груза.',
    cta: 'Найти рейс',
    ctaPath: '/trips',
  },
  {
    icon: MessageSquare,
    color: '#a78bfa',
    title: 'Договоритесь напрямую',
    body: 'Нашли подходящий рейс? Напишите водителю в чат и согласуйте все детали.',
  },
  {
    icon: Star,
    color: '#fbbf24',
    title: 'Оцените водителя',
    body: 'После доставки оставьте отзыв. Это помогает другим отправителям выбрать надёжного перевозчика.',
  },
  {
    icon: Crown,
    color: '#c084fc',
    title: '30 дней бесплатно',
    body: 'Пробный период уже активен. После него — 9 сомони/год. Это стоимость чашки чая.',
    cta: 'Посмотреть тарифы',
    ctaPath: '/subscription',
  },
];

interface Props {
  role: 'driver' | 'sender';
}

export function OnboardingOverlay({ role }: Props) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  const steps = role === 'driver' ? DRIVER_STEPS : SENDER_STEPS;
  const current = steps[step];
  const isLast = step === steps.length - 1;

  useEffect(() => {
    if (!hasOnboarded()) {
      // небольшая задержка чтобы дашборд успел загрузиться
      const t = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(t);
    }
  }, []);

  function close() {
    markOnboarded();
    setVisible(false);
  }

  function next() {
    if (isLast) { close(); return; }
    setStep(s => s + 1);
  }

  function goToCta() {
    close();
    if (current.ctaPath) navigate(current.ctaPath);
  }

  if (!visible) return null;

  const Icon = current.icon;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(4, 10, 20, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
          }}
        >
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.96 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            style={{
              width: '100%', maxWidth: 400,
              background: 'linear-gradient(160deg, #0d1b2e 0%, #091526 100%)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 20,
              padding: 32,
              boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
              position: 'relative',
            }}
          >
            {/* Закрыть */}
            <button
              onClick={close}
              style={{
                position: 'absolute', top: 16, right: 16,
                background: 'rgba(255,255,255,0.06)', border: 'none',
                borderRadius: 8, cursor: 'pointer', padding: 6, color: '#475569',
                display: 'flex', alignItems: 'center',
              }}
            >
              <X size={16} />
            </button>

            {/* Иконка */}
            <div style={{
              width: 64, height: 64, borderRadius: 18, marginBottom: 24,
              background: `${current.color}18`,
              border: `1px solid ${current.color}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon size={28} color={current.color} />
            </div>

            {/* Заголовок */}
            <div style={{ fontSize: 22, fontWeight: 900, color: '#e8f4ff', marginBottom: 12, letterSpacing: '-0.4px' }}>
              {current.title}
            </div>

            {/* Текст */}
            <div style={{ fontSize: 14.5, color: '#7a9cb8', lineHeight: 1.6, marginBottom: 28 }}>
              {current.body}
            </div>

            {/* Кнопки */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {current.cta && (
                <button
                  onClick={goToCta}
                  style={{
                    width: '100%', padding: '13px 20px',
                    background: `linear-gradient(135deg, ${current.color}cc, ${current.color})`,
                    border: 'none', borderRadius: 12, cursor: 'pointer',
                    fontSize: 14, fontWeight: 700, color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    boxShadow: `0 4px 20px ${current.color}40`,
                  }}
                >
                  {current.cta} <ArrowRight size={15} />
                </button>
              )}
              <button
                onClick={next}
                style={{
                  width: '100%', padding: '12px 20px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 12, cursor: 'pointer',
                  fontSize: 14, fontWeight: 600, color: '#94a3b8',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                {isLast ? 'Начать работу' : 'Далее'}
                {!isLast && <ChevronRight size={15} />}
              </button>
            </div>

            {/* Прогресс */}
            <div style={{ display: 'flex', gap: 6, marginTop: 24, justifyContent: 'center' }}>
              {steps.map((_, i) => (
                <div
                  key={i}
                  style={{
                    height: 4, borderRadius: 2, cursor: 'pointer',
                    width: i === step ? 24 : 8,
                    background: i === step ? current.color : 'rgba(255,255,255,0.1)',
                    transition: 'all 0.3s ease',
                  }}
                  onClick={() => setStep(i)}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
