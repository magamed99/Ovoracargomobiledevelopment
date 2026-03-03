import { useState } from 'react';
import { Search, MoreVertical, Calendar, Truck, Package, MapPin, Play, Map as MapIcon, User } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useTheme } from '../context/ThemeContext';
import { BottomNav } from './BottomNav';

type TripStatus = 'active' | 'completed';

export function TripsPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<TripStatus>('active');

  const trips = [
    {
      id: 1,
      status: 'planned',
      from: 'Dushanbe',
      to: 'Moscow',
      date: 'Oct 24, 2023',
      time: '08:00 AM',
      vehicle: 'Mercedes Sprinter',
      weight: '1200kg',
      role: 'driver',
      mapImage: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=400&h=400&fit=crop',
    },
    {
      id: 2,
      status: 'inProgress',
      from: 'Khujand',
      to: 'St. Petersburg',
      date: 'Oct 25, 2023',
      time: '10:00 AM',
      seats: 1,
      luggage: 2,
      driverName: 'Rustam K.',
      driverAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
      role: 'passenger',
      mapImage: 'https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?w=400&h=400&fit=crop',
      isLive: true,
    },
  ];

  const filteredTrips = trips.filter(trip =>
    activeTab === 'active' ? ['planned', 'inProgress'].includes(trip.status) : trip.status === 'completed'
  );

  return (
    <div className={`flex flex-col min-h-screen overflow-x-hidden font-['Sora'] ${
      theme === 'dark' ? 'bg-[#111821] text-white' : 'bg-[#f6f7f8] text-[#0f172a]'
    }`}>
      {/* Top Navigation */}
      <header className={`sticky top-0 z-50 backdrop-blur-md border-b px-4 py-3 flex items-center justify-between ${
        theme === 'dark'
          ? 'bg-[#111821]/95 border-[#253840]'
          : 'bg-[#f6f7f8]/95 border-[#cbd5e1]'
      }`}>
        <div className="w-10" />
        <h1 className="text-lg font-bold text-center flex-1 tracking-tight">
          My Trips
        </h1>
        <div className="w-10 flex justify-end">
          <button className={`p-2 -mr-2 rounded-full transition-colors ${
            theme === 'dark'
              ? 'hover:bg-[#253840] text-[#cbd5e1]'
              : 'hover:bg-[#e2e8f0] text-[#475569]'
          }`}>
            <Search className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Scrollable Content Area */}
      <div className="flex-1 flex flex-col pb-24">
        {/* Segmented Control */}
        <div className="px-4 py-4 sticky top-[57px] z-40" style={{
          backgroundColor: theme === 'dark' ? '#111821' : '#f6f7f8'
        }}>
          <div className={`flex h-10 w-full items-center justify-center rounded-lg p-1 ${
            theme === 'dark' ? 'bg-[#253840]' : 'bg-[#cbd5e1]'
          }`}>
            <button
              onClick={() => setActiveTab('active')}
              className={`flex h-full flex-1 items-center justify-center rounded-[4px] transition-all duration-200 ease-in-out ${
                activeTab === 'active'
                  ? theme === 'dark'
                    ? 'bg-[#334155] shadow-[0_1px_3px_rgba(0,0,0,0.3)]'
                    : 'bg-white shadow-[0_1px_3px_rgba(0,0,0,0.1)]'
                  : ''
              }`}
            >
              <span className={`text-sm font-semibold ${
                activeTab === 'active'
                  ? theme === 'dark'
                    ? 'text-white'
                    : 'text-[#1978e5]'
                  : theme === 'dark'
                    ? 'text-[#64748b]'
                    : 'text-[#64748b]'
              }`}>
                Active
              </span>
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`flex h-full flex-1 items-center justify-center rounded-[4px] transition-all duration-200 ease-in-out ${
                activeTab === 'completed'
                  ? theme === 'dark'
                    ? 'bg-[#334155] shadow-[0_1px_3px_rgba(0,0,0,0.3)]'
                    : 'bg-white shadow-[0_1px_3px_rgba(0,0,0,0.1)]'
                  : ''
              }`}
            >
              <span className={`text-sm font-semibold ${
                activeTab === 'completed'
                  ? theme === 'dark'
                    ? 'text-white'
                    : 'text-[#1978e5]'
                  : theme === 'dark'
                    ? 'text-[#64748b]'
                    : 'text-[#64748b]'
              }`}>
                Completed
              </span>
            </button>
          </div>
        </div>

        {/* Trips List */}
        <main className="px-4 flex flex-col gap-4">
          {filteredTrips.length === 0 ? (
            <div className={`flex flex-col items-center justify-center py-12 px-4 ${
              theme === 'dark' ? 'text-[#64748b]' : 'text-[#64748b]'
            }`}>
              <Truck className="w-16 h-16 mb-4 opacity-40" />
              <p className="text-lg font-medium">No trips found</p>
              <p className="text-sm mt-1">Start exploring and book your first trip!</p>
            </div>
          ) : (
            filteredTrips.map((trip) => (
              <article
                key={trip.id}
                className={`group relative flex flex-col gap-4 rounded-xl p-4 shadow-sm border overflow-hidden transition-all hover:shadow-md cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-[#1a2c32] border-[#253840]'
                    : 'bg-white border-[#e2e8f0]'
                }`}
                onClick={() => navigate(`/trip/${trip.id}`)}
              >
                {/* Header Row: Route & Status */}
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-1.5">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold w-fit ${
                      trip.status === 'planned'
                        ? theme === 'dark'
                          ? 'bg-yellow-900/30 text-yellow-400'
                          : 'bg-yellow-100 text-yellow-700'
                        : trip.status === 'inProgress'
                          ? theme === 'dark'
                            ? 'bg-green-900/30 text-green-400'
                            : 'bg-green-100 text-green-700'
                          : theme === 'dark'
                            ? 'bg-[#253840] text-[#cbd5e1]'
                            : 'bg-gray-100 text-gray-700'
                    }`}>
                      {trip.status === 'planned' ? (
                        <>
                          <Calendar className="w-3.5 h-3.5" />
                          Planned
                        </>
                      ) : trip.status === 'inProgress' ? (
                        <>
                          <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
                          In Progress
                        </>
                      ) : (
                        'Completed'
                      )}
                    </span>
                    <h3 className={`text-lg font-bold leading-tight mt-0.5 ${
                      theme === 'dark' ? 'text-white' : 'text-[#0f172a]'
                    }`}>
                      {trip.from} <span className="text-[#64748b] mx-1">→</span> {trip.to}
                    </h3>
                  </div>
                  {/* Menu */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    className={`p-1 -mr-2 rounded-full transition-colors ${
                      theme === 'dark'
                        ? 'text-[#64748b] hover:text-[#cbd5e1] hover:bg-[#253840]/50'
                        : 'text-[#64748b] hover:text-[#475569] hover:bg-[#f1f5f9]'
                    }`}
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>

                {/* Content Row with Image */}
                <div className="flex gap-4">
                  <div className="flex-1 flex flex-col gap-3">
                    {/* Date/Time */}
                    <div className={`flex items-center gap-2 text-sm ${
                      theme === 'dark' ? 'text-[#94a3b8]' : 'text-[#64748b]'
                    }`}>
                      <Calendar className="w-[18px] h-[18px] text-[#1978e5]" />
                      <span>{trip.date} • {trip.time}</span>
                    </div>
                    {/* Details */}
                    <div className={`flex items-center gap-2 text-sm ${
                      theme === 'dark' ? 'text-[#94a3b8]' : 'text-[#64748b]'
                    }`}>
                      {trip.role === 'driver' ? (
                        <>
                          <Truck className="w-[18px] h-[18px] text-[#1978e5]" />
                          <span>{trip.weight} • {trip.vehicle}</span>
                        </>
                      ) : (
                        <>
                          <Package className="w-[18px] h-[18px] text-[#1978e5]" />
                          <span>{trip.seats} Seat • {trip.luggage} Luggage</span>
                        </>
                      )}
                    </div>
                    {/* Driver/Passenger info */}
                    <div className="flex items-center gap-2 mt-1">
                      {trip.role === 'driver' ? (
                        <>
                          <div className={`h-6 w-6 rounded-full flex items-center justify-center overflow-hidden border shadow-sm ${
                            theme === 'dark'
                              ? 'bg-[#253840] border-[#334155]'
                              : 'bg-[#e2e8f0] border-white'
                          }`}>
                            <User className={`w-4 h-4 ${
                              theme === 'dark' ? 'text-[#cbd5e1]' : 'text-[#64748b]'
                            }`} />
                          </div>
                          <span className={`text-xs font-medium ${
                            theme === 'dark' ? 'text-[#cbd5e1]' : 'text-[#475569]'
                          }`}>
                            Driver: You
                          </span>
                        </>
                      ) : (
                        <>
                          <div
                            className="h-6 w-6 rounded-full overflow-hidden bg-cover bg-center border shadow-sm"
                            style={{
                              backgroundImage: `url('${trip.driverAvatar}')`,
                              borderColor: theme === 'dark' ? '#334155' : '#ffffff'
                            }}
                          />
                          <span className={`text-xs font-medium ${
                            theme === 'dark' ? 'text-[#cbd5e1]' : 'text-[#475569]'
                          }`}>
                            Driver: {trip.driverName}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  {/* Map/Image Thumbnail */}
                  <div className={`w-24 h-24 shrink-0 rounded-lg overflow-hidden relative shadow-inner ${
                    theme === 'dark' ? 'bg-[#253840]' : 'bg-[#e2e8f0]'
                  }`}>
                    <div
                      className="absolute inset-0 bg-cover bg-center opacity-90 transition-transform duration-500 group-hover:scale-110"
                      style={{ backgroundImage: `url('${trip.mapImage}')` }}
                    />
                    {trip.isLive && (
                      <div className="absolute top-2 right-2 h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 border border-white" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (trip.status === 'planned') {
                      navigate(`/tracking`);
                    } else if (trip.status === 'inProgress') {
                      navigate(`/tracking`);
                    }
                  }}
                  className={`w-full mt-1 flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold shadow-sm active:scale-[0.98] transition-all ${
                    trip.status === 'planned'
                      ? 'bg-[#1978e5] text-white hover:bg-[#1565c0]'
                      : theme === 'dark'
                        ? 'bg-[#253840] text-white hover:bg-[#334155]'
                        : 'bg-[#e2e8f0] text-[#0f172a] hover:bg-[#cbd5e1]'
                  }`}
                >
                  {trip.status === 'planned' ? (
                    <>
                      <Play className="w-5 h-5" />
                      Start Trip
                    </>
                  ) : (
                    <>
                      <MapIcon className="w-5 h-5" />
                      Track on Map
                    </>
                  )}
                </button>
              </article>
            ))
          )}
        </main>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
