import { useState } from 'react';
import { Search, Edit, CheckCheck, Check } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { BottomNav } from './BottomNav';

export function MessagesPage() {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  const chats = [
    {
      id: 1,
      name: 'Farrukh T.',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
      lastMessage: 'Is the cargo ready for pickup?',
      time: '10:30 AM',
      unread: 2,
      online: true,
      isImportant: true,
    },
    {
      id: 2,
      name: 'Dushanbe Express',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
      lastMessage: 'We arrive at the border in 2 hours.',
      time: 'Yesterday',
      unread: 1,
      online: false,
      isImportant: true,
    },
    {
      id: 3,
      name: 'Moscow Logistics',
      initials: 'ML',
      lastMessage: 'Payment received. Thanks.',
      time: 'Tue',
      unread: 0,
      online: false,
      isRead: true,
    },
    {
      id: 4,
      name: 'Samira K.',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
      lastMessage: 'I have sent the documents.',
      time: 'Tue',
      unread: 0,
      online: false,
      isRead: true,
      isSent: true,
    },
    {
      id: 5,
      name: 'Rustam Cargo',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
      lastMessage: 'Call me when you arrive.',
      time: 'Mon',
      unread: 0,
      online: false,
    },
    {
      id: 6,
      name: 'Khujand Base',
      initials: 'KB',
      lastMessage: 'Route updated.',
      time: 'Last Week',
      unread: 0,
      online: false,
      isRead: true,
    },
  ];

  return (
    <div className={`flex flex-col h-screen w-full max-w-md mx-auto shadow-2xl font-['Sora'] ${
      theme === 'dark' ? 'bg-[#111821]' : 'bg-[#f6f7f8]'
    }`}>
      {/* Header */}
      <header className={`flex items-center justify-between px-5 pt-6 pb-2 shrink-0 ${
        theme === 'dark' ? 'bg-[#111821]' : 'bg-[#f6f7f8]'
      }`}>
        <h1 className={`text-[28px] font-bold tracking-tight leading-tight ${
          theme === 'dark' ? 'text-white' : 'text-[#111618]'
        }`}>
          Messages
        </h1>
        <button className="flex items-center justify-center w-10 h-10 rounded-full text-[#1978e5] hover:bg-[#1978e5]/10 transition-colors">
          <Edit className="w-6 h-6" />
        </button>
      </header>

      {/* Search Bar */}
      <div className={`px-4 py-3 shrink-0 z-10 ${
        theme === 'dark' ? 'bg-[#111821]' : 'bg-[#f6f7f8]'
      }`}>
        <div className={`relative flex items-center w-full h-11 rounded-lg overflow-hidden group focus-within:ring-2 focus-within:ring-[#1978e5]/50 transition-all ${
          theme === 'dark' ? 'bg-[#1a2c32]' : 'bg-[#f0f3f5]'
        }`}>
          <div className={`grid place-items-center h-full w-12 group-focus-within:text-[#1978e5] transition-colors ${
            theme === 'dark' ? 'text-[#60808a]' : 'text-[#60808a]'
          }`}>
            <Search className="w-5 h-5" />
          </div>
          <input
            className={`peer h-full w-full border-none outline-none text-[15px] pr-4 bg-transparent font-normal ${
              theme === 'dark' 
                ? 'text-white placeholder-[#60808a]' 
                : 'text-[#111618] placeholder-[#60808a]'
            }`}
            placeholder="Search drivers or cargo..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Chat List */}
      <main className={`flex-1 overflow-y-auto pb-24 ${
        theme === 'dark' ? 'bg-[#111821]' : 'bg-[#f6f7f8]'
      }`}>
        {chats.map((chat) => (
          <div
            key={chat.id}
            className={`group flex items-center gap-4 px-4 py-3.5 cursor-pointer transition-colors border-b ${
              theme === 'dark'
                ? 'hover:bg-[#15252b] active:bg-[#1a2c32] border-[#1a2c32]'
                : 'hover:bg-gray-50 active:bg-gray-100 border-[#f0f3f5]'
            }`}
          >
            <div className="relative shrink-0">
              {chat.avatar ? (
                <img
                  alt={chat.name}
                  className="h-[56px] w-[56px] rounded-full object-cover"
                  src={chat.avatar}
                />
              ) : (
                <div className={`h-[56px] w-[56px] rounded-full flex items-center justify-center text-xl font-bold ${
                  theme === 'dark'
                    ? 'bg-[#1978e5]/20 text-[#1978e5]'
                    : 'bg-[#e6f2f6] text-[#1978e5]'
                }`}>
                  {chat.initials}
                </div>
              )}
              {chat.online && (
                <div className={`absolute bottom-0 right-0 p-0.5 rounded-full ${
                  theme === 'dark' ? 'bg-[#111821]' : 'bg-[#f6f7f8]'
                }`}>
                  <div className="w-3 h-3 bg-green-500 rounded-full border-2" style={{
                    borderColor: theme === 'dark' ? '#111821' : '#f6f7f8'
                  }} />
                </div>
              )}
            </div>

            <div className="flex flex-col flex-1 min-w-0 gap-1">
              <div className="flex justify-between items-baseline">
                <h3 className={`text-[17px] font-bold truncate ${
                  theme === 'dark' ? 'text-white' : 'text-[#111618]'
                }`}>
                  {chat.name}
                </h3>
                <span className={`text-[13px] whitespace-nowrap ml-2 ${
                  chat.isImportant && chat.unread > 0
                    ? 'text-green-600 dark:text-green-500 font-medium'
                    : theme === 'dark'
                      ? 'text-[#60808a]'
                      : 'text-[#60808a]'
                }`}>
                  {chat.time}
                </span>
              </div>
              <div className="flex justify-between items-start gap-3">
                <p className={`text-[15px] truncate leading-snug ${
                  chat.unread > 0
                    ? theme === 'dark'
                      ? 'text-gray-200 font-medium'
                      : 'text-[#111618] font-medium'
                    : theme === 'dark'
                      ? 'text-[#60808a]'
                      : 'text-[#60808a]'
                }`}>
                  {chat.lastMessage}
                </p>
                {chat.unread > 0 ? (
                  <div className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-[#078836] shadow-sm mt-0.5">
                    <span className="text-[11px] font-bold text-white leading-none">
                      {chat.unread}
                    </span>
                  </div>
                ) : chat.unread === 0 && !chat.isImportant ? (
                  chat.isRead ? (
                    <CheckCheck className="w-[18px] h-[18px] text-[#1978e5] shrink-0 mt-0.5" />
                  ) : chat.isSent ? (
                    <Check className="w-[18px] h-[18px] text-[#60808a] shrink-0 mt-0.5" />
                  ) : null
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}