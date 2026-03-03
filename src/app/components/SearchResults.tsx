import { useState } from 'react';
import { MapPin, Star, Users, Package, ArrowLeft, Filter, ChevronRight, Shield } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useTheme } from '../context/ThemeContext';
import { BottomNav } from './BottomNav';

export function SearchResults() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [filter, setFilter] = useState<'all' | 'price' | 'rating' | 'date'>('all');

  const results = [
    {
      id: 1,
      driver: {
        name: 'Farrukh S.',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
        rating: 4.9,
        trips: 120,
        verified: true,
      },
      from: 'Dushanbe',
      to: 'Moscow',
      date: 'Oct 24, 08:00 AM',
      availableSeats: 3,
      cargoCapacity: 50,
      pricePerSeat: 500,
      currency: 'TJS',
      car: 'Toyota Camry',
    },
    {
      id: 2,
      driver: {
        name: 'Rustam K.',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
        rating: 4.8,
        trips: 85,
        verified: true,
      },
      from: 'Dushanbe',
      to: 'Moscow',
      date: 'Oct 25, 10:00 AM',
      availableSeats: 2,
      cargoCapacity: 30,
      pricePerSeat: 480,
      currency: 'TJS',
      car: 'Mercedes E-Class',
    },
    {
      id: 3,
      driver: {
        name: 'Alisher M.',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
        rating: 4.7,
        trips: 42,
        verified: false,
      },
      from: 'Dushanbe',
      to: 'Moscow',
      date: 'Oct 24, 06:00 PM',
      availableSeats: 4,
      cargoCapacity: 60,
      pricePerSeat: 520,
      currency: 'TJS',
      car: 'BMW 5 Series',
    },
  ];

  return (
    <div className={`min-h-screen flex flex-col pb-24 font-['Sora'] ${
      theme === 'dark' ? 'bg-[#111821]' : 'bg-[#f6f7f8]'
    }`}>
      {/* Header */}
      <header className={`sticky top-0 z-20 backdrop-blur-md border-b ${
        theme === 'dark'
          ? 'bg-[#111821]/95 border-[#253840]'
          : 'bg-[#f6f7f8]/95 border-[#cbd5e1]'
      }`}>
        {/* Top Nav */}
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className={`flex size-10 items-center justify-center rounded-full transition-colors ${
              theme === 'dark'
                ? 'hover:bg-[#253840]'
                : 'hover:bg-[#e2e8f0]'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className={`text-lg font-bold leading-tight tracking-tight flex-1 text-center ${
            theme === 'dark' ? 'text-white' : 'text-[#0f172a]'
          }`}>
            Search Results
          </h2>
          <button className={`flex size-10 items-center justify-center rounded-full transition-colors ${
            theme === 'dark'
              ? 'hover:bg-[#253840]'
              : 'hover:bg-[#e2e8f0]'
          }`}>
            <Filter className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Chips */}
        <div className="px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
          {[
            { value: 'all', label: 'All Results' },
            { value: 'price', label: 'Best Price' },
            { value: 'rating', label: 'Top Rated' },
            { value: 'date', label: 'Earliest' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value as any)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
                filter === option.value
                  ? 'bg-[#1978e5] text-white shadow-lg shadow-[#1978e5]/20'
                  : theme === 'dark'
                    ? 'bg-[#253840] text-[#cbd5e1] hover:bg-[#334155]'
                    : 'bg-white text-[#475569] hover:bg-[#f8fafc] border border-[#e2e8f0]'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </header>

      {/* Results Count */}
      <div className={`px-4 py-3 ${
        theme === 'dark' ? 'text-[#94a3b8]' : 'text-[#64748b]'
      }`}>
        <p className="text-sm font-medium">
          Found <span className={`font-bold ${
            theme === 'dark' ? 'text-white' : 'text-[#0f172a]'
          }`}>{results.length} trips</span> for your route
        </p>
      </div>

      {/* Results List */}
      <main className="px-4 flex flex-col gap-4">
        {results.map((trip) => (
          <article
            key={trip.id}
            onClick={() => navigate(`/trip/${trip.id}`)}
            className={`rounded-2xl p-4 shadow-sm border cursor-pointer transition-all hover:shadow-md active:scale-[0.99] ${
              theme === 'dark'
                ? 'bg-[#1a2c32] border-[#253840]'
                : 'bg-white border-[#e2e8f0]'
            }`}
          >
            {/* Driver Header */}
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-12 h-12 rounded-full bg-cover bg-center border-2 shadow-sm"
                style={{
                  backgroundImage: `url('${trip.driver.avatar}')`,
                  borderColor: theme === 'dark' ? '#334155' : '#ffffff'
                }}
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className={`font-bold ${
                    theme === 'dark' ? 'text-white' : 'text-[#0f172a]'
                  }`}>
                    {trip.driver.name}
                  </h3>
                  {trip.driver.verified && (
                    <Shield className="w-4 h-4 text-[#1978e5]" />
                  )}
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className={`font-semibold ${
                    theme === 'dark' ? 'text-white' : 'text-[#0f172a]'
                  }`}>
                    {trip.driver.rating}
                  </span>
                  <span className={theme === 'dark' ? 'text-[#64748b]' : 'text-[#64748b]'}>
                    ({trip.driver.trips} trips)
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-[#1978e5]">
                  {trip.pricePerSeat}
                </div>
                <div className={`text-xs ${
                  theme === 'dark' ? 'text-[#64748b]' : 'text-[#64748b]'
                }`}>
                  {trip.currency}/seat
                </div>
              </div>
            </div>

            {/* Route */}
            <div className={`flex items-center gap-2 mb-3 pb-3 border-b ${
              theme === 'dark' ? 'border-[#253840]' : 'border-[#e2e8f0]'
            }`}>
              <div className={`px-3 py-1 rounded-lg ${
                theme === 'dark' ? 'bg-[#253840]' : 'bg-[#f0f3f5]'
              }`}>
                <span className={`font-bold text-sm ${
                  theme === 'dark' ? 'text-white' : 'text-[#0f172a]'
                }`}>
                  {trip.from}
                </span>
              </div>
              <div className="flex-1 flex items-center gap-1">
                <div className={`flex-1 h-0.5 ${
                  theme === 'dark' ? 'bg-[#334155]' : 'bg-[#cbd5e1]'
                }`} />
                <ChevronRight className={`w-4 h-4 ${
                  theme === 'dark' ? 'text-[#64748b]' : 'text-[#64748b]'
                }`} />
                <div className={`flex-1 h-0.5 ${
                  theme === 'dark' ? 'bg-[#334155]' : 'bg-[#cbd5e1]'
                }`} />
              </div>
              <div className={`px-3 py-1 rounded-lg ${
                theme === 'dark' ? 'bg-[#253840]' : 'bg-[#f0f3f5]'
              }`}>
                <span className={`font-bold text-sm ${
                  theme === 'dark' ? 'text-white' : 'text-[#0f172a]'
                }`}>
                  {trip.to}
                </span>
              </div>
            </div>

            {/* Trip Details Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className={`p-2 rounded-lg flex flex-col items-center ${
                theme === 'dark' ? 'bg-[#253840]' : 'bg-[#f0f3f5]'
              }`}>
                <Users className={`w-5 h-5 mb-1 ${
                  theme === 'dark' ? 'text-[#cbd5e1]' : 'text-[#475569]'
                }`} />
                <span className={`text-xs font-bold ${
                  theme === 'dark' ? 'text-white' : 'text-[#0f172a]'
                }`}>
                  {trip.availableSeats}
                </span>
                <span className={`text-[10px] ${
                  theme === 'dark' ? 'text-[#64748b]' : 'text-[#64748b]'
                }`}>
                  Seats
                </span>
              </div>
              <div className={`p-2 rounded-lg flex flex-col items-center ${
                theme === 'dark' ? 'bg-[#253840]' : 'bg-[#f0f3f5]'
              }`}>
                <Package className={`w-5 h-5 mb-1 ${
                  theme === 'dark' ? 'text-[#cbd5e1]' : 'text-[#475569]'
                }`} />
                <span className={`text-xs font-bold ${
                  theme === 'dark' ? 'text-white' : 'text-[#0f172a]'
                }`}>
                  {trip.cargoCapacity}kg
                </span>
                <span className={`text-[10px] ${
                  theme === 'dark' ? 'text-[#64748b]' : 'text-[#64748b]'
                }`}>
                  Cargo
                </span>
              </div>
              <div className={`p-2 rounded-lg flex flex-col items-center ${
                theme === 'dark' ? 'bg-[#253840]' : 'bg-[#f0f3f5]'
              }`}>
                <MapPin className={`w-5 h-5 mb-1 ${
                  theme === 'dark' ? 'text-[#cbd5e1]' : 'text-[#475569]'
                }`} />
                <span className={`text-[10px] font-medium leading-tight text-center ${
                  theme === 'dark' ? 'text-white' : 'text-[#0f172a]'
                }`}>
                  {trip.date.split(',')[0]}
                </span>
              </div>
            </div>

            {/* View Details Button */}
            <button className="w-full mt-4 bg-[#1978e5] hover:bg-[#1565c0] text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2">
              View Details
              <ChevronRight className="w-5 h-5" />
            </button>
          </article>
        ))}
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
