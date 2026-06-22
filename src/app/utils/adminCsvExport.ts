// Единая CSV-экспорт-утилита для списков в админ-панели (Users/Drivers/Trips/
// Offers/Cargos/AviaUsers/AviaCards/аудит-логи/дашборд) — раньше была
// скопирована в каждый файл по отдельности.
export function exportCsv(rows: Record<string, unknown>[], filename: string) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const esc = (v: unknown) => {
    const s = String(v ?? '').replace(/"/g, '""');
    return /[,"\n]/.test(s) ? `"${s}"` : s;
  };
  const csv = [keys.join(','), ...rows.map(r => keys.map(k => esc(r[k])).join(','))].join('\n');
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })),
    download: filename,
  });
  a.click();
  URL.revokeObjectURL(a.href);
}
