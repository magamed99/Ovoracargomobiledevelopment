// ── Общие утилиты AVIA-модуля ────────────────────────────────────────────────
// Изолированы от CARGO. Импортируйте только из этого файла.

// ── Даты ─────────────────────────────────────────────────────────────────────

/**
 * Форматирует ISO-дату в русскую локаль.
 * mode:
 *   'short' → "12 мая"          (день + месяц, без года)
 *   'full'  → "12 мая 2025 г."  (день + месяц + год) — по умолчанию
 *   'long'  → "12 мая 2025 г."  (месяц полностью: "12 мая 2025 г.")
 */
export function fmtDate(
  iso: string,
  mode: 'short' | 'full' | 'long' = 'full',
): string {
  try {
    const d = new Date(iso);
    if (mode === 'short') {
      return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    }
    if (mode === 'long') {
      return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
    }
    // 'full' — default
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

/**
 * Форматирует ISO-дату с временем: "12 мая 2025 г., 14:30"
 */
export function fmtDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('ru-RU', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

/**
 * Человекочитаемое относительное время:
 * "только что", "5 мин назад", "2 ч назад", "3 дн назад", или дата.
 */
export function relativeTime(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const s = Math.floor(diff / 1000);
    if (s < 60) return 'только что';
    const m = Math.floor(s / 60);
    if (m < 60) return `${m} мин назад`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} ч назад`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d} дн назад`;
    return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  } catch {
    return '';
  }
}

/** Алиас для обратной совместимости */
export const timeSince = relativeTime;

/**
 * "Сегодня" / "Вчера" / "N дн. назад"
 */
export function daysSince(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const days = Math.floor(diff / 86_400_000);
    if (days === 0) return 'Сегодня';
    if (days === 1) return 'Вчера';
    return `${days} дн. назад`;
  } catch {
    return '';
  }
}

// ── Телефон ───────────────────────────────────────────────────────────────────

/**
 * Маскирует телефон: +998 *** 5678
 */
export function maskPhone(phone: string): string {
  const d = phone.replace(/\D/g, '');
  if (d.length < 7) return `+${d}`;
  return `+${d.slice(0, 3)} *** ${d.slice(-4)}`;
}

// ── UI ────────────────────────────────────────────────────────────────────────

/**
 * Приветствие по времени суток.
 */
export function greet(): string {
  const h = new Date().getHours();
  if (h < 6)  return 'Доброй ночи';
  if (h < 12) return 'Доброе утро';
  if (h < 18) return 'Добрый день';
  return 'Добрый вечер';
}
