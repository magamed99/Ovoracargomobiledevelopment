import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Truck, Users, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export function RoleSelect() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [selectedRole, setSelectedRole] = useState<'driver' | 'sender' | null>(null);

  const roles = [
    {
      id: 'driver' as const,
      title: 'Водитель',
      titleTj: 'Ронанда',
      description: 'Предлагайте поездки и зарабатывайте',
      icon: <Truck className="w-12 h-12" />,
      color: 'from-blue-500 to-blue-600',
    },
    {
      id: 'sender' as const,
      title: 'Отправитель',
      titleTj: 'Фиристанда',
      description: 'Находите поездки и отправляйте грузы',
      icon: <Users className="w-12 h-12" />,
      color: 'from-teal-500 to-teal-600',
    },
  ];

  const handleContinue = () => {
    if (selectedRole) {
      localStorage.setItem('userRole', selectedRole);
      navigate(`/email-auth?role=${selectedRole}`);
    }
  };

  return (
    <div className={`relative min-h-screen max-w-md mx-auto font-['Sora'] antialiased flex flex-col items-center justify-center px-6 py-12 ${
      theme === 'dark' ? 'bg-[#111821] text-[#e7f0f3]' : 'bg-[#f6f7f8] text-[#0d181c]'
    }`}>
      {/* Theme toggle */}
      <div className="absolute top-6 right-6 z-50">
        <button
          onClick={toggleTheme}
          className={`flex items-center justify-center w-12 h-12 rounded-full backdrop-blur-md shadow-sm border transition-all hover:scale-105 active:scale-95 ${
            theme === 'dark'
              ? 'bg-[#1a2c33]/80 border-white/20 text-white'
              : 'bg-white/80 border-white/20 text-[#0d181c]'
          }`}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-6 h-6" />
          ) : (
            <Moon className="w-6 h-6" />
          )}
        </button>
      </div>

      <div className="w-full max-w-md">
        {/* Back button */}
        <button
          onClick={() => navigate('/welcome')}
          className={`mb-8 transition-colors ${
            theme === 'dark' ? 'text-[#8eaeb8] hover:text-white' : 'text-[#4b879b] hover:text-[#0d181c]'
          }`}
        >
          ← Назад
        </button>

        {/* Title */}
        <h1 className={`text-3xl md:text-4xl font-bold text-center mb-3 ${
          theme === 'dark' ? 'text-white' : 'text-[#0d181c]'
        }`}>
          Выберите роль
        </h1>
        <p className={`text-center mb-12 ${
          theme === 'dark' ? 'text-[#8eaeb8]' : 'text-[#4b879b]'
        }`}>
          Как вы хотите использовать Ovora Cargo?
        </p>

        {/* Role cards */}
        <div className="space-y-4 mb-8">
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => setSelectedRole(role.id)}
              className={`w-full p-6 rounded-2xl transition-all ${
                selectedRole === role.id
                  ? `bg-gradient-to-r ${role.color} shadow-2xl scale-105 text-white`
                  : theme === 'dark'
                    ? 'bg-[#1a2c33]/70 hover:bg-[#1a2c33]/90 text-white'
                    : 'bg-white/70 hover:bg-white/90 text-[#0d181c] border border-gray-200'
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`p-4 rounded-xl ${
                    selectedRole === role.id
                      ? 'bg-white/20'
                      : theme === 'dark'
                        ? 'bg-[#253840]'
                        : 'bg-[#e7f0f3]'
                  }`}
                >
                  {role.icon}
                </div>
                <div className="flex-1 text-left">
                  <h3 className="text-xl font-bold mb-1">{role.title}</h3>
                  <p className={`text-sm ${
                    selectedRole === role.id 
                      ? 'text-white/90' 
                      : theme === 'dark' 
                        ? 'text-[#8eaeb8]' 
                        : 'text-[#4b879b]'
                  }`}>{role.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Continue button */}
        <button
          onClick={handleContinue}
          disabled={!selectedRole}
          className={`w-full py-4 px-8 rounded-xl font-semibold transition-all ${
            selectedRole
              ? 'bg-black hover:bg-gray-900 text-white shadow-lg'
              : theme === 'dark'
                ? 'bg-[#1a2c33]/30 text-[#647c85] cursor-not-allowed'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          Продолжить
        </button>
      </div>
    </div>
  );
}