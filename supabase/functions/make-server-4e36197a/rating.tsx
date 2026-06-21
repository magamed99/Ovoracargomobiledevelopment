// rating.tsx — общая формула расчёта среднего рейтинга, юнит-тестируется отдельно.
export function calculateAverageRating(ratings: number[]): number {
  const valid = ratings.map(r => Number(r) || 0);
  if (valid.length === 0) return 0;
  const sum = valid.reduce((acc, r) => acc + r, 0);
  return Math.round((sum / valid.length) * 10) / 10;
}
