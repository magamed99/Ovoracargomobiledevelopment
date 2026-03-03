import { useParams, useNavigate } from 'react-router';
import { 
  MapPin, 
  Star, 
  Users, 
  Package, 
  Calendar,
  MessageSquare, 
  Shield, 
  ArrowLeft,
  Share2,
  CheckCircle2,
  DollarSign,
  Truck,
  Phone,
  Wind,
  Ban
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export function TripDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();

  // Mock data based on code-4.html
  const trip = {
    id: 1,
    from: 'Khujand',
    to: 'St. Petersburg',
    date: 'Oct 24, 08:00 AM',
    distance: '4,200 km est.',
    images: [
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800&h=600&fit=crop',
    ],
    pricePerSeat: 500,
    currency: 'TJS',
    availableSeats: 4,
    cargoCapacity: 50,
    driver: {
      name: 'Farrukh S.',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
      rating: 4.9,
      trips: 120,
      verified: true,
    },
    description: 'Leaving early morning from Khujand center. I\'m an experienced driver with over 5 years of driving long distances.',
    detailedDescription: 'Comfortable Toyota Camry with AC and plenty of legroom. We will make stops for food and rest in Kazakhstan. No smoking allowed in the car.',
    amenities: [
      { icon: Wind, label: 'AC' },
      { icon: Ban, label: 'No Smoking' },
      { icon: Package, label: 'Big Trunk' },
    ],
  };

  return (
    <div className={`min-h-screen flex flex-col pb-24 font-['Sora'] ${
      theme === 'dark' ? 'bg-[#111821] text-white' : 'bg-[#f6f7f8] text-[#111618]'
    }`}>
      {/* Top App Bar */}
      <header className={`sticky top-0 z-50 backdrop-blur-sm px-4 py-3 flex items-center justify-between border-b ${
        theme === 'dark'
          ? 'bg-[#111821]/95 border-[#253840]'
          : 'bg-[#f6f7f8]/95 border-[#cbd5e1]'
      }`}>
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
        <h2 className="flex-1 text-center text-lg font-bold leading-tight tracking-tight truncate px-2">
          {trip.from} <span className="text-[#1978e5] mx-1">→</span> {trip.to}
        </h2>
        <button className={`flex size-10 items-center justify-center rounded-full transition-colors ${
          theme === 'dark'
            ? 'hover:bg-[#253840]'
            : 'hover:bg-[#e2e8f0]'
        }`}>
          <Share2 className="w-5 h-5" />
        </button>
      </header>

      {/* Route & Meta Section */}
      <section className="flex flex-col px-4 pt-6 pb-2">
        <h1 className={`text-[28px] font-extrabold leading-tight mb-2 ${
          theme === 'dark' ? 'text-white' : 'text-[#111618]'
        }`}>
          {trip.from} <span className="text-gray-400 font-normal text-2xl mx-1">to</span> {trip.to}
        </h1>
        <div className={`flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium ${
          theme === 'dark' ? 'text-gray-400' : 'text-[#60808a]'
        }`}>
          <div className="flex items-center gap-1">
            <Calendar className="w-[18px] h-[18px]" />
            <span>{trip.date}</span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="w-[18px] h-[18px]" />
            <span>{trip.distance}</span>
          </div>
        </div>
      </section>

      {/* Image Gallery (Carousel) */}
      <section className="mt-4 w-full overflow-hidden">
        <div className="flex overflow-x-auto gap-3 px-4 pb-4 scrollbar-hide snap-x snap-mandatory">
          {trip.images.map((image, index) => (
            <div key={index} className="flex-none w-[85%] sm:w-[300px] snap-center">
              <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden shadow-sm">
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url('${image}')` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Trip Specs Grid */}
      <section className="px-4 py-2">
        <div className="grid grid-cols-3 gap-3">
          {/* Price Card */}
          <div className={`flex flex-col items-center justify-center p-3 rounded-xl shadow-sm border ${
            theme === 'dark'
              ? 'bg-[#1a2c32] border-[#253840]'
              : 'bg-white border-[#e2e8f0]'
          }`}>
            <DollarSign className="w-6 h-6 text-[#1978e5] mb-1" />
            <span className={`text-sm font-bold ${
              theme === 'dark' ? 'text-white' : 'text-[#0f172a]'
            }`}>
              {trip.pricePerSeat} {trip.currency}
            </span>
            <span className={`text-xs ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              per seat
            </span>
          </div>
          {/* Seats Card */}
          <div className={`flex flex-col items-center justify-center p-3 rounded-xl shadow-sm border ${
            theme === 'dark'
              ? 'bg-[#1a2c32] border-[#253840]'
              : 'bg-white border-[#e2e8f0]'
          }`}>
            <Users className="w-6 h-6 text-[#1978e5] mb-1" />
            <span className={`text-sm font-bold ${
              theme === 'dark' ? 'text-white' : 'text-[#0f172a]'
            }`}>
              {trip.availableSeats} Seats
            </span>
            <span className="text-xs text-green-600 dark:text-green-400 font-medium">
              Available
            </span>
          </div>
          {/* Cargo Card */}
          <div className={`flex flex-col items-center justify-center p-3 rounded-xl shadow-sm border ${
            theme === 'dark'
              ? 'bg-[#1a2c32] border-[#253840]'
              : 'bg-white border-[#e2e8f0]'
          }`}>
            <Package className="w-6 h-6 text-[#1978e5] mb-1" />
            <span className={`text-sm font-bold ${
              theme === 'dark' ? 'text-white' : 'text-[#0f172a]'
            }`}>
              {trip.cargoCapacity}kg
            </span>
            <span className={`text-xs ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Max Cargo
            </span>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className={`h-px w-full my-4 ${
        theme === 'dark' ? 'bg-[#253840]' : 'bg-[#cbd5e1]'
      }`} />

      {/* Driver Profile */}
      <section className="px-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-bold ${
            theme === 'dark' ? 'text-white' : 'text-[#111618]'
          }`}>
            Driver
          </h3>
          <a className="text-sm font-medium text-[#1978e5] hover:underline cursor-pointer">
            View Profile
          </a>
        </div>
        <div className={`flex items-center gap-4 p-4 rounded-xl shadow-sm border ${
          theme === 'dark'
            ? 'bg-[#1a2c32] border-[#253840]'
            : 'bg-white border-[#e2e8f0]'
        }`}>
          <div className="relative shrink-0">
            <div
              className="h-14 w-14 rounded-full bg-cover bg-center border-2 shadow-sm"
              style={{
                backgroundImage: `url('${trip.driver.avatar}')`,
                borderColor: theme === 'dark' ? '#334155' : '#ffffff'
              }}
            />
            {trip.driver.verified && (
              <div className={`absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full shadow-sm ${
                theme === 'dark' ? 'bg-[#1a2c32]' : 'bg-white'
              }`}>
                <CheckCircle2 className="w-[18px] h-[18px] text-[#1978e5]" />
              </div>
            )}
          </div>
          <div className="flex flex-col flex-1">
            <div className="flex items-center gap-2">
              <span className={`text-base font-bold ${
                theme === 'dark' ? 'text-white' : 'text-[#111618]'
              }`}>
                {trip.driver.name}
              </span>
              {trip.driver.verified && (
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  theme === 'dark'
                    ? 'bg-green-900/30 text-green-400'
                    : 'bg-green-100 text-green-700'
                }`}>
                  VERIFIED
                </span>
              )}
            </div>
            <div className={`flex items-center gap-1 mt-1 text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-[#60808a]'
            }`}>
              <span className={`flex items-center font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-[#111618]'
              }`}>
                {trip.driver.rating} <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 ml-0.5" />
              </span>
              <span>•</span>
              <span>{trip.driver.trips} trips</span>
            </div>
          </div>
          <button
            onClick={() => navigate('/messages')}
            className={`flex items-center justify-center h-10 w-10 rounded-full transition-colors ${
              theme === 'dark'
                ? 'bg-[#1978e5]/10 text-[#1978e5] hover:bg-[#1978e5]/20'
                : 'bg-[#1978e5]/10 text-[#1978e5] hover:bg-[#1978e5]/20'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Divider */}
      <div className={`h-px w-full my-4 ${
        theme === 'dark' ? 'bg-[#253840]' : 'bg-[#cbd5e1]'
      }`} />

      {/* Trip Details / Description */}
      <section className="px-4 pb-4">
        <h3 className={`text-lg font-bold mb-3 ${
          theme === 'dark' ? 'text-white' : 'text-[#111618]'
        }`}>
          About the trip
        </h3>
        <div className={`text-base leading-relaxed space-y-4 ${
          theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
        }`}>
          <p>{trip.description}</p>
          <p>{trip.detailedDescription}</p>
          <div className="flex flex-wrap gap-2 mt-4">
            {trip.amenities.map((amenity, index) => {
              const Icon = amenity.icon;
              return (
                <span
                  key={index}
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                    theme === 'dark'
                      ? 'bg-[#253840] text-gray-300'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" /> {amenity.label}
                </span>
              );
            })}
          </div>
        </div>
      </section>

      {/* Sticky Bottom Action Bar */}
      <div className={`fixed bottom-0 left-0 right-0 border-t p-4 pb-8 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-40 ${
        theme === 'dark'
          ? 'bg-[#1a2c32] border-[#253840]'
          : 'bg-white border-[#cbd5e1]'
      }`}>
        <div className="flex items-center gap-4 max-w-md mx-auto">
          <div className="flex flex-col">
            <p className={`text-xs ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Total Price
            </p>
            <div className="flex items-baseline gap-1">
              <p className={`text-xl font-bold ${
                theme === 'dark' ? 'text-white' : 'text-[#111618]'
              }`}>
                {trip.pricePerSeat} {trip.currency}
              </p>
            </div>
          </div>
          <div className="flex flex-1 gap-3">
            <button
              onClick={() => navigate('/messages')}
              className={`flex-1 h-12 rounded-lg border font-bold transition-colors flex items-center justify-center gap-2 ${
                theme === 'dark'
                  ? 'border-gray-600 text-white hover:bg-[#253840]'
                  : 'border-gray-300 text-[#111618] hover:bg-gray-50'
              }`}
            >
              <MessageSquare className="w-5 h-5" />
              <span className="hidden sm:inline">Message</span>
            </button>
            <button className="flex-[2] h-12 rounded-lg bg-[#1978e5] font-bold text-white hover:bg-[#1565c0] transition-colors flex items-center justify-center shadow-lg shadow-[#1978e5]/30">
              Book Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
