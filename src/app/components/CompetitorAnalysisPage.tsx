/**
 * CompetitorAnalysisPage — Стратегический анализ рынка для Ovora Cargo
 * Изучены: ATI.SU, Uber Freight, Lalamove, Flexport, Convoy, Яндекс Доставка, GroozGo, Dellin
 */
import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft, Globe, TrendingUp, AlertTriangle, CheckCircle2,
  XCircle, Zap, Shield, Star, Package, MapPin, FileText,
  CreditCard, Users, BarChart3, Phone, Truck, Clock,
  ChevronDown, ChevronUp, ExternalLink, Target, Flame,
  Award, Lock, RefreshCw, Navigation, Camera, QrCode,
  MessageSquare, Calculator, Building2, Layers, AlertCircle,
  ArrowRight, Sparkles, DollarSign, Wifi, Bell
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────────────────────────────────────

const COMPETITORS = [
  {
    name: 'ATI.SU',
    region: 'СНГ / Россия',
    flag: '🇷🇺',
    type: 'Биржа грузов',
    users: '600 000+',
    color: '#f97316',
    url: 'ati.su',
    strengths: [
      'Крупнейшая биржа в СНГ — 600к+ компаний',
      'Финансовые рейтинги перевозчиков',
      'Интеграция с 1С и ERP-системами',
      'Электронный документооборот (ЭДО)',
      '20+ фильтров поиска грузов',
      'Страхование грузов прямо на платформе',
    ],
    missing_in_us: ['Рейтинги компаний', 'ЭДО', 'Интеграция 1С', 'Биржа грузов с фильтрами', 'Страхование'],
  },
  {
    name: 'Uber Freight',
    region: 'США / Глобально',
    flag: '🇺🇸',
    type: 'Digital Freight Broker',
    users: '1 000 000+',
    color: '#000000',
    url: 'uberfreight.com',
    strengths: [
      'Мгновенные котировки через AI',
      'Real-time GPS трекинг груза',
      'Доказательство доставки (POD + фото)',
      'Прозрачное ценообразование',
      'Инстант-выплаты водителям',
      'Программа лояльности Uber Pro',
    ],
    missing_in_us: ['AI-котировки', 'Реальный GPS трекинг', 'POD (фото)', 'Инстант-выплаты', 'Лояльность'],
  },
  {
    name: 'Lalamove',
    region: 'Азия / Глобально',
    flag: '🌏',
    type: 'On-demand Delivery',
    users: '10 000 000+',
    color: '#ff6600',
    url: 'lalamove.com',
    strengths: [
      'Заказ за 3 минуты с мгновенным матчингом',
      'Мультивагонный выбор (мото → фура)',
      'Корпоративные аккаунты (B2B)',
      'Мульти-стоп маршруты за один заказ',
      'QR-код на груз для отслеживания',
      'Публичная ссылка трекинга (без приложения)',
      'E-Pod — цифровая подпись при получении',
    ],
    missing_in_us: ['QR-код груза', 'Мульти-стоп', 'Публичный трекинг-линк', 'E-Pod', 'Корп. аккаунты'],
  },
  {
    name: 'Flexport',
    region: 'Глобально',
    flag: '🌐',
    type: 'Full-Stack Logistics',
    users: '10 000+',
    color: '#5ba3f5',
    url: 'flexport.com',
    strengths: [
      'Полный цикл: авто + море + воздух',
      'Таможенное оформление в приложении',
      'Детальная аналитика цепочки поставок',
      'API для бизнес-интеграций',
      'Мультивалютность (USD, EUR, CNY и др.)',
      'Трекинг контейнеров в реальном времени',
    ],
    missing_in_us: ['Мультивалютность', 'API для бизнеса', 'Аналитика цепочки', 'Таможня онлайн'],
  },
  {
    name: 'Convoy',
    region: 'США',
    flag: '🇺🇸',
    type: 'Digital Freight Network',
    users: '400 000+',
    color: '#22c55e',
    url: 'convoy.com',
    strengths: [
      'AI-матчинг груза и водителя (секунды)',
      'Автоматизированная диспетчеризация',
      'CO₂ отчётность (ESG)',
      'Программа доходности водителя',
      'Дашборд аналитики для грузовладельцев',
      'Электронные CMR и накладные',
    ],
    missing_in_us: ['AI-матчинг', 'CO₂ трекинг', 'Аналитика для отправителей', 'Электронные ТН'],
  },
  {
    name: 'Яндекс Доставка',
    region: 'СНГ',
    flag: '🇷🇺',
    type: 'Last-Mile Delivery',
    users: '50 000 000+',
    color: '#ffcc00',
    url: 'dostavka.yandex.ru',
    strengths: [
      'Карта водителей в реальном времени',
      'Интеграция с Яндекс Картами (лучшие маршруты)',
      'Реферальная программа',
      'Бонусная система Яндекс Плюс',
      'Страхование посылок',
      'Тариф по зонам города',
    ],
    missing_in_us: ['Карта водителей онлайн', 'Реферальная программа', 'Бонусная система', 'Тарифы по зонам'],
  },
  {
    name: 'GroozGo',
    region: 'Украина / СНГ',
    flag: '🇺🇦',
    type: 'Cargo Marketplace',
    users: '50 000+',
    color: '#a855f7',
    url: 'groozgo.com',
    strengths: [
      'Быстрый онбординг без верификации',
      'Фото-подтверждение загрузки/выгрузки',
      'Калькулятор стоимости по маршруту',
      'Push-уведомления об откликах',
      'Статусы груза: ожидает, в пути, доставлен',
      'Чат внутри приложения',
    ],
    missing_in_us: ['Фото загрузки/выгрузки', 'Статусы груза', 'Улучшенный калькулятор'],
  },
  {
    name: 'Dellin (Деловые линии)',
    region: 'Россия',
    flag: '🇷🇺',
    type: 'Express Cargo',
    users: '2 000 000+',
    color: '#ef4444',
    url: 'dellin.ru',
    strengths: [
      'Трекинг по номеру накладной (без приложения)',
      'Страхование и упаковка прямо в приложении',
      'Приём груза "от двери до двери"',
      'Сборные грузы (LTL/догруз)',
      'Автоматический расчёт срока доставки',
      'Юридически значимые документы',
    ],
    missing_in_us: ['LTL/догруз', 'Трекинг по накладной', 'Расчёт срока доставки', 'Юридические документы'],
  },
];

