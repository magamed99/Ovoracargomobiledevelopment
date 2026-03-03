import { ArrowLeft, Share2, Layers, Plus, Minus, Navigation, MessageSquare, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useTheme } from '../context/ThemeContext';

export function TrackingPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();

  return (
    <div className={`relative h-screen w-full flex flex-col overflow-hidden font-['Sora'] ${
      theme === 'dark' ? 'bg-[#111821] text-white' : 'bg-[#f6f7f8] text-[#0f172a]'
    }`}>
      {/* Map Background Layer */}
      <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
        <img
          alt="Map view"
          className="w-full h-full object-cover grayscale brightness-50"
          src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=1200&h=1200&fit=crop"
        />
        <div className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, rgba(17,24,33,0.8) 0%, rgba(17,24,33,0) 20%, rgba(17,24,33,0) 80%, rgba(17,24,33,0.9) 100%)'
          }}
        />
        
        {/* Route Line SVG */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 800">
          <path
            d="M 320 700 Q 250 500 150 300 T 80 100"
            fill="none"
            stroke="#1978e5"
            strokeDasharray="8 12"
            strokeLinecap="round"
            strokeWidth="4"
            opacity="0.8"
          />
          {/* Origin Marker */}
          <circle cx="320" cy="700" r="6" fill="#1978e5" />
          <text x="240" y="720" fill="white" fontSize="12" fontWeight="bold">Душанбе</text>
          {/* Destination Marker */}
          <circle cx="80" cy="100" r="6" fill="#1978e5" />
          <text x="95" y="105" fill="white" fontSize="12" fontWeight="bold">Москва</text>
          {/* Truck Indicator */}
          <g transform="translate(180, 380)">
            <circle cx="0" cy="0" r="16" fill="#1978e5" opacity="0.4" className="animate-pulse" />
            <circle cx="0" cy="0" r="10" fill="#1978e5" />
            <path d="M-4 -3 L4 -3 L4 3 L-4 3 Z" fill="white" />
            <rect x="-6" y="-1" width="2" height="4" fill="white" />
          </g>
        </svg>
      </div>

      {/* Top Navigation Overlay */}
      <div className="absolute top-0 left-0 right-0 p-6 pt-12 z-20 flex justify-between items-start">
        <button
          onClick={() => navigate(-1)}
          className={`w-10 h-10 rounded-full flex items-center justify-center text-white border backdrop-blur-md ${
            theme === 'dark'
              ? 'bg-[#111821]/60 border-white/10'
              : 'bg-[#111821]/60 border-white/10'
          }`}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className={`px-4 py-2 rounded-full border text-center backdrop-blur-md ${
          theme === 'dark'
            ? 'bg-[#111821]/60 border-white/10'
            : 'bg-[#111821]/60 border-white/10'
        }`}>
          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
            Заказ № OV-99283
          </p>
          <p className="text-sm font-bold text-white">В пути — 65%</p>
        </div>
        <button
          className={`w-10 h-10 rounded-full flex items-center justify-center text-white border backdrop-blur-md ${
            theme === 'dark'
              ? 'bg-[#111821]/60 border-white/10'
              : 'bg-[#111821]/60 border-white/10'
          }`}
        >
          <Share2 className="w-5 h-5" />
        </button>
      </div>

      {/* Floating Action Buttons (Right side) */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-3">
        <button className={`w-12 h-12 rounded-xl flex items-center justify-center text-white border shadow-lg backdrop-blur-md ${
          theme === 'dark'
            ? 'bg-[#111821]/80 border-white/10'
            : 'bg-[#111821]/80 border-white/10'
        }`}>
          <Navigation className="w-5 h-5" />
        </button>
        <button className={`w-12 h-12 rounded-xl flex items-center justify-center text-white border shadow-lg backdrop-blur-md ${
          theme === 'dark'
            ? 'bg-[#111821]/80 border-white/10'
            : 'bg-[#111821]/80 border-white/10'
        }`}>
          <Layers className="w-5 h-5" />
        </button>
        <div className={`flex flex-col rounded-xl border shadow-lg backdrop-blur-md divide-y ${
          theme === 'dark'
            ? 'bg-[#111821]/80 border-white/10 divide-white/10'
            : 'bg-[#111821]/80 border-white/10 divide-white/10'
        }`}>
          <button className="w-12 h-12 flex items-center justify-center text-white">
            <Plus className="w-5 h-5" />
          </button>
          <button className="w-12 h-12 flex items-center justify-center text-white">
            <Minus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Bottom Sheet */}
      <div className={`absolute bottom-0 left-0 w-full z-40 rounded-t-2xl shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)] flex flex-col transition-all duration-300 ease-in-out max-h-[85vh] ${
        theme === 'dark'
          ? 'bg-[#1a2c32]'
          : 'bg-white'
      }`}>
        {/* Drag Handle */}
        <div className="w-full flex items-center justify-center pt-3 pb-2 cursor-pointer">
          <div className={`w-12 h-1.5 rounded-full ${
            theme === 'dark' ? 'bg-[#334155]' : 'bg-[#cbd5e1]'
          }`} />
        </div>

        {/* Main Content Area */}
        <div className="px-5 pb-6 flex flex-col gap-5 overflow-y-auto scrollbar-hide">
          {/* Hero Stats: ETA & Destination */}
          <div className="flex flex-col gap-1">
            <div className="flex items-start justify-between">
              <div>
                <h2 className={`text-2xl font-extrabold tracking-tight ${
                  theme === 'dark' ? 'text-white' : 'text-[#0f172a]'
                }`}>
                  Arriving in 2h 15m
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-sm font-medium ${
                    theme === 'dark' ? 'text-[#94a3b8]' : 'text-[#64748b]'
                  }`}>
                    11:45 PM Arrival
                  </span>
                  <span className={theme === 'dark' ? 'text-[#475569]' : 'text-[#cbd5e1]'}>•</span>
                  <span className="text-sm font-medium text-green-600 dark:text-green-400 flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500" /> On Time
                  </span>
                </div>
              </div>
              {/* Signal Status Indicator */}
              <div className="flex flex-col items-end">
                <div className={`flex items-center gap-1 text-xs font-medium ${
                  theme === 'dark' ? 'text-[#64748b]' : 'text-[#64748b]'
                }`}>
                  <div className="flex gap-0.5">
                    <div className="w-1 h-3 bg-green-500 rounded-full" />
                    <div className="w-1 h-4 bg-green-500 rounded-full" />
                    <div className="w-1 h-5 bg-green-500 rounded-full" />
                  </div>
                  <span>GPS Live</span>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className={`w-full h-2 rounded-full overflow-hidden flex ${
            theme === 'dark' ? 'bg-[#253840]' : 'bg-[#e2e8f0]'
          }`}>
            <div className="bg-[#1978e5] h-full w-[75%] rounded-full relative">
              <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/30 animate-pulse" />
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className={`p-3 rounded-xl flex items-center gap-3 ${
              theme === 'dark' ? 'bg-[#111821]' : 'bg-[#f0f3f5]'
            }`}>
              <div className={`size-10 rounded-full flex items-center justify-center ${
                theme === 'dark'
                  ? 'bg-blue-900/30 text-[#1978e5]'
                  : 'bg-blue-100 text-[#1978e5]'
              }`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <div className={`text-lg font-bold ${
                  theme === 'dark' ? 'text-white' : 'text-[#0f172a]'
                }`}>
                  85 <span className={`text-xs font-normal ${
                    theme === 'dark' ? 'text-[#64748b]' : 'text-[#64748b]'
                  }`}>km/h</span>
                </div>
                <div className={`text-xs ${
                  theme === 'dark' ? 'text-[#64748b]' : 'text-[#64748b]'
                }`}>
                  Avg. Speed
                </div>
              </div>
            </div>
            <div className={`p-3 rounded-xl flex items-center gap-3 ${
              theme === 'dark' ? 'bg-[#111821]' : 'bg-[#f0f3f5]'
            }`}>
              <div className={`size-10 rounded-full flex items-center justify-center ${
                theme === 'dark'
                  ? 'bg-purple-900/30 text-purple-400'
                  : 'bg-purple-100 text-purple-600'
              }`}>
                <Navigation className="w-5 h-5" />
              </div>
              <div>
                <div className={`text-lg font-bold ${
                  theme === 'dark' ? 'text-white' : 'text-[#0f172a]'
                }`}>
                  140 <span className={`text-xs font-normal ${
                    theme === 'dark' ? 'text-[#64748b]' : 'text-[#64748b]'
                  }`}>km</span>
                </div>
                <div className={`text-xs ${
                  theme === 'dark' ? 'text-[#64748b]' : 'text-[#64748b]'
                }`}>
                  Remaining
                </div>
              </div>
            </div>
          </div>

          {/* Destination & Route Info */}
          <div className={`flex gap-4 items-start pt-2 border-t ${
            theme === 'dark' ? 'border-[#253840]/50' : 'border-[#e2e8f0]/50'
          }`}>
            <div className="flex flex-col items-center gap-1 pt-1">
              <div className={`w-2 h-2 rounded-full ${
                theme === 'dark' ? 'bg-[#475569]' : 'bg-[#cbd5e1]'
              }`} />
              <div className={`w-0.5 h-8 border-l border-dashed ${
                theme === 'dark' ? 'border-[#475569]' : 'border-[#cbd5e1]'
              }`} />
              <div className="text-[#1978e5]">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
              </div>
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <p className={`text-xs uppercase font-semibold tracking-wider ${
                  theme === 'dark' ? 'text-[#64748b]' : 'text-[#64748b]'
                }`}>
                  From
                </p>
                <p className={`text-sm font-medium ${
                  theme === 'dark' ? 'text-[#cbd5e1]' : 'text-[#475569]'
                }`}>
                  Dushanbe, TJK
                </p>
              </div>
              <div>
                <p className={`text-xs uppercase font-semibold tracking-wider ${
                  theme === 'dark' ? 'text-[#64748b]' : 'text-[#64748b]'
                }`}>
                  Destination
                </p>
                <p className={`text-base font-bold leading-tight ${
                  theme === 'dark' ? 'text-white' : 'text-[#0f172a]'
                }`}>
                  Moscow, Central Logistics Hub
                </p>
                <p className={`text-xs mt-0.5 ${
                  theme === 'dark' ? 'text-[#64748b]' : 'text-[#64748b]'
                }`}>
                  via M5 Ural Highway
                </p>
              </div>
            </div>
          </div>

          {/* Driver Profile Snippet */}
          <div className={`flex items-center gap-3 p-3 rounded-xl ${
            theme === 'dark' ? 'bg-[#111821]' : 'bg-[#f0f3f5]'
          }`}>
            <div className="relative">
              <div
                className="size-10 rounded-full overflow-hidden"
                style={{
                  backgroundImage: "url('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop')",
                  backgroundSize: 'cover'
                }}
              />
              <div className={`absolute -bottom-1 -right-1 rounded-full p-0.5 ${
                theme === 'dark' ? 'bg-[#111821]' : 'bg-[#f0f3f5]'
              }`}>
                <div className="bg-yellow-400 rounded-full p-0.5">
                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="flex-1">
              <h4 className={`text-sm font-bold ${
                theme === 'dark' ? 'text-white' : 'text-[#0f172a]'
              }`}>
                Farrukh S.
              </h4>
              <p className={`text-xs ${
                theme === 'dark' ? 'text-[#64748b]' : 'text-[#64748b]'
              }`}>
                Volvo FH16 • Grey • 9284 RT
              </p>
            </div>
            <button className={`size-8 rounded-full flex items-center justify-center transition-colors ${
              theme === 'dark'
                ? 'bg-[#253840] text-[#cbd5e1] hover:bg-[#334155]'
                : 'bg-[#cbd5e1] text-[#475569] hover:bg-[#b4c0d0]'
            }`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-4 gap-3 pt-2">
            <button
              onClick={() => navigate('/messages')}
              className="col-span-3 bg-[#1978e5] hover:bg-[#1565c0] text-white h-12 rounded-lg font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#1978e5]/20 transition-all active:scale-[0.98]"
            >
              <MessageSquare className="w-5 h-5" />
              Message Driver
            </button>
            <button className={`col-span-1 border h-12 rounded-lg flex items-center justify-center transition-colors active:scale-[0.98] ${
              theme === 'dark'
                ? 'border-red-900/50 bg-red-900/20 text-red-400 hover:bg-red-900/40'
                : 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
            }`}>
              <AlertTriangle className="w-5 h-5" />
            </button>
          </div>

          {/* Bottom safe area spacer */}
          <div className="h-4" />
        </div>
      </div>
    </div>
  );
}
