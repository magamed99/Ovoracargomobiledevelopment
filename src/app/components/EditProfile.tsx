import { useState } from 'react';
import { User as UserIcon, Camera, Mail, Phone, MapPin, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router';

export function EditProfile() {
  const navigate = useNavigate();
  const userRole = localStorage.getItem('userRole') || 'sender';

  const [formData, setFormData] = useState({
    firstName: 'Иван',
    lastName: 'Иванов',
    phone: '+992 900 00 00 00',
    email: 'ivan@example.com',
    city: 'Душанбе',
    birthDate: '1990-01-01',
    about: 'Опытный водитель с 5-летним стажем',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = () => {
    // Save profile logic
    alert('Профиль сохранён!');
    navigate('/profile');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-4 pt-6 pb-4 border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => navigate('/profile')}
            className="text-blue-600 font-medium"
          >
            ← Назад
          </button>
          <button
            onClick={handleSave}
            className="text-blue-600 font-semibold"
          >
            Сохранить
          </button>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Редактировать профиль</h1>
      </div>

      <div className="px-4 py-6">
        {/* Avatar */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-semibold">
              <UserIcon className="w-12 h-12" />
            </div>
            <button className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg">
              <Camera className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* First name */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Имя
            </label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none transition-colors"
            />
          </div>

          {/* Last name */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Фамилия
            </label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none transition-colors"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Телефон
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full pl-11 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none transition-colors"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-11 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none transition-colors"
              />
            </div>
          </div>

          {/* City */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Город
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full pl-11 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none transition-colors"
              />
            </div>
          </div>

          {/* Birth date */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Дата рождения
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleChange}
                className="w-full pl-11 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none transition-colors"
              />
            </div>
          </div>

          {/* About */}
          {userRole === 'driver' && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                О себе
              </label>
              <textarea
                name="about"
                value={formData.about}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none transition-colors resize-none"
                placeholder="Расскажите о себе и своем опыте..."
              />
            </div>
          )}
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-4 rounded-xl transition-colors shadow-lg"
        >
          Сохранить изменения
        </button>
      </div>
    </div>
  );
}
