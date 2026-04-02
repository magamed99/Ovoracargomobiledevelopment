// ── AirportAutocomplete — автокомплит аэропортов для модуля AVIA ─────────────
// Переиспользуемый компонент: CreateFlightModal, CreateRequestModal, AviaFilterSheet

import { useState, useRef, useEffect, useCallback } from 'react';
import { MapPin, Plane, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { searchAirports, formatAirport } from '../../data/airports';
import type { Airport } from '../../data/airports';

interface AirportAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  accentColor?: string;
  iconColor?: string;
  inputStyle?: React.CSSProperties;
  /** Показывать иконку MapPin слева */
  showIcon?: boolean;
}

// Флажки стран
const FLAG: Record<string, string> = {
  TJ: '\u{1F1F9}\u{1F1EF}', UZ: '\u{1F1FA}\u{1F1FF}', KZ: '\u{1F1F0}\u{1F1FF}',
  KG: '\u{1F1F0}\u{1F1EC}', TM: '\u{1F1F9}\u{1F1F2}', RU: '\u{1F1F7}\u{1F1FA}',
  TR: '\u{1F1F9}\u{1F1F7}', AE: '\u{1F1E6}\u{1F1EA}', CN: '\u{1F1E8}\u{1F1F3}',
  KR: '\u{1F1F0}\u{1F1F7}', JP: '\u{1F1EF}\u{1F1F5}', IN: '\u{1F1EE}\u{1F1F3}',
  DE: '\u{1F1E9}\u{1F1EA}', GB: '\u{1F1EC}\u{1F1E7}', FR: '\u{1F1EB}\u{1F1F7}',
  IT: '\u{1F1EE}\u{1F1F9}', ES: '\u{1F1EA}\u{1F1F8}', NL: '\u{1F1F3}\u{1F1F1}',
  CH: '\u{1F1E8}\u{1F1ED}', AT: '\u{1F1E6}\u{1F1F9}', CZ: '\u{1F1E8}\u{1F1FF}',
  PL: '\u{1F1F5}\u{1F1F1}', GR: '\u{1F1EC}\u{1F1F7}', FI: '\u{1F1EB}\u{1F1EE}',
  GE: '\u{1F1EC}\u{1F1EA}', AZ: '\u{1F1E6}\u{1F1FF}', AM: '\u{1F1E6}\u{1F1F2}',
  BY: '\u{1F1E7}\u{1F1FE}', QA: '\u{1F1F6}\u{1F1E6}', SA: '\u{1F1F8}\u{1F1E6}',
  IL: '\u{1F1EE}\u{1F1F1}', IR: '\u{1F1EE}\u{1F1F7}', AF: '\u{1F1E6}\u{1F1EB}',
  PK: '\u{1F1F5}\u{1F1F0}', US: '\u{1F1FA}\u{1F1F8}', EG: '\u{1F1EA}\u{1F1EC}',
  TH: '\u{1F1F9}\u{1F1ED}', MY: '\u{1F1F2}\u{1F1FE}', SG: '\u{1F1F8}\u{1F1EC}',
};