interface Gap {
  id: string;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  icon: any;
  competitors: string[];
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  feature?: string;
}

const GAPS: Gap[] = [
  // ── CRITICAL ──────────────────────────────────────────────────────────────
  {
    id: 'gps-tracking',
    title: 'Real-time GPS трекинг на карте',
    description: 'Водитель делится геопозицией, отправитель видит на карте где находится его груз прямо сейчас. Публичная ссылка трекинга — без входа в приложение.',
    priority: 'critical',
    category: 'Трекинг',
    icon: Navigation,
    competitors: ['Lalamove', 'Uber Freight', 'Яндекс Доставка'],
    effort: 'medium',
    impact: 'high',
    feature: 'TrackingPage есть, но без live GPS позиции водителя',
  },
  {
    id: 'pod',
    title: 'Proof of Delivery (POD) — фото-подтверждение',
    description: 'Водитель фотографирует груз при загрузке и выгрузке. Отправитель получает фото + геометку + время. Это стандарт отрасли и защита от споров.',
    priority: 'critical',
    category: 'Доставка',
    icon: Camera,
    competitors: ['Uber Freight', 'Lalamove', 'GroozGo'],
    effort: 'medium',
    impact: 'high',
  },
  {
    id: 'public-tracking-link',
    title: 'Публичная ссылка трекинга',
    description: 'Отправитель генерирует ссылку и отправляет получателю. Тот открывает в браузере без регистрации и видит где груз. Вирусный маркетинг + UX.',
    priority: 'critical',
    category: 'Трекинг',
    icon: Globe,
    competitors: ['Lalamove', 'Dellin', 'Uber Freight'],
    effort: 'low',
    impact: 'high',
  },
  {
    id: 'cargo-status',
    title: 'Детальные статусы груза',
    description: 'Ожидает водителя → Принят → Загружен → В пути → На границе → Доставлен. С временными метками. Сейчас статусы бинарные (active/completed).',
    priority: 'critical',
    category: 'Логистика',
    icon: Layers,
    competitors: ['GroozGo', 'Dellin', 'Uber Freight'],
    effort: 'low',
    impact: 'high',
    feature: 'Trip status enum нужно расширить',
  },
  // ── HIGH ────────────────────────────────────────────────────────────────────
  {
    id: 'qr-code',
    title: 'QR-код груза',
    description: 'Уникальный QR генерируется при создании заявки. Его сканирует водитель при загрузке — подтверждение приёма. Клеится на груз. Стандарт Lalamove, DHL.',
    priority: 'high',
    category: 'Операции',
    icon: QrCode,
    competitors: ['Lalamove', 'DHL'],
    effort: 'low',
    impact: 'high',
  },
  {
    id: 'dispute-system',
    title: 'Система споров и претензий',
    description: 'Структурированный процесс: описание проблемы, прикрепление фото, медиация через поддержку. Без этого платформа теряет доверие при конфликтах.',
    priority: 'high',
    category: 'Безопасность',
    icon: Shield,
    competitors: ['Uber Freight', 'ATI.SU', 'Flexport'],
    effort: 'medium',
    impact: 'high',
  },
  {
    id: 'business-accounts',
    title: 'Корпоративные аккаунты (B2B)',
    description: 'Компании регистрируют юрлицо, добавляют сотрудников, получают сводный счёт. Это открывает сегмент корпоративных клиентов — x5 к среднему чеку.',
    priority: 'high',
    category: 'Монетизация',
    icon: Building2,
    competitors: ['Lalamove', 'Flexport', 'ATI.SU'],
    effort: 'high',
    impact: 'high',
  },
  {
    id: 'digital-docs',
    title: 'Электронные документы (ТН/ТТН)',
    description: 'Генерация транспортных накладных, актов выполненных работ прямо в приложении. ATI.SU интегрирован с ЭДО. Критично для B2B сегмента.',
    priority: 'high',
    category: 'Документы',
    icon: FileText,
    competitors: ['ATI.SU', 'Convoy', 'Dellin'],
    effort: 'high',
    impact: 'high',
  },
  {
    id: 'insurance',
    title: 'Страхование грузов в приложении',
    description: 'Партнёрство со страховой компанией. При создании заявки — опция застраховать груз на N сумму за X% стоимости. Дополнительная монетизация.',
    priority: 'high',
    category: 'Монетизация',
    icon: Lock,
    competitors: ['ATI.SU', 'Яндекс Доставка', 'Dellin'],
    effort: 'high',
    impact: 'high',
  },
  {
    id: 'driver-earnings',
    title: 'Аналитика доходов водителя',
    description: 'Дашборд: сегодня / неделя / месяц / год. График заработка, количество рейсов, средний чек. Uber и Lalamove делают это — мотивирует водителей.',
    priority: 'high',
    category: 'Водители',
    icon: BarChart3,
    competitors: ['Uber Freight', 'Lalamove'],
    effort: 'low',
    impact: 'high',
  },
  {
    id: 'referral',
    title: 'Реферальная программа',
    description: 'Пригласи друга — получи бонус. Один из главных каналов роста для Lalamove и Яндекс Доставки. Вирусный рост без затрат на рекламу.',
    priority: 'high',
    category: 'Рост',
    icon: Users,
    competitors: ['Lalamove', 'Яндекс Доставка'],
    effort: 'medium',
    impact: 'high',
  },
  // ── MEDIUM ──────────────────────────────────────────────────────────────────
  {
    id: 'multi-stop',
    title: 'Мульти-стоп маршруты (догруз/LTL)',
    description: 'Водитель едет из Ташкента в Москву и может взять попутный груз в Нур-Султане. Заявка с несколькими точками загрузки/выгрузки.',
    priority: 'medium',
    category: 'Логистика',
    icon: MapPin,
    competitors: ['Lalamove', 'Dellin', 'Convoy'],
    effort: 'high',
    impact: 'high',
  },
  {
    id: 'instant-payout',
    title: 'Быстрые выплаты водителям',
    description: 'Моментальный вывод заработка после завершения рейса через картку/кошелёк. Uber Freight — главный кейс. Мотивирует водителей выбирать платформу.',
    priority: 'medium',
    category: 'Финансы',
    icon: DollarSign,
    competitors: ['Uber Freight', 'Convoy'],
    effort: 'high',
    impact: 'high',
  },
  {
    id: 'advanced-search',
    title: 'Расширенные фильтры поиска',
    description: 'Тип кузова (рефрижератор, тент, самосвал), ADR (опасные грузы), тоннаж от/до, объём, срочность, наличие оплаты. ATI.SU имеет 20+ фильтров.',
    priority: 'medium',
    category: 'Поиск',
    icon: Zap,
    competitors: ['ATI.SU', 'Convoy'],
    effort: 'medium',
    impact: 'medium',
  },
  {
    id: 'multi-currency',
    title: 'Мультивалютность',
    description: 'UZS, KZT, KGS, RUB, USD. Автоматическая конвертация по курсу. Актуально для трансграничных маршрутов между странами СНГ.',
    priority: 'medium',
    category: 'Финансы',
    icon: CreditCard,
    competitors: ['Flexport', 'Uber Freight'],
    effort: 'medium',
    impact: 'medium',
  },
  {
    id: 'ai-pricing',
    title: 'AI-предложение цены',
    description: 'При создании поездки — алгоритм предлагает рыночную цену на маршруте на основе исторических данных. Убирает ценовой хаос.',
    priority: 'medium',
    category: 'AI',
    icon: Sparkles,
    competitors: ['Uber Freight', 'Convoy'],
    effort: 'high',
    impact: 'high',
  },
  {
    id: 'vehicle-matching',
    title: 'Умный подбор транспорта',
    description: 'Укажи вес и габариты груза — система покажет только подходящие машины. Сейчас выбор типа авто есть, но матчинг с грузом не работает.',
    priority: 'medium',
    category: 'Матчинг',
    icon: Truck,
    competitors: ['Lalamove', 'Convoy'],
    effort: 'medium',
    impact: 'medium',
  },
  // ── LOW ─────────────────────────────────────────────────────────────────────
  {
    id: 'co2',
    title: 'CO₂ / Углеродный след',
    description: 'Показывать сколько CO₂ экономится за счёт оптимальных маршрутов. ESG-отчётность для корпоративных клиентов. Convoy делает это.',
    priority: 'low',
    category: 'ESG',
    icon: Globe,
    competitors: ['Convoy', 'Flexport'],
    effort: 'low',
    impact: 'low',
  },
  {
    id: 'api-b2b',
    title: 'Открытый API для бизнеса',
    description: 'REST API + webhooks для интеграции с TMS/ERP/1С. Открывает корпоративный рынок и возможность стать "рельсами" для других платформ.',
    priority: 'low',
    category: 'B2B',
    icon: RefreshCw,
    competitors: ['Flexport', 'ATI.SU'],
    effort: 'high',
    impact: 'medium',
  },
  {
    id: 'offline-mode',
    title: 'Полноценный offline-режим',
    description: 'Service Worker + Background Sync. Водитель в зоне без интернета (горы, граница) — приложение работает, синхронизируется при появлении сети.',
    priority: 'low',
    category: 'Техника',
    icon: Wifi,
    competitors: [],
    effort: 'medium',
    impact: 'medium',
  },
];

