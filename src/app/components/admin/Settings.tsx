import { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Bell, 
  DollarSign, 
  MapPin, 
  Shield, 
  Mail,
  Globe,
  Clock,
  Users,
  Smartphone,
  Save,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { toast } from 'sonner';

export function Settings() {
  const [settings, setSettings] = useState({
    // General
    platformName: 'Ovora Cargo',
    supportEmail: 'support@ovora.tj',
    supportPhone: '+992 92 000 0000',
    currency: 'TJS',
    timezone: 'Asia/Dushanbe',
    language: 'ru',

    // Notifications
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: true,
    driverNewTrip: true,
    passengerTripConfirmed: true,
    tripStarted: true,
    tripCompleted: true,
    paymentReceived: true,

    // Pricing
    baseFare: 20,
    perKmRate: 0.5,
    perMinuteRate: 0.3,
    minimumFare: 30,
    cancellationFee: 15,
    platformCommission: 15,

    // Safety
    requireDocumentVerification: true,
    requirePhoneVerification: true,
    allowCashPayments: true,
    allowCardPayments: true,
    emergencySOS: true,
    tripRecording: true,

    // Features
    realTimeTracking: true,
    inAppChat: true,
    ratingSystem: true,
    scheduledTrips: true,
    cargoDelivery: true,
    multipleStops: false,
  });

  const handleSave = () => {
    toast.success('Настройки сохранены');
  };

  const handleToggle = (key: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Настройки системы</h1>
        <p className="text-gray-600 mt-1">Управление конфигурацией платформы</p>
      </div>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Общие настройки
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="platformName">Название платформы</Label>
              <input
                id="platformName"
                type="text"
                value={settings.platformName}
                onChange={(e) => setSettings({...settings, platformName: e.target.value})}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <Label htmlFor="supportEmail">Email поддержки</Label>
              <input
                id="supportEmail"
                type="email"
                value={settings.supportEmail}
                onChange={(e) => setSettings({...settings, supportEmail: e.target.value})}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <Label htmlFor="supportPhone">Телефон поддержки</Label>
              <input
                id="supportPhone"
                type="tel"
                value={settings.supportPhone}
                onChange={(e) => setSettings({...settings, supportPhone: e.target.value})}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <Label htmlFor="currency">Валюта</Label>
              <select
                id="currency"
                value={settings.currency}
                onChange={(e) => setSettings({...settings, currency: e.target.value})}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="TJS">Сомони (ТЖС)</option>
                <option value="USD">Доллар США ($)</option>
                <option value="EUR">Евро (€)</option>
                <option value="RUB">Рубль (₽)</option>
              </select>
            </div>
            <div>
              <Label htmlFor="timezone">Часовой пояс</Label>
              <select
                id="timezone"
                value={settings.timezone}
                onChange={(e) => setSettings({...settings, timezone: e.target.value})}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Asia/Dushanbe">Душанбе (UTC+5)</option>
                <option value="Asia/Tashkent">Ташкент (UTC+5)</option>
                <option value="Asia/Almaty">Алматы (UTC+6)</option>
              </select>
            </div>
            <div>
              <Label htmlFor="language">Язык по умолчанию</Label>
              <select
                id="language"
                value={settings.language}
                onChange={(e) => setSettings({...settings, language: e.target.value})}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ru">Русский</option>
                <option value="tg">Таджикский</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Уведомления
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <div>
                <Label htmlFor="emailNotifications" className="font-medium">Email уведомления</Label>
                <p className="text-sm text-gray-600">Отправка уведомлений по электронной почте</p>
              </div>
              <Switch
                id="emailNotifications"
                checked={settings.emailNotifications}
                onCheckedChange={() => handleToggle('emailNotifications')}
              />
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <div>
                <Label htmlFor="smsNotifications" className="font-medium">SMS уведомления</Label>
                <p className="text-sm text-gray-600">Отправка SMS сообщений</p>
              </div>
              <Switch
                id="smsNotifications"
                checked={settings.smsNotifications}
                onCheckedChange={() => handleToggle('smsNotifications')}
              />
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <div>
                <Label htmlFor="pushNotifications" className="font-medium">Push уведомления</Label>
                <p className="text-sm text-gray-600">Отправка push-уведомлений в приложение</p>
              </div>
              <Switch
                id="pushNotifications"
                checked={settings.pushNotifications}
                onCheckedChange={() => handleToggle('pushNotifications')}
              />
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <div>
                <Label htmlFor="driverNewTrip" className="font-medium">Новая поездка водителю</Label>
                <p className="text-sm text-gray-600">Уведомление водителя о новой поездке</p>
              </div>
              <Switch
                id="driverNewTrip"
                checked={settings.driverNewTrip}
                onCheckedChange={() => handleToggle('driverNewTrip')}
              />
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <Label htmlFor="tripCompleted" className="font-medium">Завершение поездки</Label>
                <p className="text-sm text-gray-600">Уведомление о завершении поездки</p>
              </div>
              <Switch
                id="tripCompleted"
                checked={settings.tripCompleted}
                onCheckedChange={() => handleToggle('tripCompleted')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Ценообразование
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="baseFare">Базовая ставка (ТЖС)</Label>
              <input
                id="baseFare"
                type="number"
                value={settings.baseFare}
                onChange={(e) => setSettings({...settings, baseFare: Number(e.target.value)})}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <Label htmlFor="perKmRate">Стоимость за км (ТЖС)</Label>
              <input
                id="perKmRate"
                type="number"
                step="0.1"
                value={settings.perKmRate}
                onChange={(e) => setSettings({...settings, perKmRate: Number(e.target.value)})}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <Label htmlFor="perMinuteRate">Стоимость за минуту (ТЖС)</Label>
              <input
                id="perMinuteRate"
                type="number"
                step="0.1"
                value={settings.perMinuteRate}
                onChange={(e) => setSettings({...settings, perMinuteRate: Number(e.target.value)})}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <Label htmlFor="minimumFare">Минимальная стоимость (ТЖС)</Label>
              <input
                id="minimumFare"
                type="number"
                value={settings.minimumFare}
                onChange={(e) => setSettings({...settings, minimumFare: Number(e.target.value)})}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <Label htmlFor="cancellationFee">Штраф за отмену (ТЖС)</Label>
              <input
                id="cancellationFee"
                type="number"
                value={settings.cancellationFee}
                onChange={(e) => setSettings({...settings, cancellationFee: Number(e.target.value)})}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <Label htmlFor="platformCommission">Комиссия платформы (%)</Label>
              <input
                id="platformCommission"
                type="number"
                value={settings.platformCommission}
                onChange={(e) => setSettings({...settings, platformCommission: Number(e.target.value)})}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Safety Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Безопасность
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <div>
                <Label htmlFor="requireDocumentVerification" className="font-medium">Обязательная верификация документов</Label>
                <p className="text-sm text-gray-600">Водители должны пройти верификацию перед началом работы</p>
              </div>
              <Switch
                id="requireDocumentVerification"
                checked={settings.requireDocumentVerification}
                onCheckedChange={() => handleToggle('requireDocumentVerification')}
              />
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <div>
                <Label htmlFor="requirePhoneVerification" className="font-medium">Обязательная верификация телефона</Label>
                <p className="text-sm text-gray-600">Требовать подтверждение номера телефона</p>
              </div>
              <Switch
                id="requirePhoneVerification"
                checked={settings.requirePhoneVerification}
                onCheckedChange={() => handleToggle('requirePhoneVerification')}
              />
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <div>
                <Label htmlFor="emergencySOS" className="font-medium">Кнопка SOS</Label>
                <p className="text-sm text-gray-600">Экстренный вызов помощи во время поездки</p>
              </div>
              <Switch
                id="emergencySOS"
                checked={settings.emergencySOS}
                onCheckedChange={() => handleToggle('emergencySOS')}
              />
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <Label htmlFor="tripRecording" className="font-medium">Запись поездок</Label>
                <p className="text-sm text-gray-600">Сохранение данных о маршруте и времени</p>
              </div>
              <Switch
                id="tripRecording"
                checked={settings.tripRecording}
                onCheckedChange={() => handleToggle('tripRecording')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Функции приложения
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <div>
                <Label htmlFor="realTimeTracking" className="font-medium">Отслеживание в реальном времени</Label>
                <p className="text-sm text-gray-600">Показывать местоположение водителя на карте</p>
              </div>
              <Switch
                id="realTimeTracking"
                checked={settings.realTimeTracking}
                onCheckedChange={() => handleToggle('realTimeTracking')}
              />
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <div>
                <Label htmlFor="inAppChat" className="font-medium">Внутренний чат</Label>
                <p className="text-sm text-gray-600">Общение водителя и пассажира в приложении</p>
              </div>
              <Switch
                id="inAppChat"
                checked={settings.inAppChat}
                onCheckedChange={() => handleToggle('inAppChat')}
              />
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <div>
                <Label htmlFor="ratingSystem" className="font-medium">Система рейтингов</Label>
                <p className="text-sm text-gray-600">Оценки и отзывы после поездки</p>
              </div>
              <Switch
                id="ratingSystem"
                checked={settings.ratingSystem}
                onCheckedChange={() => handleToggle('ratingSystem')}
              />
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <div>
                <Label htmlFor="scheduledTrips" className="font-medium">Запланированные поездки</Label>
                <p className="text-sm text-gray-600">Возможность бронировать поездки заранее</p>
              </div>
              <Switch
                id="scheduledTrips"
                checked={settings.scheduledTrips}
                onCheckedChange={() => handleToggle('scheduledTrips')}
              />
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <div>
                <Label htmlFor="cargoDelivery" className="font-medium">Доставка грузов</Label>
                <p className="text-sm text-gray-600">Возможность заказа грузоперевозок</p>
              </div>
              <Switch
                id="cargoDelivery"
                checked={settings.cargoDelivery}
                onCheckedChange={() => handleToggle('cargoDelivery')}
              />
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <Label htmlFor="multipleStops" className="font-medium">Множественные остановки</Label>
                <p className="text-sm text-gray-600">Добавление промежуточных точек маршрута</p>
              </div>
              <Switch
                id="multipleStops"
                checked={settings.multipleStops}
                onCheckedChange={() => handleToggle('multipleStops')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Способы оплаты
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <div>
                <Label htmlFor="allowCashPayments" className="font-medium">Оплата наличными</Label>
                <p className="text-sm text-gray-600">Разрешить оплату водителю наличными</p>
              </div>
              <Switch
                id="allowCashPayments"
                checked={settings.allowCashPayments}
                onCheckedChange={() => handleToggle('allowCashPayments')}
              />
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <Label htmlFor="allowCardPayments" className="font-medium">Оплата картой</Label>
                <p className="text-sm text-gray-600">Разрешить оплату через приложение</p>
              </div>
              <Switch
                id="allowCardPayments"
                checked={settings.allowCardPayments}
                onCheckedChange={() => handleToggle('allowCardPayments')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
        >
          <Save className="w-5 h-5" />
          Сохранить настройки
        </button>
      </div>

      {/* Info message */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900">Важно!</p>
            <p className="text-sm text-blue-800 mt-1">
              Изменение некоторых настроек может повлиять на работу приложения. Убедитесь, что вы понимаете последствия перед сохранением.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
