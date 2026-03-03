import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Button } from '../app/components/ui/button';
import { Card } from '../app/components/ui/card';
import { Input } from '../app/components/ui/input';
import { Label } from '../app/components/ui/label';
import { User } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '../store/auth';

export function CompleteProfileScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { updateProfile } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleComplete = async () => {
    if (!name.trim()) {
      toast.error('Введите ваше имя');
      return;
    }

    setIsLoading(true);
    try {
      await updateProfile({ name, avatar: undefined });
      const role = localStorage.getItem('selectedRole');
      
      if (role === 'driver') {
        navigate('/upload-documents');
      } else {
        navigate('/home');
      }
      
      toast.success('Профиль заполнен');
    } catch (error) {
      toast.error('Ошибка сохранения профиля');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-2">{t('auth.completeProfile')}</h1>
          <p className="text-gray-600">
            Расскажите о себе немного больше
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <div>
            <Label htmlFor="name">Имя *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Введите ваше имя"
            />
          </div>

          <div>
            <Label htmlFor="email">Email (необязательно)</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
            />
          </div>
        </div>

        <Button
          className="w-full"
          size="lg"
          disabled={!name.trim() || isLoading}
          onClick={handleComplete}
        >
          {isLoading ? t('common.loading') : t('common.next')}
        </Button>
      </Card>
    </div>
  );
}