import { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, Bell, DollarSign, Globe, Shield,
  Smartphone, Save, AlertCircle, RefreshCw, Loader2, CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { toast } from 'sonner';
import { adminHeaders } from '../../api/dataApi';
import { projectId } from '../../../../utils/supabase/info';

const BASE = `https://${projectId}.supabase.co/functions/v1/make-server-4e36197a`;

const DEFAULTS = {
  platformName: 'Ovora Cargo',
  supportEmail: 'support@ovora.tj',
  supportPhone: '+992 92 000 0000',
  currency: 'TJS',
  timezone: 'Asia/Dushanbe',
  language: 'ru',
  emailNotifications: true,
  smsNotifications: true,
  pushNotifications: true,
  driverNewTrip: true,
  tripCompleted: true,
  baseFare: 20,
  perKmRate: 0.5,
  minimumFare: 30,
  cancellationFee: 15,
  platformCommission: 15,
  requireDocumentVerification: true,
  requirePhoneVerification: true,
  emergencySOS: true,
  tripRecording: true,
  realTimeTracking: true,
  inAppChat: true,
  ratingSystem: true,
  scheduledTrips: true,
  cargoDelivery: true,
  multipleStops: false,
  allowCashPayments: true,
  allowCardPayments: false,
};

type SettingsType = typeof DEFAULTS;

export function Settings() {
  const [settings, setSettings] = useState<SettingsType>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${BASE}/admin/settings`, { headers: adminHeaders() });
        if (res.ok) {
          const data = await res.json();
          if (data.settings && Object.keys(data.settings).length > 0) {
            setSettings({ ...DEFAULTS, ...data.settings });
            if (data.settings.updatedAt) setSavedAt(data.settings.updatedAt);
          }
        }
      } catch {
        // Use defaults silently
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${BASE}/admin/settings`, {
        method: 'PUT', headers: adminHeaders(),
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error(await res.text());
      const now = new Date().toISOString();
      setSavedAt(now);
      toast.success('✅ Настройки сохранены в базу данных');
    } catch (err) {
      toast.error('Ошибка сохранения настроек');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const set = (key: keyof SettingsType, val: any) =>
    setSettings(prev => ({ ...prev, [key]: val }));

  const toggle = (key: keyof SettingsType) =>
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      <span className="ml-3 text-gray-600">Загрузка настроек...</span>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Настройки системы</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {savedAt
              ? `Последнее сохранение: ${new Date(savedAt).toLocaleString('ru-RU')}`
              : 'Настройки хранятся в базе данных Supabase KV'
            }
          </p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium text-sm disabled:opacity-60">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Сохранение...' : 'Сохранить'}
        </button>
      </div>

      {/* General */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="w-5 h-5 text-blue-600" />
            Общие настройки
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { id: 'platformName', label: 'Название платформы', type: 'text' },
              { id: 'supportEmail', label: 'Email поддержки', type: 'email' },
              { id: 'supportPhone', label: 'Телефон поддержки', type: 'tel' },
            ].map(f => (
              <div key={f.id}>
                <Label htmlFor={f.id} className="text-sm">{f.label}</Label>
                <input id={f.id} type={f.type}
                  value={(settings as any)[f.id]}
                  onChange={e => set(f.id as any, e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            ))}
            <div>
              <Label htmlFor="currency" className="text-sm">Валюта</Label>
              <select id="currency" value={settings.currency}
                onChange={e => set('currency', e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                <option value="TJS">Сомони (ТЖС)</option>
                <option value="USD">Доллар США ($)</option>
                <option value="RUB">Рубль (₽)</option>
                <option value="EUR">Евро (€)</option>
              </select>
            </div>
            <div>
              <Label htmlFor="timezone" className="text-sm">Часовой пояс</Label>
              <select id="timezone" value={settings.timezone}
                onChange={e => set('timezone', e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                <option value="Asia/Dushanbe">Душанбе (UTC+5)</option>
                <option value="Asia/Tashkent">Ташкент (UTC+5)</option>
                <option value="Asia/Almaty">Алматы (UTC+6)</option>
                <option value="Europe/Moscow">Москва (UTC+3)</option>
              </select>
            </div>
            <div>
              <Label htmlFor="language" className="text-sm">Язык системы</Label>
              <select id="language" value={settings.language}
                onChange={e => set('language', e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                <option value="ru">Русский</option>
                <option value="tg">Таджикский</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            Ценообразование
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { id: 'baseFare', label: 'Базовая ставка (ТЖС)', step: '1' },
              { id: 'perKmRate', label: 'Ставка за км (ТЖС)', step: '0.1' },
              { id: 'minimumFare', label: 'Мин. стоимость (ТЖС)', step: '1' },
              { id: 'cancellationFee', label: 'Штраф за отмену (ТЖС)', step: '1' },
              { id: 'platformCommission', label: 'Комиссия платформы (%)', step: '1' },
            ].map(f => (
              <div key={f.id}>
                <Label htmlFor={f.id} className="text-sm">{f.label}</Label>
                <input id={f.id} type="number" step={f.step}
                  value={(settings as any)[f.id]}
                  onChange={e => set(f.id as any, Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="w-5 h-5 text-purple-600" />
            Уведомления
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-0">
            {[
              { id: 'emailNotifications', label: 'Email уведомления', desc: 'Отправка уведомлений по email' },
              { id: 'smsNotifications', label: 'SMS уведомления', desc: 'Отправка SMS сообщений' },
              { id: 'pushNotifications', label: 'Push уведомления', desc: 'Push-уведомления в приложение' },
              { id: 'driverNewTrip', label: 'Новая поездка водителю', desc: 'Уведомлять водителя о новых запросах' },
              { id: 'tripCompleted', label: 'Завершение поездки', desc: 'Уведомление после завершения' },
            ].map((item, i, arr) => (
              <div key={item.id} className={`flex items-center justify-between py-3 ${i < arr.length - 1 ? 'border-b border-gray-100' : ''}`}>
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                </div>
                <Switch id={item.id} checked={(settings as any)[item.id]} onCheckedChange={() => toggle(item.id as any)} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Safety */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="w-5 h-5 text-red-600" />
            Безопасность
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-0">
            {[
              { id: 'requireDocumentVerification', label: 'Обязательная верификация документов', desc: 'Водители должны загрузить документы перед началом работы' },
              { id: 'requirePhoneVerification', label: 'Верификация телефона', desc: 'Требовать подтверждение номера телефона через OTP' },
              { id: 'emergencySOS', label: 'Кнопка SOS', desc: 'Экстренный вызов помощи во время поездки' },
              { id: 'tripRecording', label: 'Запись маршрутов', desc: 'Сохранение данных о маршруте и времени' },
            ].map((item, i, arr) => (
              <div key={item.id} className={`flex items-center justify-between py-3 ${i < arr.length - 1 ? 'border-b border-gray-100' : ''}`}>
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                </div>
                <Switch id={item.id} checked={(settings as any)[item.id]} onCheckedChange={() => toggle(item.id as any)} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Smartphone className="w-5 h-5 text-blue-600" />
            Функции приложения
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-0">
            {[
              { id: 'realTimeTracking', label: 'Отслеживание в реальном времени', desc: 'Показывать местоположение на карте' },
              { id: 'inAppChat', label: 'Встроенный чат', desc: 'Общение водителя и отправителя в приложении' },
              { id: 'ratingSystem', label: 'Система рейтингов', desc: 'Оценки и отзывы после поездки' },
              { id: 'scheduledTrips', label: 'Запланированные поездки', desc: 'Бронирование поездок заранее' },
              { id: 'cargoDelivery', label: 'Доставка грузов', desc: 'Возможность заказа грузоперевозок' },
              { id: 'multipleStops', label: 'Промежуточные остановки', desc: 'Добавление промежуточных точек маршрута' },
            ].map((item, i, arr) => (
              <div key={item.id} className={`flex items-center justify-between py-3 ${i < arr.length - 1 ? 'border-b border-gray-100' : ''}`}>
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                </div>
                <Switch id={item.id} checked={(settings as any)[item.id]} onCheckedChange={() => toggle(item.id as any)} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            Способы оплаты
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-0">
            {[
              { id: 'allowCashPayments', label: 'Оплата наличными', desc: 'Разрешить оплату наличными водителю' },
              { id: 'allowCardPayments', label: 'Безналичная оплата', desc: 'Онлайн-оплата через приложение' },
            ].map((item, i, arr) => (
              <div key={item.id} className={`flex items-center justify-between py-3 ${i < arr.length - 1 ? 'border-b border-gray-100' : ''}`}>
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                </div>
                <Switch id={item.id} checked={(settings as any)[item.id]} onCheckedChange={() => toggle(item.id as any)} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Save button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {savedAt && (
            <div className="flex items-center gap-2 text-sm text-emerald-600">
              <CheckCircle className="w-4 h-4" />
              Сохранено {new Date(savedAt).toLocaleTimeString('ru-RU')}
            </div>
          )}
        </div>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-60">
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {saving ? 'Сохранение...' : 'Сохранить настройки'}
        </button>
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900">Хранение в базе данных</p>
            <p className="text-sm text-blue-700 mt-0.5">
              Все настройки сохраняются в Supabase KV Store (ключ <code className="font-mono text-xs bg-blue-100 px-1 py-0.5 rounded">ovora:admin:settings</code>) и применяются ко всем сессиям.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
