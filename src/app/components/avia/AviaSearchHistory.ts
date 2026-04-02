// ── История поиска AVIA (изолировано от CARGO: ключ ovora:avia-search-history) ─

const HISTORY_KEY = 'ovora:avia-search-history';
const MAX_ITEMS   = 8;

export interface SearchHistoryItem {
  query: string;
  timestamp: number;
}

export function getSearchHistory(): SearchHistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SearchHistoryItem[];
  } catch { return []; }
}

export function addToSearchHistory(query: string): void {
  const q = query.trim();
  if (!q || q.length < 2) return;
  try {
    const history = getSearchHistory().filter(h => h.query !== q);
    history.unshift({ query: q, timestamp: Date.now() });
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, MAX_ITEMS)));
  } catch {}
}

export function clearSearchHistory(): void {
  localStorage.removeItem(HISTORY_KEY);
}
