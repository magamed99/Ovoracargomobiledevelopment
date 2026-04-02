// ── Пакет M: Bottom-sheet фильтры AVIA ─────────────────────────────────────────

import { motion, AnimatePresence } from 'motion/react';
import { X, SlidersHorizontal, RotateCcw, Check } from 'lucide-react';
import type { AviaFilterState } from '../../api/aviaFilterApi';
import { AirportAutocomplete } from './AirportAutocomplete';

// ── Слайдер + ввод числа ─────────────────────────────────────────────────────

function RangeInput({
  label,
  value,
  onChange,
  max = 100,
  unit,
  placeholder,
  accentColor,
}: {
  label: string;
  value: number | undefined;
  onChange: (v: number) => void;
  max?: number;
  unit: string;
  placeholder?: string;
  accentColor: string;
}) {
  const displayed = value && value > 0 ? value : 0;
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <label style={{ fontSize: 10, color: '#4a6080', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </label>
        <span style={{
          fontSize: 11, fontWeight: 800,
          color: displayed > 0 ? accentColor : '#3d5268',
          minWidth: 44, textAlign: 'right',
        }}>
          {displayed > 0 ? `${displayed}${unit}` : (placeholder ?? `0${unit}`)}
        </span>
      </div>
      <div style={{ position: 'relative', height: 20, display: 'flex', alignItems: 'center' }}>
        {/* Track */}
        <div style={{
          position: 'absolute', left: 0, right: 0, height: 3,
          background: '#ffffff0a', borderRadius: 2,
        }} />
        {/* Fill */}
        <div style={{
          position: 'absolute', left: 0,
          width: `${(displayed / max) * 100}%`,
          height: 3, background: accentColor + 'aa', borderRadius: 2,
          transition: 'width 0.05s',
        }} />
        <input
          type="range"
          min={0}
          max={max}
          value={displayed}
          onChange={e => onChange(Number(e.target.value))}
          style={{
            position: 'relative', width: '100%', appearance: 'none',
            background: 'transparent', outline: 'none', cursor: 'pointer',
            height: 20,
          }}
        />
      </div>
      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px; height: 16px;
          border-radius: 50%;
          background: ${accentColor};
          border: 2px solid #07111f;
          cursor: pointer;
          box-shadow: 0 0 6px ${accentColor}55;
        }
        input[type="range"]::-moz-range-thumb {
          width: 14px; height: 14px;
          border-radius: 50%;
          background: ${accentColor};
          border: 2px solid #07111f;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}

// ── Основной компонент ────────────────────────────────────────────────────────

interface AviaFilterSheetProps {
  open: boolean;
  onClose: () => void;
  filters: AviaFilterState;
  onChange: (f: AviaFilterState) => void;
  onReset: () => void;
  accentColor: string;
  isFlights: boolean;
}

export function AviaFilterSheet({
  open,
  onClose,
  filters,
  onChange,
  onReset,
  accentColor,
  isFlights,
}: AviaFilterSheetProps) {
  const f = filters;

  const set = (key: keyof AviaFilterState, value: any) =>
    onChange({ ...f, [key]: value });

  const unset = (key: keyof AviaFilterState) => {
    const next = { ...f };
    delete next[key];
    onChange(next);
  };

  const handleRangeChange = (key: keyof AviaFilterState, v: number) => {
    if (v > 0) set(key, v); else unset(key);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* ── Backdrop ────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.72)',
              zIndex: 300,
              backdropFilter: 'blur(4px)',
            }}
          />

          {/* ── Sheet ───────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0,
              background: '#07111f',
              borderRadius: '20px 20px 0 0',
              border: '1px solid #ffffff0d',
              borderBottom: 'none',
              zIndex: 301,
              maxHeight: '92dvh',
              display: 'flex', flexDirection: 'column',
              fontFamily: "'Sora', 'Inter', sans-serif",
            }}
          >
            {/* Pill */}
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10, flexShrink: 0 }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: '#ffffff14' }} />
            </div>

            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 20px 14px',
              borderBottom: '1px solid #ffffff08',
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <SlidersHorizontal style={{ width: 15, height: 15, color: accentColor }} />
                <span style={{ fontSize: 15, fontWeight: 800, color: '#fff', letterSpacing: '-0.3px' }}>
                  Фильтры
                </span>
                <span style={{
                  fontSize: 10, fontWeight: 700,
                  color: isFlights ? '#0ea5e9' : '#a78bfa',
                  padding: '2px 8px', borderRadius: 6,
                  background: isFlights ? '#0ea5e912' : '#a78bfa12',
                  border: `1px solid ${isFlights ? '#0ea5e920' : '#a78bfa20'}`,
                }}>
                  {isFlights ? 'Рейсы' : 'Заявки'}
                </span>
              </div>
              <button
                onClick={onClose}
                style={{
                  width: 30, height: 30, borderRadius: 9,
                  border: '1px solid #ffffff10', background: '#ffffff06',
                  color: '#6b8299', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <X style={{ width: 14, height: 14 }} />
              </button>
            </div>

            {/* Body */}
            <div style={{ overflowY: 'auto', flex: 1, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* Маршрут */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#3d5268', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>
                  Маршрут
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 10, color: '#4a6080', fontWeight: 700, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Откуда</label>
                    <AirportAutocomplete
                      value={f.from || ''}
                      onChange={v => v ? set('from', v) : unset('from')}
                      placeholder="Город..."
                      accentColor={accentColor}
                      inputStyle={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #ffffff10', background: '#0d1f35', fontSize: 13, fontWeight: 600 }}
                      showIcon={false}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, color: '#4a6080', fontWeight: 700, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Куда</label>
                    <AirportAutocomplete
                      value={f.to || ''}
                      onChange={v => v ? set('to', v) : unset('to')}
                      placeholder="Город..."
                      accentColor={accentColor}
                      inputStyle={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #ffffff10', background: '#0d1f35', fontSize: 13, fontWeight: 600 }}
                      showIcon={false}
                    />
                  </div>
                </div>
              </div>

              {/* Дата */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#3d5268', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>
                  {isFlights ? 'Дата вылета' : 'Дедлайн не ранее'}
                </div>
                <input
                  type="date"
                  value={f.date || ''}
                  onChange={e => e.target.value ? set('date', e.target.value) : unset('date')}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: 10,
                    border: '1px solid #ffffff10', background: '#0d1f35',
                    color: '#fff', fontSize: 13, fontWeight: 600,
                    outline: 'none', boxSizing: 'border-box',
                    colorScheme: 'dark',
                  }}
                />
              </div>

              {/* Вес */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#3d5268', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>
                  Вес (кг)
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '12px 14px', borderRadius: 12, background: '#ffffff04', border: '1px solid #ffffff08' }}>
                  <RangeInput
                    label="Минимум"
                    value={f.weightMin}
                    onChange={v => handleRangeChange('weightMin', v)}
                    max={100}
                    unit=" кг"
                    placeholder="Любой"
                    accentColor={accentColor}
                  />
                  <RangeInput
                    label="Максимум"
                    value={f.weightMax}
                    onChange={v => handleRangeChange('weightMax', v)}
                    max={100}
                    unit=" кг"
                    placeholder="∞"
                    accentColor={accentColor}
                  />
                </div>
              </div>

              {/* Цена/кг — только для рейсов */}
              {isFlights && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#3d5268', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>
                    Цена / кг ($)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '12px 14px', borderRadius: 12, background: '#ffffff04', border: '1px solid #ffffff08' }}>
                    <RangeInput
                      label="Минимум"
                      value={f.priceMin}
                      onChange={v => handleRangeChange('priceMin', v)}
                      max={50}
                      unit="$"
                      placeholder="Любая"
                      accentColor={accentColor}
                    />
                    <RangeInput
                      label="Максимум"
                      value={f.priceMax}
                      onChange={v => handleRangeChange('priceMax', v)}
                      max={50}
                      unit="$"
                      placeholder="∞"
                      accentColor={accentColor}
                    />
                  </div>
                </div>
              )}

              {/* Только мои */}
              <div
                onClick={() => f.onlyMine ? unset('onlyMine') : set('onlyMine', true)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 16px', borderRadius: 12, cursor: 'pointer',
                  background: f.onlyMine ? `${accentColor}0d` : '#ffffff05',
                  border: `1px solid ${f.onlyMine ? accentColor + '28' : '#ffffff0c'}`,
                  transition: 'background 0.2s, border-color 0.2s',
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: f.onlyMine ? accentColor : '#8ea8b8' }}>
                    Только мои объявления
                  </div>
                  <div style={{ fontSize: 10, color: '#3d5268', marginTop: 2 }}>
                    Показать только ваши публикации
                  </div>
                </div>
                <motion.div
                  animate={{ scale: f.onlyMine ? 1 : 0.9 }}
                  style={{
                    width: 22, height: 22, borderRadius: 7, flexShrink: 0,
                    background: f.onlyMine ? accentColor : '#ffffff10',
                    border: `1px solid ${f.onlyMine ? accentColor : '#ffffff18'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background 0.2s, border-color 0.2s',
                  }}
                >
                  <AnimatePresence>
                    {f.onlyMine && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        transition={{ duration: 0.15 }}
                      >
                        <Check style={{ width: 12, height: 12, color: '#fff' }} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>
            </div>

            {/* Footer */}
            <div style={{
              padding: '12px 20px 24px',
              borderTop: '1px solid #ffffff08',
              display: 'flex', gap: 10,
              flexShrink: 0,
            }}>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => { onReset(); }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '12px 18px', borderRadius: 12,
                  border: '1px solid #ffffff12', background: '#ffffff08',
                  color: '#6b8299', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                <RotateCcw style={{ width: 13, height: 13 }} />
                Сбросить
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={onClose}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '12px 18px', borderRadius: 12, border: 'none',
                  background: `linear-gradient(135deg, ${accentColor}cc, ${accentColor})`,
                  color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  boxShadow: `0 4px 20px ${accentColor}30`,
                }}
              >
                Применить фильтры
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}