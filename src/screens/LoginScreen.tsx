import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { Button } from '../app/components/ui/button';
import { Card } from '../app/components/ui/card';
import { Input } from '../app/components/ui/input';
import { Label } from '../app/components/ui/label';
import { Phone } from 'lucide-react';
import { toast } from 'sonner';

export function LoginScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendCode = async () => {
    if (!phone || phone.length < 9) {
      toast.error('Введите корректный номер телефона');
      return;
    }

    setIsLoading(true);
    try {
      // Simulate sending SMS code
      await new Promise(resolve => setTimeout(resolve, 1000));
      localStorage.setItem('phoneNumber', phone);
      navigate('/verify');
      toast.success('Код отправлен на ваш номер');
    } catch (error) {
      toast.error('Ошибка отправки кода');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Phone className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-2">{t('auth.enterPhone')}</h1>
          <p className="text-gray-600">
            Мы отправим вам код подтверждения
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <div>
            <Label htmlFor="phone">Номер телефона</Label>
            <div className="flex gap-2">
              <Input
                id="phone"
                type="tel"
                placeholder="+992 XX XXX XXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="flex-1"
              />
            </div>
          </div>
        </div>

        <Button
          className="w-full"
          size="lg"
          disabled={!phone || isLoading}
          onClick={handleSendCode}
        >
          {isLoading ? t('common.loading') : t('common.send')}
        </Button>
      </Card>
    </div>
  );
}