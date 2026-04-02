// ── Пакет M: Клиентская фильтрация AVIA ────────────────────────────────────────
// Изолировано от CARGO. Не делает сетевых запросов — работает на уже загруженных данных.

import type { AviaFlight, AviaRequest } from './aviaApi';

// ── Типы ─────────────────────────────────────────────────────────────────────

export interface AviaFilterState {
  from?: string;
  to?: string;
  date?: string;       // YYYY-MM-DD — точная дата (вылет / до)
  weightMin?: number;
  weightMax?: number;
  priceMin?: number;   // только для рейсов
  priceMax?: number;   // только для рейсов
  onlyMine?: boolean;
}

export const EMPTY_FILTER_STATE: AviaFilterState = {};

// ── Хелперы ──────────────────────────────────────────────────────────────────

function strMatch(value: string | undefined, query: string): boolean {
  if (!query.trim()) return true;
  if (!value) return false;
  return value.toLowerCase().includes(query.toLowerCase().trim());
}

// ── Применение фильтров ───────────────────────────────────────────────────────

export function applyFlightFilters(
  flights: AviaFlight[],
  f: AviaFilterState,
  myPhone?: string,
): AviaFlight[] {
  return flights.filter(fl => {
    if (f.from && !strMatch(fl.from, f.from)) return false;
    if (f.to   && !strMatch(fl.to,   f.to))   return false;
    if (f.date) {
      const flDate = fl.date.slice(0, 10);
      if (flDate !== f.date) return false;
    }
    if (f.weightMin && f.weightMin > 0 && (fl.freeKg || 0) < f.weightMin) return false;
    if (f.weightMax && f.weightMax > 0 && (fl.freeKg || 0) > f.weightMax) return false;
    if (f.priceMin  && f.priceMin  > 0 && (fl.pricePerKg || 0) < f.priceMin) return false;
    if (f.priceMax  && f.priceMax  > 0 && (fl.pricePerKg || 0) > f.priceMax) return false;
    if (f.onlyMine && myPhone && fl.courierId !== myPhone) return false;
    return true;
  });
}

export function applyRequestFilters(
  requests: AviaRequest[],
  f: AviaFilterState,
  myPhone?: string,
): AviaRequest[] {
  return requests.filter(r => {
    if (f.from && !strMatch(r.from, f.from)) return false;
    if (f.to   && !strMatch(r.to,   f.to))   return false;
    if (f.date) {
      // Показываем заявки, deadline которых >= выбранной даты
      if (r.beforeDate.slice(0, 10) < f.date) return false;
    }
    if (f.weightMin && f.weightMin > 0 && (r.weightKg || 0) < f.weightMin) return false;
    if (f.weightMax && f.weightMax > 0 && (r.weightKg || 0) > f.weightMax) return false;
    if (f.onlyMine && myPhone && r.senderId !== myPhone) return false;
    return true;
  });
}

// ── Chip-теги ─────────────────────────────────────────────────────────────────

export interface FilterChip {
  key: string;
  label: string;
  field: keyof AviaFilterState;
}

function fmtDate(d: string): string {
  try {
    return new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  } catch { return d; }
}

export function getFilterChips(f: AviaFilterState): FilterChip[] {
  const chips: FilterChip[] = [];
  if (f.from)                              chips.push({ key: 'from',      label: `Откуда: ${f.from}`,        field: 'from'      });
  if (f.to)                                chips.push({ key: 'to',        label: `Куда: ${f.to}`,            field: 'to'        });
  if (f.date)                              chips.push({ key: 'date',      label: fmtDate(f.date),            field: 'date'      });
  if (f.weightMin && f.weightMin > 0)      chips.push({ key: 'weightMin', label: `От ${f.weightMin} кг`,     field: 'weightMin' });
  if (f.weightMax && f.weightMax > 0)      chips.push({ key: 'weightMax', label: `До ${f.weightMax} кг`,     field: 'weightMax' });
  if (f.priceMin  && f.priceMin  > 0)      chips.push({ key: 'priceMin',  label: `Цена от $${f.priceMin}`,   field: 'priceMin'  });
  if (f.priceMax  && f.priceMax  > 0)      chips.push({ key: 'priceMax',  label: `Цена до $${f.priceMax}`,   field: 'priceMax'  });
  if (f.onlyMine)                          chips.push({ key: 'onlyMine',  label: 'Только мои',               field: 'onlyMine'  });
  return chips;
}

export function countActiveFilters(f: AviaFilterState): number {
  return getFilterChips(f).length;
}

export function removeFilterChip(
  f: AviaFilterState,
  field: keyof AviaFilterState,
): AviaFilterState {
  const next = { ...f };
  delete next[field];
  return next;
}
