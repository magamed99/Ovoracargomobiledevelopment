import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router';
import {
  Search, Truck, MessageSquare, Star, ShieldCheck, MapPin,
  Plus, ChevronRight, X,
} from 'lucide-react';

const ONBOARDING_KEY = 'ovora_onboarding_done';

/** Был ли онбординг уже показан этому браузеру */
export function isOnboardingDone(): boolean {
  try { return localStorage.getItem(ONBOARDING_KEY) === '1'; }
  catch { return true; } // если localStorage недоступен — не навязываем
}

function markDone() {
  try { localStorage.setItem(ONBOARDING_KEY, '1'); } catch { /* ignore */ }
}

interface Step {
  icon: any;
  title: string;
  text: string;
  color: string;
  cta?: { label: string; href: string };
}

const DRIVER_STEPS: Step[] = [
  { icon: Truck, title: 'Добро пожаловать в Ovora Cargo', text: 'Платформа, где водители публикуют поездки, а отправители находят, чем доставить груз.', color: '#1d4ed8' },
  { icon: Plus, title: 'Создавайте поездки', text: 'Укажите маршрут, дату и цену — отправители увидят ваше объявление и пришлют заявки.', color: '#10b981', cta: { label: 'Создать поездку', href: '/create' } },
  { icon: MessageSquare, title: 'Общайтесь в чате', text: 'Обсуждайте детали груза и цену прямо в приложении — без передачи личного номера.', color: '#8b5cf6' },
  { icon: ShieldCheck, title: 'Пройдите верификацию', text: 'Загрузите документы — верифицированным водителям больше доверяют и чаще выбирают.', color: '#f59e0b', cta: { label: 'В профиль', href: '/profile' } },
  { icon: Star, title: 'Растите рейтинг', text: 'Выполняйте заказы и получайте отзывы — высокий рейтинг приносит больше клиентов.', color: '#ec4899' },
];

const SENDER_STEPS: Step[] = [
  { icon: Truck, title: 'Добро пожаловать в Ovora Cargo', text: 'Платформа, где вы находите водителя для отправки груза или поездки.', color: '#1d4ed8' },
  { icon: Search, title: 'Находите поездки', text: 'Укажите маршрут — увидите доступные поездки водителей с ценами и датами.', color: '#10b981', cta: { label: 'Найти поездку', href: '/search' } },
  { icon: MessageSquare, title: 'Договаривайтесь в чате', text: 'Отправьте заявку и обсудите детали с водителем прямо в приложении.', color: '#8b5cf6' },
  { icon: MapPin, title: 'Отслеживайте груз', text: 'Следите за поездкой в реальном времени — от загрузки до доставки.', color: '#f59e0b' },
  { icon: Star, title: 'Оставляйте отзывы', text: 'После доставки оцените водителя — это помогает другим выбирать надёжных.', color: '#ec4899' },
];

/**
 * Onboarding — приветственный 5-шаговый тур для новых пользователей.
 * Показывается один раз (флаг в localStorage), разный для водителя/отправителя.
 */
export function Onboarding({ role, onClose }: { role: 'driver' | 'sender'; onClose: () => void }) {
  const navigate = useNavigate();
  const steps = role === 'driver' ? DRIVER_STEPS : SENDER_STEPS;
  const [index, setIndex] = useState(0);
  const step = steps[index];
  const isLast = index === steps.length - 1;
  const Icon = step.icon;

  const finish = () => { markDone(); onClose(); };
  const next = () => { if (isLast) finish(); else setIndex(i => i + 1); };
  const goCta = (href: string) => { markDone(); onClose(); navigate(href); };

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center" style={{ background: '#000000cc', backdropFilter: 'blur(4px)' }}>
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden"
        style={{ background: '#0b1422', border: '1px solid #16263c', boxShadow: '0 -16px 48px #000000a0' }}
      >
        {/* Skip */}
        <button
          onClick={finish}
          aria-label="Пропустить"
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          style={{ background: '#ffffff0a' }}
        >
          <X className="w-4 h-4" />
        </button>

        <div className="px-6 pt-10 pb-7 flex flex-col items-center text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center"
            >
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5" style={{ background: `${step.color}1a`, border: `1px solid ${step.color}33` }}>
                <Icon className="w-9 h-9" style={{ color: step.color }} />
              </div>
              <h2 className="text-xl font-black text-white mb-2">{step.title}</h2>
              <p className="text-sm leading-relaxed max-w-[300px]" style={{ color: '#8a9bb0' }}>{step.text}</p>
            </motion.div>
          </AnimatePresence>

          {/* Progress dots */}
          <div className="flex items-center gap-2 mt-6 mb-6">
            {steps.map((_, i) => (
              <span
                key={i}
                className="h-1.5 rounded-full transition-all"
                style={{ width: i === index ? 22 : 6, background: i === index ? step.color : '#2a3a50' }}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="w-full flex flex-col gap-2.5">
            {step.cta && (
              <button
                onClick={() => goCta(step.cta!.href)}
                className="w-full py-3 rounded-2xl text-sm font-bold text-white transition-transform active:scale-[0.98] flex items-center justify-center gap-2"
                style={{ background: `linear-gradient(135deg, ${step.color}, ${step.color}cc)` }}
              >
                {step.cta.label}
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={next}
              className="w-full py-3 rounded-2xl text-sm font-bold transition-transform active:scale-[0.98]"
              style={{ background: step.cta ? '#ffffff0a' : `linear-gradient(135deg,#1565d8,#2385f4)`, color: '#ffffff' }}
            >
              {isLast ? 'Начать' : 'Далее'}
            </button>
            {!isLast && !step.cta && (
              <button onClick={finish} className="w-full py-2 text-xs font-semibold transition-colors" style={{ color: '#5a6f88' }}>
                Пропустить
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
