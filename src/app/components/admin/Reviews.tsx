import { useState } from 'react';
import { 
  Star, 
  ThumbsUp, 
  ThumbsDown, 
  MessageSquare, 
  AlertTriangle,
  Filter,
  Search,
  Eye,
  Flag,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';

interface Review {
  id: string;
  trip: {
    id: string;
    route: string;
  };
  reviewer: {
    name: string;
    avatar: string;
    type: 'driver' | 'passenger';
  };
  reviewee: {
    name: string;
    avatar: string;
    type: 'driver' | 'passenger';
  };
  rating: number;
  comment: string;
  date: string;
  status: 'published' | 'flagged' | 'hidden';
  helpful: number;
  notHelpful: number;
}

const mockReviews: Review[] = [
  {
    id: 'REV-001',
    trip: { id: 'TR-1235', route: 'Душанбе → Куляб' },
    reviewer: { name: 'Зарина Саидова', avatar: 'ЗС', type: 'passenger' },
    reviewee: { name: 'Мурод Каримов', avatar: 'МК', type: 'driver' },
    rating: 5,
    comment: 'Отличный водитель! Пунктуальный, вежливый, машина чистая. Поездка прошла комфортно. Рекомендую!',
    date: '27.02.2026 13:45',
    status: 'published',
    helpful: 12,
    notHelpful: 0
  },
  {
    id: 'REV-002',
    trip: { id: 'TR-1234', route: 'Душанбе → Худжанд' },
    reviewer: { name: 'Алишер Рахимов', avatar: 'АР', type: 'driver' },
    reviewee: { name: 'Фарход Юсупов', avatar: 'ФЮ', type: 'passenger' },
    rating: 5,
    comment: 'Приятный пассажир, пунктуальный. Был готов к поездке вовремя.',
    date: '27.02.2026 16:20',
    status: 'published',
    helpful: 5,
    notHelpful: 1
  },
  {
    id: 'REV-003',
    trip: { id: 'TR-1236', route: 'Худжанд → Душанбе' },
    reviewer: { name: 'Дилшод Азимов', avatar: 'ДА', type: 'passenger' },
    reviewee: { name: 'Сухроб Назаров', avatar: 'СН', type: 'driver' },
    rating: 2,
    comment: 'Водитель опоздал на 40 минут. Не предупредил об опоздании. В машине был неприятный запах. Больше не поеду.',
    date: '27.02.2026 10:30',
    status: 'flagged',
    helpful: 8,
    notHelpful: 2
  },
  {
    id: 'REV-004',
    trip: { id: 'TR-1238', route: 'Куляб → Душанбе' },
    reviewer: { name: 'Фаррух Хакимов', avatar: 'ФХ', type: 'driver' },
    reviewee: { name: 'Шахло Мирзоева', avatar: 'ШМ', type: 'passenger' },
    rating: 4,
    comment: 'Хорошая пассажирка, но немного опоздала на встречу.',
    date: '26.02.2026 18:10',
    status: 'published',
    helpful: 3,
    notHelpful: 0
  },
  {
    id: 'REV-005',
    trip: { id: 'TR-1239', route: 'Душанбе (внутригород)' },
    reviewer: { name: 'Бахтиёр Холов', avatar: 'БХ', type: 'passenger' },
    reviewee: { name: 'Рустам Абдуллоев', avatar: 'РА', type: 'driver' },
    rating: 5,
    comment: 'Быстро приехал, знает все дороги города. Отличный сервис!',
    date: '27.02.2026 17:05',
    status: 'published',
    helpful: 6,
    notHelpful: 0
  },
  {
    id: 'REV-006',
    trip: { id: 'TR-1237', route: 'Душанбе → Курган-Тюбе' },
    reviewer: { name: 'Джамшед Исмоилов', avatar: 'ДИ', type: 'driver' },
    reviewee: { name: 'Нозанин Раджабова', avatar: 'НР', type: 'passenger' },
    rating: 3,
    comment: 'Пассажирка привезла слишком много груза, не предупредила заранее.',
    date: '27.02.2026 12:15',
    status: 'published',
    helpful: 4,
    notHelpful: 3
  },
  {
    id: 'REV-007',
    trip: { id: 'TR-1241', route: 'Душанбе → Курган-Тюбе' },
    reviewer: { name: 'Анвар Раҳимов', avatar: 'АР', type: 'passenger' },
    reviewee: { name: 'Мурод Каримов', avatar: 'МК', type: 'driver' },
    rating: 4,
    comment: 'Хороший водитель, но ехал немного быстро. В остальном все отлично.',
    date: '26.02.2026 14:30',
    status: 'published',
    helpful: 7,
    notHelpful: 1
  },
  {
    id: 'REV-008',
    trip: { id: 'TR-1240', route: 'Душанбе → Худжанд' },
    reviewer: { name: 'Алишер Рахимов', avatar: 'АР', type: 'driver' },
    reviewee: { name: 'Мехрона Назарова', avatar: 'МН', type: 'passenger' },
    rating: 1,
    comment: 'Пассажирка вела себя неуважительно, постоянно жаловалась. Отменил бы поездку, если бы знал заранее.',
    date: '27.02.2026 09:45',
    status: 'flagged',
    helpful: 2,
    notHelpful: 5
  },
];

export function Reviews() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [ratingFilter, setRatingFilter] = useState<string>('all');

  const filteredReviews = mockReviews.filter(review => {
    const matchesSearch = review.reviewer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.reviewee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.trip.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.comment.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || review.status === statusFilter;
    const matchesRating = ratingFilter === 'all' || 
      (ratingFilter === '4-5' && review.rating >= 4) ||
      (ratingFilter === '3' && review.rating === 3) ||
      (ratingFilter === '1-2' && review.rating <= 2);
    
    return matchesSearch && matchesStatus && matchesRating;
  });

  const handleHideReview = (reviewId: string) => {
    toast.success(`Отзыв ${reviewId} скрыт`);
  };

  const handlePublishReview = (reviewId: string) => {
    toast.success(`Отзыв ${reviewId} опубликован`);
  };

  const getStatusBadge = (status: Review['status']) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Опубликован</Badge>;
      case 'flagged':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 flex items-center gap-1">
          <Flag className="w-3 h-3" />
          Требует проверки
        </Badge>;
      case 'hidden':
        return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">Скрыт</Badge>;
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const statusCounts = {
    all: mockReviews.length,
    published: mockReviews.filter(r => r.status === 'published').length,
    flagged: mockReviews.filter(r => r.status === 'flagged').length,
    hidden: mockReviews.filter(r => r.status === 'hidden').length,
  };

  const averageRating = (mockReviews.reduce((sum, r) => sum + r.rating, 0) / mockReviews.length).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Отзывы и рейтинги</h1>
          <p className="text-gray-600 mt-1">Всего отзывов: {mockReviews.length} • Средний рейтинг: {averageRating}</p>
        </div>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('all')}>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 mb-1">Всего</p>
            <p className="text-2xl font-bold text-gray-900">{statusCounts.all}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('published')}>
          <CardContent className="p-4">
            <p className="text-sm text-green-600 mb-1">Опубликовано</p>
            <p className="text-2xl font-bold text-green-700">{statusCounts.published}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('flagged')}>
          <CardContent className="p-4">
            <p className="text-sm text-red-600 mb-1">Требуют проверки</p>
            <p className="text-2xl font-bold text-red-700">{statusCounts.flagged}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('hidden')}>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 mb-1">Скрыто</p>
            <p className="text-2xl font-bold text-gray-700">{statusCounts.hidden}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск по имени, ID поездки или тексту отзыва..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Все оценки</option>
              <option value="4-5">4-5 звезд</option>
              <option value="3">3 звезды</option>
              <option value="1-2">1-2 звезды</option>
            </select>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Фильтры
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Reviews list */}
      <div className="space-y-4">
        {filteredReviews.map((review) => (
          <Card key={review.id} className={`hover:shadow-md transition-shadow ${
            review.status === 'flagged' ? 'border-red-200 border-2' : ''
          }`}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4 flex-1">
                  {/* Reviewer */}
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold ${
                      review.reviewer.type === 'driver' 
                        ? 'bg-gradient-to-br from-blue-500 to-purple-600' 
                        : 'bg-gradient-to-br from-green-500 to-teal-600'
                    }`}>
                      {review.reviewer.avatar}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{review.reviewer.name}</p>
                      <Badge variant="outline" className="text-xs">
                        {review.reviewer.type === 'driver' ? 'Водитель' : 'Пассажир'}
                      </Badge>
                    </div>
                  </div>

                  <MessageSquare className="w-5 h-5 text-gray-400 mt-3" />

                  {/* Reviewee */}
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold ${
                      review.reviewee.type === 'driver' 
                        ? 'bg-gradient-to-br from-blue-500 to-purple-600' 
                        : 'bg-gradient-to-br from-green-500 to-teal-600'
                    }`}>
                      {review.reviewee.avatar}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{review.reviewee.name}</p>
                      <Badge variant="outline" className="text-xs">
                        {review.reviewee.type === 'driver' ? 'Водитель' : 'Пассажир'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {getStatusBadge(review.status)}
              </div>

              {/* Rating and trip info */}
              <div className="flex items-center gap-4 mb-3">
                {renderStars(review.rating)}
                <span className="text-sm text-gray-600">Поездка: {review.trip.id}</span>
                <span className="text-sm text-gray-600">•</span>
                <span className="text-sm text-gray-600">{review.trip.route}</span>
              </div>

              {/* Comment */}
              <p className="text-gray-700 mb-4">{review.comment}</p>

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>{review.date}</span>
                  <div className="flex items-center gap-4">
                    <button className="flex items-center gap-1 hover:text-green-600 transition-colors">
                      <ThumbsUp className="w-4 h-4" />
                      <span>{review.helpful}</span>
                    </button>
                    <button className="flex items-center gap-1 hover:text-red-600 transition-colors">
                      <ThumbsDown className="w-4 h-4" />
                      <span>{review.notHelpful}</span>
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  {review.status === 'flagged' && (
                    <>
                      <button
                        onClick={() => handlePublishReview(review.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Опубликовать
                      </button>
                      <button
                        onClick={() => handleHideReview(review.id)}
                        className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        Скрыть
                      </button>
                    </>
                  )}
                  {review.status === 'published' && (
                    <button
                      onClick={() => handleHideReview(review.id)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Скрыть
                    </button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredReviews.length === 0 && (
        <div className="text-center py-12">
          <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Отзывы не найдены</h3>
          <p className="text-gray-600">Попробуйте изменить параметры поиска</p>
        </div>
      )}
    </div>
  );
}
