import { useState } from 'react';
import { Star, ThumbsUp, MessageSquare } from 'lucide-react';

export function ReviewsPage() {
  const [activeTab, setActiveTab] = useState<'received' | 'given'>('received');

  const userRole = localStorage.getItem('userRole') || 'sender';

  const receivedReviews = [
    {
      id: 1,
      author: 'Алишер М.',
      avatar: 'А',
      rating: 5,
      date: '15 марта 2026',
      trip: 'Душанбе → Москва',
      comment: 'Отличный водитель! Аккуратная езда, пунктуальный, машина чистая. Рекомендую!',
      helpful: 12,
    },
    {
      id: 2,
      author: 'Фарход А.',
      avatar: 'Ф',
      rating: 5,
      date: '10 марта 2026',
      trip: 'Худжанд → С.-Петербург',
      comment: 'Всё прошло хорошо, приятная поездка. Спасибо!',
      helpful: 8,
    },
    {
      id: 3,
      author: 'Зарина К.',
      avatar: 'З',
      rating: 4,
      date: '5 марта 2026',
      trip: 'Душанбе → Екатеринбург',
      comment: 'Хороший водитель, но были небольшие задержки на маршруте.',
      helpful: 5,
    },
  ];

  const givenReviews = [
    {
      id: 1,
      author: 'Рахим Ш.',
      avatar: 'Р',
      rating: 5,
      date: '12 марта 2026',
      trip: 'Душанбе → Москва',
      comment: 'Пунктуальный пассажир, приятно было везти!',
      helpful: 6,
    },
  ];

  const reviews = activeTab === 'received' ? receivedReviews : givenReviews;

  const averageRating = receivedReviews.reduce((sum, r) => sum + r.rating, 0) / receivedReviews.length;
  const totalReviews = receivedReviews.length;

  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: receivedReviews.filter(r => r.rating === rating).length,
    percentage: (receivedReviews.filter(r => r.rating === rating).length / totalReviews) * 100,
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-teal-600 text-white px-4 pt-6 pb-8">
        <h1 className="text-2xl font-bold mb-6">Отзывы и рейтинги</h1>

        {/* Rating summary */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="text-center">
              <div className="text-5xl font-bold mb-1">{averageRating.toFixed(1)}</div>
              <div className="flex items-center gap-1 mb-1 justify-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= averageRating ? 'fill-yellow-400 text-yellow-400' : 'text-white/50'
                    }`}
                  />
                ))}
              </div>
              <div className="text-sm text-blue-100">{totalReviews} отзывов</div>
            </div>

            <div className="flex-1 space-y-2">
              {ratingDistribution.map((dist) => (
                <div key={dist.rating} className="flex items-center gap-2">
                  <span className="text-sm w-3">{dist.rating}</span>
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400"
                      style={{ width: `${dist.percentage}%` }}
                    />
                  </div>
                  <span className="text-sm w-6 text-right">{dist.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white px-4 py-4 border-b border-gray-200 sticky top-0 z-10">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('received')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
              activeTab === 'received'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            Полученные ({receivedReviews.length})
          </button>
          <button
            onClick={() => setActiveTab('given')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
              activeTab === 'given'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            Оставленные ({givenReviews.length})
          </button>
        </div>
      </div>

      {/* Reviews list */}
      <div className="px-4 py-6 space-y-4">
        {reviews.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Нет отзывов</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white rounded-2xl p-4 shadow-sm"
            >
              {/* Author */}
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
                  {review.avatar}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{review.author}</h3>
                  <div className="flex items-center gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= review.rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="text-sm text-gray-500">
                    {review.trip} • {review.date}
                  </div>
                </div>
              </div>

              {/* Comment */}
              <p className="text-gray-700 text-sm leading-relaxed mb-3">
                {review.comment}
              </p>

              {/* Helpful */}
              <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 transition-colors">
                  <ThumbsUp className="w-4 h-4" />
                  <span>Полезно ({review.helpful})</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
