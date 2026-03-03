import { 
  Settings, 
  Star, 
  Shield, 
  CreditCard, 
  Bell, 
  HelpCircle, 
  LogOut,
  ChevronRight,
  User,
  Phone,
  Mail,
  MapPin,
  Award
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { useTheme } from '../context/ThemeContext';
import { BottomNav } from './BottomNav';

export function ProfilePage() {
  const navigate = useNavigate();
  const { theme } = useTheme();

  const menuItems = [
    {
      icon: User,
      label: 'Edit Profile',
      description: 'Update your personal information',
      action: () => navigate('/profile/edit'),
    },
    {
      icon: Star,
      label: 'My Reviews',
      description: '4.9 rating • 124 reviews',
      action: () => navigate('/reviews'),
    },
    {
      icon: CreditCard,
      label: 'Payment History',
      description: 'View transactions',
      action: () => navigate('/payments'),
    },
    {
      icon: Shield,
      label: 'Document Verification',
      description: 'Verified driver',
      action: () => navigate('/documents'),
      verified: true,
    },
    {
      icon: Bell,
      label: 'Notifications',
      description: 'Manage your notifications',
      action: () => navigate('/notifications'),
      badge: 3,
    },
    {
      icon: Settings,
      label: 'Settings',
      description: 'App preferences',
      action: () => {},
    },
    {
      icon: HelpCircle,
      label: 'Help & Support',
      description: '24/7 customer service',
      action: () => {},
    },
  ];

  const stats = [
    { label: 'Trips', value: '24', icon: Award },
    { label: 'Rating', value: '4.9', icon: Star },
    { label: 'Years', value: '2', icon: Shield },
  ];

  return (
    <div className={`min-h-screen flex flex-col overflow-x-hidden antialiased font-['Sora'] ${
      theme === 'dark' ? 'bg-[#111821] text-white' : 'bg-[#f6f7f8] text-[#0f172a]'
    }`}>
      {/* Header */}
      <header className={`sticky top-0 z-20 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b ${
        theme === 'dark'
          ? 'bg-[#111821]/90 border-[#253840]'
          : 'bg-[#f6f7f8]/90 border-[#e2e8f0]'
      }`}>
        <h1 className="text-lg font-bold">Profile</h1>
        <button
          onClick={() => {}}
          className={`p-2 rounded-full transition-colors ${
            theme === 'dark'
              ? 'hover:bg-[#253840] text-[#cbd5e1]'
              : 'hover:bg-[#e2e8f0] text-[#475569]'
          }`}
        >
          <Settings className="w-5 h-5" />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col gap-6 px-4 pt-6 pb-24">
        {/* Profile Card */}
        <section className={`rounded-2xl p-6 shadow-sm border ${
          theme === 'dark'
            ? 'bg-[#1a2c32] border-[#253840]'
            : 'bg-white border-[#e2e8f0]'
        }`}>
          <div className="flex items-center gap-4 mb-6">
            <div
              className="w-20 h-20 rounded-full bg-cover bg-center border-4 shadow-lg"
              style={{
                backgroundImage: "url('https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop')",
                borderColor: theme === 'dark' ? '#1a2c32' : '#ffffff'
              }}
            />
            <div className="flex-1">
              <h2 className={`text-2xl font-bold mb-1 ${
                theme === 'dark' ? 'text-white' : 'text-[#0f172a]'
              }`}>
                Александр Иванов
              </h2>
              <div className="flex items-center gap-2">
                <div className={`px-2 py-1 rounded-md text-xs font-bold ${
                  theme === 'dark'
                    ? 'bg-green-900/30 text-green-400'
                    : 'bg-green-100 text-green-700'
                }`}>
                  Verified Driver
                </div>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3">
              <Phone className={`w-4 h-4 ${
                theme === 'dark' ? 'text-[#64748b]' : 'text-[#64748b]'
              }`} />
              <span className={`text-sm ${
                theme === 'dark' ? 'text-[#cbd5e1]' : 'text-[#475569]'
              }`}>
                +992 900 123 456
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Mail className={`w-4 h-4 ${
                theme === 'dark' ? 'text-[#64748b]' : 'text-[#64748b]'
              }`} />
              <span className={`text-sm ${
                theme === 'dark' ? 'text-[#cbd5e1]' : 'text-[#475569]'
              }`}>
                alex.ivanov@example.com
              </span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className={`w-4 h-4 ${
                theme === 'dark' ? 'text-[#64748b]' : 'text-[#64748b]'
              }`} />
              <span className={`text-sm ${
                theme === 'dark' ? 'text-[#cbd5e1]' : 'text-[#475569]'
              }`}>
                Dushanbe, Tajikistan
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className={`rounded-xl p-3 text-center ${
                    theme === 'dark' ? 'bg-[#253840]' : 'bg-[#f0f3f5]'
                  }`}
                >
                  <div className="flex justify-center mb-2">
                    <Icon className="w-5 h-5 text-[#1978e5]" />
                  </div>
                  <div className={`text-xl font-bold ${
                    theme === 'dark' ? 'text-white' : 'text-[#0f172a]'
                  }`}>
                    {stat.value}
                  </div>
                  <div className={`text-xs ${
                    theme === 'dark' ? 'text-[#64748b]' : 'text-[#64748b]'
                  }`}>
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Menu Items */}
        <section className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={item.action}
                className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all active:scale-[0.99] ${
                  theme === 'dark'
                    ? 'bg-[#1a2c32] hover:bg-[#253840] border border-[#253840]'
                    : 'bg-white hover:bg-[#f8fafc] border border-[#e2e8f0]'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  theme === 'dark' ? 'bg-[#253840]' : 'bg-[#f0f3f5]'
                }`}>
                  <Icon className={`w-5 h-5 ${
                    theme === 'dark' ? 'text-[#cbd5e1]' : 'text-[#475569]'
                  }`} />
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <h3 className={`font-semibold ${
                      theme === 'dark' ? 'text-white' : 'text-[#0f172a]'
                    }`}>
                      {item.label}
                    </h3>
                    {item.verified && (
                      <Shield className="w-4 h-4 text-green-500" />
                    )}
                    {item.badge && (
                      <span className="px-1.5 py-0.5 rounded-full bg-red-500 text-white text-xs font-bold">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className={`text-sm ${
                    theme === 'dark' ? 'text-[#64748b]' : 'text-[#64748b]'
                  }`}>
                    {item.description}
                  </p>
                </div>
                <ChevronRight className={`w-5 h-5 ${
                  theme === 'dark' ? 'text-[#64748b]' : 'text-[#64748b]'
                }`} />
              </button>
            );
          })}
        </section>

        {/* Logout Button */}
        <button
          onClick={() => navigate('/welcome')}
          className={`w-full flex items-center justify-center gap-2 p-4 rounded-xl font-semibold transition-all ${
            theme === 'dark'
              ? 'bg-red-900/20 text-red-400 hover:bg-red-900/30'
              : 'bg-red-50 text-red-600 hover:bg-red-100'
          }`}
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
