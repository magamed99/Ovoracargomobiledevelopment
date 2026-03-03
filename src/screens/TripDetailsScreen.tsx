import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Button } from '../app/components/ui/button';
import { Card } from '../app/components/ui/card';
import { MapPin, Calendar, Users, DollarSign, Star, Phone, MessageCircle, ArrowLeft, User } from 'lucide-react';
import { toast } from 'sonner';

// Mock trip data - in a real app, this would come from an API/database
const mockTrips = [
  {
    id: '1',
    from: 'Душанбе',
    to: 'Худжанд',
    date: '2026-03-01',
    time: '09:00',
    price: 150,
    seats: 3,
    driver: {
      name: 'Фарход Рахимов',
      rating: 4.8,
      trips: 142,
      phone: '+992 901 234567',
      photo: null,
    },
    vehicle: {
      model: 'Toyota Camry',
      year: 2020,
      color: 'Серебристый',
      plate: '01TJ 123',
    },
    pickupPoints: ['Центральный рынок', 'Площадь Дусти', 'Автовокзал'],
    amenities: ['AC', 'Музыка', 'Некурящий'],
    description: 'Комфортная поездка, могу забрать/довезти до нужной точки в городе',
  },
  {
    id: '2',
    from: 'Душанбе',
    to: 'Куляб',
    date: '2026-03-02',
    time: '10:00',
    price: 120,
    seats: 2,
    driver: {
      name: 'Алишер Назаров',
      rating: 4.9,
      trips: 89,
      phone: '+992 902 345678',
      photo: null,
    },
    vehicle: {
      model: 'Honda Accord',
      year: 2019,
      color: 'Черный',
      plate: '01TJ 456',
    },
    pickupPoints: ['Железнодорожный вокзал', 'Рынок Шохмансур'],
    amenities: ['AC', 'Wi-Fi'],
    description: 'Быстрая и безопасная поездка',
  },
];

export function TripDetailsScreen() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [requestedSeats, setRequestedSeats] = useState(1);
  const [isBooking, setIsBooking] = useState(false);

  const trip = mockTrips.find(t => t.id === id);

  if (!trip) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-bold mb-4">Поездка не найдена</h2>
          <Button onClick={() => navigate('/search')}>
            Вернуться к поиску
          </Button>
        </Card>
      </div>
    );
  }

  const handleBooking = async () => {
    setIsBooking(true);
    try {
      // Simulate booking API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success('Запрос отправлен водителю!');
      navigate('/home');
    } catch (error) {
      toast.error('Ошибка при бронировании');
    } finally {
      setIsBooking(false);
    }
  };

  const handleContactDriver = () => {
    toast.success('Открыть чат с водителем');
  };

  const totalPrice = trip.price * requestedSeats;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Детали поездки</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-4 pb-32">
        {/* Route Info */}
        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-lg">{trip.from}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-red-600" />
                <span className="font-semibold text-lg">{trip.to}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">{trip.price} TJS</div>
              <div className="text-sm text-gray-600">за место</div>
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{trip.date} в {trip.time}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>{trip.seats} мест</span>
            </div>
          </div>
        </Card>

        {/* Driver Info */}
        <Card className="p-6">
          <h2 className="font-bold text-lg mb-4">Водитель</h2>
          <div className="flex items-start gap-4 mb-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
              {trip.driver.photo ? (
                <img src={trip.driver.photo} alt={trip.driver.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                <User className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{trip.driver.name}</h3>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="font-medium">{trip.driver.rating}</span>
                </div>
                <span>{trip.driver.trips} поездок</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleContactDriver}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Написать
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => window.open(`tel:${trip.driver.phone}`)}
            >
              <Phone className="w-4 h-4 mr-2" />
              Позвонить
            </Button>
          </div>
        </Card>

        {/* Vehicle Info */}
        <Card className="p-6">
          <h2 className="font-bold text-lg mb-4">Автомобиль</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Модель:</span>
              <span className="font-medium">{trip.vehicle.model}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Год:</span>
              <span className="font-medium">{trip.vehicle.year}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Цвет:</span>
              <span className="font-medium">{trip.vehicle.color}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Номер:</span>
              <span className="font-medium">{trip.vehicle.plate}</span>
            </div>
          </div>
        </Card>

        {/* Pickup Points */}
        <Card className="p-6">
          <h2 className="font-bold text-lg mb-4">Места посадки</h2>
          <div className="space-y-2">
            {trip.pickupPoints.map((point, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span>{point}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Amenities */}
        <Card className="p-6">
          <h2 className="font-bold text-lg mb-4">Удобства</h2>
          <div className="flex flex-wrap gap-2">
            {trip.amenities.map((amenity, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
              >
                {amenity}
              </span>
            ))}
          </div>
        </Card>

        {/* Description */}
        {trip.description && (
          <Card className="p-6">
            <h2 className="font-bold text-lg mb-4">Описание</h2>
            <p className="text-sm text-gray-700">{trip.description}</p>
          </Card>
        )}
      </div>

      {/* Booking Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Мест:</label>
            <select
              value={requestedSeats}
              onChange={(e) => setRequestedSeats(Number(e.target.value))}
              className="border rounded px-3 py-2"
            >
              {Array.from({ length: trip.seats }, (_, i) => i + 1).map((num) => (
                <option key={num} value={num}>
                  {num}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 text-right">
            <div className="text-sm text-gray-600">Итого</div>
            <div className="text-xl font-bold text-blue-600">{totalPrice} TJS</div>
          </div>

          <Button
            size="lg"
            onClick={handleBooking}
            disabled={isBooking}
            className="px-8"
          >
            {isBooking ? 'Отправка...' : 'Забронировать'}
          </Button>
        </div>
      </div>
    </div>
  );
}
