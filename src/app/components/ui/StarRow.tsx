import { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRowProps {
  value: number;
  onChange?: (v: number) => void;
  size?: 'sm' | 'md' | 'lg';
  readonly?: boolean;
}

/**
 * ⭐ Универсальный компонент рейтинга со звёздами
 * - Поддерживает интерактивный и read-only режимы
 * - 3 размера: sm, md, lg
 * - Hover эффект при редактировании
 */
export function StarRow({ value, onChange, size = 'md', readonly = false }: StarRowProps) {
  const [hovered, setHovered] = useState(0);
  
  // Размеры в Tailwind классах
  const sizeClass = size === 'lg' ? 'w-8 h-8' : size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5';
  
  const active = hovered || value;
  const isInteractive = !readonly && onChange;

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => isInteractive && onChange(star)}
          onMouseEnter={() => isInteractive && setHovered(star)}
          onMouseLeave={() => isInteractive && setHovered(0)}
          className={isInteractive ? 'cursor-pointer' : 'cursor-default'}
          disabled={!isInteractive}
        >
          <Star
            className={`${sizeClass} transition-all duration-150 ${
              star <= active 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-slate-300 fill-slate-200 dark:text-slate-600 dark:fill-slate-700'
            }`}
          />
        </button>
      ))}
    </div>
  );
}
