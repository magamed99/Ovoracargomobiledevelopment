import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Button } from '../app/components/ui/button';
import { Card } from '../app/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '../app/components/ui/input-otp';
import { ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '../store/auth';

export function VerifyScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const phone = localStorage.getItem('phoneNumber') || '';

  const handleVerify = async () => {
    if (code.length !== 6) {
      toast.error('Введите код из 6 цифр');
      return;
    }

    setIsLoading(true);
    try {
      await login(phone, code);
      toast.success('Вход выполнен успешно');
      navigate('/complete-profile');
    } catch (error) {
      toast.error('Неверный код');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-2">{t('auth.enterCode')}</h1>
          <p className="text-gray-600">
            Код отправлен на номер {phone}
          </p>
        </div>

        <div className="flex justify-center mb-8">
          <InputOTP maxLength={6} value={code} onChange={setCode}>
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>

        <Button
          className="w-full mb-4"
          size="lg"
          disabled={code.length !== 6 || isLoading}
          onClick={handleVerify}
        >
          {isLoading ? t('common.loading') : t('auth.verify')}
        </Button>

        <Button variant="ghost" className="w-full">
          Отправить код повторно
        </Button>
      </Card>
    </div>
  );
}