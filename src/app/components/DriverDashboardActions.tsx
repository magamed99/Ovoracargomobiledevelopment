/**
 * DriverDashboardActions — быстрые действия на главном экране ВОДИТЕЛЯ.
 * Mobile: карточки 3 колонки | Desktop (md+): горизонтальные строки
 *
 * NOTE: background/borderColor NEVER go into motion props (initial/animate/whileHover)
 * because motion/react cannot parse 8-digit hex. Colors are handled via CSS transition.
 */
import { Plus, List, Heart, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { useState } from 'react';

const ACTIONS = [
  {
    icon: Plus,
    label: 'Создать поездку',
    sub: 'Опубликовать новый рейс',
    action: '/create-trip',
    color: '#5ba3f5',
    bg: '#5ba3f514',
    bgHover: '#5ba3f528',
    border: '#5ba3f530',
    borderHover: '#5ba3f560',
  },
  {
    icon: List,
    label: 'Мои рейсы',
    sub: 'Управление поездками',
    action: '/trips',
    color: '#a855f7',
    bg: '#a855f714',
    bgHover: '#a855f728',
    border: '#a855f730',
    borderHover: '#a855f760',
  },
  {
    icon: Heart,
    label: 'Избранное',
    sub: 'Сохранённые маршруты',
    action: '/favorites',
    color: '#f43f5e',
    bg: '#f43f5e14',
    bgHover: '#f43f5e28',
    border: '#f43f5e30',
    borderHover: '#f43f5e60',
  },
];

// Desktop row with CSS-driven color hover (safe from motion color parsing)
function DesktopRow({ item, i }: { item: typeof ACTIONS[0]; i: number }) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);

  return (
    <motion.button
      onClick={() => navigate(item.action)}
      className="flex items-center gap-3 px-4 py-3.5 rounded-2xl w-full text-left"
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: i * 0.07 + 0.05, duration: 0.32 }}
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.98 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      style={{
        background: hovered ? item.bgHover : item.bg,
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: hovered ? item.borderHover : item.border,
        transition: 'background 0.2s ease, border-color 0.2s ease',
      }}
    >
      {/* Icon box */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: item.color + '20' }}
      >
        <item.icon style={{ width: 18, height: 18, color: item.color }} strokeWidth={2.2} />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold text-white leading-none mb-0.5">{item.label}</p>
        <p className="text-[11px] text-[#607080] leading-none">{item.sub}</p>
      </div>

      {/* Chevron */}
      <ChevronRight style={{ width: 16, height: 16, color: item.color }} strokeWidth={2.5} />
    </motion.button>
  );
}

export function DriverDashboardActions() {
  const navigate = useNavigate();
  return (
    <>
      {/* ── DESKTOP: вертикальный список ───────────────────────────── */}
      <div className="hidden md:flex flex-col gap-2">
        {ACTIONS.map((item, i) => (
          <DesktopRow key={item.label} item={item} i={i} />
        ))}
      </div>

      {/* ── MOBILE: карточки 3 колонки ─────────────────────────────── */}
      <section className="md:hidden grid grid-cols-3 gap-2.5">
        {ACTIONS.map((item, i) => (
          <motion.button
            key={item.label}
            onClick={() => navigate(item.action)}
            className="flex flex-col items-center gap-2 px-2 py-4 rounded-2xl"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 + 0.05, duration: 0.32 }}
            whileTap={{ scale: 0.97 }}
            style={{
              background: '#ffffff06',
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: '#ffffff0f',
            }}
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
              style={{
                background: item.bg,
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: item.border,
              }}
            >
              <item.icon style={{ width: 20, height: 20, color: item.color }} strokeWidth={2} />
            </div>
            <div className="text-center">
              <p className="text-[11px] font-bold text-white leading-tight">{item.label}</p>
              <p className="text-[9px] text-[#607080] mt-0.5 leading-tight">{item.sub}</p>
            </div>
          </motion.button>
        ))}
      </section>
    </>
  );
}