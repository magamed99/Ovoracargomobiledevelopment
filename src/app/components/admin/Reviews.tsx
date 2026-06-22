import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router';
import { Star, MessageSquare, Search, RefreshCw, ChevronDown, ChevronUp, Layers, Trash2, Route } from 'lucide-react';
import { toast } from 'sonner';
import { getAdminReviews, deleteAdminReview } from '../../api/dataApi';
import { AdminPageHeader, HeaderBtn, FilterChips, SkeletonList } from './AdminPageHeader';
import { StarRow } from '../ui/StarRow';

function RelTime({ iso }: { iso?: string }) {
  if (!iso) return <span>—</span>;
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return <span>{Math.max(0, mins)} мин. назад</span>;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return <span>{hrs} ч. назад</span>;
  return <span>{new Date(iso).toLocaleDateString('ru-RU')}</span>;
}

const RATING_COLOR: Record<number, { bg: string; text: string; border: string }> = {
  5: { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' },
  4: { bg: '#f0fdf4', text: '#16a34a', border: '#d1fae5' },
  3: { bg: '#fffbeb', text: '#b45309', border: '#fde68a' },
  2: { bg: '#fff7ed', text: '#c2410c', border: '#fed7aa' },
  1: { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
};

function ReviewCard({
  review,
  isExpanded,
  onToggleExpand,
  onDelete,
  deleting,
}: {
  review: any;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const rating = review.rating || 0;
  const authorName = review.authorName || review.authorEmail || '—';
  const targetName = review.targetName || review.targetEmail || '—';
  const comment = review.text || review.comment || review.message || '';
  const initials = (authorName[0] || '?').toUpperCase();
  const colors = RATING_COLOR[rating] || RATING_COLOR[3];

  return (
    <div
      className="bg-white rounded-2xl overflow-hidden transition-shadow hover:shadow-md"
      style={{ border: `1px solid ${colors.border}` }}
    >
      <div className="p-3 sm:p-4">
        <div className="flex items-start gap-2 sm:gap-3">
          {/* Rating circle */}
          <div
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex flex-col items-center justify-center flex-shrink-0"
            style={{ background: colors.bg }}
          >
            <span className="text-sm font-black" style={{ color: colors.text }}>{rating}</span>
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
          </div>

          {/* Author avatar */}
          <div
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
            style={{
              background: rating >= 4
                ? 'linear-gradient(135deg,#059669,#10b981)'
                : rating === 3
                ? 'linear-gradient(135deg,#d97706,#f59e0b)'
                : 'linear-gradient(135deg,#dc2626,#ef4444)',
            }}
          >
            {initials}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <StarRow value={rating} />
              <span className="text-xs text-gray-400">
                <RelTime iso={review.createdAt} />
              </span>
              {review.role && (
                <span
                  className="px-2 py-0.5 rounded-full text-[11px] font-semibold"
                  style={{ background: '#f1f5f9', color: '#64748b' }}
                >
                  {review.role === 'driver' ? '🚛 Водитель' : '📦 Отправитель'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-sm flex-wrap">
              <span className="font-semibold text-gray-900 break-words">{authorName}</span>
              <span className="text-gray-300">→</span>
              <span className="text-gray-500 break-words">{targetName}</span>
            </div>
            {comment ? (
              <p className={`text-sm text-gray-600 mt-2 leading-relaxed break-words ${!isExpanded && comment.length > 160 ? 'line-clamp-2' : ''}`}>
                "{comment}"
              </p>
            ) : (
              <p className="text-xs text-gray-400 italic mt-2">Без комментария</p>
            )}
          </div>

          {comment && comment.length > 160 && (
            <button
              onClick={onToggleExpand}
              className="p-1.5 hover:bg-gray-100 rounded-xl text-gray-400 transition-colors flex-shrink-0 self-start"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>

        {isExpanded && (
          <div className="mt-3 pt-3 grid grid-cols-2 md:grid-cols-3 gap-3" style={{ borderTop: '1px solid #f0f4f8' }}>
            {[
              { label: 'Email автора', value: review.authorEmail || '—' },
              { label: 'Email получателя', value: review.targetEmail || '—' },
              { label: 'ID отзыва', value: review.reviewId?.slice(0, 16) + '...' || '—' },
              review.tripId && { label: 'ID поездки', value: review.tripId?.slice(0, 16) + '...' },
            ].filter(Boolean).map((f: any) => (
              <div key={f.label}>
                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1">{f.label}</p>
                <p className="text-xs text-gray-700 font-mono break-all">{f.value}</p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-3 pt-3 flex justify-end" style={{ borderTop: '1px solid #f8fafc' }}>
          <button
            onClick={e => { e.stopPropagation(); onDelete(); }}
            disabled={deleting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {deleting ? 'Удаление...' : 'Удалить отзыв'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function Reviews() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [groupBy, setGroupBy] = useState<'none' | 'trip' | 'recipient'>('none');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchParams] = useSearchParams();

  // Переход из глобального поиска в шапке админки (AdminLayout)
  useEffect(() => {
    const q = searchParams.get('q');
    const expand = searchParams.get('expand');
    if (q) setSearchQuery(q);
    if (expand) setExpandedId(expand);
  }, [searchParams]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAdminReviews();
      setReviews(data || []);
    } catch {
      toast.error('Ошибка загрузки отзывов');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (review: any) => {
    if (!review.reviewId) return;
    if (!confirm(`Удалить отзыв от ${review.authorName || review.authorEmail || 'пользователя'}? Это действие для модерации/разрешения спора.`)) return;
    setDeletingId(review.reviewId);
    try {
      await deleteAdminReview(review.reviewId);
      setReviews(prev => prev.filter(r => r.reviewId !== review.reviewId));
      toast.success('Отзыв удалён');
    } catch {
      toast.error('Ошибка при удалении отзыва');
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = reviews
    .filter(r => {
      if (!r) return false;
      const q = searchQuery.toLowerCase();
      const matchSearch = !q
        || (r.authorName || r.authorEmail || '').toLowerCase().includes(q)
        || (r.targetName || r.targetEmail || '').toLowerCase().includes(q)
        || (r.text || r.comment || '').toLowerCase().includes(q)
        || (r.tripId || '').toLowerCase().includes(q);
      const rating = r.rating || 0;
      const matchRating = ratingFilter === 'all'
        || (ratingFilter === '5' && rating === 5)
        || (ratingFilter === '4' && rating === 4)
        || (ratingFilter === '1-3' && rating <= 3);
      const matchRole = roleFilter === 'all' || r.role === roleFilter;
      return matchSearch && matchRating && matchRole;
    })
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + (r?.rating || 0), 0) / reviews.length)
    : 0;

  const ratingCounts = [5, 4, 3, 2, 1].map(n => ({
    stars: n,
    count: reviews.filter(r => r?.rating === n).length,
    pct: reviews.length > 0 ? (reviews.filter(r => r?.rating === n).length / reviews.length) * 100 : 0,
  }));

  const excellentPct = reviews.length > 0
    ? Math.round((reviews.filter(r => (r?.rating || 0) >= 4).length / reviews.length) * 100)
    : 0;

  const tripGroups = groupBy === 'trip'
    ? Object.entries(
        filtered.reduce((acc: Record<string, any[]>, r) => {
          const key = r.tripId || 'без поездки';
          (acc[key] = acc[key] || []).push(r);
          return acc;
        }, {})
      ).sort((a, b) => new Date(b[1][0]?.createdAt || 0).getTime() - new Date(a[1][0]?.createdAt || 0).getTime())
    : [];

  const recipientGroups = groupBy === 'recipient'
    ? Object.entries(
        filtered.reduce((acc: Record<string, any[]>, r) => {
          const key = r.targetEmail || r.targetName || 'без получателя';
          (acc[key] = acc[key] || []).push(r);
          return acc;
        }, {})
      ).sort((a, b) => b[1].length - a[1].length)
    : [];

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Отзывы и рейтинги"
        subtitle="Оценки пользователей после поездок"
        icon={MessageSquare}
        gradient="linear-gradient(135deg,#d97706,#f59e0b)"
        accent="#d97706"
        stats={[
          { label: 'Всего отзывов', value: reviews.length },
          { label: 'Средний рейтинг', value: avgRating > 0 ? `★ ${avgRating.toFixed(1)}` : '—' },
          { label: 'Отличных', value: `${excellentPct}%` },
        ]}
        actions={
          <>
            <HeaderBtn
              icon={Layers}
              onClick={() => setGroupBy(g => g === 'none' ? 'trip' : g === 'trip' ? 'recipient' : 'none')}
            >
              {groupBy === 'none' ? 'По поездкам' : groupBy === 'trip' ? 'По получателям' : 'Список'}
            </HeaderBtn>
            <HeaderBtn icon={RefreshCw} onClick={load}>Обновить</HeaderBtn>
          </>
        }
      />

      {/* ── Rating overview ── */}
      {reviews.length > 0 && (
        <div className="bg-white rounded-2xl p-4 sm:p-5" style={{ border: '1px solid #f0f4f8' }}>
          <div className="flex flex-col md:flex-row gap-6 items-stretch md:items-center">
            {/* Big avg */}
            <div className="text-center flex-shrink-0">
              <div
                className="w-24 h-24 rounded-2xl flex flex-col items-center justify-center mx-auto mb-2"
                style={{ background: 'linear-gradient(135deg,#fef3c7,#fde68a)' }}
              >
                <p className="text-3xl font-black text-amber-700">{avgRating.toFixed(1)}</p>
                <StarRow value={Math.round(avgRating)} size="sm" />
              </div>
              <p className="text-xs text-gray-500">{reviews.length} отзывов</p>
            </div>

            {/* Bars */}
            <div className="flex-1 w-full space-y-2">
              {ratingCounts.map(({ stars, count, pct }) => (
                <button
                  key={stars}
                  onClick={() => setRatingFilter(stars <= 3 ? '1-3' : String(stars))}
                  className="flex items-center gap-2 w-full group"
                >
                  <span className="text-xs font-bold text-gray-600 w-3">{stars}</span>
                  <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                  <div className="flex-1 rounded-full h-2.5 overflow-hidden" style={{ background: '#f1f5f9' }}>
                    <div
                      className="h-2.5 rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        background: stars >= 4 ? '#10b981' : stars === 3 ? '#f59e0b' : '#ef4444',
                      }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-6 text-right">{count}</span>
                </button>
              ))}
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-3 w-full md:w-auto flex-shrink-0">
              {[
                { label: 'Отлично (4–5★)', value: reviews.filter(r => (r?.rating || 0) >= 4).length, color: '#10b981', bg: '#f0fdf4' },
                { label: 'Нейтрально (3★)', value: reviews.filter(r => (r?.rating || 0) === 3).length, color: '#f59e0b', bg: '#fffbeb' },
                { label: 'Плохо (1–2★)', value: reviews.filter(r => (r?.rating || 0) <= 2 && r?.rating).length, color: '#ef4444', bg: '#fef2f2' },
                { label: 'Без оценки', value: reviews.filter(r => !r?.rating).length, color: '#94a3b8', bg: '#f8fafc' },
              ].map(s => (
                <div key={s.label} className="px-3 py-2 rounded-xl text-center" style={{ background: s.bg }}>
                  <p className="text-lg font-bold" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-[11px] text-gray-500 leading-tight">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Filters ── */}
      <div className="bg-white rounded-2xl p-4 space-y-3" style={{ border: '1px solid #f0f4f8' }}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Поиск по автору, получателю или тексту..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-gray-700 outline-none transition-all"
            style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
            onFocus={e => { e.currentTarget.style.borderColor = '#f59e0b66'; e.currentTarget.style.boxShadow = '0 0 0 3px #f59e0b12'; }}
            onBlur={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}
          />
        </div>
        <FilterChips
          value={ratingFilter as any}
          onChange={setRatingFilter as any}
          options={[
            { value: 'all', label: 'Все оценки', count: reviews.length },
            { value: '5', label: '★★★★★ 5 звёзд', count: ratingCounts[0].count },
            { value: '4', label: '★★★★ 4 звезды', count: ratingCounts[1].count },
            { value: '1-3', label: '≤3 звезды', count: ratingCounts.slice(2).reduce((s, r) => s + r.count, 0) },
          ]}
        />
        <FilterChips
          value={roleFilter}
          onChange={setRoleFilter}
          options={[
            { value: 'all', label: 'Все авторы', count: reviews.length },
            { value: 'driver', label: '🚛 От водителей', count: reviews.filter(r => r?.role === 'driver').length },
            { value: 'sender', label: '📦 От отправителей', count: reviews.filter(r => r?.role === 'sender').length },
          ]}
        />
      </div>

      {/* ── Reviews list ── */}
      {loading ? (
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #f0f4f8' }}>
          <SkeletonList rows={4} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl py-16 text-center" style={{ border: '1px solid #f0f4f8' }}>
          <MessageSquare className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">
            {reviews.length === 0 ? 'Отзывов пока нет' : 'Отзывы не найдены'}
          </p>
          {reviews.length === 0 && (
            <p className="text-gray-400 text-sm mt-1">Отзывы появятся после завершения первых поездок</p>
          )}
        </div>
      ) : groupBy === 'trip' ? (
        <div className="space-y-5">
          {tripGroups.map(([tripId, groupReviews]) => (
            <div key={tripId} className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <Route className="w-4 h-4 text-gray-400" />
                <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                  {tripId === 'без поездки' ? 'Без привязки к поездке' : `Поездка #${tripId.slice(0, 12)}...`}
                </p>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ background: '#f1f5f9', color: '#64748b' }}>
                  {groupReviews.length}
                </span>
              </div>
              <div className="space-y-3">
                {groupReviews.map(review => (
                  <ReviewCard
                    key={review.reviewId}
                    review={review}
                    isExpanded={expandedId === review.reviewId}
                    onToggleExpand={() => setExpandedId(expandedId === review.reviewId ? null : review.reviewId)}
                    onDelete={() => handleDelete(review)}
                    deleting={deletingId === review.reviewId}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : groupBy === 'recipient' ? (
        <div className="space-y-5">
          {recipientGroups.map(([recipient, groupReviews]) => (
            <div key={recipient} className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <Layers className="w-4 h-4 text-gray-400" />
                <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                  {groupReviews[0]?.targetName || recipient}
                </p>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ background: '#f1f5f9', color: '#64748b' }}>
                  {groupReviews.length}
                </span>
              </div>
              <div className="space-y-3">
                {groupReviews.map(review => (
                  <ReviewCard
                    key={review.reviewId}
                    review={review}
                    isExpanded={expandedId === review.reviewId}
                    onToggleExpand={() => setExpandedId(expandedId === review.reviewId ? null : review.reviewId)}
                    onDelete={() => handleDelete(review)}
                    deleting={deletingId === review.reviewId}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(review => (
            <ReviewCard
              key={review.reviewId}
              review={review}
              isExpanded={expandedId === review.reviewId}
              onToggleExpand={() => setExpandedId(expandedId === review.reviewId ? null : review.reviewId)}
              onDelete={() => handleDelete(review)}
              deleting={deletingId === review.reviewId}
            />
          ))}
        </div>
      )}

      <p className="text-xs text-gray-400 text-center">
        Показано {filtered.length} из {reviews.length} отзывов
      </p>
    </div>
  );
}