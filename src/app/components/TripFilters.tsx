import { useState } from 'react';
import { Filter, X, Download, Calendar, MapPin, DollarSign, FileText } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'sonner';

export interface TripFilterOptions {
  dateRange: 'all' | 'today' | 'week' | 'month' | '3months' | 'year';
  status: 'all' | 'active' | 'completed' | 'cancelled';
  minPrice?: number;
  maxPrice?: number;
  searchQuery: string;
}

interface TripFiltersProps {
  filters: TripFilterOptions;
  onFiltersChange: (filters: TripFilterOptions) => void;
  onExport: (format: 'excel' | 'pdf') => void;
  tripCount: number;
}

export function TripFilters({ filters, onFiltersChange, onExport, tripCount }: TripFiltersProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [showFilters, setShowFilters] = useState(false);

  const txt = isDark ? 'text-white'     : 'text-[#0f172a]';
  const sub = isDark ? 'text-[#6b7f94]' : 'text-[#94a3b8]';
  const div = isDark ? 'border-[#1e2d3d]' : 'border-[#f0f2f5]';

  const inputCls = `w-full px-3 py-2 border-b outline-none text-sm transition-colors bg-transparent ${
    isDark
      ? 'border-b-[#1e2d3d] text-white placeholder-[#3d5263]'
      : 'border-b-[#f0f2f5] text-[#0f172a] placeholder-[#94a3b8]'
  }`;

  const dateRangeOptions = [
    { value: 'all', label: 'Всё время' },
    { value: 'today', label: 'Сегодня' },
    { value: 'week', label: 'Неделя' },
    { value: 'month', label: 'Месяц' },
    { value: '3months', label: '3 месяца' },
    { value: 'year', label: 'Год' },
  ];

  const statusOptions = [
    { value: 'all', label: 'Все статусы' },
    { value: 'active', label: 'Активные' },
    { value: 'completed', label: 'Завершенные' },
    { value: 'cancelled', label: 'Отмененные' },
  ];

  const handleReset = () => {
    onFiltersChange({ dateRange: 'all', status: 'all', minPrice: undefined, maxPrice: undefined, searchQuery: '' });
    toast.success('Фильтры сброшены');
  };

  const activeFiltersCount = [
    filters.dateRange !== 'all',
    filters.status !== 'all',
    filters.minPrice !== undefined,
    filters.maxPrice !== undefined,
    filters.searchQuery !== '',
  ].filter(Boolean).length;

  return (
    <div>
      {/* Filter Button Row */}
      <div className="flex items-center gap-0">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-[13px] font-semibold transition-colors border-b ${
            showFilters
              ? 'text-[#1978e5] border-b-[#1978e5]'
              : `${sub} ${div}`
          }`}
        >
          <Filter className="w-4 h-4" />
          <span>Фильтры</span>
          {activeFiltersCount > 0 && (
            <span className={`ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
              isDark ? 'bg-[#1978e5]/20 text-[#1978e5]' : 'bg-[#1978e5]/10 text-[#1978e5]'
            }`}>
              {activeFiltersCount}
            </span>
          )}
        </button>

        <button
          onClick={() => onExport('excel')}
          className={`flex items-center gap-1.5 px-4 py-3 text-[13px] font-semibold transition-colors border-b border-l ${
            isDark ? `text-emerald-400 border-[#1e2d3d]` : `text-emerald-600 border-[#f0f2f5]`
          }`}
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Excel</span>
        </button>

        <button
          onClick={() => onExport('pdf')}
          className={`flex items-center gap-1.5 px-4 py-3 text-[13px] font-semibold transition-colors border-b border-l ${
            isDark ? `text-rose-400 border-[#1e2d3d]` : `text-rose-600 border-[#f0f2f5]`
          }`}
        >
          <FileText className="w-4 h-4" />
          <span className="hidden sm:inline">PDF</span>
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className={`border-b ${div}`}>
          {/* Search */}
          <div className={`px-4 py-3 border-b ${div}`}>
            <label className={`flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider mb-1 ${sub}`}>
              <MapPin className="w-3 h-3" /> Поиск по маршруту
            </label>
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) => onFiltersChange({ ...filters, searchQuery: e.target.value })}
              placeholder="Душанбе, Худжанд..."
              className={inputCls}
            />
          </div>

          {/* Date Range */}
          <div className={`px-4 py-3 border-b ${div}`}>
            <label className={`flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider mb-2 ${sub}`}>
              <Calendar className="w-3 h-3" /> Период
            </label>
            <div className="flex flex-wrap gap-1.5">
              {dateRangeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => onFiltersChange({ ...filters, dateRange: option.value as any })}
                  className={`px-3 py-1.5 text-[11px] font-semibold transition-all ${
                    filters.dateRange === option.value
                      ? 'text-[#1978e5] border-b-2 border-[#1978e5]'
                      : `${sub}`
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div className={`px-4 py-3 border-b ${div}`}>
            <label className={`text-[10px] font-semibold uppercase tracking-wider mb-2 block ${sub}`}>Статус</label>
            <div className="flex flex-wrap gap-1.5">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => onFiltersChange({ ...filters, status: option.value as any })}
                  className={`px-3 py-1.5 text-[11px] font-semibold transition-all ${
                    filters.status === option.value
                      ? 'text-[#1978e5] border-b-2 border-[#1978e5]'
                      : `${sub}`
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div className={`px-4 py-3 border-b ${div}`}>
            <label className={`flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider mb-2 ${sub}`}>
              <DollarSign className="w-3 h-3" /> Диапазон цен (TJS)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                value={filters.minPrice || ''}
                onChange={(e) => onFiltersChange({ ...filters, minPrice: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="От"
                className={inputCls}
              />
              <input
                type="number"
                value={filters.maxPrice || ''}
                onChange={(e) => onFiltersChange({ ...filters, maxPrice: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="До"
                className={inputCls}
              />
            </div>
          </div>

          {/* Actions */}
          <div className={`px-4 py-3 flex items-center justify-between border-b ${div}`}>
            <button onClick={handleReset} className={`text-[13px] font-medium ${sub} active:opacity-60`}>
              Сбросить
            </button>
            <div className={`text-[12px] ${sub}`}>
              Найдено: <span className={`font-bold ${txt}`}>{tripCount}</span>
            </div>
            <button
              onClick={() => setShowFilters(false)}
              className="text-[13px] font-semibold text-[#1978e5] active:opacity-60"
            >
              Применить
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
