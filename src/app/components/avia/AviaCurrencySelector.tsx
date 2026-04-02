import { motion } from 'motion/react';

// ─── Currency catalogue ────────────────────────────────────────────────────────

export interface CurrencyOption {
  code: string;
  symbol: string;
  name: string;
  flag: string;
  color: string;
}

export const AVIA_CURRENCIES: CurrencyOption[] = [
  { code: 'USD', symbol: '$',    name: 'Доллар США',      flag: '🇺🇸', color: '#34d399' },
  { code: 'EUR', symbol: '€',    name: 'Евро',             flag: '🇪🇺', color: '#60a5fa' },
  { code: 'RUB', symbol: '₽',    name: 'Рубль',            flag: '🇷🇺', color: '#f87171' },
  { code: 'AED', symbol: 'د.إ', name: 'Дирхам ОАЭ',      flag: '🇦🇪', color: '#fbbf24' },
  { code: 'TJS', symbol: 'с.',   name: 'Сомони',           flag: '🇹🇯', color: '#a78bfa' },
  { code: 'KZT', symbol: '₸',    name: 'Тенге',            flag: '🇰🇿', color: '#fb923c' },
  { code: 'UZS', symbol: "so'm", name: 'Сум',              flag: '🇺🇿', color: '#4ade80' },
  { code: 'CNY', symbol: '¥',    name: 'Юань',             flag: '🇨🇳', color: '#f472b6' },
];

export function getCurrency(code: string): CurrencyOption {
  return AVIA_CURRENCIES.find(c => c.code === code) ?? AVIA_CURRENCIES[0];
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  value: string;
  onChange: (code: string) => void;
  label?: string;
  compact?: boolean; // compact = only code+symbol chips, no name
}

// ─────────────────────────────────────────────────────────────────────────────
//  AviaCurrencySelector
// ─────────────────────────────────────────────────────────────────────────────

export function AviaCurrencySelector({ value, onChange, label = 'Валюта', compact = false }: Props) {
  const selected = getCurrency(value);

  return (
    <div>
      {/* Label row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{
          fontSize: 11, fontWeight: 600, color: '#6b8299',
          letterSpacing: '0.04em', textTransform: 'uppercase',
        }}>
          {label}
        </span>
        {/* Selected badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '3px 10px', borderRadius: 99,
          background: `${selected.color}14`,
          border: `1px solid ${selected.color}30`,
        }}>
          <span style={{ fontSize: 12 }}>{selected.flag}</span>
          <span style={{ fontSize: 11, fontWeight: 800, color: selected.color }}>{selected.code}</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: selected.color, opacity: 0.75 }}>· {selected.symbol}</span>
        </div>
      </div>

      {/* Pills grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: compact ? 'repeat(4, 1fr)' : 'repeat(4, 1fr)',
        gap: 6,
      }}>
        {AVIA_CURRENCIES.map((cur) => {
          const isSelected = cur.code === value;
          return (
            <motion.button
              key={cur.code}
              whileTap={{ scale: 0.95 }}
              onClick={() => onChange(cur.code)}
              type="button"
              title={cur.name}
              style={{
                padding: compact ? '8px 4px' : '9px 6px',
                borderRadius: 11,
                border: `1.5px solid ${isSelected ? cur.color + '50' : '#ffffff10'}`,
                background: isSelected ? `${cur.color}12` : '#ffffff05',
                cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                transition: 'border-color 0.18s, background 0.18s',
                boxShadow: isSelected ? `0 0 12px ${cur.color}18` : 'none',
              }}
            >
              <span style={{ fontSize: 16, lineHeight: 1 }}>{cur.flag}</span>
              <span style={{
                fontSize: 10, fontWeight: 800,
                color: isSelected ? cur.color : '#4a6080',
                letterSpacing: '0.02em',
              }}>
                {cur.code}
              </span>
              {!compact && (
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  color: isSelected ? cur.color : '#3a5070',
                  opacity: isSelected ? 1 : 0.7,
                }}>
                  {cur.symbol}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Selected currency full name */}
      {!compact && (
        <div style={{
          marginTop: 8, padding: '7px 12px', borderRadius: 9,
          background: `${selected.color}08`, border: `1px solid ${selected.color}18`,
          display: 'flex', alignItems: 'center', gap: 7,
        }}>
          <span style={{ fontSize: 14 }}>{selected.flag}</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: selected.color }}>
            {selected.name}
          </span>
          <span style={{ fontSize: 11, color: '#3a5070', marginLeft: 'auto', fontWeight: 700 }}>
            {selected.symbol}
          </span>
        </div>
      )}
    </div>
  );
}
