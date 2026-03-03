import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { Button } from '../app/components/ui/button';
import { Card } from '../app/components/ui/card';
import { Truck, Package } from 'lucide-react';
import { UserRole } from '../types';

export function RoleSelectScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  const handleContinue = () => {
    if (selectedRole) {
      localStorage.setItem('selectedRole', selectedRole);
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-center mb-2">
          {t('auth.selectRole')}
        </h1>
        <p className="text-gray-600 text-center mb-8">
          Выберите, как вы хотите использовать приложение
        </p>

        <div className="space-y-4 mb-8">
          <Card
            className={`p-6 cursor-pointer border-2 transition-all ${
              selectedRole === 'driver'
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setSelectedRole('driver')}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{t('auth.driver')}</h3>
                <p className="text-sm text-gray-600">
                  Предлагайте поездки и доставку грузов
                </p>
              </div>
            </div>
          </Card>

          <Card
            className={`p-6 cursor-pointer border-2 transition-all ${
              selectedRole === 'sender'
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setSelectedRole('sender')}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{t('auth.sender')}</h3>
                <p className="text-sm text-gray-600">
                  Ищите поездки и отправляйте грузы
                </p>
              </div>
            </div>
          </Card>
        </div>

        <Button
          className="w-full"
          size="lg"
          disabled={!selectedRole}
          onClick={handleContinue}
        >
          {t('common.next')}
        </Button>
      </Card>
    </div>
  );
}