export function AirportAutocomplete({
  value,
  onChange,
  placeholder = 'Город или код',
  accentColor = '#0ea5e9',
  iconColor,
  inputStyle: extInputStyle,
  showIcon = true,
}: AirportAutocompleteProps) {
  const [inputVal, setInputVal] = useState(value);
  const [results, setResults] = useState<Airport[]>([]);
  const [open, setOpen] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync external value → input
  useEffect(() => {
    if (value !== inputVal) setInputVal(value);
  }, [value]); // eslint-disable-line

  const doSearch = useCallback((q: string) => {
    if (q.length < 1) { setResults([]); setOpen(false); return; }
    const found = searchAirports(q, 8);
    setResults(found);
    setOpen(found.length > 0);
    setHighlightIdx(-1);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setInputVal(v);
    onChange(v); // external sync (text mode)
    doSearch(v);
  };

  const handleSelect = (airport: Airport) => {
    const formatted = formatAirport(airport);
    setInputVal(formatted);
    onChange(formatted);
    setOpen(false);
    setResults([]);
    inputRef.current?.blur();
  };

  const handleClear = () => {
    setInputVal('');
    onChange('');
    setResults([]);
    setOpen(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIdx(prev => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIdx(prev => (prev <= 0 ? results.length - 1 : prev - 1));
    } else if (e.key === 'Enter' && highlightIdx >= 0) {
      e.preventDefault();
      handleSelect(results[highlightIdx]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const handleFocus = () => {
    if (inputVal.length >= 1) doSearch(inputVal);
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const baseInput: React.CSSProperties = {
    width: '100%',
    padding: showIcon ? '12px 34px 12px 34px' : '12px 34px 12px 14px',
    borderRadius: open ? '12px 12px 0 0' : 12,
    border: `1.5px solid ${open ? accentColor + '40' : '#ffffff12'}`,
    background: '#ffffff08',
    color: '#fff',
    fontSize: 14,
    fontWeight: 500,
    outline: 'none',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.2s, border-radius 0.15s',
    ...extInputStyle,
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', flex: 1 }}>
      {/* Icon */}
      {showIcon && (
        <MapPin style={{
          position: 'absolute', left: 12, top: 14, zIndex: 2,
          width: 14, height: 14, color: iconColor || '#4a6080',
          pointerEvents: 'none',
        }} />
      )}

      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        value={inputVal}
        onChange={handleChange}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        style={baseInput}
      />

      {/* Clear button */}
      {inputVal && (
        <button
          onMouseDown={(e) => { e.preventDefault(); handleClear(); }}
          style={{
            position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
            width: 18, height: 18, borderRadius: 5, zIndex: 2,
            border: 'none', background: '#ffffff12',
            color: '#6b8299', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
          }}
        >
          <X style={{ width: 10, height: 10 }} />
        </button>
      )}

      {/* Dropdown */}
      <AnimatePresence>
        {open && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute', top: '100%', left: 0, right: 0,
              zIndex: 120,
              background: '#07111f',
              border: `1.5px solid ${accentColor}30`,
              borderTop: 'none',
              borderRadius: '0 0 12px 12px',
              overflow: 'hidden',
              boxShadow: '0 12px 32px rgba(0,0,0,0.65)',
              maxHeight: 280,
              overflowY: 'auto',
            }}
          >
            {results.map((airport, idx) => {
              const isHL = idx === highlightIdx;
              const flag = FLAG[airport.countryCode] || '';
              return (
                <button
                  key={`${airport.code}-${idx}`}
                  onMouseDown={(e) => { e.preventDefault(); handleSelect(airport); }}
                  onMouseEnter={() => setHighlightIdx(idx)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px', background: isHL ? '#ffffff0a' : 'transparent',
                    border: 'none', cursor: 'pointer', textAlign: 'left',
                    borderBottom: idx < results.length - 1 ? '1px solid #ffffff06' : 'none',
                    transition: 'background 0.1s',
                  }}
                >
                  {/* IATA badge */}
                  <div style={{
                    width: 38, height: 32, borderRadius: 8,
                    background: `${accentColor}14`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <span style={{
                      fontSize: 12, fontWeight: 900, color: accentColor,
                      letterSpacing: '0.06em',
                    }}>
                      {airport.code}
                    </span>
                  </div>

                  {/* Text */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 13, fontWeight: 700, color: '#fff',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {airport.city}
                    </div>
                    <div style={{
                      fontSize: 10, color: '#4a6080', fontWeight: 500,
                      display: 'flex', alignItems: 'center', gap: 4, marginTop: 1,
                    }}>
                      <Plane style={{ width: 9, height: 9, flexShrink: 0 }} />
                      <span style={{
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {airport.name}
                      </span>
                    </div>
                  </div>

                  {/* Country */}
                  <span style={{
                    fontSize: 10, color: '#3d5268', fontWeight: 600,
                    flexShrink: 0, display: 'flex', alignItems: 'center', gap: 3,
                  }}>
                    {flag && <span style={{ fontSize: 12 }}>{flag}</span>}
                    {airport.country}
                  </span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
