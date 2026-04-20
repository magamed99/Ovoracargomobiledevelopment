import { useState } from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
  className?: string;
}

export function SearchBar({ value, onChange, className = '' }: SearchBarProps) {
  const [focused, setFocused] = useState(false);

  return (
    <div className={className}>
      <div
        className="relative flex items-center w-full h-10 sm:h-11 rounded-2xl border overflow-hidden transition-all"
        style={{
          background: focused ? 'rgba(91,163,245,0.08)' : 'rgba(255,255,255,0.05)',
          borderColor: focused ? 'rgba(91,163,245,0.35)' : 'rgba(255,255,255,0.08)',
        }}
      >
        <div className="grid place-items-center h-full w-10 sm:w-11 shrink-0 text-[#607080]">
          <Search className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
        </div>
        <input
          className="flex-1 h-full border-none outline-none text-[13px] sm:text-[14px] pr-3 sm:pr-4 bg-transparent text-white placeholder-[#607080] font-['Sora']"
          placeholder="Поиск по сообщениям..."
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="mr-2 sm:mr-3 w-5 h-5 rounded-full bg-white/10 flex items-center justify-center shrink-0"
          >
            <span className="text-[10px] text-[#607080]">✕</span>
          </button>
        )}
      </div>
    </div>
  );
}
