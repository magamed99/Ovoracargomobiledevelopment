import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { Button } from '../app/components/ui/button';
import { Card } from '../app/components/ui/card';
import { Globe } from 'lucide-react';

export function WelcomeScreen() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const [selectedLanguage, setSelectedLanguage] = useState<'ru' | 'tj'>('ru');

  const handleContinue = () => {
    i18n.changeLanguage(selectedLanguage);
    localStorage.setItem('language', selectedLanguage);
    navigate('/role-select');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="mb-8">
          <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Globe className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Ovora Cargo</h1>
          <p className="text-gray-600">Грузоперевозки по Таджикистану</p>
        </div>

        <div className="space-y-4 mb-8">
          <Button
            variant={selectedLanguage === 'ru' ? 'default' : 'outline'}
            className="w-full"
            onClick={() => setSelectedLanguage('ru')}
          >
            🇷🇺 Русский
          </Button>
          <Button
            variant={selectedLanguage === 'tj' ? 'default' : 'outline'}
            className="w-full"
            onClick={() => setSelectedLanguage('tj')}
          >
            🇹🇯 Тоҷикӣ
          </Button>
        </div>

        <Button className="w-full" size="lg" onClick={handleContinue}>
          Продолжить
        </Button>
      </Card>
    </div>
  );
}