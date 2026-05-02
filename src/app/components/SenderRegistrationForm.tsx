import { useState } from 'react';
import { ArrowLeft, User, Badge, Phone, Camera, Edit, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../contexts/UserContext';
import { toast } from 'sonner';
import { registerUser } from '../api/authApi';
import { SK } from '../constants/storageKeys';

export function SenderRegistrationForm() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { user: cachedUser, setUserDirectly } = useUser();
  const isDark = theme === 'dark';

  const [formData, setFormData] = useState({
    firstName: cachedUser?.firstName || '',
    lastName: cachedUser?.lastName || '',
    phone: cachedUser?.phone || '',
  });
  const [submitting, setSubmitting] = useState(false);

  const bg  = isDark ? 'bg-[#0e1621]' : 'bg-white';
  const txt = isDark ? 'text-white'   : 'text-[#0f172a]';
  const sub = isDark ? 'text-[#6b7f94]' : 'text-[#94a3b8]';
  const div = isDark ? 'border-[#1e2d3d]' : 'border-[#f0f2f5]';
  const hdr = isDark ? 'bg-[#0e1621]/95 border-[#1e2d3d]' : 'bg-white/95 border-[#e8eaed]';

  const inputCls = `w-full bg-transparent outline-none text-[15px] font-medium py-3 border-b transition-colors focus:border-b-[#1978e5] ${
    isDark ? `text-white placeholder-[#3d5263] border-b-[#1e2d3d]` : `text-[#0f172a] placeholder-[#94a3b8] border-b-[#f0f2f5]`
  }`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.phone) {
      toast.error('Заполните все поля');
      return;
    }

    setSubmitting(true);
    try {
      const email = cachedUser?.email || sessionStorage.getItem(SK.USER_EMAIL) || '';
      if (!email) {
        toast.error('Email не найден. Пожалуйста, войдите снова.');
        navigate('/email-auth?role=sender');
        return;
      }

      const savedUser = await registerUser({
        email,
        role: 'sender',
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone.trim(),
      });

      setUserDirectly(savedUser);
      toast.success('Регистрация успешно завершена!');
      navigate('/dashboard');
    } catch (err: any) {
      console.error('[SenderRegistrationForm] Error:', err);
      toast.error(err?.message || 'Ошибка сохранения данных');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`relative flex min-h-screen w-full flex-col max-w-md mx-auto font-['Sora'] ${bg} ${txt}`}>

      {/* Header */}
      <header className={`sticky top-0 z-10 backdrop-blur-md px-4 py-3 flex items-center gap-3 border-b ${hdr}`}>
        <button
          onClick={() => navigate(-1)}
          className={`w-8 h-8 flex items-center justify-center transition-colors ${
            isDark ? 'text-[#8a9bb0] hover:text-white' : 'text-[#6b7280] hover:text-[#0f172a]'
          }`}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-[16px] font-bold flex-1">Регистрация отправителя</h2>
      </header>

      {/* Profile Photo */}
      <div className={`flex justify-center py-6 border-b ${div}`}>
        <div className="relative group cursor-pointer">
          <div className={`w-20 h-20 rounded-full border-2 border-dashed flex items-center justify-center overflow-hidden ${
            isDark ? 'bg-[#1e2d3d] border-[#2d4050]' : 'bg-[#f8fafc] border-[#e2e8f0]'
          }`}>
            <Camera className={`w-8 h-8 ${isDark ? 'text-[#3d5263]' : 'text-[#cbd5e1]'}`} />
          </div>
          <div className="absolute bottom-0 right-0 bg-[#1978e5] text-white rounded-full p-1 flex items-center justify-center">
            <Edit className="w-3 h-3" />
          </div>
        </div>
      </div>

      {/* Title */}
      <div className={`px-4 py-4 border-b ${div}`}>
        <h1 className={`text-[20px] font-bold mb-1 ${txt}`}>Завершите регистрацию</h1>
        <p className={`text-[13px] ${sub}`}>Укажите информацию о себе для использования сервиса.</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col">

        {/* First Name */}
        <div className={`px-4 py-2 border-b ${div}`}>
          <label className={`text-[10px] font-semibold uppercase tracking-wider ${sub}`}>Имя</label>
          <div className="flex items-center gap-3">
            <User className={`w-4 h-4 flex-shrink-0 ${sub}`} />
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className={inputCls}
              placeholder="Ваше имя"
              required
            />
          </div>
        </div>

        {/* Last Name */}
        <div className={`px-4 py-2 border-b ${div}`}>
          <label className={`text-[10px] font-semibold uppercase tracking-wider ${sub}`}>Фамилия</label>
          <div className="flex items-center gap-3">
            <Badge className={`w-4 h-4 flex-shrink-0 ${sub}`} />
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className={inputCls}
              placeholder="Ваша фамилия"
              required
            />
          </div>
        </div>

        {/* Phone */}
        <div className={`px-4 py-2 border-b ${div}`}>
          <label className={`text-[10px] font-semibold uppercase tracking-wider ${sub}`}>Телефон</label>
          <div className="flex items-center gap-3">
            <Phone className={`w-4 h-4 flex-shrink-0 ${sub}`} />
            <span className={`text-[14px] font-medium flex-shrink-0 ${sub}`}>+992</span>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className={inputCls}
              placeholder="(900) 123-456"
              required
            />
          </div>
        </div>

        {/* Terms */}
        <div className={`px-4 py-4 border-b ${div} flex items-start gap-3`}>
          <input
            type="checkbox"
            id="terms"
            className="mt-1 w-4 h-4 rounded border-[#1978e5] text-[#1978e5] focus:ring-[#1978e5]"
            required
          />
          <label htmlFor="terms" className={`text-[12.5px] leading-relaxed ${sub}`}>
            Я согласен с{' '}
            <a href="#" className="text-[#1978e5]">условиями использования</a>
            {' '}и{' '}
            <a href="#" className="text-[#1978e5]">политикой конфиденциальности</a>
          </label>
        </div>

        {/* Submit */}
        <div className="px-4 py-5 mt-auto">
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#1978e5] hover:bg-[#1565c0] disabled:opacity-70 text-white font-bold py-3.5 text-[15px] transition-colors flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Сохраняем...
              </>
            ) : (
              'Завершить регистрацию'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
