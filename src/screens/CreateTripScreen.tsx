import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../app/components/ui/button';
import { Card } from '../app/components/ui/card';
import { Input } from '../app/components/ui/input';
import { Label } from '../app/components/ui/label';
import { Textarea } from '../app/components/ui/textarea';
import { MapPin, Calendar, DollarSign, Users, Package } from 'lucide-react';
import { toast } from 'sonner';
import { useTripStore } from '../store/trips';
import { useAuthStore } from '../store/auth';
import { aiService } from '../services/ai';

export function CreateTripScreen() {
  const navigate = useNavigate();
  const { createTrip } = useTripStore();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuggestingPrice, setIsSuggestingPrice] = useState(false);
  
  const [formData, setFormData] = useState({
    from: '',
    to: '',
    departureDate: '',
    departureTime: '',
    price: '',
    availableSeats: '',
    cargoCapacity: '',
    description: '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSuggestPrice = async () => {
    if (!formData.from || !formData.to) {
      toast.error('Укажите откуда и куда');
      return;
    }

    setIsSuggestingPrice(true);
    try {
      // Mock locations
      const from = { lat: 38.5598, lng: 68.7738 };
      const to = { lat: 40.3848, lng: 69.3450 };
      
      const suggestedPrice = await aiService.suggestPrice(
        from,
        to,
        formData.departureDate
      );
      
      handleChange('price', suggestedPrice.toString());
      toast.success(`Рекомендуемая цена: ${suggestedPrice} TJS`);
    } catch (error) {
      toast.error('Ошибка расчета цены');
    } finally {
      setIsSuggestingPrice(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.from || !formData.to || !formData.departureDate || !formData.price) {
      toast.error('Заполните все обязательные поля');
      return;
    }

    setIsLoading(true);
    try {
      await createTrip({
        driverId: user!.id,
        from: { lat: 38.5598, lng: 68.7738, address: formData.from },
        to: { lat: 40.3848, lng: 69.3450, address: formData.to },
        departureDate: new Date(`${formData.departureDate}T${formData.departureTime || '12:00'}`).toISOString(),
        price: Number(formData.price),
        currency: 'TJS',
        availableSeats: formData.availableSeats ? Number(formData.availableSeats) : undefined,
        cargoCapacity: formData.cargoCapacity ? Number(formData.cargoCapacity) : undefined,
        description: formData.description,
      });

      toast.success('Поездка создана');
      navigate('/my-trips');
    } catch (error) {
      toast.error('Ошибка создания поездки');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            ← Назад
          </Button>
          <h1 className="text-xl font-bold flex-1">Создать поездку</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="from">Откуда *</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="from"
                  value={formData.from}
                  onChange={(e) => handleChange('from', e.target.value)}
                  placeholder="Город отправления"
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="to">Куда *</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="to"
                  value={formData.to}
                  onChange={(e) => handleChange('to', e.target.value)}
                  placeholder="Город назначения"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date">Дата *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="date"
                    type="date"
                    value={formData.departureDate}
                    onChange={(e) => handleChange('departureDate', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="time">Время</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.departureTime}
                  onChange={(e) => handleChange('departureTime', e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="price">Цена (TJS) *</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleChange('price', e.target.value)}
                    placeholder="Стоимость"
                    className="pl-10"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={handleSuggestPrice}
                  disabled={isSuggestingPrice}
                >
                  AI цена
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="seats">Свободных мест</Label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="seats"
                    type="number"
                    value={formData.availableSeats}
                    onChange={(e) => handleChange('availableSeats', e.target.value)}
                    placeholder="1-4"
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="cargo">Груз (кг)</Label>
                <div className="relative">
                  <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="cargo"
                    type="number"
                    value={formData.cargoCapacity}
                    onChange={(e) => handleChange('cargoCapacity', e.target.value)}
                    placeholder="100"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Дополнительная информация о поездке"
                rows={3}
              />
            </div>

            <Button
              className="w-full"
              size="lg"
              disabled={isLoading}
              onClick={handleSubmit}
            >
              {isLoading ? 'Загрузка...' : 'Создать поездку'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}