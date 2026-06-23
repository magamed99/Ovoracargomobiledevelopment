import { useMemo, useState } from 'react';

/**
 * Общая логика множественного выбора строк в admin-таблицах (чекбоксы +
 * "выбрать все видимые"). Раньше этот код был продублирован построчно
 * одинаково в UsersManagement/CargosManagement/OffersManagement/Reviews/
 * DocumentVerification — здесь он один раз.
 */
export function useBulkSelect<T>(visibleItems: T[], getId: (item: T) => string) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const allVisibleSelected = useMemo(
    () => visibleItems.length > 0 && visibleItems.every(item => selected.has(getId(item))),
    [visibleItems, getId, selected]
  );

  const toggleSelectAll = () => {
    setSelected(allVisibleSelected ? new Set() : new Set(visibleItems.map(getId)));
  };

  const clear = () => setSelected(new Set());

  return { selected, setSelected, toggleSelect, toggleSelectAll, allVisibleSelected, clear };
}
