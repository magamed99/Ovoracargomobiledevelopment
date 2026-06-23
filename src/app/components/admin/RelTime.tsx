export function RelTime({ iso }: { iso?: string }) {
  if (!iso) return <span className="text-gray-400">—</span>;
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return <span>только что</span>;
  if (mins < 60) return <span>{mins} мин. назад</span>;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return <span>{hrs} ч. назад</span>;
  const days = Math.floor(hrs / 24);
  if (days < 30) return <span>{days} дн. назад</span>;
  return <span>{new Date(iso).toLocaleDateString('ru-RU')}</span>;
}
