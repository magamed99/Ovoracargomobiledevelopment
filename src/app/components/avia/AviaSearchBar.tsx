// ── Пакет M: Строка поиска AVIA с историей и дебаунсом ─────────────────────────

import { useState, useEffect, useRef } from 'react';
import { Search, X, Clock, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  getSearchHistory,
  addToSearchHistory,
  clearSearchHistory,
} from './AviaSearchHistory';
import type { SearchHistoryItem } from './AviaSearchHistory';

interface AviaSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  accentColor?: string;
}

export function AviaSearchBar({
  value,
  onChange,
  placeholder = 'Поиск...',
  accentColor = '#0ea5e9',
}: AviaSearchBarProps) {
  const [inputValue, setInputValue] = useState(value);
  const [focused, setFocused] = useState(false);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Синхронизация входящего value → input (при сбросе снаружи)
  useEffect(() => {
    if (value !== inputValue) setInputValue(value);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  // Дебаунс 400 мс
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onChange(inputValue);
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [inputValue]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFocus = () => {
    setHistory(getSearchHistory());
    setFocused(true);
  };

  const handleBlur = () => {
    setTimeout(() => {
      if (!containerRef.current?.contains(document.activeElement)) {
        setFocused(false);
        if (inputValue.trim().length >= 2) {
          addToSearchHistory(inputValue.trim());
        }
      }
    }, 160);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      inputRef.current?.blur();
      if (inputValue.trim().length >= 2) {
        addToSearchHistory(inputValue.trim());
      }
    }
    if (e.key === 'Escape') {
      setInputValue('');
      onChange('');
      inputRef.current?.blur();
    }
  };

  const handleHistoryClick = (query: string) => {
    setInputValue(query);
    onChange(query);
    setFocused(false);
  };

  const handleClearHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    clearSearchHistory();
    setHistory([]);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setInputValue('');
    onChange('');
    inputRef.current?.focus();
  };

  const showHistory = focused && history.length > 0 && !inputValue;
  const isActive = focused || !!inputValue;

  return (
    <div ref={containerRef} style={{ flex: 1, position: 'relative' }}>
      {/* ── Поле ввода ─────────────────────────────────────────── */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <Search
          style={{
            width: 14, height: 14,
            color: isActive ? accentColor : '#4a6080',
            position: 'absolute', left: 10,
            pointerEvents: 'none',
            transition: 'color 0.2s',
            flexShrink: 0,
          }}
        />
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          style={{
            width: '100%',
            padding: '9px 32px 9px 30px',
            borderRadius: showHistory ? '10px 10px 0 0' : 10,
            border: `1px solid ${isActive ? accentColor + '40' : '#ffffff10'}`,
            borderBottom: showHistory ? 'none' : undefined,
            background: '#ffffff06',
            color: '#fff',
            fontSize: 12,
            fontWeight: 500,
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'border-color 0.2s, border-radius 0.15s',
          }}
        />
        <AnimatePresence>
          {inputValue && (
            <motion.button
              initial={{ opacity: 0, scale: 0.75 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.75 }}
              transition={{ duration: 0.12 }}
              onMouseDown={handleClear}
              style={{
                position: 'absolute', right: 7,
                width: 18, height: 18, borderRadius: 5,
                border: 'none', background: '#ffffff12',
                color: '#6b8299', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 0,
              }}
            >
              <X style={{ width: 10, height: 10 }} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* ── История поиска ────────────────────────────────────── */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute', top: '100%', left: 0, right: 0,
              background: '#07111f',
              border: `1px solid ${accentColor}28`,
              borderTop: 'none',
              borderRadius: '0 0 10px 10px',
              zIndex: 80,
              overflow: 'hidden',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            }}
          >
            {/* Шапка */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '6px 10px 5px',
              borderBottom: '1px solid #ffffff08',
            }}>
              <span style={{
                fontSize: 9, fontWeight: 700, color: '#3d5268',
                letterSpacing: '0.07em', textTransform: 'uppercase',
              }}>
                История
              </span>
              <button
                onMouseDown={handleClearHistory}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#4a6080', display: 'flex', alignItems: 'center', gap: 3,
                  fontSize: 9, fontWeight: 600, padding: '2px 4px', borderRadius: 4,
                }}
              >
                <Trash2 style={{ width: 9, height: 9 }} />
                Очистить
              </button>
            </div>

            {/* Элементы */}
            {history.slice(0, 5).map((item, idx) => (
              <button
                key={item.query}
                onMouseDown={() => handleHistoryClick(item.query)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                  padding: '9px 12px', background: 'none', border: 'none',
                  cursor: 'pointer', textAlign: 'left',
                  borderBottom: idx < Math.min(history.length, 5) - 1 ? '1px solid #ffffff05' : 'none',
                  transition: 'background 0.12s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#ffffff07')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                <Clock style={{ width: 11, height: 11, color: '#3d5268', flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: '#8ea8b8', fontWeight: 500 }}>{item.query}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