const PRIORITY_CONFIG = {
  critical: { label: 'Критично', color: '#ef4444', bg: '#ef444420', border: '#ef444440', dot: '🔴' },
  high:     { label: 'Высокий', color: '#f97316', bg: '#f9731620', border: '#f9731640', dot: '🟠' },
  medium:   { label: 'Средний', color: '#eab308', bg: '#eab30820', border: '#eab30840', dot: '🟡' },
  low:      { label: 'Низкий',  color: '#22c55e', bg: '#22c55e20', border: '#22c55e40', dot: '🟢' },
};

const CATEGORIES = ['Все', 'Трекинг', 'Доставка', 'Логистика', 'Монетизация', 'Финансы', 'Безопасность', 'AI', 'Рост', 'Документы', 'Водители'];

const ROADMAP_PHASES = [
  {
    phase: 'Фаза 1',
    title: 'Доверие и безопасность',
    duration: '1–2 месяца',
    color: '#ef4444',
    icon: Shield,
    items: [
      { icon: Navigation, text: 'Real-time GPS трекинг водителя на карте' },
      { icon: Camera, text: 'Фото загрузки / выгрузки (Proof of Delivery)' },
      { icon: Globe, text: 'Публичная ссылка трекинга (без регистрации)' },
      { icon: Layers, text: '6 детальных статусов груза с временными метками' },
      { icon: Shield, text: 'Базовая система споров и претензий' },
    ],
  },
  {
    phase: 'Фаза 2',
    title: 'Рост и монетизация',
    duration: '2–3 месяца',
    color: '#f97316',
    icon: TrendingUp,
    items: [
      { icon: QrCode, text: 'QR-код груза для водителя' },
      { icon: BarChart3, text: 'Дашборд доходов водителя' },
      { icon: Users, text: 'Реферальная программа' },
      { icon: Zap, text: 'Расширенные фильтры поиска (тип кузова, ADR, тоннаж)' },
      { icon: Truck, text: 'Умный матчинг транспорта по параметрам груза' },
    ],
  },
  {
    phase: 'Фаза 3',
    title: 'B2B и масштаб',
    duration: '3–5 месяцев',
    color: '#5ba3f5',
    icon: Building2,
    items: [
      { icon: Building2, text: 'Корпоративные аккаунты с командой' },
      { icon: FileText, text: 'Электронные накладные ТН/ТТН/CMR' },
      { icon: Lock, text: 'Интеграция страхования грузов' },
      { icon: CreditCard, text: 'Мультивалютность (UZS, KZT, RUB, USD)' },
      { icon: Sparkles, text: 'AI-предложение рыночной цены на маршрут' },
    ],
  },
  {
    phase: 'Фаза 4',
    title: 'Платформа будущего',
    duration: '5+ месяцев',
    color: '#a855f7',
    icon: Sparkles,
    items: [
      { icon: MapPin, text: 'Мульти-стоп маршруты (LTL/догруз)' },
      { icon: DollarSign, text: 'Быстрые выплаты водителям (инстант)' },
      { icon: RefreshCw, text: 'Открытый API для B2B интеграций' },
      { icon: Globe, text: 'CO₂ трекинг и ESG-отчётность' },
      { icon: Wifi, text: 'Полный offline-режим' },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function CompetitorCard({ comp, isOpen, onToggle }: { comp: typeof COMPETITORS[0]; isOpen: boolean; onToggle: () => void }) {
  return (
    <div
      className="rounded-2xl border overflow-hidden transition-all duration-200"
      style={{ background: '#131f2e', borderColor: isOpen ? comp.color + '60' : '#1e3a55' }}
    >
      <button
        className="w-full flex items-center gap-3 p-4 text-left"
        onClick={onToggle}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold shrink-0"
          style={{ background: comp.color + '20', border: `1px solid ${comp.color}40`, color: comp.color }}
        >
          {comp.flag}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white text-sm">{comp.name}</span>
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: comp.color + '20', color: comp.color, border: `1px solid ${comp.color}30` }}
            >
              {comp.type}
            </span>
          </div>
          <div className="text-xs mt-0.5" style={{ color: '#8ba4c0' }}>
            {comp.region} · {comp.users} пользователей
          </div>
        </div>
        <div className="shrink-0 text-gray-500">
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {isOpen && (
        <div className="px-4 pb-4 space-y-3">
          <div className="h-px" style={{ background: '#1e3a55' }} />
          <div>
            <div className="text-xs font-semibold mb-2" style={{ color: '#8ba4c0' }}>ЧТО У НИХ ЕСТЬ:</div>
            <div className="space-y-1.5">
              {comp.strengths.map((s, i) => (
                <div key={i} className="flex items-start gap-2 text-xs" style={{ color: '#c8d8e8' }}>
                  <CheckCircle2 size={13} className="shrink-0 mt-0.5" style={{ color: comp.color }} />
                  {s}
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold mb-2" style={{ color: '#ef4444' }}>ЧЕГО НЕТ У NAS (OVORA):</div>
            <div className="flex flex-wrap gap-1.5">
              {comp.missing_in_us.map((m, i) => (
                <span
                  key={i}
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: '#ef444415', color: '#ef4444', border: '1px solid #ef444430' }}
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
          <a
            href={`https://${comp.url}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs py-2 px-3 rounded-xl w-full justify-center transition-colors"
            style={{ background: comp.color + '15', color: comp.color, border: `1px solid ${comp.color}30` }}
          >
            <ExternalLink size={12} />
            Открыть {comp.url}
          </a>
        </div>
      )}
    </div>
  );
}

function GapCard({ gap }: { gap: Gap }) {
  const cfg = PRIORITY_CONFIG[gap.priority];
  const Icon = gap.icon;
  return (
    <div
      className="rounded-2xl border p-4 space-y-3"
      style={{ background: '#131f2e', borderColor: cfg.border }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
        >
          <Icon size={16} style={{ color: cfg.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-white text-sm">{gap.title}</span>
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
            >
              {cfg.dot} {cfg.label}
            </span>
          </div>
          <div className="text-xs mt-0.5" style={{ color: '#8ba4c0' }}>{gap.category}</div>
        </div>
      </div>
      <p className="text-xs leading-relaxed" style={{ color: '#c8d8e8' }}>{gap.description}</p>
      {gap.feature && (
        <div
          className="text-xs px-3 py-2 rounded-xl flex items-start gap-2"
          style={{ background: '#1e3a5520', border: '1px solid #1e3a5540' }}
        >
          <AlertCircle size={12} className="shrink-0 mt-0.5" style={{ color: '#5ba3f5' }} />
          <span style={{ color: '#8ba4c0' }}>{gap.feature}</span>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5 flex-wrap">
          {gap.competitors.map(c => (
            <span key={c} className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#0e1621', color: '#8ba4c0', border: '1px solid #1e3a55' }}>
              {c}
            </span>
          ))}
        </div>
        <div className="flex gap-2 text-xs shrink-0">
          <span style={{ color: gap.effort === 'low' ? '#22c55e' : gap.effort === 'medium' ? '#eab308' : '#ef4444' }}>
            ⚡ {gap.effort === 'low' ? 'Просто' : gap.effort === 'medium' ? 'Средне' : 'Сложно'}
          </span>
          <span style={{ color: gap.impact === 'high' ? '#22c55e' : gap.impact === 'medium' ? '#eab308' : '#8ba4c0' }}>
            📈 {gap.impact === 'high' ? 'Высокий' : gap.impact === 'medium' ? 'Средний' : 'Низкий'}
          </span>
        </div>
      </div>
    </div>
  );
}

function RoadmapCard({ phase }: { phase: typeof ROADMAP_PHASES[0] }) {
  const Icon = phase.icon;
  return (
    <div
      className="rounded-2xl border p-4 space-y-3"
      style={{ background: '#131f2e', borderColor: phase.color + '40' }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: phase.color + '20', border: `1px solid ${phase.color}40` }}
        >
          <Icon size={18} style={{ color: phase.color }} />
        </div>
        <div>
          <div className="text-xs font-semibold" style={{ color: phase.color }}>{phase.phase}</div>
          <div className="font-bold text-white text-sm">{phase.title}</div>
          <div className="text-xs" style={{ color: '#8ba4c0' }}>
            <Clock size={11} className="inline mr-1" />{phase.duration}
          </div>
        </div>
      </div>
      <div className="space-y-2">
        {phase.items.map((item, i) => {
          const ItemIcon = item.icon;
          return (
            <div key={i} className="flex items-start gap-2 text-xs" style={{ color: '#c8d8e8' }}>
              <ItemIcon size={12} className="shrink-0 mt-0.5" style={{ color: phase.color }} />
              {item.text}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

export function CompetitorAnalysisPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'competitors' | 'gaps' | 'roadmap'>('gaps');
  const [openComp, setOpenComp] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState('Все');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  const filteredGaps = GAPS.filter(g => {
    const catOk = filterCat === 'Все' || g.category === filterCat;
    const prioOk = filterPriority === 'all' || g.priority === filterPriority;
    return catOk && prioOk;
  });

  const criticalCount = GAPS.filter(g => g.priority === 'critical').length;
  const highCount = GAPS.filter(g => g.priority === 'high').length;
  const mediumCount = GAPS.filter(g => g.priority === 'medium').length;

  return (
    <div className="min-h-screen pb-8" style={{ background: '#0e1621', color: '#e2eaf4' }}>
      {/* Header */}
      <div className="sticky top-0 z-30 px-4 pt-safe" style={{ background: '#0e1621', borderBottom: '1px solid #1e3a55' }}>
        <div className="flex items-center gap-3 py-4">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: '#1e3a5520', border: '1px solid #1e3a55' }}
          >
            <ArrowLeft size={18} style={{ color: '#8ba4c0' }} />
          </button>
          <div className="flex-1">
            <h1 className="font-bold text-base text-white">Анализ конкурентов</h1>
            <p className="text-xs" style={{ color: '#8ba4c0' }}>Стратегический роадмап Ovora Cargo</p>
          </div>
          <div
            className="text-xs px-2.5 py-1 rounded-full font-semibold"
            style={{ background: '#ef444420', color: '#ef4444', border: '1px solid #ef444440' }}
          >
            {criticalCount} критично
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 pb-3">
          {[
            { key: 'gaps', label: 'Что не хватает', icon: AlertTriangle },
            { key: 'roadmap', label: 'Роадмап', icon: Target },
            { key: 'competitors', label: 'Конкуренты', icon: Globe },
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-all"
                style={{
                  background: active ? '#5ba3f5' : '#1e3a5520',
                  color: active ? '#fff' : '#8ba4c0',
                  border: `1px solid ${active ? '#5ba3f5' : '#1e3a55'}`,
                }}
              >
                <Icon size={12} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">

        {/* ── GAPS TAB ──────────────────────────────────────────────────────────── */}
        {activeTab === 'gaps' && (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Критично', count: criticalCount, color: '#ef4444', prio: 'critical' },
                { label: 'Высокий', count: highCount, color: '#f97316', prio: 'high' },
                { label: 'Средний', count: mediumCount, color: '#eab308', prio: 'medium' },
              ].map(s => (
                <button
                  key={s.prio}
                  onClick={() => setFilterPriority(filterPriority === s.prio ? 'all' : s.prio)}
                  className="rounded-2xl p-3 text-center transition-all"
                  style={{
                    background: filterPriority === s.prio ? s.color + '25' : '#131f2e',
                    border: `1px solid ${filterPriority === s.prio ? s.color + '80' : s.color + '30'}`,
                  }}
                >
                  <div className="text-2xl font-black" style={{ color: s.color }}>{s.count}</div>
                  <div className="text-xs mt-0.5" style={{ color: '#8ba4c0' }}>{s.label}</div>
                </button>
              ))}
            </div>

            {/* Priority filter */}
            {filterPriority !== 'all' && (
              <button
                onClick={() => setFilterPriority('all')}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full"
                style={{ background: '#1e3a5520', color: '#8ba4c0', border: '1px solid #1e3a55' }}
              >
                <XCircle size={12} /> Сбросить фильтр
              </button>
            )}

            {/* Category filter */}
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilterCat(cat)}
                  className="shrink-0 text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-all"
                  style={{
                    background: filterCat === cat ? '#5ba3f5' : '#131f2e',
                    color: filterCat === cat ? '#fff' : '#8ba4c0',
                    border: `1px solid ${filterCat === cat ? '#5ba3f5' : '#1e3a55'}`,
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Gap cards */}
            <div className="space-y-3">
              {filteredGaps.length === 0 ? (
                <div className="text-center py-10 text-sm" style={{ color: '#8ba4c0' }}>Ничего не найдено</div>
              ) : (
                filteredGaps.map(gap => <GapCard key={gap.id} gap={gap} />)
              )}
            </div>
          </>
        )}

        {/* ── ROADMAP TAB ─────────────────────────────────────────────────────── */}
        {activeTab === 'roadmap' && (
          <>
            {/* Top banner */}
            <div
              className="rounded-2xl p-4"
              style={{ background: 'linear-gradient(135deg, #1e3a5530, #5ba3f510)', border: '1px solid #5ba3f530' }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: '#5ba3f520', border: '1px solid #5ba3f540' }}
                >
                  <Target size={20} style={{ color: '#5ba3f5' }} />
                </div>
                <div>
                  <div className="font-bold text-white text-sm">Стратегия на 6+ месяцев</div>
                  <div className="text-xs mt-1 leading-relaxed" style={{ color: '#8ba4c0' }}>
                    Приоритеты расставлены по принципу: максимальный impact при минимальных усилиях.
                    Фаза 1 критична — без доверия пользователи не остаются.
                  </div>
                </div>
              </div>
            </div>

            {/* Phases */}
            <div className="space-y-3">
              {ROADMAP_PHASES.map(phase => (
                <RoadmapCard key={phase.phase} phase={phase} />
              ))}
            </div>

            {/* Quick wins */}
            <div className="rounded-2xl border p-4" style={{ background: '#131f2e', borderColor: '#22c55e40' }}>
              <div className="flex items-center gap-2 mb-3">
                <Flame size={16} style={{ color: '#22c55e' }} />
                <span className="font-bold text-sm text-white">Быстрые победы (до 1 недели)</span>
              </div>
              <div className="space-y-2">
                {[
                  { icon: Layers, text: 'Расширить статусы рейса: загружен → в пути → на таможне → доставлен' },
                  { icon: Bell, text: 'Push-уведомление отправителю при изменении статуса' },
                  { icon: Globe, text: 'Генерация публичной ссылки трекинга (просто по ID рейса)' },
                  { icon: QrCode, text: 'QR-код на страницу деталей рейса для распечатки' },
                  { icon: BarChart3, text: 'Страница статистики для водителя: рейсов всего, средний рейтинг, заработок' },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} className="flex items-start gap-2 text-xs" style={{ color: '#c8d8e8' }}>
                      <Icon size={12} className="shrink-0 mt-0.5" style={{ color: '#22c55e' }} />
                      {item.text}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Scale perspective */}
            <div className="rounded-2xl border p-4 space-y-3" style={{ background: '#131f2e', borderColor: '#a855f740' }}>
              <div className="flex items-center gap-2">
                <Award size={16} style={{ color: '#a855f7' }} />
                <span className="font-bold text-sm text-white">При 50 млн пользователей</span>
              </div>
              <div className="space-y-2">
                {[
                  { metric: 'GPS трекинг', impact: 'Снижает число споров на ~60%' },
                  { metric: 'POD (фото)', impact: 'Уменьшает заявки на возврат на ~40%' },
                  { metric: 'Реферальная программа', impact: 'CAC снижается в 3–5х' },
                  { metric: 'B2B аккаунты', impact: 'LTV пользователя выше в 8–12х' },
                  { metric: 'Страхование грузов', impact: 'Дополнительный доход 3–5% с транзакции' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start justify-between gap-3 py-2" style={{ borderBottom: i < 4 ? '1px solid #1e3a5540' : 'none' }}>
                    <span className="text-xs font-semibold" style={{ color: '#a855f7' }}>{item.metric}</span>
                    <span className="text-xs text-right" style={{ color: '#8ba4c0' }}>{item.impact}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── COMPETITORS TAB ─────────────────────────────────────────────────── */}
        {activeTab === 'competitors' && (
          <>
            <div
              className="rounded-2xl p-3 flex items-start gap-2"
              style={{ background: '#5ba3f510', border: '1px solid #5ba3f530' }}
            >
              <Globe size={14} className="shrink-0 mt-0.5" style={{ color: '#5ba3f5' }} />
              <p className="text-xs leading-relaxed" style={{ color: '#8ba4c0' }}>
                Изучены 8 крупнейших платформ: ATI.SU, Uber Freight, Lalamove, Flexport, Convoy, Яндекс Доставка, GroozGo, Dellin.
                Нажми на карточку, чтобы увидеть их фишки и чего не хватает у нас.
              </p>
            </div>

            {/* Market size overview */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Рынок грузоперевозок СНГ', value: '$180B', color: '#5ba3f5' },
                { label: 'Рост рынка в год', value: '+12%', color: '#22c55e' },
                { label: 'Доля digital-платформ', value: '8%', color: '#f97316' },
                { label: 'Потенциал роста', value: '12×', color: '#a855f7' },
              ].map(s => (
                <div key={s.label} className="rounded-2xl p-3" style={{ background: '#131f2e', border: `1px solid ${s.color}30` }}>
                  <div className="text-xl font-black" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-xs mt-0.5" style={{ color: '#8ba4c0' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Competitor cards */}
            <div className="space-y-2">
              {COMPETITORS.map(comp => (
                <CompetitorCard
                  key={comp.name}
                  comp={comp}
                  isOpen={openComp === comp.name}
                  onToggle={() => setOpenComp(openComp === comp.name ? null : comp.name)}
                />
              ))}
            </div>

            {/* Our advantages */}
            <div className="rounded-2xl border p-4" style={{ background: '#131f2e', borderColor: '#22c55e40' }}>
              <div className="flex items-center gap-2 mb-3">
                <Star size={16} style={{ color: '#22c55e' }} />
                <span className="font-bold text-sm text-white">Наши сильные стороны</span>
              </div>
              <div className="space-y-1.5">
                {[
                  'Авиамодуль (нет у конкурентов) — уникальная ниша',
                  'Тёмная тема и mobile-first UX — выше среднего по отрасли',
                  'Push-уведомления и PWA — готовы к масштабу',
                  'Реальный чат с историей — не все конкуренты имеют',
                  'Верификация документов водителей',
                  'Радио и инфраструктура для водителей',
                  'Мультиязычная поддержка (i18n) в базе',
                ].map((s, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs" style={{ color: '#c8d8e8' }}>
                    <CheckCircle2 size={13} className="shrink-0 mt-0.5" style={{ color: '#22c55e' }} />
                    {s}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
